import http from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { migrateAddress, migrateMemberDetails } from './migrations.js';
import { formatAddress } from './public/address.js';
import { normalizeEducation } from './public/education.js';
import { normalizeMemberDetails, memberDetailFields } from './public/member-details.js';
import { memberColumns, digest, duplicateMatches, createBackup, readBackup } from './data-tools.js';

const root = fileURLToPath(new URL('.', import.meta.url));
const data = process.env.DATA_DIR || join(root, 'data');
mkdirSync(data, { recursive: true, mode: 0o700 });
const db = new DatabaseSync(join(data, 'kampung.sqlite'));
db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS admin (id INTEGER PRIMARY KEY CHECK(id=1), salt TEXT NOT NULL, hash TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS members (id INTEGER PRIMARY KEY, name TEXT NOT NULL, phone TEXT NOT NULL, birthDate TEXT NOT NULL DEFAULT '', gender TEXT NOT NULL DEFAULT '', occupation TEXT NOT NULL DEFAULT '', address TEXT NOT NULL, household TEXT NOT NULL, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL);`);
migrateAddress(db);
migrateMemberDetails(db);
if (!db.prepare('SELECT id FROM admin').get() && process.env.ADMIN_PASSWORD) {
  if (process.env.ADMIN_PASSWORD.length < 12) throw Error('ADMIN_PASSWORD perlu sekurang-kurangnya 12 aksara.');
  const salt = randomBytes(16).toString('hex');
  db.prepare('INSERT INTO admin VALUES (1,?,?)').run(salt, scryptSync(process.env.ADMIN_PASSWORD, salt, 64).toString('hex'));
}
const sessions = new Map(), attempts = new Map(), restorePreviews = new Map();
const allMembers = () => db.prepare('SELECT * FROM members ORDER BY id DESC').all().map(x=>({...x,household:JSON.parse(x.household)}));
function duplicateWarning(res, member, input, excludedId) {
  const matches=duplicateMatches(member,allMembers(),excludedId);
  const confirmation=digest({member,matches});
  if (matches.length && input.duplicateConfirmation!==confirmation) {
    json(res,409,{error:'Rekod yang serupa ditemui. Semak sebelum menyimpan sebagai rekod berasingan.',code:'DUPLICATE',matches,confirmation});
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
  return {name, phone, address, ...addressParts, ...normalizeMemberDetails(input), birthDate:date(input.birthDate), gender, occupation:text(input.occupation || ''), household};
}
const staticFiles = {'/':['index.html','text/html'], '/app.js':['app.js','text/javascript'], '/age.js':['age.js','text/javascript'], '/address.js':['address.js','text/javascript'], '/education.js':['education.js','text/javascript'], '/member-details.js':['member-details.js','text/javascript'], '/style.css':['style.css','text/css']};
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
      const input = await body(req), admin = db.prepare('SELECT * FROM admin').get();
      if (!admin) return json(res,503,{error:'Pentadbir belum disediakan. Tetapkan ADMIN_PASSWORD pada pelayan.'});
      const password = typeof input.password === 'string' && input.password.length <= 1000 ? input.password : '';
      if (!timingSafeEqual(scryptSync(password,admin.salt,64),Buffer.from(admin.hash,'hex'))) {
        attempts.set(key,{count:rate && rate.until > now ? rate.count+1 : 1,until:rate && rate.until > now ? rate.until : now+900000});
        return json(res,401,{error:'Kata laluan tidak tepat.'});
      }
      attempts.delete(key);
      for (const [k,v] of sessions) if (v < now) sessions.delete(k);
      const token = randomBytes(32).toString('hex'); sessions.set(token,now+8*3600000);
      res.setHeader('Set-Cookie',`session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${process.env.COOKIE_SECURE === '1' ? '; Secure' : ''}`);
      return json(res,200,{ok:true});
    }
    const token = (req.headers.cookie || '').split(';').map(x=>x.trim()).find(x=>x.startsWith('session='))?.slice(8);
    if (!token || (sessions.get(token) || 0) <= Date.now()) return json(res,401,{error:'Sila log masuk.'});
    if (path === '/api/session' && req.method === 'GET') return json(res,200,{ok:true});
    if (path === '/api/logout' && req.method === 'POST') { sessions.delete(token); restorePreviews.delete(token); res.setHeader('Set-Cookie','session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'); return json(res,200,{ok:true}); }
    if (path === '/api/members' && req.method === 'GET') return json(res,200,allMembers());
    if (path === '/api/backup' && req.method === 'GET') {
      res.setHeader('Content-Disposition',`attachment; filename="myKampung-sandaran-${new Date().toISOString().replace(/[:.]/g,'-')}.json"`);
      return json(res,200,createBackup(allMembers()));
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
      const admin=db.prepare('SELECT * FROM admin').get();
      if (typeof input.password!=='string' || input.password.length>1000 || !timingSafeEqual(scryptSync(input.password,admin.salt,64),Buffer.from(admin.hash,'hex'))) {
        restorePreviews.delete(token);
        return json(res,400,{error:'Kata laluan tidak tepat. Pilih fail semula untuk mencuba.'});
      }
      if (input.confirmation!=='PULIHKAN') return json(res,400,{error:'Sila taip PULIHKAN untuk mengesahkan penggantian data.'});
      if (digest(allMembers())!==preview.current) { restorePreviews.delete(token); return json(res,409,{error:'Data telah berubah sejak pratonton. Pilih fail semula untuk menyemak keadaan terkini.'}); }
      const backupDir=join(data,'backups'); mkdirSync(backupDir,{recursive:true,mode:0o700});
      const safetyBackup=`sebelum-pemulihan-${Date.now()}-${randomBytes(4).toString('hex')}.json`;
      writeFileSync(join(backupDir,safetyBackup),JSON.stringify(createBackup(allMembers())),{mode:0o600,flag:'wx'});
      db.exec('BEGIN IMMEDIATE');
      try {
        db.exec('DELETE FROM members');
        const insert=db.prepare(`INSERT INTO members (${memberColumns.join(',')}) VALUES (${memberColumns.map(()=>'?').join(',')})`);
        for(const member of preview.records) insert.run(...memberColumns.map(key=>key==='household'?JSON.stringify(member.household):member[key]));
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
      const result = db.prepare(`INSERT INTO members (${columns.join(',')}) VALUES (${columns.map(()=>'?').join(',')})`).run(...columns.map(key=>record[key]));
      return json(res,201,{id:Number(result.lastInsertRowid)});
    }
    const match = path.match(/^\/api\/members\/(\d+)$/);
    if (match && req.method === 'PUT') {
      const input=await body(req), m = validate(input);
      if(!db.prepare('SELECT id FROM members WHERE id=?').get(Number(match[1]))) return json(res,404,{error:'Rekod tidak ditemui.'});
      if(duplicateWarning(res,m,input,Number(match[1]))) return;
      const columns = ['name','phone','birthDate','gender','occupation','address','household','updatedAt','address1','address2','district','postcode','state','country',...memberDetailFields];
      const record = {...m,household:JSON.stringify(m.household),updatedAt:new Date().toISOString()};
      const result = db.prepare(`UPDATE members SET ${columns.map(key=>`${key}=?`).join(',')} WHERE id=?`).run(...columns.map(key=>record[key]),Number(match[1]));
      return json(res,result.changes ? 200 : 404,result.changes ? {ok:true} : {error:'Rekod tidak ditemui.'});
    }
    return json(res,404,{error:'Halaman tidak ditemui.'});
  } catch (e) { return json(res,400,{error:e.message === 'Format data tidak sah.' || /^(Data|Maklumat|Sila|Tarikh|Jantina|Maksimum|Lengkapkan|Format|Semakan)/.test(e.message) ? e.message : 'Permintaan gagal. Sila cuba lagi.'}); }
});
server.listen(Number(process.env.PORT || 3000),process.env.HOST || '127.0.0.1',()=>console.log(`myKampung berjalan pada port ${server.address().port}`));
