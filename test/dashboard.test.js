import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {dashboardData} from '../dashboard.js';
import {initializeCommunity} from '../community.js';
import {initializeAidRequests} from '../aid-requests.js';

test('Papan pemuka mengasingkan peranan dan pemilik serta menyenaraikan siaran aktif sahaja',()=>{
 const db=new DatabaseSync(':memory:');
 try{
  db.exec(`CREATE TABLE users(id INTEGER PRIMARY KEY); INSERT INTO users VALUES(1),(2),(3);
   CREATE TABLE members(id INTEGER PRIMARY KEY,isActive INTEGER,household TEXT);INSERT INTO members VALUES(10,1,'[{"name":"Anak"}]'),(20,0,'[]');
   CREATE TABLE aid_records(id INTEGER PRIMARY KEY,memberId INTEGER);INSERT INTO aid_records VALUES(1,10),(2,20);
   CREATE TABLE registrations(status TEXT);INSERT INTO registrations VALUES('pending'),('pending'),('approved');`);
  initializeCommunity(db);initializeAidRequests(db);
  const now='2026-10-31T10:00:00.000Z';
  const insert=db.prepare('INSERT INTO profile_requests(userId,memberId,identityKey,data,baseUpdatedAt,status,reviewNote,reviewedAt,createdAt) VALUES(?,?,?,? ,?,?,?,?,?)');
  insert.run(2,10,'identity','{}',now,'pending','','',now);insert.run(3,20,'other','{}',now,'pending','','',now);insert.run(2,10,'identity','{}',now,'rejected','Lengkapkan alamat',now,now);
  db.prepare("INSERT INTO aid_requests(userId,memberId,identityKey,action,baseUpdatedAt,data,status,createdAt) VALUES(2,10,'identity','create','','{}','pending',?)").run(now);
  db.prepare("INSERT INTO notifications(userId,title,body,createdAt) VALUES(2,'Milik ahli','',?)").run(now);db.prepare("INSERT INTO notifications(userId,title,body,createdAt) VALUES(3,'Milik lain','',?)").run(now);
  db.prepare("INSERT INTO questions(userId,subject,status,createdAt,updatedAt) VALUES(2,'Own','open',?,?),(3,'Other','open',?,?)").run(now,now,now,now);
  const event=db.prepare('INSERT INTO events(title,body,location,startsAt,endsAt,published,createdBy,createdAt,updatedAt) VALUES(?,?,?, ?,?,?,?,?,?)');
  for(const [title,start,end,published] of [['Sedang berlangsung','2026-10-30T00:00:00.000Z','2026-11-01T00:00:00.000Z',1],['Akan datang','2026-11-07T00:00:00.000Z','',1],['Telah tamat','2026-10-29T00:00:00.000Z','2026-10-30T00:00:00.000Z',1],['Draf rahsia','2026-11-08T00:00:00.000Z','',0]])event.run(title,'Butiran','Balai raya',start,end,published,'admin',now,now);
  const announcement=db.prepare('INSERT INTO announcements(title,body,published,createdBy,createdAt,updatedAt) VALUES(?,?,?,?,?,?)');announcement.run('Hebahan','Disiar',1,'admin',now,now);announcement.run('Rahsia','Draf',0,'admin',now,now);
  const member=dashboardData(db,{id:2,role:'ahli',memberId:10},new Date(now));assert.equal(member.pending,undefined);assert.equal(member.community,undefined);assert.deepEqual(member.requests.profiles,{pending:1,approved:0,rejected:1});assert.equal(member.requests.aid.pending,1);assert.equal(member.unread,1);assert.equal(member.openQuestions,1);assert.deepEqual(member.household,{family:1,aid:1});assert.equal(member.decisions.length,1);assert.equal(member.decisions[0].reviewNote,'Lengkapkan alamat');assert.deepEqual(member.events.map(e=>e.title),['Sedang berlangsung','Akan datang']);assert.deepEqual(member.announcements.map(a=>a.title),['Hebahan']);
  const admin=dashboardData(db,{id:1,role:'admin'},new Date(now));assert.deepEqual(admin.pending,{registrations:2,profiles:2,aid:1});assert.equal(admin.openQuestions,2);assert.equal(admin.requests,undefined);assert.equal(admin.decisions,undefined);assert.deepEqual(admin.community,{active:1,inactive:1,family:1});
  const staff=dashboardData(db,{id:1,role:'petugas'},new Date(now));assert.equal(staff.pending,undefined);assert.equal(staff.requests,undefined);assert.equal(staff.openQuestions,2);
 }finally{db.close();}
});
