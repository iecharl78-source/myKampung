import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { mkdtemp,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { initializeAccounts,passwordRecord,verifyPassword,publicUser } from '../accounts.js';

test('Naik taraf akaun lama mengekalkan kata laluan, membuang hash lama dan tidak mencipta pendua',()=>{
  const db=new DatabaseSync(':memory:'),password=randomBytes(16).toString('hex'),credentials=passwordRecord(password);
  try {
    db.exec('CREATE TABLE members (id INTEGER PRIMARY KEY)');
    db.exec('CREATE TABLE admin (id INTEGER PRIMARY KEY,salt TEXT,hash TEXT)');
    db.prepare('INSERT INTO admin VALUES (1,?,?)').run(credentials.salt,credentials.hash);
    initializeAccounts(db,'this-new-environment-value-must-not-replace-password');
    let users=db.prepare('SELECT * FROM users').all();
    assert.equal(users.length,1);assert.equal(users[0].username,'admin');assert.equal(users[0].role,'admin');assert.equal(verifyPassword(users[0],password),true);
    assert.equal(db.prepare("SELECT name FROM sqlite_master WHERE name='admin'").get(),undefined);
    assert.equal(publicUser(users[0]).hash,undefined);assert.equal(publicUser(users[0]).salt,undefined);
    initializeAccounts(db,'another-value-that-must-not-replace-password');
    users=db.prepare('SELECT * FROM users').all();assert.equal(users.length,1);assert.equal(verifyPassword(users[0],password),true);
    assert.equal(verifyPassword(null,password),false);assert.throws(()=>passwordRecord('short'),/Kata laluan/);
  } finally { db.close(); }
});

test('Naik taraf peranan lama mengekalkan ID/hash dan membenarkan pautan akaun ahli',()=>{
  const db=new DatabaseSync(':memory:'),password=randomBytes(16).toString('hex'),credentials=passwordRecord(password);
  try{
    db.exec(`CREATE TABLE members(id INTEGER PRIMARY KEY); INSERT INTO members VALUES(9);
      CREATE TABLE users(id INTEGER PRIMARY KEY,username TEXT NOT NULL UNIQUE COLLATE NOCASE,fullName TEXT NOT NULL,role TEXT NOT NULL CHECK(role IN ('admin','petugas')),isActive INTEGER NOT NULL DEFAULT 1,salt TEXT NOT NULL,hash TEXT NOT NULL,createdAt TEXT NOT NULL,updatedAt TEXT NOT NULL);`);
    const now=new Date().toISOString();db.prepare('INSERT INTO users VALUES(7,?,?,?,1,?,?,?,?)').run('admin','Pentadbir asal','admin',credentials.salt,credentials.hash,now,now);
    initializeAccounts(db);initializeAccounts(db);
    const admin=db.prepare('SELECT * FROM users WHERE id=7').get();assert.equal(verifyPassword(admin,password),true);assert.equal(admin.fullName,'Pentadbir asal');
    db.prepare("INSERT INTO users(username,fullName,role,salt,hash,createdAt,updatedAt,memberId) VALUES('newresident','Ahli','ahli',?,?,?,?,9)").run(credentials.salt,credentials.hash,now,now);
    assert.equal(db.prepare("SELECT memberId FROM users WHERE username='newresident'").get().memberId,9);
    assert.equal(db.prepare('PRAGMA foreign_key_check').all().length,0);
  }finally{db.close();}
});

test('Akaun berasingan, peranan, kata laluan, penamatan sesi dan audit',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'kampung-accounts-'));
  const password=randomBytes(16).toString('hex'),staffPassword=randomBytes(16).toString('hex'),newPassword=randomBytes(16).toString('hex'),resetPassword=randomBytes(16).toString('hex');
  const child=spawn(process.execPath,['server.js'],{cwd:new URL('../',import.meta.url),env:{...process.env,DATA_DIR:dir,PORT:'0',HOST:'127.0.0.1',ADMIN_PASSWORD:password,COOKIE_SECURE:'0'},stdio:['ignore','pipe','pipe']});
  try {
    const base=await new Promise((resolve,reject)=>{
      let output='',errors=''; const timeout=setTimeout(()=>reject(Error('Startup timeout: '+errors)),10000);
      child.stderr.on('data',chunk=>errors+=chunk);
      child.stdout.on('data',chunk=>{output+=chunk;const match=output.match(/port (\d+)/);if(match){clearTimeout(timeout);resolve(`http://127.0.0.1:${match[1]}`);}});
      child.once('exit',()=>{clearTimeout(timeout);reject(Error('Server exited: '+errors));});
    });
    let adminCookie='';
    const req=(path,method='GET',data,cookie=adminCookie)=>fetch(base+path,{method,headers:{Cookie:cookie,'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});
    const login=async(username,secret)=>{const response=await req('/api/login','POST',{username,password:secret},'');assert.equal(response.status,200);return response.headers.get('set-cookie').split(';')[0];};
    assert.equal((await req('/api/users')).status,401);adminCookie=await login('ADMIN',password);
    const current=(await (await req('/api/session')).json()).user;assert.equal(current.username,'admin');assert.equal(current.hash,undefined);
    let response=await req('/api/users','POST',{username:'petugas1',fullName:'Petugas Ujian',role:'petugas',password:staffPassword});assert.equal(response.status,201);const staffId=(await response.json()).id;
    assert.equal((await req('/api/users','POST',{username:'PETUGAS1',fullName:'Pendua',role:'petugas',password:staffPassword})).status,409);
    assert.equal((await req('/api/users','POST',{username:'rolebad',fullName:'Ujian',role:'owner',password:staffPassword})).status,400);
    assert.equal((await req('/api/users','POST',{username:'short',fullName:'Ujian',role:'petugas',password:'short'})).status,400);
    let staffCookie=await login('petugas1',staffPassword),secondStaffSession=await login('petugas1',staffPassword);
    for(const path of ['/api/users','/api/audit','/api/backup','/api/reports','/api/reports?format=csv']) assert.equal((await req(path,'GET',undefined,staffCookie)).status,403);
    assert.equal((await req('/api/users','POST',{username:'hacker',role:'admin',password:staffPassword},staffCookie)).status,403);
    assert.equal((await req('/api/restore/preview','POST',{},staffCookie)).status,403);
    assert.equal((await req('/api/members/1','DELETE',{},staffCookie)).status,403);
    const member={name:'Ahli Rahsia Ujian',phone:'0123456789',address1:'Alamat Rahsia Ujian',household:[]};
    response=await req('/api/members','POST',member,staffCookie);assert.equal(response.status,201);const memberId=(await response.json()).id;
    const report=await (await req('/api/reports?type=members&status=all')).json();assert.equal(report.total,1);assert.equal(report.rows[0].name,member.name);
    const csv=await req('/api/reports?type=members&format=csv');assert.equal(csv.status,200);assert.match(csv.headers.get('content-type'),/text\/csv/);assert.match(csv.headers.get('content-disposition'),/attachment/);assert.ok((await csv.text()).includes(member.name));
    assert.equal((await req('/api/reports?type=aid&from=bad')).status,400);
    let row=(await (await req('/api/members','GET',undefined,staffCookie)).json())[0];
    assert.equal((await req(`/api/members/${memberId}`,'PUT',{...row,occupation:'Guru'},staffCookie)).status,200);
    row=(await (await req('/api/members','GET',undefined,staffCookie)).json())[0];
    assert.equal((await req(`/api/members/${memberId}/status`,'POST',{expectedUpdatedAt:row.updatedAt,active:false,reason:'Berpindah'},staffCookie)).status,200);
    assert.equal((await req('/api/password','POST',{currentPassword:'wrong',newPassword},staffCookie)).status,400);
    assert.equal((await req('/api/password','POST',{currentPassword:staffPassword,newPassword:'short'},staffCookie)).status,400);
    assert.equal((await req('/api/password','POST',{currentPassword:staffPassword,newPassword:staffPassword},staffCookie)).status,400);
    assert.equal((await req('/api/password','POST',{currentPassword:staffPassword,newPassword},staffCookie)).status,200);
    for(const cookie of [staffCookie,secondStaffSession]) assert.equal((await req('/api/session','GET',undefined,cookie)).status,401);
    assert.equal((await req('/api/login','POST',{username:'petugas1',password:staffPassword},'')).status,401);
    staffCookie=await login('petugas1',newPassword);
    assert.equal((await req(`/api/users/${staffId}/status`,'POST',{active:false,currentPassword:'wrong'})).status,400);
    assert.equal((await req(`/api/users/${staffId}/status`,'POST',{active:false,currentPassword:password})).status,200);
    assert.equal((await req('/api/session','GET',undefined,staffCookie)).status,401);
    assert.equal((await req('/api/login','POST',{username:'petugas1',password:newPassword},'')).status,401);
    assert.equal((await req(`/api/users/${staffId}/status`,'POST',{active:true,currentPassword:password})).status,200);
    staffCookie=await login('petugas1',newPassword);
    assert.equal((await req(`/api/users/${staffId}/password`,'POST',{newPassword:resetPassword,currentPassword:password})).status,200);
    assert.equal((await req('/api/session','GET',undefined,staffCookie)).status,401);
    staffCookie=await login('petugas1',resetPassword);
    assert.equal((await req(`/api/users/${current.id}/status`,'POST',{active:false,currentPassword:password})).status,400);
    const users=await (await req('/api/users')).json();assert.equal(users.length,2);assert.ok(users.every(user=>!('hash' in user) && !('salt' in user)));
    const audit=await (await req('/api/audit?page=1')).json();assert.ok(audit.rows.some(row=>row.actorName==='petugas1' && row.action==='Daftar ahli'));
    assert.ok(audit.rows.some(row=>row.action==='Tetap semula kata laluan'));
    const raw=JSON.stringify(audit);
    for(const secret of [password,staffPassword,newPassword,resetPassword,member.phone,member.address1]) assert.equal(raw.includes(secret),false);
    assert.equal((await req('/api/audit?page=-1')).status,400);
    const backup=await (await req('/api/backup')).json();assert.equal(backup.users,undefined);assert.equal(backup.audit_log,undefined);
    const preview=await (await req('/api/restore/preview','POST',backup)).json();
    assert.equal((await req('/api/restore/confirm','POST',{previewToken:preview.previewToken,password,confirmation:'PULIHKAN'})).status,200);
    assert.equal((await req('/api/session','GET',undefined,staffCookie)).status,401);
    assert.equal((await (await req('/api/users')).json()).length,2);
    const auditAfter=await (await req('/api/audit')).json();assert.ok(auditAfter.total>audit.total);assert.ok(auditAfter.rows.some(row=>row.action==='Pulihkan sandaran'));
    assert.equal((await req('/api/logout','POST')).status,200);assert.equal((await req('/api/session')).status,401);
  } finally { if(child.exitCode===null) {const exit=once(child,'exit');child.kill();await exit;} await rm(dir,{recursive:true,force:true}); }
});
