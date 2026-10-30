import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { once } from 'node:events';
import { randomBytes } from 'node:crypto';

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
    assert.equal((await request('/api/members')).status,401);
    assert.equal((await request('/api/login','POST',{password:'wrong'})).status,401);
    let result=await request('/api/login','POST',{password});assert.equal(result.status,200);cookie=result.headers.get('set-cookie').split(';')[0];
    assert.match(result.headers.get('set-cookie'),/HttpOnly/);
    const member={name:'Ahli Ujian',phone:'0123456789',birthDate:'1990-01-01',gender:'Perempuan',occupation:'Guru',address:'Alamat ujian sahaja',household:[{name:'Anak Ujian',relationship:'Anak',birthDate:'2015-02-03'}]};
    assert.equal((await request('/api/members','POST',member,{Origin:'https://other.example'})).status,403);
    assert.equal((await request('/api/members','POST',{...member,name:''})).status,400);
    assert.equal((await request('/api/members','POST',{...member,birthDate:'2025-02-30'})).status,400);
    result=await request('/api/members','POST',member);assert.equal(result.status,201);const {id}=await result.json();
    let rows=await (await request('/api/members')).json();assert.equal(rows.length,1);assert.deepEqual(rows[0].household,member.household.map(person=>({...person,employmentStatus:'',educationLevel:'',studyLevel:''})));
    assert.equal(rows[0].address1,member.address);
    assert.equal((await request(`/api/members/${id}`,'PUT',{...member,occupation:'Pesara'})).status,200);
    const structured={...member,occupation:'Pesara',address1:'No. 1, Jalan Ujian',address2:'Kampung Ujian',postcode:'05000',district:'Kota Setar',state:'Kedah',country:'Malaysia'};
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
    assert.match(rows[0].address,/05000 Kota Setar/);
    const working={...structured,household:[{...structured.household[0],employmentStatus:'Bekerja'}]};
    assert.equal((await request(`/api/members/${id}`,'PUT',working)).status,200);
    rows=await (await request('/api/members')).json();
    assert.deepEqual(rows[0].household,[{...working.household[0],educationLevel:'',studyLevel:''}]);
    assert.equal((await request('/api/logout','POST')).status,200);
    assert.equal((await request('/api/members')).status,401);
  } finally { if(child && child.exitCode===null) await stop();await rm(dir,{recursive:true,force:true}); }
});
