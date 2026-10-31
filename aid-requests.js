import {validateAid,aidColumns} from './aid.js';
import {withAudit} from './accounts.js';
import {digest} from './data-tools.js';
import {notify} from './community.js';

export function initializeAidRequests(db){
 db.exec(`CREATE TABLE IF NOT EXISTS aid_requests(id INTEGER PRIMARY KEY,userId INTEGER NOT NULL REFERENCES users(id),memberId INTEGER REFERENCES members(id) ON DELETE SET NULL,identityKey TEXT NOT NULL,aidId INTEGER REFERENCES aid_records(id) ON DELETE SET NULL,action TEXT NOT NULL CHECK(action IN ('create','update')),baseUpdatedAt TEXT NOT NULL,data TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),reviewNote TEXT NOT NULL DEFAULT '',reviewedBy TEXT NOT NULL DEFAULT '',createdAt TEXT NOT NULL,reviewedAt TEXT NOT NULL DEFAULT '');`);
}
function record(db,input,member,previous){
 input={...input,memberId:member.id};
 if(input.aidTypeId!=null){const type=db.prepare('SELECT * FROM aid_types WHERE id=?').get(input.aidTypeId);if(!type||(!type.isActive&&previous?.aidTypeId!==type.id))throw Error('Sila pilih jenis bantuan aktif.');input.title=previous?.aidTypeId===type.id?previous.title:type.title;input.category=previous?.aidTypeId===type.id?previous.category:type.category;input.provider=input.provider||type.provider;}
 return validateAid(input,member,previous);
}
export async function aidRequestRoutes({req,res,path,user,db,json,body}){
 if(path==='/api/portal/aid/types'&&req.method==='GET'){
  if(user.role!=='ahli'){json(res,403,{error:'Portal ini untuk ahli.'});return true;}
  json(res,200,db.prepare('SELECT id,title,category,provider FROM aid_types WHERE isActive=1 ORDER BY title').all());return true;
 }
 if(path==='/api/aid-requests'&&req.method==='GET'){
  if(user.role==='petugas'){json(res,403,{error:'Semakan bantuan hanya untuk pentadbir.'});return true;}
  const rows=db.prepare(`SELECT r.*,u.fullName AS applicantName FROM aid_requests r JOIN users u ON u.id=r.userId ${user.role==='ahli'?'WHERE r.userId=?':''} ORDER BY r.id DESC`).all(...(user.role==='ahli'?[user.id]:[]));
  json(res,200,rows.map(({identityKey,...r})=>({...r,data:JSON.parse(r.data),current:r.action==='update'&&r.aidId?db.prepare('SELECT * FROM aid_records WHERE id=? AND memberId=?').get(r.aidId,r.memberId)||null:null})));return true;
 }
 if(path==='/api/aid-requests'&&req.method==='POST'){
  if(user.role!=='ahli'){json(res,403,{error:'Permohonan ini hanya untuk ahli.'});return true;}
  const input=await body(req),raw=db.prepare('SELECT * FROM members WHERE id=? AND isActive=1').get(user.memberId);
  if(!raw)throw Error('Keahlian tidak aktif.');const member={...raw,household:JSON.parse(raw.household)};
  const previous=input.aidId?db.prepare('SELECT * FROM aid_records WHERE id=? AND memberId=?').get(input.aidId,member.id):null;
  if(input.aidId&&!previous){json(res,404,{error:'Rekod bantuan tidak ditemui.'});return true;}
  if(previous&&input.expectedUpdatedAt!==previous.updatedAt){json(res,409,{error:'Rekod bantuan telah berubah. Muat semula profil.'});return true;}
  const data=record(db,input,member,previous),serialized=JSON.stringify(data);
  const pending=db.prepare("SELECT * FROM aid_requests WHERE userId=? AND status='pending'").all(user.id);
  const same=pending.find(r=>r.aidId===(previous?.id??null)&&r.data===serialized&&r.baseUpdatedAt===(previous?.updatedAt||''));
  if(same){json(res,202,{id:same.id,status:'pending'});return true;}
  if((previous&&pending.some(r=>r.aidId===previous.id))||pending.length>=100){json(res,409,{error:'Permohonan bantuan masih menunggu semakan atau had permohonan dicapai.'});return true;}
  const now=new Date().toISOString(),result=withAudit(db,user,'Hantar permohonan maklumat bantuan','ahli',member.id,()=>{
   const result=db.prepare('INSERT INTO aid_requests(userId,memberId,identityKey,aidId,action,baseUpdatedAt,data,createdAt) VALUES(?,?,?,?,?,?,?,?)').run(user.id,member.id,member.identityKey,previous?.id??null,previous?'update':'create',previous?.updatedAt||'',serialized,now);
   notify(db,{admin:true,title:'Permohonan bantuan menunggu semakan',body:`ID ahli #${member.id}`});return result;
  });json(res,202,{id:Number(result.lastInsertRowid),status:'pending'});return true;
 }
 const match=path.match(/^\/api\/aid-requests\/(\d+)\/review$/);
 if(match&&req.method==='POST'){
  if(user.role!=='admin'){json(res,403,{error:'Kelulusan hanya untuk pentadbir.'});return true;}
  const input=await body(req),row=db.prepare('SELECT * FROM aid_requests WHERE id=?').get(Number(match[1]));
  if(!row){json(res,404,{error:'Permohonan tidak ditemui.'});return true;}
  if(row.status!=='pending'){json(res,409,{error:'Permohonan telah disemak.'});return true;}
  if(!['approve','reject'].includes(input.decision)||typeof input.reviewNote!=='string'||input.reviewNote.length>1000)throw Error('Keputusan semakan tidak sah.');
  const note=input.reviewNote.trim();if(input.decision==='reject'&&!note)throw Error('Sila nyatakan sebab penolakan.');
  let data,previous;
  if(input.decision==='approve'){
   const raw=db.prepare('SELECT * FROM members WHERE id=? AND identityKey=? AND isActive=1').get(row.memberId,row.identityKey);
   if(!raw||!db.prepare("SELECT id FROM users WHERE id=? AND memberId=? AND isActive=1 AND role='ahli'").get(row.userId,raw.id))throw Error('Keahlian atau pautan akaun telah berubah. Tolak permohonan dan minta penghantaran semula.');
   previous=row.aidId?db.prepare('SELECT * FROM aid_records WHERE id=? AND memberId=?').get(row.aidId,raw.id):null;
   if(row.action==='update'&&(!previous||previous.updatedAt!==row.baseUpdatedAt)){json(res,409,{error:'Rekod bantuan telah berubah atau dipadam. Tolak dan minta penghantaran semula.'});return true;}
   const proposed=JSON.parse(row.data);data=record(db,{...proposed,amount:proposed.amountCents===null?'':(proposed.amountCents/100).toFixed(2)}, {...raw,household:JSON.parse(raw.household)},previous);
   const duplicates=db.prepare('SELECT * FROM aid_records WHERE memberId=? AND id!=?').all(raw.id,previous?.id||-1).filter(r=>['recipientKind','recipientName','recipientBirthDate','title','provider','receivedDate'].every(k=>r[k].toLocaleLowerCase('ms')===data[k].toLocaleLowerCase('ms'))),confirmation=digest({id:row.id,data,duplicates});
   if(duplicates.length&&input.duplicateConfirmation!==confirmation){json(res,409,{code:'AID_REQUEST_DUPLICATE',error:'Bantuan serupa telah direkodkan. Semak sebelum meluluskan.',confirmation});return true;}
  }
  const now=new Date().toISOString();withAudit(db,user,data?'Lulus maklumat bantuan ahli':'Tolak maklumat bantuan ahli','permohonan bantuan',row.id,()=>{
   if(data){const cols=aidColumns.filter(k=>!['id','createdAt','updatedAt'].includes(k));if(previous)db.prepare(`UPDATE aid_records SET ${cols.map(k=>`${k}=?`).join(',')},updatedAt=? WHERE id=?`).run(...cols.map(k=>data[k]),now,previous.id);else db.prepare(`INSERT INTO aid_records(${cols.join(',')},createdAt,updatedAt) VALUES(${cols.map(()=>'?').join(',')},?,?)`).run(...cols.map(k=>data[k]),now,now);}
   const result=db.prepare('UPDATE aid_requests SET status=?,reviewNote=?,reviewedBy=?,reviewedAt=? WHERE id=?').run(data?'approved':'rejected',note,user.username,now,row.id);notify(db,{userId:row.userId,title:data?'Maklumat bantuan diluluskan':'Maklumat bantuan ditolak',body:note});return result;
  });json(res,200,{ok:true});return true;
 }
 return false;
}
