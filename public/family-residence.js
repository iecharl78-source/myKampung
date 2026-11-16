import {formatAddress} from './address.js';
export const familyResidenceLabels={livesWithMember:'Tinggal bersama ahli utama',residenceAddress1:'Alamat keluarga 1',residenceAddress2:'Alamat keluarga 2',residenceDistrict:'Daerah keluarga',residencePostcode:'Poskod keluarga',residenceState:'Negeri keluarga',residenceCountry:'Negara keluarga'};
export const familyResidenceFields=Object.keys(familyResidenceLabels);
export function normalizeFamilyResidence(input){
 if(!familyResidenceFields.some(key=>Object.hasOwn(input,key)))return {}; // Rekod lama tidak dianggap tinggal bersama secara automatik.
 const text=(key,max)=>{const value=input[key]??'';if(typeof value!=='string'||value.length>max)throw Error('Maklumat kediaman ahli keluarga tidak sah atau terlalu panjang.');return value.trim();};
 const livesWithMember=text('livesWithMember',10);if(!['','Ya','Tidak'].includes(livesWithMember))throw Error('Sila pilih sama ada ahli keluarga tinggal bersama ahli utama.');
 const result={livesWithMember,...Object.fromEntries(familyResidenceFields.slice(1).map(key=>[key,'']))};
 if(livesWithMember==='Tidak'){
  for(const key of familyResidenceFields.slice(1))result[key]=text(key,key==='residenceAddress1'?1000:key==='residenceAddress2'?500:key==='residencePostcode'?20:100);
  if(!result.residenceAddress1||!result.residenceCountry)throw Error('Sila lengkapkan Alamat 1 dan negara ahli keluarga yang tidak tinggal bersama.');
  if(result.residenceCountry.toLowerCase()==='malaysia'&&result.residencePostcode&&!/^\d{5}$/.test(result.residencePostcode))throw Error('Sila masukkan poskod keluarga Malaysia 5 digit atau kosongkan jika belum diketahui.');
 }else if(!livesWithMember&&familyResidenceFields.slice(1).some(key=>text(key,key==='residenceAddress1'?1000:key==='residenceAddress2'?500:100)))throw Error('Sila pilih Tidak sebelum mengisi alamat berasingan ahli keluarga.');
 return result;
}
export function familyResidenceAddress(person,member){
 if(person.livesWithMember==='Ya')return member.address||formatAddress(member);
 if(person.livesWithMember!=='Tidak')return '';
 return formatAddress({address1:person.residenceAddress1,address2:person.residenceAddress2,district:person.residenceDistrict,postcode:person.residencePostcode,state:person.residenceState,country:person.residenceCountry});
}
