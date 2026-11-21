import {backupDirectory,backupPattern,writeBackupStatus} from './backup-status.js';
import { DatabaseSync,backup } from 'node:sqlite';
import { mkdir,chmod,readdir,unlink,rename,lstat } from 'node:fs/promises';
import { join,resolve,basename } from 'node:path';
import { randomBytes } from 'node:crypto';
import { fileURLToPath,pathToFileURL } from 'node:url';

export async function fullBackup({dataDir=process.env.DATA_DIR || fileURLToPath(new URL('../data/',import.meta.url)),backupDir=backupDirectory(),keep=Number(process.env.BACKUP_KEEP || 7),recordStatus=true}={}) {
  process.umask(0o077);
  await mkdir(backupDir,{recursive:true,mode:0o700});
  const destination=join(backupDir,`kampung-full-${new Date().toISOString().replace(/[:.]/g,'-')}-${randomBytes(4).toString('hex')}.sqlite`);
  const staging=destination+'.partial';
  let source,verified=false,success=null;
  try {
    if(!Number.isSafeInteger(keep) || keep<1 || keep>365)throw Error('BACKUP_KEEP mesti antara 1 dan 365.');
    source=new DatabaseSync(join(dataDir,'kampung.sqlite'),{readOnly:true});
    await backup(source,staging);await chmod(staging,0o600);
    const copy=new DatabaseSync(staging);
    try {copy.exec('PRAGMA journal_mode=DELETE');if(copy.prepare('PRAGMA quick_check').get().quick_check!=='ok'||copy.prepare('PRAGMA foreign_key_check').all().length) throw Error('Semakan pangkalan data sandaran gagal.');}finally{copy.close();}
    await rename(staging,destination);verified=true;const stat=await lstat(destination);success={fileName:basename(destination),at:new Date().toISOString(),bytes:stat.size,mtimeMs:stat.mtimeMs};
    const files=(await readdir(backupDir)).filter(name=>backupPattern.test(name)).sort().reverse();
    for(const name of files.filter(name=>name!==basename(destination)).slice(keep-1)) await unlink(join(backupDir,name));
    if(recordStatus)await writeBackupStatus(backupDir,{status:'success',success});
    return destination;
  } catch(error){if(recordStatus)await writeBackupStatus(backupDir,{status:'failed',success,error}).catch(()=>console.error('Keputusan sandaran tidak dapat direkodkan. Semak log dan storan.'));throw error;
  } finally {source?.close();if(!verified)await unlink(staging).catch(()=>{});}
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) fullBackup().then(()=>console.log('Sandaran penuh disahkan.')).catch(error=>{console.error(error.message);process.exitCode=1;});
