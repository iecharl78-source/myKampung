import {initializeKhairatSupport,khairatSupportRoutes,validateCertificate,storeCertificate} from './khairat-support.js';
import {withAudit,verifyPassword} from './accounts.js';
import {notify} from './community.js';
import {todayInMalaysia} from './public/age.js';

export function initializeKhairat(db){
 db.exec(`CREATE TABLE IF NOT EXISTS khairat_claims(
 id INTEGER PRIMARY KEY,deathRecordId INTEGER NOT NULL REFERENCES death_records(id) ON DELETE RESTRICT,
 householdKey TEXT NOT NULL,claimantName TEXT NOT NULL,claimantRelationship TEXT NOT NULL,claimantPhone TEXT NOT NULL,note TEXT NOT NULL,
 requestedBy INTEGER NOT NULL REFERENCES users(id),requesterName TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN('pending','approved','rejected','paid')),
 amountCents INTEGER CHECK(amountCents IS NULL OR (typeof(amountCents)='integer' AND amountCents>0)),
 reviewNote TEXT NOT NULL DEFAULT '',reviewedBy TEXT NOT NULL DEFAULT '',reviewedAt TEXT NOT NULL DEFAULT '',
 paymentDate TEXT NOT NULL DEFAULT '',paymentMethod TEXT NOT NULL DEFAULT '',paymentReference TEXT NOT NULL DEFAULT '',paymentNote TEXT NOT NULL DEFAULT '',paidBy TEXT NOT NULL DEFAULT '',paidAt TEXT NOT NULL DEFAULT '',
 createdAt TEXT NOT NULL,updatedAt TEXT NOT NULL);
 CREATE UNIQUE INDEX IF NOT EXISTS one_open_khairat_claim ON khairat_claims(deathRecordId) WHERE status IN('pending','approved','paid');`);
 initializeKhairatSupport(db);
}
const text=(v,label,max=200)=>{if(typeof v!=='string'||!v.trim()||v.length>max)throw Error(`Sila isi ${label} (maksimum ${max} aksara).`);return v.trim();};
export function khairatAmount(value){if(typeof value!=='string'||!/^\d{1,8}(\.\d{1,2})?$/.test(value))throw Error('Maklumat jumlah khairat mesti dalam RM dengan maksimum dua tempat perpuluhan.');const [whole,fraction='']=value.split('.'),cents=Number(whole)*100+Number(fraction.padEnd(2,'0'));if(cents<=0)throw Error('Maklumat jumlah khairat mesti lebih daripada sifar.');return cents;}
function ownHouse(db,user){return user.role==='ahli'?db.prepare('SELECT householdKey FROM members WHERE id=?').get(user.memberId)?.householdKey:null;}
const joined=`SELECT c.*,d.personName,d.birthDate,d.deathDate,f.fileName certificateName,f.byteLength certificateSize FROM khairat_claims c JOIN death_records d ON d.id=c.deathRecordId LEFT JOIN khairat_documents f ON f.claimId=c.id`;
export async function khairatRoutes({req,res,path,user,db,json,body,isSessionActive}){
 if(await khairatSupportRoutes({req,res,path,user,db,json,body,isSessionActive}))return true;
 if(path==='/api/khairat/options'&&req.method==='GET'){
  const own=ownHouse(db,user);json(res,200,db.prepare(`SELECT d.id,d.personName,d.deathDate,d.householdKey,c.status claimStatus FROM death_records d LEFT JOIN khairat_claims c ON c.deathRecordId=d.id AND c.status IN('pending','approved','paid') WHERE d.status='approved' ${user.role==='ahli'?'AND d.householdKey=?':''} ORDER BY d.id DESC`).all(...(user.role==='ahli'?[own||'']:[])));return true;
 }
 if(path==='/api/khairat'&&req.method==='GET'){
  const own=ownHouse(db,user);json(res,200,db.prepare(joined+(user.role==='ahli'?' WHERE c.householdKey=?':'')+' ORDER BY c.id DESC').all(...(user.role==='ahli'?[own||'']:[])));return true;
 }
 if(path==='/api/khairat'&&req.method==='POST'){
  const input=await body(req,8*1024*1024);if(!isSessionActive()){json(res,401,{error:'Sila log masuk semula.'});return true;}
  const death=db.prepare("SELECT * FROM death_records WHERE id=? AND status='approved'").get(Number(input.deathRecordId));
  if(!death){json(res,400,{error:'Pilih rekod kematian yang telah diluluskan.'});return true;}
  if(user.role==='ahli'&&death.householdKey!==ownHouse(db,user)){json(res,403,{error:'Akses terhad kepada isi rumah sendiri.'});return true;}
  if(db.prepare("SELECT id FROM khairat_claims WHERE deathRecordId=? AND status IN('pending','approved','paid')").get(death.id)){json(res,409,{error:'Tuntutan bagi rekod kematian ini sudah menunggu, diluluskan atau dibayar.'});return true;}
  const name=text(input.claimantName,'nama waris/penerima'),relationship=text(input.claimantRelationship,'hubungan waris dengan si mati',100),phone=text(input.claimantPhone,'telefon waris',30),note=text(input.note,'catatan tuntutan',1000);
  if(!/^[+\d\s()-]{7,30}$/.test(phone)||phone.replace(/\D/g,'').length<7)throw Error('Maklumat telefon waris tidak sah.');
  if(input.confirm!==true)throw Error('Sila sahkan maklumat tuntutan.');
  const type=db.prepare('SELECT * FROM khairat_types WHERE id=? AND isActive=1').get(Number(input.typeId));if(!type)throw Error('Sila pilih jenis khairat aktif yang disediakan pentadbir.');
  const certificate=validateCertificate(input.certificate);
  const now=new Date().toISOString(),r=withAudit(db,user,'Mohon khairat kematian','rekod kematian',death.id,()=>{const result=db.prepare('INSERT INTO khairat_claims(deathRecordId,householdKey,claimantName,claimantRelationship,claimantPhone,note,requestedBy,requesterName,createdAt,updatedAt) VALUES(?,?,?,?,?,?,?,?,?,?)').run(death.id,death.householdKey,name,relationship,phone,note,user.id,user.fullName,now,now);db.prepare('UPDATE khairat_claims SET typeId=?,typeName=?,typeAmountCents=? WHERE id=?').run(type.id,type.name,type.amountCents,result.lastInsertRowid);storeCertificate(db,Number(result.lastInsertRowid),certificate,user);notify(db,{admin:true,title:'Tuntutan khairat menunggu semakan',body:`${death.personName} · Tuntutan #${result.lastInsertRowid}`});return result;});json(res,202,{id:Number(r.lastInsertRowid),status:'pending'});return true;
 }
 const action=path.match(/^\/api\/khairat\/(\d+)\/(review|payment)$/);
 if(action&&req.method==='POST'){
  if(user.role!=='admin'){json(res,403,{error:'Keputusan dan rekod bayaran hanya untuk pentadbir.'});return true;}
  const input=await body(req);if(!isSessionActive()){json(res,401,{error:'Sila log masuk semula.'});return true;}
  const row=db.prepare(joined+' WHERE c.id=?').get(Number(action[1]));if(!row){json(res,404,{error:'Tuntutan tidak ditemui.'});return true;}
  if(row.updatedAt!==input.expectedUpdatedAt){json(res,409,{error:'Tuntutan telah berubah. Muat semula dan semak rekod terkini.'});return true;}
  const now=new Date().toISOString(),admin=db.prepare("SELECT * FROM users WHERE id=? AND role='admin' AND isActive=1").get(user.id);
  if(action[2]==='review'){
   if(row.status!=='pending'){json(res,409,{error:'Tuntutan telah diproses.'});return true;}
   if(!['approve','reject'].includes(input.decision)||typeof input.reviewNote!=='string'||input.reviewNote.length>1000)throw Error('Maklumat keputusan semakan tidak sah.');
   const approve=input.decision==='approve',note=input.reviewNote.trim();if(!approve&&!note)throw Error('Sila nyatakan sebab penolakan.');
   if(approve&&(input.confirm!==true||!verifyPassword(admin,input.currentPassword)))throw Error('Sila sahkan kelulusan dan masukkan kata laluan pentadbir semasa yang tepat.');
   if(approve&&!row.certificateName)throw Error('Sila lampirkan sijil kematian sebelum meluluskan tuntutan.');
   const amount=approve?khairatAmount(input.amount):null;if(approve&&row.typeAmountCents!==null&&amount!==row.typeAmountCents)throw Error('Maklumat jumlah mesti sama dengan kadar jenis khairat pada tuntutan.');
   if(approve&&!db.prepare("SELECT id FROM death_records WHERE id=? AND status='approved' AND householdKey=?").get(row.deathRecordId,row.householdKey)){json(res,409,{error:'Rekod kematian tidak lagi sah untuk tuntutan ini.'});return true;}
   withAudit(db,user,approve?'Lulus khairat kematian':'Tolak khairat kematian','khairat',row.id,()=>{db.prepare('UPDATE khairat_claims SET status=?,amountCents=?,reviewNote=?,reviewedBy=?,reviewedAt=?,updatedAt=? WHERE id=?').run(approve?'approved':'rejected',amount,note,user.username,now,now,row.id);notify(db,{userId:row.requestedBy,title:approve?'Tuntutan khairat diluluskan':'Tuntutan khairat ditolak',body:`Tuntutan #${row.id}${note?' · '+note:''}`});});json(res,200,{ok:true});return true;
  }
  if(row.status!=='approved'){json(res,409,{error:'Hanya tuntutan diluluskan dan belum dibayar boleh direkodkan bayarannya.'});return true;}
  if(input.confirm!==true||!verifyPassword(admin,input.currentPassword))throw Error('Sila sahkan bayaran dan masukkan kata laluan pentadbir semasa yang tepat.');
  const date=input.paymentDate;if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date||date>todayInMalaysia()||date<row.deathDate)throw Error('Tarikh bayaran mesti sah, tidak mendahului tarikh kematian dan tidak pada masa hadapan.');
  if(!['Tunai','Pindahan bank','Cek'].includes(input.paymentMethod))throw Error('Sila pilih kaedah bayaran yang sah.');
  const reference=text(input.paymentReference,'nombor rujukan transaksi/resit',200);if(typeof input.paymentNote!=='string'||input.paymentNote.length>1000)throw Error('Maklumat catatan bayaran tidak sah.');
  withAudit(db,user,'Rekod bayaran khairat','khairat',row.id,()=>{db.prepare("UPDATE khairat_claims SET status='paid',paymentDate=?,paymentMethod=?,paymentReference=?,paymentNote=?,paidBy=?,paidAt=?,updatedAt=? WHERE id=?").run(date,input.paymentMethod,reference,input.paymentNote.trim(),user.username,now,now,row.id);notify(db,{userId:row.requestedBy,title:'Bayaran khairat direkodkan',body:`Tuntutan #${row.id} · ${reference}`});});json(res,200,{ok:true});return true;
 }
 return false;
}
