import { calculateAge,todayInMalaysia } from './public/age.js';
import { audit } from './accounts.js';

const memberColumns=[['id','ID ahli'],['name','Nama ahli'],['status','Status'],['phone','Telefon'],['birthDate','Tarikh lahir'],['age','Umur'],['address1','Alamat 1'],['address2','Alamat 2'],['postcode','Poskod'],['district','Daerah'],['state','Negeri'],['country','Negara'],['employmentStatus','Status pekerjaan'],['occupation','Pekerjaan'],['familyCount','Bilangan keluarga'],['aidCount','Bilangan bantuan']];
const familyColumns=[['memberId','ID isi rumah'],['householdName','Ahli utama'],['status','Status isi rumah'],['name','Nama keluarga'],['relationship','Hubungan'],['birthDate','Tarikh lahir'],['age','Umur'],['employmentStatus','Status pekerjaan'],['educationLevel','Tahap pendidikan'],['studyLevel','Tahap pengajian']];
const aidColumns=[['id','ID bantuan'],['memberId','ID isi rumah'],['householdName','Ahli utama'],['status','Status isi rumah'],['recipientName','Penerima'],['recipientKind','Jenis penerima'],['title','Bantuan'],['category','Kategori'],['provider','Pemberi'],['receivedDate','Tarikh diterima'],['amount','Nilai RM'],['quantity','Kuantiti'],['unit','Unit'],['notes','Catatan']];
export function reportFilters(params) {
  const get=(key,max=200)=>{const value=(params.get(key)||'').trim();if(value.length>max)throw Error('Maklumat penapis laporan terlalu panjang.');return value;};
  const type=get('type')||'members',status=get('status')||'active',format=get('format')||'json';
  if(!['members','family','aid'].includes(type) || !['active','inactive','all'].includes(status) || !['json','csv'].includes(format)) throw Error('Maklumat jenis laporan, status atau format tidak sah.');
  const from=get('from',10),to=get('to',10);
  for(const value of [from,to])if(value && (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0,10)!==value))throw Error('Tarikh penapis laporan tidak sah.');
  if(from && to && from>to)throw Error('Tarikh mula laporan mesti sebelum atau sama dengan tarikh akhir.');
  if(type!=='aid' && (from || to || get('category')))throw Error('Sila gunakan penapis tarikh dan kategori pada laporan bantuan sahaja.');
  return {type,status,format,from,to,q:get('q'),state:get('state',100),district:get('district',100),category:get('category',50)};
}
export function buildReport(members,aid,filters,today=todayInMalaysia()) {
  const normal=value=>String(value??'').trim().toLocaleLowerCase('ms');
  const selected=members.filter(m=>(filters.status==='all' || m.isActive===(filters.status==='active'?1:0)) && (!filters.state || normal(m.state)===normal(filters.state)) && (!filters.district || normal(m.district).includes(normal(filters.district))));
  const memberMap=new Map(selected.map(m=>[m.id,m])),counts=new Map();
  for(const row of aid)counts.set(row.memberId,(counts.get(row.memberId)||0)+1);
  const status=m=>m.isActive?'Aktif':'Tidak aktif';
  let rows,columns,title,totalCents=null;
  if(filters.type==='members') {
    title='Laporan ahli komuniti';columns=memberColumns;
    rows=selected.map(m=>({...m,status:status(m),age:calculateAge(m.birthDate,today)??'',familyCount:m.household.length,aidCount:counts.get(m.id)||0}));
  } else if(filters.type==='family') {
    title='Laporan ahli keluarga';columns=familyColumns;
    rows=selected.flatMap(m=>m.household.map(person=>({...person,memberId:m.id,householdName:m.name,status:status(m),age:calculateAge(person.birthDate,today)??''})));
  } else {
    title='Laporan bantuan diterima';columns=aidColumns;
    const kinds={ahli:'Ahli utama',keluarga:'Ahli keluarga',isi_rumah:'Isi rumah'};
    rows=aid.filter(row=>memberMap.has(row.memberId) && (!filters.from || row.receivedDate>=filters.from) && (!filters.to || row.receivedDate<=filters.to) && (!filters.category || row.category===filters.category)).map(row=>({...row,householdName:memberMap.get(row.memberId).name,status:status(memberMap.get(row.memberId)),recipientKind:kinds[row.recipientKind],amount:row.amountCents===null?'':(row.amountCents/100).toFixed(2),quantity:row.quantity??''}));
  }
  if(filters.q)rows=rows.filter(row=>columns.some(([key])=>normal(row[key]).includes(normal(filters.q))));
  if(filters.type==='aid')totalCents=rows.reduce((sum,row)=>sum+(row.amountCents||0),0);
  const householdCount=new Set(rows.map(row=>filters.type==='members'?row.id:row.memberId)).size;
  const result={title,filters,generatedAt:new Date().toISOString(),columns:columns.map(([key,label])=>({key,label})),total:rows.length,householdCount,totalCents};
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
  const filters=reportFilters(new URL(req.url,'http://localhost').searchParams),report=buildReport(members(),aid(),filters);
  if(filters.format==='csv') {
    audit(db,user,'Eksport laporan CSV','laporan',filters.type,`${report.total} rekod`);
    res.writeHead(200,{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':`attachment; filename="myKampung-${filters.type}-${todayInMalaysia()}.csv"`});res.end(reportCsv(report));
  } else { audit(db,user,'Lihat laporan','laporan',filters.type,`${report.total} rekod`);json(res,200,{...report,rows:report.rows.slice(0,500),previewLimit:500}); }
  return true;
}
