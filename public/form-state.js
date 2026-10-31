let busy=false;

export function installFormState(root=document) {
  root.addEventListener('click',event=>{ if(busy) { event.preventDefault();event.stopImmediatePropagation(); } },true);
  root.addEventListener('cancel',event=>{ if(busy) event.preventDefault(); },true);
  const messages={
    'full-backup-form':'Sedang menyediakan sandaran penuh…',
    'portal-aid-form':'Sedang menghantar permohonan bantuan…','aid-review-form':'Sedang menyimpan keputusan bantuan…','portal-profile-form':'Sedang menghantar permohonan…','profile-review-form':'Sedang menyimpan keputusan…','community-post-form':'Sedang menyimpan siaran…','question-form':'Sedang menghantar pertanyaan…','question-reply-form':'Sedang menghantar balasan…','question-status-form':'Sedang menyimpan status…','notification-form':'Sedang menyimpan…',
    'login-form':'Sedang log masuk…', 'logout-form':'Sedang log keluar…', 'registration-form':'Sedang menghantar permohonan…', 'registration-status-form':'Sedang menyemak status…', 'registration-review-form':'Sedang menyimpan keputusan semakan…', 'report-form':'Sedang menjana laporan…', 'member-form':'Sedang menyimpan rekod…',
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
