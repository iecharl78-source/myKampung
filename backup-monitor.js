import {readBackupStatus} from './scripts/backup-status.js';
import {audit} from './accounts.js';
export async function backupMonitorRoute({req,res,path,user,db,json,isSessionActive}){
 if(path!=='/api/backup/status')return false;if(user.role!=='admin'){json(res,403,{error:'Status sandaran terhad kepada pentadbir.'});return true;}
 if(req.method!=='GET'){json(res,405,{error:'Status sandaran hanya boleh dibaca.'});return true;}
 const status=await readBackupStatus();if(!isSessionActive()){json(res,401,{error:'Sila log masuk semula.'});return true;}
 const last=db.prepare("SELECT createdAt FROM audit_log WHERE action='Sediakan sandaran penuh sistem' ORDER BY id DESC LIMIT 1").get();audit(db,user,'Lihat status sandaran','sistem','');json(res,200,{...status,lastDownloadPreparedAt:last?.createdAt||null});return true;
}
