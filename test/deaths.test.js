import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {once} from 'node:events';
import {DatabaseSync} from 'node:sqlite';
import {todayInMalaysia} from '../public/age.js';
import {initializeDeaths,reporterFields} from '../deaths.js';
import {familyIdentity} from '../family-identities.js';

test('Maklumat perkuburan: migrasi rekod lama selamat diulang dan medan baharu kosong',()=>{
 const db=new DatabaseSync(':memory:');try{db.exec("CREATE TABLE users(id INTEGER PRIMARY KEY);CREATE TABLE death_records(id INTEGER PRIMARY KEY,personKey TEXT,status TEXT,personName TEXT);INSERT INTO death_records VALUES(1,'lama','approved','Rekod Lama');");initializeDeaths(db);initializeDeaths(db);const row=db.prepare('SELECT * FROM death_records').get();assert.equal(row.personName,'Rekod Lama');assert.equal(row.status,'approved');assert.equal(row.burialZone,'');assert.equal(row.gravestoneNumber,'');assert.equal(row.burialUpdatedAt,'');assert.equal(row.reporterName,'');assert.equal(row.reporterRelationship,'');assert.equal(row.reporterUpdatedAt,'');assert.equal(row.reporterPersonKey,'');}finally{db.close();}
});

test('Pelapor: nama dan hubungan wajib, nama si mati ditolak tanpa menganggap nama akaun ialah pelapor',()=>{
 assert.deepEqual(reporterFields({reporterName:' Waris sebenar ',reporterRelationship:' Anak '},'Nama Si Mati'),{reporterName:'Waris sebenar',reporterRelationship:'Anak'});
 for(const patch of [{reporterName:undefined},{reporterName:null},{reporterName:''},{reporterName:'x'.repeat(201)},{reporterRelationship:''},{reporterRelationship:[]},{reporterRelationship:'x'.repeat(101)},{reporterName:' NAMA   SI MATI '}])assert.throws(()=>reporterFields({reporterName:'Waris',reporterRelationship:'Anak',...patch},'Nama Si Mati'));
});

