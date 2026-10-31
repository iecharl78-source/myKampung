import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtemp,rm,readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { once } from 'node:events';
import { validateAid,readAidBackup,initializeAid } from '../aid.js';
import { createBackup,readBackup } from '../data-tools.js';

const member={id:1,name:'Ahli Ujian',birthDate:'1990-01-01',isActive:1,createdAt:'2026-01-01T00:00:00Z',updatedAt:'2026-01-01T00:00:00Z',household:[{name:'Anak Ujian',birthDate:'2015-01-01',relationship:'Anak'}]};
const payload={memberId:1,recipientKind:'keluarga',recipientName:'Anak Ujian',recipientBirthDate:'2015-01-01',title:'Bakul makanan',category:'Makanan',provider:'Agensi Ujian',receivedDate:'2026-01-01',amount:'123.45',quantity:'2',unit:'bakul',notes:''};

test('Nilai RM disimpan sebagai sen, penerima sah dan bantuan sudah diterima',()=>{
  const row=validateAid(payload,member);assert.equal(row.amountCents,12345);assert.equal(row.quantity,2);
  assert.equal(validateAid({...payload,recipientKind:'isi_rumah'},member).recipientName,member.name);
  for(const changes of [{amount:'1.001'},{quantity:'0'},{quantity:'2',unit:''},{amount:'',quantity:''},{receivedDate:'2999-01-01'},{receivedDate:'2026-02-30'},{recipientName:'Tiada dalam keluarga'},{memberId:99}]) assert.throws(()=>validateAid({...payload,...changes},member));
  assert.throws(()=>validateAid(payload,{...member,isActive:0}),/ahli aktif/);
  assert.equal(validateAid({...payload,notes:'Dikemas kini'},{...member,isActive:0,household:[]},row).recipientName,'Anak Ujian');
});

test('Sandaran bantuan disemak integriti dan hubungan dengan ahli; format lama kekal diterima',()=>{
  const row={...validateAid(payload,member),id:1,createdAt:'2026-01-01T00:00:00Z',updatedAt:'2026-01-01T00:00:00Z'};
  const backup=createBackup([member],[row]);assert.equal(backup.version,2);
  const members=readBackup(backup,x=>x);assert.equal(readAidBackup(backup,members)[0].amountCents,12345);
  assert.throws(()=>readBackup({...backup,aid:[]},x=>x),/integriti/);
  assert.throws(()=>readAidBackup(backup,[]),/ahli/);
  assert.throws(()=>readAidBackup({...backup,aid:[row,row]},members),/ID/);
  assert.deepEqual(readAidBackup(createBackup([member]),[member]),[]);
});

test('Jenis bantuan lama diambil masuk sekali tanpa mengubah nama sejarah',()=>{
  const db=new DatabaseSync(':memory:');
  try {
    db.exec("CREATE TABLE members (id INTEGER PRIMARY KEY); INSERT INTO members VALUES(1); CREATE TABLE aid_records (id INTEGER PRIMARY KEY,memberId INTEGER,recipientKind TEXT,recipientName TEXT,recipientBirthDate TEXT,title TEXT,category TEXT,provider TEXT,receivedDate TEXT,amountCents INTEGER,quantity REAL,unit TEXT,notes TEXT,createdAt TEXT,updatedAt TEXT); INSERT INTO aid_records VALUES(1,1,'ahli','Ahli','','Bantuan Lama','Makanan','Agensi','2026-01-01',1000,NULL,'','','2026-01-01','2026-01-01');");
    initializeAid(db);const type=db.prepare('SELECT * FROM aid_types').get();assert.equal(type.title,'Bantuan Lama');
    assert.equal(db.prepare('SELECT aidTypeId FROM aid_records').get().aidTypeId,type.id);
    db.prepare('UPDATE aid_types SET title=? WHERE id=?').run('Nama Baharu',type.id);
    initializeAid(db);assert.equal(db.prepare('SELECT count(*) AS n FROM aid_types').get().n,1);assert.equal(db.prepare('SELECT title FROM aid_records').get().title,'Bantuan Lama');
  }finally{db.close();}
});

