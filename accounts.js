import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

export function passwordRecord(password) {
  if(typeof password!=='string' || password.length<12 || password.length>1000) throw Error('Kata laluan perlu antara 12 hingga 1,000 aksara.');
  const salt=randomBytes(16).toString('hex');
  return {salt,hash:scryptSync(password,salt,64).toString('hex')};
}
export function verifyPassword(user,password) {
  if(typeof password!=='string' || password.length>1000) return false;
  const hash=scryptSync(password,user?.salt || 'myKampung-invalid-user',64);
  return timingSafeEqual(hash,user ? Buffer.from(user.hash,'hex') : Buffer.alloc(64)) && Boolean(user);
}
export function publicUser(user) {
  return {id:user.id,username:user.username,fullName:user.fullName,role:user.role,isActive:user.isActive,createdAt:user.createdAt};
}
export function initializeAccounts(db,initialPassword) {
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY, username TEXT NOT NULL UNIQUE COLLATE NOCASE, fullName TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin','petugas')), isActive INTEGER NOT NULL DEFAULT 1 CHECK(isActive IN (0,1)),
      salt TEXT NOT NULL, hash TEXT NOT NULL, createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY, actorId INTEGER NOT NULL, actorName TEXT NOT NULL, action TEXT NOT NULL,
      targetType TEXT NOT NULL, targetId TEXT NOT NULL, summary TEXT NOT NULL, createdAt TEXT NOT NULL);`);
    const legacyExists=db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='admin'").get();
    if(!db.prepare('SELECT id FROM users LIMIT 1').get()) {
      const legacy=legacyExists ? db.prepare('SELECT * FROM admin WHERE id=1').get() : null;
      const credentials=legacy || (initialPassword ? passwordRecord(initialPassword) : null);
      if(credentials) {
        const now=new Date().toISOString();
        db.prepare('INSERT INTO users (username,fullName,role,salt,hash,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?)').run('admin','Pentadbir Utama','admin',credentials.salt,credentials.hash,now,now);
      }
    }
    // Elakkan hash kata laluan lama kekal selepas akaun dinaik taraf.
    if(legacyExists) db.exec('DROP TABLE admin');
    db.exec('COMMIT');
  } catch(error) { db.exec('ROLLBACK'); throw error; }
}
export function audit(db,user,action,targetType,targetId,summary='') {
  db.prepare('INSERT INTO audit_log (actorId,actorName,action,targetType,targetId,summary,createdAt) VALUES (?,?,?,?,?,?,?)').run(user.id,user.username,action,targetType,String(targetId ?? ''),summary,new Date().toISOString());
}
export function withAudit(db,user,action,targetType,targetId,operation,summary='') {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result=operation();
    audit(db,user,action,targetType,targetId ?? result.lastInsertRowid,summary);
    db.exec('COMMIT'); return result;
  } catch(error) { db.exec('ROLLBACK'); throw error; }
}

export async function accountRoutes({req,res,path,user,db,json,body,revokeSessions}) {
  if(path==='/api/password' && req.method==='POST') {
    const input=await body(req);
    if(!verifyPassword(user,input.currentPassword)) { json(res,400,{error:'Kata laluan semasa tidak tepat.'});return true; }
    const credentials=passwordRecord(input.newPassword);
    if(verifyPassword(user,input.newPassword)) { json(res,400,{error:'Sila gunakan kata laluan baharu yang berbeza.'});return true; }
    withAudit(db,user,'Tukar kata laluan','akaun',user.id,()=>db.prepare('UPDATE users SET salt=?,hash=?,updatedAt=? WHERE id=?').run(credentials.salt,credentials.hash,new Date().toISOString(),user.id));
    revokeSessions(user.id);
    res.setHeader('Set-Cookie','session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
    json(res,200,{ok:true});return true;
  }
  if(!path.startsWith('/api/users') && path!=='/api/audit') return false;
  if(user.role!=='admin') { json(res,403,{error:'Akses ini terhad kepada pentadbir.'});return true; }
  if(path==='/api/users' && req.method==='GET') {
    json(res,200,db.prepare('SELECT * FROM users ORDER BY id').all().map(publicUser));return true;
  }
  if(path==='/api/audit' && req.method==='GET') {
    const page=Number(new URL(req.url,'http://localhost').searchParams.get('page') || '1');
    if(!Number.isSafeInteger(page) || page<1 || page>1000000) { json(res,400,{error:'Maklumat halaman tidak sah.'});return true; }
    const total=db.prepare('SELECT count(*) AS total FROM audit_log').get().total;
    const rows=db.prepare('SELECT * FROM audit_log ORDER BY id DESC LIMIT 50 OFFSET ?').all((page-1)*50);
    json(res,200,{rows,total,page});return true;
  }
  if(path==='/api/users' && req.method==='POST') {
    const input=await body(req);
    if(typeof input.username!=='string' || !/^[a-zA-Z0-9_.-]{3,40}$/.test(input.username)) throw Error('Sila masukkan nama pengguna 3–40 aksara: huruf, nombor, titik, sengkang atau garis bawah.');
    if(typeof input.fullName!=='string' || !input.fullName.trim() || input.fullName.length>200) throw Error('Sila masukkan nama petugas yang sah.');
    if(!['admin','petugas'].includes(input.role)) throw Error('Sila pilih peranan akaun yang sah.');
    const username=input.username.toLowerCase();
    if(db.prepare('SELECT id FROM users WHERE username=?').get(username)) { json(res,409,{error:'Nama pengguna telah digunakan.'});return true; }
    const credentials=passwordRecord(input.password),now=new Date().toISOString();
    const result=withAudit(db,user,'Cipta akaun','akaun',null,()=>db.prepare('INSERT INTO users (username,fullName,role,salt,hash,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?)').run(username,input.fullName.trim(),input.role,credentials.salt,credentials.hash,now,now),`Peranan: ${input.role}`);
    json(res,201,{id:Number(result.lastInsertRowid)});return true;
  }
  const match=path.match(/^\/api\/users\/(\d+)\/(status|password)$/);
  if(match && req.method==='POST') {
    const input=await body(req),target=db.prepare('SELECT * FROM users WHERE id=?').get(Number(match[1]));
    if(!target) { json(res,404,{error:'Akaun tidak ditemui.'});return true; }
    if(!verifyPassword(user,input.currentPassword)) { json(res,400,{error:'Kata laluan pentadbir semasa tidak tepat.'});return true; }
    if(match[2]==='status') {
      if(typeof input.active!=='boolean') throw Error('Maklumat status akaun tidak sah.');
      if(target.id===user.id && !input.active) { json(res,400,{error:'Anda tidak boleh menyahaktifkan akaun sendiri.'});return true; }
      if(!input.active && target.role==='admin' && db.prepare("SELECT count(*) AS n FROM users WHERE role='admin' AND isActive=1").get().n<=1) { json(res,400,{error:'Sekurang-kurangnya seorang pentadbir aktif diperlukan.'});return true; }
      withAudit(db,user,input.active?'Aktifkan akaun':'Nyahaktif akaun','akaun',target.id,()=>db.prepare('UPDATE users SET isActive=?,updatedAt=? WHERE id=?').run(input.active?1:0,new Date().toISOString(),target.id));
    } else {
      if(target.id===user.id) { json(res,400,{error:'Gunakan Tukar kata laluan untuk akaun sendiri.'});return true; }
      const credentials=passwordRecord(input.newPassword);
      withAudit(db,user,'Tetap semula kata laluan','akaun',target.id,()=>db.prepare('UPDATE users SET salt=?,hash=?,updatedAt=? WHERE id=?').run(credentials.salt,credentials.hash,new Date().toISOString(),target.id));
    }
    revokeSessions(target.id);json(res,200,{ok:true});return true;
  }
  json(res,404,{error:'Halaman tidak ditemui.'});return true;
}
