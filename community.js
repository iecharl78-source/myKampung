import { audit,withAudit } from './accounts.js';
import { duplicateMatches,digest } from './data-tools.js';
import { memberDetailFields } from './public/member-details.js';

export function initializeCommunity(db){
  db.exec(`CREATE TABLE IF NOT EXISTS profile_requests(id INTEGER PRIMARY KEY,userId INTEGER NOT NULL REFERENCES users(id),memberId INTEGER REFERENCES members(id) ON DELETE SET NULL,identityKey TEXT NOT NULL,data TEXT NOT NULL,baseUpdatedAt TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected')),reviewNote TEXT NOT NULL DEFAULT '',reviewedBy TEXT NOT NULL DEFAULT '',createdAt TEXT NOT NULL,reviewedAt TEXT NOT NULL DEFAULT '');
    CREATE UNIQUE INDEX IF NOT EXISTS profile_request_pending ON profile_requests(userId) WHERE status='pending';
    CREATE TABLE IF NOT EXISTS announcements(id INTEGER PRIMARY KEY,title TEXT NOT NULL,body TEXT NOT NULL,published INTEGER NOT NULL,createdBy TEXT NOT NULL,createdAt TEXT NOT NULL,updatedAt TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS events(id INTEGER PRIMARY KEY,title TEXT NOT NULL,body TEXT NOT NULL,location TEXT NOT NULL,startsAt TEXT NOT NULL,endsAt TEXT NOT NULL,published INTEGER NOT NULL,createdBy TEXT NOT NULL,createdAt TEXT NOT NULL,updatedAt TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS notifications(id INTEGER PRIMARY KEY,userId INTEGER NOT NULL REFERENCES users(id),title TEXT NOT NULL,body TEXT NOT NULL,createdAt TEXT NOT NULL,readAt TEXT NOT NULL DEFAULT '');
    CREATE INDEX IF NOT EXISTS notification_owner ON notifications(userId,id);
    CREATE TABLE IF NOT EXISTS questions(id INTEGER PRIMARY KEY,userId INTEGER NOT NULL REFERENCES users(id),subject TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'open',createdAt TEXT NOT NULL,updatedAt TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS question_messages(id INTEGER PRIMARY KEY,questionId INTEGER NOT NULL REFERENCES questions(id),senderId INTEGER NOT NULL REFERENCES users(id),senderName TEXT NOT NULL,body TEXT NOT NULL,createdAt TEXT NOT NULL);`);
}
function text(value,max=200){if(typeof value!=='string'||value.length>max)throw Error('Maklumat komuniti tidak sah atau terlalu panjang.');return value.trim();}
export function notify(db,{userId=null,staff=false,admin=false,title,body=''}){
  db.prepare(`INSERT INTO notifications(userId,title,body,createdAt) SELECT u.id,?,?,? FROM users u WHERE u.isActive=1
    AND (u.role!='ahli' OR EXISTS(SELECT 1 FROM members m WHERE m.id=u.memberId AND m.isActive=1))
    AND (? IS NULL OR u.id=?) AND (?=0 OR u.role IN ('admin','petugas')) AND (?=0 OR u.role='admin')`).run(title,body,new Date().toISOString(),userId,userId,staff?1:0,admin?1:0);
}
export function communityState(db){return {announcements:db.prepare('SELECT * FROM announcements ORDER BY id').all(),events:db.prepare('SELECT * FROM events ORDER BY id').all()};}
export function validatePost(input,kind){
  const title=text(input.title,160),body=text(input.body,6000),published=input.published??1;
  if(!title||!body||![0,1].includes(published))throw Error('Sila lengkapkan tajuk, maklumat dan status siaran.');
  const result={title,body,published};
  if(kind==='events'){
    const location=text(input.location||'',300),start=text(input.startsAt,40),end=text(input.endsAt||'',40);
    if(!Number.isFinite(Date.parse(start)) || (end && (!Number.isFinite(Date.parse(end))||Date.parse(end)<Date.parse(start))))throw Error('Tarikh atau masa aktiviti tidak sah.');
    Object.assign(result,{location,startsAt:new Date(start).toISOString(),endsAt:end?new Date(end).toISOString():''});
  }return result;
}
export function readCommunity(input){
  if(input.version<5)return {announcements:[],events:[]};
  const result={};
  for(const kind of ['announcements','events']){
    const ids=new Set();result[kind]=input.community[kind].map(row=>{
      if(!row || !Number.isSafeInteger(row.id)||row.id<=0||ids.has(row.id)||typeof row.createdBy!=='string'||row.createdBy.length>100||!Number.isFinite(Date.parse(row.createdAt))||!Number.isFinite(Date.parse(row.updatedAt)))throw Error('Maklumat sandaran hebahan atau aktiviti tidak sah.');
      ids.add(row.id);return {...validatePost(row,kind),id:row.id,createdBy:row.createdBy,createdAt:row.createdAt,updatedAt:row.updatedAt};
    });
  }return result;
}
export async function communityRoutes({req,res,path,user,db,json,body,validate}){
  if(path==='/api/portal/profile'){
    if(user.role!=='ahli'){json(res,403,{error:'Portal ini untuk akaun ahli.'});return true;}
    const row=db.prepare('SELECT * FROM members WHERE id=? AND isActive=1').get(user.memberId);
    if(!row){json(res,403,{error:'Akses ahli tidak aktif atau belum dipautkan.'});return true;}
    if(req.method==='GET'){const {identityKey,...profile}=row;json(res,200,{...profile,household:JSON.parse(row.household)});return true;}
    if(req.method==='PUT'){
      const input=await body(req),current=db.prepare('SELECT * FROM members WHERE id=? AND isActive=1').get(user.memberId);
      if(!current || input.expectedUpdatedAt!==current.updatedAt){json(res,409,{error:'Maklumat telah berubah. Muat semula profil sebelum menghantar.'});return true;}
      const data=validate(input),now=new Date().toISOString();
      if(!data.employmentStatus || data.household.some(p=>!p.employmentStatus))throw Error('Sila lengkapkan status pekerjaan ahli dan keluarga.');
      if(db.prepare("SELECT id FROM profile_requests WHERE userId=? AND status='pending'").get(user.id)){json(res,409,{error:'Permohonan anda masih menunggu semakan pentadbir.'});return true;}
      const result=withAudit(db,user,'Hantar permohonan perubahan profil','ahli',current.id,()=>{
        const result=db.prepare('INSERT INTO profile_requests(userId,memberId,identityKey,data,baseUpdatedAt,createdAt) VALUES (?,?,?,?,?,?)').run(user.id,current.id,current.identityKey,JSON.stringify(data),current.updatedAt,now);
        notify(db,{admin:true,title:'Permohonan perubahan profil menunggu semakan',body:`ID ahli #${current.id}`});return result;
      });json(res,202,{id:Number(result.lastInsertRowid),status:'pending'});return true;
    }
    json(res,405,{error:'Kaedah tidak disokong.'});return true;
  }
  if(path==='/api/profile-requests' && req.method==='GET'){
    if(user.role==='petugas'){json(res,403,{error:'Semakan perubahan hanya untuk pentadbir.'});return true;}
    const rows=db.prepare(`SELECT r.*,u.fullName AS applicantName FROM profile_requests r JOIN users u ON u.id=r.userId ${user.role==='ahli'?'WHERE r.userId=?':''} ORDER BY r.id DESC`).all(...(user.role==='ahli'?[user.id]:[]));
    json(res,200,rows.map(row=>{const current=row.memberId?db.prepare('SELECT * FROM members WHERE id=? AND identityKey=?').get(row.memberId,row.identityKey):null;return {...row,data:JSON.parse(row.data),current:current?{...current,household:JSON.parse(current.household),identityKey:undefined}:null,identityKey:undefined};}));return true;
  }
  const review=path.match(/^\/api\/profile-requests\/(\d+)\/review$/);
  if(review && req.method==='POST'){
    if(user.role!=='admin'){json(res,403,{error:'Kelulusan hanya boleh dibuat oleh pentadbir.'});return true;}
    const input=await body(req),row=db.prepare('SELECT * FROM profile_requests WHERE id=?').get(Number(review[1]));
    if(!row){json(res,404,{error:'Permohonan tidak ditemui.'});return true;}
    if(row.status!=='pending'){json(res,409,{error:'Permohonan ini telah disemak.'});return true;}
    if(!['approve','reject'].includes(input.decision))throw Error('Keputusan semakan tidak sah.');
    const note=text(input.reviewNote||'',1000),now=new Date().toISOString();
    if(input.decision==='reject'&&!note)throw Error('Sila nyatakan sebab penolakan.');
    const current=row.memberId?db.prepare('SELECT * FROM members WHERE id=? AND identityKey=? AND isActive=1').get(row.memberId,row.identityKey):null;
    let data;
    if(input.decision==='approve'){
      if(!current || current.updatedAt!==row.baseUpdatedAt || !db.prepare("SELECT id FROM users WHERE id=? AND role='ahli' AND isActive=1 AND memberId=?").get(row.userId,current.id)){json(res,409,{error:'Rekod rasmi telah berubah atau tidak aktif. Tolak permohonan ini dan minta ahli menghantar maklumat terkini.'});return true;}
      data=validate(JSON.parse(row.data));
      const records=db.prepare('SELECT * FROM members').all().map(m=>({...m,household:JSON.parse(m.household)})),matches=duplicateMatches(data,records,current.id),confirmation=digest({id:row.id,data,matches});
      if(matches.length&&input.duplicateConfirmation!==confirmation){json(res,409,{code:'PROFILE_DUPLICATE',error:'Rekod berpotensi berganda. Semak padanan sebelum meluluskan.',matches,confirmation});return true;}
    }
    withAudit(db,user,input.decision==='approve'?'Lulus perubahan profil':'Tolak perubahan profil','permohonan profil',row.id,()=>{
      if(data){const columns=['name','phone','birthDate','gender','occupation','address','address1','address2','district','postcode','state','country','household',...memberDetailFields],values={...data,household:JSON.stringify(data.household)};
        db.prepare(`UPDATE members SET ${columns.map(c=>`${c}=?`).join(',')},updatedAt=? WHERE id=?`).run(...columns.map(c=>values[c]),now,current.id);
        db.prepare('UPDATE users SET fullName=?,updatedAt=? WHERE memberId=? AND role=\'ahli\'').run(data.name,now,current.id);
      }
      const result=db.prepare('UPDATE profile_requests SET status=?,reviewNote=?,reviewedBy=?,reviewedAt=? WHERE id=?').run(data?'approved':'rejected',note,user.username,now,row.id);
      notify(db,{userId:row.userId,title:data?'Perubahan profil diluluskan':'Perubahan profil ditolak',body:note});return result;
    });json(res,200,{ok:true});return true;
  }
  if(path==='/api/portal/aid'&&req.method==='GET'){
    if(user.role!=='ahli'){json(res,403,{error:'Portal ini untuk ahli.'});return true;}
    json(res,200,db.prepare('SELECT * FROM aid_records WHERE memberId=? ORDER BY receivedDate DESC,id DESC').all(user.memberId));return true;
  }
  const post=path.match(/^\/api\/(announcements|events)(?:\/(\d+))?$/);
  if(post){
    const kind=post[1],id=post[2]?Number(post[2]):null;
    if(req.method==='GET'&&!id){json(res,200,db.prepare(`SELECT * FROM ${kind} ${user.role==='ahli'?'WHERE published=1':''} ORDER BY ${kind==='events'?'startsAt':'createdAt'} DESC,id DESC`).all());return true;}
    if(user.role==='ahli'){json(res,403,{error:'Siaran hanya boleh diurus oleh pentadbir atau petugas.'});return true;}
    if((req.method==='POST'&&!id)||(req.method==='PUT'&&id)){
      const input=await body(req),previous=id?db.prepare(`SELECT * FROM ${kind} WHERE id=?`).get(id):null;
      if(id&&!previous){json(res,404,{error:'Siaran tidak ditemui.'});return true;}
      if(previous&&input.expectedUpdatedAt!==previous.updatedAt){json(res,409,{error:'Siaran telah berubah. Muat semula senarai.'});return true;}
      const data=validatePost(input,kind),keys=Object.keys(data),now=new Date().toISOString();
      const result=withAudit(db,user,previous?'Kemas kini siaran komuniti':'Tambah siaran komuniti',kind,id,()=>{
        const result=previous?db.prepare(`UPDATE ${kind} SET ${keys.map(k=>`${k}=?`).join(',')},updatedAt=? WHERE id=?`).run(...keys.map(k=>data[k]),now,id):db.prepare(`INSERT INTO ${kind} (${keys.join(',')},createdBy,createdAt,updatedAt) VALUES (${keys.map(()=>'?').join(',')},?,?,?)`).run(...keys.map(k=>data[k]),user.username,now,now);
        if(data.published && (!previous||!previous.published||input.notify===true))notify(db,{title:kind==='events'?'Aktiviti komuniti':'Pengumuman komuniti',body:data.title});return result;
      });json(res,previous?200:201,{id:id||Number(result.lastInsertRowid)});return true;
    }json(res,405,{error:'Kaedah tidak disokong.'});return true;
  }
  if(path==='/api/notifications'&&req.method==='GET'){
    json(res,200,{rows:db.prepare('SELECT id,title,body,createdAt,readAt FROM notifications WHERE userId=? ORDER BY id DESC LIMIT 100').all(user.id),unread:db.prepare("SELECT count(*) n FROM notifications WHERE userId=? AND readAt=''").get(user.id).n});return true;
  }
  if(path==='/api/notifications/read'&&req.method==='POST'){
    const input=await body(req),now=new Date().toISOString();
    if(input.all===true)db.prepare("UPDATE notifications SET readAt=? WHERE userId=? AND readAt=''").run(now,user.id);
    else if(Array.isArray(input.ids)&&input.ids.length<=100&&input.ids.every(Number.isSafeInteger))for(const id of input.ids)db.prepare('UPDATE notifications SET readAt=? WHERE id=? AND userId=?').run(now,id,user.id);
    else throw Error('Maklumat notifikasi tidak sah.');json(res,200,{ok:true});return true;
  }
  const question=path.match(/^\/api\/questions(?:\/(\d+)(?:\/(reply|status))?)?$/);
  if(question){
    const id=Number(question[1]),action=question[2];
    const row=id?db.prepare('SELECT * FROM questions WHERE id=?').get(id):null;
    if(id&&(!row||(user.role==='ahli'&&row.userId!==user.id))){json(res,404,{error:'Pertanyaan tidak ditemui.'});return true;}
    if(req.method==='GET'){
      if(id)json(res,200,{...row,messages:db.prepare('SELECT id,senderName,body,createdAt FROM question_messages WHERE questionId=? ORDER BY id').all(id)});
      else json(res,200,db.prepare(`SELECT q.*,u.fullName AS ownerName FROM questions q JOIN users u ON u.id=q.userId ${user.role==='ahli'?'WHERE q.userId=?':''} ORDER BY q.updatedAt DESC,q.id DESC`).all(...(user.role==='ahli'?[user.id]:[])));return true;
    }
    if(req.method==='POST'){
      const input=await body(req),now=new Date().toISOString();
      if(action==='status'){
        if(user.role==='ahli'){json(res,403,{error:'Status pertanyaan diurus oleh petugas.'});return true;}
        if(!['open','closed'].includes(input.status))throw Error('Maklumat status pertanyaan tidak sah.');
        withAudit(db,user,'Ubah status pertanyaan','pertanyaan',id,()=>{const result=db.prepare('UPDATE questions SET status=?,updatedAt=? WHERE id=?').run(input.status,now,id);notify(db,{userId:row.userId,title:'Status pertanyaan dikemas kini',body:row.subject});return result;});json(res,200,{ok:true});return true;
      }
      if(id&&db.prepare('SELECT status FROM questions WHERE id=?').get(id)?.status!=='open')throw Error('Pertanyaan telah ditutup. Mulakan pertanyaan baharu atau hubungi petugas.');
      const message=text(input.body,4000),subject=id?row.subject:text(input.subject,160);
      if(!message||!subject)throw Error('Sila lengkapkan tajuk dan mesej pertanyaan.');
      let threadId=id;
      withAudit(db,user,id?'Balas pertanyaan':'Hantar pertanyaan','pertanyaan',id||'',()=>{
        if(!id)threadId=Number(db.prepare('INSERT INTO questions (userId,subject,createdAt,updatedAt) VALUES (?,?,?,?)').run(user.id,subject,now,now).lastInsertRowid);
        const result=db.prepare('INSERT INTO question_messages (questionId,senderId,senderName,body,createdAt) VALUES (?,?,?,?,?)').run(threadId,user.id,user.fullName,message,now);
        db.prepare('UPDATE questions SET updatedAt=? WHERE id=?').run(now,threadId);
        if(user.role==='ahli')notify(db,{staff:true,title:'Pertanyaan ahli',body:subject});
        else if(row&&row.userId!==user.id)notify(db,{userId:row.userId,title:'Balasan pertanyaan diterima',body:subject});return result;
      });json(res,id?200:201,{id:threadId});return true;
    }json(res,405,{error:'Kaedah tidak disokong.'});return true;
  }
  return false;
}
