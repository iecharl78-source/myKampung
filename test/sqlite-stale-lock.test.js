import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn, execFileSync } from 'node:child_process';
import { mkdtemp, rm, utimes, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';

// Runs only meaningfully with the WebAssembly driver (Node 20 hosting); every child forces it.
const adapter = new URL('../sqlite.js', import.meta.url).href;
const env = { ...process.env, SQLITE_DRIVER: 'wasm' };
const run = code => execFileSync(process.execPath, ['--input-type=module', '-e', code], { env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });

test('Kunci WASM yang ditinggalkan oleh proses yang dibunuh: kunci baharu dihormati, kunci basi dibuang tanpa kehilangan data', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'sqlite-stale-'));
  t.after(() => rm(dir, { recursive: true, force: true, maxRetries: 5 }));
  const file = join(dir, 'kampung.sqlite'), lock = `${file}.lock`;
  run(`import {DatabaseSync} from '${adapter}';const db=new DatabaseSync(${JSON.stringify(file)});db.exec("CREATE TABLE t(v TEXT);INSERT INTO t VALUES('asal')");db.close();`);

  // A process holds the lock in the middle of a write transaction and is then force-killed.
  const holder = spawn(process.execPath, ['--input-type=module', '-e', `import {DatabaseSync} from '${adapter}';const db=new DatabaseSync(${JSON.stringify(file)});db.exec('BEGIN');db.prepare("INSERT INTO t VALUES('belum disahkan')").run();console.log('locked');setInterval(()=>{},1000);`], { env, stdio: ['ignore', 'pipe', 'inherit'] });
  await new Promise((resolve, reject) => { holder.stdout.on('data', d => String(d).includes('locked') && resolve()); holder.once('exit', () => reject(Error('holder exited early'))); });
  const exited = once(holder, 'exit'); holder.kill('SIGKILL'); await exited;
  assert.ok((await stat(lock)).isDirectory(), 'direktori kunci ditinggalkan selepas proses dibunuh');

  // Fresh lock: still treated as busy, never removed (a live process may own it).
  assert.throws(() => run(`import {DatabaseSync} from '${adapter}';const db=new DatabaseSync(${JSON.stringify(file)},{timeout:200});db.prepare('SELECT count(*) n FROM t').get();`), /database is locked/);
  assert.ok((await stat(lock)).isDirectory(), 'kunci baharu tidak dibuang');

  // Abandoned lock (older than the stale limit): removed automatically, the unfinished write is rolled back.
  const old = new Date(Date.now() - 5 * 60 * 1000); await utimes(lock, old, old);
  const output = run(`import {DatabaseSync} from '${adapter}';const db=new DatabaseSync(${JSON.stringify(file)});console.log(JSON.stringify(db.prepare('SELECT v FROM t ORDER BY rowid').all().map(r=>r.v)));db.prepare("INSERT INTO t VALUES('selepas')").run();console.log(db.prepare('PRAGMA integrity_check').get().integrity_check);db.close();`);
  const [rows, integrity] = output.trim().split('\n');
  assert.deepEqual(JSON.parse(rows), ['asal']);
  assert.equal(integrity, 'ok');
  await assert.rejects(stat(lock), { code: 'ENOENT' });
});
