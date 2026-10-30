import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrateAddress, migrateMemberDetails, migrateMemberStatus, migrateEmployerAddress } from './migrations.js';
import { formatAddress } from './public/address.js';
import { normalizeEducation } from './public/education.js';
import { normalizeMemberDetails, memberDetailFields } from './public/member-details.js';
import { memberColumns, digest, duplicateMatches, createBackup, readBackup } from './data-tools.js';
import { initializeAccounts, publicUser, verifyPassword, audit, withAudit, accountRoutes } from './accounts.js';

const root = fileURLToPath(new URL('.', import.meta.url));
const data = process.env.DATA_DIR || join(root, 'data');
mkdirSync(data, { recursive: true, mode: 0o700 });
const db = new DatabaseSync(join(data, 'kampung.sqlite'));
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS members (id INTEGER PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL, birthDate TEXT NOT NULL DEFAULT '', gender TEXT NOT NULL DEFAULT '', occupation TEXT NOT NULL DEFAULT '', address TEXT NOT NULL, household TEXT NOT NULL, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL);`);
migrateAddress(db);
migrateMemberDetails(db);
migrateMemberStatus(db);
migrateEmployerAddress(db);
initializeAccounts(db,process.env.ADMIN_PASSWORD);
const sessions = new Map(), attempts = new Map(), restorePreviews = new Map();
const allMembers = () => db.prepare('SELECT * FROM members ORDER BY id DESC').all().map(x=>({...x,household:JSON.parse(x.household)}));
function safetySnapshot(prefix) {
  const backupDir=join(data,'backups'); mkdirSync(backupDir,{recursive:true,mode:0o700});
  const filename=`${prefix}-${Date.now()}-${randomBytes(4).toString('hex')}.json`;
  writeFileSync(join(backupDir,filename),JSON.stringify(createBackup(allMembers())),{mode:0o600,flag:'wx'});
  return filename;
}
function revokeSessions(userId) {
  for(const [key,session] of sessions) if(session.userId===userId) { sessions.delete(key);restorePreviews.delete(key); }
}
function duplicateWarning(res, member, input, excludedId) {
  const matches=duplicateMatches(member,allMembers(),excludedId);
  const confirmation=digest({member,matches});
  if (matches.length && input.duplicateConfirmation!==confirmation) {
    json(res,409,{error:'Rekod ahli atau keluarga yang serupa ditemui. Semak sebelum menyimpan sebagai rekod berasingan.',code:'DUPLICATE',matches,confirmation});
    return true;
  }
  return false;
}
const json = (res, status, body) => { res.writeHead(status, {'Content-Type':'application/json; charset=utf-8'}); res.end(JSON.stringify(body)); };
async function body(req, limit=65536) {
  const chunks=[]; let size=0;
  for await (const chunk of req) { size+=chunk.length; if (size>limit) throw Error('Data terlalu besar.'); chunks.push(chunk); }
  const raw=Buffer.concat(chunks).toString('utf8');
  try { return JSON.parse(raw); } catch { throw Error('Format data tidak sah.'); }
}
function validate(input) {
  const text = (v, max = 200) => { if (typeof v !== 'string' || v.length > max) throw Error('Maklumat tidak sah atau terlalu panjang.'); return v.trim(); };
  const name = text(input.name), phone = text(input.phone, 30);
  const addressParts = {
    address1: text(input.address1 ?? input.address ?? '', 1000),
    address2: text(input.address2 ?? '', 500), district: text(input.district ?? '', 100),
    postcode: text(input.postcode ?? '', 20), state: text(input.state ?? '', 100), country: text(input.country ?? '', 100),
  };
  if (addressParts.postcode && addressParts.country.toLowerCase() === 'malaysia' && !/^\d{5}$/.test(addressParts.postcode)) throw Error('Sila masukkan poskod Malaysia 5 digit atau kosongkan jika belum diketahui.');
  const address = formatAddress(addressParts);
  if (!name || !addressParts.address1 || !/^[+\d\s()-]{7,30}$/.test(phone)) throw Error('Sila isi nama, alamat dan nombor telefon yang sah.');
  const date = value => { const s = text(value || '', 10); if (s && (!/^\d{4}-\d{2}-\d{2}$/.test(s) || !Number.isFinite(Date.parse(s)) || new Date(s).toISOString().slice(0,10) !== s || s > new Date().toISOString().slice(0,10))) throw Error('Tarikh lahir tidak sah.'); return s; };
  const gender = text(input.gender || '', 20);
  if (!['','Lelaki','Perempuan'].includes(gender)) throw Error('Jantina tidak sah.');
  if (!Array.isArray(input.household) || input.household.length > 30) throw Error('Maksimum 30 ahli keluarga.');
  const household = input.household.map(person => {
    const name = text(person.name), relationship = text(person.relationship, 30);
    if (!name || !['Pasangan','Anak','Ibu','Bapa','Penjaga','Lain-lain'].includes(relationship)) throw Error('Lengkapkan nama dan hubungan ahli keluarga.');
    return {name, relationship, birthDate: date(person.birthDate), ...normalizeEducation(person)};
  });
  const isActive=input.isActive ?? 1;
  if(isActive!==0 && isActive!==1) throw Error('Maklumat status ahli tidak sah.');
  const deactivatedAt=isActive===0 ? text(input.deactivatedAt ?? '',50) : '';
  if(deactivatedAt && !Number.isFinite(Date.parse(deactivatedAt))) throw Error('Tarikh nyahaktif tidak sah.');
  const inactivityReason=isActive===0 ? text(input.inactivityReason ?? '',500) : '';
  return {name, phone, address, ...addressParts, ...normalizeMemberDetails(input), birthDate:date(input.birthDate), gender, occupation:text(input.occupation || ''), household,isActive,deactivatedAt,inactivityReason};
}
const staticFiles = {'/':['index.html','text/html'], '/app.js':['app.js','text/javascript'], '/password-tools.js':['password-tools.js','text/javascript'], '/form-state.js':['form-state.js','text/javascript'], '/age.js':['age.js','text/javascript'], '/address.js':['address.js','text/javascript'], '/education.js':['education.js','text/javascript'], '/member-details.js':['member-details.js','text/javascript'], '/style.css':['style.css','text/css']};
const server = http.createServer(async (req,res) => {
  res.setHeader('Cache-Control','no-store'); res.setHeader('X-Content-Type-Options','nosniff');
  res.setHeader('Content-Security-Policy',"default-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
  res.setHeader('Referrer-Policy','no-referrer');
  const path = new URL(req.url, 'http://localhost').pathname;
  try {
    if (req.method === 'GET' && staticFiles[path]) { const [file,type] = staticFiles[path]; res.writeHead(200, {'Content-Type':`${type}; charset=utf-8`}); return res.end(readFileSync(join(root,'public',file))); }
    if (['POST','PUT','DELETE'].includes(req.method) && req.headers.origin && req.headers.origin !== `${process.env.COOKIE_SECURE === '1' ? 'https' : 'http'}://${req.headers.host}`) return json(res,403,{error:'Asal permintaan tidak dibenarkan.'});
    if (path === '/api/login' && req.method === 'POST') {
      const key = req.socket.remoteAddress, now = Date.now();
      if (attempts.size > 10000) for (const [k,v] of attempts) if (v.until < now) attempts.delete(k);
      const rate = attempts.get(key);
      if (rate && rate.until > now && rate.count >= 5) return json(res,429,{error:'Terlalu banyak percubaan. Cuba lagi selepas 15 minit.'});
      const input = await body(req);
      if(!db.prepare('SELECT id FROM users LIMIT 1').get()) return json(res,503,{error:'Pentadbir belum disediakan. Tetapkan ADMIN_PASSWORD pada pelayan.'});
      const username=typeof input.username==='string' ? input.username.trim().toLowerCase() : 'admin';
      const user=db.prepare('SELECT * FROM users WHERE username=?').get(username);
      const password = typeof input.password === 'string' && input.password.length <= 1000 ? input.password : '';
      if (!verifyPassword(user,password) || user.isActive!==1) {
        attempts.set(key,{count:rate && rate.until > now ? rate.count+1 : 1,until:rate && rate.until > now ? rate.until : now+900000});
        return json(res,401,{error:'Nama pengguna atau kata laluan tidak tepat, atau akaun tidak aktif.'});
      }
      attempts.delete(key);
      for (const [k,v] of sessions) if (v.expires < now) sessions.delete(k);
      const token = randomBytes(32).toString('hex'); sessions.set(token,{userId:user.id,expires:now+8*3600000});
      res.setHeader('Set-Cookie',`session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${process.env.COOKIE_SECURE === '1' ? '; Secure' : ''}`);
      audit(db,user,'Log masuk','akaun',user.id);
      return json(res,200,{ok:true,user:publicUser(user)});
    }
    const token = (req.headers.cookie || '').split(';').map(x=>x.trim()).find(x=>x.startsWith('session='))?.slice(8);
    const session=sessions.get(token);
    const user=session && session.expires>Date.now() ? db.prepare('SELECT * FROM users WHERE id=? AND isActive=1').get(session.userId) : null;
    if(!user) { if(token) { sessions.delete(token);restorePreviews.delete(token); } return json(res,401,{error:'Sila log masuk.'}); }
    if (path === '/api/session' && req.method === 'GET') return json(res,200,{ok:true,user:publicUser(user)});
    if(await accountRoutes({req,res,path,user,db,json,body,revokeSessions})) return;
    const adminOnly=path==='/api/backup' || path.startsWith('/api/restore/') || req.method==='DELETE';
    if(adminOnly && user.role!=='admin') return json(res,403,{error:'Akses ini terhad kepada pentadbir.'});
    if (path === '/api/logout' && req.method === 'POST') { audit(db,user,'Log keluar','akaun',user.id); sessions.delete(token); restorePreviews.delete(token); res.setHeader('Set-Cookie','session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'); return json(res,200,{ok:true}); }
    if (path === '/api/members' && req.method === 'GET') return json(res,200,allMembers());
    if (path === '/api/backup' && req.method === 'GET') {
      res.setHeader('Content-Disposition',`attachment; filename="myKampung-sandaran-${new Date().toISOString().replace(/[:.]/g,'-')}.json"`);
      const backup=createBackup(allMembers());audit(db,user,'Muat turun sandaran','sistem','');
      return json(res,200,backup);
    }
    if (path === '/api/restore/preview' && req.method === 'POST') {
      restorePreviews.delete(token);
      for (const [key,value] of restorePreviews) if(value.expires<Date.now() || !sessions.has(key)) restorePreviews.delete(key);
      if (restorePreviews.size>=20) return json(res,429,{error:'Terlalu banyak pratonton pemulihan. Cuba lagi kemudian.'});
      const input=await body(req,10*1024*1024), records=readBackup(input,validate), current=allMembers();
      const previewToken=randomBytes(24).toString('hex');
      restorePreviews.set(token,{previewToken,records,current:digest(current),expires:Date.now()+10*60000});
      return json(res,200,{previewToken,createdAt:input.createdAt,records:records.length,family:records.reduce((n,m)=>n+m.household.length,0),currentRecords:current.length});
    }
    if (path === '/api/restore/confirm' && req.method === 'POST') {
      const input=await body(req), preview=restorePreviews.get(token);
      if (!preview || preview.expires<Date.now() || preview.previewToken!==input.previewToken) return json(res,409,{error:'Pratonton tamat atau tidak sah. Pilih fail sandaran semula.'});
      if (!verifyPassword(user,input.password)) {
        restorePreviews.delete(token);
        return json(res,400,{error:'Kata laluan tidak tepat. Pilih fail semula untuk mencuba.'});
      }
      if (input.confirmation!=='PULIHKAN') return json(res,400,{error:'Sila taip PULIHKAN untuk mengesahkan penggantian data.'});
      if (digest(allMembers())!==preview.current) { restorePreviews.delete(token); return json(res,409,{error:'Data telah berubah sejak pratonton. Pilih fail semula untuk menyemak keadaan terkini.'}); }
      const safetyBackup=safetySnapshot('sebelum-pemulihan');
      db.exec('BEGIN IMMEDIATE');
      try {
        db.exec('DELETE FROM members');
        const insert=db.prepare(`INSERT INTO members (${memberColumns.join(',')}) VALUES (${memberColumns.map(()=>'?').join(',')})`);
        for(const member of preview.records) insert.run(...memberColumns.map(key=>key==='household'?JSON.stringify(member.household):member[key]));
        audit(db,user,'Pulihkan sandaran','sistem','',`${preview.records.length} rekod ahli`);
        db.exec('COMMIT');
      } catch(error) { db.exec('ROLLBACK'); throw error; }
      restorePreviews.clear();
      for(const key of sessions.keys()) if(key!==token) sessions.delete(key);
      return json(res,200,{ok:true,records:preview.records.length,safetyBackup});
    }
    if (path === '/api/members' && req.method === 'POST') {
      const input=await body(req), m = validate(input), now = new Date().toISOString();
      if(duplicateWarning(res,m,input)) return;
      const columns = ['name','phone','birthDate','gender','occupation','address','household','createdAt','updatedAt','address1','address2','district','postcode','state','country',...memberDetailFields];
      const record = {...m,household:JSON.stringify(m.household),createdAt:now,updatedAt:now};
      const result = withAudit(db,user,'Daftar ahli','ahli',null,()=>db.prepare(`INSERT INTO members (${columns.join(',')}) VALUES (${columns.map(()=>'?').join(',')})`).run(...columns.map(key=>record[key])));
      return json(res,201,{id:Number(result.lastInsertRowid)});
    }
    const match = path.match(/^\/api\/members\/(\d+)$/);
    const statusMatch=path.match(/^\/api\/members\/(\d+)\/status$/);
    if(statusMatch && req.method==='POST') {
      const input=await body(req), row=db.prepare('SELECT * FROM members WHERE id=?').get(Number(statusMatch[1]));
      if(!row) return json(res,404,{error:'Rekod tidak ditemui.'});
      if(input.expectedUpdatedAt!==row.updatedAt) return json(res,409,{error:'Rekod telah berubah. Muat semula direktori dan cuba lagi.'});
      if(typeof input.active!=='boolean' || typeof input.reason!=='string' || input.reason.length>500) return json(res,400,{error:'Maklumat status ahli tidak sah.'});
      const now=new Date().toISOString(), isActive=input.active?1:0;
      if(row.isActive!==isActive) withAudit(db,user,isActive?'Aktifkan ahli':'Nyahaktif ahli','ahli',row.id,()=>db.prepare('UPDATE members SET isActive=?,deactivatedAt=?,inactivityReason=?,updatedAt=? WHERE id=?').run(isActive,isActive?'':now,isActive?'':input.reason.trim(),now,row.id));
      return json(res,200,{ok:true});
    }
    if(match && req.method==='DELETE') {
      const input=await body(req), row=db.prepare('SELECT * FROM members WHERE id=?').get(Number(match[1]));
      if(!row) return json(res,404,{error:'Rekod tidak ditemui.'});
      if(input.expectedUpdatedAt!==row.updatedAt || input.expectedName!==row.name) return json(res,409,{error:'Rekod telah berubah. Muat semula direktori dan semak semula sebelum memadam.'});
      if(input.confirmation!=='PADAM') return json(res,400,{error:'Sila taip PADAM untuk mengesahkan pemadaman ahli dan keluarga.'});
      if(!verifyPassword(user,input.password)) return json(res,400,{error:'Kata laluan pentadbir tidak tepat.'});
      const safetyBackup=safetySnapshot('sebelum-padam');
      withAudit(db,user,'Padam ahli','ahli',row.id,()=>db.prepare('DELETE FROM members WHERE id=?').run(row.id));
      return json(res,200,{ok:true,safetyBackup});
    }
    if (match && req.method === 'PUT') {
      const input=await body(req), m = validate(input);
      if(!db.prepare('SELECT id FROM members WHERE id=?').get(Number(match[1]))) return json(res,404,{error:'Rekod tidak ditemui.'});
      if(duplicateWarning(res,m,input,Number(match[1]))) return;
      const columns = ['name','phone','birthDate','gender','occupation','address','household','updatedAt','address1','address2','district','postcode','state','country',...memberDetailFields];
      const record = {...m,household:JSON.stringify(m.household),updatedAt:new Date().toISOString()};
      const result = withAudit(db,user,'Kemas kini ahli / keluarga','ahli',Number(match[1]),()=>db.prepare(`UPDATE members SET ${columns.map(key=>`${key}=?`).join(',')} WHERE id=?`).run(...columns.map(key=>record[key]),Number(match[1])));
      return json(res,result.changes ? 200 : 404,result.changes ? {ok:true} : {error:'Rekod tidak ditemui.'});
    }
    return json(res,404,{error:'Halaman tidak ditemui.'});
  } catch (e) { return json(res,400,{error:e.message === 'Format data tidak sah.' || /^(Data|Maklumat|Sila|Tarikh|Jantina|Maksimum|Lengkapkan|Format|Semakan|Kata laluan)/.test(e.message) ? e.message : 'Permintaan gagal. Sila cuba lagi.'}); }
});
server.listen(Number(process.env.PORT || 3000),process.env.HOST || '127.0.0.1',()=>console.log(`myKampung berjalan pada port ${server.address().port}`));
