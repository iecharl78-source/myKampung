import {readBackupStatus} from './backup-status.js';
try{const status=await readBackupStatus();process.exit(status.state==='current'?0:1);}catch{process.exit(1);}
