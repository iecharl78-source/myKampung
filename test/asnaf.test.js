import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from '../sqlite.js';
import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {once} from 'node:events';
import {incomeCents,classifyAsnaf,initializeAsnaf,readAsnafSettings} from '../asnaf.js';
import {restoreFull} from '../scripts/restore-full.js';
const person=(income,residence='Ya')=>({monthlyIncome:income,livesWithMember:residence});
test('Asnaf: strict <, integer cents and display precision do not change eligibility',()=>{
 assert.equal(incomeCents('350.01'),35001);assert.equal(incomeCents('0'),0);for(const v of ['',null,0,'NaN','1e3','-1','1.001','100000000','1,000'])assert.equal(incomeCents(v),null);
 const member={monthlyIncome:'900',household:[person('0'),person('0')]};assert.equal(classifyAsnaf(member,35000).state,'asnaf');assert.equal(classifyAsnaf(member,30000).state,'not_asnaf');assert.equal(classifyAsnaf(member,0).state,'not_asnaf');
 member.monthlyIncome='1049.99';assert.equal(classifyAsnaf(member,35000).state,'asnaf');member.monthlyIncome='1050';assert.equal(classifyAsnaf(member,35000).state,'not_asnaf');member.monthlyIncome='1050.01';assert.equal(classifyAsnaf(member,35000).state,'not_asnaf');
});
test('Asnaf: include all living co-residents, exclude separate/deceased, never infer empty income as zero',()=>{
 const member={monthlyIncome:'900',household:[person('100'),person('0'),person('99999','Tidak'),{...person('99999'),deathDate:'2026-01-01'}]};let result=classifyAsnaf(member,35000);assert.equal(result.state,'asnaf');assert.equal(result.residentCount,3);assert.equal(result.totalIncomeCents,100000);
 member.household.push(person('','Tidak'));assert.equal(classifyAsnaf(member,35000).state,'asnaf');member.household.push(person('0',''));result=classifyAsnaf(member,35000);assert.equal(result.state,'incomplete');assert.equal(result.unknownResidenceCount,1);assert.equal(result.totalIncomeCents,null);member.household.pop();member.monthlyIncome='';result=classifyAsnaf(member,35000);assert.equal(result.state,'incomplete');assert.equal(result.missingIncomeCount,1);
 member.deathDate='2026-01-01';result=classifyAsnaf(member,35000);assert.equal(result.residentCount,2);assert.equal(result.totalIncomeCents,10000);assert.equal(result.state,'asnaf');assert.equal(classifyAsnaf({...member,household:[]},35000).state,'incomplete');assert.equal(classifyAsnaf({monthlyIncome:'0',household:null},35000).state,'incomplete');
 assert.equal(classifyAsnaf({monthlyIncome:'0',identityKey:'same',household:[{...person('0'),personKey:'same'}]},35000).state,'incomplete');
});
test('Asnaf migration preserves configured limit across repeated initialization',()=>{const db=new DatabaseSync(':memory:');try{initializeAsnaf(db);assert.equal(readAsnafSettings(db).thresholdCents,35000);db.prepare('UPDATE asnaf_settings SET thresholdCents=50000 WHERE id=1').run();initializeAsnaf(db);assert.equal(readAsnafSettings(db).thresholdCents,50000);}finally{db.close();}});
test('Asnaf API: admin-only settings, live classification, version/password/audit protections and full restore',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'asnaf-api-')),password=randomBytes(16).toString('hex');let child,db;
 async function start(){child=spawn(process.execPath,['server.js'],{cwd:new URL('../',import.meta.url),env:{...process.env,DATA_DIR:dir,PORT:'0',HOST:'127.0.0.1',ADMIN_PASSWORD:password,COOKIE_SECURE:'0',MFA_ENCRYPTION_KEY:''},stdio:['ignore','pipe','pipe']});return new Promise((resolve,reject)=>{let out='',err='';const timer=setTimeout(()=>reject(Error(err||'Timeout')),10000);child.stderr.on('data',v=>err+=v);child.stdout.on('data',v=>{out+=v;const m=out.match(/port (\d+)/);if(m){clearTimeout(timer);resolve('http://127.0.0.1:'+m[1]);}});child.on('exit',()=>{clearTimeout(timer);reject(Error(err));});});}
 async function stop(){if(child?.exitCode===null){const done=once(child,'exit');child.kill();await done;}}
 try{
 let base=await start(),admin='';const req=(path,method='GET',data,cookie=admin)=>fetch(base+path,{method,headers:{Cookie:cookie,'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});
 const login=async username=>{const r=await req('/api/login','POST',{username,password},'');assert.equal(r.status,200);return r.headers.get('set-cookie').split(';')[0];};assert.equal((await req('/api/asnaf/settings')).status,401);admin=await login('admin');
 const payload={name:'Isi Rumah Asnaf',phone:'0123456789',address1:'Rumah',employmentStatus:'Bekerja',monthlyIncome:'1050',household:[{name:'Pasangan',relationship:'Pasangan',employmentStatus:'Tidak bekerja',...person('0')},{name:'Anak',relationship:'Anak',employmentStatus:'Tidak bekerja',...person('0')}]};const created=await req('/api/members','POST',payload);assert.equal(created.status,201);const memberId=(await created.json()).id;
 for(const [username,role,id] of [['owner','ahli',memberId],['staff','petugas',null]])assert.equal((await req('/api/users','POST',{username,fullName:username,role,memberId:id,password})).status,201);const owner=await login('owner'),staff=await login('staff');for(const cookie of [owner,staff])for(const method of ['GET','PUT'])assert.equal((await req('/api/asnaf/settings',method,method==='PUT'?{}:undefined,cookie)).status,403);
 const row=async()=> (await (await req('/api/members')).json()).find(m=>m.id===memberId);assert.equal((await row()).asnaf.state,'not_asnaf');assert.equal((await (await req('/api/members','GET',undefined,staff)).json())[0].asnaf.residentCount,3);
 let settings=await (await req('/api/asnaf/settings')).json();assert.equal(settings.thresholdCents,35000);assert.equal((await req('/api/asnaf/settings','POST',{})).status,405);
 const change=patch=>req('/api/asnaf/settings','PUT',{threshold:'400.00',expectedUpdatedAt:settings.updatedAt,currentPassword:password,...patch});assert.equal((await change({currentPassword:'wrong'})).status,400);assert.equal((await change({expectedUpdatedAt:'stale'})).status,409);for(const threshold of ['',null,350,-1,'1.001','1e3','100000000'])assert.equal((await change({threshold})).status,400);
 db=new DatabaseSync(join(dir,'kampung.sqlite'));db.exec("CREATE TRIGGER fail_asnaf BEFORE INSERT ON audit_log BEGIN SELECT RAISE(ABORT,'rollback asnaf'); END");assert.equal((await change({})).status,400);assert.equal(readAsnafSettings(db).thresholdCents,35000);db.exec('DROP TRIGGER fail_asnaf');
 assert.equal((await change({})).status,200);assert.equal((await change({})).status,409);assert.equal((await row()).asnaf.state,'asnaf');settings=await (await req('/api/asnaf/settings')).json();const snapshot=await row();
 // Pending profile changes do not count until approved.
 const profile=await (await req('/api/portal/profile','GET',undefined,owner)).json();assert.equal((await req('/api/portal/profile','PUT',{...profile,monthlyIncome:'9000',expectedUpdatedAt:profile.updatedAt},owner)).status,202);assert.deepEqual((await row()).asnaf,snapshot.asnaf);
 const access=await (await req('/api/access-settings?role=petugas')).json();assert.equal((await req('/api/access-settings?role=petugas','PUT',{modules:{...access.modules,members:false},currentPassword:password,expectedUpdatedAt:access.updatedAt})).status,200);assert.equal((await req('/api/members','GET',undefined,staff)).status,403);
 const audit=db.prepare("SELECT summary FROM audit_log WHERE action='Kemas kini had pendapatan Asnaf'").get();assert.match(audit.summary,/350.00.*400.00/);assert.equal(audit.summary.includes(password),false);
 await stop();base=await start();admin=await login('admin');assert.equal((await (await req('/api/asnaf/settings')).json()).thresholdCents,40000);assert.equal((await row()).asnaf.state,'asnaf');
 const backup=await req('/api/backup/full','POST',{currentPassword:password});assert.equal(backup.status,200);const file=join(dir,'full.sqlite');await writeFile(file,Buffer.from(await backup.arrayBuffer()));const destination=join(dir,'restored');await restoreFull({source:file,destination});const copy=new DatabaseSync(join(destination,'kampung.sqlite'),{readOnly:true});try{assert.equal(readAsnafSettings(copy).thresholdCents,40000);assert.equal(copy.prepare('PRAGMA foreign_key_check').all().length,0);}finally{copy.close();}
 }finally{db?.close();await stop();await rm(dir,{recursive:true,force:true});}
});
