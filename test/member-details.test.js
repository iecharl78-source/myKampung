import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { migrateMemberDetails, migrateEmployerAddress } from '../migrations.js';
import { normalizeMemberDetails, memberDetailFields } from '../public/member-details.js';

test('Migrasi mengekalkan pekerjaan dan keluarga asal tanpa meneka status', () => {
  const db=new DatabaseSync(':memory:');
  try {
    db.exec("CREATE TABLE members (id INTEGER PRIMARY KEY, occupation TEXT, household TEXT); INSERT INTO members VALUES (1,'Guru','[]');");
    migrateMemberDetails(db);migrateEmployerAddress(db);
    let row=db.prepare('SELECT * FROM members').get();
    assert.equal(row.occupation,'Guru'); assert.equal(row.household,'[]');
    for (const field of memberDetailFields) assert.equal(row[field],'');
    db.prepare('UPDATE members SET employerName=?,educationLevel=? WHERE id=1').run('Majikan Ujian','Sekolah menengah');
    migrateMemberDetails(db);migrateEmployerAddress(db);
    row=db.prepare('SELECT * FROM members').get();
    assert.equal(row.employerName,'Majikan Ujian'); assert.equal(row.educationLevel,'Sekolah menengah'); assert.equal(row.occupation,'Guru');
  } finally { db.close(); }
});

test('Pendidikan tertinggi boleh direkodkan walaupun ahli bekerja atau bersara', () => {
  for (const employmentStatus of ['Bekerja','Pesara','Tidak bekerja']) {
    const result=normalizeMemberDetails({employmentStatus,educationLevel:'Universiti',studyLevel:'Sarjana Muda'});
    assert.equal(result.educationLevel,'Universiti'); assert.equal(result.studyLevel,'Sarjana Muda');
    assert.equal(result.employerName,''); assert.equal(result.employerPhone,'');
  }
  assert.deepEqual(normalizeMemberDetails({}),Object.fromEntries(memberDetailFields.map(key=>[key,''])));
});

test('Pendidikan pelajar, tahap universiti dan nombor majikan disahkan', () => {
  assert.throws(()=>normalizeMemberDetails({employmentStatus:'Pelajar'}),/pendidikan semasa/);
  assert.throws(()=>normalizeMemberDetails({employmentStatus:'Pelajar',educationLevel:'Tiada pendidikan formal'}),/pendidikan semasa/);
  assert.throws(()=>normalizeMemberDetails({educationLevel:'Universiti'}),/tahap pengajian/);
  assert.throws(()=>normalizeMemberDetails({employmentStatus:'Tidak sah'}),/status pekerjaan/);
  assert.throws(()=>normalizeMemberDetails({educationLevel:'Tidak sah'}),/tahap pendidikan/);
  assert.throws(()=>normalizeMemberDetails({employerPhone:'abc'}),/telefon majikan/);
  assert.throws(()=>normalizeMemberDetails({employerName:42}),/Maklumat/);
  assert.throws(()=>normalizeMemberDetails({employerAddress:'x'.repeat(1001)}),/Maklumat/);
  const result=normalizeMemberDetails({educationLevel:'Sekolah menengah',studyLevel:'Sarjana',employerName:' Majikan Ujian ',employerPhone:'+60 3-1234 5678'});
  assert.equal(result.studyLevel,'');assert.equal(result.employerName,'Majikan Ujian');assert.equal(result.employerPhone,'+60 3-1234 5678');
});

test('Alamat majikan lama disalin sepenuhnya dan naik taraf tidak menimpa medan baharu',()=>{
  const db=new DatabaseSync(':memory:');
  try {
    db.exec("CREATE TABLE members (id INTEGER PRIMARY KEY,employerAddress TEXT); INSERT INTO members VALUES (1,'No. 2, Jalan Ujian, 05000 Alor Setar, Kedah');");
    migrateEmployerAddress(db);
    let row=db.prepare('SELECT * FROM members').get();assert.equal(row.employerAddress1,row.employerAddress);assert.equal(row.employerPostcode,'');
    db.prepare('UPDATE members SET employerAddress1=?,employerPostcode=?,employerState=? WHERE id=1').run('No. 2, Jalan Ujian','05000','Kedah');
    migrateEmployerAddress(db);row=db.prepare('SELECT * FROM members').get();assert.equal(row.employerAddress1,'No. 2, Jalan Ujian');assert.equal(row.employerPostcode,'05000');
  } finally { db.close(); }
});

test('Alamat majikan berasingan mengekalkan sifar poskod dan menyokong medan pilihan',()=>{
  const row=normalizeMemberDetails({employerAddress1:'No. 2',employerAddress2:'Kampung Ujian',employerDistrict:'Kota Setar',employerPostcode:'05000',employerState:'Kedah',employerCountry:'Malaysia'});
  assert.equal(row.employerPostcode,'05000');assert.equal(row.employerAddress,'No. 2\nKampung Ujian\n05000 Kota Setar\nKedah\nMalaysia');
  assert.equal(normalizeMemberDetails({employerCountry:'Malaysia'}).employerAddress,'');
  assert.equal(normalizeMemberDetails({employerAddress:'Alamat asal'}).employerAddress1,'Alamat asal');
  assert.throws(()=>normalizeMemberDetails({employerCountry:'Malaysia',employerPostcode:'5000'}),/poskod majikan/);
  assert.equal(normalizeMemberDetails({employerCountry:'Malaysia',employerPostcode:''}).employerPostcode,'');
});
