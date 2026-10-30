import { createHash } from 'node:crypto';

export const memberColumns = ['id','name','phone','birthDate','gender','occupation','address','household','createdAt','updatedAt','address1','address2','district','postcode','state','country','employmentStatus','educationLevel','studyLevel','employerName','employerAddress','employerPhone','employerAddress1','employerAddress2','employerDistrict','employerPostcode','employerState','employerCountry','isActive','deactivatedAt','inactivityReason'];
export const digest = value => createHash('sha256').update(JSON.stringify(value)).digest('hex');
const nameKey = value => value.normalize('NFKC').toLocaleLowerCase('ms').replace(/[^\p{L}\p{N}]/gu,'');
const phoneKey = value => {
  let digits=value.replace(/\D/g,'');
  if (digits.startsWith('0060')) digits=digits.slice(2);
  if (digits.startsWith('60')) digits='0'+digits.slice(2);
  return digits;
};
export function duplicateMatches(member, records, excludedId) {
  const others=records.filter(row=>row.id!==excludedId);
  const matches=others.flatMap(row=>{
    const reasons=[];
    if (nameKey(row.name)===nameKey(member.name)) reasons.push('Nama sama');
    if (phoneKey(row.phone)===phoneKey(member.phone)) reasons.push('Nombor telefon sama');
    return reasons.length ? [{id:row.id,name:row.name,phone:row.phone,updatedAt:row.updatedAt,isActive:row.isActive ?? 1,reasons}] : [];
  });
  const people=record=>[{...record,role:'Ahli utama',index:-1},...(record.household || []).map((person,index)=>({...person,role:`Ahli keluarga ${index+1}`,index}))];
  const candidates=people(member), index=new Map();
  for(const row of others) for(const person of people(row)) {
    const key=nameKey(person.name);
    if(!index.has(key)) index.set(key,[]);
    index.get(key).push({row,person});
  }
  function familyMatch(candidate, person, row) {
    const reasons=['Nama sama'];
    if(candidate.birthDate && person.birthDate) reasons.push(candidate.birthDate===person.birthDate ? 'Tarikh lahir sama' : 'Tarikh lahir berbeza — semak identiti');
    else reasons.push('Tarikh lahir belum lengkap — semak identiti');
    const location=row ? `isi rumah ${row.name} (#${row.id})` : 'borang ini';
    return {kind:'family',id:row?.id ?? null,name:person.name,isActive:row?.isActive ?? 1,updatedAt:row?.updatedAt ?? '',candidateIndex:candidate.index,matchedIndex:person.index,reasons,
      context:`${candidate.role}: ${candidate.name} sepadan dengan ${person.role}: ${person.name} dalam ${location}.`};
  }
  for(const candidate of candidates) {
    for(const {row,person} of index.get(nameKey(candidate.name)) || []) {
      // Padanan ahli utama dengan ahli utama telah disemak melalui nama/telefon di atas.
      if(candidate.index===-1 && person.index===-1) continue;
      matches.push(familyMatch(candidate,person,row));
    }
  }
  for(let i=0;i<candidates.length;i++) for(let j=i+1;j<candidates.length;j++) {
    if(nameKey(candidates[i].name)===nameKey(candidates[j].name)) matches.push(familyMatch(candidates[i],candidates[j]));
  }
  return matches;
}
export function createBackup(members,aid) {
  const contents={format:'myKampung-members',version:aid===undefined?1:2,createdAt:new Date().toISOString(),members,...(aid===undefined?{}:{aid})};
  const backup={...contents,checksum:digest(contents)};
  if(members.length>20000 || (aid && aid.length>50000) || Buffer.byteLength(JSON.stringify(backup))>10*1024*1024) throw Error('Data melebihi had sandaran 10 MB / 20,000 ahli / 50,000 bantuan. Sila gunakan sandaran folder data selepas menghentikan pelayan.');
  return backup;
}
export function readBackup(input, validate) {
  if (!input || input.format!=='myKampung-members' || ![1,2].includes(input.version) || (input.version===2 && (!Array.isArray(input.aid) || input.aid.length>50000)) || !Array.isArray(input.members) || input.members.length>20000) throw Error('Format sandaran tidak disokong atau melebihi had 20,000 ahli / 50,000 bantuan.');
  const contents={format:input.format,version:input.version,createdAt:input.createdAt,members:input.members,...(input.version===2?{aid:input.aid}:{})};
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
