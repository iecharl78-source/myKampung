import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { migrateMemberDetails } from '../migrations.js';
import { normalizeMemberDetails, memberDetailFields } from '../public/member-details.js';

test('Migrasi mengekalkan pekerjaan dan keluarga asal tanpa meneka status', () => {
  const db=new DatabaseSync(':memory:');
  try {
    db.exec("CREATE TABLE members (id INTEGER PRIMARY KEY, occupation TEXT, household TEXT); INSERT INTO members VALUES (1,'Guru','[]');");
    migrateMemberDetails(db);
    let row=db.prepare('SELECT * FROM members').get();
    assert.equal(row.occupation,'Guru'); assert.equal(row.household,'[]');
    for (const field of memberDetailFields) assert.equal(row[field],'');
    db.prepare('UPDATE members SET employerName=?,educationLevel=? WHERE id=1').run('Majikan Ujian','Sekolah menengah');
    migrateMemberDetails(db);
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
