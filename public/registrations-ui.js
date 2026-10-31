export function setupRegistrations({api,showPanel,notice,refreshMembers}) {
  const $=s=>document.querySelector(s),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const labels={pending:'Menunggu semakan',approved:'Diluluskan',rejected:'Ditolak'};
  let records=[],selected=null,confirmation='';
  async function load(){records=await api('/api/registrations');render();}
  function render(){
    const state=$('#registration-filter').value,q=$('#registration-search').value.trim().toLowerCase();
    const rows=records.filter(row=>(state==='all'||row.status===state) && [row.data.name,row.data.phone,row.reference].join(' ').toLowerCase().includes(q));
    $('#registration-pending').textContent=records.filter(row=>row.status==='pending').length;
    $('#registration-list').innerHTML=rows.length?`<div class="table-wrap"><table><thead><tr><th>PEMOHON</th><th>RUJUKAN / TARIKH</th><th>STATUS</th><th></th></tr></thead><tbody>${rows.map(row=>`<tr><td><b>${esc(row.data.name)}</b><br>${esc(row.data.phone)}<br>${row.data.household.length} ahli keluarga</td><td>${esc(row.reference)}<br>${esc(new Date(row.createdAt).toLocaleString('ms-MY',{timeZone:'Asia/Kuala_Lumpur'}))}</td><td>${labels[row.status]}</td><td><button class="quiet registration-view" data-id="${row.id}">${row.status==='pending'?'Semak permohonan':'Lihat keputusan'}</button></td></tr>`).join('')}</tbody></table></div>`:'<p class="empty">Tiada permohonan sepadan.</p>';
    document.querySelectorAll('.registration-view').forEach(button=>button.onclick=()=>open(records.find(row=>row.id===Number(button.dataset.id))));
  }
  function open(row){
    selected=row;confirmation='';$('#registration-review-form').reset();$('#registration-review-error').textContent='';$('#registration-duplicate').hidden=true;
    $('#registration-review-title').textContent=`${row.data.name} · ${row.reference}`;
    const d=row.data,fields=[['Telefon',d.phone],['Tarikh lahir',d.birthDate],['Jantina',d.gender],['Alamat',d.address],['Status pekerjaan',d.employmentStatus],['Pekerjaan',d.occupation],['Pendidikan',d.educationLevel],['Pengajian',d.studyLevel],['Majikan',d.employerName],['Alamat majikan',d.employerAddress],['Telefon majikan',d.employerPhone]];
    $('#registration-review-data').innerHTML=`<p class="hint">Status: ${labels[row.status]} · Persetujuan diterima pada ${esc(new Date(row.consentedAt).toLocaleString('ms-MY',{timeZone:'Asia/Kuala_Lumpur'}))}</p><dl class="review-details">${fields.map(([label,value])=>`<dt>${label}</dt><dd>${esc(value||'—')}</dd>`).join('')}</dl><h3>Ahli keluarga</h3>${d.household.length?`<div class="table-wrap"><table><thead><tr><th>NAMA / HUBUNGAN</th><th>TARIKH LAHIR</th><th>PEKERJAAN / PENDIDIKAN</th></tr></thead><tbody>${d.household.map(person=>`<tr><td>${esc(person.name)}<br>${esc(person.relationship)}</td><td>${esc(person.birthDate||'—')}</td><td>${esc(person.employmentStatus)}<br>${esc(person.educationLevel||'')}<br>${esc(person.studyLevel||'')}</td></tr>`).join('')}</tbody></table></div>`:'<p>Tiada tanggungan direkodkan.</p>'}${row.status!=='pending'?`<p class="warning">${labels[row.status]} oleh ${esc(row.reviewedBy)} pada ${esc(new Date(row.reviewedAt).toLocaleString('ms-MY',{timeZone:'Asia/Kuala_Lumpur'}))}. ${esc(row.reviewNote)}${row.memberId?' · ID ahli #'+row.memberId:''}</p>`:''}`;
    $('#registration-review-form').hidden=row.status!=='pending';$('#registration-review-dialog').showModal();
  }
  $('#nav-registrations').onclick=async()=>{try{await load();showPanel('registrations-panel');}catch(error){notice(error.message);}};
  $('#registration-filter').onchange=$('#registration-search').oninput=render;
  $('#registration-refresh').onclick=async()=>{try{await load();}catch(error){notice(error.message);}};
  $('#registration-review-close').onclick=()=>$('#registration-review-dialog').close();
  $('#registration-review-form').addEventListener('input',()=>{confirmation='';$('#registration-duplicate').hidden=true;});
  $('#registration-review-form').onsubmit=async event=>{
    event.preventDefault();const decision=event.submitter?.id==='registration-reject'?'reject':'approve',note=event.target.elements.reviewNote.value.trim();$('#registration-review-error').textContent='';
    if(decision==='reject'&&!note){$('#registration-review-error').textContent='Sila nyatakan sebab penolakan supaya pemohon boleh membetulkan maklumat.';return;}
    const input={decision,reviewNote:note,expectedUpdatedAt:selected.updatedAt};if(event.submitter?.id==='registration-approve-duplicate')input.duplicateConfirmation=confirmation;
    try{await api(`/api/registrations/${selected.id}/review`,'POST',input);$('#registration-review-dialog').close();await refreshMembers();await load();showPanel('registrations-panel');notice(decision==='approve'?'Permohonan diluluskan dan ahli dimasukkan ke direktori.':'Permohonan ditolak. Sebab boleh disemak menggunakan kod rujukan.');}
    catch(error){$('#registration-review-error').textContent=error.message;if(error.details?.code==='REGISTRATION_DUPLICATE'){confirmation=error.details.confirmation;$('#registration-duplicate-list').innerHTML=error.details.matches.map(match=>`<li>${esc(match.context || `${match.name} (#${match.id}) · ${match.phone}`)} — ${esc(match.reasons.join(', '))}</li>`).join('');$('#registration-duplicate').hidden=false;}}
  };
  return {reset(){records=[];selected=null;confirmation='';$('#registration-list').replaceChildren();$('#registration-review-data').replaceChildren();$('#registration-review-dialog').close();$('#registration-review-form').reset();}};
}
