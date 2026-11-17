import {withAudit,verifyPassword} from './accounts.js';
export const memberModuleLabels={profile:'Profil, keluarga & bantuan sendiri',community:'Aktiviti & hebahan',questions:'Pertanyaan',notifications:'Notifikasi',headChanges:'Pertukaran ketua keluarga',deaths:'Rekod kematian',khairat:'Khairat kematian'};
export const staffModuleLabels={members:'Ahli & keluarga komuniti',aid:'Bantuan komuniti',...Object.fromEntries(Object.entries(memberModuleLabels).filter(([k])=>k!=='profile'))};
const defaults=(labels=memberModuleLabels)=>Object.fromEntries(Object.keys(labels).map(k=>[k,true]));
export function initializeAccessSettings(db){db.exec('CREATE TABLE IF NOT EXISTS member_module_access(id INTEGER PRIMARY KEY CHECK(id=1),settings TEXT NOT NULL,updatedAt TEXT NOT NULL)');db.prepare('INSERT OR IGNORE INTO member_module_access(id,settings,updatedAt) VALUES(1,?,?)').run(JSON.stringify(defaults()),new Date().toISOString());db.exec('CREATE TABLE IF NOT EXISTS staff_module_access(id INTEGER PRIMARY KEY CHECK(id=1),settings TEXT NOT NULL,updatedAt TEXT NOT NULL)');db.prepare('INSERT OR IGNORE INTO staff_module_access(id,settings,updatedAt) VALUES(1,?,?)').run(JSON.stringify(defaults(staffModuleLabels)),new Date().toISOString());}
export function memberModules(db,user){if(user.role==='admin')return {...defaults(),...defaults(staffModuleLabels)};const staff=user.role==='petugas',labels=staff?staffModuleLabels:memberModuleLabels,table=staff?'staff_module_access':'member_module_access';return {...defaults(labels),...JSON.parse(db.prepare(`SELECT settings FROM ${table} WHERE id=1`).get().settings)};}
export function moduleForPath(path){
 if(/^\/api\/members(\/|$)/.test(path))return 'members';
 if(/^\/api\/(aid|aid-types|aid-counts)(\/|$)/.test(path))return 'aid';
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
 const role=new URL(req.url,'http://localhost').searchParams.get('role')||'ahli';if(!['ahli','petugas'].includes(role)){json(res,400,{error:'Sila pilih peranan Ahli atau Petugas.'});return true;}const table=role==='petugas'?'staff_module_access':'member_module_access',labels=role==='petugas'?staffModuleLabels:memberModuleLabels;
 const row=db.prepare(`SELECT * FROM ${table} WHERE id=1`).get();
 if(req.method==='GET'){json(res,200,{role,labels,modules:JSON.parse(row.settings),updatedAt:row.updatedAt});return true;}
 if(req.method==='PUT'){
  const input=await body(req);if(!isSessionActive()){json(res,401,{error:'Sila log masuk semula.'});return true;}const latest=db.prepare(`SELECT * FROM ${table} WHERE id=1`).get();
  if(input.expectedUpdatedAt!==latest.updatedAt){json(res,409,{error:'Tetapan akses telah berubah. Muat semula sebelum menyimpan.'});return true;}
  if(!input.modules||typeof input.modules!=='object'||Array.isArray(input.modules)||Object.keys(input.modules).length!==Object.keys(labels).length||Object.keys(labels).some(k=>typeof input.modules[k]!=='boolean')||Object.keys(input.modules).some(k=>!Object.hasOwn(labels,k)))throw Error('Maklumat pilihan akses modul tidak sah.');
  const admin=db.prepare("SELECT * FROM users WHERE id=? AND role='admin' AND isActive=1").get(user.id);if(!verifyPassword(admin,input.currentPassword))throw Error('Kata laluan pentadbir semasa tidak tepat.');
  withAudit(db,user,'Kemaskini akses modul '+role,'akses '+role,1,()=>db.prepare(`UPDATE ${table} SET settings=?,updatedAt=? WHERE id=1`).run(JSON.stringify(input.modules),new Date(Math.max(Date.now(),Date.parse(latest.updatedAt)+1)).toISOString()));json(res,200,{ok:true});return true;
 }
 json(res,405,{error:'Kaedah tidak disokong.'});return true;
}
