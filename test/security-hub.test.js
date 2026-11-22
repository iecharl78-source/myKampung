import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from '../sqlite.js';
import {randomBytes} from 'node:crypto';
import {spawn} from 'node:child_process';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {once} from 'node:events';
import {restoreFull} from '../scripts/restore-full.js';
import {base32,totp,matchingStep,activeSession,initializeSecurity,securityFailure,securityBlocked} from '../security.js';

test('TOTP RFC 6238, replay, jangka kod dan tamat sesi',()=>{
 const secret=base32(Buffer.from('12345678901234567890'));assert.equal(secret,'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ');
 for(const [time,expected] of [[59,'287082'],[1111111109,'081804'],[1111111111,'050471'],[1234567890,'005924'],[2000000000,'279037'],[20000000000,'353130']]){const step=Math.floor(time/30);assert.equal(totp(secret,step),expected);assert.equal(matchingStep(secret,expected,-1,time*1000),step);assert.equal(matchingStep(secret,expected,step,time*1000),null);}
 assert.equal(matchingStep(secret,'12345',-1,59000),null);assert.equal(matchingStep(secret,'287082',-1,180000),null);
 assert.equal(activeSession({expires:9000000,lastSeen:100},1800100),false);assert.equal(activeSession({expires:9000000,lastSeen:101},1800100),true);assert.equal(activeSession({expires:100,lastSeen:99},100),false);
});

