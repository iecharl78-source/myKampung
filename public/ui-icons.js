const paths={
 edit:'<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L9 17l-4 1 1-4Z"/>',
 view:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
 save:'<path d="M5 3h12l4 4v14H3V3Z"/><path d="M7 3v6h10V3M7 21v-8h10v8"/>',
 send:'<path d="m22 2-7 20-4-9-9-4Z M22 2 11 13"/>',
 check:'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
 close:'<path d="m6 6 12 12M6 18 18 6"/>',
 delete:'<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/>',
 refresh:'<path d="M20 7a9 9 0 1 0 1 8M20 3v5h-5"/>',
 add:'<path d="M12 4v16M4 12h16"/>',
 search:'<circle cx="10" cy="10" r="6"/><path d="m15 15 6 6"/>',
 download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
 upload:'<path d="M12 16V4m-5 5 5-5 5 5M4 16v5h16v-5"/>',
 lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/>',
 key:'<circle cx="8" cy="8" r="5"/><path d="m12 12 9 9m-3-3 3-3m-6 0 3-3"/>',
 link:'<path d="m10 13 4-4M8 15l-2 2a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0M13 18a4 4 0 0 0 6 0l4-4a4 4 0 0 0-6-6l-2 2" transform="translate(1 0) scale(.9)"/>',
 pause:'<circle cx="12" cy="12" r="9"/><path d="m6 6 12 12"/>',
 left:'<path d="m14 5-7 7 7 7M7 12h14"/>',right:'<path d="m10 5 7 7-7 7M3 12h14"/>',
 home:'<path d="m3 10 9-7 9 7v11h-7v-7h-4v7H3Z"/>',
 users:'<circle cx="9" cy="8" r="4"/><path d="M2 21v-3a7 7 0 0 1 14 0v3M17 5a4 4 0 0 1 0 8M19 15a6 6 0 0 1 3 6"/>',
 calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 2v6M17 2v6M3 11h18M7 15h3M14 15h3"/>',
 bell:'<path d="M5 16V9a7 7 0 0 1 14 0v7l2 2H3ZM9 21h6"/>',
 message:'<path d="M3 3h18v14H8l-5 4ZM7 8h10M7 12h7"/>',
 report:'<path d="M5 3h10l4 4v14H5ZM14 3v5h5M8 12h8M8 16h8"/>',
 print:'<path d="M6 8V3h12v5M6 17H3V9h18v8h-3M6 14h12v7H6Z"/>',
 logout:'<path d="M10 3H3v18h7M9 12h13m-5-5 5 5-5 5"/>',
 login:'<path d="M14 3h7v18h-7M2 12h13m-5-5 5 5-5 5"/>',
 gift:'<path d="M3 9h18v5H3ZM5 14v7h14v-7M12 9v12M12 9H8a3 3 0 1 1 3-3ZM12 9h4a3 3 0 1 0-3-3Z"/>',
 settings:'<path d="M4 6h16M4 12h16M4 18h16"/><circle cx="8" cy="6" r="2" fill="currentColor"/><circle cx="16" cy="12" r="2" fill="currentColor"/><circle cx="10" cy="18" r="2" fill="currentColor"/>',
 cursor:'<path d="m5 3 14 10-7 1-3 7Z"/>'
};
export function iconSvg(kind,cls='ui-icon'){return `<svg class="${cls}" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${paths[kind]||paths.cursor}</svg>`;}
function choose(button,label){
 const id=button.id,cls=button.classList;
 const nav={'nav-backup-status':'download','nav-data-quality':'report','quality-tab-findings':'report','quality-tab-duplicates':'search','nav-administration':'users','nav-khairat':'gift','nav-deaths':'report','nav-head-changes':'users','nav-home':'home','nav-members':'users','nav-portal':'users','nav-community':'calendar','nav-questions':'message','nav-notifications':'bell','nav-profile-review':'check','nav-aid':'gift','nav-reports':'report','nav-registrations':'users','nav-accounts':'users','nav-audit':'report','nav-housing':'home'};
 if(nav[id])return nav[id];
 if(button.hasAttribute('data-quality-member'))return 'users';
 if(cls.contains('user-link'))return 'link';if(cls.contains('user-reset'))return 'key';
 if(/Sedang/i.test(label))return 'refresh';if(/bulan sebelum|sebelumnya|halaman sebelum/i.test(label)||/-(prev)$/.test(id))return 'left';if(/bulan selepas|seterusnya|halaman selepas/i.test(label)||/-(next)$/.test(id))return 'right';
 if(/nyahaktif/i.test(label))return 'pause';if(/aktifkan/i.test(label))return 'check';if(/padam|buang/i.test(label))return 'delete';if(/batal|tutup|tolak|^✕$|^×$/i.test(label)||/close/.test(id))return 'close';
 if(/log keluar/i.test(label))return 'logout';if(/log masuk/i.test(label))return 'login';if(/tunjuk|sembunyi/i.test(label))return 'view';if(/cadang.*kata laluan|tetap semula/i.test(label))return 'key';if(/kata laluan/i.test(label))return 'lock';
 if(/lulus|sahkan|tandakan|keputusan/i.test(label)&&!/hantar/i.test(label))return 'check';if(/hantar|balasan/i.test(label))return 'send';if(/muat semula|segar/i.test(label))return 'refresh';if(/pulih/i.test(label))return 'upload';if(/sandaran|muat turun|eksport/i.test(label))return 'download';
 if(/cetak/i.test(label))return 'print';if(/simpan/i.test(label))return 'save';if(/tambah|daftar|cipta|baharu/i.test(label))return 'add';if(/kemaskini|kemas kini|edit|sunting/i.test(label))return 'edit';if(/kalendar|aktiviti/i.test(label))return 'calendar';if(/semak status|cari/i.test(label))return 'search';if(/laporan/i.test(label))return 'report';if(/pertanyaan|balas/i.test(label))return 'message';if(/bantuan/i.test(label))return 'gift';if(/direktori|profil|keluarga|pengguna|akaun/i.test(label))return 'users';if(/lihat|baca/i.test(label))return 'view';return 'cursor';
}
const compact='.khairat-type-edit,.khairat-view,.death-view,.head-change-view,.user-status,.user-reset,.user-link,.review-profile,.aid-request-view,.registration-view,.question-view,.portal-edit-aid,.post-edit,.catalog-edit,.remove-family,.aid-edit,.aid-delete,.password-visibility';
export function installButtonIcons(root=document){
 function enhance(button){
  if(button.matches('.action-icon')&&!button.dataset.uiIcon)return; // Ikon direktori sedia ada mempunyai label peribadi.
  const rich=button.matches('.nav,.home-stat'),label=button.textContent.trim();if(!label)return;
  const kind=choose(button,label),iconOnly=!rich&&(button.matches(compact)||/close/.test(button.id)||label==='✕'||label==='×');
  if(rich){if(button.querySelector(':scope > .ui-icon'))return;for(const node of [...button.childNodes])if(node.nodeType===3&&/^[\s⌂✓▦?♧♡▤✎♙☷]+$/.test(node.textContent))node.remove();button.insertAdjacentHTML('afterbegin',iconSvg(kind));button.classList.add('has-button-icon');return;}
  const current=button.querySelector(':scope > .ui-label');
  if(button.dataset.uiIcon===kind&&current?.textContent===label&&button.querySelector(':scope > .ui-icon'))return;
  button.dataset.uiIcon=kind;button.classList.add('has-button-icon');button.classList.toggle('icon-only-button',iconOnly);
  const text=(label==='✕'||label==='×')?(button.getAttribute('aria-label')||'Tutup'):label.replace(/^[\s＋+↓↑←→↗]+|[\s→↗]+$/g,'').trim()||label;
  // Kemas kini label selepas teks butang ditukar oleh proses simpan, status atau kata laluan.
  const oldLabel=button.dataset.uiLabel;if(!button.getAttribute('aria-label')||button.getAttribute('aria-label')===oldLabel)button.setAttribute('aria-label',text);
  if(!button.title||button.title===oldLabel)button.title=text;button.dataset.uiLabel=text;
  button.replaceChildren();button.insertAdjacentHTML('afterbegin',iconSvg(kind));const span=document.createElement('span');span.className='ui-label';span.textContent=text;button.append(span);
 }
 function scan(node){if(node.nodeType!==1&&node!==root)return;if(node.matches?.('button'))enhance(node);node.querySelectorAll?.('button').forEach(enhance);}
 scan(root);
 const pending=new Set();let scheduled=false;
 const observer=new MutationObserver(records=>{for(const record of records){const el=record.target.nodeType===1?record.target:record.target.parentElement;const button=el?.closest?.('button');if(button)pending.add(button);for(const added of record.addedNodes)if(added.nodeType===1)pending.add(added);}if(!scheduled){scheduled=true;queueMicrotask(()=>{scheduled=false;const nodes=[...pending];pending.clear();for(const node of nodes)if(node.isConnected)scan(node);});}});
 observer.observe(root===document?document.body:root,{childList:true,subtree:true,characterData:true});return ()=>observer.disconnect();
}
