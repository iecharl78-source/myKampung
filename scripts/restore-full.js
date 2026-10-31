import {DatabaseSync,backup} from 'node:sqlite';
import {mkdir,rename,rm,chmod} from 'node:fs/promises';
import {resolve,join} from 'node:path';
import {pathToFileURL} from 'node:url';
export function verifyFullDatabase(db){
 if(db.prepare('PRAGMA quick_check').get().quick_check!=='ok'||db.prepare('PRAGMA foreign_key_check').all().length)throw Error('Semakan integriti sandaran gagal.');
 for(const table of ['members','users','audit_log'])if(!db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table))throw Error('Fail ini bukan sandaran penuh myKampung yang disokong.');
 if(!db.prepare("SELECT id FROM users WHERE role='admin' AND isActive=1 LIMIT 1").get())throw Error('Sandaran mesti mempunyai sekurang-kurangnya satu akaun pentadbir aktif.');
}
export async function restoreFull({source,destination}){
 if(!source||!destination)throw Error('Nyatakan --source fail.sqlite dan --destination folder-baharu.');
 const sourcePath=resolve(source),target=resolve(destination),db=new DatabaseSync(sourcePath,{readOnly:true});let created=false;
 try{
  verifyFullDatabase(db);
  try{await mkdir(target,{mode:0o700});created=true;}catch(error){if(error.code==='EEXIST')throw Error('Folder destinasi sudah wujud. Pilih folder baharu supaya data asal tidak ditindih.');throw error;}
  const staging=join(target,'kampung.sqlite.partial');await backup(db,staging);await chmod(staging,0o600);
  const copy=new DatabaseSync(staging);try{copy.exec('PRAGMA journal_mode=DELETE');verifyFullDatabase(copy);}finally{copy.close();}
  await rename(staging,join(target,'kampung.sqlite'));return target;
 }catch(error){if(created)await rm(target,{recursive:true,force:true});throw error;}
 finally{db.close();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const args=process.argv.slice(2);const valid=args.length===4&&args[0]==='--source'&&args[2]==='--destination';
 (valid?restoreFull({source:args[1],destination:args[3]}):Promise.reject(Error('Gunakan: node scripts/restore-full.js --source fail.sqlite --destination folder-baharu'))).then(path=>console.log(`Pemulihan disahkan ke ${path}. Data asal tidak diubah. Mulakan aplikasi dengan DATA_DIR merujuk folder ini; gunakan kata laluan pentadbir daripada sandaran.`)).catch(error=>{console.error(error.message);process.exitCode=1;});
}
