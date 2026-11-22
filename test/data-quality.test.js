import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {once} from 'node:events';
import {DatabaseSync} from '../sqlite.js';
import {analyzeDataQuality} from '../data-quality.js';
const catalog={zones:[{code:'A',name:'Zon A',isActive:1}],housingTypes:[{code:'T',isActive:1}]};
const complete=(id=1)=>({id,name:'Ahli '+id,phone:'012111'+String(id).padStart(4,'0'),birthDate:'1980-01-01',employmentStatus:'Bekerja',address1:'Rumah',country:'Malaysia',district:'Raub',state:'Pahang',postcode:'27600',zoneCode:'A',housingTypeCode:'T',isActive:1,household:[]});

test('Kualiti: pilihan tidak diwajibkan, pendapatan sifar sah, rujukan tidak aktif dikekalkan',()=>{
 let result=analyzeDataQuality([{...complete(),monthlyIncome:'0.00'}],catalog,'2026-11-22');assert.equal(result.findings.length,0);assert.equal(result.groups.length,0);
 result=analyzeDataQuality([complete()],{zones:[{code:'A',isActive:0}],housingTypes:[{code:'T',isActive:0}]});assert.equal(result.findings.length,0);
 const missing=analyzeDataQuality([{...complete(),zoneCode:'',housingTypeCode:'',birthDate:'',employmentStatus:''}],{zones:[],housingTypes:[]});assert.deepEqual(missing.findings[0].missing,['Tarikh lahir','Status pekerjaan']);
});
test('Kualiti: format lama, keluarga, pelajar dan senarai rosak dapat dikenal pasti',()=>{
 const result=analyzeDataQuality([{...complete(),phone:'---',birthDate:'2999-01-01',zoneCode:'TIADA',latitude:'91',longitude:'100',household:[{name:'Pelajar',relationship:'Anak',birthDate:'2010-01-01',employmentStatus:'Pelajar',educationLevel:'Universiti',livesWithMember:'Tidak',residenceCountry:'Malaysia',residencePostcode:'12',email:'salah'}]}],catalog,'2026-11-22');
 assert.ok(result.findings[0].invalid.includes('Telefon'));assert.ok(result.findings[0].invalid.includes('Tarikh lahir'));assert.ok(result.findings[0].invalid.includes('Zon tiada dalam katalog'));assert.ok(result.findings[0].invalid.includes('Koordinat di luar format/julat'));assert.ok(result.findings[1].missing.includes('Tahap pengajian universiti'));assert.ok(result.findings[1].missing.includes('Alamat keluarga berasingan'));assert.ok(result.findings[1].invalid.includes('E-mel'));assert.ok(result.findings[1].invalid.includes('Poskod keluarga Malaysia'));
 const bad=analyzeDataQuality([{...complete(),household:'not-json'}],catalog);assert.ok(bad.findings[0].invalid.includes('Senarai ahli keluarga tidak dapat dibaca'));
});
test('Potensi pendua: normalisasi, keluarga sendiri/merentas rumah, ID dan kumpulan besar tanpa pasangan kuadratik',()=>{
 const data=[{...complete(1),name:'Nama Sama',phone:'0123456789',identificationNumber:'MY-12345',household:[{name:' Nama-Sama ',birthDate:'1982-01-01',relationship:'Pasangan',employmentStatus:'Tidak bekerja',livesWithMember:'Ya'}]},{...complete(2),name:'Individu Lain',phone:'+60123456789',identificationNumber:'my12345'}];
 const result=analyzeDataQuality(data,catalog);assert.equal(result.groups.find(g=>g.kind==='phone').count,2);assert.equal(result.groups.find(g=>g.kind==='identification').count,2);assert.equal(result.groups.find(g=>g.kind==='name').count,2);assert.ok(!JSON.stringify(result).includes('MY-12345'));assert.ok(!JSON.stringify(result).includes('+60123456789'));
 const blank=analyzeDataQuality([{...complete(1),name:'',phone:''},{...complete(2),name:'',phone:'---'}],catalog);assert.equal(blank.groups.length,0);
 const large=analyzeDataQuality(Array.from({length:5000},(_,i)=>({...complete(i+1),name:'Nama Dikongsi'})),catalog);assert.equal(large.groups.length,1);assert.equal(large.groups[0].count,5000);
});

