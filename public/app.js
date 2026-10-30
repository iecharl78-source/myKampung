import { ageLabel, todayInMalaysia } from './age.js';
const $ = selector => document.querySelector(selector);
let members = [], editing = null;
const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function api(path, method='GET', data) {
  const response = await fetch(path,{method,headers:data ? {'Content-Type':'application/json'} : {},body:data ? JSON.stringify(data) : undefined});
  const result = await response.json();
  if (!response.ok) {
    if (response.status === 401 && path !== '/api/login') { members=[]; $('#results').replaceChildren(); $('#editor').close(); showLogin(); }
    throw Error(result.error || 'Permintaan gagal.');
  }
  return result;
}
function notice(message) { $('#notice').textContent=message; $('#notice').hidden=!message; }
function hidePassword() {
  $('#login-password').type='password';
  $('#toggle-password').textContent='Tunjuk kata laluan';
  $('#toggle-password').setAttribute('aria-pressed','false');
}
function showLogin() { hidePassword(); $('#login').hidden=false; $('#dashboard').hidden=true; $('#logout').hidden=true; }
async function load() {
  members=await api('/api/members'); $('#login').hidden=true; $('#dashboard').hidden=false; $('#logout').hidden=false;
  $('#member-count').textContent=members.length; $('#family-count').textContent=members.reduce((n,m)=>n+m.household.length,0); render();
}
function render() {
  const query=$('#search').value.trim().toLocaleLowerCase('ms');
  const rows=members.filter(m=>[m.name,m.phone,m.address].join(' ').toLocaleLowerCase('ms').includes(query));
  $('#results').innerHTML=rows.length ? `<div class="table-wrap"><table><thead><tr><th>AHLI KOMUNITI</th><th>HUBUNGI</th><th>ALAMAT</th><th>KELUARGA</th><th><span class="sr-only">Tindakan</span></th></tr></thead><tbody>${rows.map(m=>`<tr><td><div class="person"><span class="avatar">${esc(m.name.charAt(0).toUpperCase())}</span><div><b>${esc(m.name)}</b><small>Ahli #${String(m.id).padStart(4,'0')} · ${esc(ageLabel(m.birthDate))}</small></div></div></td><td>${esc(m.phone)}</td><td class="address">${esc(m.address)}</td><td><span class="badge">${m.household.length} orang</span></td><td><button class="edit quiet" data-id="${m.id}">Lihat / edit ↗</button></td></tr>`).join('')}</tbody></table></div><div class="table-footer">${rows.length} daripada ${members.length} rekod ahli</div>` : `<div class="empty"><span>⌂</span><h3>${query ? 'Tiada rekod dijumpai' : 'Mulakan dengan ahli pertama'}</h3><p>${query ? 'Cuba nama, telefon atau alamat yang lain.' : 'Daftarkan ahli komuniti dan maklumat keluarga mereka.'}</p>${query ? '' : '<button class="secondary" id="empty-add">＋ Daftar ahli pertama</button>'}</div>`;
  document.querySelectorAll('.edit').forEach(b=>b.onclick=()=>openEditor(members.find(m=>m.id===Number(b.dataset.id))));
  if ($('#empty-add')) $('#empty-add').onclick=()=>openEditor();
}
function familyField(person={}) {
  const row=document.createElement('div'); row.className='family-row';
  row.innerHTML=`<label>Nama ahli keluarga<input data-field="name" maxlength="200" required value="${esc(person.name)}"></label><label>Hubungan<select data-field="relationship">${['Pasangan','Anak','Ibu','Bapa','Penjaga','Lain-lain'].map(v=>`<option ${v===person.relationship?'selected':''}>${v}</option>`).join('')}</select></label><label>Tarikh lahir<input type="date" data-field="birthDate" value="${esc(person.birthDate)}" max="${new Date().toISOString().slice(0,10)}"></label><button type="button" class="quiet remove-family" aria-label="Buang ahli keluarga">✕</button>`;
  const birthDate=row.querySelector('[data-field="birthDate"]');
  birthDate.max=todayInMalaysia();
  const age=document.createElement('span'); age.className='age-display'; age.setAttribute('aria-live','polite');
  const updateAge=()=>{ age.textContent=ageLabel(birthDate.value); };
  birthDate.after(age); birthDate.addEventListener('input',updateAge); updateAge();
  row.querySelector('button').onclick=()=>row.remove(); $('#family-fields').append(row);
}
function openEditor(member) {
  editing=member?.id ?? null; $('#member-form').reset(); $('#family-fields').replaceChildren(); $('#form-error').textContent='';
  $('#editor-title').textContent=member ? 'Maklumat ahli & keluarga' : 'Daftar ahli baharu';
  if (member) { for (const key of ['name','phone','birthDate','gender','occupation','address']) $('#member-form').elements[key].value=member[key]; member.household.forEach(familyField); }
  $('#member-form').elements.birthDate.max=todayInMalaysia(); updateMemberAge(); $('#editor').showModal();
}
function updateMemberAge() { $('#member-age').textContent=ageLabel($('#member-form').elements.birthDate.value); }
$('#member-form').elements.birthDate.addEventListener('input',updateMemberAge);
$('#toggle-password').onclick=()=>{
  const visible=$('#login-password').type==='password';
  $('#login-password').type=visible ? 'text' : 'password';
  $('#toggle-password').textContent=visible ? 'Sembunyi kata laluan' : 'Tunjuk kata laluan';
  $('#toggle-password').setAttribute('aria-pressed',String(visible));
};
$('#login-form').onsubmit=async event=>{
  event.preventDefault(); const button=event.target.querySelector('button[type="submit"]'); button.disabled=true; notice('');
  const password=event.target.elements.password.value; hidePassword();
  try { await api('/api/login','POST',{password}); event.target.reset(); await load(); } catch(e) { notice(e.message); } finally { button.disabled=false; }
};
$('#logout').onclick=async()=>{ try { await api('/api/logout','POST'); members=[]; $('#results').replaceChildren(); showLogin(); notice('Anda telah log keluar.'); } catch(e) { notice(e.message); } };
$('#search').oninput=render; $('#add-member').onclick=()=>openEditor();
$('#add-family').onclick=()=>{ if ($('#family-fields').children.length>=30) { $('#form-error').textContent='Maksimum 30 ahli keluarga.'; return; } familyField(); };
$('#close-editor').onclick=$('#cancel-editor').onclick=()=>$('#editor').close();
$('#member-form').onsubmit=async event=>{
  event.preventDefault(); $('#save-member').disabled=true; $('#form-error').textContent='';
  const data=Object.fromEntries(new FormData(event.target));
  data.household=[...document.querySelectorAll('.family-row')].map(row=>Object.fromEntries([...row.querySelectorAll('[data-field]')].map(input=>[input.dataset.field,input.value])));
  try { await api(editing ? `/api/members/${editing}` : '/api/members',editing ? 'PUT' : 'POST',data); $('#editor').close(); await load(); notice('Maklumat berjaya disimpan.'); } catch(e) { $('#form-error').textContent=e.message; } finally { $('#save-member').disabled=false; }
};
try { await api('/api/session'); await load(); } catch(e) { showLogin(); if(e.message !== 'Sila log masuk.') notice(e.message); }
