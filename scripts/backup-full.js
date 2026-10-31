import { DatabaseSync,backup } from 'node:sqlite';
import { mkdir,chmod,readdir,unlink,rename } from 'node:fs/promises';
import { join,resolve } from 'node:path';
import { randomBytes } from 'node:crypto';
import { fileURLToPath,pathToFileURL } from 'node:url';

export async function fullBackup({dataDir=process.env.DATA_DIR || fileURLToPath(new URL('../data/',import.meta.url)),backupDir=process.env.BACKUP_DIR || fileURLToPath(new URL('../backups/',import.meta.url)),keep=Number(process.env.BACKUP_KEEP || 7)}={}) {
  if(!Number.isSafeInteger(keep) || keep<1 || keep>365) throw Error('BACKUP_KEEP mesti antara 1 dan 365.');
  process.umask(0o077);
  await mkdir(backupDir,{recursive:true,mode:0o700});
  const destination=join(backupDir,`kampung-full-${new Date().toISOString().replace(/[:.]/g,'-')}-${randomBytes(4).toString('hex')}.sqlite`);
  const staging=destination+'.partial';
  const source=new DatabaseSync(join(dataDir,'kampung.sqlite'),{readOnly:true});
  let verified=false;
  try {
    await backup(source,staging);await chmod(staging,0o600);
    const copy=new DatabaseSync(staging);
    try {copy.exec('PRAGMA journal_mode=DELETE');if(copy.prepare('PRAGMA quick_check').get().quick_check!=='ok') throw Error('Semakan pangkalan data sandaran gagal.');}finally{copy.close();}
    await rename(staging,destination);verified=true;
    const files=(await readdir(backupDir)).filter(name=>/^kampung-full-\d{4}-\d{2}-\d{2}T[\dZ-]+-[a-f0-9]{8}\.sqlite$/.test(name)).sort().reverse();
    for(const name of files.slice(keep)) await unlink(join(backupDir,name));
    return destination;
  } finally {source.close();if(!verified)await unlink(staging).catch(()=>{});}
}
if(process.argv[1] && import.meta.url===pathToFileURL(resolve(process.argv[1])).href) fullBackup().then(()=>console.log('Sandaran penuh disahkan.')).catch(error=>{console.error(error.message);process.exitCode=1;});
