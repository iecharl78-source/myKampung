export const acknowledgementLabel=row=>({none:'Belum ada pengakuan',current:'Pengakuan direkodkan',stale:'Bantuan berubah · Perlu pengakuan baharu'}[row.acknowledgement?.state]||'Semak pengakuan penerimaan');
export function acknowledgementMatches(summary,state='all',evidence='all'){
 const current=summary||{state:'none'};if(state!=='all'&&current.state!==state)return false;if(evidence==='all')return true;return current.state==='current'&&(evidence==='with'?Boolean(current.fileName):!current.fileName);
}
