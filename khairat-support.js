import {storeDeathCertificate} from './death-certificates.js';
import {createHash} from 'node:crypto';
import {withAudit,audit} from './accounts.js';
import {khairatAmount} from './khairat.js';
export const certificateLimit=5*1024*1024;
export function initializeKhairatSupport(db){
 db.exec(`CREATE TABLE IF NOT EXISTS khairat_types(id INTEGER PRIMARY KEY,code TEXT NOT NULL UNIQUE,name TEXT NOT NULL,amountCents INTEGER NOT NULL CHECK(amountCents>0),isActive INTEGER NOT NULL DEFAULT 1 CHECK(isActive IN(0,1)),updatedAt TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS khairat_documents(claimId INTEGER PRIMARY KEY REFERENCES khairat_claims(id) ON DELETE RESTRICT,fileName TEXT NOT NULL,mimeType TEXT NOT NULL,byteLength INTEGER NOT NULL,sha256 TEXT NOT NULL,data BLOB NOT NULL,uploadedBy INTEGER NOT NULL REFERENCES users(id),uploadedAt TEXT NOT NULL);`);
 for(const [name,type] of [['typeId','INTEGER REFERENCES khairat_types(id)'],['typeName',"TEXT NOT NULL DEFAULT ''"],['typeAmountCents','INTEGER']])if(!db.prepare('PRAGMA table_info(khairat_claims)').all().some(c=>c.name===name))db.exec(`ALTER TABLE khairat_claims ADD COLUMN ${name} ${type}`);
}
export function validateCertificate(input){
 if(!input||typeof input.fileName!=='string'||input.fileName.length>180||/[\x00-\x1f\x7f/\\]/.test(input.fileName)||typeof input.base64!=='string'||input.base64.length>Math.ceil(certificateLimit/3)*4||(input.base64.length%4!==0||!/^[A-Za-z0-9+/]*={0,2}$/.test(input.base64)))throw Error('Sila lampirkan sijil kematian PDF, JPG atau PNG yang sah (maksimum 5 MB).');
 const data=Buffer.from(input.base64,'base64');if(data.toString('base64')!==input.base64||!data.length||data.length>certificateLimit)throw Error('Data sijil kematian mesti antara 1 bait dan 5 MB.');
 let mimeType,ext;if(data.subarray(0,5).toString()==='%PDF-'){mimeType='application/pdf';ext=/\.pdf$/i;}else if(data[0]===255&&data[1]===216&&data[2]===255){mimeType='image/jpeg';ext=/\.jpe?g$/i;}else if(data.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))){mimeType='image/png';ext=/\.png$/i;}
 if(!mimeType||!ext.test(input.fileName)||input.mimeType!==mimeType)throw Error('Format sijil kematian tidak sepadan. Gunakan PDF, JPG atau PNG.');
 return {fileName:input.fileName,mimeType,data,byteLength:data.length,sha256:createHash('sha256').update(data).digest('hex')};
}
export function storeCertificate(db,claimId,certificate,user){db.prepare('INSERT INTO khairat_documents(claimId,fileName,mimeType,byteLength,sha256,data,uploadedBy,uploadedAt) VALUES(?,?,?,?,?,?,?,?)').run(claimId,certificate.fileName,certificate.mimeType,certificate.byteLength,certificate.sha256,certificate.data,user.id,new Date().toISOString());}
export async function khairatSupportRoutes({req,res,path,user,db,json,body,isSessionActive}){
 if(path==='/api/khairat/types'&&req.method==='GET'){json(res,200,db.prepare('SELECT * FROM khairat_types ORDER BY name,id').all());return true;}
 const type=path.match(/^\/api\/khairat\/types(?:\/(\d+))?$/);
 if(type&&['POST','PUT'].includes(req.method)){
  if(user.role!=='admin'){json(res,403,{error:'Pengurusan jenis khairat hanya untuk pentadbir.'});return true;}const input=await body(req);if(!isSessionActive()){json(res,401,{error:'Sila log masuk semula.'});return true;}
  if((req.method==='PUT')!==!!type[1])throw Error('Maklumat laluan katalog tidak sah.');
  const old=type[1]?db.prepare('SELECT * FROM khairat_types WHERE id=?').get(Number(type[1])):null;if(type[1]&&!old){json(res,404,{error:'Jenis khairat tidak ditemui.'});return true;}
  if(old&&old.updatedAt!==input.expectedUpdatedAt){json(res,409,{error:'Katalog berubah. Muat semula sebelum menyimpan.'});return true;}
  if(typeof input.code!=='string'||!/^[A-Z0-9_-]{1,30}$/.test(input.code)||typeof input.name!=='string'||!input.name.trim()||input.name.length>150||![0,1].includes(input.isActive))throw Error('Sila isi kod, nama dan status jenis khairat yang sah.');
  if(old&&input.code!==old.code)throw Error('Maklumat kod khairat tidak boleh ditukar.');const amount=khairatAmount(input.amount),now=new Date(Math.max(Date.now(),old?Date.parse(old.updatedAt)+1:0)).toISOString();
  if(!old&&db.prepare('SELECT id FROM khairat_types WHERE code=?').get(input.code)){json(res,409,{error:'Kod khairat telah digunakan.'});return true;}
  withAudit(db,user,old?'Kemaskini jenis khairat':'Tambah jenis khairat','jenis khairat',old?.id||'',()=>old?db.prepare('UPDATE khairat_types SET name=?,amountCents=?,isActive=?,updatedAt=? WHERE id=?').run(input.name.trim(),amount,input.isActive,now,old.id):db.prepare('INSERT INTO khairat_types(code,name,amountCents,isActive,updatedAt) VALUES(?,?,?,?,?)').run(input.code,input.name.trim(),amount,input.isActive,now));json(res,200,{ok:true});return true;
 }
 const doc=path.match(/^\/api\/khairat\/(\d+)\/certificate$/);
 if(doc&&['GET','POST'].includes(req.method)){
  const row=db.prepare('SELECT * FROM khairat_claims WHERE id=?').get(Number(doc[1]));if(!row){json(res,404,{error:'Tuntutan tidak ditemui.'});return true;}
  const own=()=>user.role!=='ahli'||db.prepare('SELECT householdKey FROM members WHERE id=?').get(user.memberId)?.householdKey===row.householdKey;
  if(!own()){json(res,403,{error:'Dokumen terhad kepada isi rumah sendiri.'});return true;}
  if(req.method==='GET'){const file=db.prepare('SELECT * FROM khairat_documents WHERE claimId=?').get(row.id)||db.prepare('SELECT * FROM death_documents WHERE deathRecordId=?').get(row.deathRecordId);if(!file){json(res,404,{error:'Sijil kematian belum dilampirkan.'});return true;}audit(db,user,'Muat turun sijil kematian','khairat',row.id);res.writeHead(200,{'Content-Type':file.mimeType,'Content-Disposition':`attachment; filename="sijil-kematian-${row.id}.${file.mimeType==='application/pdf'?'pdf':file.mimeType==='image/png'?'png':'jpg'}"; filename*=UTF-8''${encodeURIComponent(file.fileName).replace(/['()*]/g,c=>'%'+c.charCodeAt(0).toString(16))}`,'Content-Length':file.byteLength,'Content-Security-Policy':"sandbox; default-src 'none'",'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(Buffer.from(file.data));return true;}
  const input=await body(req,8*1024*1024);if(!isSessionActive()){json(res,401,{error:'Sila log masuk semula.'});return true;}
  if(!own()){json(res,403,{error:'Akses isi rumah telah berubah.'});return true;}
  const current=db.prepare('SELECT status,updatedAt FROM khairat_claims WHERE id=?').get(row.id);if(!current||!['pending','approved','paid'].includes(current.status)||current.updatedAt!==input.expectedUpdatedAt||db.prepare('SELECT claimId FROM khairat_documents WHERE claimId=?').get(row.id)||db.prepare('SELECT deathRecordId FROM death_documents WHERE deathRecordId=?').get(row.deathRecordId)){json(res,409,{error:'Sijil hanya boleh ditambah kepada tuntutan yang belum mempunyai lampiran. Muat semula rekod.'});return true;}
  const certificate=validateCertificate(input.certificate);withAudit(db,user,'Lampir sijil kematian','khairat',row.id,()=>{storeDeathCertificate(db,row.deathRecordId,certificate,user);db.prepare('UPDATE khairat_claims SET updatedAt=? WHERE id=?').run(new Date().toISOString(),row.id);});json(res,200,{ok:true});return true;
 }
 return false;
}
