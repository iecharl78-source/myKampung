import { ageLabel, todayInMalaysia } from './age.js';
import { addressFields, malaysiaStates, postcodeSuggestions } from './address.js';
import { employmentStatuses, educationLevels, studyLevels } from './education.js';
import { memberDetailFields, memberEducationLevels } from './member-details.js';
const $ = selector => document.querySelector(selector);
let members = [], editing = null, duplicateConfirmation = '', restorePreviewToken = '', fileSelection = 0, memberAction = null;
const esc = s => String(s ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function api(path, method='GET', data) {
  const response = await fetch(path,{method,headers:data ? {'Content-Type':'application/json'} : {},body:data ? JSON.stringify(data) : undefined});
  const result = await response.json();
  if (!response.ok) {
    if (response.status === 401 && path !== '/api/login') { members=[]; $('#results').replaceChildren(); $('#editor').close(); showLogin(); }
    const error=Error(result.error || 'Permintaan gagal.'); error.details=result; throw error;
  }
  return result;
}
function notice(message) { $('#notice').textContent=message; $('#notice').hidden=!message; }
function hidePassword() {
  $('#login-password').type='password';
  $('#toggle-password').textContent='Tunjuk kata laluan';
  $('#toggle-password').setAttribute('aria-pressed','false');
}
function showLogin() { hidePassword(); $('#action-dialog').close(); resetMemberAction(); $('#restore-dialog').close(); resetRestore(); $('#login').hidden=false; $('#dashboard').hidden=true; $('#logout').hidden=true; }
async function load() {
  members=await api('/api/members'); $('#login').hidden=true; $('#dashboard').hidden=false; $('#logout').hidden=false;
  const active=members.filter(m=>m.isActive===1);
  $('#member-count').textContent=active.length; $('#inactive-count').textContent=members.length-active.length;
  $('#family-count').textContent=active.reduce((n,m)=>n+m.household.length,0); render();
}
function render() {
  const query=$('#search').value.trim().toLocaleLowerCase('ms');
  const filter=$('#status-filter').value;
  const rows=members.filter(m=>(filter==='all' || m.isActive===(filter==='active'?1:0)) && [m.name,m.phone,m.address].join(' ').toLocaleLowerCase('ms').includes(query));
  $('#results').innerHTML=rows.length ? `<div class="table-wrap"><table><thead><tr><th>AHLI KOMUNITI</th><th>HUBUNGI</th><th>ALAMAT</th><th>KELUARGA</th><th>STATUS</th><th><span class="sr-only">Tindakan</span></th></tr></thead><tbody>${rows.map(m=>`<tr><td><div class="person"><span class="avatar">${esc(m.name.charAt(0).toUpperCase())}</span><div><b>${esc(m.name)}</b><small>Ahli #${String(m.id).padStart(4,'0')} · ${esc(ageLabel(m.birthDate))}</small></div></div></td><td>${esc(m.phone)}</td><td class="address">${esc(m.address)}</td><td><span class="badge">${m.household.length} orang</span></td><td><span class="badge ${m.isActive===0?'inactive-badge':''}">${m.isActive===1?'Aktif':'Tidak aktif'}</span></td><td><div class="row-actions"><button class="edit quiet" data-id="${m.id}">Lihat / edit ↗</button><button class="member-status-action quiet" data-id="${m.id}">${m.isActive===1?'Nyahaktif':'Aktifkan semula'}</button><button class="member-delete-action quiet" data-id="${m.id}">Padam</button></div></td></tr>`).join('')}</tbody></table></div><div class="table-footer">${rows.length} daripada ${members.length} rekod ahli</div>` : `<div class="empty"><span>⌂</span><h3>${members.length ? 'Tiada rekod untuk carian atau status ini' : 'Mulakan dengan ahli pertama'}</h3><p>${members.length ? 'Cuba carian lain atau pilih status Semua.' : 'Daftarkan ahli komuniti dan maklumat keluarga mereka.'}</p>${members.length ? '' : '<button class="secondary" id="empty-add">＋ Daftar ahli pertama</button>'}</div>`;
  document.querySelectorAll('.edit').forEach(b=>b.onclick=()=>openEditor(members.find(m=>m.id===Number(b.dataset.id))));
  document.querySelectorAll('.member-status-action').forEach(b=>b.onclick=()=>openMemberAction('status',members.find(m=>m.id===Number(b.dataset.id))));
  document.querySelectorAll('.member-delete-action').forEach(b=>b.onclick=()=>openMemberAction('delete',members.find(m=>m.id===Number(b.dataset.id))));
  if ($('#empty-add')) $('#empty-add').onclick=()=>openEditor();
}
function familyField(person={}) {
  const row=document.createElement('div'); row.className='family-row';
  row.innerHTML=`<label>Nama ahli keluarga<input data-field="name" maxlength="200" required value="${esc(person.name)}"></label><label>Hubungan<select data-field="relationship">${['Pasangan','Anak','Ibu','Bapa','Penjaga','Lain-lain'].map(v=>`<option ${v===person.relationship?'selected':''}>${v}</option>`).join('')}</select></label><label>Tarikh lahir<input type="date" data-field="birthDate" value="${esc(person.birthDate)}" max="${new Date().toISOString().slice(0,10)}"></label><button type="button" class="quiet remove-family" aria-label="Buang ahli keluarga">✕</button>`;
  const options=(values,current)=>'<option value="">Sila pilih</option>'+values.map(value=>`<option ${value===current?'selected':''}>${esc(value)}</option>`).join('');
  const details=document.createElement('div'); details.className='family-education';
  details.innerHTML=`<label>Status pekerjaan *<select data-field="employmentStatus" required>${options(employmentStatuses,person.employmentStatus)}</select></label><label data-section="education" hidden>Tahap pendidikan *<select data-field="educationLevel">${options(educationLevels,person.educationLevel)}</select></label><label data-section="study" hidden>Tahap pengajian *<select data-field="studyLevel">${options(studyLevels,person.studyLevel)}</select></label>`;
  row.append(details);
  const status=details.querySelector('[data-field="employmentStatus"]'), education=details.querySelector('[data-field="educationLevel"]'), study=details.querySelector('[data-field="studyLevel"]');
  const updateEducation=()=>{
    const student=status.value==='Pelajar', university=student && education.value==='Universiti';
    details.querySelector('[data-section="education"]').hidden=!student;
    details.querySelector('[data-section="study"]').hidden=!university;
    education.required=student; education.disabled=!student;
    study.required=university; study.disabled=!university;
    if (!student) education.value='';
    if (!university) study.value='';
  };
  status.addEventListener('change',updateEducation); education.addEventListener('change',updateEducation); updateEducation();
  const birthDate=row.querySelector('[data-field="birthDate"]');
  birthDate.max=todayInMalaysia();
  const age=document.createElement('span'); age.className='age-display'; age.setAttribute('aria-live','polite');
  const updateAge=()=>{ age.textContent=ageLabel(birthDate.value); };
  birthDate.after(age); birthDate.addEventListener('input',updateAge); updateAge();
  row.querySelector('button').onclick=()=>row.remove(); $('#family-fields').append(row);
}
function openEditor(member) {
  editing=member?.id ?? null; $('#member-form').reset(); $('#family-fields').replaceChildren(); $('#form-error').textContent='';
  clearDuplicates();
  $('#editor-title').textContent=member ? 'Maklumat ahli & keluarga' : 'Daftar ahli baharu';
  $('#member-status-note').textContent=member?.isActive===0 ? `Ahli tidak aktif${member.deactivatedAt ? ' sejak '+new Date(member.deactivatedAt).toLocaleDateString('ms-MY',{timeZone:'Asia/Kuala_Lumpur'}) : ''}. ${member.inactivityReason || ''}` : '';
  $('#member-status-note').hidden=member?.isActive!==0;
  if (member) { for (const key of ['name','phone','birthDate','gender','occupation',...addressFields,...memberDetailFields]) $('#member-form').elements[key].value=member[key] ?? ''; member.household.forEach(familyField); }
  updateMemberEducation();
  updatePostcodes();
  $('#member-form').elements.birthDate.max=todayInMalaysia(); updateMemberAge(); $('#editor').showModal();
}
function updateMemberAge() { $('#member-age').textContent=ageLabel($('#member-form').elements.birthDate.value); }
const selectOptions=values=>'<option value="">Sila pilih</option>'+values.map(value=>`<option>${esc(value)}</option>`).join('');
$('#member-form').elements.employmentStatus.innerHTML=selectOptions(employmentStatuses);
$('#member-form').elements.educationLevel.innerHTML=selectOptions(memberEducationLevels);
$('#member-form').elements.studyLevel.innerHTML=selectOptions(studyLevels);
function updateMemberEducation() {
  const form=$('#member-form'), student=form.elements.employmentStatus.value==='Pelajar', university=form.elements.educationLevel.value==='Universiti';
  $('#member-education-label').textContent=student ? 'Tahap pendidikan semasa *' : 'Tahap pendidikan tertinggi';
  form.elements.educationLevel.required=student;
  for (const option of form.elements.educationLevel.options) if(option.value==='Tiada pendidikan formal') option.disabled=student;
  if (student && form.elements.educationLevel.value==='Tiada pendidikan formal') form.elements.educationLevel.value='';
  $('#member-study-section').hidden=!university;
  form.elements.studyLevel.disabled=!university; form.elements.studyLevel.required=university;
  if (!university) form.elements.studyLevel.value='';
}
for (const key of ['employmentStatus','educationLevel']) $('#member-form').elements[key].addEventListener('change',updateMemberEducation);
function updatePostcodes() {
  const form=$('#member-form'), country=form.elements.country.value.trim().toLowerCase();
  const suggestions=postcodeSuggestions(members,Object.fromEntries(addressFields.map(key=>[key,form.elements[key].value])));
  $('#postcode-options').innerHTML='<option value="">Pilih poskod untuk diisi…</option>'+suggestions.map(code=>`<option value="${code}">${code}</option>`).join('');
  $('#postcode-suggestions').hidden=!suggestions.length;
  $('#postcode-help').textContent=country !== 'malaysia' ? 'Isi kod pos mengikut negara, atau kosongkan jika belum diketahui.' : suggestions.length ? 'Poskod di bawah pernah direkodkan untuk daerah dan negeri ini. Pilih hanya selepas menyemak alamat sebenar; ia mungkin berbeza mengikut kawasan.' : 'Belum ada cadangan setempat. Satu daerah atau negeri mempunyai banyak poskod. Boleh kosongkan dan lengkapkan kemudian.';
  form.elements.postcode.pattern=country==='malaysia' ? '[0-9]{5}' : '.*';
}
$('#state-options').innerHTML=malaysiaStates.map(state=>`<option value="${esc(state)}"></option>`).join('');
for (const key of ['district','state','country']) $('#member-form').elements[key].addEventListener('input',updatePostcodes);
$('#postcode-options').onchange=event=>{ if(event.target.value) $('#member-form').elements.postcode.value=event.target.value; };
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
$('#status-filter').onchange=render;
$('#add-family').onclick=()=>{ if ($('#family-fields').children.length>=30) { $('#form-error').textContent='Maksimum 30 ahli keluarga.'; return; } familyField(); };
$('#close-editor').onclick=$('#cancel-editor').onclick=()=>$('#editor').close();
function clearDuplicates() { duplicateConfirmation=''; $('#duplicate-warning').hidden=true; $('#duplicate-list').replaceChildren(); }
$('#member-form').addEventListener('input',clearDuplicates);
$('#member-form').onsubmit=async event=>{
  event.preventDefault(); $('#save-member').disabled=true; $('#confirm-duplicate').disabled=true; $('#form-error').textContent='';
  const data=Object.fromEntries(new FormData(event.target));
  data.household=[...document.querySelectorAll('.family-row')].map(row=>Object.fromEntries([...row.querySelectorAll('[data-field]')].map(input=>[input.dataset.field,input.value])));
  // Pengesahan hanya dihantar melalui butang khas, bukan butang Simpan biasa.
  if(event.submitter?.id==='confirm-duplicate') data.duplicateConfirmation=duplicateConfirmation;
  try { await api(editing ? `/api/members/${editing}` : '/api/members',editing ? 'PUT' : 'POST',data); $('#editor').close(); await load(); notice('Maklumat berjaya disimpan.'); } catch(e) {
    $('#form-error').textContent=e.message;
    if(e.details?.code==='DUPLICATE') {
      duplicateConfirmation=e.details.confirmation;
      $('#duplicate-list').innerHTML=e.details.matches.map(m=>`<li><b>${esc(m.name)}</b> · #${m.id} · ${esc(m.phone)} · ${m.isActive===0?'Tidak aktif':'Aktif'} — ${esc(m.reasons.join(', '))}</li>`).join('');
      $('#duplicate-warning').hidden=false;
    }
  } finally { $('#save-member').disabled=false; $('#confirm-duplicate').disabled=false; }
};
$('#backup').onclick=async()=>{
  $('#backup').disabled=true;
  try {
    const backup=await api('/api/backup'), url=URL.createObjectURL(new Blob([JSON.stringify(backup)],{type:'application/json'}));
    const link=document.createElement('a'); link.href=url; link.download=`myKampung-sandaran-${new Date().toISOString().replace(/[:.]/g,'-')}.json`;
    document.body.append(link); link.click(); link.remove(); setTimeout(()=>URL.revokeObjectURL(url),60000);
    notice('Fail sandaran disediakan untuk dimuat turun. Simpan di lokasi selamat; fail mengandungi maklumat peribadi.');
  } catch(error) { notice(error.message); } finally { $('#backup').disabled=false; }
};
function resetRestore() {
  fileSelection++; restorePreviewToken=''; $('#restore-form').reset(); $('#restore-preview').hidden=true; $('#restore-summary').replaceChildren(); $('#restore-error').textContent='';
  $('#restore-form').elements.password.required=false; $('#restore-form').elements.confirmation.required=false;
}
$('#open-restore').onclick=()=>{ resetRestore(); $('#restore-dialog').showModal(); };
$('#close-restore').onclick=()=>{ $('#restore-dialog').close(); resetRestore(); };
$('#restore-dialog').addEventListener('cancel',resetRestore);
$('#restore-file').onchange=async event=>{
  const selection=++fileSelection;
  restorePreviewToken=''; $('#restore-preview').hidden=true; $('#restore-error').textContent='';
  $('#restore-form').elements.password.value=''; $('#restore-form').elements.confirmation.value='';
  const file=event.target.files[0]; if(!file) return;
  try {
    if(file.size>10*1024*1024) throw Error('Had saiz fail sandaran ialah 10 MB.');
    const backup=JSON.parse(await file.text());
    // Elakkan keputusan fail lama menggantikan pilihan fail baharu.
    if(selection!==fileSelection) return;
    const preview=await api('/api/restore/preview','POST',backup);
    if(selection!==fileSelection || !$('#restore-dialog').open) return;
    restorePreviewToken=preview.previewToken;
    $('#restore-summary').textContent=`Sandaran: ${new Date(preview.createdAt).toLocaleString('ms-MY',{timeZone:'Asia/Kuala_Lumpur'})}. Mengandungi ${preview.records} ahli dan ${preview.family} ahli keluarga. ${preview.currentRecords} rekod ahli semasa akan digantikan.`;
    $('#restore-preview').hidden=false; $('#restore-form').elements.password.required=true; $('#restore-form').elements.confirmation.required=true;
  } catch(error) { if(selection===fileSelection) $('#restore-error').textContent=error instanceof SyntaxError ? 'Fail JSON tidak sah. Pilih fail sandaran myKampung.' : error.message; }
};
$('#restore-form').onsubmit=async event=>{
  event.preventDefault(); if(!restorePreviewToken) return;
  $('#restore-submit').disabled=true; $('#restore-error').textContent='';
  const password=event.target.elements.password.value; event.target.elements.password.value='';
  try {
    const result=await api('/api/restore/confirm','POST',{previewToken:restorePreviewToken,password,confirmation:event.target.elements.confirmation.value});
    $('#restore-dialog').close(); resetRestore(); await load(); notice(`${result.records} rekod ahli dipulihkan. Sandaran sebelum pemulihan disimpan dalam data/backups/${result.safetyBackup}.`);
  } catch(error) { $('#restore-error').textContent=error.message; } finally { $('#restore-submit').disabled=false; }
};


function resetMemberAction() { memberAction=null; $('#action-form').reset(); $('#action-error').textContent=''; }
function openMemberAction(type, member) {
  resetMemberAction(); memberAction={type,member};
  const deleting=type==='delete', activating=member.isActive===0;
  $('#action-title').textContent=deleting ? 'Padam rekod ahli' : activating ? 'Aktifkan semula ahli' : 'Nyahaktif ahli';
  $('#action-summary').textContent=`${member.name} · Ahli #${member.id} · ${member.phone}`;
  $('#action-description').textContent=deleting ? `Rekod ahli ini dan ${member.household.length} ahli keluarga di bawahnya akan dipadam daripada sistem. Rekod ahli lain tidak terjejas. Gunakan Nyahaktif jika ahli hanya berpindah. Sandaran sebelum pemadaman disimpan secara automatik.` : activating ? 'Ahli dan isi rumah ini akan dikira semula dalam statistik aktif. Maklumat sedia ada dikekalkan.' : 'Ahli dan isi rumah ini tidak lagi dikira dalam statistik aktif. Semua maklumat kekal dan boleh dicari melalui penapis Tidak aktif atau Semua.';
  $('#action-delete-fields').hidden=!deleting; $('#action-reason-section').hidden=deleting || activating;
  $('#action-form').elements.password.required=deleting; $('#action-form').elements.confirmation.required=deleting;
  $('#action-submit').textContent=deleting ? 'Padam ahli dan keluarga' : activating ? 'Aktifkan semula' : 'Nyahaktif ahli';
  $('#action-submit').className=deleting?'danger':'primary'; $('#action-dialog').showModal();
}
$('#close-action').onclick=$('#cancel-action').onclick=()=>{ $('#action-dialog').close(); resetMemberAction(); };
$('#action-dialog').addEventListener('cancel',resetMemberAction);
$('#action-form').onsubmit=async event=>{
  event.preventDefault(); if(!memberAction) return;
  const {type,member}=memberAction, form=event.target;
  $('#action-submit').disabled=true; $('#action-error').textContent='';
  const password=form.elements.password.value; form.elements.password.value='';
  try {
    const result=type==='delete' ? await api(`/api/members/${member.id}`,'DELETE',{expectedUpdatedAt:member.updatedAt,expectedName:member.name,confirmation:form.elements.confirmation.value,password}) : await api(`/api/members/${member.id}/status`,'POST',{expectedUpdatedAt:member.updatedAt,active:member.isActive===0,reason:form.elements.reason.value});
    $('#action-dialog').close(); resetMemberAction(); await load();
    notice(type==='delete' ? `Rekod dipadam. Sandaran keselamatan: data/backups/${result.safetyBackup}.` : member.isActive===0 ? 'Ahli telah diaktifkan semula.' : 'Ahli telah dinyahaktifkan. Rekod kekal di bawah penapis Tidak aktif.');
  } catch(error) { $('#action-error').textContent=error.message; } finally { $('#action-submit').disabled=false; }
};

try { await api('/api/session'); await load(); } catch(e) { showLogin(); if(e.message !== 'Sila log masuk.') notice(e.message); }
