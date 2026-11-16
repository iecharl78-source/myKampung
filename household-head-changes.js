import {withAudit,verifyPassword} from './accounts.js';
import {notify} from './community.js';
import {memberDetailFields} from './public/member-details.js';
import {residentFields} from './public/resident-fields.js';
import {normalizeFamilyResidence} from './public/family-residence.js';
import {duplicateMatches,digest} from './data-tools.js';
import {todayInMalaysia} from './public/age.js';
export const relationships=['Pasangan','Anak','Ibu','Bapa','Penjaga','Lain-lain'];
export function initializeHeadChanges(db){
 db.exec(`CREATE TABLE IF NOT EXISTS household_head_changes(id INTEGER PRIMARY KEY,householdKey TEXT NOT NULL,memberId INTEGER REFERENCES members(id) ON DELETE SET NULL,requestedBy INTEGER NOT NULL REFERENCES users(id),requesterName TEXT NOT NULL,baseUpdatedAt TEXT NOT NULL,oldIdentityKey TEXT NOT NULL,candidateKey TEXT NOT NULL,oldHeadName TEXT NOT NULL,newHeadName TEXT NOT NULL,effectiveDate TEXT NOT NULL,reason TEXT NOT NULL,proposal TEXT NOT NULL,beforeSnapshot TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN('pending','approved','rejected')),reviewNote TEXT NOT NULL DEFAULT '',reviewedBy TEXT NOT NULL DEFAULT '',createdAt TEXT NOT NULL,reviewedAt TEXT NOT NULL DEFAULT '');
 CREATE UNIQUE INDEX IF NOT EXISTS pending_household_head_change ON household_head_changes(householdKey) WHERE status='pending';`);
}
export function pendingHeadChange(db,memberId){return db.prepare("SELECT id FROM household_head_changes WHERE memberId=? AND status='pending'").get(memberId);}
function otherPending(db,memberId){return db.prepare("SELECT id FROM profile_requests WHERE memberId=? AND status='pending' UNION ALL SELECT id FROM aid_requests WHERE memberId=? AND status='pending' LIMIT 1").get(memberId,memberId);}
function memberRow(db,id){const raw=db.prepare('SELECT * FROM members WHERE id=?').get(id);return raw?{...raw,household:JSON.parse(raw.household)}:null;}
function authorizedMember(user,id){return user.role!=='ahli'||user.memberId===id;}
function compose(member,input,validate){
 const selected=member.household.find(p=>p.personKey===input.candidateKey);
 if(!selected||selected.livesWithMember!=='Ya')throw Error('Sila pilih ahli keluarga yang telah disahkan tinggal bersama ahli utama.');
 if(!selected.employmentStatus)throw Error('Sila lengkapkan status pekerjaan calon dalam profil terlebih dahulu.');
 if(!Array.isArray(input.relationships))throw Error('Sila lengkapkan hubungan keluarga dengan ketua baharu.');
 const oldResidence=normalizeFamilyResidence(input.oldResidence||{});if(!oldResidence.livesWithMember)throw Error('Sila tentukan sama ada ketua lama masih tinggal bersama.');
 const oldFamily={personKey:member.identityKey,name:member.name,birthDate:member.birthDate,employmentStatus:member.employmentStatus,educationLevel:member.employmentStatus==='Pelajar'?member.educationLevel:'',studyLevel:member.employmentStatus==='Pelajar'?member.studyLevel:'',...Object.fromEntries(residentFields.map(k=>[k,member[k]||''])),...oldResidence};
 const remaining=[oldFamily,...member.household.filter(p=>p.personKey!==selected.personKey)];
 const map=new Map();for(const r of input.relationships){if(!r||typeof r.personKey!=='string'||map.has(r.personKey)||!relationships.includes(r.relationship))throw Error('Sila semak hubungan setiap ahli keluarga dengan ketua baharu.');map.set(r.personKey,r.relationship);}
 if(map.size!==remaining.length||remaining.some(p=>!map.has(p.personKey)))throw Error('Sila lengkapkan hubungan bagi ketua lama dan semua ahli keluarga yang kekal.');
 const clean={...member,...Object.fromEntries(memberDetailFields.map(k=>[k,''])),...Object.fromEntries(residentFields.map(k=>[k,selected[k]||''])),...Object.fromEntries(['zoneCode','housingTypeCode','houseReference','latitude','longitude'].map(k=>[k,member[k]||''])),name:selected.name,phone:input.newPhone,gender:input.newGender||'',birthDate:selected.birthDate,employmentStatus:selected.employmentStatus,educationLevel:selected.educationLevel||'',studyLevel:selected.studyLevel||'',occupation:'',household:remaining.map(p=>({...p,relationship:map.get(p.personKey)}))};
 return validate(clean);
}
function view(row,user){const {proposal,beforeSnapshot,oldIdentityKey,candidateKey,...rest}=row;return {...rest,proposal:JSON.parse(proposal),...(user.role==='admin'?{beforeSnapshot:JSON.parse(beforeSnapshot)}:{})};}
export async function headChangeRoutes({req,res,path,user,db,json,body,validate,revokeSessions,isSessionActive}){
 const context=path.match(/^\/api\/households\/(\d+)\/head-context$/);
 if(context&&req.method==='GET'){
  const id=Number(context[1]);if(!authorizedMember(user,id)){json(res,403,{error:'Akses terhad kepada isi rumah sendiri.'});return true;}
  const member=memberRow(db,id);if(!member){json(res,404,{error:'Isi rumah tidak ditemui.'});return true;}
  json(res,200,{member:{id:member.id,name:member.name,personKey:member.identityKey,householdKey:member.householdKey,isActive:member.isActive,updatedAt:member.updatedAt,address:member.address},family:member.household,pending:!!pendingHeadChange(db,id),otherPending:!!otherPending(db,id)});return true;
 }
 if(path==='/api/head-changes'&&req.method==='GET'){
  const params=new URL(req.url,'http://localhost').searchParams,memberId=Number(params.get('memberId'));
  if(user.role==='ahli'&&memberId&&memberId!==user.memberId){json(res,403,{error:'Akses terhad kepada isi rumah sendiri.'});return true;}
  const target=user.role==='ahli'?user.memberId:memberId;
  let rows;if(target){const member=memberRow(db,target);if(!member){json(res,404,{error:'Isi rumah tidak ditemui.'});return true;}rows=db.prepare('SELECT * FROM household_head_changes WHERE householdKey=? ORDER BY id DESC').all(member.householdKey);}else rows=db.prepare('SELECT * FROM household_head_changes ORDER BY id DESC').all();
  json(res,200,rows.map(row=>view(row,user)));return true;
 }
 if(path==='/api/head-changes'&&req.method==='POST'){
  const input=await body(req);if(!isSessionActive()){json(res,401,{error:'Sila log masuk semula.'});return true;}
  const id=Number(input.memberId);if(!authorizedMember(user,id)){json(res,403,{error:'Akses terhad kepada isi rumah sendiri.'});return true;}
  const member=memberRow(db,id);if(!member||!member.isActive){json(res,400,{error:'Sila pilih isi rumah aktif.'});return true;}
  if(member.updatedAt!==input.expectedUpdatedAt){json(res,409,{error:'Rekod telah berubah. Muat semula isi rumah sebelum memohon.'});return true;}
  if(pendingHeadChange(db,id)||otherPending(db,id)){json(res,409,{error:'Sila selesaikan permohonan profil, bantuan atau pertukaran ketua yang masih menunggu semakan terlebih dahulu.'});return true;}
  if(typeof input.reason!=='string'||!input.reason.trim()||input.reason.length>1000)throw Error('Sila nyatakan sebab pertukaran (maksimum 1,000 aksara).');
  const date=input.effectiveDate;if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date||date>todayInMalaysia())throw Error('Tarikh pertukaran mesti sah dan tidak berada pada masa hadapan.');
  const proposal=compose(member,input,validate),now=new Date().toISOString();
  const result=withAudit(db,user,'Mohon pertukaran ketua keluarga','isi rumah',id,()=>{const result=db.prepare('INSERT INTO household_head_changes(householdKey,memberId,requestedBy,requesterName,baseUpdatedAt,oldIdentityKey,candidateKey,oldHeadName,newHeadName,effectiveDate,reason,proposal,beforeSnapshot,createdAt) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(member.householdKey,id,user.id,user.fullName,member.updatedAt,member.identityKey,input.candidateKey,member.name,proposal.name,date,input.reason.trim(),JSON.stringify(proposal),JSON.stringify(member),now);notify(db,{admin:true,title:'Permohonan pertukaran ketua keluarga',body:`Isi rumah #${id}`});return result;});
  json(res,202,{id:Number(result.lastInsertRowid),status:'pending'});return true;
 }
 const review=path.match(/^\/api\/head-changes\/(\d+)\/review$/);
 if(review&&req.method==='POST'){
  if(user.role!=='admin'){json(res,403,{error:'Kelulusan pertukaran ketua hanya untuk pentadbir.'});return true;}
  const input=await body(req);if(!isSessionActive()){json(res,401,{error:'Sila log masuk semula.'});return true;}
  const row=db.prepare('SELECT * FROM household_head_changes WHERE id=?').get(Number(review[1]));if(!row){json(res,404,{error:'Permohonan tidak ditemui.'});return true;}if(row.status!=='pending'){json(res,409,{error:'Permohonan telah diproses.'});return true;}
  if(!['approve','reject'].includes(input.decision)||typeof input.reviewNote!=='string'||input.reviewNote.length>1000)throw Error('Maklumat keputusan semakan tidak sah.');
  const note=input.reviewNote.trim(),now=new Date().toISOString();if(input.decision==='reject'&&!note)throw Error('Sila nyatakan sebab penolakan.');
  let proposed,member;const affected=[];
  if(input.decision==='approve'){
   const admin=db.prepare("SELECT * FROM users WHERE id=? AND role='admin' AND isActive=1").get(user.id);
   if(input.confirmAccountChange!==true||!verifyPassword(admin,input.currentPassword))throw Error('Sila sahkan kesan kepada akaun dan masukkan kata laluan pentadbir semasa yang tepat.');
   member=memberRow(db,row.memberId);if(!member||!member.isActive||member.identityKey!==row.oldIdentityKey||member.householdKey!==row.householdKey||member.updatedAt!==row.baseUpdatedAt||digest(member)!==digest(JSON.parse(row.beforeSnapshot))){json(res,409,{error:'Rekod isi rumah telah berubah. Tolak permohonan ini dan minta penghantaran semula.'});return true;}
   if(otherPending(db,member.id)){json(res,409,{error:'Sila selesaikan permohonan profil/bantuan yang masih menunggu sebelum meluluskan.'});return true;}
   const selected=member.household.find(p=>p.personKey===row.candidateKey);if(!selected||selected.livesWithMember!=='Ya')throw Error('Sila semak semula calon ketua dalam rekod rasmi.');
   proposed=validate(JSON.parse(row.proposal));
   const all=db.prepare('SELECT * FROM members').all().map(m=>({...m,household:JSON.parse(m.household)})),matches=duplicateMatches(proposed,all,member.id),confirmation=digest({id:row.id,proposed,matches});
   if(matches.length&&input.duplicateConfirmation!==confirmation){json(res,409,{code:'HEAD_CHANGE_DUPLICATE',error:'Rekod individu serupa ditemui. Semak padanan sebelum meluluskan.',matches,confirmation});return true;}
   affected.push(...db.prepare("SELECT id FROM users WHERE role='ahli' AND memberId=?").all(member.id).map(u=>u.id));
  }
  withAudit(db,user,proposed?'Lulus pertukaran ketua keluarga':'Tolak pertukaran ketua keluarga','pertukaran ketua',row.id,()=>{
   if(proposed){
    const columns=['name','phone','birthDate','gender','occupation','address','household','address1','address2','district','postcode','state','country',...memberDetailFields],values={...proposed,household:JSON.stringify(proposed.household)};
    db.prepare(`UPDATE members SET ${columns.map(k=>`${k}=?`).join(',')},identityKey=?,updatedAt=? WHERE id=?`).run(...columns.map(k=>values[k]),row.candidateKey,now,member.id);
    for(const id of affected){notify(db,{userId:id,title:'Pertukaran ketua keluarga diluluskan',body:'Akses akaun ahli utama lama ditamatkan. Hubungi pentadbir untuk pengurusan akses.'});db.prepare('UPDATE users SET memberId=NULL,isActive=0,updatedAt=? WHERE id=?').run(now,id);}
    notify(db,{admin:true,title:'Pertukaran ketua keluarga selesai',body:`Isi rumah #${member.id}. Sediakan akaun ketua baharu secara berasingan.`});
   }else notify(db,{userId:row.requestedBy,title:'Permohonan pertukaran ketua ditolak',body:note});
   return db.prepare('UPDATE household_head_changes SET status=?,reviewNote=?,reviewedBy=?,reviewedAt=? WHERE id=?').run(proposed?'approved':'rejected',note,user.username,now,row.id);
  });
  for(const id of affected)revokeSessions(id);json(res,200,{ok:true,accountAccessChanged:!!proposed,disabledAccounts:affected.length});return true;
 }
 return false;
}
