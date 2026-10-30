import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm, readdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { randomBytes } from 'node:crypto';
import { createBackup } from '../data-tools.js';
import { DatabaseSync } from 'node:sqlite';

test('Aliran pentadbir, keluarga, kawalan akses dan data kekal', async () => {
  const dir = await mkdtemp(join(tmpdir(),'mykampung-'));
  const password = randomBytes(20).toString('hex');
  let child;
  async function start() {
    child=spawn(process.execPath,['server.js'],{cwd:new URL('../',import.meta.url),env:{...process.env,DATA_DIR:dir,PORT:'0',HOST:'127.0.0.1',ADMIN_PASSWORD:password,COOKIE_SECURE:'0'},stdio:['ignore','pipe','pipe']});
    return await new Promise((resolve,reject)=>{
      let out='',errors=''; const timeout=setTimeout(()=>reject(Error('Server startup timeout: '+errors)),10000);
      child.stderr.on('data',d=>errors+=d);
      child.stdout.on('data',d=>{out+=d;const match=out.match(/port (\d+)/);if(match){clearTimeout(timeout);resolve(`http://127.0.0.1:${match[1]}`);}});
      child.once('exit',()=>{clearTimeout(timeout);reject(Error('Server exited: '+errors));});
    });
  }
  async function stop() { const exited=once(child,'exit'); child.kill(); await exited; }
  try {
    let base=await start(), cookie='';
    const request=(path, method='GET', data, headers={})=>fetch(base+path,{method,headers:{'Content-Type':'application/json',Cookie:cookie,...headers},body:data===undefined?undefined:JSON.stringify(data)});
    const page=await request('/');assert.equal(page.status,200);assert.match(await page.text(),/lang="ms"/);
    const ageScript=await request('/age.js');assert.equal(ageScript.status,200);assert.match(ageScript.headers.get('content-type'),/javascript/);
    assert.equal((await request('/address.js')).status,200);
    assert.equal((await request('/education.js')).status,200);
    assert.equal((await request('/member-details.js')).status,200);
    assert.equal((await request('/api/members')).status,401);
    assert.equal((await request('/api/backup')).status,401);
    assert.equal((await request('/api/restore/preview','POST',{})).status,401);
    assert.equal((await request('/api/login','POST',{password:'wrong'})).status,401);
    let result=await request('/api/login','POST',{password});assert.equal(result.status,200);cookie=result.headers.get('set-cookie').split(';')[0];
    assert.match(result.headers.get('set-cookie'),/HttpOnly/);
    const member={name:'Ahli Ujian',phone:'0123456789',birthDate:'1990-01-01',gender:'Perempuan',occupation:'Guru',address:'Alamat ujian sahaja',household:[{name:'Anak Ujian',relationship:'Anak',birthDate:'2015-02-03'}]};
    assert.equal((await request('/api/members','POST',member,{Origin:'https://other.example'})).status,403);
    assert.equal((await request('/api/members','POST',{...member,name:''})).status,400);
    assert.equal((await request('/api/members','POST',{...member,birthDate:'2025-02-30'})).status,400);
    result=await request('/api/members','POST',member);assert.equal(result.status,201);const {id}=await result.json();
    const duplicate=await request('/api/members','POST',{...member,phone:'+60 12 3456789'});assert.equal(duplicate.status,409);
    assert.equal((await duplicate.json()).code,'DUPLICATE');
    let rows=await (await request('/api/members')).json();assert.equal(rows.length,1);assert.deepEqual(rows[0].household,member.household.map(person=>({...person,employmentStatus:'',educationLevel:'',studyLevel:''})));
    assert.equal(rows[0].address1,member.address);
    assert.equal(rows[0].employmentStatus,'');assert.equal(rows[0].employerName,'');
    assert.equal((await request(`/api/members/${id}`,'PUT',{...member,occupation:'Pesara'})).status,200);
    const structured={...member,occupation:'Pesara',address1:'No. 1, Jalan Ujian',address2:'Kampung Ujian',postcode:'05000',district:'Kota Setar',state:'Kedah',country:'Malaysia',employmentStatus:'Pesara',educationLevel:'Universiti',studyLevel:'Sarjana Muda',employerName:'Majikan Ujian',employerAddress:'Alamat majikan ujian',employerPhone:'0312345678'};
    assert.equal((await request(`/api/members/${id}`,'PUT',{...structured,employmentStatus:'Pelajar',educationLevel:'',studyLevel:''})).status,400);
    assert.equal((await request(`/api/members/${id}`,'PUT',{...structured,employerPhone:'abc'})).status,400);
    structured.household=[{...member.household[0],employmentStatus:'Pelajar',educationLevel:'Universiti',studyLevel:'Diploma'}];
    assert.equal((await request(`/api/members/${id}`,'PUT',{...structured,household:[{...structured.household[0],studyLevel:''}]})).status,400);
    assert.equal((await request(`/api/members/${id}`,'PUT',{...structured,postcode:'5000'})).status,400);
    assert.equal((await request(`/api/members/${id}`,'PUT',{...structured,postcode:''})).status,200);
    assert.equal((await request(`/api/members/${id}`,'PUT',structured)).status,200);
    assert.equal((await request('/api/members/999','PUT',member)).status,404);
    await stop();base=await start();
    assert.equal((await request('/api/members')).status,401);
    result=await request('/api/login','POST',{password});cookie=result.headers.get('set-cookie').split(';')[0];
    rows=await (await request('/api/members')).json();assert.equal(rows[0].occupation,'Pesara');assert.deepEqual(rows[0].household,structured.household);
    for (const field of ['address1','address2','postcode','district','state','country']) assert.equal(rows[0][field],structured[field]);
    for (const field of ['employmentStatus','educationLevel','studyLevel','employerName','employerAddress','employerPhone']) assert.equal(rows[0][field],structured[field]);
    assert.match(rows[0].address,/05000 Kota Setar/);
    const working={...structured,household:[{...structured.household[0],employmentStatus:'Bekerja'}]};
    assert.equal((await request(`/api/members/${id}`,'PUT',working)).status,200);
    rows=await (await request('/api/members')).json();
    assert.deepEqual(rows[0].household,[{...working.household[0],educationLevel:'',studyLevel:''}]);
    const student={...structured,name:'Pelajar Ujian',employmentStatus:'Pelajar',studyLevel:'Diploma',employerName:'',employerAddress:'',employerPhone:''};
    const warning=await request('/api/members','POST',student);assert.equal(warning.status,409);
    const acknowledgement=(await warning.json()).confirmation;
    assert.equal((await request('/api/members','POST',{...student,name:'Nama Berubah',duplicateConfirmation:acknowledgement})).status,409);
    const created=await request('/api/members','POST',{...student,duplicateConfirmation:acknowledgement}); assert.equal(created.status,201);
    const studentId=(await created.json()).id;
    rows=await (await request('/api/members')).json();
    const stored=rows.find(row=>row.id===studentId);
    assert.equal(stored.employmentStatus,'Pelajar');assert.equal(stored.studyLevel,'Diploma');assert.equal(stored.employerPhone,'');
    // Sandaran hanya mengandungi ahli, bukan akaun atau kata laluan.
    const download=await request('/api/backup');assert.equal(download.status,200);assert.match(download.headers.get('content-disposition'),/attachment/);
    const backup=await download.json();assert.equal(backup.members.length,2);assert.equal(backup.admin,undefined);assert.equal(JSON.stringify(backup).includes(password),false);
    const before=await (await request('/api/members')).json();
    assert.equal((await request('/api/restore/preview','POST',{...backup,checksum:'rosak'})).status,400);
    assert.equal((await request('/api/restore/preview','POST',createBackup([...backup.members,{...backup.members[0]}]))).status,400);
    assert.equal((await request('/api/restore/preview','POST',createBackup([{...backup.members[0],name:''}]))).status,400);
    assert.deepEqual(await (await request('/api/members')).json(),before);
    let preview=await (await request('/api/restore/preview','POST',backup)).json();assert.equal(preview.records,2);
    assert.equal((await request('/api/restore/confirm','POST',{previewToken:preview.previewToken,password,confirmation:'SALAH'})).status,400);
    const conflict=await request(`/api/members/${id}`,'PUT',{...working,employerName:'Majikan Baharu'});assert.equal(conflict.status,409);
    const confirmChange=(await conflict.json()).confirmation;
    assert.equal((await request(`/api/members/${id}`,'PUT',{...working,employerName:'Majikan Baharu',duplicateConfirmation:confirmChange})).status,200);
    assert.equal((await request('/api/restore/confirm','POST',{previewToken:preview.previewToken,password,confirmation:'PULIHKAN'})).status,409);
    const changed=await (await request('/api/members')).json();
    preview=await (await request('/api/restore/preview','POST',backup)).json();
    assert.equal((await request('/api/restore/confirm','POST',{previewToken:preview.previewToken,password:'wrong',confirmation:'PULIHKAN'})).status,400);
    assert.deepEqual(await (await request('/api/members')).json(),changed);
    preview=await (await request('/api/restore/preview','POST',backup)).json();
    // Simulasi kegagalan INSERT selepas DELETE: transaksi mesti memulihkan data semasa.
    const external=new DatabaseSync(join(dir,'kampung.sqlite'));
    external.exec("CREATE TRIGGER test_restore_failure BEFORE INSERT ON members BEGIN SELECT RAISE(ABORT, 'test failure'); END;");
    try {
      assert.equal((await request('/api/restore/confirm','POST',{previewToken:preview.previewToken,password,confirmation:'PULIHKAN'})).status,400);
      assert.deepEqual(await (await request('/api/members')).json(),changed);
    } finally { external.exec('DROP TRIGGER test_restore_failure'); external.close(); }
    const restored=await request('/api/restore/confirm','POST',{previewToken:preview.previewToken,password,confirmation:'PULIHKAN'});assert.equal(restored.status,200);
    const safety=(await restored.json()).safetyBackup;
    assert.ok((await readdir(join(dir,'backups'))).includes(safety));
    const safetyData=JSON.parse(await readFile(join(dir,'backups',safety),'utf8'));assert.deepEqual(safetyData.members,changed);
    assert.deepEqual(await (await request('/api/members')).json(),before);
    assert.equal((await request('/api/restore/confirm','POST',{previewToken:preview.previewToken,password,confirmation:'PULIHKAN'})).status,409);
    await stop();base=await start();
    result=await request('/api/login','POST',{password});assert.equal(result.status,200);cookie=result.headers.get('set-cookie').split(';')[0];
    assert.deepEqual(await (await request('/api/members')).json(),before);
    assert.equal((await request('/api/logout','POST')).status,200);
    assert.equal((await request('/api/members')).status,401);
  } finally { if(child && child.exitCode===null) await stop();await rm(dir,{recursive:true,force:true}); }
});
