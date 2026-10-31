import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { mkdtemp,rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { createBackup } from '../data-tools.js';
import { DatabaseSync } from 'node:sqlite';

test('Pendaftaran awam menunggu kelulusan, keputusan hanya pentadbir, pendua dan sandaran',async()=>{
  const dir=await mkdtemp(join(tmpdir(),'kampung-reg-')),password=randomBytes(16).toString('hex');
  const child=spawn(process.execPath,['server.js'],{cwd:new URL('../',import.meta.url),env:{...process.env,DATA_DIR:dir,PORT:'0',HOST:'127.0.0.1',ADMIN_PASSWORD:password,COOKIE_SECURE:'0'},stdio:['ignore','pipe','pipe']});
  try{
    const base=await new Promise((resolve,reject)=>{let out='',err='';const timeout=setTimeout(()=>reject(Error(err||'Startup timeout')),10000);child.stderr.on('data',v=>err+=v);child.stdout.on('data',v=>{out+=v;const m=out.match(/port (\d+)/);if(m){clearTimeout(timeout);resolve(`http://127.0.0.1:${m[1]}`);}});child.on('exit',()=>{clearTimeout(timeout);reject(Error(err));});});
    let cookie='';const req=(path,method='GET',data,auth=cookie,extra={})=>fetch(base+path,{method,headers:{Cookie:auth,'Content-Type':'application/json',...extra},body:data===undefined?undefined:JSON.stringify(data)});
    const data={name:'Pemohon Ujian',phone:'0123456789',address1:'Alamat Ujian',country:'Malaysia',employmentStatus:'Bekerja',household:[{name:'Anak Pemohon',relationship:'Anak',birthDate:'2010-01-01',employmentStatus:'Pelajar',educationLevel:'Sekolah menengah'}]};
    const input={data,username:"applicant1",password,consent:true,submissionKey:randomBytes(32).toString('hex')};
    assert.equal((await req('/daftar')).status,200);assert.equal((await req('/api/registrations')).status,401);
    assert.equal((await req('/api/registrations','POST',{...input,consent:false})).status,400);
    assert.equal((await req('/api/registrations','POST',input,'',{Origin:'https://other.example'})).status,403);
    let response=await req('/api/registrations','POST',input);assert.equal(response.status,201);const receipt=await response.json();assert.equal(receipt.status,'pending');assert.match(receipt.reference,/^MK-[a-f0-9]{16}$/);
    response=await req('/api/registrations','POST',input);assert.equal(response.status,200);assert.equal((await response.json()).reference,receipt.reference);
    assert.equal((await req('/api/registrations','POST',{...input,data:{...data,name:'Changed'}})).status,409);
    let status=await (await req('/api/registration-status?reference='+receipt.reference)).json();assert.equal(status.status,'pending');assert.equal(status.name,undefined);assert.equal(status.phone,undefined);
    assert.equal((await req('/api/registration-status?reference=wrong')).status,404);
    response=await req('/api/login','POST',{password});cookie=response.headers.get('set-cookie').split(';')[0];
    assert.equal((await (await req('/api/members')).json()).length,0);
    let applications=await (await req('/api/registrations')).json();assert.equal(applications.length,1);assert.equal(applications[0].submissionKey,undefined);
    const application=applications[0],review={decision:'approve',reviewNote:'Disemak',expectedUpdatedAt:application.updatedAt};
    await req('/api/users','POST',{username:'regstaff',fullName:'Petugas',role:'petugas',password});
    response=await req('/api/login','POST',{username:'regstaff',password});const staff=response.headers.get('set-cookie').split(';')[0];
    assert.equal((await req('/api/registrations','GET',undefined,staff)).status,403);
    assert.equal((await req(`/api/registrations/${application.id}/review`,'POST',review,staff)).status,403);
    assert.equal((await req(`/api/registrations/${application.id}/review`,'POST',{...review,expectedUpdatedAt:'stale'})).status,409);
    const db=new DatabaseSync(join(dir,'kampung.sqlite'));
    db.exec("CREATE TRIGGER reject_test_registration BEFORE INSERT ON members BEGIN SELECT RAISE(ABORT,'test failure'); END;");
    try{assert.equal((await req(`/api/registrations/${application.id}/review`,'POST',review)).status,400);assert.equal((await (await req('/api/registrations')).json())[0].status,'pending');assert.equal((await (await req('/api/members')).json()).length,0);}
    finally{db.exec('DROP TRIGGER reject_test_registration');db.close();}
    response=await req(`/api/registrations/${application.id}/review`,'POST',review);assert.equal(response.status,200);const memberId=(await response.json()).memberId;
    assert.equal((await req(`/api/registrations/${application.id}/review`,'POST',review)).status,409);
    const members=await (await req('/api/members')).json();assert.equal(members.length,1);assert.equal(members[0].id,memberId);assert.equal(members[0].household[0].name,'Anak Pemohon');
    status=await (await req('/api/registration-status?reference='+receipt.reference,'GET',undefined,'')).json();assert.equal(status.status,'approved');assert.equal(status.reviewNote,'Disemak');
    // Permohonan lain menyerupai ahli diluluskan memerlukan semakan pendua.
    await req('/api/registrations','POST',{...input,username:'applicant2',submissionKey:randomBytes(32).toString('hex')},'');
    applications=await (await req('/api/registrations')).json();const duplicate=applications[0];
    response=await req(`/api/registrations/${duplicate.id}/review`,'POST',{...review,expectedUpdatedAt:duplicate.updatedAt});assert.equal(response.status,409);assert.equal((await response.json()).code,'REGISTRATION_DUPLICATE');
    assert.equal((await req(`/api/registrations/${duplicate.id}/review`,'POST',{decision:'reject',reviewNote:'',expectedUpdatedAt:duplicate.updatedAt})).status,400);
    assert.equal((await req(`/api/registrations/${duplicate.id}/review`,'POST',{decision:'reject',reviewNote:'Sudah berdaftar. Hubungi pentadbir.',expectedUpdatedAt:duplicate.updatedAt})).status,200);
    status=await (await req('/api/registration-status?reference='+duplicate.reference,'GET',undefined,'')).json();assert.equal(status.status,'rejected');assert.match(status.reviewNote,/Sudah berdaftar/);
    const snapshot=await (await req('/api/backup')).json();assert.equal(snapshot.version,5);assert.equal(snapshot.registrations.length,2);
    assert.equal((await req('/api/restore/preview','POST',createBackup(snapshot.members,snapshot.aid,snapshot.aidTypes))).status,409);
    const preview=await (await req('/api/restore/preview','POST',snapshot)).json();
    assert.equal((await req('/api/restore/confirm','POST',{previewToken:preview.previewToken,password,confirmation:'PULIHKAN'})).status,200);
    assert.equal((await (await req('/api/registrations')).json()).length,2);assert.equal((await (await req('/api/members')).json()).length,1);
    assert.ok((await (await req('/api/audit')).json()).rows.some(row=>row.action==='Lulus permohonan ahli'));
    await req('/api/registrations','POST',{...input,username:'applicant2',submissionKey:randomBytes(32).toString('hex')},'');
    const another=(await (await req('/api/registrations')).json())[0];
    response=await req(`/api/registrations/${another.id}/review`,'POST',{...review,expectedUpdatedAt:another.updatedAt});assert.equal(response.status,409);
    const checked=await response.json();
    assert.equal((await req(`/api/registrations/${another.id}/review`,'POST',{...review,expectedUpdatedAt:another.updatedAt,duplicateConfirmation:checked.confirmation})).status,200);
    assert.equal((await (await req('/api/members')).json()).length,2);
    assert.equal((await req('/api/logout','POST')).status,200);assert.equal((await req('/api/session')).status,401);
  }finally{if(child.exitCode===null){const exit=once(child,'exit');child.kill();await exit;}await rm(dir,{recursive:true,force:true});}
});
