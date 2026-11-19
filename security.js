import {randomBytes,createHmac,createHash,createCipheriv,createDecipheriv,timingSafeEqual} from 'node:crypto';
import {verifyPassword,withAudit} from './accounts.js';
export function activeSession(session,now=Date.now()){return !!session&&session.expires>now&&session.lastSeen>now-1800000;}
const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
export function base32(bytes){let bits=0,value=0,out='';for(const b of bytes){value=(value<<8)|b;bits+=8;while(bits>=5){out+=alphabet[(value>>>(bits-5))&31];bits-=5;}}if(bits)out+=alphabet[(value<<(5-bits))&31];return out;}
function decode(secret){let bits=0,value=0,out=[];for(const c of secret){value=(value<<5)|alphabet.indexOf(c);bits+=5;if(bits>=8){out.push((value>>>(bits-8))&255);bits-=8;}}return Buffer.from(out);}
export function totp(secret,step){const counter=Buffer.alloc(8);counter.writeBigUInt64BE(BigInt(step));const h=createHmac('sha1',decode(secret)).update(counter).digest(),offset=h[19]&15;return String((h.readUInt32BE(offset)&0x7fffffff)%1000000).padStart(6,'0');}
export function matchingStep(secret,code,last=-1,now=Date.now()){if(typeof code!=='string'||!/^\d{6}$/.test(code))return null;const current=Math.floor(now/30000);for(const step of [current,current-1,current+1])if(step>=0&&step>last&&timingSafeEqual(Buffer.from(code),Buffer.from(totp(secret,step))))return step;return null;}
function encryptionKey(){const value=process.env.MFA_ENCRYPTION_KEY;if(!value)return null;if(!/^[a-fA-F0-9]{64}$/.test(value))throw Error('MFA_ENCRYPTION_KEY perlu 64 aksara heksadesimal.');return Buffer.from(value,'hex');}
function encrypt(secret,id){const iv=randomBytes(12),cipher=createCipheriv('aes-256-gcm',encryptionKey(),iv);cipher.setAAD(Buffer.from(String(id)));return [iv,Buffer.concat([cipher.update(secret,'utf8'),cipher.final()]),cipher.getAuthTag()].map(b=>b.toString('hex')).join('.');}
function decrypt(value,id){const [iv,data,tag]=value.split('.').map(v=>Buffer.from(v,'hex')),d=createDecipheriv('aes-256-gcm',encryptionKey(),iv);d.setAAD(Buffer.from(String(id)));d.setAuthTag(tag);return Buffer.concat([d.update(data),d.final()]).toString();}
const hash=value=>createHash('sha256').update(value).digest('hex');
export function initializeSecurity(db){encryptionKey();db.exec(`CREATE TABLE IF NOT EXISTS user_mfa(userId INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,secret TEXT NOT NULL,lastStep INTEGER NOT NULL,enabledAt TEXT NOT NULL);CREATE TABLE IF NOT EXISTS mfa_pending(userId INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,secret TEXT NOT NULL,expires INTEGER NOT NULL);CREATE TABLE IF NOT EXISTS mfa_recovery(userId INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,hash TEXT NOT NULL,PRIMARY KEY(userId,hash));CREATE TABLE IF NOT EXISTS security_limits(key TEXT PRIMARY KEY,count INTEGER NOT NULL,until INTEGER NOT NULL);`);}
export function securityBlocked(db,key,max=10,now=Date.now()){const r=db.prepare('SELECT * FROM security_limits WHERE key=?').get(hash(key));return !!r&&r.until>now&&r.count>=max;}
export function securityFailure(db,key,now=Date.now()){db.prepare('DELETE FROM security_limits WHERE until<=?').run(now);db.prepare(`INSERT INTO security_limits(key,count,until) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1`).run(hash(key),now+900000);}
export function securityClear(db,key){db.prepare('DELETE FROM security_limits WHERE key=?').run(hash(key));}
export function verifyMfa(db,user,code){const row=db.prepare('SELECT * FROM user_mfa WHERE userId=?').get(user.id);if(!row)return true;if(typeof code!=='string')return false;const normalized=code.replace(/[-\s]/g,'').toUpperCase();if(/^[0-9A-F]{16}$/.test(normalized)){return db.prepare('DELETE FROM mfa_recovery WHERE userId=? AND hash=?').run(user.id,hash(normalized)).changes===1;}try{const step=matchingStep(decrypt(row.secret,user.id),code,row.lastStep);return step!==null&&db.prepare('UPDATE user_mfa SET lastStep=? WHERE userId=? AND lastStep<?').run(step,user.id,step).changes===1;}catch{return false;}}
export async function securityRoutes({req,res,path,user,db,json,body,sessions,token,restorePreviews}){
 if(!path.startsWith('/api/security/'))return false;
 const ownSessions=()=>[...sessions.entries()].filter(([,s])=>s.userId===user.id&&activeSession(s));
 const revokeOthers=()=>{for(const [key] of ownSessions())if(key!==token){sessions.delete(key);restorePreviews.delete(key);}};
 if(path==='/api/security/status'&&req.method==='GET'){json(res,200,{configured:!!encryptionKey(),enabled:!!db.prepare('SELECT userId FROM user_mfa WHERE userId=?').get(user.id),recoveryCodes:db.prepare('SELECT count(*) n FROM mfa_recovery WHERE userId=?').get(user.id).n,idleMinutes:30,sessions:ownSessions().map(([key,s])=>({id:s.id,current:key===token,createdAt:s.createdAt,lastSeen:s.lastSeen,expires:s.expires}))});return true;}
 if(req.method!=='POST'){json(res,404,{error:'Halaman tidak ditemui.'});return true;}
 const input=await body(req),fresh=db.prepare('SELECT * FROM users WHERE id=? AND isActive=1').get(user.id);
 if(!activeSession(sessions.get(token))||sessions.get(token)?.userId!==user.id||!fresh){json(res,401,{error:'Sila log masuk semula.'});return true;}
 const scope='security:'+user.id;if(securityBlocked(db,scope,5)){json(res,429,{error:'Terlalu banyak percubaan keselamatan. Cuba selepas 15 minit.'});return true;}
 if(!verifyPassword(fresh,input.currentPassword)){securityFailure(db,scope);json(res,400,{error:'Kata laluan semasa tidak tepat.'});return true;}
 if(path==='/api/security/sessions/revoke'){const targets=ownSessions().filter(([key,s])=>key!==token&&(input.allOthers===true||s.id===input.sessionId));withAudit(db,user,'Tamatkan sesi lain','akaun',user.id,()=>{for(const [key] of targets){sessions.delete(key);restorePreviews.delete(key);}return {};});json(res,200,{ok:true,revoked:targets.length});return true;}
 if(path==='/api/security/mfa/start'){
  if(!encryptionKey()){json(res,503,{error:'Pentadbir pelayan perlu menyediakan MFA_ENCRYPTION_KEY sebelum mengaktifkan 2FA.'});return true;}
  if(db.prepare('SELECT userId FROM user_mfa WHERE userId=?').get(user.id)){json(res,409,{error:'2FA sudah aktif.'});return true;}
  securityFailure(db,scope);const secret=base32(randomBytes(20));db.prepare('INSERT OR REPLACE INTO mfa_pending(userId,secret,expires) VALUES(?,?,?)').run(user.id,encrypt(secret,user.id),Date.now()+600000);json(res,200,{secret,uri:`otpauth://totp/${encodeURIComponent('myKampung:'+user.username)}?secret=${secret}&issuer=myKampung&algorithm=SHA1&digits=6&period=30`});return true;
 }
 if(path==='/api/security/mfa/confirm'){
  const pending=db.prepare('SELECT * FROM mfa_pending WHERE userId=?').get(user.id);if(!pending||pending.expires<Date.now()||!encryptionKey()){json(res,409,{error:'Persediaan 2FA tamat. Mulakan semula.'});return true;}
  let step=null;try{step=matchingStep(decrypt(pending.secret,user.id),input.code);}catch{}
  if(step===null){securityFailure(db,scope);json(res,400,{error:'Kod pengesahan tidak sah.'});return true;}
  const codes=Array.from({length:10},()=>randomBytes(8).toString('hex').toUpperCase());withAudit(db,user,'Aktifkan 2FA','akaun',user.id,()=>{db.prepare('INSERT INTO user_mfa(userId,secret,lastStep,enabledAt) VALUES(?,?,?,?)').run(user.id,pending.secret,step,new Date().toISOString());for(const c of codes)db.prepare('INSERT INTO mfa_recovery(userId,hash) VALUES(?,?)').run(user.id,hash(c));db.prepare('DELETE FROM mfa_pending WHERE userId=?').run(user.id);return {};});revokeOthers();securityClear(db,scope);json(res,200,{ok:true,recoveryCodes:codes});return true;
 }
 if(path==='/api/security/mfa/disable'){
  if(!verifyMfa(db,user,input.code)){securityFailure(db,scope);json(res,400,{error:'Kod pengesahan atau kod pemulihan tidak sah.'});return true;}
  withAudit(db,user,'Nyahaktif 2FA','akaun',user.id,()=>{for(const table of ['user_mfa','mfa_pending','mfa_recovery'])db.prepare(`DELETE FROM ${table} WHERE userId=?`).run(user.id);return {};});revokeOthers();securityClear(db,scope);json(res,200,{ok:true});return true;
 }
 json(res,404,{error:'Halaman tidak ditemui.'});return true;
}
