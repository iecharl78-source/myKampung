import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeAccounts } from '../accounts.js';

process.umask(0o077);
const data=process.env.DATA_DIR || fileURLToPath(new URL('../data/',import.meta.url));
mkdirSync(data,{recursive:true,mode:0o700});
const db=new DatabaseSync(join(data,'kampung.sqlite'));
try {
  const existing=db.prepare("SELECT name FROM sqlite_master WHERE name IN ('admin','users')").all();
  if(!existing.length && !process.env.ADMIN_PASSWORD) throw Error('Tetapkan ADMIN_PASSWORD hanya untuk arahan penciptaan akaun pertama.');
  initializeAccounts(db,process.env.ADMIN_PASSWORD);
  if(!db.prepare("SELECT id FROM users WHERE role='admin' AND isActive=1 LIMIT 1").get()) throw Error('Tiada pentadbir aktif tersedia.');
  console.log('Akaun pentadbir tersedia. Kata laluan sedia ada dikekalkan jika akaun telah wujud.');
} finally { db.close(); }
