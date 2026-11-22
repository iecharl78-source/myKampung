import {withAudit,verifyPassword} from './accounts.js';
export function incomeCents(value){if(typeof value!=='string'||!/^\d{1,8}(\.\d{1,2})?$/.test(value.trim()))return null;const [whole,fraction='']=value.trim().split('.');return Number(whole)*100+Number(fraction.padEnd(2,'0'));}
export function initializeAsnaf(db){db.exec('CREATE TABLE IF NOT EXISTS asnaf_settings(id INTEGER PRIMARY KEY CHECK(id=1),thresholdCents INTEGER NOT NULL CHECK(thresholdCents BETWEEN 0 AND 9999999999),updatedAt TEXT NOT NULL)');db.prepare('INSERT OR IGNORE INTO asnaf_settings(id,thresholdCents,updatedAt) VALUES(1,35000,?)').run(new Date().toISOString());}
export const readAsnafSettings=db=>db.prepare('SELECT thresholdCents,updatedAt FROM asnaf_settings WHERE id=1').get();
export function classifyAsnaf(member,thresholdCents){
 let totalIncomeCents=0,residentCount=0,missingIncomeCount=0,unknownResidenceCount=0,invalidFamily=false;const keys=new Set();
 const add=person=>{const key=person.personKey||person.identityKey;if(key&&keys.has(key)){invalidFamily=true;return;}if(key)keys.add(key);residentCount++;const cents=incomeCents(person.monthlyIncome);if(cents===null)missingIncomeCount++;else totalIncomeCents+=cents;};
 if(!member.deathDate)add(member);
 if(!Array.isArray(member.household)||member.household.length>30)invalidFamily=true;else for(const person of member.household){if(!person||typeof person!=='object'){invalidFamily=true;continue;}if(person.deathDate)continue;if(person.livesWithMember==='Ya')add(person);else if(person.livesWithMember!=='Tidak')unknownResidenceCount++;}
 const complete=!invalidFamily&&!missingIncomeCount&&!unknownResidenceCount&&residentCount>0;
 return {state:complete?(totalIncomeCents<thresholdCents*residentCount?'asnaf':'not_asnaf'):'incomplete',thresholdCents,residentCount,totalIncomeCents:complete?totalIncomeCents:null,averageIncome:complete?totalIncomeCents/100/residentCount:null,missingIncomeCount,unknownResidenceCount,invalidFamily};
}
export async function asnafSettingsRoute({req,res,path,user,db,json,body,isSessionActive}){
 if(path!=='/api/asnaf/settings')return false;if(user.role!=='admin'){json(res,403,{error:'Tetapan had Asnaf terhad kepada pentadbir.'});return true;}
 if(req.method==='GET'){json(res,200,readAsnafSettings(db));return true;}
 if(req.method!=='PUT'){json(res,405,{error:'Kaedah tidak disokong.'});return true;}
 const input=await body(req);if(!isSessionActive()){json(res,401,{error:'Sila log masuk semula.'});return true;}const admin=db.prepare("SELECT * FROM users WHERE id=? AND role='admin' AND isActive=1").get(user.id);if(!admin){json(res,401,{error:'Sila log masuk semula.'});return true;}
 const latest=readAsnafSettings(db);if(input.expectedUpdatedAt!==latest.updatedAt){json(res,409,{error:'Had Asnaf telah berubah. Muat semula sebelum menyimpan.'});return true;}
 const thresholdCents=incomeCents(input.threshold);if(thresholdCents===null)throw Error('Sila isi had Asnaf antara RM0.00 dan RM99,999,999.99 dengan maksimum dua perpuluhan.');if(!verifyPassword(admin,input.currentPassword))throw Error('Kata laluan pentadbir semasa tidak tepat.');
 if(thresholdCents===latest.thresholdCents){json(res,200,{ok:true,...latest});return true;}const updatedAt=new Date(Math.max(Date.now(),Date.parse(latest.updatedAt)+1)).toISOString();
 withAudit(db,user,'Kemas kini had pendapatan Asnaf','tetapan Asnaf',1,()=>db.prepare('UPDATE asnaf_settings SET thresholdCents=?,updatedAt=? WHERE id=1').run(thresholdCents,updatedAt),`Had per kapita: RM${(latest.thresholdCents/100).toFixed(2)} → RM${(thresholdCents/100).toFixed(2)}`);json(res,200,{ok:true,thresholdCents,updatedAt});return true;
}
