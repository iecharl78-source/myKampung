import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {once} from 'node:events';
import {DatabaseSync} from 'node:sqlite';
import {validateBurialPermit,initializeBurialPermits,storeBurialPermit,burialPermitRoutes} from '../burial-permits.js';
import {restoreFull} from '../scripts/restore-full.js';
const pdf={fileName:'permit.pdf',mimeType:'application/pdf',base64:Buffer.from('%PDF-1.4\nPermit kubur\n%%EOF').toString('base64')};
test('Permit kubur: sahkan jenis/saiz/nama; migrasi berulang mengekalkan dokumen',()=>{
 assert.equal(validateBurialPermit(pdf).byteLength,Buffer.from(pdf.base64,'base64').length);
 for(const bad of [null,{...pdf,fileName:'../permit.pdf'},{...pdf,fileName:'permit.exe'},{...pdf,mimeType:'image/png'},{...pdf,base64:'AAAA'},{...pdf,base64:''},{...pdf,base64:Buffer.alloc(5*1024*1024+1).toString('base64')}])assert.throws(()=>validateBurialPermit(bad),/permit kubur/);
 for(const [fileName,mimeType,bytes] of [['permit.png','image/png',[137,80,78,71,13,10,26,10]],['permit.jpg','image/jpeg',[255,216,255]]])assert.equal(validateBurialPermit({fileName,mimeType,base64:Buffer.from(bytes).toString('base64')}).mimeType,mimeType);
 const db=new DatabaseSync(':memory:');try{db.exec('CREATE TABLE death_records(id INTEGER PRIMARY KEY); CREATE TABLE users(id INTEGER PRIMARY KEY)');initializeBurialPermits(db);db.exec('INSERT INTO death_records VALUES(1); INSERT INTO users VALUES(1)');storeBurialPermit(db,1,validateBurialPermit(pdf),{id:1});initializeBurialPermits(db);assert.equal(db.prepare('SELECT count(*) n FROM death_burial_permits').get().n,1);assert.equal(Buffer.from(db.prepare('SELECT data FROM death_burial_permits').get().data).toString('base64'),pdf.base64);}finally{db.close();}
});
test('Permit kubur: dokumen berasingan, skop akses, tambah kemudian, audit, rollback, saiz maksimum dan pemulihan',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'burial-permits-')),password=randomBytes(16).toString('hex');let child,db;
 async function start(){child=spawn(process.execPath,['server.js'],{cwd:new URL('../',import.meta.url),env:{...process.env,DATA_DIR:dir,PORT:'0',HOST:'127.0.0.1',ADMIN_PASSWORD:password,COOKIE_SECURE:'0',MFA_ENCRYPTION_KEY:''},stdio:['ignore','pipe','pipe']});return new Promise((resolve,reject)=>{let out='',err='';const timer=setTimeout(()=>reject(Error(err||'Timeout')),10000);child.stderr.on('data',v=>err+=v);child.stdout.on('data',v=>{out+=v;const m=out.match(/port (\d+)/);if(m){clearTimeout(timer);resolve('http://127.0.0.1:'+m[1]);}});child.on('exit',()=>{clearTimeout(timer);reject(Error(err));});});}
 async function stop(){if(child?.exitCode===null){const p=once(child,'exit');child.kill();await p;}}
 try{
 let base=await start(),admin='';const req=(path,method='GET',data,cookie=admin)=>fetch(base+path,{method,headers:{Cookie:cookie,'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});
 const login=async username=>{const r=await req('/api/login','POST',{username,password},'');assert.equal(r.status,200);return r.headers.get('set-cookie').split(';')[0];};admin=await login('admin');
 const m=await req('/api/members','POST',{name:'Ketua Permit',phone:'0123456789',address1:'Rumah',household:Array.from({length:5},(_,i)=>({name:'Keluarga '+i,relationship:'Lain-lain',employmentStatus:'Tidak bekerja',livesWithMember:'Ya'}))});assert.equal(m.status,201);const memberId=(await m.json()).id;
 const otherId=(await (await req('/api/members','POST',{name:'Rumah Lain',phone:'0198765432',address1:'Lain',household:[]})).json()).id;
 for(const [username,role,id] of [['owner','ahli',memberId],['other','ahli',otherId],['staff','petugas',null]])assert.equal((await req('/api/users','POST',{username,fullName:username,role,memberId:id,password})).status,201);
 let owner=await login('owner'),other=await login('other'),staff=await login('staff');const people=(await (await req('/api/deaths/context/'+memberId)).json()).people.slice(1),record=i=>({memberId,personKey:people[i].personKey,deathDate:'2026-01-01',reporterName:'Waris Ujian',reporterRelationship:'Anak',note:'Ujian permit',confirm:true,burialZone:'Zon A'});
 const cert={...pdf,fileName:'sijil.pdf',base64:Buffer.from('%PDF-1.4\nSijil kematian\n%%EOF').toString('base64')};
 assert.equal((await req('/api/deaths','POST',{...record(0),certificate:cert,burialPermit:{...pdf,fileName:'bad.exe'}},owner)).status,400);assert.equal((await (await req('/api/deaths')).json()).length,0);
 const ids=[];for(let i=0;i<4;i++){const r=await req('/api/deaths','POST',{...record(i),...(i===0?{certificate:cert,burialPermit:pdf}:{})},owner);assert.equal(r.status,202,await r.clone().text());ids.push((await r.json()).id);}
 const path=i=>`/api/deaths/${ids[i]}/burial-permit`;db=new DatabaseSync(join(dir,'kampung.sqlite'));const before=db.prepare('SELECT * FROM death_records WHERE id=?').get(ids[1]);
 const ownerAccount=db.prepare("SELECT * FROM users WHERE username='owner'").get();let status;await burialPermitRoutes({req:{method:'POST'},res:{},path:path(1),user:ownerAccount,db,json:(_res,code)=>status=code,body:async()=>({burialPermit:pdf}),isSessionActive:()=>false});assert.equal(status,401);assert.equal(db.prepare('SELECT * FROM death_burial_permits WHERE deathRecordId=?').get(ids[1]),undefined);
 assert.equal((await req(path(0),'GET',undefined,'')).status,401);assert.equal((await req(path(0),'GET',undefined,other)).status,403);assert.equal((await req(path(1),'POST',{burialPermit:pdf},other)).status,403);assert.equal((await req('/api/deaths/99999/burial-permit')).status,404);assert.equal((await req(path(1))).status,404);assert.equal((await req(path(0),'DELETE')).status,405);
 for(const cookie of [owner,staff,admin]){const r=await req(path(0),'GET',undefined,cookie);assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'no-store');assert.match(r.headers.get('content-disposition'),/permit-kubur/);assert.equal(Buffer.from(await r.arrayBuffer()).toString('base64'),pdf.base64);}
 assert.equal(Buffer.from(await (await req(`/api/deaths/${ids[0]}/certificate`)).arrayBuffer()).toString('base64'),cert.base64);
 const list=await (await req('/api/deaths','GET',undefined,owner)).json();assert.equal(list[0].burialPermitName,null);assert.equal(list.find(r=>r.id===ids[0]).burialPermitName,'permit.pdf');assert.equal(JSON.stringify(list).includes(pdf.base64),false);
 assert.equal((await req(path(0),'POST',{burialPermit:pdf},owner)).status,409);
 db.exec("CREATE TRIGGER fail_permit BEFORE INSERT ON audit_log BEGIN SELECT RAISE(ABORT,'rollback permit'); END");assert.equal((await req(path(1),'POST',{burialPermit:pdf},owner)).status,400);assert.equal(db.prepare('SELECT * FROM death_burial_permits WHERE deathRecordId=?').get(ids[1]),undefined);db.exec('DROP TRIGGER fail_permit');
 assert.equal((await req(path(1),'POST',{burialPermit:pdf},owner)).status,200);assert.deepEqual(db.prepare('SELECT * FROM death_records WHERE id=?').get(ids[1]),before);
 const approve={decision:'approve',reviewNote:'Disahkan',currentPassword:password,confirm:true};assert.equal((await req(`/api/deaths/${ids[2]}/review`,'POST',approve)).status,200);assert.equal((await req(path(2),'POST',{burialPermit:pdf},staff)).status,200);
 assert.equal((await req(`/api/deaths/${ids[3]}/review`,'POST',{decision:'reject',reviewNote:'Tidak tepat'})).status,200);assert.equal((await req(path(3),'POST',{burialPermit:pdf},owner)).status,409);
 assert.ok(db.prepare("SELECT count(*) n FROM audit_log WHERE action='Lampir permit kubur'").get().n>=2);
 // Two independent 5 MiB documents fit in a single JSON submission.
 const bytes=Buffer.alloc(5*1024*1024,32);bytes.write('%PDF-1.4');const large={...pdf,base64:bytes.toString('base64')};assert.equal((await req('/api/deaths','POST',{...record(4),certificate:{...large,fileName:'large-sijil.pdf'},burialPermit:{...large,fileName:'large-permit.pdf'}},owner)).status,202);
 const access=await (await req('/api/access-settings?role=ahli')).json();assert.equal((await req('/api/access-settings?role=ahli','PUT',{modules:{...access.modules,deaths:false},expectedUpdatedAt:access.updatedAt,currentPassword:password})).status,200);assert.equal((await req(path(0),'GET',undefined,owner)).status,403);
 await stop();base=await start();admin=await login('admin');assert.equal((await req(path(0))).status,200);const backup=await req('/api/backup/full','POST',{currentPassword:password});assert.equal(backup.status,200);const file=join(dir,'backup.sqlite');await writeFile(file,Buffer.from(await backup.arrayBuffer()));const restored=join(dir,'restored');await restoreFull({source:file,destination:restored});const copy=new DatabaseSync(join(restored,'kampung.sqlite'),{readOnly:true});try{assert.equal(copy.prepare('SELECT count(*) n FROM death_burial_permits').get().n,4);assert.equal(Buffer.from(copy.prepare('SELECT data FROM death_burial_permits WHERE deathRecordId=?').get(ids[0]).data).toString('base64'),pdf.base64);assert.equal(copy.prepare('SELECT count(*) n FROM death_documents').get().n,2);assert.equal(copy.prepare('PRAGMA foreign_key_check').all().length,0);}finally{copy.close();}
 }finally{db?.close();await stop();await rm(dir,{recursive:true,force:true});}
});
