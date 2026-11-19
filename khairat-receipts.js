import {validateCertificate} from './khairat-support.js';
import {audit} from './accounts.js';
import {sendCertificate} from './death-certificates.js';
export function initializeKhairatReceipts(db){db.exec(`CREATE TABLE IF NOT EXISTS khairat_receipts(claimId INTEGER PRIMARY KEY REFERENCES khairat_claims(id) ON DELETE RESTRICT,fileName TEXT NOT NULL,mimeType TEXT NOT NULL,byteLength INTEGER NOT NULL,sha256 TEXT NOT NULL,data BLOB NOT NULL,uploadedBy INTEGER NOT NULL REFERENCES users(id),uploadedAt TEXT NOT NULL);`);}
export function validateReceipt(input){try{return validateCertificate(input);}catch{throw Error('Sila lampirkan resit bayaran PDF, JPG atau PNG yang sah (maksimum 5 MB).');}}
export function storeReceipt(db,id,file,user){db.prepare('INSERT INTO khairat_receipts(claimId,fileName,mimeType,byteLength,sha256,data,uploadedBy,uploadedAt) VALUES(?,?,?,?,?,?,?,?)').run(id,file.fileName,file.mimeType,file.byteLength,file.sha256,file.data,user.id,new Date().toISOString());}
export function receiptRoute({req,res,path,user,db,json}){
 const m=path.match(/^\/api\/khairat\/(\d+)\/receipt$/);if(!m||req.method!=='GET')return false;
 const row=db.prepare('SELECT * FROM khairat_claims WHERE id=?').get(Number(m[1]));if(!row){json(res,404,{error:'Tuntutan tidak ditemui.'});return true;}
 if(user.role==='ahli'&&db.prepare('SELECT householdKey FROM members WHERE id=?').get(user.memberId)?.householdKey!==row.householdKey){json(res,403,{error:'Resit terhad kepada isi rumah sendiri.'});return true;}
 const file=db.prepare('SELECT * FROM khairat_receipts WHERE claimId=?').get(row.id);if(!file){json(res,404,{error:'Lampiran resit bayaran belum tersedia.'});return true;}
 audit(db,user,'Muat turun resit bayaran','khairat',row.id);sendCertificate(res,file,'resit-bayaran');return true;
}
