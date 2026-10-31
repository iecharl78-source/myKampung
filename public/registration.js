import { employmentStatuses,educationLevels,studyLevels } from './education.js';
import { memberEducationLevels } from './member-details.js';
import { malaysiaStates } from './address.js';
import { ageLabel,todayInMalaysia } from './age.js';
import { installFormState } from './form-state.js';
const $=s=>document.querySelector(s),form=$('#registration-form');
const options=values=>'<option value="">Sila pilih</option>'+values.map(value=>`<option>${value}</option>`).join('');
form.elements.employmentStatus.innerHTML=options(employmentStatuses);form.elements.educationLevel.innerHTML=options(memberEducationLevels);form.elements.studyLevel.innerHTML=options(studyLevels);
$('#state-options').innerHTML=malaysiaStates.map(state=>`<option>${state}</option>`).join('');
function updateEducation(){
  const student=form.elements.employmentStatus.value==='Pelajar',education=form.elements.educationLevel;
  for(const option of education.options)if(option.value==='Tiada pendidikan formal')option.disabled=student;
  if(student && education.value==='Tiada pendidikan formal')education.value='';
  $('#member-education-label').textContent=student?'Tahap pendidikan semasa *':'Tahap pendidikan tertinggi';education.required=student;
  const university=education.value==='Universiti';$('#member-study-section').hidden=!university;form.elements.studyLevel.disabled=!university;form.elements.studyLevel.required=university;if(!university)form.elements.studyLevel.value='';
}
for(const key of ['employmentStatus','educationLevel'])form.elements[key].onchange=updateEducation;
form.elements.birthDate.max=todayInMalaysia();form.elements.birthDate.oninput=()=>$('#member-age').textContent=ageLabel(form.elements.birthDate.value);
for(const [country,postcode,help] of [['country','postcode','postcode-help'],['employerCountry','employerPostcode','employer-postcode-help']]){
  const update=()=>{form.elements[postcode].pattern=form.elements[country].value.trim().toLowerCase()==='malaysia'?'[0-9]{5}':'.*';$('#'+help).textContent='Poskod Malaysia perlu 5 digit. Boleh kosongkan jika belum diketahui; pentadbir boleh membantu menyemak.';};form.elements[country].oninput=update;update();
}
$('#add-family').onclick=()=>{
  if($('#family-fields').children.length>=30){$('#registration-error').textContent='Maksimum 30 ahli keluarga.';return;}
  const row=document.createElement('div');row.className='family-row';
  row.innerHTML=`<label>Nama ahli keluarga *<input data-field="name" maxlength="200" required></label><label>Hubungan *<select data-field="relationship">${['Pasangan','Anak','Ibu','Bapa','Penjaga','Lain-lain'].map(v=>`<option>${v}</option>`).join('')}</select></label><label>Tarikh lahir<input type="date" data-field="birthDate" max="${todayInMalaysia()}"><span class="age-display" aria-live="polite">Umur: —</span></label><button class="quiet remove-family" type="button">Padam</button><div class="family-education"><label>Status pekerjaan *<select data-field="employmentStatus" required>${options(employmentStatuses)}</select></label><label data-section="education" hidden>Tahap pendidikan *<select data-field="educationLevel">${options(educationLevels)}</select></label><label data-section="study" hidden>Tahap pengajian *<select data-field="studyLevel">${options(studyLevels)}</select></label></div>`;
  const field=key=>row.querySelector(`[data-field="${key}"]`);
  function update(){const student=field('employmentStatus').value==='Pelajar';if(!student)field('educationLevel').value='';const university=student && field('educationLevel').value==='Universiti';row.querySelector('[data-section="education"]').hidden=!student;row.querySelector('[data-section="study"]').hidden=!university;field('educationLevel').disabled=!student;field('educationLevel').required=student;field('studyLevel').disabled=!university;field('studyLevel').required=university;if(!university)field('studyLevel').value='';}
  field('employmentStatus').onchange=field('educationLevel').onchange=update;update();field('birthDate').oninput=()=>row.querySelector('.age-display').textContent=ageLabel(field('birthDate').value);
  row.querySelector('button').onclick=()=>{if(confirm('Padam baris ahli keluarga ini daripada permohonan?'))row.remove();};$('#family-fields').append(row);
};
let previousData='',submissionKey='';
async function request(path,method='GET',data){const response=await fetch(path,{method,headers:data?{'Content-Type':'application/json'}:{},body:data?JSON.stringify(data):undefined});const result=await response.json();if(!response.ok)throw Error(result.error||'Permintaan gagal.');return result;}
form.onsubmit=async event=>{
  event.preventDefault();$('#registration-error').textContent='';
  const data=Object.fromEntries(new FormData(form));data.household=[...document.querySelectorAll('.family-row')].map(row=>Object.fromEntries([...row.querySelectorAll('[data-field]')].map(input=>[input.dataset.field,input.value])));
  const serialized=JSON.stringify(data);if(serialized!==previousData){submissionKey=[...crypto.getRandomValues(new Uint8Array(32))].map(v=>v.toString(16).padStart(2,'0')).join('');previousData=serialized;}
  try{
    const result=await request('/api/registrations','POST',{data,consent:$('#registration-consent').checked,submissionKey});
    form.reset();$('#family-fields').replaceChildren();form.hidden=true;$('#registration-receipt').hidden=false;$('#registration-reference').textContent=result.reference;$('#registration-receipt-status').textContent=({pending:'Menunggu semakan pentadbir.',approved:'Permohonan diluluskan.',rejected:'Permohonan ditolak.'}[result.status])+' Simpan kod rujukan untuk menyemak keputusan.';$('#status-reference').value=result.reference;$('#registration-receipt').scrollIntoView({block:'start'});
  }catch(error){$('#registration-error').textContent=error.message;}
};
$('#registration-status-form').onsubmit=async event=>{
  event.preventDefault();const output=$('#registration-status-result');output.textContent='';
  try{const result=await request('/api/registration-status?reference='+encodeURIComponent(event.target.elements.reference.value.trim()));output.textContent={pending:'Menunggu semakan pentadbir',approved:'Permohonan diluluskan',rejected:'Permohonan ditolak'}[result.status]+(result.reviewNote?' — '+result.reviewNote:'');}
  catch(error){output.textContent=error.message;}
};
$('#registration-new').onclick=()=>location.reload();updateEducation();installFormState();
