import { malaysiaStates } from './address.js';

export function setupReports({api,showPanel,notice}) {
  const $=s=>document.querySelector(s),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  let current=null,generation=0;const defaultHint=$('#report-form > .hint').textContent;
  $('#report-state').innerHTML='<option value="">Semua negeri</option>'+malaysiaStates.map(state=>`<option>${state}</option>`).join('');
  function clear() {generation++;current=null;$('#report-title').textContent='';$('#report-stamp').textContent='';$('#report-applied').textContent='';$('#report-results').replaceChildren();$('#report-summary').textContent='';$('#report-print').disabled=true;$('#report-export').disabled=true;}
  function filters() {return new URLSearchParams(new FormData($('#report-form')));}
  function updateType() {
    const ack=$('#report-form').elements.type.value==='acknowledgements',aid=['aid','acknowledgements'].includes($('#report-form').elements.type.value),asnaf=$('#report-form').elements.type.value==='asnaf';const state=$('#report-form').elements.asnafState;state.disabled=!asnaf;state.closest('label').hidden=!asnaf;if(!asnaf)state.value='all';
    for(const key of ['ackState','ackEvidence']){const input=$('#report-form').elements[key];input.disabled=!ack;input.closest('label').hidden=!ack;if(!ack)input.value='all';}
    $('#report-form > .hint').textContent=ack?'Tarikh merujuk tarikh bantuan diterima. Penapis bukti hanya menilai pengakuan yang sepadan dengan butiran bantuan semasa; bukti terdahulu tidak dianggap bukti semasa.':asnaf?'Penapis merujuk kepada isi rumah semasa. Pengiraan menggunakan had Asnaf semasa dan rekod rasmi yang telah disimpan. Pendapatan kosong memerlukan semakan.':defaultHint;$('#report-form').elements.q.placeholder=ack?'Nama, bantuan, pemberi atau status pengakuan':asnaf?'Nama, telefon, alamat atau status Asnaf':'Nama, telefon, bantuan atau pemberi';
    for(const key of ['from','to','category']) {const input=$('#report-form').elements[key];input.disabled=!aid;input.closest('label').hidden=!aid;if(!aid)input.value='';}
    clear();
  }
  $('#report-form').elements.type.onchange=updateType;
  $('#report-form').addEventListener('input',clear);
  $('#nav-reports').onclick=()=>{showPanel('reports-panel');};
  $('#report-form').onsubmit=async event=>{
    event.preventDefault();clear();$('#report-error').textContent='';const params=filters(),ticket=generation;
    try {
      const report=await api('/api/reports?'+params);if(ticket!==generation)return;current={report,params};
      $('#report-title').textContent=report.title;
      $('#report-stamp').textContent='Dijana: '+new Date(report.generatedAt).toLocaleString('ms-MY',{timeZone:'Asia/Kuala_Lumpur'});
      const f=report.filters;
      $('#report-applied').textContent=`Status isi rumah: ${{active:'Aktif',inactive:'Tidak aktif',all:'Semua'}[f.status]} · Negeri: ${f.state||'Semua'} · Daerah: ${f.district||'Semua'} · Zon: ${f.zoneCode||'Semua'} · Carian: ${f.q||'Tiada'}${f.type==='asnaf'?` · Status Asnaf: ${{all:'Semua',asnaf:'Acc Asnaf',not_asnaf:'Tidak memenuhi had',incomplete:'Perlu semakan'}[f.asnafState]} · Had per kapita: kurang daripada RM${(report.asnaf.thresholdCents/100).toFixed(2)}`:''}${['aid','acknowledgements'].includes(f.type)?` · Tarikh: ${f.from||'Awal'} hingga ${f.to||'Terkini'} · Kategori: ${f.category||'Semua'}`:''}${report.acknowledgements?` · Pengakuan: ${{all:'Semua',none:'Belum ada',current:'Direkodkan',stale:'Perlu baharu'}[f.ackState]} · Bukti semasa: ${{all:'Semua',with:'Ada lampiran',without:'Belum dilampirkan'}[f.ackEvidence]}`:''}`;
      $('#report-summary').textContent=`${report.total} rekod · ${report.householdCount} isi rumah${report.asnaf?` · Acc Asnaf: ${report.asnaf.counts.asnaf} · Tidak memenuhi had: ${report.asnaf.counts.not_asnaf} · Perlu semakan: ${report.asnaf.counts.incomplete}`:''}${report.acknowledgements?` · Belum ada pengakuan: ${report.acknowledgements.counts.none} · Direkodkan: ${report.acknowledgements.counts.current} · Perlu baharu: ${report.acknowledgements.counts.stale} · Pengakuan semasa tanpa bukti: ${report.acknowledgements.missingEvidence}`:''}${report.totalCents===null?'':` · Jumlah nilai RM ${(report.totalCents/100).toFixed(2)} (kuantiti barang tidak dijumlahkan)`}`;
      $('#report-results').innerHTML=(report.total>report.rows.length?`<p class="warning">Paparan dan cetakan terhad kepada ${report.previewLimit} rekod pertama daripada ${report.total}. Eksport CSV untuk semua rekod sepadan.</p>`:'')+(report.rows.length?`<div class="table-wrap"><table><thead><tr>${report.columns.map(c=>`<th>${esc(c.label)}</th>`).join('')}</tr></thead><tbody>${report.rows.map(row=>`<tr>${report.columns.map(c=>`<td>${esc(row[c.key])}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:'<p class="empty">Tiada rekod sepadan dengan penapis ini.</p>');
    }catch(error){if(ticket===generation)$('#report-error').textContent=error.message;}
  };
  $('#report-form').addEventListener('form-idle',()=>{$('#report-export').disabled=!current;$('#report-print').disabled=!current;});
  $('#report-print').onclick=()=>{if(current){document.body.classList.add('printing-report');try{window.print();}finally{document.body.classList.remove('printing-report');}}};
  $('#report-export').onclick=async()=>{
    if(!current)return;const snapshot=current,params=new URLSearchParams(snapshot.params);params.set('format','csv');if(snapshot.report.asnaf)params.set('asnafSettingsUpdatedAt',snapshot.report.asnaf.settingsUpdatedAt);if(snapshot.report.acknowledgements)params.set('ackVersion',snapshot.report.acknowledgements.version);const button=$('#report-export');button.disabled=true;button.textContent='Sedang mengeksport…';
    try {
      const response=await fetch('/api/reports?'+params);
      if(!response.ok){const result=await response.json();if(response.status===401)await api('/api/session');throw Error(result.error||'Eksport gagal.');}
      const blob=await response.blob();if(current!==snapshot)return;const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`myKampung-${params.get('type')}.csv`;document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);notice('CSV disediakan. Simpan fail yang mengandungi maklumat peribadi di lokasi selamat.');
    }catch(error){if(current===snapshot)notice(error.message);}finally{button.textContent='Muat turun CSV';button.disabled=!current;}
  };
  updateType();return {reset(){clear();$('#report-form').reset();updateType();$('#report-error').textContent='';$('#report-title').textContent='';$('#report-stamp').textContent='';$('#report-applied').textContent='';}};
}
