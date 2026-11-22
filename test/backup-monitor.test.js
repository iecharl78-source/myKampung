import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from '../sqlite.js';
import {mkdtemp,mkdir,rm,readFile,writeFile,unlink,symlink,lstat,readdir,utimes} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawn,spawnSync} from 'node:child_process';
import {once} from 'node:events';
import {randomBytes} from 'node:crypto';
import {fullBackup} from '../scripts/backup-full.js';
import {readBackupStatus,writeBackupStatus} from '../scripts/backup-status.js';
async function fixture(t){const root=await mkdtemp(join(tmpdir(),'backup-monitor-'));t.after(()=>rm(root,{recursive:true,force:true}));const dataDir=join(root,'data'),directory=join(root,'archives');await mkdir(dataDir);const db=new DatabaseSync(join(dataDir,'kampung.sqlite'));db.exec('CREATE TABLE sample(id INTEGER PRIMARY KEY); INSERT INTO sample VALUES(1)');db.close();return {root,dataDir,directory};}
test('Status membezakan sandaran sah, lewat, hilang, berubah, pautan dan status rosak',async t=>{
 const {root,dataDir,directory}=await fixture(t),read=opts=>readBackupStatus({directory,...opts});
 assert.equal((await read()).state,'missing');const file=await fullBackup({dataDir,backupDir:directory});const initial=await read();assert.equal(initial.state,'current');assert.equal(initial.lastSuccess.available,true);assert.equal((await lstat(join(directory,'.backup-status.json'))).mode&0o777,0o600);
 assert.equal((await read({now:Date.parse(initial.lastSuccess.at)+25*3600000})).state,'overdue');assert.equal((await read({intervalHours:0})).state,'configuration');assert.equal((await read({now:Date.parse(initial.lastSuccess.at)-600000})).state,'invalid');
 const original=await readFile(file),manifest=await readFile(join(directory,'.backup-status.json'));
 await utimes(file,new Date(),new Date(Date.now()+10000));assert.equal((await read()).state,'changed_file');await unlink(file);assert.equal((await read()).state,'missing_file');
 const other=join(root,'other.sqlite');await writeFile(other,original);await symlink(other,file);assert.equal((await read()).state,'changed_file');await unlink(file);
 await writeFile(join(directory,'.backup-status.json'),'{');assert.equal((await read()).state,'invalid');const tampered=JSON.parse(manifest);tampered.lastSuccess.fileName='../other.sqlite';await writeFile(join(directory,'.backup-status.json'),JSON.stringify(tampered));assert.equal((await read()).state,'invalid');
 await unlink(join(directory,'.backup-status.json'));await writeFile(file,original);assert.equal((await read()).state,'legacy');assert.equal((await readdir(directory)).some(n=>n.endsWith('.partial')),false);
});
test('Gagal direkodkan walaupun sandaran lama masih baharu; muat turun tidak menghasilkan status pelayan',async t=>{
 const {root,dataDir,directory}=await fixture(t);await fullBackup({dataDir,backupDir:directory});const good=await readBackupStatus({directory});
 await assert.rejects(fullBackup({dataDir:join(root,'missing'),backupDir:directory}));const failed=await readBackupStatus({directory});assert.equal(failed.state,'failed');assert.equal(failed.lastSuccess.fileName,good.lastSuccess.fileName);assert.equal(failed.lastSuccess.unchanged,true);
 const health=spawnSync(process.execPath,['scripts/backup-health.js'],{cwd:new URL('../',import.meta.url),env:{...process.env,BACKUP_DIR:directory}});assert.equal(health.status,1);
 const saved=await readFile(join(directory,'.backup-status.json'));await fullBackup({dataDir,backupDir:join(root,'download'),recordStatus:false});assert.deepEqual(await readFile(join(directory,'.backup-status.json')),saved);assert.deepEqual((await readdir(join(root,'download'))).filter(n=>n.startsWith('.')),[]);
 await fullBackup({dataDir,backupDir:directory,keep:1});assert.equal((await readBackupStatus({directory})).state,'current');assert.equal((await readBackupStatus({directory})).retainedFiles,1);assert.equal(spawnSync(process.execPath,['scripts/backup-health.js'],{cwd:new URL('../',import.meta.url),env:{...process.env,BACKUP_DIR:directory}}).status,0);
 await writeBackupStatus(directory,{status:'failed',error:{code:'PRIVATE_PATH /secret'}});const safe=await readBackupStatus({directory});assert.equal(safe.lastAttempt.failureCode,'BACKUP_FAILED');assert.equal(JSON.stringify(safe).includes('/secret'),false);
});
test('Pengesahan menolak salinan dengan hubungan asing rosak',async t=>{
 const {dataDir,directory}=await fixture(t);const db=new DatabaseSync(join(dataDir,'kampung.sqlite'));db.exec('PRAGMA foreign_keys=OFF; CREATE TABLE child(parent INTEGER REFERENCES sample(id)); INSERT INTO child VALUES(999)');db.close();await assert.rejects(fullBackup({dataDir,backupDir:directory}),/Semakan/);assert.equal((await readBackupStatus({directory})).state,'failed');assert.equal((await readBackupStatus({directory})).lastSuccess,null);assert.equal((await readdir(directory)).some(n=>n.endsWith('.partial')||n.endsWith('.sqlite')),false);
});
test('API: pentadbir sahaja; muat turun diasingkan daripada sandaran kekal',async t=>{
 const root=await mkdtemp(join(tmpdir(),'backup-api-')),directory=join(root,'archives'),dataDir=join(root,'data'),password=randomBytes(16).toString('hex');const child=spawn(process.execPath,['server.js'],{cwd:new URL('../',import.meta.url),env:{...process.env,HOST:'127.0.0.1',PORT:'0',DATA_DIR:dataDir,BACKUP_DIR:directory,ADMIN_PASSWORD:password,COOKIE_SECURE:'0',MFA_ENCRYPTION_KEY:''},stdio:['ignore','pipe','pipe']});
 t.after(async()=>{if(child.exitCode===null){const done=once(child,'exit');child.kill();await done;}await rm(root,{recursive:true,force:true});});
 const base=await new Promise((resolve,reject)=>{let out='',err='';const timer=setTimeout(()=>reject(Error(err||'Timeout')),10000);child.stderr.on('data',v=>err+=v);child.stdout.on('data',v=>{out+=v;const m=out.match(/port (\d+)/);if(m){clearTimeout(timer);resolve('http://127.0.0.1:'+m[1]);}});child.on('exit',()=>{clearTimeout(timer);reject(Error(err));});});
 let cookie='';const req=(path,method='GET',body,c=cookie)=>fetch(base+path,{method,headers:{Cookie:c,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});
 assert.equal((await req('/api/backup/status')).status,401);const login=await req('/api/login','POST',{password});cookie=login.headers.get('set-cookie').split(';')[0];assert.equal((await req('/api/backup/status','POST',{})).status,405);assert.equal((await (await req('/api/backup/status')).json()).state,'missing');
 for(const role of ['petugas','ahli']){let memberId;if(role==='ahli')memberId=(await (await req('/api/members','POST',{name:'Ahli Ujian',phone:'0123456789',address1:'Rumah',employmentStatus:'Bekerja',household:[]})).json()).id;assert.equal((await req('/api/users','POST',{username:role,fullName:role,role,memberId,password})).status,201);const r=await req('/api/login','POST',{username:role,password});assert.equal((await req('/api/backup/status','GET',undefined,r.headers.get('set-cookie').split(';')[0])).status,403);}
 await fullBackup({dataDir,backupDir:directory});let status=await (await req('/api/backup/status')).json();assert.equal(status.state,'current');assert.equal(status.lastDownloadPreparedAt,null);assert.equal(JSON.stringify(status).includes(root),false);
 const state=await readFile(join(directory,'.backup-status.json'));const downloaded=await req('/api/backup/full','POST',{currentPassword:password});assert.equal(downloaded.status,200);assert.ok((await downloaded.arrayBuffer()).byteLength>0);assert.deepEqual(await readFile(join(directory,'.backup-status.json')),state);status=await (await req('/api/backup/status')).json();assert.ok(status.lastDownloadPreparedAt);assert.equal(status.state,'current');
});
