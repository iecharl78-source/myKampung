import {mkdtemp,rm} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,basename} from 'node:path';
import {pipeline} from 'node:stream/promises';
import {fullBackup} from './scripts/backup-full.js';
import {verifyPassword,audit} from './accounts.js';
let busy=false;
export async function fullBackupRoute({req,res,path,user,db,json,body,dataDir,isSessionActive}){
 if(path!=='/api/backup/full')return false;
 if(user.role!=='admin'){json(res,403,{error:'Sandaran penuh hanya untuk pentadbir.'});return true;}
 if(req.method!=='POST'){json(res,405,{error:'Gunakan borang Sandaran penuh sistem.'});return true;}
 const input=await body(req);
 if(!verifyPassword(user,input.currentPassword)){json(res,400,{error:'Kata laluan pentadbir semasa tidak tepat.'});return true;}
 if(busy){json(res,429,{error:'Sandaran penuh sedang disediakan. Cuba lagi sebentar.'});return true;}
 busy=true;let temporary;
 try{
  temporary=await mkdtemp(join(tmpdir(),'mykampung-backup-'));
  const file=await fullBackup({dataDir,backupDir:temporary,keep:1});
  if(!isSessionActive()){json(res,401,{error:'Sesi telah tamat. Sila log masuk semula.'});return true;}
  audit(db,user,'Sediakan sandaran penuh sistem','sistem','');
  res.writeHead(200,{'Content-Type':'application/vnd.sqlite3','Content-Disposition':`attachment; filename="${basename(file)}"`});
  await pipeline(createReadStream(file),res);
 }catch(error){if(!res.headersSent)throw error;res.destroy();}
 finally{if(temporary)await rm(temporary,{recursive:true,force:true}).catch(()=>console.error('Pembersihan fail sandaran sementara gagal.'));busy=false;}
 return true;
}
