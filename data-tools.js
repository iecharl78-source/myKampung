import { createHash } from 'node:crypto';

export const memberColumns = ['id','name','phone','birthDate','gender','occupation','address','household','createdAt','updatedAt','address1','address2','district','postcode','state','country','employmentStatus','educationLevel','studyLevel','employerName','employerAddress','employerPhone'];
export const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const nameKey = value => value.normalize('NFKC').toLocaleLowerCase('ms').replace(/[^\p{L}\p{N}]/gu,'');
const phoneKey = value => {
  let digits=value.replace(/\D/g,'');
  if (digits.startsWith('0060')) digits=digits.slice(2);
  if (digits.startsWith('60')) digits='0'+digits.slice(2);
  return digits;
};
export function duplicateMatches(member, records, excludedId) {
  return records.filter(row=>row.id!==excludedId).flatMap(row=>{
    const reasons=[];
    if (nameKey(row.name)===nameKey(member.name)) reasons.push('Nama sama');
    if (phoneKey(row.phone)===phoneKey(member.phone)) reasons.push('Nombor telefon sama');
    return reasons.length ? [{id:row.id,name:row.name,phone:row.phone,updatedAt:row.updatedAt,reasons}] : [];
  });
}
export function createBackup(members) {
  const contents={format:'myKampung-members',version:1,createdAt:new Date().toISOString(),members};
  const backup={...contents,checksum:digest(contents)};
  if(members.length>20000 || Buffer.byteLength(JSON.stringify(backup))>10*1024*1024) throw Error('Data melebihi had sandaran 10 MB / 20,000 rekod. Sila gunakan sandaran folder data selepas menghentikan pelayan.');
  return backup;
}
export function readBackup(input, validate) {
  if (!input || input.format!=='myKampung-members' || input.version!==1 || !Array.isArray(input.members) || input.members.length>20000) throw Error('Format sandaran tidak disokong atau melebihi 20,000 rekod.');
  const contents={format:input.format,version:input.version,createdAt:input.createdAt,members:input.members};
  if (input.checksum!==digest(contents)) throw Error('Semakan integriti sandaran gagal. Fail mungkin rosak atau diubah.');
  const validTime=value=>typeof value==='string' && Number.isFinite(Date.parse(value));
  if (!validTime(input.createdAt)) throw Error('Tarikh sandaran tidak sah.');
  const ids=new Set();
  return input.members.map(row=>{
    if (!row || !Number.isSafeInteger(row.id) || row.id<=0 || ids.has(row.id) || !validTime(row.createdAt) || !validTime(row.updatedAt)) throw Error('Maklumat ID atau tarikh rekod sandaran tidak sah.');
    ids.add(row.id);
    return {...validate(row),id:row.id,createdAt:row.createdAt,updatedAt:row.updatedAt};
  });
}
