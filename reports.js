import {zoneRows,zoneColumns} from './zone-report.js';
import {acknowledgementSummary} from './aid-acknowledgements.js';
import {acknowledgementColumns,acknowledgementRows} from './aid-acknowledgement-reports.js';
import {digest} from './data-tools.js';
import {classifyAsnaf,readAsnafSettings} from './asnaf.js';
import {deathLabels} from './deaths.js';
import {familyResidenceLabels,familyResidenceAddress} from './public/family-residence.js';
import {residentLabels,housingLabels} from './public/resident-fields.js';
import { calculateAge,todayInMalaysia } from './public/age.js';
import { audit } from './accounts.js';

const memberColumns=[['id','ID ahli'],['name','Nama ahli'],['status','Status'],['phone','Telefon'],['birthDate','Tarikh lahir'],['age','Umur'],['address1','Alamat 1'],['address2','Alamat 2'],['postcode','Poskod'],['district','Daerah'],['state','Negeri'],['country','Negara'],['employmentStatus','Status pekerjaan'],['occupation','Pekerjaan'],['familyCount','Bilangan keluarga'],['aidCount','Bilangan bantuan'],...Object.entries(residentLabels),...Object.entries(housingLabels)];
const familyColumns=[['memberId','ID isi rumah'],['householdName','Ahli utama'],['status','Status isi rumah'],['name','Nama keluarga'],['relationship','Hubungan'],['birthDate','Tarikh lahir'],['age','Umur'],['employmentStatus','Status pekerjaan'],['educationLevel','Tahap pendidikan'],['studyLevel','Tahap pengajian'],...Object.entries(residentLabels),...Object.entries(familyResidenceLabels),['currentResidenceAddress','Alamat kediaman keluarga']];
const aidColumns=[['id','ID bantuan'],['memberId','ID isi rumah'],['householdName','Ahli utama'],['status','Status isi rumah'],['recipientName','Penerima'],['recipientKind','Jenis penerima'],['title','Bantuan'],['category','Kategori'],['provider','Pemberi'],['receivedDate','Tarikh diterima'],['amount','Nilai RM'],['quantity','Kuantiti'],['unit','Unit'],['notes','Catatan']];
export function reportFilters(params) {
  const get=(key,max=200)=>{const value=(params.get(key)||'').trim();if(value.length>max)throw Error('Maklumat penapis laporan terlalu panjang.');return value;};
  const type=get('type')||'members',status=get('status')||'active',format=get('format')||'json';
  if(!['members','family','aid','asnaf','acknowledgements','zones'].includes(type) || !['active','inactive','all'].includes(status) || !['json','csv'].includes(format)) throw Error('Maklumat jenis laporan, status atau format tidak sah.');
  const from=get('from',10),to=get('to',10);
  for(const value of [from,to])if(value && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0,10)!==value))throw Error('Tarikh penapis laporan tidak sah.');
  if(from && to && from>to)throw Error('Tarikh mula laporan mesti sebelum atau sama dengan tarikh akhir.');
  if(!['aid','acknowledgements','zones'].includes(type) && (from || to || get('category')))throw Error('Sila gunakan penapis tarikh dan kategori pada laporan bantuan sahaja.');
  const asnafState=get('asnafState',20)||'all',asnafSettingsUpdatedAt=get('asnafSettingsUpdatedAt',40);if(!['all','asnaf','not_asnaf','incomplete'].includes(asnafState)||(type!=='asnaf'&&(asnafState!=='all'||asnafSettingsUpdatedAt)))throw Error('Maklumat penapis Asnaf tidak sah.');
  const zoneVersion=get('zoneVersion',64);if((zoneVersion&&!/^[a-f0-9]{64}$/.test(zoneVersion))||(type!=='zones'&&zoneVersion))throw Error('Maklumat versi ringkasan zon tidak sah.');
  const ackState=get('ackState',20)||'all',ackEvidence=get('ackEvidence',20)||'all',ackVersion=get('ackVersion',64);if(!['all','none','current','stale'].includes(ackState)||!['all','with','without'].includes(ackEvidence)||(ackVersion&&!/^[a-f0-9]{64}$/.test(ackVersion))||(type!=='acknowledgements'&&(ackState!=='all'||ackEvidence!=='all'||ackVersion)))throw Error('Maklumat penapis pengakuan bantuan tidak sah.');
  return {type,status,format,from,to,zoneVersion,ackState,ackEvidence,ackVersion,asnafState,asnafSettingsUpdatedAt,q:get('q'),state:get('state',100),district:get('district',100),zoneCode:get('zoneCode',30),category:get('category',50)};
}
export function buildReport(members,aid,filters,today=todayInMalaysia(),asnafSettings=null,zoneCatalog=[]) {
  const normal=value=>String(value??'').trim().toLocaleLowerCase('ms');
  const selected=members.filter(m=>(filters.status==='all' || m.isActive===(filters.status==='active'?1:0)) && (!filters.state || normal(m.state)===normal(filters.state)) && (!filters.district || normal(m.district).includes(normal(filters.district))) && (!filters.zoneCode || normal(m.zoneCode)===normal(filters.zoneCode)));
  const memberMap=new Map(selected.map(m=>[m.id,m])),counts=new Map();
  for(const row of aid)counts.set(row.memberId,(counts.get(row.memberId)||0)+1);
  const status=m=>m.isActive?'Aktif':'Tidak aktif';
  let rows,columns,title,totalCents=null;const generatedAt=new Date().toISOString();
  if(filters.type==='members') {
    title='Laporan ahli komuniti';columns=memberColumns;
    rows=selected.map(m=>({...m,status:status(m),age:calculateAge(m.birthDate,today)??'',familyCount:m.household.length,aidCount:counts.get(m.id)||0}));
  } else if(filters.type==='asnaf') {
    if(!asnafSettings||!Number.isSafeInteger(asnafSettings.thresholdCents)||asnafSettings.thresholdCents<0)throw Error('Maklumat had Asnaf tidak tersedia.');
    title='Laporan semakan Asnaf';columns=[['id','ID ahli'],['name','Ahli utama'],['status','Status isi rumah'],['phone','Telefon'],['zoneCode','Kod zon'],['district','Daerah'],['address','Alamat'],['asnafLabel','Status Asnaf'],['residentCount','Penghuni yang dikira'],['totalIncome','Jumlah pendapatan bulanan (RM)'],['averageIncome','Pendapatan per kapita (RM)'],['threshold','Had per kapita (RM; kurang daripada)'],['reason','Maklumat perlu disemak'],['calculatedAt','Masa pengiraan (UTC)']];
    rows=selected.map(m=>{const a=classifyAsnaf(m,asnafSettings.thresholdCents);const reason=a.state==='incomplete'?[a.missingIncomeCount?`${a.missingIncomeCount} pendapatan belum lengkap`:'',a.unknownResidenceCount?`${a.unknownResidenceCount} status kediaman belum lengkap`:'',a.invalidFamily?'Rekod keluarga perlu disemak':'',!a.residentCount?'Tiada penghuni hidup yang boleh dikira':''].filter(Boolean).join('; '):'';return {id:m.id,name:m.name,status:status(m),phone:m.phone,zoneCode:m.zoneCode,district:m.district,address:m.address,asnafState:a.state,asnafLabel:{asnaf:'Acc Asnaf',not_asnaf:'Tidak memenuhi had Asnaf',incomplete:'Perlu semakan'}[a.state],residentCount:a.residentCount,totalIncome:a.totalIncomeCents===null?'':(a.totalIncomeCents/100).toFixed(2),averageIncome:a.averageIncome===null?'':a.averageIncome.toFixed(4),threshold:(a.thresholdCents/100).toFixed(2),reason,calculatedAt:generatedAt};}).filter(row=>filters.asnafState==='all'||row.asnafState===filters.asnafState);
  } else if(filters.type==='acknowledgements') {
    title='Laporan pengakuan penerimaan bantuan';columns=acknowledgementColumns;rows=acknowledgementRows(aid,memberMap,filters);
  } else if(filters.type==='zones') {
    title='Ringkasan komuniti mengikut zon';columns=zoneColumns;rows=zoneRows(selected,aid,filters,asnafSettings,zoneCatalog);
  } else if(filters.type==='family') {
    title='Laporan ahli keluarga';columns=familyColumns;
    rows=selected.flatMap(m=>m.household.map(person=>({...person,livesWithMember:person.livesWithMember||'Belum diisi',currentResidenceAddress:familyResidenceAddress(person,m),memberId:m.id,householdName:m.name,status:status(m),age:calculateAge(person.birthDate,today)??''})));
  } else {
    title='Laporan bantuan diterima';columns=aidColumns;
    const kinds={ahli:'Ahli utama',keluarga:'Ahli keluarga',isi_rumah:'Isi rumah'};
    rows=aid.filter(row=>memberMap.has(row.memberId) && (!filters.from || row.receivedDate>=filters.from) && (!filters.to || row.receivedDate<=filters.to) && (!filters.category || row.category===filters.category)).map(row=>({...row,householdName:memberMap.get(row.memberId).name,status:status(memberMap.get(row.memberId)),recipientKind:kinds[row.recipientKind],amount:row.amountCents===null?'':(row.amountCents/100).toFixed(2),quantity:row.quantity??''}));
  }
  if(filters.q)rows=rows.filter(row=>(filters.type==='zones'?columns.filter(([key])=>['zoneCode','zoneName'].includes(key)):columns).some(([key])=>normal(row[key]).includes(normal(filters.q))));
  if(['aid','acknowledgements'].includes(filters.type))totalCents=rows.reduce((sum,row)=>sum+(row.amountCents||0),0);
  if(filters.type==='zones'){totalCents=rows.reduce((sum,row)=>sum+row._amountCents,0);if(!Number.isSafeInteger(totalCents))throw Error('Maksimum jumlah nilai bantuan yang selamat untuk ringkasan telah dilepasi.');}
  const householdCount=filters.type==='zones'?rows.reduce((sum,row)=>sum+row.householdCount,0):new Set(rows.map(row=>['members','asnaf'].includes(filters.type)?row.id:row.memberId)).size;
  const result={title,filters,generatedAt,columns:columns.map(([key,label])=>({key,label})),total:rows.length,householdCount,totalCents};
  if(filters.type==='asnaf')result.asnaf={thresholdCents:asnafSettings.thresholdCents,settingsUpdatedAt:asnafSettings.updatedAt,counts:Object.fromEntries(['asnaf','not_asnaf','incomplete'].map(state=>[state,rows.filter(r=>r.asnafState===state).length]))};
  if(filters.type==='acknowledgements')result.acknowledgements={version:digest(rows),counts:Object.fromEntries(['none','current','stale'].map(state=>[state,rows.filter(r=>r._ackState===state).length])),missingEvidence:rows.filter(r=>r._missingEvidence).length};
  if(filters.type==='zones')result.zones={version:digest({rows,thresholdCents:asnafSettings.thresholdCents,settingsUpdatedAt:asnafSettings.updatedAt}),thresholdCents:asnafSettings.thresholdCents,unassignedHouseholds:rows.filter(r=>!r.zoneCode).reduce((n,r)=>n+r.householdCount,0),totals:Object.fromEntries(['residentCount','unknownResidenceCount','asnafCount','notAsnafCount','needsReviewCount','aidCount','aidHouseholdCount'].map(key=>[key,rows.reduce((n,r)=>n+r[key],0)]))};
  // Hanya medan yang ditunjukkan dimasukkan; jangan hantar objek penuh profil.
  result.rows=rows.map(row=>Object.fromEntries(columns.map(([key])=>[key,row[key]??''])));
  return result;
}
export function reportCsv(report) {
  const cell=value=>{
    let text=String(value??'');
    if(/^[\s\u0000-\u001f]*[=+\-@]/u.test(text))text="'"+text;
    return '"'+text.replace(/"/g,'""')+'"';
  };
  return '\uFEFF'+[report.columns.map(c=>cell(c.label)).join(','),...report.rows.map(row=>report.columns.map(c=>cell(row[c.key])).join(','))].join('\r\n')+'\r\n';
}
export function reportRoute({req,res,path,user,db,json,members,aid}) {
  if(path!=='/api/reports')return false;
  if(user.role!=='admin'){json(res,403,{error:'Laporan dan eksport terhad kepada pentadbir.'});return true;}
  if(req.method!=='GET'){json(res,405,{error:'Kaedah laporan tidak disokong.'});return true;}
  const filters=reportFilters(new URL(req.url,'http://localhost').searchParams),settings=['asnaf','zones'].includes(filters.type)?readAsnafSettings(db):null;if(settings&&filters.asnafSettingsUpdatedAt&&filters.asnafSettingsUpdatedAt!==settings.updatedAt){json(res,409,{error:'Had Asnaf telah berubah sejak pratonton. Jana laporan semula sebelum mengeksport.'});return true;}const source=members(),report=buildReport(['asnaf','zones'].includes(filters.type)?source.map(m=>deathLabels(db,m)):source,filters.type==='asnaf'?[]:filters.type==='acknowledgements'?aid().map(row=>({...row,acknowledgement:acknowledgementSummary(db,row)})):aid(),filters,undefined,settings,filters.type==='zones'?db.prepare('SELECT code,name,isActive FROM community_zones ORDER BY code').all():[]);if(report.zones&&filters.zoneVersion&&filters.zoneVersion!==report.zones.version){json(res,409,{error:'Ringkasan zon telah berubah sejak pratonton. Jana laporan semula sebelum mengeksport.'});return true;}if(report.acknowledgements&&filters.ackVersion&&filters.ackVersion!==report.acknowledgements.version){json(res,409,{error:'Maklumat bantuan atau pengakuan telah berubah sejak pratonton. Jana laporan semula sebelum mengeksport.'});return true;}
  if(filters.format==='csv') {
    audit(db,user,'Eksport laporan CSV','laporan',filters.type,`${report.total} rekod`);
    res.writeHead(200,{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="myKampung-${filters.type}-${todayInMalaysia()}.csv"`});res.end(reportCsv(report));
  } else { audit(db,user,'Lihat laporan','laporan',filters.type,`${report.total} rekod`);json(res,200,{...report,rows:report.rows.slice(0,500),previewLimit:500}); }
  return true;
}
