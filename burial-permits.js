import {memberModules} from './access-settings.js';
import {withAudit,audit} from './accounts.js';
import {validateCertificate} from './khairat-support.js';
import {sendCertificate} from './death-certificates.js';
export function initializeBurialPermits(db){db.exec(`CREATE TABLE IF NOT EXISTS death_burial_permits(deathRecordId INTEGER PRIMARY KEY REFERENCES death_records(id) ON DELETE RESTRICT,fileName TEXT NOT NULL,mimeType TEXT NOT NULL,byteLength INTEGER NOT NULL,sha256 TEXT NOT NULL,data BLOB NOT NULL,uploadedBy INTEGER NOT NULL REFERENCES users(id),uploadedAt TEXT NOT NULL);`);}
export function validateBurialPermit(input){try{return validateCertificate(input);}catch(error){throw Error(error.message.replaceAll('sijil kematian','permit kubur'));}}
export function storeBurialPermit(db,id,file,user){return db.prepare('INSERT INTO death_burial_permits(deathRecordId,fileName,mimeType,byteLength,sha256,data,uploadedBy,uploadedAt) VALUES(?,?,?,?,?,?,?,?)').run(id,file.fileName,file.mimeType,file.byteLength,file.sha256,file.data,user.id,new Date().toISOString());}
export async function burialPermitRoutes({req,res,path,user,db,json,body,isSessionActive}){
 const m=path.match(/^\/api\/deaths\/(\d+)\/burial-permit$/);if(!m)return false;
 if(!['GET','POST'].includes(req.method)){json(res,405,{error:'Gunakan GET untuk muat turun atau POST untuk melampirkan permit kubur.'});return true;}
 const allowed=row=>user.role!=='ahli'||db.prepare('SELECT householdKey FROM members WHERE id=?').get(user.memberId)?.householdKey===row.householdKey;
 const row=db.prepare('SELECT * FROM death_records WHERE id=?').get(Number(m[1]));if(!row){json(res,404,{error:'Rekod kematian tidak ditemui.'});return true;}if(!allowed(row)){json(res,403,{error:'Permit kubur terhad kepada isi rumah sendiri.'});return true;}
 if(req.method==='GET'){const file=db.prepare('SELECT * FROM death_burial_permits WHERE deathRecordId=?').get(row.id);if(!file){json(res,404,{error:'Permit kubur belum dilampirkan.'});return true;}audit(db,user,'Muat turun permit kubur','rekod kematian',row.id);sendCertificate(res,file,'permit-kubur');return true;}
 const input=await body(req,8*1024*1024);if(!isSessionActive()){json(res,401,{error:'Sila log masuk semula.'});return true;}
 const account=db.prepare('SELECT role,memberId FROM users WHERE id=?').get(user.id);if(!account||account.role!==user.role||account.memberId!==user.memberId){json(res,401,{error:'Akaun telah berubah. Sila log masuk semula.'});return true;}if(user.role!=='admin'&&!memberModules(db,user).deaths){json(res,403,{error:'Akses modul rekod kematian telah dinyahaktifkan.'});return true;}
 const current=db.prepare('SELECT * FROM death_records WHERE id=?').get(row.id);if(!current||!allowed(current)){json(res,403,{error:'Akses rekod telah berubah.'});return true;}
 if(!['pending','approved'].includes(current.status)||db.prepare('SELECT deathRecordId FROM death_burial_permits WHERE deathRecordId=?').get(row.id)){json(res,409,{error:'Permit kubur hanya boleh ditambah pada rekod menunggu atau diluluskan yang belum mempunyai permit.'});return true;}
 const permit=validateBurialPermit(input.burialPermit);withAudit(db,user,'Lampir permit kubur','rekod kematian',row.id,()=>storeBurialPermit(db,row.id,permit,user));json(res,200,{ok:true});return true;
}
