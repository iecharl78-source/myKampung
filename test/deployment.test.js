import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtemp,rm,readdir,stat,writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { runtimeConfig,clientAddress } from '../runtime-config.js';
import { fullBackup } from '../scripts/backup-full.js';

test('Production memerlukan HTTPS dan kuki selamat; alamat proxy hanya dipercayai jika dibenarkan',()=>{
  assert.throws(()=>runtimeConfig({NODE_ENV:'production'}),/Production/);
  assert.throws(()=>runtimeConfig({PUBLIC_ORIGIN:'http://example.com'}),/HTTPS/);
  assert.throws(()=>runtimeConfig({PUBLIC_ORIGIN:'https://example.com/path'}),/HTTPS/);
  const config=runtimeConfig({NODE_ENV:'production',PUBLIC_ORIGIN:'https://kampung.example.com',COOKIE_SECURE:'1',TRUST_PROXY:'1'});
  assert.equal(config.publicOrigin,'https://kampung.example.com');
  const req={headers:{'x-real-ip':'203.0.113.10','x-forwarded-for':'spoofed'},socket:{remoteAddress:'127.0.0.1'}};
  assert.equal(clientAddress(req,config),'203.0.113.10');assert.equal(clientAddress(req,runtimeConfig({})),'127.0.0.1');
  assert.equal(clientAddress({...req,headers:{'x-real-ip':'spoofed,1.2.3.4'}},config),'127.0.0.1');
});

test('Sandaran penuh konsisten ketika SQLite masih terbuka, disahkan dan putaran hanya membuang fail sendiri',async()=>{
  const root=await mkdtemp(join(tmpdir(),'kampung-deploy-')),backupDir=join(root,'backup');
  const db=new DatabaseSync(join(root,'kampung.sqlite'));
  const oldMask=process.umask();
  try {
    db.exec("PRAGMA journal_mode=WAL;CREATE TABLE private_data (id INTEGER PRIMARY KEY,value TEXT);INSERT INTO private_data VALUES(1,'Data ujian sahaja');");
    const path=await fullBackup({dataDir:root,backupDir,keep:2});
    assert.equal((await stat(path)).mode&0o777,0o600);
    const copy=new DatabaseSync(path,{readOnly:true});try {assert.equal(copy.prepare('SELECT value FROM private_data').get().value,'Data ujian sahaja');}finally{copy.close();}
    await writeFile(join(backupDir,'manual.sqlite'),'Jangan padam');
    await fullBackup({dataDir:root,backupDir,keep:2});await fullBackup({dataDir:root,backupDir,keep:2});
    const files=await readdir(backupDir);assert.equal(files.filter(name=>name.startsWith('kampung-full-')).length,2);assert.ok(files.includes('manual.sqlite'));assert.equal(files.some(name=>name.endsWith('.partial')),false);
    await assert.rejects(fullBackup({dataDir:root,backupDir,keep:0}));
    assert.equal(db.prepare('SELECT count(*) AS n FROM private_data').get().n,1);
  } finally {process.umask(oldMask);db.close();await rm(root,{recursive:true,force:true});}
});
