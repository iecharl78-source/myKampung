export const maritalStatuses=['Bujang','Berkahwin','Bercerai','Balu/Duda'];
export const residentLabels={identificationNumber:'No. pengenalan (MyKad/pasport)',nickname:'Nama panggilan',email:'E-mel',maritalStatus:'Status perkahwinan',monthlyIncome:'Pendapatan bulanan (RM)',disabilityStatus:'Status OKU',disabilityCardNumber:'No. kad OKU',disabilityBenefit:'Manfaat/bantuan OKU',disabilityIncome:'Nilai bantuan OKU bulanan (RM)'};
export const housingLabels={zoneCode:'Kod zon',housingTypeCode:'Kod jenis rumah',houseReference:'No. rujukan rumah/peta',latitude:'Latitud',longitude:'Longitud'};
export const residentFields=Object.keys(residentLabels),housingFields=Object.keys(housingLabels);
export function normalizeResident(input){
 const text=(k,n=200)=>{const v=input[k]??'';if(typeof v!=='string'||v.length>n)throw Error('Maklumat penduduk tidak sah atau terlalu panjang.');return v.trim();};
 const out=Object.fromEntries(residentFields.map(k=>[k,text(k,k==='disabilityBenefit'?500:k==='email'?254:k==='identificationNumber'?30:200)]));
 out.identificationNumber=out.identificationNumber.replace(/[\s-]/g,'').toUpperCase();
 if(out.identificationNumber&&!/^[A-Z0-9]{5,30}$/.test(out.identificationNumber))throw Error('Sila masukkan nombor pengenalan yang sah (5–30 huruf/nombor).');
 if(out.email&&(out.email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email)))throw Error('Sila masukkan e-mel yang sah atau kosongkan.');
 if(out.maritalStatus&&!maritalStatuses.includes(out.maritalStatus))throw Error('Sila pilih status perkahwinan yang sah.');
 if(!['','Ya','Tidak'].includes(out.disabilityStatus))throw Error('Sila pilih status OKU yang sah.');
 for(const k of ['monthlyIncome','disabilityIncome'])if(out[k]){if(!/^\d{1,8}(\.\d{1,2})?$/.test(out[k]))throw Error('Maklumat pendapatan mesti nilai RM tidak negatif dengan maksimum dua perpuluhan.');const [w,f='']=out[k].split('.');out[k]=`${Number(w)}.${f.padEnd(2,'0')}`;}
 if(out.disabilityStatus!=='Ya'){out.disabilityCardNumber='';out.disabilityBenefit='';out.disabilityIncome='';}
 return out;
}
export function normalizeHousing(input){
 const result={};for(const k of housingFields){const v=input[k]??'';if(typeof v!=='string'||v.length>100)throw Error('Maklumat rumah atau zon tidak sah.');result[k]=v.trim();}
 for(const k of ['zoneCode','housingTypeCode'])if(result[k]&&!/^[A-Z0-9_-]{1,30}$/.test(result[k]))throw Error('Sila pilih kod zon atau jenis rumah yang sah.');
 if(Boolean(result.latitude)!==Boolean(result.longitude))throw Error('Sila lengkapkan latitud dan longitud bersama-sama atau kosongkan kedua-duanya.');
 for(const [k,max] of [['latitude',90],['longitude',180]])if(result[k]&&(!/^-?\d{1,3}(\.\d{1,8})?$/.test(result[k])||Math.abs(Number(result[k]))>max))throw Error('Maklumat koordinat di luar julat yang sah.');
 return result;
}
