import { todayInMalaysia } from './public/age.js';
import { withAudit } from './accounts.js';
import { digest } from './data-tools.js';

export const aidColumns=['id','memberId','recipientKind','recipientName','recipientBirthDate','title','category','provider','receivedDate','amountCents','quantity','unit','notes','createdAt','updatedAt'];
export const aidCategories=['Bantuan tunai','Makanan','Pendidikan','Kesihatan','Perumahan','Lain-lain'];
export function initializeAid(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS aid_records (
    id INTEGER PRIMARY KEY, memberId INTEGER NOT NULL REFERENCES members(id) ON DELETE RESTRICT,
    recipientKind TEXT NOT NULL, recipientName TEXT NOT NULL, recipientBirthDate TEXT NOT NULL,
    title TEXT NOT NULL, category TEXT NOT NULL, provider TEXT NOT NULL, receivedDate TEXT NOT NULL,
    amountCents INTEGER, quantity REAL, unit TEXT NOT NULL, notes TEXT NOT NULL,
    createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL);
    CREATE INDEX IF NOT EXISTS aid_member_date ON aid_records(memberId,receivedDate);`);
}
function text(value,max=200) {
  if(typeof value!=='string' || value.length>max) throw Error('Maklumat bantuan tidak sah atau terlalu panjang.');
  return value.trim();
}
export function validateAid(input,member,previous,historical=false) {
  if(!member || input.memberId!==member.id) throw Error('Sila pilih ahli atau isi rumah yang sah.');
  if(!historical && member.isActive!==1 && (!previous || previous.memberId!==member.id)) throw Error('Sila pilih ahli aktif untuk merekodkan bantuan baharu.');
  const recipientKind=input.recipientKind;
  if(!['ahli','isi_rumah','keluarga'].includes(recipientKind)) throw Error('Sila pilih jenis penerima bantuan.');
  let recipientName=text(input.recipientName || ''),recipientBirthDate=text(input.recipientBirthDate || '',10);
  const sameRecipient=previous && previous.memberId===member.id && previous.recipientKind===recipientKind && previous.recipientName===recipientName && previous.recipientBirthDate===recipientBirthDate;
  if(!historical && !sameRecipient) {
    if(recipientKind==='keluarga') {
      const person=member.household.find(person=>person.name===recipientName && person.birthDate===recipientBirthDate);
      if(!person) throw Error('Sila pilih ahli keluarga yang masih terdapat dalam isi rumah ini.');
    } else { recipientName=member.name;recipientBirthDate=member.birthDate; }
  }
  if(!recipientName) throw Error('Maklumat nama penerima bantuan tidak lengkap.');
  const validDate=value=>/^\d{4}-\d{2}-\d{2}$/.test(value) && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10)===value && value<=todayInMalaysia();
  if(recipientBirthDate && !validDate(recipientBirthDate)) throw Error('Tarikh lahir penerima tidak sah.');
  const title=text(input.title),provider=text(input.provider),category=text(input.category,50),receivedDate=text(input.receivedDate,10);
  if(!title || !provider || !aidCategories.includes(category)) throw Error('Sila lengkapkan nama, kategori dan pemberi bantuan.');
  if(!validDate(receivedDate)) throw Error('Tarikh bantuan diterima tidak sah atau berada pada masa hadapan.');
  let amountCents=null;
  if(input.amount!=='' && input.amount!=null) {
    const amount=String(input.amount);
    if(!/^\d{1,8}(\.\d{1,2})?$/.test(amount)) throw Error('Maklumat nilai bantuan mesti dalam RM dengan maksimum dua tempat perpuluhan.');
    const [whole,fraction='']=amount.split('.');amountCents=Number(whole)*100+Number(fraction.padEnd(2,'0'));
    if(amountCents<=0) throw Error('Maklumat nilai bantuan mesti lebih daripada sifar.');
  }
  let quantity=null,unit=text(input.unit || '',50);
  if(input.quantity!=='' && input.quantity!=null) {
    if(!/^\d+(\.\d{1,3})?$/.test(String(input.quantity)) || !Number.isFinite(Number(input.quantity)) || Number(input.quantity)<=0 || Number(input.quantity)>1000000) throw Error('Maklumat kuantiti bantuan mesti lebih daripada sifar dan tidak melebihi 1,000,000.');
    quantity=Number(input.quantity);if(!unit) throw Error('Sila isi unit bantuan, contohnya bakul atau pek.');
  } else unit='';
  if(amountCents===null && quantity===null) throw Error('Sila isi nilai RM atau kuantiti bantuan yang diterima.');
  return {memberId:member.id,recipientKind,recipientName,recipientBirthDate,title,category,provider,receivedDate,amountCents,quantity,unit,notes:text(input.notes || '',2000)};
}
export function readAidBackup(input,members) {
  if(input.version===1) return [];
  const memberMap=new Map(members.map(member=>[member.id,member])),ids=new Set();
  return input.aid.map(row=>{
    if(!row || !Number.isSafeInteger(row.id) || row.id<=0 || ids.has(row.id) || typeof row.createdAt!=='string' || !Number.isFinite(Date.parse(row.createdAt)) || typeof row.updatedAt!=='string' || !Number.isFinite(Date.parse(row.updatedAt))) throw Error('Maklumat ID atau tarikh sandaran bantuan tidak sah.');
    if(row.amountCents!==null && (!Number.isSafeInteger(row.amountCents) || row.amountCents<=0)) throw Error('Maklumat nilai sandaran bantuan tidak sah.');
    ids.add(row.id);
    const record=validateAid({...row,amount:row.amountCents===null?'':(row.amountCents/100).toFixed(2)},memberMap.get(row.memberId),null,true);
    return {...record,id:row.id,createdAt:row.createdAt,updatedAt:row.updatedAt};
  });
}
export async function aidRoutes({req,res,path,user,db,json,body,safetySnapshot}) {
  if(path!=='/api/aid' && !/^\/api\/aid\/\d+$/.test(path)) return false;
  if(path==='/api/aid' && req.method==='GET') {
    json(res,200,db.prepare('SELECT a.*,m.name AS householdName,m.isActive AS memberActive FROM aid_records a JOIN members m ON m.id=a.memberId ORDER BY a.receivedDate DESC,a.id DESC').all());return true;
  }
  const match=path.match(/^\/api\/aid\/(\d+)$/);
  if((path==='/api/aid' && req.method==='POST') || (match && req.method==='PUT')) {
    const input=await body(req),previous=match?db.prepare('SELECT * FROM aid_records WHERE id=?').get(Number(match[1])):null;
    if(match && !previous) {json(res,404,{error:'Rekod bantuan tidak ditemui.'});return true;}
    if(previous && input.expectedUpdatedAt!==previous.updatedAt) {json(res,409,{error:'Rekod bantuan telah berubah. Muat semula dan semak rekod.'});return true;}
    const raw=db.prepare('SELECT * FROM members WHERE id=?').get(Number.isSafeInteger(input.memberId)?input.memberId:-1);
    const member=raw?{...raw,household:JSON.parse(raw.household)}:null;
    const record=validateAid(input,member,previous),now=new Date().toISOString();
    const duplicates=db.prepare('SELECT * FROM aid_records WHERE memberId=? AND id!=?').all(record.memberId,previous?.id || -1).filter(row=>['recipientKind','recipientName','recipientBirthDate','title','provider','receivedDate'].every(key=>row[key].toLocaleLowerCase('ms')===record[key].toLocaleLowerCase('ms')));
    const confirmation=digest({record,duplicates});
    if(duplicates.length && input.duplicateConfirmation!==confirmation) {json(res,409,{code:'AID_DUPLICATE',error:'Bantuan serupa untuk penerima, pemberi dan tarikh yang sama telah direkodkan. Semak sebelum meneruskan.',confirmation});return true;}
    const columns=aidColumns.filter(key=>!['id','createdAt'].includes(key));
    const values={...record,updatedAt:now};
    let result;
    if(previous) result=withAudit(db,user,'Kemas kini bantuan','bantuan',previous.id,()=>db.prepare(`UPDATE aid_records SET ${columns.map(key=>`${key}=?`).join(',')} WHERE id=?`).run(...columns.map(key=>values[key]),previous.id));
    else result=withAudit(db,user,'Rekod bantuan diterima','bantuan',null,()=>db.prepare(`INSERT INTO aid_records (${columns.join(',')},createdAt) VALUES (${columns.map(()=>'?').join(',')},?)`).run(...columns.map(key=>values[key]),now));
    json(res,previous?200:201,{id:previous?.id || Number(result.lastInsertRowid)});return true;
  }
  if(match && req.method==='DELETE') {
    const input=await body(req),row=db.prepare('SELECT * FROM aid_records WHERE id=?').get(Number(match[1]));
    if(!row) {json(res,404,{error:'Rekod bantuan tidak ditemui.'});return true;}
    if(input.expectedUpdatedAt!==row.updatedAt) {json(res,409,{error:'Rekod bantuan telah berubah. Muat semula dan semak rekod.'});return true;}
    if(input.confirmation!=='PADAM') throw Error('Sila taip PADAM untuk membuang rekod bantuan.');
    const safetyBackup=safetySnapshot('sebelum-padam-bantuan');
    withAudit(db,user,'Padam bantuan','bantuan',row.id,()=>db.prepare('DELETE FROM aid_records WHERE id=?').run(row.id));
    json(res,200,{ok:true,safetyBackup});return true;
  }
  json(res,404,{error:'Halaman tidak ditemui.'});return true;
}
