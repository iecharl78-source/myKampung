import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {once} from 'node:events';
import {DatabaseSync} from '../sqlite.js';

test('Sijil rekod kematian: guna semula khairat, tambah pada rekod lama, akses dan sandaran',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'death-docs-')),password=randomBytes(16).toString('hex');let child,db;
 async function start(){child=spawn(process.execPath,['server.js'],{cwd:new URL('../',import.meta.url),env:{...process.env,DATA_DIR:dir,PORT:'0',HOST:'127.0.0.1',ADMIN_PASSWORD:password,COOKIE_SECURE:'0'},stdio:['ignore','pipe','pipe']});return new Promise((resolve,reject)=>{let out='',err='';const t=setTimeout(()=>reject(Error(err||'Timeout')),10000);child.stderr.on('data',v=>err+=v);child.stdout.on('data',v=>{out+=v;const m=out.match(/port (\d+)/);if(m){clearTimeout(t);resolve(`http://127.0.0.1:${m[1]}`);}});child.on('exit',()=>{clearTimeout(t);reject(Error(err));});});}
 async function stop(){if(child?.exitCode===null){const p=once(child,'exit');child.kill();await p;}}
 try{
 let base=await start(),admin='';const req=(path,method='GET',data,cookie=admin)=>fetch(base+path,{method,headers:{Cookie:cookie,'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});
 const login=async username=>{const r=await req('/api/login','POST',{username,password},'');assert.equal(r.status,200);return r.headers.get('set-cookie').split(';')[0];};admin=await login('admin');
 const certificate={fileName:'sijil.pdf',mimeType:'application/pdf',base64:Buffer.from('%PDF-1.4\nCertificate\n%%EOF').toString('base64')};
 let r=await req('/api/members','POST',{name:'Ketua Ujian',phone:'0123456789',address1:'Rumah',household:['Ibu','Bapa','Anak','Penjaga','Lain-lain','Lain-lain'].map((relationship,i)=>({name:'Individu '+i,relationship,employmentStatus:'Tidak bekerja',livesWithMember:'Ya'}))});assert.equal(r.status,201);const memberId=(await r.json()).id;
 r=await req('/api/members','POST',{name:'Lain',phone:'0198765432',address1:'Rumah lain',household:[]});const otherId=(await r.json()).id;
 for(const [username,id] of [['pemohon',memberId],['lain',otherId]])assert.equal((await req('/api/users','POST',{username,fullName:username,role:'ahli',memberId:id,password})).status,201);
 let owner=await login('pemohon'),other=await login('lain');const people=(await (await req('/api/deaths/context/'+memberId)).json()).people.slice(1);
 const ids=[];
 for(const [i,p] of people.entries()){
  const data={memberId,personKey:p.personKey,deathDate:'2026-01-01',reporterName:'Waris Ujian',reporterRelationship:'Anak',note:'Maklumat keluarga',confirm:true,...(i===0?{certificate}:{})};
  if(i===0){r=await req('/api/deaths','POST',{...data,certificate:{...certificate,base64:'AAAA'}},owner);assert.equal(r.status,400);}
  r=await req('/api/deaths','POST',data,owner);assert.equal(r.status,202,await r.clone().text());ids.push((await r.json()).id);
 }
 db=new DatabaseSync(join(dir,'kampung.sqlite'));
 assert.equal((await req(`/api/deaths/${ids[0]}/certificate`,'GET',undefined,'')).status,401);
 for(const method of ['GET','POST'])assert.equal((await req(`/api/deaths/${ids[0]}/certificate`,method,method==='POST'?{certificate}:undefined,other)).status,403);
 assert.equal((await req(`/api/deaths/${ids[0]}/certificate`,'POST',{certificate},owner)).status,409);
 r=await req(`/api/deaths/${ids[0]}/certificate`,'GET',undefined,owner);assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'no-store');assert.equal(Buffer.from(await r.arrayBuffer()).toString('base64'),certificate.base64);
 assert.equal((await (await req('/api/deaths','GET',undefined,owner)).json()).find(d=>d.id===ids[0]).certificateName,'sijil.pdf');
 for(const id of ids.slice(0,4))assert.equal((await req(`/api/deaths/${id}/review`,'POST',{decision:'approve',reviewNote:'Disemak',confirm:true,currentPassword:password})).status,200);
 assert.equal((await req(`/api/deaths/${ids[4]}/review`,'POST',{decision:'reject',reviewNote:'Maklumat tidak tepat'})).status,200);
 assert.equal((await req(`/api/deaths/${ids[4]}/certificate`,'POST',{certificate},owner)).status,409);
 assert.equal((await req('/api/khairat/types','POST',{code:'ASAS',name:'Khairat',amount:'1000',isActive:1})).status,200);const typeId=(await (await req('/api/khairat/types')).json())[0].id;
 const claim={typeId,claimantName:'Waris',claimantRelationship:'Anak',claimantPhone:'0123456789',note:'Khairat',confirm:true};
 assert.equal((await req('/api/khairat','POST',{...claim,deathRecordId:ids[1]},owner)).status,400);
 r=await req('/api/khairat','POST',{...claim,deathRecordId:ids[0]},owner);assert.equal(r.status,202,await r.clone().text());const claimId=(await r.json()).id;
 let saved=(await (await req('/api/khairat')).json()).find(c=>c.id===claimId);assert.equal(saved.certificateSource,'death');assert.equal(saved.deathNote,'Maklumat keluarga');
 assert.equal(db.prepare('SELECT count(*) n FROM khairat_documents').get().n,0);
 assert.equal((await req(`/api/khairat/${claimId}/certificate`,'GET',undefined,other)).status,403);
 r=await req(`/api/khairat/${claimId}/certificate`,'GET',undefined,owner);assert.equal(r.status,200);assert.equal(Buffer.from(await r.arrayBuffer()).toString('base64'),certificate.base64);
 assert.equal((await req(`/api/khairat/${claimId}/review`,'POST',{decision:'approve',amount:'1000',reviewNote:'Disemak',confirm:true,currentPassword:password,expectedUpdatedAt:saved.updatedAt})).status,200);
 // Simulasi rekod lama tanpa sijil: pending, approved dan paid.
 for(const [index,status] of ['pending','approved','paid'].entries()){
  const deathId=ids[index+1],death=db.prepare('SELECT * FROM death_records WHERE id=?').get(deathId),user=db.prepare("SELECT id FROM users WHERE username='pemohon'").get();
  const id=Number(db.prepare('INSERT INTO khairat_claims(deathRecordId,householdKey,claimantName,claimantRelationship,claimantPhone,note,requestedBy,requesterName,status,amountCents,createdAt,updatedAt) VALUES(?,?,?,?,?,?,?,?,?,?,?,?)').run(deathId,death.householdKey,'Waris','Anak','0123456789','Lama',user.id,'pemohon',status,status==='pending'?null:100000,'2026-01-01','2026-01-01').lastInsertRowid);
  const before=db.prepare('SELECT * FROM khairat_claims WHERE id=?').get(id);
  assert.equal((await req(`/api/khairat/${id}/certificate`,'POST',{certificate,expectedUpdatedAt:before.updatedAt},other)).status,403);
  assert.equal((await req(`/api/khairat/${id}/certificate`,'POST',{certificate,expectedUpdatedAt:'stale'},owner)).status,409);
  r=await req(`/api/khairat/${id}/certificate`,'POST',{certificate,expectedUpdatedAt:before.updatedAt},owner);assert.equal(r.status,200,await r.clone().text());
  const after=db.prepare('SELECT * FROM khairat_claims WHERE id=?').get(id);for(const k of Object.keys(before).filter(k=>k!=='updatedAt'))assert.equal(after[k],before[k],k);
  assert.equal((await req(`/api/deaths/${deathId}/certificate`,'GET',undefined,owner)).status,200);
  assert.equal((await req(`/api/khairat/${id}/certificate`,'POST',{certificate,expectedUpdatedAt:after.updatedAt},owner)).status,409);
 }
 // Rekod menunggu boleh menerima lampiran terus daripada pemilik isi rumah.
 assert.equal((await req(`/api/deaths/${ids[5]}/certificate`,'POST',{certificate:{...certificate,fileName:'bad.exe'}},owner)).status,400);
 assert.equal((await req(`/api/deaths/${ids[5]}/certificate`,'POST',{certificate},owner)).status,200);
 assert.equal(db.prepare('SELECT status FROM death_records WHERE id=?').get(ids[5]).status,'pending');
 assert.equal((await req(`/api/deaths/${ids[5]}/certificate`,'POST',{certificate},owner)).status,409);
 // Muat turun melalui khairat mengikut akses khairat, walaupun modul kematian disekat.
 const access=await (await req('/api/access-settings?role=ahli')).json();
 assert.equal((await req('/api/access-settings?role=ahli','PUT',{modules:{...access.modules,deaths:false},expectedUpdatedAt:access.updatedAt,currentPassword:password})).status,200);
 assert.equal((await req(`/api/deaths/${ids[0]}/certificate`,'GET',undefined,owner)).status,403);
 assert.equal((await req(`/api/khairat/${claimId}/certificate`,'GET',undefined,owner)).status,200);
 // Lampiran kekal selepas mula semula dan disertakan dalam sandaran penuh.
 await stop();base=await start();admin=await login('admin');owner=await login('pemohon');
 assert.equal((await req(`/api/khairat/${claimId}/certificate`,'GET',undefined,owner)).status,200);
 r=await req('/api/backup/full','POST',{currentPassword:password});assert.equal(r.status,200);const file=join(dir,'copy.sqlite');await writeFile(file,Buffer.from(await r.arrayBuffer()));const copy=new DatabaseSync(file,{readOnly:true});assert.equal(copy.prepare('SELECT count(*) n FROM death_documents').get().n,5);assert.equal(copy.prepare('PRAGMA foreign_key_check').all().length,0);copy.close();
 }finally{db?.close();await stop();await rm(dir,{recursive:true,force:true});}
});
