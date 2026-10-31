import { readdirSync,statSync } from 'node:fs';
import { join } from 'node:path';
const directory=process.env.BACKUP_DIR || '/backups',hours=Number(process.env.BACKUP_INTERVAL_HOURS || 24);
try {
  const files=readdirSync(directory).filter(name=>/^kampung-full-.*\.sqlite$/.test(name));
  const latest=Math.max(0,...files.map(name=>statSync(join(directory,name)).mtimeMs));
  process.exit(latest>Date.now()-(hours*3600000+300000)?0:1);
}catch{process.exit(1);}
