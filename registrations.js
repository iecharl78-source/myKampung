import { randomBytes } from 'node:crypto';
import { memberColumns,digest,duplicateMatches } from './data-tools.js';
import { audit,withAudit } from './accounts.js';

export const registrationColumns=['id','reference','submissionKey','data','status','reviewNote','reviewedBy','reviewedAt','memberId','consentedAt','createdAt','updatedAt'];
const limits=new Map();
const submissionLimit=Number(process.env.REGISTRATION_MAX_PER_HOUR || 20);
if(!Number.isSafeInteger(submissionLimit) || submissionLimit<1 || submissionLimit>1000)throw Error('REGISTRATION_MAX_PER_HOUR mesti antara 1 dan 1,000.');
function permit(key,max,period) {
  const now=Date.now();for(const [k,v] of limits)if(v.until<now)limits.delete(k);
  const value=limits.get(key)||{count:0,until:now+period};
  if(value.count>=max || (!limits.has(key) && limits.size>=10000))return false;
  value.count++;limits.set(key,value);return true;
}
export function initializeRegistrations(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS registrations (
    id INTEGER PRIMARY KEY,reference TEXT NOT NULL UNIQUE,submissionKey TEXT NOT NULL UNIQUE,data TEXT NOT NULL,
    status TEXT NOT NULL CHECK(status IN ('pending','approved','rejected')),reviewNote TEXT NOT NULL DEFAULT '',reviewedBy TEXT NOT NULL DEFAULT '',reviewedAt TEXT NOT NULL DEFAULT '',
    memberId INTEGER REFERENCES members(id) ON DELETE SET NULL,consentedAt TEXT NOT NULL,createdAt TEXT NOT NULL,updatedAt TEXT NOT NULL);`);
}
export function registrationData(input,validate) {
  const data=validate({...input,isActive:1,deactivatedAt:'',inactivityReason:''});
  if(!data.employmentStatus || data.household.some(person=>!person.employmentStatus))throw Error('Sila lengkapkan status pekerjaan ahli dan semua ahli keluarga.');
  return data;
}
export function readRegistrations(input,members,validate) {
  if(input.version<4)return [];
  const ids=new Set(),refs=new Set(),keys=new Set(),memberIds=new Set(members.map(m=>m.id));
  return input.registrations.map(row=>{
    if(!row || !Number.isSafeInteger(row.id) || row.id<=0 || ids.has(row.id) || !/^MK-[a-f0-9]{16}$/.test(row.reference) || refs.has(row.reference) || !/^[a-f0-9]{64}$/.test(row.submissionKey) || keys.has(row.submissionKey) || !['pending','approved','rejected'].includes(row.status))throw Error('Maklumat sandaran permohonan tidak sah.');
    for(const key of ['consentedAt','createdAt','updatedAt'])if(typeof row[key]!=='string' || !Number.isFinite(Date.parse(row[key])))throw Error('Tarikh sandaran permohonan tidak sah.');
    if(typeof row.reviewNote!=='string' || row.reviewNote.length>1000 || typeof row.reviewedBy!=='string' || row.reviewedBy.length>100 || typeof row.reviewedAt!=='string' || (row.reviewedAt && !Number.isFinite(Date.parse(row.reviewedAt))))throw Error('Maklumat semakan sandaran permohonan tidak sah.');
    if(row.memberId!==null && (!Number.isSafeInteger(row.memberId) || !memberIds.has(row.memberId) || row.status!=='approved'))throw Error('Maklumat pautan ahli permohonan tidak sah.');
    ids.add(row.id);refs.add(row.reference);keys.add(row.submissionKey);
    return {...row,data:registrationData(row.data,validate)};
  });
}
export async function publicRegistrationRoutes({req,res,path,db,json,body,validate,clientIp}) {
  if(path==='/api/registrations' && req.method==='POST') {
    const input=await body(req);
    if(!input || !/^[a-f0-9]{64}$/.test(input.submissionKey) || input.consent!==true)throw Error('Sila sahkan persetujuan dan maklumat permohonan.');
    const data=registrationData(input.data,validate);
    const existing=db.prepare('SELECT * FROM registrations WHERE submissionKey=?').get(input.submissionKey);
    if(existing) {
      if(digest(JSON.parse(existing.data))!==digest(data)){json(res,409,{error:'Permohonan asal telah dihantar. Semak rujukan asal atau mulakan borang baharu.'});return true;}
      json(res,200,{reference:existing.reference,status:existing.status});return true;
    }
    if(!permit('submit:'+clientIp,submissionLimit,3600000)) {json(res,429,{error:'Had permohonan sementara dicapai. Cuba lagi selepas satu jam atau hubungi pentadbir.'});return true;}
    if(db.prepare("SELECT count(*) n FROM registrations WHERE status='pending'").get().n>=5000){json(res,503,{error:'Permohonan baharu ditangguhkan sementara. Sila hubungi pentadbir.'});return true;}
    const reference='MK-'+randomBytes(8).toString('hex'),now=new Date().toISOString();
    db.prepare('INSERT INTO registrations (reference,submissionKey,data,status,consentedAt,createdAt,updatedAt) VALUES (?,?,?,\'pending\',?,?,?)').run(reference,input.submissionKey,JSON.stringify(data),now,now,now);
    json(res,201,{reference,status:'pending'});return true;
  }
  if(path==='/api/registration-status' && req.method==='GET') {
    if(!permit('status:'+clientIp,30,60000)){json(res,429,{error:'Terlalu banyak semakan. Cuba lagi sebentar.'});return true;}
    const reference=new URL(req.url,'http://localhost').searchParams.get('reference')||'';
    const row=/^MK-[a-f0-9]{16}$/.test(reference)?db.prepare('SELECT status,reviewNote,createdAt,reviewedAt FROM registrations WHERE reference=?').get(reference):null;
    if(!row){json(res,404,{error:'Rujukan tidak ditemui. Semak kod permohonan anda.'});return true;}
    json(res,200,row);return true;
  }
  return false;
}
export async function registrationRoutes({req,res,path,user,db,json,body,validate}) {
  if(path!=='/api/registrations' && !/^\/api\/registrations\/\d+\/review$/.test(path))return false;
  if(user.role!=='admin'){json(res,403,{error:'Semakan permohonan terhad kepada pentadbir.'});return true;}
  if(path==='/api/registrations' && req.method==='GET') {
    json(res,200,db.prepare('SELECT * FROM registrations ORDER BY id DESC').all().map(({submissionKey,...row})=>({...row,data:JSON.parse(row.data)})));return true;
  }
  const match=path.match(/^\/api\/registrations\/(\d+)\/review$/);
  if(match && req.method==='POST') {
    const input=await body(req),row=db.prepare('SELECT * FROM registrations WHERE id=?').get(Number(match[1]));
    if(!row){json(res,404,{error:'Permohonan tidak ditemui.'});return true;}
    if(row.status!=='pending' || row.updatedAt!==input.expectedUpdatedAt){json(res,409,{error:'Permohonan telah diproses atau berubah. Muat semula senarai.'});return true;}
    if(!['approve','reject'].includes(input.decision) || typeof input.reviewNote!=='string' || input.reviewNote.length>1000)throw Error('Maklumat keputusan semakan tidak sah.');
    const note=input.reviewNote.trim();if(input.decision==='reject' && !note)throw Error('Sila nyatakan sebab permohonan ditolak.');
    const data=registrationData(JSON.parse(row.data),validate),now=new Date().toISOString();
    if(input.decision==='approve') {
      const records=db.prepare('SELECT * FROM members ORDER BY id DESC').all().map(m=>({...m,household:JSON.parse(m.household)})),matches=duplicateMatches(data,records);
      const confirmation=digest({id:row.id,data,matches});
      if(matches.length && input.duplicateConfirmation!==confirmation){json(res,409,{code:'REGISTRATION_DUPLICATE',error:'Rekod ahli atau keluarga serupa ditemui. Semak identiti sebelum meluluskan.',matches,confirmation});return true;}
    }
    let memberId=null;
    withAudit(db,user,input.decision==='approve'?'Lulus permohonan ahli':'Tolak permohonan ahli','permohonan',row.id,()=>{
      if(input.decision==='approve') {
        const columns=memberColumns.filter(key=>key!=='id'),record={...data,household:JSON.stringify(data.household),createdAt:now,updatedAt:now};
        memberId=Number(db.prepare(`INSERT INTO members (${columns.join(',')}) VALUES (${columns.map(()=>'?').join(',')})`).run(...columns.map(key=>record[key])).lastInsertRowid);
        audit(db,user,'Daftar ahli melalui permohonan','ahli',memberId);
      }
      return db.prepare('UPDATE registrations SET status=?,reviewNote=?,reviewedBy=?,reviewedAt=?,memberId=?,updatedAt=? WHERE id=? AND status=\'pending\'').run(input.decision==='approve'?'approved':'rejected',note,user.username,now,memberId,now,row.id);
    });
    json(res,200,{ok:true,memberId});return true;
  }
  json(res,404,{error:'Halaman tidak ditemui.'});return true;
}