test('API kualiti: pentadbir sahaja, penapis, paginasi kumpulan, data minimum dan pembetulan melalui rekod asal',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'quality-api-')),password=randomBytes(16).toString('hex');let child,db;
 try{
 child=spawn(process.execPath,['server.js'],{cwd:new URL('../',import.meta.url),env:{...process.env,DATA_DIR:dir,PORT:'0',HOST:'127.0.0.1',ADMIN_PASSWORD:password,MFA_ENCRYPTION_KEY:'',COOKIE_SECURE:'0'},stdio:['ignore','pipe','pipe']});
 const base=await new Promise((resolve,reject)=>{let out='',err='';const t=setTimeout(()=>reject(Error(err||'Timeout')),10000);child.stderr.on('data',v=>err+=v);child.stdout.on('data',v=>{out+=v;const m=out.match(/port (\d+)/);if(m){clearTimeout(t);resolve('http://127.0.0.1:'+m[1]);}});child.on('exit',()=>{clearTimeout(t);reject(Error(err));});});
 let admin='';const req=(path,method='GET',data,cookie=admin)=>fetch(base+path,{method,headers:{Cookie:cookie,'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});
 const login=async username=>{const r=await req('/api/login','POST',{username,password},'');assert.equal(r.status,200);return r.headers.get('set-cookie').split(';')[0];};admin=await login('admin');
 for(const code of ['A','B'])assert.equal((await req('/api/housing/zones','POST',{code,name:'Zon '+code,isActive:1})).status,201);assert.equal((await req('/api/housing/types','POST',{code:'T',name:'Teres',isActive:1})).status,201);
 const ids=[];for(let i=1;i<=23;i++){const r=await req('/api/members','POST',{...complete(i),name:'Ahli Semakan '+i,birthDate:'',employmentStatus:'',zoneCode:i<=6?'A':'B'});assert.equal(r.status,201,await r.clone().text());ids.push((await r.json()).id);}
 db=new DatabaseSync(join(dir,'kampung.sqlite'));for(const id of ids.slice(0,12))db.prepare('UPDATE members SET name=? WHERE id=?').run('Padanan Bersama',id);
 db.prepare('UPDATE members SET phone=?,identificationNumber=? WHERE id=?').run('0123456789','MY12345',ids[0]);db.prepare('UPDATE members SET phone=?,identificationNumber=? WHERE id=?').run('+60123456789','MY12345',ids[1]);db.prepare('UPDATE members SET phone=? WHERE id=?').run('bad',ids[2]);db.prepare('UPDATE members SET latitude=?,longitude=? WHERE id=?').run('91','100',ids[3]);db.prepare('UPDATE members SET isActive=0,zoneCode=? WHERE id=?').run('',ids[22]);
 for(const [username,role,id] of [['petugas','petugas',null],['pemohon','ahli',ids[12]]])assert.equal((await req('/api/users','POST',{username,fullName:username,role,memberId:id,password})).status,201);const staff=await login('petugas'),owner=await login('pemohon');
 const before=db.prepare('SELECT * FROM members ORDER BY id').all(),history=db.prepare('SELECT count(*) n FROM member_history').get().n;
 assert.equal((await req('/api/data-quality','GET',undefined,'')).status,401);for(const cookie of [staff,owner])assert.equal((await req('/api/data-quality','GET',undefined,cookie)).status,403);assert.equal((await req('/api/data-quality','POST',{})).status,405);
 let result=await (await req('/api/data-quality')).json();assert.equal(result.total,22);assert.equal(result.rows.length,20);assert.equal(result.summary.households,22);assert.equal(result.summary.people,22);assert.equal(result.summary.invalidPeople,2);assert.equal(result.summary.duplicateGroups,3);assert.equal(result.rows[0].identificationNumber,undefined);assert.equal(result.rows[0].phone,undefined);
 assert.equal((await (await req('/api/data-quality?page=2')).json()).rows.length,2);assert.equal((await (await req('/api/data-quality?scope=inactive')).json()).total,1);assert.equal((await (await req('/api/data-quality?scope=all&zone=__missing__')).json()).total,1);assert.equal((await (await req('/api/data-quality?category=invalid')).json()).total,2);assert.equal((await (await req('/api/data-quality?q=Ahli%20Semakan%2013')).json()).total,1);
 const duplicates=await (await req('/api/data-quality?view=duplicates&zone=A')).json();const group=duplicates.rows.find(g=>g.kind==='name');assert.equal(group.count,12);assert.equal(group.preview.length,3);assert.ok(!JSON.stringify(duplicates).includes('MY12345'));assert.ok(!JSON.stringify(duplicates).includes('+60123456789'));
 const groupPath='/api/data-quality/duplicates/'+group.id;for(const cookie of [staff,owner])assert.equal((await req(groupPath,'GET',undefined,cookie)).status,403);assert.equal((await req(groupPath,'POST',{})).status,405);
 let detail=await (await req(groupPath)).json();assert.equal(detail.rows.length,10);assert.equal(detail.total,12);detail=await (await req(groupPath+'?page=2')).json();assert.equal(detail.rows.length,2);assert.ok(detail.rows.some(p=>p.zoneCode==='B'));
 for(const query of ['page=0','page=1.5','view=no','scope=no','category=no','q='+'x'.repeat(201)])assert.equal((await req('/api/data-quality?'+query)).status,400);
 assert.deepEqual(db.prepare('SELECT * FROM members ORDER BY id').all(),before);assert.equal(db.prepare('SELECT count(*) n FROM member_history').get().n,history);
 let member=db.prepare('SELECT * FROM members WHERE id=?').get(ids[12]);member={...member,household:JSON.parse(member.household),birthDate:'1980-01-01',employmentStatus:'Bekerja'};assert.equal((await req('/api/members/'+member.id,'PUT',member)).status,200);assert.equal((await (await req('/api/data-quality?q=Ahli%20Semakan%2013')).json()).total,0);
 for(const [i,id] of ids.slice(0,12).entries())db.prepare('UPDATE members SET name=? WHERE id=?').run('Nama Dipisahkan '+i,id);assert.equal((await req(groupPath)).status,404);
 }finally{db?.close();if(child?.exitCode===null){const p=once(child,'exit');child.kill();await p;}await rm(dir,{recursive:true,force:true});}
});
