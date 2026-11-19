export const navigationGroups=[
 {key:'general',label:'Umum',items:['nav-home','nav-portal','nav-security']},
 {key:'community',label:'Komuniti & Kebajikan',items:['nav-members','nav-aid','nav-khairat']},
 {key:'applications',label:'Permohonan & Kelulusan',items:['nav-tasks','nav-registrations','nav-profile-review','nav-head-changes','nav-deaths']},
 {key:'information',label:'Maklumat & Komunikasi',items:['nav-community','nav-questions','nav-notifications']},
 {key:'administration',label:'Pentadbiran',items:['nav-accounts','nav-administration','nav-housing','nav-reports','nav-audit']}
];
export function installNavigationGroups(){
 const aside=document.querySelector('aside'),label=aside.querySelector('.side-label'),nav=document.createElement('nav');nav.className='navigation-groups';nav.setAttribute('aria-label','Menu utama');nav.hidden=true;label.textContent='MENU UTAMA';label.after(nav);
 const mobile=matchMedia('(max-width:700px)'),groups=navigationGroups.map(group=>{
  const details=document.createElement('details');details.className='navigation-group';details.dataset.group=group.key;details.hidden=true;details.open=group.key==='general'||!mobile.matches;
  const summary=document.createElement('summary');summary.id='menu-group-'+group.key;summary.textContent=group.label;details.append(summary);
  const items=document.createElement('div');items.className='navigation-items';items.setAttribute('role','group');items.setAttribute('aria-labelledby',summary.id);details.append(items);
  for(const id of group.items){const button=document.getElementById(id);if(button)items.append(button);}
  nav.append(details);return details;
 });
 function sync(){for(const group of groups){const hidden=![...group.querySelectorAll('button.nav')].some(button=>!button.hidden);if(group.hidden!==hidden)group.hidden=hidden;}const hidden=groups.every(group=>group.hidden);if(nav.hidden!==hidden)nav.hidden=hidden;if(label.hidden!==hidden)label.hidden=hidden;}
 function activate(){sync();const active=groups.find(group=>!group.hidden&&group.querySelector('button.nav.active:not([hidden])'));if(active){active.open=true;if(mobile.matches)for(const group of groups)if(group!==active)group.open=false;}}
 const observer=new MutationObserver(records=>{if(records.some(r=>r.target.matches('button.nav')))sync();});observer.observe(nav,{subtree:true,attributes:true,attributeFilter:['hidden']});mobile.addEventListener('change',activate);sync();
 return {activate};
}
