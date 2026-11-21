import {open,lstat,readdir,writeFile,rename,unlink} from 'node:fs/promises';
import {constants} from 'node:fs';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomBytes} from 'node:crypto';
export const backupPattern=/^kampung-full-\d{4}-\d{2}-\d{2}T[\dZ-]+-[a-f0-9]{8}\.sqlite$/;
export const backupDirectory=()=>process.env.BACKUP_DIR||fileURLToPath(new URL('../backups/',import.meta.url));
const statusName='.backup-status.json';
const iso=value=>typeof value==='string'&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString()===value;
const codes=new Set(['ENOENT','EACCES','EPERM','ENOSPC','EROFS','ERR_SQLITE_ERROR','BACKUP_FAILED']);
export const failureCode=error=>codes.has(error?.code)?error.code:'BACKUP_FAILED';
function normalize(raw){
 if(!raw||raw.version!==1||!raw.lastAttempt||!['success','failed'].includes(raw.lastAttempt.status)||!iso(raw.lastAttempt.at))throw Error('INVALID_STATUS');
 const lastAttempt={status:raw.lastAttempt.status,at:raw.lastAttempt.at};if(lastAttempt.status==='failed')lastAttempt.failureCode=codes.has(raw.lastAttempt.failureCode)?raw.lastAttempt.failureCode:'BACKUP_FAILED';
 let lastSuccess=null;const s=raw.lastSuccess;if(s){if(!backupPattern.test(s.fileName)||!iso(s.at)||!Number.isSafeInteger(s.bytes)||s.bytes<=0||!Number.isFinite(s.mtimeMs)||s.mtimeMs<=0)throw Error('INVALID_STATUS');lastSuccess={fileName:s.fileName,at:s.at,bytes:s.bytes,mtimeMs:s.mtimeMs};}
 if(lastAttempt.status==='success'&&!lastSuccess)throw Error('INVALID_STATUS');return {version:1,lastAttempt,lastSuccess};
}
async function readState(directory){let handle;try{handle=await open(join(directory,statusName),constants.O_RDONLY|(constants.O_NOFOLLOW||0));const stat=await handle.stat();if(!stat.isFile()||stat.size>16384)throw Error('INVALID_STATUS');return normalize(JSON.parse(await handle.readFile('utf8')));}finally{await handle?.close();}}
export async function writeBackupStatus(directory,{status,success=null,error=null},now=Date.now()){
 let previous=null;try{previous=await readState(directory);}catch{}
 const candidate=success||previous?.lastSuccess||null;
 const state=normalize({version:1,lastAttempt:{status,at:new Date(now).toISOString(),...(status==='failed'?{failureCode:failureCode(error)}:{})},lastSuccess:candidate});
 const staging=join(directory,'.backup-status-'+randomBytes(8).toString('hex')+'.partial');
 try{await writeFile(staging,JSON.stringify(state),{mode:0o600,flag:'wx'});await rename(staging,join(directory,statusName));}finally{await unlink(staging).catch(()=>{});}
}
const messages={missing:'Belum ada rekod sandaran pelayan. Jalankan atau semak proses sandaran.',legacy:'Fail sandaran lama ditemui tetapi keputusan pengesahan belum direkodkan. Jalankan sandaran penuh versi baharu.',current:'Rekod sandaran pelayan terkini dan fail terakhir masih tersedia.',overdue:'Sandaran pelayan melepasi sela masa yang dijangka. Semak jadual dan log proses.',failed:'Percubaan sandaran terakhir yang direkodkan gagal. Semak log proses dan ruang/kebenaran storan.',missing_file:'Fail sandaran terakhir tidak lagi ditemui. Sediakan sandaran baharu dan semak lokasi storan.',changed_file:'Fail sandaran terakhir telah berubah atau bukan fail biasa. Sediakan dan sahkan sandaran baharu.',invalid:'Rekod status sandaran tidak sah atau masa pelayan perlu disemak.',unavailable:'Folder atau status sandaran tidak dapat dibaca. Semak konfigurasi dan kebenaran storan.',configuration:'BACKUP_INTERVAL_HOURS mesti antara 1 dan 168.'};
export async function readBackupStatus({directory=backupDirectory(),intervalHours=Number(process.env.BACKUP_INTERVAL_HOURS||24),now=Date.now()}={}){
 const result={state:'missing',checkedAt:new Date(now).toISOString(),intervalHours,graceMinutes:5,retainedFiles:0,lastAttempt:null,lastSuccess:null};const finish=state=>({...result,state,message:messages[state]});
 if(!Number.isFinite(intervalHours)||intervalHours<1||intervalHours>168){result.intervalHours=null;return finish('configuration');}
 let names;try{names=await readdir(directory);}catch(error){return finish(error.code==='ENOENT'?'missing':'unavailable');}result.retainedFiles=names.filter(n=>backupPattern.test(n)).length;
 let state;try{state=await readState(directory);}catch(error){return finish(error.code==='ENOENT'?(result.retainedFiles?'legacy':'missing'):['EACCES','EPERM'].includes(error.code)?'unavailable':'invalid');}
 result.lastAttempt=state.lastAttempt;
 const success=state.lastSuccess;if(Date.parse(state.lastAttempt.at)>now+300000||(success&&(Date.parse(success.at)>now+300000||Date.parse(success.at)>Date.parse(state.lastAttempt.at)+300000)))return finish('invalid');
 let fileState=null;if(success){result.lastSuccess={fileName:success.fileName,at:success.at,bytes:success.bytes,available:false,unchanged:false};try{const stat=await lstat(join(directory,success.fileName));result.lastSuccess.available=stat.isFile();result.lastSuccess.unchanged=stat.isFile()&&stat.size===success.bytes&&Math.abs(stat.mtimeMs-success.mtimeMs)<1;fileState=!result.lastSuccess.unchanged?'changed_file':null;}catch(error){fileState=error.code==='ENOENT'?'missing_file':'unavailable';}}
 if(state.lastAttempt.status==='failed')return finish('failed');if(fileState)return finish(fileState);
 return finish(now-Date.parse(success.at)>intervalHours*3600000+300000?'overdue':'current');
}
