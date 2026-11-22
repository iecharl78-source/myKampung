let busy=false;

export function installFormState(root=document) {
  root.addEventListener('click',event=>{ if(busy) { event.preventDefault();event.stopImmediatePropagation(); } },true);
  root.addEventListener('cancel',event=>{ if(busy) event.preventDefault(); },true);
  const messages={
    'khairat-type-form':'Sedang menyimpan jenis khairat…','module-access-form':'Sedang menyimpan akses ahli…','khairat-certificate-form':'Sedang memuat naik sijil kematian…',
    'khairat-request-form':'Sedang menghantar tuntutan khairat…','khairat-review-form':'Sedang menyimpan keputusan khairat…','khairat-payment-form':'Sedang merekod bayaran khairat…',
    'death-reporter-form':'Sedang menyimpan maklumat pelapor…','death-permit-form':'Sedang memuat naik permit kubur…','death-request-form':'Sedang menghantar rekod kematian…','death-review-form':'Sedang menyimpan keputusan kematian…',
    'head-change-request-form':'Sedang menghantar permohonan pertukaran…','head-change-review-form':'Sedang menyimpan keputusan pertukaran…',
    'housing-zones-form':'Sedang menyimpan zon komuniti…','housing-types-form':'Sedang menyimpan jenis rumah…',
    'full-backup-form':'Sedang menyediakan sandaran penuh…',
    'portal-aid-form':'Sedang menghantar permohonan bantuan…','aid-review-form':'Sedang menyimpan keputusan bantuan…','portal-profile-form':'Sedang menghantar permohonan…','profile-review-form':'Sedang menyimpan keputusan…','community-post-form':'Sedang menyimpan siaran…','question-form':'Sedang menghantar pertanyaan…','question-reply-form':'Sedang menghantar balasan…','question-status-form':'Sedang menyimpan status…','notification-form':'Sedang menyimpan…',
    'data-quality-filter':'Sedang menyemak data…','login-form':'Sedang log masuk…', 'logout-form':'Sedang log keluar…', 'registration-form':'Sedang menghantar permohonan…', 'registration-status-form':'Sedang menyemak status…', 'registration-review-form':'Sedang menyimpan keputusan semakan…', 'report-form':'Sedang menjana laporan…', 'member-form':'Sedang menyimpan rekod…',
    'restore-form':'Sedang memulihkan data…', 'action-form':'Sedang memproses tindakan…',
    'new-user-form':'Sedang menyimpan pengguna baharu…', 'user-action-form':'Sedang menyimpan perubahan akaun…',
    'password-form':'Sedang menyimpan kata laluan…', 'aid-type-form':'Sedang menyimpan jenis bantuan…', 'aid-form':'Sedang menyimpan bantuan…', 'aid-delete-form':'Sedang memadam bantuan…',
  };
  for(const form of root.querySelectorAll('form')) {
    const handler=form.onsubmit;
    if(!handler) continue;
    form.onsubmit=async function(event) {
      event.preventDefault();
      if(busy) return;
      busy=true;form.setAttribute('aria-busy','true');
      const controls=[...root.querySelectorAll('input,select,textarea,button')].map(control=>[control,control.disabled]);
      const button=event.submitter || form.querySelector('button[type="submit"],button:not([type])');
      const label=button?.textContent;
      const status=document.createElement('p');status.className='form-progress';status.setAttribute('role','status');status.setAttribute('aria-live','polite');status.textContent=messages[form.id] || 'Sedang menyimpan…';
      try {
        // Biar pengendali membaca nilai/FormData dahulu; medan disabled tidak disertakan dalam FormData.
        const pending=handler.call(form,event);
        for(const [control] of controls) control.disabled=true;
        if(button) button.textContent=status.textContent;
        form.prepend(status);
        await pending;
      } finally {
        for(const [control,disabled] of controls) control.disabled=disabled;
        if(button) button.textContent=label;
        status.remove();form.removeAttribute('aria-busy');busy=false;
        form.dispatchEvent(new Event('form-idle'));
      }
    };
  }
}
