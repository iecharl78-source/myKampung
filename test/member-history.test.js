import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {once} from 'node:events';
import {DatabaseSync} from 'node:sqlite';
import {checkHosting} from '../scripts/check-hosting.js';

test('Semakan hosting mengesan Node lama dan menolak DATA_DIR awam tanpa membaca pangkalan data sebenar',async()=>{
 const root=await mkdtemp(join(tmpdir(),'hosting-check-'));try{const old=await checkHosting({version:'20.20.2',dataDir:join(root,'private')});assert.equal(old.compatible,false);const ok=await checkHosting({dataDir:join(root,'private')});assert.equal(ok.compatible,true);const bad=await checkHosting({dataDir:join(root,'public_html','data')});assert.equal(bad.compatible,false);assert.ok(bad.checks.some(c=>c.name==='dataDirectory'&&!c.ok));}finally{await rm(root,{recursive:true,force:true});}
});

test('Sejarah ahli: perubahan rasmi, pemohon/pelulus, akses, rollback, pemadaman dan sandaran',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'member-history-')),password=randomBytes(16).toString('hex');let child,db;
 async function start(){child=spawn(process.execPath,['passenger.cjs'],{cwd:new URL('../',import.meta.url),env:{...process.env,DATA_DIR:dir,HOST:'127.0.0.1',PORT:'0',ADMIN_PASSWORD:password,COOKIE_SECURE:'0',MFA_ENCRYPTION_KEY:''},stdio:['ignore','pipe','pipe']});return new Promise((resolve,reject)=>{let out='',err='';const t=setTimeout(()=>reject(Error(err||'Timeout')),10000);child.stderr.on('data',v=>err+=v);child.stdout.on('data',v=>{out+=v;const m=out.match(/port (\d+)/);if(m){clearTimeout(t);resolve(`http://127.0.0.1:${m[1]}`);}});child.on('exit',()=>{clearTimeout(t);reject(Error(err));});});}
 async function stop(){if(child?.exitCode===null){const p=once(child,'exit');child.kill();await p;}}
 try{
 let base=await start(),admin='';const req=(path,method='GET',data,cookie=admin)=>fetch(base+path,{method,headers:{Cookie:cookie,'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});
 const login=async username=>{const r=await req('/api/login','POST',{username,password},'');assert.equal(r.status,200);return r.headers.get('set-cookie').split(';')[0];};admin=await login('admin');
 assert.equal((await req('/api/member-history','GET',undefined,'')).status,401);assert.equal((await (await req('/api/member-history')).json()).total,0);
 const initial={name:'Ahli Sejarah',phone:'0123456789',address1:'Rumah',employmentStatus:'Bekerja',household:[{name:'Pasangan Ujian',relationship:'Pasangan',employmentStatus:'Tidak bekerja'}]};
 let r=await req('/api/members','POST',{...initial,changeReason:'Pendaftaran awal'});assert.equal(r.status,201);const memberId=(await r.json()).id;
 for(const [username,role,id] of [['pemohon','ahli',memberId],['petugas','petugas',null]])assert.equal((await req('/api/users','POST',{username,fullName:username,role,memberId:id,password})).status,201);
 let owner=await login('pemohon'),staff=await login('petugas');const records=async()=> (await (await req('/api/member-history?memberId='+memberId)).json()).rows;
 let rows=await records();assert.equal(rows.length,1);assert.equal((await (await req('/api/member-history?memberId=000'+memberId)).json()).total,1);let detail=await (await req('/api/member-history/'+rows[0].id)).json();assert.equal(detail.before,null);assert.equal(detail.after.household.length,1);assert.equal(detail.reason,'Pendaftaran awal');
 for(const cookie of [owner,staff])for(const path of ['/api/member-history','/api/member-history/'+detail.id])assert.equal((await req(path,'GET',undefined,cookie)).status,403);
 assert.equal((await req('/api/member-history/'+detail.id,'POST',{})).status,405);assert.equal((await req('/api/member-history?page=0')).status,400);assert.equal((await req('/api/member-history/999999')).status,404);
 const member=async()=> (await (await req('/api/members')).json()).find(m=>m.id===memberId);
 let profile=await member();const updated={...profile,household:[...profile.household,{name:'Ibu Ujian',relationship:'Ibu',employmentStatus:'Pesara'},{name:'Bapa Ujian',relationship:'Bapa',employmentStatus:'Pesara'}],changeReason:'Tambah ibu bapa'};
 assert.equal((await req('/api/members/'+memberId,'PUT',updated,staff)).status,200);rows=await records();assert.equal(rows.length,2);detail=await (await req('/api/member-history/'+rows[0].id)).json();assert.equal(detail.actorRole,'petugas');assert.equal(detail.before.household.length,1);assert.equal(detail.after.household.length,3);assert.equal(detail.reason,'Tambah ibu bapa');assert.equal(detail.after.identityKey,undefined);assert.equal(detail.after.household[0].personKey,undefined);
 profile=await member();assert.equal((await req('/api/members/'+memberId,'PUT',profile,staff)).status,200);assert.equal((await records()).length,2);
 let proposal={...profile,name:'Nama Selepas Kelulusan',expectedUpdatedAt:(await member()).updatedAt,household:profile.household.slice(0,2)};
 r=await req('/api/portal/profile','PUT',proposal,owner);assert.equal(r.status,202);let requestId=(await r.json()).id;assert.equal((await records()).length,2);
 assert.equal((await req(`/api/profile-requests/${requestId}/review`,'POST',{decision:'reject',reviewNote:'Semak semula'})).status,200);assert.equal((await records()).length,2);
 r=await req('/api/portal/profile','PUT',proposal,owner);requestId=(await r.json()).id;
 assert.equal((await req(`/api/profile-requests/${requestId}/review`,'POST',{decision:'approve',reviewNote:'Dokumen disemak'})).status,200);
 rows=await records();detail=await (await req('/api/member-history/'+rows[0].id)).json();assert.equal(detail.before.name,'Ahli Sejarah');assert.equal(detail.after.name,'Nama Selepas Kelulusan');assert.equal(detail.before.household.length,3);assert.equal(detail.after.household.length,2);assert.equal(detail.actorRole,'admin');assert.equal(detail.submittedBy,'pemohon');assert.equal(detail.reason,'Dokumen disemak');assert.equal(detail.source,'profile-request:'+requestId);
 db=new DatabaseSync(join(dir,'kampung.sqlite'));db.exec("CREATE TRIGGER fail_history BEFORE INSERT ON member_history BEGIN SELECT RAISE(ABORT,'rollback history'); END");
 try{profile=await member();assert.equal((await req('/api/members/'+memberId,'PUT',{...profile,phone:'0193334444'})).status,400);assert.equal((await member()).phone,profile.phone);assert.equal((await records()).length,3);}finally{db.exec('DROP TRIGGER fail_history');}
 profile=await member();assert.equal((await req(`/api/members/${memberId}/status`,'POST',{active:false,reason:'Pindah',expectedUpdatedAt:profile.updatedAt})).status,200);rows=await records();detail=await (await req('/api/member-history/'+rows[0].id)).json();assert.equal(detail.after.isActive,0);assert.equal(detail.reason,'Pindah');
 profile=await member();assert.equal((await req('/api/members/'+memberId,'DELETE',{expectedUpdatedAt:profile.updatedAt,expectedName:profile.name,confirmation:'PADAM',password})).status,200);
 let all=await (await req('/api/member-history?q=Nama%20Selepas%20Kelulusan')).json();assert.ok(all.rows.some(r=>r.action==='Padam ahli'));detail=await (await req('/api/member-history/'+all.rows[0].id)).json();assert.equal(detail.after,null);assert.equal(detail.before.household.length,2);assert.equal(detail.memberId,null);
 // SQLite may reuse a deleted numeric ID; the old history must not follow the new household.
 r=await req('/api/members','POST',{name:'Individu Berbeza',phone:'0187778888',address1:'Alamat lain',household:[]});assert.equal(r.status,201);const reusedId=(await r.json()).id;assert.equal(reusedId,memberId);rows=(await (await req('/api/member-history?memberId='+reusedId)).json()).rows;assert.equal(rows.length,1);assert.equal(rows[0].subjectName,'Individu Berbeza');
 const recoveryPoint=await (await req('/api/backup')).json();let currentMember=(await (await req('/api/members')).json()).find(m=>m.id===reusedId);
 assert.equal((await req('/api/members/'+reusedId,'PUT',{...currentMember,name:'Nama Sementara',changeReason:'Ujian pemulihan'})).status,200);
 const preview=await (await req('/api/restore/preview','POST',recoveryPoint)).json();assert.equal((await req('/api/restore/confirm','POST',{previewToken:preview.previewToken,password,confirmation:'PULIHKAN'})).status,200);
 const restoredHistory=(await (await req('/api/member-history?memberId='+reusedId)).json()).rows;assert.equal(restoredHistory[0].action,'Pulihkan sandaran JSON');assert.equal(restoredHistory.length,3);const restoredDetail=await (await req('/api/member-history/'+restoredHistory[0].id)).json();assert.equal(restoredDetail.before.name,'Nama Sementara');assert.equal(restoredDetail.after.name,'Individu Berbeza');
 r=await req('/api/backup/full','POST',{currentPassword:password});assert.equal(r.status,200);const file=join(dir,'copy.sqlite');await writeFile(file,Buffer.from(await r.arrayBuffer()));const copy=new DatabaseSync(file,{readOnly:true});assert.equal(copy.prepare('SELECT count(*) n FROM member_history').get().n,8);assert.equal(copy.prepare('PRAGMA foreign_key_check').all().length,0);copy.close();
 await stop();base=await start();admin=await login('admin');assert.equal((await (await req('/api/member-history')).json()).total,8);assert.equal((await (await req('/api/member-history?q=Individu%20Berbeza')).json()).total,2);
 }finally{db?.close();await stop();await rm(dir,{recursive:true,force:true});}
});