test('Bantuan: peranan, pendua, sejarah keluarga, sandaran, transaksi dan pemulihan',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'kampung-aid-')),password=randomBytes(16).toString('hex');
  const child=spawn(process.execPath,['server.js'],{cwd:new URL('../',import.meta.url),env:{...process.env,DATA_DIR:dir,PORT:'0',HOST:'127.0.0.1',ADMIN_PASSWORD:password,COOKIE_SECURE:'0'},stdio:['ignore','pipe','pipe']});
  try {
    const base=await new Promise((resolve,reject)=>{let out='',errors='';const timeout=setTimeout(()=>reject(Error(errors||'Startup timeout')),10000);child.stderr.on('data',d=>errors+=d);child.stdout.on('data',d=>{out+=d;const m=out.match(/port (\d+)/);if(m){clearTimeout(timeout);resolve(`http://127.0.0.1:${m[1]}`);}});child.on('exit',()=>{clearTimeout(timeout);reject(Error(errors));});});
    let cookie='';const req=(path,method='GET',data,auth=cookie)=>fetch(base+path,{method,headers:{Cookie:auth,'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});
    assert.equal((await req('/api/aid')).status,401);
    assert.equal((await req('/api/aid-counts')).status,401);
    let response=await req('/api/login','POST',{password});cookie=response.headers.get('set-cookie').split(';')[0];
    response=await req('/api/members','POST',{...member,phone:'0123456789',address:'Alamat Ujian'});assert.equal(response.status,201);
    const memberId=(await response.json()).id,aid={...payload,memberId};
    await req('/api/users','POST',{username:'aidstaff',fullName:'Petugas Bantuan',role:'petugas',password});
    response=await req('/api/login','POST',{username:'aidstaff',password});const staff=response.headers.get('set-cookie').split(';')[0];
    assert.equal((await req('/api/aid-types','POST',{title:'Bantuan Staff',category:'Makanan'},staff)).status,403);
    response=await req('/api/aid-types','POST',{title:'Bakul Katalog',category:'Makanan',provider:'Agensi Ujian',description:'Ujian',isActive:1});assert.equal(response.status,201);const typeId=(await response.json()).id;
    assert.equal((await req('/api/aid-types','POST',{title:'Bakul Katalog',category:'Makanan',provider:'Agensi Ujian'})).status,409);
    aid.aidTypeId=typeId;aid.title='Bakul Katalog';
    response=await req('/api/aid','POST',aid,staff);assert.equal(response.status,201);const id=(await response.json()).id;
    assert.deepEqual(await (await req('/api/aid-counts')).json(),[{memberId,total:1,primaryCount:0,familyCount:1,householdCount:0}]);
    const extraIds=[];
    for(const recipientKind of ['ahli','isi_rumah']) {
      const extra=await req('/api/aid','POST',{...aid,recipientKind},staff);assert.equal(extra.status,201);extraIds.push((await extra.json()).id);
    }
    assert.deepEqual(await (await req('/api/aid-counts')).json(),[{memberId,total:3,primaryCount:1,familyCount:1,householdCount:1}]);
    for(const extraId of extraIds) {
      const extra=(await (await req('/api/aid')).json()).find(row=>row.id===extraId);
      assert.equal((await req(`/api/aid/${extraId}`,'DELETE',{expectedUpdatedAt:extra.updatedAt,confirmation:'PADAM'})).status,200);
    }
    assert.equal((await (await req('/api/aid-counts')).json())[0].total,1);
    response=await req('/api/aid','POST',aid);assert.equal(response.status,409);assert.equal((await response.json()).code,'AID_DUPLICATE');
    let row=(await (await req('/api/aid')).json())[0];assert.equal(row.householdName,'Ahli Ujian');
    assert.equal((await req(`/api/aid/${id}`,'PUT',{...aid,expectedUpdatedAt:'stale'})).status,409);
    const originalMember=(await (await req('/api/members')).json())[0];
    assert.equal((await req(`/api/members/${memberId}`,'DELETE',{expectedUpdatedAt:originalMember.updatedAt,expectedName:originalMember.name,confirmation:'PADAM',password})).status,409);
    assert.equal((await req(`/api/members/${memberId}`,'PUT',{...originalMember,household:[]})).status,200);
    assert.equal((await req(`/api/aid/${id}`,'PUT',{...aid,notes:'Keluarga asal kekal',expectedUpdatedAt:row.updatedAt},staff)).status,200);
    const snapshot=await (await req('/api/backup')).json();assert.equal(snapshot.version,4);assert.equal(snapshot.aid.length,1);assert.equal(snapshot.aidTypes.length,1);
    const type=(await (await req('/api/aid-types')).json())[0];
    assert.equal((await req(`/api/aid-types/${typeId}`,'PUT',{...type,title:'Nama baharu katalog',isActive:0,expectedUpdatedAt:type.updatedAt})).status,200);
    assert.equal((await (await req('/api/aid')).json())[0].title,'Bakul Katalog');
    assert.equal((await req('/api/aid','POST',{...aid,receivedDate:'2026-01-02'},staff)).status,400);
    assert.equal((await req('/api/restore/preview','POST',createBackup(snapshot.members,snapshot.aid))).status,409);
    assert.equal((await req('/api/restore/preview','POST',createBackup(snapshot.members))).status,409);
    assert.equal((await req('/api/restore/preview','POST',createBackup(snapshot.members,[{...snapshot.aid[0],memberId:9999}]))).status,400);
    let preview=await (await req('/api/restore/preview','POST',snapshot)).json();assert.equal(preview.aid,1);
    row=(await (await req('/api/aid')).json())[0];
    assert.equal((await req(`/api/aid/${id}`,'PUT',{...aid,amount:'150',expectedUpdatedAt:row.updatedAt},staff)).status,200);
    assert.equal((await req('/api/restore/confirm','POST',{previewToken:preview.previewToken,password,confirmation:'PULIHKAN'})).status,409);
    preview=await (await req('/api/restore/preview','POST',snapshot)).json();
    const db=new DatabaseSync(join(dir,'kampung.sqlite'));
    db.exec("CREATE TRIGGER aid_restore_fail BEFORE INSERT ON aid_records BEGIN SELECT RAISE(ABORT,'test failure'); END;");
    try {assert.equal((await req('/api/restore/confirm','POST',{previewToken:preview.previewToken,password,confirmation:'PULIHKAN'})).status,400);assert.equal((await (await req('/api/aid')).json())[0].amountCents,15000);}
    finally {db.exec('DROP TRIGGER aid_restore_fail');db.close();}
    response=await req('/api/restore/confirm','POST',{previewToken:preview.previewToken,password,confirmation:'PULIHKAN'});assert.equal(response.status,200);
    const safety=(await response.json()).safetyBackup;assert.equal(JSON.parse(await readFile(join(dir,'backups',safety),'utf8')).aid[0].amountCents,15000);
    row=(await (await req('/api/aid')).json())[0];assert.equal(row.amountCents,12345);assert.equal(row.recipientName,'Anak Ujian');
    response=await req('/api/login','POST',{username:'aidstaff',password});const newStaff=response.headers.get('set-cookie').split(';')[0];
    assert.equal((await req(`/api/aid/${id}`,'DELETE',{expectedUpdatedAt:row.updatedAt,confirmation:'PADAM'},newStaff)).status,403);
    assert.equal((await req(`/api/aid/${id}`,'DELETE',{expectedUpdatedAt:row.updatedAt,confirmation:'wrong'})).status,400);
    assert.equal((await req(`/api/aid/${id}`,'DELETE',{expectedUpdatedAt:row.updatedAt,confirmation:'PADAM'})).status,200);
    assert.equal((await (await req('/api/aid')).json()).length,0);
    assert.deepEqual(await (await req('/api/aid-counts')).json(),[]);
    assert.ok((await (await req('/api/audit')).json()).rows.some(log=>log.action==='Rekod bantuan diterima'));
  } finally {if(child.exitCode===null){const exit=once(child,'exit');child.kill();await exit;}await rm(dir,{recursive:true,force:true});}
});
