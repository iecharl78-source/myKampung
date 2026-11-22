import {test} from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {randomBytes} from 'node:crypto';
import {mkdtemp,rm,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {once} from 'node:events';
import {DatabaseSync} from '../sqlite.js';
import {todayInMalaysia} from '../public/age.js';
import {familyIdentity} from '../family-identities.js';

import {khairatAmount} from '../khairat.js';

import {initializeAccessSettings,memberModules} from '../access-settings.js';

test('Migrasi akses Petugas mengekalkan tetapan Ahli dan selamat diulang',()=>{const db=new DatabaseSync(':memory:');try{db.exec("CREATE TABLE member_module_access(id INTEGER PRIMARY KEY CHECK(id=1),settings TEXT NOT NULL,updatedAt TEXT NOT NULL)");db.prepare('INSERT INTO member_module_access VALUES(1,?,?)').run(JSON.stringify({profile:false,khairat:false}),'2026-01-01');initializeAccessSettings(db);initializeAccessSettings(db);assert.equal(memberModules(db,{role:'ahli'}).profile,false);assert.equal(memberModules(db,{role:'ahli'}).khairat,false);assert.equal(Object.values(memberModules(db,{role:'petugas'})).every(Boolean),true);assert.equal(memberModules(db,{role:'admin'}).members,true);}finally{db.close();}});

test('Petugas: tetapan berasingan, sekatan modul, rujukan terhad, tiada tambahan kuasa dan kekal selepas mula semula',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'kampung-head-')),password=randomBytes(16).toString('hex');let child;
 async function start(){child=spawn(process.execPath,['server.js'],{cwd:new URL('../',import.meta.url),env:{...process.env,DATA_DIR:dir,HOST:'127.0.0.1',PORT:'0',ADMIN_PASSWORD:password,COOKIE_SECURE:'0'},stdio:['ignore','pipe','pipe']});return new Promise((resolve,reject)=>{let out='',err='';const timer=setTimeout(()=>reject(Error(err||'Timeout')),10000);child.stderr.on('data',v=>err+=v);child.stdout.on('data',v=>{out+=v;const m=out.match(/port (\d+)/);if(m){clearTimeout(timer);resolve(`http://127.0.0.1:${m[1]}`);}});child.on('exit',()=>{clearTimeout(timer);reject(Error(err));});});}
 async function stop(){if(child?.exitCode===null){const exit=once(child,'exit');child.kill();await exit;}}
 try{
 let base=await start(),admin='';const req=(path,method='GET',data,cookie=admin)=>fetch(base+path,{method,headers:{Cookie:cookie,'Content-Type':'application/json'},body:data===undefined?undefined:JSON.stringify(data)});
 const login=async username=>{const r=await req('/api/login','POST',{username,password},'');assert.equal(r.status,200,await r.clone().text());return r.headers.get('set-cookie').split(';')[0];};admin=await login('admin');
 let r=await req('/api/members','POST',{name:'Ahli Ujian',phone:'0121112222',address1:'Alamat peribadi',household:[{name:'Keluarga',relationship:'Anak',birthDate:'2000-01-01',employmentStatus:'Bekerja',livesWithMember:'Ya'}]});const memberId=(await r.json()).id;
 for(const [username,role,mid] of [['staff','petugas',null],['owner','ahli',memberId]])assert.equal((await req('/api/users','POST',{username,fullName:username,role,memberId:mid,password})).status,201);
 const staff=await login('staff'),owner=await login('owner');const endpoint='/api/access-settings?role=petugas';let settings=await (await req(endpoint)).json(),all=settings.modules;assert.equal(settings.labels.members,'Ahli & keluarga komuniti');assert.equal(settings.labels.profile,undefined);assert.equal((await req(endpoint,'GET',undefined,staff)).status,403);assert.equal((await req(endpoint,'GET',undefined,owner)).status,403);assert.equal((await req('/api/access-settings?role=admin')).status,400);
 const originalMember=await (await req('/api/access-settings')).json(),disabled=Object.fromEntries(Object.keys(all).map(k=>[k,false]));let change={modules:disabled,currentPassword:password,expectedUpdatedAt:settings.updatedAt};assert.equal((await req(endpoint,'PUT',{...change,currentPassword:'wrong'})).status,400);assert.equal((await req(endpoint,'PUT',{...change,modules:{...disabled,accounts:true}})).status,400);assert.equal((await req(endpoint,'PUT',change)).status,200);assert.equal((await req(endpoint,'PUT',change)).status,409);assert.deepEqual((await (await req('/api/access-settings')).json()).modules,originalMember.modules);
 for(const path of ['/api/members','/api/aid','/api/aid-types','/api/aid-counts','/api/announcements','/api/events','/api/questions','/api/notifications','/api/head-changes','/api/households/'+memberId+'/head-context','/api/deaths','/api/deaths/context/'+memberId,'/api/khairat','/api/khairat/1/certificate','/api/module-households?module=aid','/api/module-households?module=headChanges','/api/module-households?module=deaths'])assert.equal((await req(path,'GET',undefined,staff)).status,403,path);
 assert.equal((await req('/api/members','POST',{name:'Forbidden'},staff)).status,403);const home=await (await req('/api/dashboard','GET',undefined,staff)).json();assert.equal(home.community,null);assert.equal(home.openQuestions,0);assert.deepEqual(home.events,[]);assert.equal((await req('/api/session','GET',undefined,staff)).status,200);assert.equal((await req('/api/members')).status,200);
 // Allow operational modules without granting the full directory.
 settings=await (await req(endpoint)).json();const partial={...disabled,aid:true,headChanges:true,deaths:true};assert.equal((await req(endpoint,'PUT',{modules:partial,currentPassword:password,expectedUpdatedAt:settings.updatedAt})).status,200);
 assert.equal((await req('/api/members','GET',undefined,staff)).status,403);const aidPeople=await (await req('/api/module-households?module=aid','GET',undefined,staff)).json();assert.equal(aidPeople[0].household[0].birthDate,'2000-01-01');assert.equal(aidPeople[0].address,undefined);assert.equal(aidPeople[0].phone,undefined);const headPeople=await (await req('/api/module-households?module=headChanges','GET',undefined,staff)).json();assert.deepEqual(Object.keys(headPeople[0]).sort(),['id','isActive','name']);assert.equal((await req('/api/households/'+memberId+'/head-context','GET',undefined,staff)).status,200);assert.equal((await req('/api/aid','GET',undefined,staff)).status,200);
 for(const path of ['/api/users','/api/backup','/api/access-settings','/api/reports'])assert.equal((await req(path,'GET',undefined,staff)).status,403,path);assert.equal((await req('/api/deaths/1/review','POST',{decision:'approve'},staff)).status,403);assert.equal((await req('/api/head-changes/1/review','POST',{decision:'approve'},staff)).status,403);
 await stop();base=await start();admin=await login('admin');const after=await login('staff');assert.deepEqual((await (await req('/api/session','GET',undefined,after)).json()).user.modules,partial);assert.equal((await req('/api/members','GET',undefined,after)).status,403);
 }finally{await stop();await rm(dir,{recursive:true,force:true});}
});
