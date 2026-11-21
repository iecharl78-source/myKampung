import {createHash} from 'node:crypto';
import {nameKey,phoneKey} from './data-tools.js';
import {todayInMalaysia} from './public/age.js';
import {employmentStatuses,educationLevels,studyLevels} from './public/education.js';
import {audit} from './accounts.js';
const text=value=>typeof value==='string'?value.trim():value==null?'':String(value);
const validDate=(value,today)=>/^\d{4}-\d{2}-\d{2}$/.test(value)&&Number.isFinite(Date.parse(value))&&new Date(value).toISOString().slice(0,10)===value&&value<=today;
export function analyzeDataQuality(members,catalog={zones:[],housingTypes:[]},today=todayInMalaysia()){
 const people=[],findings=[],maps={name:new Map(),identification:new Map(),phone:new Map()},zoneCodes=new Set(catalog.zones.map(z=>z.code)),typeCodes=new Set(catalog.housingTypes.map(z=>z.code));
 const add=(kind,key,person)=>{if(!key)return;const map=maps[kind];if(!map.has(key))map.set(key,[]);map.get(key).push(person);};
 for(const member of members){
  let family=[],badFamily=false;try{family=typeof member.household==='string'?JSON.parse(member.household):member.household||[];if(!Array.isArray(family)){family=[];badFamily=true;}}catch{badFamily=true;}
  const candidates=[member,...family];for(const [position,raw] of candidates.entries()){
   const p=raw&&typeof raw==='object'?raw:{},head=position===0,person={key:member.id+':'+(position-1),memberId:member.id,memberName:text(member.name),personName:text(p.name),role:head?'Ahli utama':'Ahli keluarga '+position,birthDate:text(p.birthDate),isActive:member.isActive===1,zoneCode:text(member.zoneCode)},missing=[],invalid=[];
   if(!text(p.name))missing.push('Nama');
   if(!person.birthDate)missing.push('Tarikh lahir');else if(!validDate(person.birthDate,today))invalid.push('Tarikh lahir');
   const employment=text(p.employmentStatus);if(!employment)missing.push('Status pekerjaan');else if(!employmentStatuses.includes(employment))invalid.push('Status pekerjaan');
   if(employment==='Pelajar'){const level=text(p.educationLevel);if(!level)missing.push('Tahap pendidikan pelajar');else if(!educationLevels.includes(level))invalid.push('Tahap pendidikan pelajar');if(level==='Universiti'){if(!text(p.studyLevel))missing.push('Tahap pengajian universiti');else if(!studyLevels.includes(p.studyLevel))invalid.push('Tahap pengajian universiti');}}
   const identification=text(p.identificationNumber).replace(/[\s-]/g,'').toUpperCase();if(identification&&!/^[A-Z0-9]{5,30}$/.test(identification))invalid.push('Format nombor pengenalan');
   if(text(p.email)&&(text(p.email).length>254||!/^\S+@[^\s@]+\.[^\s@]+$/.test(text(p.email))))invalid.push('E-mel');
   if(head){
    const phone=text(p.phone);if(!phone)missing.push('Telefon');else if(!/^[+\d\s()-]{7,30}$/.test(phone)||phone.replace(/\D/g,'').length<7)invalid.push('Telefon');
    if(!text(p.address1))missing.push('Alamat 1');if(!text(p.country))missing.push('Negara');
    if(text(p.country).toLowerCase()==='malaysia'){for(const [key,label] of [['district','Daerah'],['state','Negeri'],['postcode','Poskod']])if(!text(p[key]))missing.push(label);if(text(p.postcode)&&!/^\d{5}$/.test(text(p.postcode)))invalid.push('Poskod Malaysia');}
    if(!person.zoneCode){if(catalog.zones.some(z=>z.isActive===1))missing.push('Zon komuniti');}else if(!zoneCodes.has(person.zoneCode))invalid.push('Zon tiada dalam katalog');
    if(!text(p.housingTypeCode)){if(catalog.housingTypes.some(z=>z.isActive===1))missing.push('Jenis rumah');}else if(!typeCodes.has(p.housingTypeCode))invalid.push('Jenis rumah tiada dalam katalog');
    const lat=text(p.latitude),lng=text(p.longitude);if(Boolean(lat)!==Boolean(lng))invalid.push('Koordinat tidak berpasangan');else if(lat&&(!/^-?\d{1,3}(\.\d{1,8})?$/.test(lat)||Math.abs(Number(lat))>90||!/^-?\d{1,3}(\.\d{1,8})?$/.test(lng)||Math.abs(Number(lng))>180))invalid.push('Koordinat di luar format/julat');
    if(badFamily)invalid.push('Senarai ahli keluarga tidak dapat dibaca');
    const digits=phoneKey(phone);if(digits.length>=7)add('phone',digits,person);
   }else{
    if(!text(p.relationship))missing.push('Hubungan keluarga');const lives=text(p.livesWithMember);if(!lives)missing.push('Status tinggal bersama');else if(!['Ya','Tidak'].includes(lives))invalid.push('Status tinggal bersama');
    if(lives==='Tidak'){if(!text(p.residenceAddress1))missing.push('Alamat keluarga berasingan');if(!text(p.residenceCountry))missing.push('Negara kediaman keluarga');if(text(p.residenceCountry).toLowerCase()==='malaysia'&&text(p.residencePostcode)&&!/^\d{5}$/.test(text(p.residencePostcode)))invalid.push('Poskod keluarga Malaysia');}
   }
   people.push(person);if(missing.length||invalid.length)findings.push({...person,missing,invalid});
   add('name',nameKey(person.personName),person);if(/^[A-Z0-9]{5,30}$/.test(identification))add('identification',identification,person);
  }
 }
 const groups=[];for(const [kind,map] of Object.entries(maps))for(const [key,items] of map)if(items.length>1)groups.push({id:createHash('sha256').update(kind+':'+key).digest('hex').slice(0,32),kind,label:kind==='name'?'Nama sama':kind==='identification'?'Nombor pengenalan sama':'Telefon dikongsi',count:items.length,people:items});
 return {people,findings,groups};
}
export function dataQualityRoute({req,res,path,user,db,json}){
 const detail=path.match(/^\/api\/data-quality\/duplicates\/([a-f0-9]{32})$/);if(path!=='/api/data-quality'&&!detail)return false;
 if(user.role!=='admin'){json(res,403,{error:'Laporan kualiti data terhad kepada pentadbir.'});return true;}if(req.method!=='GET'){json(res,405,{error:'Laporan kualiti data hanya boleh dibaca.'});return true;}
 const url=new URL(req.url,'http://localhost'),page=Number(url.searchParams.get('page')||1),view=url.searchParams.get('view')||'findings',scope=url.searchParams.get('scope')||'active',category=url.searchParams.get('category')||'all',q=(url.searchParams.get('q')||'').trim(),zone=url.searchParams.get('zone')||'';
 if(!Number.isSafeInteger(page)||page<1||page>100000||!['findings','duplicates'].includes(view)||!['active','inactive','all'].includes(scope)||!['all','missing','invalid'].includes(category)||q.length>200||zone.length>100)throw Error('Maklumat penapis kualiti data tidak sah.');
 const catalog={zones:db.prepare('SELECT code,name,isActive FROM community_zones ORDER BY code').all(),housingTypes:db.prepare('SELECT code,isActive FROM housing_types').all()},data=analyzeDataQuality(db.prepare('SELECT * FROM members ORDER BY id').all(),catalog);
 if(detail){const group=data.groups.find(g=>g.id===detail[1]);if(!group){json(res,404,{error:'Padanan tidak lagi ditemui. Muat semula laporan.'});return true;}audit(db,user,'Lihat kumpulan padanan data','kualiti data',group.kind);json(res,200,{id:group.id,label:group.label,total:group.count,page,pageSize:10,rows:group.people.slice((page-1)*10,page*10)});return true;}
 const zoneNames=new Map(catalog.zones.map(z=>[z.code,z.name]));for(const p of data.people)if(p.zoneCode&&!zoneNames.has(p.zoneCode))zoneNames.set(p.zoneCode,p.zoneCode+' (semak katalog)');
 const selected=data.people.filter(p=>(scope==='all'||p.isActive===(scope==='active'))&&(!zone||(zone==='__missing__'?!p.zoneCode:p.zoneCode===zone))&&(!q||(p.memberName+' '+p.personName+' '+(zoneNames.get(p.zoneCode)||'')).toLocaleLowerCase('ms').includes(q.toLocaleLowerCase('ms')))),keys=new Set(selected.map(p=>p.key)),findings=data.findings.filter(p=>keys.has(p.key)),groups=data.groups.filter(g=>g.people.some(p=>keys.has(p.key)));
 const rows=view==='duplicates'?groups.map(({people,...g})=>({...g,preview:people.slice(0,3)})):findings.filter(p=>category==='all'||p[category].length>0);
 audit(db,user,'Lihat laporan kualiti data','kualiti data',view);
 json(res,200,{generatedAt:new Date().toISOString(),view,page,pageSize:20,total:rows.length,rows:rows.slice((page-1)*20,page*20),zones:[...zoneNames].map(([code,name])=>({code,name})),summary:{households:new Set(selected.map(p=>p.memberId)).size,people:selected.length,missingPeople:findings.filter(p=>p.missing.length).length,invalidPeople:findings.filter(p=>p.invalid.length).length,duplicateGroups:groups.length}});return true;
}
