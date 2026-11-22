import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {once} from 'node:events';
import {DatabaseSync} from 'node:sqlite';

test('Pelapor daripada isi rumah: identiti sah, hubungan kepada si mati, akses, snapshot dan sandaran',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'family-reporters-')),password=randomBytes(16).toString('hex');let child,db;
 async function start(){child=spawn(process.execPath,['server.js'],{cwd:new URL('../',import.meta.url),env:{...process.env,DATA_DIR:dir,PORT:'0',HOST:'127.0.0.1',ADMIN_PASSWORD:password,COOKIE_SECURE:'0',MFA_ENCRYPTION_KEY:''},stdio:['ignore','pipe','pipe']});return new Promise((resolve,reject)=>{let out='',err='';const timer=setTimeout(()=>reject(Error(err||'Timeout')),10000);child.stderr.on('data',v=>err+=v);child.stdout.on('data',v=>{out+=v;const m=out.match(/port (\d+)/);if(m){clearTimeout(timer);resolve('http://127.0.0.1:'+m[1]);}});child.on('exit',()=>{clearTimeout(timer);reject(Error(err));});});}
 async function stop(){if(child?.exitCode===null){const p=once(child,'exit');child.kill();await p;}}
 try{
 let base=await start(),admin='';const req=(path,method='GET',data,cookie=admin)=>fetch(base+path,{method,headers:{Cookie:cookie,'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});
 const login=async username=>{const r=await req('/api/login','POST',{username,password},'');assert.equal(r.status,200);return r.headers.get('set-cookie').split(';')[0];};admin=await login('admin');
 const profile={name:'Ketua Ujian',phone:'0123456789',address1:'Rumah',household:['Si Mati Keluarga','Pelapor Anak','Individu Meninggal'].map(name=>({name,relationship:'Anak',employmentStatus:'Tidak bekerja',livesWithMember:'Ya'}))};const memberId=(await (await req('/api/members','POST',profile)).json()).id,otherId=(await (await req('/api/members','POST',{name:'Rumah Lain',phone:'0198765432',address1:'Lain',household:[]})).json()).id;
 for(const [username,role,id] of [['owner','ahli',memberId],['other','ahli',otherId],['staff','petugas',null]])assert.equal((await req('/api/users','POST',{username,fullName:username,role,memberId:id,password})).status,201);
 let owner=await login('owner');const other=await login('other'),staff=await login('staff'),context=await (await req('/api/deaths/context/'+memberId,'GET',undefined,owner)).json(),[head,target,reporter,dead]=context.people;
 assert.equal(context.reporterPeople.length,4);assert.equal(context.reporterPeople.find(p=>p.personKey===reporter.personKey).relationshipToHead,'Anak');assert.equal((await req('/api/deaths/context/'+memberId,'GET',undefined,other)).status,403);
 const input={memberId,personKey:target.personKey,deathDate:'2026-01-01',note:'Ujian',confirm:true,reporterPersonKey:reporter.personKey,reporterName:'Nama palsu dari klien',reporterRelationship:'Adik-beradik'};
 const outsider=(await (await req('/api/deaths/context/'+otherId)).json()).people[0];for(const key of [target.personKey,outsider.personKey,'tidak-wujud',123])assert.equal((await req('/api/deaths','POST',{...input,reporterPersonKey:key},owner)).status,400);
 let r=await req('/api/deaths','POST',input,owner);assert.equal(r.status,202);const id=(await r.json()).id;let row=(await (await req('/api/deaths')).json()).find(p=>p.id===id);assert.equal(row.reporterName,'Pelapor Anak');assert.equal(row.reporterPersonKey,reporter.personKey);assert.equal(row.reporterRelationship,'Adik-beradik');
 const optionsPath=`/api/deaths/${id}/reporter-options`;for(const cookie of ['',owner,other,staff])assert.equal((await req(optionsPath,'GET',undefined,cookie)).status,cookie?403:401);assert.equal((await req('/api/deaths/999999/reporter-options')).status,404);
 let choices=(await (await req(optionsPath)).json()).people;assert.ok(!choices.some(p=>p.personKey===target.personKey));assert.ok(choices.every(p=>p.relationship===''));assert.equal(JSON.stringify(choices).includes('0123456789'),false);
 r=await req('/api/deaths','POST',{...input,personKey:dead.personKey,reporterPersonKey:head.personKey,reporterRelationship:'Bapa'},owner);assert.equal(r.status,202);const deadId=(await r.json()).id;
 assert.equal((await req(`/api/deaths/${id}/reporter`,'POST',{...input,reporterPersonKey:dead.personKey,expectedUpdatedAt:''})).status,400);
 const approve={decision:'approve',reviewNote:'',currentPassword:password,confirm:true};assert.equal((await req(`/api/deaths/${deadId}/review`,'POST',approve)).status,200);
 assert.equal((await req(`/api/deaths/${id}/reporter`,'POST',{...input,reporterPersonKey:dead.personKey,expectedUpdatedAt:''})).status,400);
 // A head's death can use registered family; server-derived name and historical key survive edits.
 r=await req('/api/deaths','POST',{...input,personKey:head.personKey},owner);assert.equal(r.status,202);const headId=(await r.json()).id;choices=(await (await req(`/api/deaths/${headId}/reporter-options`)).json()).people;assert.deepEqual(choices.map(p=>p.personKey),[reporter.personKey]);assert.equal(choices[0].relationship,'Anak');
 assert.equal((await req(`/api/deaths/${headId}/review`,'POST',approve)).status,200);row=(await (await req('/api/deaths')).json()).find(p=>p.id===headId);const original={...row};
 assert.equal((await req(`/api/deaths/${headId}/reporter`,'POST',{reporterPersonKey:'',reporterName:'Jiran Disahkan',reporterRelationship:'Jiran',expectedUpdatedAt:row.reporterUpdatedAt})).status,200);row=(await (await req('/api/deaths')).json()).find(p=>p.id===headId);assert.equal(row.reporterPersonKey,'');for(const key of ['requesterName','requestedBy','status','reviewedAt','burialZone'])assert.equal(row[key],original[key]);
 assert.equal((await req(`/api/deaths/${headId}/reporter`,'POST',{...input,expectedUpdatedAt:''})).status,409);
 assert.equal((await req(`/api/deaths/${headId}/reporter`,'POST',{...input,expectedUpdatedAt:row.reporterUpdatedAt})).status,200);
 db=new DatabaseSync(join(dir,'kampung.sqlite'));const member=db.prepare('SELECT household FROM members WHERE id=?').get(memberId);const family=JSON.parse(member.household);family.find(p=>p.personKey===reporter.personKey).name='Nama terkini';db.prepare('UPDATE members SET household=? WHERE id=?').run(JSON.stringify(family),memberId);
 choices=(await (await req(`/api/deaths/${headId}/reporter-options`)).json()).people;assert.equal(choices[0].name,'Nama terkini');row=(await (await req('/api/deaths')).json()).find(p=>p.id===headId);assert.equal(row.reporterName,'Pelapor Anak');
 // Removing the current candidate does not erase the recorded snapshot; old selection is rejected on save.
 db.prepare('UPDATE members SET household=? WHERE id=?').run(JSON.stringify(family.filter(p=>p.personKey!==reporter.personKey)),memberId);assert.equal((await (await req(`/api/deaths/${headId}/reporter-options`)).json()).people.length,0);assert.equal((await req(`/api/deaths/${headId}/reporter`,'POST',{...input,expectedUpdatedAt:row.reporterUpdatedAt})).status,400);
 await stop();base=await start();admin=await login('admin');row=(await (await req('/api/deaths')).json()).find(p=>p.id===headId);assert.equal(row.reporterPersonKey,reporter.personKey);assert.equal(row.reporterName,'Pelapor Anak');
 const backup=await req('/api/backup/full','POST',{currentPassword:password});assert.equal(backup.status,200);const file=join(dir,'copy.sqlite');await writeFile(file,Buffer.from(await backup.arrayBuffer()));const copy=new DatabaseSync(file,{readOnly:true});try{assert.equal(copy.prepare('SELECT reporterPersonKey FROM death_records WHERE id=?').get(headId).reporterPersonKey,reporter.personKey);assert.equal(copy.prepare('PRAGMA foreign_key_check').all().length,0);}finally{copy.close();}
 }finally{db?.close();await stop();await rm(dir,{recursive:true,force:true});}
});
