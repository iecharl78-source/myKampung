import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {mkdtemp,rm,writeFile,readFile,access} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {once} from 'node:events';
import {restoreFull} from '../scripts/restore-full.js';
function start(data,password){
 const child=spawn(process.execPath,['server.js'],{cwd:new URL('../',import.meta.url),env:{...process.env,HOST:'127.0.0.1',PORT:'0',DATA_DIR:data,ADMIN_PASSWORD:password,COOKIE_SECURE:'0'},stdio:['ignore','pipe','pipe']});
 const ready=new Promise((resolve,reject)=>{let out='',err='';const timer=setTimeout(()=>reject(Error(err||'Timeout')),10000);child.stderr.on('data',v=>err+=v);child.stdout.on('data',v=>{out+=v;const m=out.match(/port (\d+)/);if(m){clearTimeout(timer);resolve(`http://127.0.0.1:${m[1]}`);}});child.on('exit',()=>{clearTimeout(timer);reject(Error(err));});});return {child,ready};
}
async function stop(child){if(child.exitCode===null){const exit=once(child,'exit');child.kill();await exit;}}
test('Sandaran penuh: pentadbir sahaja, kata laluan, data portal lengkap dan pemulihan ke pemasangan baharu',async()=>{
 const root=await mkdtemp(join(tmpdir(),'kampung-full-test-')),password=randomBytes(16).toString('hex'),server=start(root,password);let restored;
 try{
  const base=await server.ready;let admin='';const req=(path,method='GET',data,cookie=admin)=>fetch(base+path,{method,headers:{Cookie:cookie,'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});
  assert.equal((await req('/api/backup/full','POST',{currentPassword:password})).status,401);
  let r=await req('/api/login','POST',{password});admin=r.headers.get('set-cookie').split(';')[0];
  assert.equal((await req('/api/backup/full')).status,405);assert.equal((await req('/api/backup/full','POST',{currentPassword:'wrong'})).status,400);
  await req('/api/users','POST',{username:'backupstaff',fullName:'Petugas',role:'petugas',password});r=await req('/api/login','POST',{username:'backupstaff',password});const staff=r.headers.get('set-cookie').split(';')[0];assert.equal((await req('/api/backup/full','POST',{currentPassword:password},staff)).status,403);
  r=await req('/api/members','POST',{name:'Ahli Sandaran',phone:'0123456789',address1:'Alamat ujian',employmentStatus:'Bekerja',household:[]});const memberId=(await r.json()).id;
  await req('/api/users','POST',{username:'backupmember',fullName:'Ahli Sandaran',role:'ahli',memberId,password});r=await req('/api/login','POST',{username:'backupmember',password});const member=r.headers.get('set-cookie').split(';')[0];assert.equal((await req('/api/backup/full','POST',{currentPassword:password},member)).status,403);
  const profile=await (await req('/api/portal/profile','GET',undefined,member)).json();await req('/api/portal/profile','PUT',{...profile,address1:'Alamat dicadangkan',expectedUpdatedAt:profile.updatedAt},member);
  await req('/api/aid-requests','POST',{title:'Bantuan dicadangkan',category:'Makanan',provider:'Agensi',recipientKind:'ahli',receivedDate:'2026-01-01',quantity:'1',unit:'pek'},member);
  await req('/api/questions','POST',{subject:'Soalan sandaran',body:'Mesej peribadi ujian'},member);await req('/api/announcements','POST',{title:'Hebahan ujian',body:'Butiran',published:1});
  r=await req('/api/backup/full','POST',{currentPassword:password});assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/sqlite/);assert.match(r.headers.get('content-disposition'),/attachment; filename="kampung-full-.*\.sqlite"/);
  const file=join(root,'download.sqlite'),bytes=Buffer.from(await r.arrayBuffer());assert.equal(bytes.subarray(0,16).toString(),'SQLite format 3\0');await writeFile(file,bytes);
  const destination=join(root,'recovered');await restoreFull({source:file,destination});
  const copy=new DatabaseSync(join(destination,'kampung.sqlite'),{readOnly:true});try{
   assert.equal(copy.prepare('PRAGMA quick_check').get().quick_check,'ok');assert.equal(copy.prepare('PRAGMA foreign_key_check').all().length,0);
   for(const table of ['users','members','profile_requests','aid_requests','questions','question_messages','announcements','notifications','audit_log'])assert.ok(copy.prepare(`SELECT count(*) n FROM ${table}`).get().n>0,table);
   assert.equal(copy.prepare('SELECT body FROM question_messages LIMIT 1').get().body,'Mesej peribadi ujian');assert.equal(copy.prepare('SELECT address1 FROM members').get().address1,'Alamat ujian');
  }finally{copy.close();}
  await assert.rejects(restoreFull({source:file,destination}),/sudah wujud/);
  const bad=join(root,'bad.sqlite'),db=new DatabaseSync(bad);db.exec('CREATE TABLE unrelated(id INTEGER)');db.close();const rejected=join(root,'rejected');await assert.rejects(restoreFull({source:bad,destination:rejected}),/bukan sandaran penuh/);await assert.rejects(access(rejected));
  restored=start(destination,randomBytes(16).toString('hex'));const second=await restored.ready;
  r=await fetch(second+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'backupmember',password})});assert.equal(r.status,200);const cookie=r.headers.get('set-cookie').split(';')[0];
  assert.equal((await (await fetch(second+'/api/profile-requests',{headers:{Cookie:cookie}})).json()).length,1);
  assert.equal((await (await fetch(second+'/api/questions',{headers:{Cookie:cookie}})).json())[0].subject,'Soalan sandaran');
  r=await fetch(second+'/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:'admin',password})});assert.equal(r.status,200);
  assert.deepEqual(await readFile(file),bytes);assert.equal((await req('/api/session')).status,200);assert.equal((await (await req('/api/members')).json())[0].address1,'Alamat ujian');
 }finally{if(restored)await stop(restored.child);await stop(server.child);await rm(root,{recursive:true,force:true});}
});