test('Keselamatan 2FA, pemulihan sekali, sesi dan pusat tugasan dengan penugasan',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'kampung-security-')),password=randomBytes(16).toString('hex'),mfaKey=randomBytes(32).toString('hex');let child,db,activeDir=dir;
 async function start(){child=spawn(process.execPath,['server.js'],{cwd:new URL('../',import.meta.url),env:{...process.env,DATA_DIR:activeDir,PORT:'0',HOST:'127.0.0.1',ADMIN_PASSWORD:password,COOKIE_SECURE:'0',MFA_ENCRYPTION_KEY:mfaKey,TRUST_PROXY:'1'},stdio:['ignore','pipe','pipe']});return new Promise((resolve,reject)=>{let out='',err='';const t=setTimeout(()=>reject(Error(err||'Timeout')),10000);child.stderr.on('data',v=>err+=v);child.stdout.on('data',v=>{out+=v;const m=out.match(/port (\d+)/);if(m){clearTimeout(t);resolve(`http://127.0.0.1:${m[1]}`);}});child.on('exit',()=>{clearTimeout(t);reject(Error(err));});});}
 async function stop(){if(child?.exitCode===null){const p=once(child,'exit');child.kill();await p;}}
 try{
 let base=await start(),admin='';const req=(path,method='GET',data,cookie=admin,extra={})=>fetch(base+path,{method,headers:{Cookie:cookie,'Content-Type':'application/json',...extra},body:data===undefined?undefined:JSON.stringify(data)});
 const login=async (username='admin',code)=>{const r=await req('/api/login','POST',{username,password,code},'');assert.equal(r.status,200,await r.clone().text());return r.headers.get('set-cookie').split(';')[0];};
 admin=await login();const old=await login();
 assert.equal((await req('/api/security/status','GET',undefined,'')).status,401);
 assert.equal((await req('/api/security/sessions/revoke','POST',{currentPassword:'wrong',allOthers:true})).status,400);
 const pending=await (await req('/api/security/mfa/start','POST',{currentPassword:password})).json();assert.ok(pending.secret);assert.ok(pending.uri.startsWith('otpauth://'));
 db=new DatabaseSync(join(dir,'kampung.sqlite'));assert.ok(!db.prepare('SELECT secret FROM mfa_pending').get().secret.includes(pending.secret));
 const code=totp(pending.secret,Math.floor(Date.now()/30000));let r=await req('/api/security/mfa/confirm','POST',{currentPassword:password,code});assert.equal(r.status,200,await r.clone().text());const recovery=(await r.json()).recoveryCodes;assert.equal(recovery.length,10);
 assert.equal((await req('/api/session','GET',undefined,old)).status,401);
 assert.equal((await req('/api/login','POST',{username:'admin',password},'')).status,401);
 assert.equal((await req('/api/login','POST',{username:'admin',password,code},'')).status,401);
 const current=await login('admin',recovery[0]);assert.equal((await req('/api/login','POST',{username:'admin',password,code:recovery[0]},'')).status,401);
 const fresh=await login('admin',recovery[1]);assert.equal((await req('/api/security/sessions/revoke','POST',{currentPassword:password,allOthers:true},fresh)).status,200);
 assert.equal((await req('/api/session','GET',undefined,current)).status,401);admin=fresh;
 const status=await (await req('/api/security/status')).json();assert.equal(status.enabled,true);assert.equal(status.recoveryCodes,8);assert.equal(status.sessions.length,1);assert.ok(!JSON.stringify(status).includes(pending.secret));assert.ok(!db.prepare('SELECT hash FROM mfa_recovery LIMIT 1').get().hash.includes(recovery[2]));
 assert.equal((await req('/api/security/mfa/disable','POST',{currentPassword:password,code:'000'})).status,400);
 assert.equal((await req('/api/security/mfa/disable','POST',{currentPassword:password,code:recovery[2]})).status,200);
 assert.equal((await (await req('/api/security/status')).json()).enabled,false);
 // Hub hanya pentadbir; tugasan tidak mendedahkan isi profil atau kebenaran tambahan.
 for(const [username,role] of [['pegawai','admin'],['petugas','petugas'],['rateuser','petugas']])assert.equal((await req('/api/users','POST',{username,fullName:username,role,password})).status,201);
 const staff=await login('petugas');assert.equal((await req('/api/tasks','GET',undefined,staff)).status,403);
 const member={name:'Pemohon Ujian',phone:'0123456789',address1:'Rumah',employmentStatus:'Tidak bekerja',household:[]};
 r=await req('/api/registrations','POST',{username:'ahlibaru',password,consent:true,submissionKey:randomBytes(32).toString('hex'),data:member},'');assert.equal(r.status,201,await r.clone().text());
 const raw=db.prepare('SELECT id FROM registrations').get();db.prepare('UPDATE registrations SET createdAt=? WHERE id=?').run('2026-01-01T00:00:00.000Z',raw.id);
 let tasks=await (await req('/api/tasks')).json(),task=tasks.rows.find(t=>t.kind==='registrations');assert.ok(task.overdue);assert.equal(task.name,'Pemohon Ujian');assert.equal(task.data,undefined);
 const officer=db.prepare("SELECT id FROM users WHERE username='pegawai'").get().id,staffId=db.prepare("SELECT id FROM users WHERE username='petugas'").get().id;
 const assign={assigneeId:officer,note:'Sila semak dokumen',expectedUpdatedAt:''};
 assert.equal((await req(`/api/tasks/registrations/${task.id}/assign`,'POST',{...assign,assigneeId:staffId})).status,400);
 assert.equal((await req(`/api/tasks/registrations/${task.id}/assign`,'POST',assign,staff)).status,403);
 assert.equal((await req(`/api/tasks/registrations/${task.id}/assign`,'POST',assign)).status,200);
 assert.equal((await req(`/api/tasks/registrations/${task.id}/assign`,'POST',assign)).status,409);
 task=(await (await req('/api/tasks')).json()).rows.find(t=>t.kind==='registrations');assert.equal(task.assigneeName,'pegawai');
 assert.equal(db.prepare("SELECT count(*) n FROM notifications WHERE userId=? AND title='Tugasan baharu untuk semakan'").get(officer).n,1);
 db.prepare("UPDATE registrations SET status='rejected' WHERE id=?").run(task.id);assert.equal((await (await req('/api/tasks')).json()).rows.length,0);assert.equal((await req(`/api/tasks/registrations/${task.id}/assign`,'POST',{...assign,expectedUpdatedAt:task.assignmentUpdatedAt})).status,409);
 assert.equal((await req('/api/login','POST',{username:'admin',password},'',{'Sec-Fetch-Site':'cross-site'})).status,403);
 // MFA kekal selepas pemulihan sandaran, dengan kunci penyulitan asal.
 const again=await (await req('/api/security/mfa/start','POST',{currentPassword:password})).json();
 r=await req('/api/security/mfa/confirm','POST',{currentPassword:password,code:totp(again.secret,Math.floor(Date.now()/30000))});assert.equal(r.status,200);const againCodes=(await r.json()).recoveryCodes;
 // Kunci percubaan mengikut akaun kekal walaupun IP berubah dan pelayan dimulakan semula.
 for(let i=0;i<10;i++)assert.equal((await req('/api/login','POST',{username:'rateuser',password:'wrong'},'',{'x-real-ip':'192.0.2.'+(i+1)})).status,401);
 assert.equal((await req('/api/login','POST',{username:'rateuser',password},'',{'x-real-ip':'192.0.2.99'})).status,429);
 r=await req('/api/backup/full','POST',{currentPassword:password});assert.equal(r.status,200);const backupPath=join(dir,'full.sqlite');await writeFile(backupPath,Buffer.from(await r.arrayBuffer()));await stop();activeDir=await restoreFull({source:backupPath,destination:join(dir,'restored')});base=await start();admin=await login('admin',againCodes[0]);assert.equal((await (await req('/api/security/status')).json()).enabled,true);assert.equal((await req('/api/login','POST',{username:'rateuser',password},'')).status,429);
 // Had keselamatan matang selepas 15 minit.
 securityFailure(db,'test-clock',1000);assert.equal(securityBlocked(db,'test-clock',1,1001),true);assert.equal(securityBlocked(db,'test-clock',1,901000),false);
 }finally{db?.close();await stop();await rm(dir,{recursive:true,force:true});}
});
