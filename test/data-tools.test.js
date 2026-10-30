import { test } from 'node:test';
import assert from 'node:assert/strict';
import { duplicateMatches, createBackup, readBackup, digest } from '../data-tools.js';

test('Padanan nama, telefon Malaysia dan pengecualian rekod sedang diedit',()=>{
  const rows=[{id:1,name:'Siti Binti Ali',phone:'012-345 6789',updatedAt:'2026-01-01'}];
  assert.deepEqual(duplicateMatches({name:'  SITI binti ALI ',phone:'+60 12 3456789'},rows)[0].reasons,['Nama sama','Nombor telefon sama']);
  assert.equal(duplicateMatches({name:'Nama Lain',phone:'0060123456789'},rows).length,1);
  assert.equal(duplicateMatches({name:'Siti Binti Ali',phone:'0123456789'},rows,1).length,0);
  assert.equal(duplicateMatches({name:'Nama Lain',phone:'0199999999'},rows).length,0);
});

test('Sandaran memeriksa integriti, versi, ID unik dan data sebelum pemulihan',()=>{
  const member={id:1,name:'Ahli Ujian',createdAt:'2026-01-01T00:00:00Z',updatedAt:'2026-01-01T00:00:00Z'};
  const backup=createBackup([member]);
  assert.equal(readBackup(backup,row=>({name:row.name}))[0].name,'Ahli Ujian');
  assert.throws(()=>readBackup({...backup,version:99},x=>x),/Format/);
  assert.throws(()=>readBackup({...backup,members:[]},x=>x),/integriti/);
  assert.throws(()=>readBackup(createBackup([member,member]),x=>x),/ID/);
  assert.throws(()=>readBackup(createBackup([{...member,id:-1}]),x=>x),/ID/);
  assert.deepEqual(readBackup(createBackup([]),x=>x),[]);
  assert.equal(digest(backup),digest(JSON.parse(JSON.stringify(backup))));
});

test('Semakan keluarga dalam borang sama dan padanan dengan ahli utama sendiri',()=>{
  const person={name:'Anak Ujian',birthDate:'2015-01-01'};
  const member={name:'Ahli Ujian',phone:'0123456789',household:[person,{...person,name:' ANAK  UJIAN '} ]};
  let matches=duplicateMatches(member,[]);
  assert.equal(matches.length,1);assert.equal(matches[0].id,null);assert.match(matches[0].context,/Ahli keluarga 1.*Ahli keluarga 2.*borang ini/);
  assert.ok(matches[0].reasons.includes('Tarikh lahir sama'));
  matches=duplicateMatches({...member,household:[{name:'Ahli Ujian'}]},[]);
  assert.equal(matches.length,1);assert.match(matches[0].context,/Ahli utama.*Ahli keluarga 1/);
});

test('Keluarga disemak merentas isi rumah aktif/tidak aktif dan rekod utama',()=>{
  const rows=[{id:1,name:'Ahli Lain',phone:'0199999999',isActive:0,updatedAt:'2026-01-01',household:[{name:'Anak Ujian',birthDate:'2015-01-01'}]}];
  const member={name:'Ahli Ujian',phone:'0123456789',household:[{name:'anak ujian',birthDate:'2015-01-01'}]};
  let matches=duplicateMatches(member,rows);
  assert.equal(matches.length,1);assert.equal(matches[0].isActive,0);assert.equal(matches[0].id,1);assert.match(matches[0].context,/isi rumah Ahli Lain/);
  assert.equal(duplicateMatches({...member,...rows[0]},rows,1).length,0);
  matches=duplicateMatches({...member,household:[{name:'Ahli Lain'}]},rows);
  assert.equal(matches.length,1);assert.match(matches[0].context,/sepadan dengan Ahli utama/);
  matches=duplicateMatches({...member,name:'Anak Ujian',household:[]},rows);
  assert.equal(matches.length,1);assert.match(matches[0].context,/Ahli utama: Anak Ujian.*Ahli keluarga 1/);
});

test('Tarikh lahir berbeza atau kosong masih menghasilkan amaran nama sama',()=>{
  const rows=[{id:1,name:'Ahli Lain',phone:'0199999999',household:[{name:'Anak Ujian',birthDate:'2015-01-01'}]}];
  const member={name:'Ahli Ujian',phone:'0123456789',household:[{name:'Anak Ujian',birthDate:'2016-01-01'}]};
  assert.ok(duplicateMatches(member,rows)[0].reasons.includes('Tarikh lahir berbeza — semak identiti'));
  assert.ok(duplicateMatches({...member,household:[{name:'Anak Ujian'}]},rows)[0].reasons.includes('Tarikh lahir belum lengkap — semak identiti'));
  assert.equal(duplicateMatches({...member,household:[{name:'Anak Berbeza',birthDate:'2015-01-01'}]},rows).length,0);
});
