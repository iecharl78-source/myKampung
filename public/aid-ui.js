import { todayInMalaysia } from './age.js';

export function setupAidUI({api,showPanel,getUser,notice}) {
  const $=selector=>document.querySelector(selector);
  const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money=cents=>new Intl.NumberFormat('ms-MY',{style:'currency',currency:'MYR'}).format(cents/100);
  const kinds={ahli:'Ahli utama',isi_rumah:'Isi rumah',keluarga:'Ahli keluarga'};
  let records=[],members=[],types=[],editingType=null,profileMember=null,editing=null,confirmation='',deleting=null;
  async function load() {
    [records,members,types]=await Promise.all([api('/api/aid'),api('/api/members'),api('/api/aid-types')]);
    const selected=$('#aid-member-filter').value;
    $('#aid-member-filter').innerHTML='<option value="">Semua isi rumah</option>'+members.map(m=>`<option value="${m.id}">${esc(m.name)} (#${m.id})</option>`).join('');
    if(members.some(m=>String(m.id)===selected)) $('#aid-member-filter').value=selected;
    render();renderTypes();renderProfile();
  }
  function render() {
    const search=$('#aid-search').value.trim().toLocaleLowerCase('ms'),memberId=$('#aid-member-filter').value,from=$('#aid-from').value,to=$('#aid-to').value;
    const rows=records.filter(row=>(!memberId || row.memberId===Number(memberId)) && (!from || row.receivedDate>=from) && (!to || row.receivedDate<=to) && [row.title,row.provider,row.recipientName,row.householdName,row.category].join(' ').toLocaleLowerCase('ms').includes(search));
    $('#aid-count').textContent=rows.length;$('#aid-total').textContent=money(rows.reduce((n,row)=>n+(row.amountCents||0),0));$('#aid-households').textContent=new Set(rows.map(row=>row.memberId)).size;
    $('#aid-list').innerHTML=rows.length?`<div class="table-wrap"><table><thead><tr><th>TARIKH / BANTUAN</th><th>PENERIMA</th><th>PEMBERI</th><th>NILAI / KUANTITI</th><th>TINDAKAN</th></tr></thead><tbody>${rows.map(row=>`<tr><td>${esc(row.receivedDate)}<br><b>${esc(row.title)}</b><br>${esc(row.category)}</td><td>${esc(row.recipientName)}<br><span class="badge">${kinds[row.recipientKind]}</span><small>Isi rumah ${esc(row.householdName)} (#${row.memberId})${row.memberActive?'':' · Tidak aktif'}</small></td><td>${esc(row.provider)}</td><td>${row.amountCents===null?'':money(row.amountCents)}<br>${row.quantity===null?'':`${row.quantity} ${esc(row.unit)}`}</td><td><button class="quiet aid-edit" data-id="${row.id}">Lihat / edit</button>${getUser()?.role==='admin'?`<button class="quiet aid-delete" data-id="${row.id}">Padam</button>`:''}</td></tr>`).join('')}</tbody></table></div><p class="table-footer">${rows.length} rekod sepadan</p>`:'<div class="empty"><h3>Tiada rekod bantuan</h3><p>Rekodkan bantuan yang telah diterima atau ubah carian anda.</p></div>';
    bindAidActions();
  }
  function bindAidActions() {
    document.querySelectorAll('.aid-edit').forEach(button=>button.onclick=()=>open(records.find(row=>row.id===Number(button.dataset.id))));
    document.querySelectorAll('.aid-delete').forEach(button=>button.onclick=()=>{deleting=records.find(row=>row.id===Number(button.dataset.id));$('#aid-delete-form').reset();$('#aid-delete-error').textContent='';$('#aid-delete-summary').textContent=`${deleting.title} · ${deleting.recipientName} · ${deleting.receivedDate}`;$('#aid-delete-dialog').showModal();});
  }
  function fillType() {
    const form=$('#aid-form'),type=types.find(type=>type.id===Number(form.elements.aidTypeId.value));
    if(type) {form.elements.title.value=type.title;form.elements.category.value=type.category;if(type.provider)form.elements.provider.value=type.provider;}
  }
  $('#aid-form').elements.aidTypeId.addEventListener('change',fillType);
  function renderProfile() {
    if(!profileMember) return;
    const rows=records.filter(row=>row.memberId===profileMember.id);
    $('#member-aid-add').hidden=profileMember.isActive!==1;
    $('#member-aid-summary').textContent=`${rows.length} rekod bantuan`+` · Jumlah nilai ${money(rows.reduce((sum,row)=>sum+(row.amountCents||0),0))}`;
    $('#member-aid-list').innerHTML=rows.length?`<div class="table-wrap"><table><thead><tr><th>BANTUAN / TARIKH</th><th>PENERIMA</th><th>PEMBERI</th><th>NILAI / KUANTITI</th><th></th></tr></thead><tbody>${rows.map(row=>`<tr><td>${esc(row.title)}<br>${esc(row.receivedDate)}</td><td>${esc(row.recipientName)}<br>${kinds[row.recipientKind]}</td><td>${esc(row.provider)}</td><td>${row.amountCents===null?'':money(row.amountCents)}<br>${row.quantity===null?'':`${row.quantity} ${esc(row.unit)}`}</td><td><button type="button" class="quiet aid-edit" data-id="${row.id}">Lihat / edit</button>${getUser()?.role==='admin'?`<button type="button" class="quiet aid-delete" data-id="${row.id}">Padam</button>`:''}</td></tr>`).join('')}</tbody></table></div>`:'<p class="hint">Belum ada bantuan diterima yang direkodkan untuk ahli atau isi rumah ini.</p>';
    bindAidActions();
  }
  function renderTypes() {
    $('#aid-type-management').hidden=getUser()?.role!=='admin';
    $('#aid-types-list').innerHTML=types.length?`<div class="table-wrap"><table><thead><tr><th>JENIS BANTUAN</th><th>KATEGORI</th><th>PEMBERI ASAL</th><th>STATUS</th><th></th></tr></thead><tbody>${types.map(type=>`<tr><td>${esc(type.title)}</td><td>${esc(type.category)}</td><td>${esc(type.provider)}</td><td>${type.isActive?'Aktif':'Tidak aktif'}</td><td>${getUser()?.role==='admin'?`<button type="button" class="quiet aid-type-edit" data-id="${type.id}">Edit jenis</button>`:''}</td></tr>`).join('')}</tbody></table></div>`:'<p class="hint">Belum ada jenis bantuan. Pentadbir boleh menambah jenis sebelum merekodkan bantuan diterima.</p>';
    document.querySelectorAll('.aid-type-edit').forEach(button=>button.onclick=()=>{
      editingType=types.find(type=>type.id===Number(button.dataset.id));const form=$('#aid-type-form');
      for(const key of ['title','category','provider','description','isActive'])form.elements[key].value=editingType[key];
      $('#aid-type-error').textContent='';$('#aid-type-cancel').hidden=false;form.scrollIntoView({block:'start'});
    });
  }
  $('#aid-type-cancel').onclick=()=>{editingType=null;$('#aid-type-form').reset();$('#aid-type-cancel').hidden=true;$('#aid-type-error').textContent='';};
  $('#aid-type-form').onsubmit=async event=>{
    event.preventDefault();const input=Object.fromEntries(new FormData(event.target));input.isActive=Number(input.isActive);if(editingType)input.expectedUpdatedAt=editingType.updatedAt;
    $('#aid-type-error').textContent='';
    try {await api(editingType?`/api/aid-types/${editingType.id}`:'/api/aid-types',editingType?'PUT':'POST',input);editingType=null;event.target.reset();$('#aid-type-cancel').hidden=true;await load();notice('Jenis bantuan berjaya disimpan.');}
    catch(error){$('#aid-type-error').textContent=error.message;}
  };
  function clearWarning() { confirmation='';$('#aid-duplicate').hidden=true; }
  function recipients() {
    const form=$('#aid-form'),member=members.find(m=>m.id===Number(form.elements.memberId.value));
    $('#aid-family-section').hidden=form.elements.recipientKind.value!=='keluarga';
    const options=(member?.household||[]).map((person,index)=>`<option value="${index}">${esc(person.name)}${person.birthDate?' · '+esc(person.birthDate):''}</option>`).join('');
    $('#aid-family').innerHTML='<option value="">Pilih ahli keluarga</option>'+options;
    const historic=editing && editing.memberId===member?.id && editing.recipientKind==='keluarga';
    if(historic) {
      const index=member.household.findIndex(person=>person.name===editing.recipientName && person.birthDate===editing.recipientBirthDate);
      if(index>=0) $('#aid-family').value=String(index);
      else { $('#aid-family').insertAdjacentHTML('beforeend',`<option value="historical">${esc(editing.recipientName)} (rekod asal)</option>`);$('#aid-family').value='historical'; }
    }
    $('#aid-family').required=form.elements.recipientKind.value==='keluarga';
  }
  function open(row) {
    editing=row||null;$('#aid-form').reset();clearWarning();$('#aid-error').textContent='';$('#aid-editor-title').textContent=row?'Maklumat bantuan diterima':'Rekod bantuan diterima';
    const form=$('#aid-form');
    form.elements.memberId.innerHTML='<option value="">Pilih ahli / isi rumah</option>'+members.filter(m=>m.isActive===1 || m.id===row?.memberId).map(m=>`<option value="${m.id}">${esc(m.name)} (#${m.id})${m.isActive?'':' · Tidak aktif'}</option>`).join('');
    form.elements.receivedDate.max=todayInMalaysia();form.elements.receivedDate.value=todayInMalaysia();
    if(profileMember && !row) { form.elements.memberId.value=String(profileMember.id); }
    form.elements.memberId.disabled=Boolean(profileMember);
    form.elements.aidTypeId.innerHTML='<option value="">Pilih jenis bantuan</option>'+types.filter(type=>type.isActive===1 || type.id===row?.aidTypeId).map(type=>`<option value="${type.id}">${esc(type.title)}${type.isActive?'':' (tidak aktif)'}</option>`).join('');
    form.elements.aidTypeId.required=!row;
    if(row) {
      form.elements.aidTypeId.value=row.aidTypeId===null?'':String(row.aidTypeId);
      for(const key of ['memberId','recipientKind','title','category','provider','receivedDate','quantity','unit','notes']) form.elements[key].value=row[key]??'';
      form.elements.amount.value=row.amountCents===null?'':(row.amountCents/100).toFixed(2);
    }
    if(!row) fillType();
    recipients();$('#aid-editor').showModal();
  }
  $('#nav-aid').onclick=async()=>{try {await load();showPanel('aid-panel');}catch(error){notice(error.message);}};
  $('#aid-add').onclick=()=>open();
  $('#member-aid-add').onclick=()=>open();
  for(const id of ['aid-search','aid-member-filter','aid-from','aid-to']) $('#'+id).addEventListener('input',render);
  $('#aid-form').addEventListener('input',clearWarning);
  for(const key of ['memberId','recipientKind']) $('#aid-form').elements[key].addEventListener('change',recipients);
  $('#aid-close').onclick=$('#aid-cancel').onclick=()=>$('#aid-editor').close();
  $('#aid-form').onsubmit=async event=>{
    event.preventDefault();const form=event.target,data=Object.fromEntries(new FormData(form));data.memberId=profileMember?profileMember.id:Number(data.memberId);data.aidTypeId=form.elements.aidTypeId.value?Number(form.elements.aidTypeId.value):null;data.category=form.elements.category.value;
    const member=members.find(m=>m.id===data.memberId);
    let person=data.recipientKind==='keluarga'?member?.household[Number($('#aid-family').value)]:member;
    if(data.recipientKind==='keluarga' && $('#aid-family').value==='historical') person={name:editing.recipientName,birthDate:editing.recipientBirthDate};
    if(data.recipientKind!=='keluarga' && editing?.memberId===data.memberId && editing.recipientKind===data.recipientKind) person={name:editing.recipientName,birthDate:editing.recipientBirthDate};
    data.recipientName=person?.name||'';data.recipientBirthDate=person?.birthDate||'';
    if(editing) data.expectedUpdatedAt=editing.updatedAt;
    if(event.submitter?.id==='aid-confirm-duplicate') data.duplicateConfirmation=confirmation;
    $('#aid-error').textContent='';
    try {await api(editing?`/api/aid/${editing.id}`:'/api/aid',editing?'PUT':'POST',data);$('#aid-editor').close();await load();notice('Rekod bantuan berjaya disimpan.');}
    catch(error){$('#aid-error').textContent=error.message;if(error.details?.code==='AID_DUPLICATE'){confirmation=error.details.confirmation;$('#aid-duplicate').hidden=false;}}
  };
  $('#aid-delete-close').onclick=()=>$('#aid-delete-dialog').close();
  $('#aid-delete-form').onsubmit=async event=>{
    event.preventDefault();$('#aid-delete-error').textContent='';
    try {await api(`/api/aid/${deleting.id}`,'DELETE',{expectedUpdatedAt:deleting.updatedAt,confirmation:event.target.elements.confirmation.value});$('#aid-delete-dialog').close();await load();notice('Rekod bantuan dipadam. Sandaran keselamatan disimpan dalam data/backups.');}
    catch(error){$('#aid-delete-error').textContent=error.message;}
  };
  return {async showMember(member){ profileMember=member||null;$('#member-aid-section').hidden=!member;if(!member)return;$('#member-aid-list').textContent='Memuatkan rekod bantuan…';try{await load();}catch(error){$('#member-aid-list').textContent=error.message;} }, clearMember(){profileMember=null;},reset(){profileMember=null;types=[];editingType=null;$('#aid-type-form').reset();$('#aid-types-list').replaceChildren();$('#aid-type-cancel').hidden=true;$('#member-aid-section').hidden=true;records=[];members=[];editing=null;$('#aid-list').replaceChildren();$('#aid-editor').close();$('#aid-delete-dialog').close();$('#aid-form').reset();$('#aid-delete-form').reset();}};
}