test('Kematian: akses isi rumah, keputusan pentadbir, tarikh, pendua, akaun, sejarah dan sandaran',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'kampung-head-')),password=randomBytes(16).toString('hex');let child;
 async function start(){child=spawn(process.execPath,['server.js'],{cwd:new URL('../',import.meta.url),env:{...process.env,DATA_DIR:dir,HOST:'127.0.0.1',PORT:'0',ADMIN_PASSWORD:password,COOKIE_SECURE:'0'},stdio:['ignore','pipe','pipe']});return new Promise((resolve,reject)=>{let out='',err='';const timer=setTimeout(()=>reject(Error(err||'Timeout')),10000);child.stderr.on('data',v=>err+=v);child.stdout.on('data',v=>{out+=v;const m=out.match(/port (\d+)/);if(m){clearTimeout(timer);resolve(`http://127.0.0.1:${m[1]}`);}});child.on('exit',()=>{clearTimeout(timer);reject(Error(err));});});}
 async function stop(){if(child?.exitCode===null){const exit=once(child,'exit');child.kill();await exit;}}
 try{
 let base=await start(),admin='';const req=(path,method='GET',data,cookie=admin)=>fetch(base+path,{method,headers:{Cookie:cookie,'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});
 const login=async username=>{const r=await req('/api/login','POST',{username,password},'');assert.equal(r.status,200,await r.clone().text());return r.headers.get('set-cookie').split(';')[0];};admin=await login('admin');
 const profile={name:'Ketua Ujian',phone:'0121112222',address1:'Rumah ujian',birthDate:'1960-01-01',employmentStatus:'Pesara',household:[{name:'Keluarga Ujian',relationship:'Anak',birthDate:'1990-01-01',employmentStatus:'Bekerja',livesWithMember:'Ya'},{name:'Calon Ketua',relationship:'Anak',birthDate:'1992-01-01',employmentStatus:'Bekerja',livesWithMember:'Ya'}]};
 let r=await req('/api/members','POST',profile);assert.equal(r.status,201);const id=(await r.json()).id;
 r=await req('/api/members','POST',{name:'Rumah lain',phone:'0133334444',address1:'Lain',household:[]});const otherId=(await r.json()).id;
 for(const [username,role,memberId] of [['head','ahli',id],['other','ahli',otherId],['staff','petugas',null]])assert.equal((await req('/api/users','POST',{username,fullName:username,role,memberId,password})).status,201);
 const beforeDeaths=await (await req('/api/backup')).json();
 const owner=await login('head'),other=await login('other'),staff=await login('staff');
 const getContext=async()=> (await (await req('/api/deaths/context/'+id)).json());let ctx=await getContext();const head=ctx.people[0],family=ctx.people[1],candidate=ctx.people[2];
 assert.equal((await req('/api/deaths/context/'+id,'GET',undefined,other)).status,403);assert.equal((await req('/api/deaths','GET',undefined,'')).status,401);
 const input={memberId:id,personKey:family.personKey,deathDate:'2026-01-01',reporterName:'Waris Ujian',reporterRelationship:'Anak',note:'Disahkan oleh keluarga',confirm:true,burialZone:' Zon A ',gravestoneNumber:' 0012-A '};
 assert.equal((await req('/api/deaths','POST',input,other)).status,403);
 for(const deathDate of ['2026-02-30','2999-01-01','1989-12-31'])assert.equal((await req('/api/deaths','POST',{...input,deathDate},owner)).status,400);
 assert.equal((await req('/api/deaths','POST',{...input,confirm:false},owner)).status,400);
 for(const patch of [{reporterName:undefined},{reporterName:''},{reporterRelationship:null},{reporterName:' KELUARGA   UJIAN '},{burialZone:123},{burialZone:null},{gravestoneNumber:[]},{burialZone:'x'.repeat(101)},{gravestoneNumber:'x'.repeat(101)}])assert.equal((await req('/api/deaths','POST',{...input,...patch},owner)).status,400);
 r=await req('/api/deaths','POST',input,owner);assert.equal(r.status,202);let requestId=(await r.json()).id;
 const submitted=(await (await req('/api/deaths','GET',undefined,owner)).json()).find(r=>r.id===requestId);assert.equal(submitted.burialZone,'Zon A');assert.equal(submitted.gravestoneNumber,'0012-A');
 assert.equal((await req('/api/deaths','POST',input,owner)).status,409);
 assert.equal((await req(`/api/deaths/${requestId}/review`,'POST',{decision:'approve',reviewNote:'',currentPassword:password,confirm:true},staff)).status,403);
 assert.equal((await req(`/api/deaths/${requestId}/review`,'POST',{decision:'reject',reviewNote:''})).status,400);
 assert.equal((await req(`/api/deaths/${requestId}/review`,'POST',{decision:'reject',reviewNote:'Sila semak tarikh'})).status,200);
 assert.equal((await req(`/api/deaths/${requestId}/burial`,'POST',{burialZone:'Zon B',expectedUpdatedAt:''})).status,409);
 assert.equal((await req('/api/deaths','GET',undefined,other)).status,200);assert.equal((await (await req('/api/deaths','GET',undefined,other)).json()).length,0);
 r=await req('/api/deaths','POST',input,owner);requestId=(await r.json()).id;
 const approve={decision:'approve',reviewNote:'Disemak',currentPassword:password,confirm:true};
 assert.equal((await req(`/api/deaths/${requestId}/review`,'POST',{...approve,currentPassword:'wrong'})).status,400);
 assert.equal((await req(`/api/deaths/${requestId}/review`,'POST',approve)).status,200);
 assert.equal((await req(`/api/deaths/${requestId}/review`,'POST',approve)).status,409);
 assert.equal((await req('/api/deaths','POST',input,owner)).status,409);
 const burialId=requestId,approvedRecord=(await (await req('/api/deaths')).json()).find(r=>r.id===burialId);
 const burialInput={burialZone:' Zon B ',gravestoneNumber:'0007-B',expectedUpdatedAt:''};
 for(const cookie of [owner,staff,other])assert.equal((await req(`/api/deaths/${burialId}/burial`,'POST',burialInput,cookie)).status,403);
 assert.equal((await req(`/api/deaths/${burialId}/burial`,'POST',burialInput,'')).status,401);
 assert.equal((await req('/api/deaths/999999/burial','POST',burialInput)).status,404);
 assert.equal((await req(`/api/deaths/${burialId}/burial`,'POST',{...burialInput,gravestoneNumber:42})).status,400);
 assert.equal((await req(`/api/deaths/${burialId}/burial`,'POST',burialInput)).status,200);
 assert.equal((await req(`/api/deaths/${burialId}/burial`,'POST',burialInput)).status,409);
 const savedBurial=(await (await req('/api/deaths')).json()).find(r=>r.id===burialId);assert.equal(savedBurial.burialZone,'Zon B');assert.equal(savedBurial.gravestoneNumber,'0007-B');for(const key of ['status','reviewedAt','reviewedBy','personKey','deathDate'])assert.equal(savedBurial[key],approvedRecord[key]);
 const burialDb=new DatabaseSync(join(dir,'kampung.sqlite'));burialDb.exec("CREATE TRIGGER fail_burial BEFORE INSERT ON audit_log BEGIN SELECT RAISE(ABORT,'rollback burial'); END");
 try{assert.equal((await req(`/api/deaths/${burialId}/burial`,'POST',{burialZone:'Zon Gagal',expectedUpdatedAt:savedBurial.burialUpdatedAt})).status,400);assert.equal(burialDb.prepare('SELECT burialZone FROM death_records WHERE id=?').get(burialId).burialZone,'Zon B');}finally{burialDb.exec('DROP TRIGGER fail_burial');burialDb.close();}
 // Legacy records have no verified reporter; admin corrections preserve original sender and decision.
 const reporterDb=new DatabaseSync(join(dir,'kampung.sqlite'));reporterDb.prepare("UPDATE death_records SET reporterName='',reporterRelationship='',reporterUpdatedAt='' WHERE id=?").run(burialId);
 const legacy=reporterDb.prepare('SELECT * FROM death_records WHERE id=?').get(burialId),reporterPath=`/api/deaths/${burialId}/reporter`,correction={reporterName:'Waris Disahkan',reporterRelationship:'Anak',expectedUpdatedAt:''};
 for(const cookie of [owner,staff,other])assert.equal((await req(reporterPath,'POST',correction,cookie)).status,403);
 assert.equal((await req(reporterPath,'POST',correction,'')).status,401);assert.equal((await req('/api/deaths/999999/reporter','POST',correction)).status,404);
 assert.equal((await req(reporterPath,'POST',{...correction,reporterName:legacy.personName})).status,400);assert.equal((await req(reporterPath,'POST',{...correction,expectedUpdatedAt:'stale'})).status,409);
 assert.equal((await req(reporterPath,'POST',correction)).status,200);assert.equal((await req(reporterPath,'POST',correction)).status,409);
 const fixed=reporterDb.prepare('SELECT * FROM death_records WHERE id=?').get(burialId);assert.equal(fixed.reporterName,'Waris Disahkan');assert.equal(fixed.reporterRelationship,'Anak');for(const key of Object.keys(legacy).filter(key=>!['reporterName','reporterRelationship','reporterUpdatedAt'].includes(key)))assert.equal(fixed[key],legacy[key],key);
 const reporterAudit=reporterDb.prepare("SELECT summary FROM audit_log WHERE action='Betulkan maklumat pelapor kematian' ORDER BY id DESC LIMIT 1").get();assert.equal(JSON.parse(reporterAudit.summary).sebelum.nama,'');assert.equal(JSON.parse(reporterAudit.summary).selepas.nama,'Waris Disahkan');
 reporterDb.exec("CREATE TRIGGER fail_reporter BEFORE INSERT ON audit_log BEGIN SELECT RAISE(ABORT,'rollback reporter'); END");assert.equal((await req(reporterPath,'POST',{...correction,reporterName:'Waris Lain',expectedUpdatedAt:fixed.reporterUpdatedAt})).status,400);assert.deepEqual(reporterDb.prepare('SELECT * FROM death_records WHERE id=?').get(burialId),fixed);reporterDb.exec('DROP TRIGGER fail_reporter');
 const rejectedId=reporterDb.prepare("SELECT id FROM death_records WHERE status='rejected' LIMIT 1").get().id;assert.equal((await req(`/api/deaths/${rejectedId}/reporter`,'POST',correction)).status,409);reporterDb.close();
 let members=await (await req('/api/members')).json(),m=members.find(m=>m.id===id);assert.equal(m.household[0].deathDate,'2026-01-01');assert.equal(m.household.length,2);assert.equal((await req('/api/session','GET',undefined,owner)).status,200);
 const portal=await (await req('/api/portal/profile','GET',undefined,owner)).json();assert.equal(portal.household[0].deathDate,'2026-01-01');
 // Changed identity details invalidate a pending death request.
 r=await req('/api/deaths','POST',{...input,personKey:candidate.personKey},owner);const staleId=(await r.json()).id;
 const changed={...m,household:m.household.map(p=>p.personKey===candidate.personKey?{...p,name:'Nama diperbetulkan'}:p)};
 assert.equal((await req('/api/members/'+id,'PUT',changed)).status,200);
 assert.equal((await req(`/api/deaths/${staleId}/review`,'POST',approve)).status,409);
 assert.equal((await req(`/api/deaths/${staleId}/review`,'POST',{decision:'reject',reviewNote:'Profil berubah'})).status,200);
 assert.equal((await req('/api/members/'+id,'PUT',m)).status,200);
 const headInput={...input,personKey:head.personKey};r=await req('/api/deaths','POST',headInput,staff);requestId=(await r.json()).id;
 // A failed transaction must leave both the request and the account unchanged.
 const raw=new DatabaseSync(join(dir,'kampung.sqlite'));raw.exec("CREATE TRIGGER fail_death BEFORE UPDATE ON users BEGIN SELECT RAISE(ABORT,'test rollback'); END");assert.equal((await req(`/api/deaths/${requestId}/review`,'POST',approve)).status,400);assert.equal((await req('/api/session','GET',undefined,owner)).status,200);assert.equal((await (await req('/api/deaths')).json()).find(r=>r.id===requestId).status,'pending');raw.exec('DROP TRIGGER fail_death');raw.close();
 assert.equal((await req(`/api/deaths/${requestId}/review`,'POST',approve)).status,200);assert.equal((await req('/api/session','GET',undefined,owner)).status,401);assert.equal((await req('/api/login','POST',{username:'head',password},'')).status,401);
 let users=await (await req('/api/users')).json();const oldUser=users.find(u=>u.username==='head');assert.equal(oldUser.isActive,0);assert.equal((await req(`/api/users/${oldUser.id}/status`,'POST',{active:true,currentPassword:password})).status,400);
 // A deceased family member cannot become head; a living candidate can replace the deceased head.
 m=(await (await req('/api/members')).json()).find(m=>m.id===id);assert.equal(m.deathDate,'2026-01-01');assert.equal(m.isActive,1);
 const headChange={memberId:id,expectedUpdatedAt:m.updatedAt,candidateKey:family.personKey,newPhone:'0191112222',effectiveDate:'2026-01-02',reason:'Ketua meninggal dunia',oldResidence:{livesWithMember:'Ya'},relationships:[{personKey:head.personKey,relationship:'Bapa'},{personKey:candidate.personKey,relationship:'Adik'}]};
 assert.equal((await req('/api/head-changes','POST',headChange)).status,400);
 headChange.candidateKey=candidate.personKey;headChange.relationships=[{personKey:head.personKey,relationship:'Bapa'},{personKey:family.personKey,relationship:'Lain-lain'}];r=await req('/api/head-changes','POST',headChange);assert.equal(r.status,202,await r.clone().text());const changeId=(await r.json()).id;
 assert.equal((await req(`/api/head-changes/${changeId}/review`,'POST',{decision:'approve',reviewNote:'',currentPassword:password,confirmAccountChange:true})).status,200);
 m=(await (await req('/api/members')).json()).find(m=>m.id===id);assert.equal(m.name,'Calon Ketua');assert.equal(m.deathDate,undefined);assert.equal(m.household.find(p=>p.personKey===head.personKey).deathDate,'2026-01-01');
 // JSON recovery retains local death history and does not reopen deceased accounts.
 let preview=await (await req('/api/restore/preview','POST',beforeDeaths)).json();r=await req('/api/restore/confirm','POST',{previewToken:preview.previewToken,password,confirmation:'PULIHKAN'});assert.equal(r.status,200,await r.clone().text());m=(await (await req('/api/members')).json()).find(m=>m.id===id);assert.equal(m.deathDate,'2026-01-01');assert.equal(m.household[0].deathDate,'2026-01-01');assert.equal((await (await req('/api/deaths')).json()).filter(r=>r.status==='approved').length,2);assert.equal((await req('/api/login','POST',{username:'head',password},'')).status,401);
 r=await req('/api/backup/full','POST',{currentPassword:password});assert.equal(r.status,200);const file=join(dir,'death-full.sqlite');await writeFile(file,Buffer.from(await r.arrayBuffer()));const copied=new DatabaseSync(file,{readOnly:true});assert.equal(copied.prepare("SELECT count(*) n FROM death_records WHERE status='approved'").get().n,2);assert.equal(copied.prepare('SELECT gravestoneNumber FROM death_records WHERE id=?').get(burialId).gravestoneNumber,'0007-B');copied.close();
 await stop();base=await start();admin=await login('admin');const restoredBurial=(await (await req('/api/deaths')).json()).find(r=>r.id===burialId);assert.equal(restoredBurial.reporterName,'Waris Disahkan');assert.equal(restoredBurial.reporterRelationship,'Anak');assert.equal(restoredBurial.burialZone,'Zon B');assert.equal(restoredBurial.gravestoneNumber,'0007-B');assert.equal((await (await req('/api/deaths')).json()).filter(r=>r.status==='approved').length,2);
 }finally{await stop();await rm(dir,{recursive:true,force:true});}
});
