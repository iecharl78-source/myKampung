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
import {familyIdentity} from '../family-identities.js';

import {khairatAmount} from '../khairat.js';

test('Jumlah khairat disimpan tepat dalam sen dan menolak nilai tidak sah',()=>{assert.equal(khairatAmount('1000.01'),100001);assert.equal(khairatAmount('0.10'),10);for(const amount of ['0','-1','1.005','1e3','NaN','',100, '100000000'])assert.throws(()=>khairatAmount(amount));});

test('Khairat: kematian diluluskan, peranan, tuntutan semula, jumlah, bayaran sekali, rollback dan sandaran',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'kampung-head-')),password=randomBytes(16).toString('hex');let child;
 async function start(){child=spawn(process.execPath,['server.js'],{cwd:new URL('../',import.meta.url),env:{...process.env,DATA_DIR:dir,HOST:'127.0.0.1',PORT:'0',ADMIN_PASSWORD:password,COOKIE_SECURE:'0'},stdio:['ignore','pipe','pipe']});return new Promise((resolve,reject)=>{let out='',err='';const timer=setTimeout(()=>reject(Error(err||'Timeout')),10000);child.stderr.on('data',v=>err+=v);child.stdout.on('data',v=>{out+=v;const m=out.match(/port (\d+)/);if(m){clearTimeout(timer);resolve(`http://127.0.0.1:${m[1]}`);}});child.on('exit',()=>{clearTimeout(timer);reject(Error(err));});});}
 async function stop(){if(child?.exitCode===null){const exit=once(child,'exit');child.kill();await exit;}}
 try{
 let base=await start(),admin='';const req=(path,method='GET',data,cookie=admin)=>fetch(base+path,{method,headers:{Cookie:cookie,'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});
 const login=async username=>{const r=await req('/api/login','POST',{username,password},'');assert.equal(r.status,200,await r.clone().text());return r.headers.get('set-cookie').split(';')[0];};admin=await login('admin');
 const profile={name:'Ketua Tuntutan',phone:'0121112222',address1:'Rumah ujian',employmentStatus:'Bekerja',household:[{name:'Si Mati',relationship:'Ibu',birthDate:'1960-01-01',employmentStatus:'Pesara',livesWithMember:'Ya'},{name:'Belum Diluluskan',relationship:'Bapa',birthDate:'1950-01-01',employmentStatus:'Pesara',livesWithMember:'Ya'}]};
 let r=await req('/api/members','POST',profile);assert.equal(r.status,201);const id=(await r.json()).id;
 r=await req('/api/members','POST',{name:'Isi rumah lain',phone:'0193334444',address1:'Lain',household:[]});const otherId=(await r.json()).id;
 for(const [username,role,memberId] of [['owner','ahli',id],['other','ahli',otherId],['staff','petugas',null]])assert.equal((await req('/api/users','POST',{username,fullName:username,role,memberId,password})).status,201);
 const owner=await login('owner'),other=await login('other'),staff=await login('staff');
 const context=await (await req('/api/deaths/context/'+id)).json();
 let deathIds=[];for(const p of context.people.slice(1)){r=await req('/api/deaths','POST',{memberId:id,personKey:p.personKey,deathDate:'2026-01-01',note:'Disahkan keluarga',confirm:true});assert.equal(r.status,202);deathIds.push((await r.json()).id);}
 const approveDeath={decision:'approve',reviewNote:'Disemak',confirm:true,currentPassword:password};assert.equal((await req(`/api/deaths/${deathIds[0]}/review`,'POST',approveDeath)).status,200);
 const before=await (await req('/api/backup')).json(),input={deathRecordId:deathIds[0],claimantName:'Waris Ujian',claimantRelationship:'Anak',claimantPhone:'0125556666',note:'Permohonan keluarga',confirm:true,amount:'99999'};
 assert.equal((await req('/api/khairat','GET',undefined,'')).status,401);assert.equal((await (await req('/api/khairat/options','GET',undefined,owner)).json()).length,1);assert.equal((await (await req('/api/khairat/options','GET',undefined,other)).json()).length,0);
 assert.equal((await req('/api/khairat','POST',input,other)).status,403);assert.equal((await req('/api/khairat','POST',{...input,deathRecordId:deathIds[1]},owner)).status,400);assert.equal((await req('/api/khairat','POST',{...input,confirm:false},owner)).status,400);
 r=await req('/api/khairat','POST',input,owner);assert.equal(r.status,202);let claimId=(await r.json()).id;
 let claim=(await (await req('/api/khairat')).json())[0];assert.equal(claim.amountCents,null);assert.equal((await req('/api/khairat','POST',input,owner)).status,409);assert.equal((await (await req('/api/khairat','GET',undefined,other)).json()).length,0);
 const review={decision:'approve',amount:'1000.01',reviewNote:'Disahkan',confirm:true,currentPassword:password,expectedUpdatedAt:claim.updatedAt};
 for(const cookie of [owner,staff,other])assert.equal((await req(`/api/khairat/${claimId}/review`,'POST',review,cookie)).status,403);
 assert.equal((await req(`/api/khairat/${claimId}/review`,'POST',{...review,decision:'reject',reviewNote:''})).status,400);assert.equal((await req(`/api/khairat/${claimId}/review`,'POST',{...review,decision:'reject',reviewNote:'Sila lengkapkan maklumat'})).status,200);
 r=await req('/api/khairat','POST',input,staff);assert.equal(r.status,202);claimId=(await r.json()).id;claim=(await (await req('/api/khairat')).json())[0];review.expectedUpdatedAt=claim.updatedAt;
 assert.equal((await req(`/api/khairat/${claimId}/review`,'POST',{...review,currentPassword:'wrong'})).status,400);assert.equal((await req(`/api/khairat/${claimId}/review`,'POST',{...review,expectedUpdatedAt:'stale'})).status,409);
 for(const amount of ['0','-1','100.001'])assert.equal((await req(`/api/khairat/${claimId}/review`,'POST',{...review,amount})).status,400);
 const pay={paymentDate:'2026-01-02',paymentMethod:'Tunai',paymentReference:'RESIT-001',paymentNote:'Diserahkan kepada waris',confirm:true,currentPassword:password,expectedUpdatedAt:claim.updatedAt};
 assert.equal((await req(`/api/khairat/${claimId}/payment`,'POST',pay)).status,409);assert.equal((await req(`/api/khairat/${claimId}/review`,'POST',review)).status,200);
 claim=(await (await req('/api/khairat')).json())[0];assert.equal(claim.status,'approved');assert.equal(claim.amountCents,100001);pay.expectedUpdatedAt=claim.updatedAt;
 for(const cookie of [owner,staff])assert.equal((await req(`/api/khairat/${claimId}/payment`,'POST',pay,cookie)).status,403);
 for(const patch of [{currentPassword:'wrong'},{paymentDate:'2999-01-01'},{paymentDate:'2025-12-31'},{paymentDate:'2026-02-30'},{paymentMethod:'Unknown'},{paymentReference:''},{confirm:false}])assert.equal((await req(`/api/khairat/${claimId}/payment`,'POST',{...pay,...patch})).status,400);
 // Notification failure rolls back financial status and audit together.
 const raw=new DatabaseSync(join(dir,'kampung.sqlite'));raw.exec("CREATE TRIGGER fail_khairat BEFORE INSERT ON notifications BEGIN SELECT RAISE(ABORT,'rollback payment'); END");assert.equal((await req(`/api/khairat/${claimId}/payment`,'POST',pay)).status,400);assert.equal((await (await req('/api/khairat')).json())[0].status,'approved');raw.exec('DROP TRIGGER fail_khairat');raw.close();
 assert.equal((await req(`/api/khairat/${claimId}/payment`,'POST',{...pay,amount:'1'})).status,200);assert.equal((await req(`/api/khairat/${claimId}/payment`,'POST',pay)).status,409);assert.equal((await req('/api/khairat','POST',input,owner)).status,409);
 claim=(await (await req('/api/khairat','GET',undefined,owner)).json())[0];assert.equal(claim.status,'paid');assert.equal(claim.amountCents,100001);assert.equal(claim.paymentReference,'RESIT-001');assert.equal(claim.claimantName,'Waris Ujian');assert.equal((await (await req('/api/aid')).json()).length,0);
 const preview=await (await req('/api/restore/preview','POST',before)).json();assert.equal((await req('/api/restore/confirm','POST',{previewToken:preview.previewToken,password,confirmation:'PULIHKAN'})).status,200);assert.equal((await (await req('/api/khairat')).json())[0].status,'paid');
 r=await req('/api/backup/full','POST',{currentPassword:password});assert.equal(r.status,200);const file=join(dir,'khairat-full.sqlite');await writeFile(file,Buffer.from(await r.arrayBuffer()));const copy=new DatabaseSync(file,{readOnly:true});assert.equal(copy.prepare("SELECT amountCents FROM khairat_claims WHERE status='paid'").get().amountCents,100001);assert.equal(copy.prepare('PRAGMA foreign_key_check').all().length,0);copy.close();
 await stop();base=await start();admin=await login('admin');assert.equal((await (await req('/api/khairat')).json())[0].status,'paid');assert.equal((await req('/api/khairat','POST',input)).status,409);
 }finally{await stop();await rm(dir,{recursive:true,force:true});}
});
