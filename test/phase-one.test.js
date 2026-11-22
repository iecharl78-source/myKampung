import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from '../sqlite.js';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawn} from 'node:child_process';
import {once} from 'node:events';
import {randomBytes} from 'node:crypto';
import {duplicateMatches} from '../data-tools.js';
import {normalizeResident,normalizeHousing} from '../public/resident-fields.js';
import {initializeHousing} from '../housing.js';
import {migrateAddress,migrateMemberDetails,migrateMemberStatus,migrateEmployerAddress,migrateMemberIdentity} from '../migrations.js';

test('Pengesahan penduduk: pengenalan berawalan sifar, pendapatan kosong/sifar, OKU dan koordinat',()=>{
 const out=normalizeResident({identificationNumber:'001122-03-4455',monthlyIncome:'0',disabilityStatus:'Ya',disabilityCardNumber:'000123',disabilityIncome:'450.50',email:' a@contoh.my '});assert.equal(out.identificationNumber,'001122034455');assert.equal(out.monthlyIncome,'0.00');assert.equal(out.disabilityCardNumber,'000123');assert.equal(out.email,'a@contoh.my');
 assert.equal(normalizeResident({}).monthlyIncome,'');assert.equal(normalizeResident({disabilityStatus:'Tidak',disabilityCardNumber:'123'}).disabilityCardNumber,'');
 for(const input of [{monthlyIncome:'-1'},{monthlyIncome:'1.234'},{email:'bukan-email'},{maritalStatus:'foo'},{disabilityStatus:'foo'},{identificationNumber:'123'}])assert.throws(()=>normalizeResident(input));
 for(const input of [{latitude:'91',longitude:'100'},{latitude:'3',longitude:''},{latitude:'3',longitude:'181'}])assert.throws(()=>normalizeHousing(input));assert.equal(normalizeHousing({latitude:'0',longitude:'0'}).latitude,'0');
});
test('Nombor pengenalan disemak walaupun nama berbeza, termasuk keluarga',()=>{
 const old={id:1,name:'Nama Lama',phone:'0111111111',identificationNumber:'001122034455',household:[{name:'Anak Lama',identificationNumber:'101122034456'}]};
 assert.ok(duplicateMatches({name:'Nama Baru',phone:'0222222222',identificationNumber:'001122034455',household:[]},[old]).some(m=>m.reasons.includes('Nombor pengenalan sama')));
 assert.ok(duplicateMatches({name:'Ketua lain',phone:'0222222222',household:[{name:'Anak Baru',identificationNumber:'101122034456'}]},[old]).some(m=>m.kind==='family'&&m.reasons.some(s=>s.includes('Nombor pengenalan'))));
 assert.ok(duplicateMatches({name:'Ketua',phone:'0222222222',identificationNumber:'001122034455',household:[{name:'Anak',identificationNumber:'001122034455'}]},[]).some(m=>m.reasons.some(s=>s.includes('Nombor pengenalan'))));
});

