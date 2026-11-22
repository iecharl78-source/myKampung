// SQLite adapter: same API as node:sqlite (DatabaseSync, backup) on every supported Node.js version.
// - Node.js 22.13+/24: uses the built-in node:sqlite module.
// - Node.js 20 (e.g. cPanel/CloudLinux shared hosting): uses node-sqlite3-wasm (SQLite compiled to
//   WebAssembly, no native build, no GLIBC requirement). WAL is not available there, so the
//   database runs in the default rollback-journal mode; keep a single application worker.
// Set SQLITE_DRIVER=wasm to force the WebAssembly driver (useful for testing on newer Node.js).
import { createRequire } from 'node:module';
import { closeSync, copyFileSync, existsSync, mkdtempSync, openSync, readSync, rmSync, statSync, unlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

let native = null;
if (process.env.SQLITE_DRIVER !== 'wasm') {
  try { native = await import('node:sqlite'); } catch { native = null; }
}

export const driver = native ? 'node:sqlite' : 'node-sqlite3-wasm';
export const supportsWal = Boolean(native);

let DatabaseSync, backup;

if (native) {
  ({ DatabaseSync, backup } = native);
} else {
  const { Database: WasmDatabase } = createRequire(import.meta.url)('node-sqlite3-wasm');
  const VALIDATED_LIMIT = 2000;

  const sqliteError = error => {
    if (error && typeof error === 'object' && error.name === 'SQLite3Error' && !error.code) {
      try { error.code = 'ERR_SQLITE_ERROR'; } catch {}
    }
    return error;
  };
  const guard = fn => { try { return fn(); } catch (error) { throw sqliteError(error); } };

  const isNamed = value => value !== null && typeof value === 'object' && !ArrayBuffer.isView(value) && !Array.isArray(value);
  const escape = text => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // node:sqlite accepts bare names ({id: 1} for :id / @id / $id); node-sqlite3-wasm needs the prefix.
  function bindValues(sql, args) {
    if (!args.length) return undefined;
    if (args.length === 1 && isNamed(args[0])) {
      const named = {};
      for (const [key, value] of Object.entries(args[0])) {
        if (/^[:@$]/.test(key)) { named[key] = value; continue; }
        const prefix = [':', '@', '$'].find(p => new RegExp(`${escape(p)}${escape(key)}(?![A-Za-z0-9_])`).test(sql)) || ':';
        named[prefix + key] = value;
      }
      return named;
    }
    return args;
  }

  // A WAL-mode file cannot be opened without shared memory, which the WASM build lacks.
  // SQLite can still read it in exclusive locking mode and convert it to rollback-journal mode.
  function isWalFile(file) {
    if (file === ':memory:' || !existsSync(file) || statSync(file).size < 100) return false;
    const header = Buffer.alloc(2), fd = openSync(file, 'r');
    try { readSync(fd, header, 0, 2, 18); } finally { closeSync(fd); }
    return header[0] === 2 || header[1] === 2;
  }
  function convertFromWal(file) {
    const db = new WasmDatabase(file);
    try { db.exec('PRAGMA locking_mode=EXCLUSIVE'); db.get('PRAGMA journal_mode=DELETE'); } finally { db.close(); }
    if (!existsSync(file + '-wal')) rmSync(file + '-shm', { force: true });
  }

  // Each call prepares, runs and finalizes its own statement (via node-sqlite3-wasm's Database
  // helpers), so no statement is ever left open holding a lock or leaking WASM memory.
  class Statement {
    #owner; #sql;
    constructor(owner, sql) { this.#owner = owner; this.#sql = sql; owner._validate(sql); }
    get sourceSQL() { return this.#sql; }
    #exec(method, args) { return guard(() => this.#owner._raw()[method](this.#sql, bindValues(this.#sql, args))); }
    run(...args) { return this.#exec('run', args); }
    get(...args) { const row = this.#exec('get', args); return row === null ? undefined : row; }
    all(...args) { return this.#exec('all', args); }
    *iterate(...args) { yield* this.all(...args); }
  }

  DatabaseSync = class DatabaseSync {
    #db; #validated = new Set(); #temporary = null;
    constructor(location, options = {}) {
      let file = location === ':memory:' ? location : resolve(String(location));
      const readOnly = Boolean(options.readOnly);
      if (isWalFile(file)) {
        if (readOnly) {
          // Never modify a file opened read-only: convert a private copy instead.
          this.#temporary = mkdtempSync(join(tmpdir(), 'sqlite-wasm-'));
          const copy = join(this.#temporary, 'copy.sqlite');
          copyFileSync(file, copy);
          if (existsSync(file + '-wal')) copyFileSync(file + '-wal', copy + '-wal');
          convertFromWal(copy);
          file = copy;
        } else {
          convertFromWal(file);
        }
      }
      this.#db = guard(() => new WasmDatabase(file, { readOnly }));
      // Without WAL, a writer is blocked while another process (e.g. the nightly backup) reads.
      // Wait for the lock instead of failing at once with "database is locked".
      const timeout = Number.isSafeInteger(options.timeout) && options.timeout >= 0 ? options.timeout : 5000;
      this.exec(`PRAGMA busy_timeout=${timeout}`);
      if (options.enableForeignKeyConstraints === false) this.exec('PRAGMA foreign_keys=OFF');
    }
    get isOpen() { return this.#db.isOpen; }
    get isTransaction() { return this.#db.inTransaction; }
    // node:sqlite reports SQL errors at prepare(); check each distinct SQL text once.
    _validate(sql) {
      if (!this.#db.isOpen) throw Object.assign(Error('database is not open'), { code: 'ERR_INVALID_STATE' });
      if (this.#validated.has(sql)) return;
      guard(() => this.#db.prepare(sql)).finalize();
      if (this.#validated.size >= VALIDATED_LIMIT) this.#validated.clear();
      this.#validated.add(sql);
    }
    _raw() {
      if (!this.#db.isOpen) throw Object.assign(Error('database is not open'), { code: 'ERR_INVALID_STATE' });
      return this.#db;
    }
    prepare(sql) { return new Statement(this, sql); }
    exec(sql) { guard(() => this._raw().exec(sql)); this.#validated.clear(); }
    close() {
      if (!this.#db.isOpen) throw Object.assign(Error('database is not open'), { code: 'ERR_INVALID_STATE' });
      this.#validated.clear();
      this.#db.close();
      if (this.#temporary) { rmSync(this.#temporary, { recursive: true, force: true }); this.#temporary = null; }
    }
  };

  // node:sqlite's backup() copies the database to a new file; VACUUM INTO does the same job here
  // and produces a compact, consistent, rollback-journal copy.
  backup = async (source, destination) => {
    const target = resolve(String(destination));
    if (existsSync(target)) unlinkSync(target);
    guard(() => source._raw().run('VACUUM INTO ?', [target]));
    return source.prepare('PRAGMA page_count').get().page_count;
  };
}

export { DatabaseSync, backup };
