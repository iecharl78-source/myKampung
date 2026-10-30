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
