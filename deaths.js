import {initializeBurialPermits,burialPermitRoutes,validateBurialPermit,storeBurialPermit} from './burial-permits.js';
import {initializeDeathCertificates,deathCertificateRoutes,storeDeathCertificate} from './death-certificates.js';
import {validateCertificate} from './khairat-support.js';
import {withAudit,verifyPassword} from './accounts.js';
import {notify} from './community.js';
import {todayInMalaysia} from './public/age.js';
export function initializeDeaths(db){db.exec(`CREATE TABLE IF NOT EXISTS death_records(id INTEGER PRIMARY KEY,householdKey TEXT NOT NULL,personKey TEXT NOT NULL,personName TEXT NOT NULL,birthDate TEXT NOT NULL,deathDate TEXT NOT NULL,note TEXT NOT NULL,requestedBy INTEGER NOT NULL REFERENCES users(id),requesterName TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN('pending','approved','rejected')),reviewNote TEXT NOT NULL DEFAULT '',reviewedBy TEXT NOT NULL DEFAULT '',createdAt TEXT NOT NULL,reviewedAt TEXT NOT NULL DEFAULT '');CREATE UNIQUE INDEX IF NOT EXISTS one_open_death_record ON death_records(personKey) WHERE status IN('pending','approved');`);initializeDeathCertificates(db);initializeBurialPermits(db);const columns=new Set(db.prepare('PRAGMA table_info(death_records)').all().map(c=>c.name));for(const name of ['burialZone','gravestoneNumber','burialUpdatedAt','reporterName','reporterRelationship','reporterUpdatedAt'])if(!columns.has(name))db.exec(`ALTER TABLE death_records ADD COLUMN ${name} TEXT NOT NULL DEFAULT ''`);}
export function burialFields(input,previous={}){const result={};for(const [key,label] of [['burialZone','zon kubur'],['gravestoneNumber','nombor batu nisan']]){const value=input[key]===undefined?(previous[key]||''):input[key];if(typeof value!=='string'||value.length>100)throw Error('Maklumat '+label+' mesti teks maksimum 100 aksara.');result[key]=value.trim();}return result;}
export function reporterFields(input,personName){const result={};for(const [key,label,max] of [['reporterName','nama pelapor',200],['reporterRelationship','hubungan pelapor dengan si mati',100]]){const value=input[key];if(typeof value!=='string'||!value.trim()||value.length>max)throw Error('Sila isi '+label+' (maksimum '+max+' aksara).');result[key]=value.trim();}const normalize=value=>value.normalize('NFKC').replace(/\s+/g,' ').trim().toLocaleLowerCase('ms');if(normalize(result.reporterName)===normalize(personName))throw Error('Sila isi nama orang yang melaporkan kematian, bukan nama si mati.');return result;}
export function approvedDeath(db,key){return db.prepare("SELECT deathDate FROM death_records WHERE personKey=? AND status='approved'").get(key);}
export function deceasedAccount(db,memberId){const m=db.prepare('SELECT identityKey FROM members WHERE id=?').get(memberId);return !!m&&!!approvedDeath(db,m.identityKey);}
export function deathLabels(db,m){const label=(p,key)=>{const d=approvedDeath(db,key);return d?{...p,deathDate:d.deathDate}:p;};return {...label(m,m.identityKey),household:m.household.map(p=>label(p,p.personKey))};}
function context(db,id){const m=db.prepare('SELECT * FROM members WHERE id=?').get(id);if(!m)return null;return {memberId:m.id,householdKey:m.householdKey,people:[{personKey:m.identityKey,name:m.name,birthDate:m.birthDate,isHead:true},...JSON.parse(m.household).map(p=>({personKey:p.personKey,name:p.name,birthDate:p.birthDate,isHead:false}))].map(p=>({...p,deathDate:approvedDeath(db,p.personKey)?.deathDate||'',pending:!!db.prepare("SELECT id FROM death_records WHERE personKey=? AND status='pending'").get(p.personKey)}))};}
function currentPerson(db,key,householdKey){for(const m of db.prepare('SELECT * FROM members WHERE householdKey=?').all(householdKey)){if(m.identityKey===key)return {personKey:key,name:m.name,birthDate:m.birthDate,memberId:m.id,isHead:true};const p=JSON.parse(m.household).find(p=>p.personKey===key);if(p)return {...p,memberId:m.id,isHead:false};}return null;}
function pendingChanges(db,id){return db.prepare("SELECT id FROM profile_requests WHERE memberId=? AND status='pending' UNION ALL SELECT id FROM household_head_changes WHERE memberId=? AND status='pending' LIMIT 1").get(id,id);}
export async function deathRoutes({req,res,path,user,db,json,body,revokeSessions,isSessionActive}){
 if(await burialPermitRoutes({req,res,path,user,db,json,body,isSessionActive}))return true;
 if(await deathCertificateRoutes({req,res,path,user,db,json,body,isSessionActive}))return true;
 const match=path.match(/^\/api\/deaths\/context\/(\d+)$/);
 if(match&&req.method==='GET'){const id=Number(match[1]);if(user.role==='ahli'&&id!==user.memberId){json(res,403,{error:'Akses terhad kepada isi rumah sendiri.'});return true;}const c=context(db,id);json(res,c?200:404,c||{error:'Isi rumah tidak ditemui.'});return true;}
 if(path==='/api/deaths'&&req.method==='GET'){let rows;if(user.role==='ahli'){const m=db.prepare('SELECT householdKey FROM members WHERE id=?').get(user.memberId);rows=db.prepare('SELECT * FROM death_records WHERE householdKey=? ORDER BY id DESC').all(m?.householdKey||'');}else rows=db.prepare('SELECT * FROM death_records ORDER BY id DESC').all();json(res,200,rows.map(r=>({...r,certificateName:db.prepare('SELECT fileName FROM death_documents WHERE deathRecordId=?').get(r.id)?.fileName||null,burialPermitName:db.prepare('SELECT fileName FROM death_burial_permits WHERE deathRecordId=?').get(r.id)?.fileName||null})));return true;}
 if(path==='/api/deaths'&&req.method==='POST'){
  const input=await body(req,16*1024*1024);if(!isSessionActive()){json(res,401,{error:'Sila log masuk semula.'});return true;}
  const id=Number(input.memberId);if(user.role==='ahli'&&id!==user.memberId){json(res,403,{error:'Akses terhad kepada isi rumah sendiri.'});return true;}
  const c=context(db,id),p=c?.people.find(p=>p.personKey===input.personKey);if(!p||p.pending||p.deathDate){json(res,409,{error:'Individu tidak ditemui atau rekod kematian sudah dihantar/diluluskan.'});return true;}
  if(pendingChanges(db,id)){json(res,409,{error:'Selesaikan permohonan profil atau pertukaran ketua yang menunggu terlebih dahulu.'});return true;}
  const d=input.deathDate;if(typeof d!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(d)||!Number.isFinite(Date.parse(d))||new Date(d).toISOString().slice(0,10)!==d||d>todayInMalaysia()||(p.birthDate&&d<p.birthDate))throw Error('Tarikh kematian mesti sah, tidak mendahului tarikh lahir dan tidak pada masa hadapan.');
  if(typeof input.note!=='string'||!input.note.trim()||input.note.length>1000||input.confirm!==true)throw Error('Sila isi catatan (maksimum 1,000 aksara) dan sahkan maklumat kematian.');
  const burial=burialFields(input),reporter=reporterFields(input,p.name);
  const certificate=input.certificate?validateCertificate(input.certificate):null;
  const permit=input.burialPermit?validateBurialPermit(input.burialPermit):null;
  const r=withAudit(db,user,'Mohon rekod kematian','individu',p.personKey,()=>{const r=db.prepare('INSERT INTO death_records(householdKey,personKey,personName,birthDate,deathDate,note,requestedBy,requesterName,createdAt,burialZone,gravestoneNumber,reporterName,reporterRelationship) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)').run(c.householdKey,p.personKey,p.name,p.birthDate||'',d,input.note.trim(),user.id,user.fullName,new Date().toISOString(),burial.burialZone,burial.gravestoneNumber,reporter.reporterName,reporter.reporterRelationship);if(certificate)storeDeathCertificate(db,Number(r.lastInsertRowid),certificate,user);if(permit)storeBurialPermit(db,Number(r.lastInsertRowid),permit,user);notify(db,{admin:true,title:'Permohonan rekod kematian',body:p.name});return r;});json(res,202,{id:Number(r.lastInsertRowid),status:'pending'});return true;
 }
 const reporter=path.match(/^\/api\/deaths\/(\d+)\/reporter$/);
 if(reporter&&req.method==='POST'){
  if(user.role!=='admin'){json(res,403,{error:'Hanya pentadbir boleh membetulkan maklumat pelapor.'});return true;}
  const input=await body(req);if(!isSessionActive()||!db.prepare("SELECT id FROM users WHERE id=? AND role='admin' AND isActive=1").get(user.id)){json(res,401,{error:'Sila log masuk semula.'});return true;}
  const row=db.prepare('SELECT * FROM death_records WHERE id=?').get(Number(reporter[1]));if(!row){json(res,404,{error:'Rekod kematian tidak ditemui.'});return true;}
  if(!['pending','approved'].includes(row.status)){json(res,409,{error:'Maklumat pelapor hanya boleh dibetulkan pada rekod menunggu atau diluluskan.'});return true;}
  if(input.expectedUpdatedAt!==row.reporterUpdatedAt){json(res,409,{error:'Maklumat pelapor telah berubah. Muat semula sebelum menyimpan.'});return true;}
  const values=reporterFields(input,row.personName);if(values.reporterName===row.reporterName&&values.reporterRelationship===row.reporterRelationship){json(res,200,{ok:true});return true;}
  const now=new Date(Math.max(Date.now(),(Date.parse(row.reporterUpdatedAt)||0)+1)).toISOString();
  withAudit(db,user,'Betulkan maklumat pelapor kematian','rekod kematian',row.id,()=>db.prepare('UPDATE death_records SET reporterName=?,reporterRelationship=?,reporterUpdatedAt=? WHERE id=?').run(values.reporterName,values.reporterRelationship,now,row.id),JSON.stringify({sebelum:{nama:row.reporterName,hubungan:row.reporterRelationship},selepas:{nama:values.reporterName,hubungan:values.reporterRelationship}}));json(res,200,{ok:true});return true;
 }
 const burial=path.match(/^\/api\/deaths\/(\d+)\/burial$/);
 if(burial&&req.method==='POST'){
  if(user.role!=='admin'){json(res,403,{error:'Hanya pentadbir boleh mengemas kini maklumat perkuburan.'});return true;}
  const input=await body(req);if(!isSessionActive()){json(res,401,{error:'Sila log masuk semula.'});return true;}
  const row=db.prepare('SELECT * FROM death_records WHERE id=?').get(Number(burial[1]));if(!row){json(res,404,{error:'Rekod kematian tidak ditemui.'});return true;}
  if(!['pending','approved'].includes(row.status)){json(res,409,{error:'Maklumat perkuburan hanya boleh dikemas kini pada rekod menunggu atau diluluskan.'});return true;}
  if(input.expectedUpdatedAt!==row.burialUpdatedAt){json(res,409,{error:'Maklumat perkuburan telah berubah. Muat semula sebelum menyimpan.'});return true;}
  const values=burialFields(input,row);if(values.burialZone===row.burialZone&&values.gravestoneNumber===row.gravestoneNumber){json(res,200,{ok:true});return true;}
  const now=new Date(Math.max(Date.now(),(Date.parse(row.burialUpdatedAt)||0)+1)).toISOString();
  withAudit(db,user,'Kemas kini maklumat perkuburan','rekod kematian',row.id,()=>db.prepare('UPDATE death_records SET burialZone=?,gravestoneNumber=?,burialUpdatedAt=? WHERE id=?').run(values.burialZone,values.gravestoneNumber,now,row.id));json(res,200,{ok:true});return true;
 }
 const review=path.match(/^\/api\/deaths\/(\d+)\/review$/);
 if(review&&req.method==='POST'){
  if(user.role!=='admin'){json(res,403,{error:'Hanya pentadbir boleh membuat keputusan.'});return true;}
  const input=await body(req);if(!isSessionActive()){json(res,401,{error:'Sila log masuk semula.'});return true;}
  const r=db.prepare('SELECT * FROM death_records WHERE id=?').get(Number(review[1]));if(!r||r.status!=='pending'){json(res,409,{error:'Permohonan tiada atau telah diproses.'});return true;}
  if(!['approve','reject'].includes(input.decision)||typeof input.reviewNote!=='string'||input.reviewNote.length>1000)throw Error('Maklumat keputusan semakan tidak sah.');
  const approve=input.decision==='approve',note=input.reviewNote.trim(),ids=[];let p;
  if(!approve&&!note)throw Error('Sila nyatakan sebab penolakan.');
  if(approve){const admin=db.prepare("SELECT * FROM users WHERE id=? AND isActive=1 AND role='admin'").get(user.id);if(input.confirm!==true||!verifyPassword(admin,input.currentPassword))throw Error('Sila sahkan kesan kelulusan dan masukkan kata laluan pentadbir semasa yang tepat.');p=currentPerson(db,r.personKey,r.householdKey);if(!p||p.name!==r.personName||(p.birthDate||'')!==r.birthDate||pendingChanges(db,p.memberId)){json(res,409,{error:'Profil/isi rumah telah berubah atau ada permohonan tertangguh. Tolak dan hantar semula selepas semakan.'});return true;}if(p.isHead)ids.push(...db.prepare("SELECT id FROM users WHERE role='ahli' AND memberId=?").all(p.memberId).map(u=>u.id));}
  withAudit(db,user,approve?'Lulus rekod kematian':'Tolak rekod kematian','rekod kematian',r.id,()=>{const now=new Date().toISOString();db.prepare('UPDATE death_records SET status=?,reviewNote=?,reviewedBy=?,reviewedAt=? WHERE id=?').run(approve?'approved':'rejected',note,user.username,now,r.id);for(const id of ids)db.prepare('UPDATE users SET isActive=0,updatedAt=? WHERE id=?').run(now,id);notify(db,{userId:r.requestedBy,title:approve?'Rekod kematian diluluskan':'Rekod kematian ditolak',body:note||r.personName});if(approve&&p.isHead)notify(db,{admin:true,title:'Ketua isi rumah meninggal dunia',body:`Isi rumah #${p.memberId}: urus pertukaran ketua secara berasingan. Rekod keluarga/bantuan dikekalkan.`});});for(const id of ids)revokeSessions(id);json(res,200,{ok:true,disabledAccounts:ids.length});return true;
 }
 return false;
}
