import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reportFilters,buildReport,reportCsv,reportRoute } from '../reports.js';

const members=[{id:1,name:'Ahli Aktif',phone:'0123456789',isActive:1,birthDate:'1990-11-01',address1:'No. 1',state:'Kedah',district:'Kota Setar',household:[{name:'Anak Ujian',relationship:'Anak',birthDate:'2015-10-31'}]},{id:2,name:'Ahli Berpindah',phone:'0199999999',isActive:0,birthDate:'',state:'Selangor',district:'Petaling',household:[]}];
const aid=[{id:1,memberId:1,recipientName:'Anak Ujian',recipientKind:'keluarga',title:'Bakul',category:'Makanan',provider:'Agensi',receivedDate:'2026-01-01',amountCents:10025,quantity:2,unit:'bakul'},{id:2,memberId:1,recipientName:'Ahli Aktif',recipientKind:'ahli',title:'Tunai',category:'Bantuan tunai',provider:'Agensi',receivedDate:'2026-02-01',amountCents:5000,quantity:null,unit:''},{id:3,memberId:2,recipientName:'Ahli Berpindah',recipientKind:'isi_rumah',title:'Bakul',category:'Makanan',provider:'Agensi',receivedDate:'2026-01-10',amountCents:null,quantity:1,unit:'bakul'}];
const filters=query=>reportFilters(new URLSearchParams(query));

test('Laporan ahli dan keluarga mengikut isi rumah, umur dan bilangan bantuan',()=>{
  const active=buildReport(members,aid,filters('type=members'),'2026-10-31');
  assert.equal(active.total,1);assert.equal(active.rows[0].aidCount,2);assert.equal(active.rows[0].familyCount,1);assert.equal(active.rows[0].age,35);
  assert.equal(buildReport(members,aid,filters('type=members&status=all')).total,2);
  assert.equal(buildReport(members,aid,filters('type=members&status=inactive')).rows[0].name,'Ahli Berpindah');
  assert.equal(buildReport(members,aid,filters('state=Selangor&status=all')).total,1);
  assert.equal(buildReport(members,aid,filters('district=Kota&state=Kedah')).total,1);
  const family=buildReport(members,aid,filters('type=family'),'2026-10-31');assert.equal(family.rows[0].age,11);assert.equal(family.rows[0].householdName,'Ahli Aktif');assert.equal(family.householdCount,1);
  assert.equal(buildReport(members,aid,filters('q=tiada')).total,0);
  assert.equal(active.rows[0].household,undefined);
});

test('Laporan bantuan menapis tarikh/kategori dan menjumlahkan sen tanpa mencampur kuantiti',()=>{
  const result=buildReport(members,aid,filters('type=aid&status=all&from=2026-01-01&to=2026-01-31&category=Makanan'));
  assert.equal(result.total,2);assert.equal(result.householdCount,2);assert.equal(result.totalCents,10025);assert.equal(result.rows[0].amount,'100.25');assert.equal(result.rows[1].amount,'');
  const all=buildReport(members,aid,filters('type=aid&status=all'));assert.equal(all.totalCents,15025);
  assert.equal(buildReport(members,aid,filters('type=aid&q=Anak')).total,1);
  for(const query of ['type=bad','status=bad','format=html','type=aid&from=2026-02-30','type=aid&from=2026-02-01&to=2026-01-01','type=members&from=2026-01-01'])assert.throws(()=>filters(query));
});

test('CSV mempunyai BOM, pengendalian petikan/baris baharu dan perlindungan formula',()=>{
  const report={columns:[{key:'value',label:'Nilai'}],rows:[{value:'=1+1'},{value:' \t@SUM(1)'},{value:'+60123456789'},{value:'Nama, "Petikan"\nBaris baharu'},{value:'Ahli Melayu'}]};
  const csv=reportCsv(report);assert.ok(csv.startsWith('\uFEFF'));assert.match(csv,/"'=1\+1"/);assert.match(csv,/"' \t@SUM/);assert.match(csv,/"'\+60123456789"/);assert.match(csv,/"Nama, ""Petikan""\nBaris baharu"/);assert.ok(csv.endsWith('\r\n'));
});

test('Petugas disekat sebelum data laporan dibaca',()=>{
  let status;
  assert.equal(reportRoute({req:{method:'GET'},res:{},path:'/api/reports',user:{role:'petugas'},json:(_res,code)=>status=code,members:()=>{throw Error('Must not fetch');},aid:()=>{throw Error('Must not fetch');}}),true);assert.equal(status,403);
});

test('Had pratonton 500 jelas tetapi eksport mengandungi semua rekod sepadan',()=>{
  const all=Array.from({length:501},(_,index)=>({...members[0],id:index+1,name:`Ahli ${index+1}`}));
  const db={prepare:()=>({run:()=>{}})};
  let preview;
  reportRoute({req:{method:'GET',url:'/api/reports'},res:{},path:'/api/reports',user:{id:1,username:'admin',role:'admin'},db,json:(_res,_status,result)=>preview=result,members:()=>all,aid:()=>[]});
  assert.equal(preview.total,501);assert.equal(preview.rows.length,500);assert.equal(preview.previewLimit,500);
  let csv;
  reportRoute({req:{method:'GET',url:'/api/reports?format=csv'},res:{writeHead(){},end(value){csv=value;}},path:'/api/reports',user:{id:1,username:'admin',role:'admin'},db,members:()=>all,aid:()=>[]});
  assert.ok(csv.includes('Ahli 501'));
});
