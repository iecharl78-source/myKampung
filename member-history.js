import {memberColumns} from './data-tools.js';
import {residentFields} from './public/resident-fields.js';
import {familyResidenceFields} from './public/family-residence.js';
import {audit} from './accounts.js';
const excluded=new Set(['id','identityKey','householdKey','createdAt','updatedAt']);
const fields=memberColumns.filter(k=>!excluded.has(k)&&k!=='household');
const familyFields=['name','relationship','birthDate','employmentStatus','educationLevel','studyLevel',...residentFields,...familyResidenceFields];
export function historyReason(input){const reason=input.changeReason??'';if(typeof reason!=='string'||reason.length>1000)throw Error('Maklumat catatan perubahan maksimum 1,000 aksara.');return reason.trim();}
export function initializeMemberHistory(db){db.exec(`CREATE TABLE IF NOT EXISTS member_history(id INTEGER PRIMARY KEY,householdKey TEXT NOT NULL,memberId INTEGER REFERENCES members(id) ON DELETE SET NULL,subjectName TEXT NOT NULL,action TEXT NOT NULL,actorId INTEGER NOT NULL,actorName TEXT NOT NULL,actorUsername TEXT NOT NULL,actorRole TEXT NOT NULL,submittedBy TEXT NOT NULL,reason TEXT NOT NULL,source TEXT NOT NULL,beforeData TEXT,afterData TEXT,createdAt TEXT NOT NULL);CREATE INDEX IF NOT EXISTS member_history_household ON member_history(householdKey,id DESC);`);}
export function memberSnapshot(row){if(!row)return null;const family=typeof row.household==='string'?JSON.parse(row.household):row.household||[];return {...Object.fromEntries(fields.map(k=>[k,row[k]??''])),household:family.map(person=>Object.fromEntries(familyFields.map(k=>[k,person[k]??''])))};}
export function recordMemberChange(db,user,action,before,after,{reason='',source='',submittedBy=''}={}){
 const oldData=memberSnapshot(before),newData=memberSnapshot(after);if(JSON.stringify(oldData)===JSON.stringify(newData))return;
 const row=after||before;if(!row?.householdKey)throw Error('Data sejarah memerlukan identiti isi rumah.');
 const memberId=db.prepare('SELECT id FROM members WHERE householdKey=?').get(row.householdKey)?.id??null;
 return db.prepare('INSERT INTO member_history(householdKey,memberId,subjectName,action,actorId,actorName,actorUsername,actorRole,submittedBy,reason,source,beforeData,afterData,createdAt) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(row.householdKey,memberId,row.name,action,user.id,user.fullName,user.username,user.role,submittedBy,reason,source,oldData===null?null:JSON.stringify(oldData),newData===null?null:JSON.stringify(newData),new Date().toISOString());
}
export async function memberHistoryRoutes({req,res,path,user,db,json}){
 if(path!=='/api/member-history'&&!/^\/api\/member-history\/\d+$/.test(path))return false;
 if(user.role!=='admin'){json(res,403,{error:'Sejarah perubahan terhad kepada pentadbir.'});return true;}
 if(req.method!=='GET'){json(res,405,{error:'Sejarah perubahan hanya boleh dibaca.'});return true;}
 const detail=path.match(/^\/api\/member-history\/(\d+)$/);
 if(detail){const row=db.prepare('SELECT * FROM member_history WHERE id=?').get(Number(detail[1]));if(!row){json(res,404,{error:'Sejarah tidak ditemui.'});return true;}audit(db,user,'Lihat sejarah maklumat ahli','sejarah ahli',row.id);const {householdKey,beforeData,afterData,...metadata}=row;json(res,200,{...metadata,before:beforeData?JSON.parse(beforeData):null,after:afterData?JSON.parse(afterData):null});return true;}
 const url=new URL(req.url,'http://localhost'),page=Number(url.searchParams.get('page')||1),q=(url.searchParams.get('q')||'').trim(),member=url.searchParams.get('memberId');if(!Number.isSafeInteger(page)||page<1||page>100000||q.length>200||(member!==null&&(!/^\d+$/.test(member)||!Number.isSafeInteger(Number(member))||Number(member)<1)))throw Error('Maklumat penapis sejarah tidak sah.');
 let household=null;if(member!==null){household=db.prepare('SELECT householdKey FROM members WHERE id=?').get(Number(member))?.householdKey;if(!household){json(res,404,{error:'Ahli tidak ditemui.'});return true;}}
 const where=`WHERE (? IS NULL OR householdKey=?) AND (?='' OR instr(lower(subjectName),lower(?))>0 OR instr(lower(actorName),lower(?))>0 OR instr(lower(action),lower(?))>0)`,args=[household,household,q,q,q,q];
 const total=db.prepare(`SELECT count(*) n FROM member_history ${where}`).get(...args).n;
 const rows=db.prepare(`SELECT id,memberId,subjectName,action,actorName,actorRole,submittedBy,reason,source,createdAt FROM member_history ${where} ORDER BY id DESC LIMIT 20 OFFSET ?`).all(...args,(page-1)*20);json(res,200,{rows,total,page,pageSize:20});return true;
}