test('Migrasi rumah/keluarga mengekalkan rekod lama dan tidak menggandakan rekod selepas mula semula',()=>{
 const db=new DatabaseSync(':memory:');try{
 db.exec(`PRAGMA foreign_keys=ON;CREATE TABLE members(id INTEGER PRIMARY KEY,name TEXT,phone TEXT,birthDate TEXT,gender TEXT,occupation TEXT,address TEXT,household TEXT,createdAt TEXT,updatedAt TEXT);`);
 const family=JSON.stringify([{name:'Anak Lama',relationship:'Anak',birthDate:'2010-01-01'}]);db.prepare('INSERT INTO members VALUES(1,?,?,?,?,?,?,?,?,?)').run('Ahli Lama','0123456789','','','Guru','Alamat lama',family,'2026-01-01','2026-01-01');
 for(const migrate of [migrateAddress,migrateMemberDetails,migrateMemberStatus,migrateEmployerAddress,migrateMemberIdentity])migrate(db);initializeHousing(db);
 const id=db.prepare('SELECT id FROM family_members').get().id;initializeHousing(db);assert.equal(db.prepare('SELECT id FROM family_members').get().id,id);assert.equal(db.prepare('SELECT count(*) n FROM households').get().n,1);assert.deepEqual(JSON.parse(db.prepare('SELECT household FROM members').get().household).map(({personKey,...p})=>p),JSON.parse(family));assert.match(db.prepare('SELECT personKey FROM family_members').get().personKey,/^[a-f0-9]{32}$/);assert.equal(db.prepare('SELECT address1 FROM households').get().address1,'Alamat lama');assert.equal(db.prepare('SELECT identificationNumber FROM members').get().identificationNumber,'');assert.equal(db.prepare('PRAGMA foreign_key_check').all().length,0);
 }finally{db.close();}
});
test('Fasa satu: katalog, profil/keluarga, kelulusan ahli, laporan, sandaran dan pemulihan',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'kampung-phase1-')),password=randomBytes(16).toString('hex');
 const child=spawn(process.execPath,['server.js'],{cwd:new URL('../',import.meta.url),env:{...process.env,DATA_DIR:dir,HOST:'127.0.0.1',PORT:'0',ADMIN_PASSWORD:password,COOKIE_SECURE:'0'},stdio:['ignore','pipe','pipe']});
 try{
 const base=await new Promise((resolve,reject)=>{let out='',err='';const timer=setTimeout(()=>reject(Error(err||'Timeout')),10000);child.stderr.on('data',v=>err+=v);child.stdout.on('data',v=>{out+=v;const m=out.match(/port (\d+)/);if(m){clearTimeout(timer);resolve(`http://127.0.0.1:${m[1]}`);}});child.on('exit',()=>{clearTimeout(timer);reject(Error(err));});});
 let admin='';const req=(path,method='GET',data,cookie=admin)=>fetch(base+path,{method,headers:{Cookie:cookie,'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});
 let r=await req('/api/login','POST',{password});admin=r.headers.get('set-cookie').split(';')[0];
 assert.equal((await req('/api/housing/zones','POST',{code:'A',name:'Zon A',isActive:1},'')).status,401);
 assert.equal((await req('/api/housing/zones','POST',{code:'A',name:'Zon A',isActive:1})).status,201);assert.equal((await req('/api/housing/types','POST',{code:'TERES',name:'Rumah teres',isActive:1})).status,201);
 assert.equal((await req('/api/housing/zones','POST',{code:'A',name:'Berganda',isActive:1})).status,409);
 const data={name:'Ketua Fasa Satu',phone:'0123456789',address1:'Rumah Ujian',country:'Malaysia',employmentStatus:'Bekerja',identificationNumber:'001122034455',nickname:'Ketua',email:'ketua@contoh.my',maritalStatus:'Berkahwin',monthlyIncome:'2500.50',zoneCode:'A',housingTypeCode:'TERES',houseReference:'PETA-001',latitude:'3.1390',longitude:'101.6869',disabilityStatus:'Tidak',household:[{name:'Anak Ujian Fasa Satu',relationship:'Anak',birthDate:'2010-01-01',employmentStatus:'Pelajar',educationLevel:'Sekolah menengah',identificationNumber:'101122034456',nickname:'Anak',livesWithMember:'Tidak',residenceAddress1:'Rumah Anak',residencePostcode:'05000',residenceState:'Kedah',residenceCountry:'Malaysia',monthlyIncome:'0',disabilityStatus:'Ya',disabilityCardNumber:'000123',disabilityBenefit:'Elaun',disabilityIncome:'200'}]};
 assert.equal((await req('/api/members','POST',{...data,household:[{...data.household[0],residenceAddress1:''}]})).status,400);assert.equal((await req('/api/members','POST',{...data,zoneCode:'TIADA'})).status,400);r=await req('/api/members','POST',data);assert.equal(r.status,201,await r.clone().text());const id=(await r.json()).id;
 let member=(await (await req('/api/members')).json())[0];assert.equal(member.monthlyIncome,'2500.50');assert.equal(member.household[0].disabilityIncome,'200.00');
 const db=new DatabaseSync(join(dir,'kampung.sqlite'));try{assert.equal(db.prepare('SELECT zoneId FROM households WHERE headMemberId=?').get(id).zoneId,1);assert.equal(db.prepare('SELECT disabilityCardNumber FROM family_members').get().disabilityCardNumber,'000123');assert.equal(db.prepare('SELECT residencePostcode FROM family_members').get().residencePostcode,'05000');assert.equal(db.prepare("SELECT count(*) n FROM sqlite_master WHERE name='orders'").get().n,0);}finally{db.close();}
 await req('/api/users','POST',{username:'phaseone',fullName:data.name,role:'ahli',memberId:id,password});r=await req('/api/login','POST',{username:'phaseone',password});const resident=r.headers.get('set-cookie').split(';')[0];
 assert.equal((await req('/api/housing/types','POST',{code:'BARU',name:'Baharu',isActive:1},resident)).status,403);
 assert.equal((await req('/api/portal/profile','PUT',{...member,monthlyIncome:'3000',houseReference:'PETA-002',expectedUpdatedAt:member.updatedAt},resident)).status,202);
 assert.equal((await (await req('/api/members')).json())[0].monthlyIncome,'2500.50');const pending=(await (await req('/api/profile-requests')).json())[0];assert.equal(pending.data.houseReference,'PETA-002');
 assert.equal((await req(`/api/profile-requests/${pending.id}/review`,'POST',{decision:'approve',reviewNote:'Disahkan'})).status,200);member=(await (await req('/api/members')).json())[0];assert.equal(member.monthlyIncome,'3000.00');
 const report=await (await req('/api/reports?type=members&zoneCode=A')).json();assert.equal(report.total,1);assert.equal(report.rows[0].identificationNumber,data.identificationNumber);assert.equal((await (await req('/api/reports?type=members&zoneCode=B')).json()).total,0);
 const familyReport=await (await req('/api/reports?type=family')).json();assert.equal(familyReport.rows[0].disabilityCardNumber,'000123');assert.equal(familyReport.rows[0].livesWithMember,'Tidak');assert.match(familyReport.rows[0].currentResidenceAddress,/Rumah Anak/);
 const snapshot=await (await req('/api/backup')).json();assert.equal(snapshot.version,8);assert.equal(snapshot.housing.zones.length,1);
 const preview=await (await req('/api/restore/preview','POST',snapshot)).json();r=await req('/api/restore/confirm','POST',{previewToken:preview.previewToken,password,confirmation:'PULIHKAN'});assert.equal(r.status,200,await r.clone().text());
 const final=(await (await req('/api/members')).json())[0];assert.equal(final.monthlyIncome,'3000.00');assert.equal(final.household[0].identificationNumber,'101122034456');assert.equal(final.houseReference,'PETA-002');assert.equal(final.household[0].residencePostcode,'05000');
 const verified=new DatabaseSync(join(dir,'kampung.sqlite'));try{assert.equal(verified.prepare('SELECT count(*) n FROM family_members').get().n,1);assert.equal(verified.prepare('PRAGMA foreign_key_check').all().length,0);}finally{verified.close();}
 }finally{if(child.exitCode===null){const exit=once(child,'exit');child.kill();await exit;}await rm(dir,{recursive:true,force:true});}
});
