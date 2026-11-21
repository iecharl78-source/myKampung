import {mkdir,mkdtemp,rm} from 'node:fs/promises';
import {resolve,isAbsolute,join} from 'node:path';
import {tmpdir} from 'node:os';
import {pathToFileURL} from 'node:url';
export async function checkHosting({dataDir=process.env.DATA_DIR,version=process.versions.node}={}){
 const result={nodeVersion:version,checks:[],compatible:false};let scratch,db;
 const add=(name,ok,message)=>result.checks.push({name,ok,message});
 add('node',Number(version.split('.')[0])>=24,'Projek memerlukan Node.js 24 atau lebih baharu.');
 try{
  const {DatabaseSync,backup}=await import('node:sqlite');add('sqlite',typeof DatabaseSync==='function'&&typeof backup==='function','Modul node:sqlite dan API sandaran mesti tersedia.');
  if(dataDir&&!isAbsolute(dataDir)){add('dataDirectory',false,'Gunakan DATA_DIR sebagai laluan mutlak di luar direktori awam.');return result;}
  if(dataDir&&/(^|[\\/])(public_html|htdocs|www|public)([\\/]|$)/i.test(dataDir)){add('dataDirectory',false,'DATA_DIR tidak boleh berada dalam direktori awam.');return result;}
  const base=dataDir?resolve(dataDir):tmpdir();if(dataDir)await mkdir(base,{recursive:true,mode:0o700});
  scratch=await mkdtemp(join(base,'mykampung-check-'));db=new DatabaseSync(join(scratch,'probe.sqlite'));
  const mode=db.prepare('PRAGMA journal_mode=WAL').get().journal_mode;db.exec('CREATE TABLE probe(value TEXT NOT NULL);INSERT INTO probe VALUES(\'ujian\');');
  const json=db.prepare("SELECT json_extract('{\"ok\":true}','$.ok') value").get().value;
  add('sqliteWriteJsonWal',mode==='wal'&&json===1&&db.prepare('SELECT count(*) n FROM probe').get().n===1,'Ujian fail sementara, JSON SQLite dan WAL pada lokasi ini.');
  add('dataDirectory',true,dataDir?'Lokasi DATA_DIR boleh ditulis. Kesesuaian storan setempat dan penguncian antara proses perlu disahkan hosting.':'Lokasi sementara sahaja diuji; jalankan semula dengan DATA_DIR untuk lokasi sebenar.');
 }catch(error){add('runtimeOrStorage',false,error.code||error.message);}finally{db?.close();if(scratch)await rm(scratch,{recursive:true,force:true});}
 result.compatible=result.checks.every(c=>c.ok);return result;
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){const result=await checkHosting();console.log(JSON.stringify(result,null,2));console.log('Semakan ini tidak mengesahkan domain, SSL, konfigurasi Passenger atau bilangan worker.');process.exitCode=result.compatible?0:1;}
