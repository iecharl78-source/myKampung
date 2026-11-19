import {withAudit} from './accounts.js';
import {notify} from './community.js';
export const taskKinds={registrations:{table:'registrations',label:'Pendaftaran ahli',nav:'nav-registrations'},profiles:{table:'profile_requests',label:'Perubahan profil',nav:'nav-profile-review'},aid:{table:'aid_requests',label:'Maklumat bantuan',nav:'nav-profile-review'},headChanges:{table:'household_head_changes',label:'Pertukaran ketua',nav:'nav-head-changes'},deaths:{table:'death_records',label:'Rekod kematian',nav:'nav-deaths'},khairat:{table:'khairat_claims',label:'Tuntutan khairat',nav:'nav-khairat'},payments:{table:'khairat_claims',label:'Khairat belum dibayar',nav:'nav-khairat'}};
export function initializeTaskHub(db){db.exec(`CREATE TABLE IF NOT EXISTS task_assignments(kind TEXT NOT NULL,recordId INTEGER NOT NULL,assigneeId INTEGER REFERENCES users(id) ON DELETE SET NULL,note TEXT NOT NULL DEFAULT '',updatedAt TEXT NOT NULL,PRIMARY KEY(kind,recordId));`);}
export function pendingTasks(db,now=Date.now()){
 const rows=[];for(const [kind,def] of Object.entries(taskKinds)){for(const row of db.prepare(`SELECT * FROM ${def.table} WHERE status=?`).all(kind==='payments'?'approved':'pending')){const assignment=db.prepare('SELECT a.*,u.fullName assigneeName,u.isActive assigneeActive FROM task_assignments a LEFT JOIN users u ON u.id=a.assigneeId WHERE kind=? AND recordId=?').get(kind,row.id);const createdAt=kind==='payments'?row.reviewedAt||row.createdAt:row.createdAt;const ageDays=Math.max(0,Math.floor((now-Date.parse(createdAt))/86400000));let name=row.personName||row.newHeadName||row.requesterName||'';if(kind==='registrations'){try{name=JSON.parse(row.data).name||'';}catch{}}if(['profiles','aid'].includes(kind))name=db.prepare('SELECT fullName FROM users WHERE id=?').get(row.userId)?.fullName||'';rows.push({kind,id:row.id,label:def.label,nav:def.nav,name,createdAt,ageDays,overdue:ageDays>=7,assigneeId:assignment?.assigneeId||null,assigneeName:assignment?.assigneeName||'',assigneeActive:assignment?.assigneeActive===1,note:assignment?.note||'',assignmentUpdatedAt:assignment?.updatedAt||''});}}
 return rows.sort((a,b)=>a.createdAt.localeCompare(b.createdAt)||a.kind.localeCompare(b.kind)||a.id-b.id);
}
export async function taskHubRoutes({req,res,path,user,db,json,body,isSessionActive}){
 if(path!=='/api/tasks'&&!/^\/api\/tasks\/[^/]+\/\d+\/assign$/.test(path))return false;
 if(user.role!=='admin'){json(res,403,{error:'Pusat tugasan terhad kepada pentadbir.'});return true;}
 if(path==='/api/tasks'&&req.method==='GET'){const rows=pendingTasks(db);json(res,200,{rows,overdue:rows.filter(r=>r.overdue).length,assignees:db.prepare("SELECT id,fullName FROM users WHERE role='admin' AND isActive=1 ORDER BY fullName,id").all()});return true;}
 const m=path.match(/^\/api\/tasks\/([^/]+)\/(\d+)\/assign$/);
 if(m&&req.method==='POST'){
  const input=await body(req);if(!isSessionActive()){json(res,401,{error:'Sila log masuk semula.'});return true;}const kind=m[1],id=Number(m[2]),def=Object.hasOwn(taskKinds,kind)?taskKinds[kind]:null;if(!def){json(res,404,{error:'Tugasan tidak ditemui.'});return true;}
  const row=db.prepare(`SELECT id FROM ${def.table} WHERE id=? AND status=?`).get(id,kind==='payments'?'approved':'pending');if(!row){json(res,409,{error:'Tugasan telah selesai atau tidak ditemui. Muat semula.'});return true;}
  const old=db.prepare('SELECT * FROM task_assignments WHERE kind=? AND recordId=?').get(kind,id);if((old?.updatedAt||'')!==input.expectedUpdatedAt){json(res,409,{error:'Penugasan telah berubah. Muat semula.'});return true;}
  if(input.assigneeId!==null&&(!Number.isSafeInteger(input.assigneeId)||!db.prepare("SELECT id FROM users WHERE id=? AND role='admin' AND isActive=1").get(input.assigneeId)))throw Error('Sila pilih pentadbir aktif yang sah.');
  if(typeof input.note!=='string'||input.note.length>500)throw Error('Catatan tugasan maksimum 500 aksara.');
  const now=new Date(Math.max(Date.now(),Date.parse(old?.updatedAt||'')+1||0)).toISOString();
  withAudit(db,user,'Tetapkan pegawai tugasan','tugasan',kind+':'+id,()=>{const result=db.prepare('INSERT INTO task_assignments(kind,recordId,assigneeId,note,updatedAt) VALUES(?,?,?,?,?) ON CONFLICT(kind,recordId) DO UPDATE SET assigneeId=excluded.assigneeId,note=excluded.note,updatedAt=excluded.updatedAt').run(kind,id,input.assigneeId,input.note.trim(),now);if(input.assigneeId&&input.assigneeId!==old?.assigneeId)notify(db,{userId:input.assigneeId,title:'Tugasan baharu untuk semakan',body:def.label+' #'+id});return result;});json(res,200,{ok:true});return true;
 }
 json(res,404,{error:'Halaman tidak ditemui.'});return true;
}
