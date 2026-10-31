import { fullBackup } from './backup-full.js';
const hours=Number(process.env.BACKUP_INTERVAL_HOURS || 24);
if(!Number.isFinite(hours) || hours<1 || hours>168) throw Error('BACKUP_INTERVAL_HOURS mesti antara 1 dan 168.');
async function run() {
  try {await fullBackup();console.log('Sandaran penuh berjadual disahkan.');}
  catch(error){console.error('Sandaran penuh gagal:',error.message);}
  setTimeout(run,hours*3600000);
}
await run();
