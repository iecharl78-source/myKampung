import { malaysiaStates } from './address.js';

export function setupReports({api,showPanel,notice}) {
  const $=s=>document.querySelector(s),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let current=null;
  $('#report-state').innerHTML='<option value="">Semua negeri</option>'+malaysiaStates.map(state=>`<option>${state}</option>`).join('');
  function clear() {current=null;$('#report-results').replaceChildren();$('#report-summary').textContent='';$('#report-print').disabled=true;$('#report-export').disabled=true;}
  function filters() {return new URLSearchParams(new FormData($('#report-form')));}
  function updateType() {
    const aid=$('#report-form').elements.type.value==='aid';
    for(const key of ['from','to','category']) {const input=$('#report-form').elements[key];input.disabled=!aid;input.closest('label').hidden=!aid;if(!aid)input.value='';}
    clear();
  }
  $('#report-form').elements.type.onchange=updateType;
  $('#report-form').addEventListener('input',clear);
  $('#nav-reports').onclick=()=>{showPanel('reports-panel');};
  $('#report-form').onsubmit=async event=>{
    event.preventDefault();clear();$('#report-error').textContent='';const params=filters();
    try {
      const report=await api('/api/reports?'+params);current={report,params};
      $('#report-title').textContent=report.title;
      $('#report-stamp').textContent='Dijana: '+new Date(report.generatedAt).toLocaleString('ms-MY',{timeZone:'Asia/Kuala_Lumpur'});
      const f=report.filters;
      $('#report-applied').textContent=`Status isi rumah: ${{active:'Aktif',inactive:'Tidak aktif',all:'Semua'}[f.status]} · Negeri: ${f.state||'Semua'} · Daerah: ${f.district||'Semua'} · Carian: ${f.q||'Tiada'}${f.type==='aid'?` · Tarikh: ${f.from||'Awal'} hingga ${f.to||'Terkini'} · Kategori: ${f.category||'Semua'}`:''}`;
      $('#report-summary').textContent=`${report.total} rekod · ${report.householdCount} isi rumah${report.totalCents===null?'':` · Jumlah nilai RM ${(report.totalCents/100).toFixed(2)} (kuantiti barang tidak dijumlahkan)`}`;
      $('#report-results').innerHTML=(report.total>report.rows.length?`<p class="warning">Paparan dan cetakan terhad kepada ${report.previewLimit} rekod pertama daripada ${report.total}. Eksport CSV untuk semua rekod sepadan.</p>`:'')+(report.rows.length?`<div class="table-wrap"><table><thead><tr>${report.columns.map(c=>`<th>${esc(c.label)}</th>`).join('')}</tr></thead><tbody>${report.rows.map(row=>`<tr>${report.columns.map(c=>`<td>${esc(row[c.key])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:'<p class="empty">Tiada rekod sepadan dengan penapis ini.</p>');
    }catch(error){$('#report-error').textContent=error.message;}
  };
  $('#report-form').addEventListener('form-idle',()=>{$('#report-export').disabled=!current;$('#report-print').disabled=!current;});
  $('#report-print').onclick=()=>{if(current){document.body.classList.add('printing-report');try{window.print();}finally{document.body.classList.remove('printing-report');}}};
  $('#report-export').onclick=async()=>{
    if(!current)return;const params=new URLSearchParams(current.params);params.set('format','csv');const button=$('#report-export');button.disabled=true;button.textContent='Sedang mengeksport…';
    try {
      const response=await fetch('/api/reports?'+params);
      if(!response.ok){const result=await response.json();if(response.status===401)await api('/api/session');throw Error(result.error||'Eksport gagal.');}
      const blob=await response.blob();if(!current)return;const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`myKampung-${params.get('type')}.csv`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);notice('CSV disediakan. Simpan fail yang mengandungi maklumat peribadi di lokasi selamat.');
    }catch(error){notice(error.message);}finally{button.textContent='Muat turun CSV';button.disabled=!current;}
  };
  updateType();return {reset(){clear();$('#report-form').reset();updateType();$('#report-error').textContent='';$('#report-title').textContent='';$('#report-stamp').textContent='';$('#report-applied').textContent='';}};
}
