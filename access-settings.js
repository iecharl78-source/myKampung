import {withAudit,verifyPassword} from './accounts.js';
export const memberModuleLabels={profile:'Profil, keluarga & bantuan sendiri',community:'Aktiviti & hebahan',questions:'Pertanyaan',notifications:'Notifikasi',headChanges:'Pertukaran ketua keluarga',deaths:'Rekod kematian',khairat:'Khairat kematian'};
const defaults=()=>Object.fromEntries(Object.keys(memberModuleLabels).map(k=>[k,true]));
export function initializeAccessSettings(db){db.exec('CREATE TABLE IF NOT EXISTS member_module_access(id INTEGER PRIMARY KEY CHECK(id=1),settings TEXT NOT NULL,updatedAt TEXT NOT NULL)');db.prepare('INSERT OR IGNORE INTO member_module_access(id,settings,updatedAt) VALUES(1,?,?)').run(JSON.stringify(defaults()),new Date().toISOString());}
export function memberModules(db,user){if(user.role!=='ahli')return defaults();return {...defaults(),...JSON.parse(db.prepare('SELECT settings FROM member_module_access WHERE id=1').get().settings)};}
export function moduleForPath(path){
 if(/^\/api\/(portal\/(profile|aid)(\/|$)|(?:aid-requests|profile-requests)(\/|$))/.test(path))return 'profile';
 if(/^\/api\/(announcements|events)(\/|$)/.test(path))return 'community';
 if(/^\/api\/questions(\/|$)/.test(path))return 'questions';
 if(/^\/api\/notifications(\/|$)/.test(path))return 'notifications';
 if(/^\/api\/head-changes(\/|$)/.test(path)||/^\/api\/households\/\d+\/head-context$/.test(path))return 'headChanges';
 if(/^\/api\/deaths(\/|$)/.test(path))return 'deaths';
 if(/^\/api\/khairat(\/|$)/.test(path))return 'khairat';
 return null;
}
export async function accessSettingsRoutes({req,res,path,user,db,json,body,isSessionActive}){
 if(path!=='/api/access-settings')return false;if(user.role!=='admin'){json(res,403,{error:'Tetapan akses hanya untuk pentadbir.'});return true;}
 const row=db.prepare('SELECT * FROM member_module_access WHERE id=1').get();
 if(req.method==='GET'){json(res,200,{labels:memberModuleLabels,modules:JSON.parse(row.settings),updatedAt:row.updatedAt});return true;}
 if(req.method==='PUT'){
  const input=await body(req);if(!isSessionActive()){json(res,401,{error:'Sila log masuk semula.'});return true;}const latest=db.prepare('SELECT * FROM member_module_access WHERE id=1').get();
  if(input.expectedUpdatedAt!==latest.updatedAt){json(res,409,{error:'Tetapan akses telah berubah. Muat semula sebelum menyimpan.'});return true;}
  if(!input.modules||typeof input.modules!=='object'||Array.isArray(input.modules)||Object.keys(input.modules).length!==Object.keys(memberModuleLabels).length||Object.keys(memberModuleLabels).some(k=>typeof input.modules[k]!=='boolean')||Object.keys(input.modules).some(k=>!Object.hasOwn(memberModuleLabels,k)))throw Error('Maklumat pilihan akses modul tidak sah.');
  const admin=db.prepare("SELECT * FROM users WHERE id=? AND role='admin' AND isActive=1").get(user.id);if(!verifyPassword(admin,input.currentPassword))throw Error('Kata laluan pentadbir semasa tidak tepat.');
  withAudit(db,user,'Kemaskini akses modul ahli','akses ahli',1,()=>db.prepare('UPDATE member_module_access SET settings=?,updatedAt=? WHERE id=1').run(JSON.stringify(input.modules),new Date(Math.max(Date.now(),Date.parse(latest.updatedAt)+1)).toISOString()));json(res,200,{ok:true});return true;
 }
 json(res,405,{error:'Kaedah tidak disokong.'});return true;
}
