import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { migrateMemberStatus } from '../migrations.js';

test('Rekod lama menjadi aktif dan migrasi berulang mengekalkan status nyahaktif',()=>{
  const db=new DatabaseSync(':memory:');
  try {
    db.exec("CREATE TABLE members (id INTEGER PRIMARY KEY, name TEXT, household TEXT); INSERT INTO members VALUES (1,'Ahli Ujian','[]');");
    migrateMemberStatus(db);
    let row=db.prepare('SELECT * FROM members').get();
    assert.equal(row.isActive,1);assert.equal(row.deactivatedAt,'');assert.equal(row.inactivityReason,'');
    db.prepare('UPDATE members SET isActive=0,deactivatedAt=?,inactivityReason=? WHERE id=1').run('2026-10-31T00:00:00Z','Berpindah');
    migrateMemberStatus(db);row=db.prepare('SELECT * FROM members').get();
    assert.equal(row.isActive,0);assert.equal(row.inactivityReason,'Berpindah');assert.equal(row.name,'Ahli Ujian');assert.equal(row.household,'[]');
    assert.throws(()=>db.exec('UPDATE members SET isActive=7'));
  } finally { db.close(); }
});
