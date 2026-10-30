export function passwordStrength(password) {
  if(!password) return {level:0,label:'Belum diisi'};
  const kinds=[/[a-z]/,/[A-Z]/,/[0-9]/,/[^a-zA-Z0-9]/].filter(pattern=>pattern.test(password)).length;
  const common=/password|katalaluan|qwerty|123456|letmein|admin/i.test(password);
  const repeated=/(.)\1{3,}|(.{1,4})\2{2,}/u.test(password);
  let level=1;
  if(password.length>=12 && kinds>=2 && !common && !repeated) level=2;
  if(level===2 && password.length>=16 && kinds>=3 && new Set(password).size>=10) level=3;
  if(level===3 && password.length>=20 && new Set(password).size>=12) level=4;
  return {level,label:['','Weak','Medium','Strong','Strongest'][level]};
}

export function suggestPassword() {
  const alphabet='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*?_-';
  const limit=Math.floor(256/alphabet.length)*alphabet.length;
  for(;;) {
    let password='';
    while(password.length<20) {
      const bytes=new Uint8Array(32);globalThis.crypto.getRandomValues(bytes);
      for(const byte of bytes) if(byte<limit && password.length<20) password+=alphabet[byte%alphabet.length];
    }
    if(/[a-z]/.test(password) && /[A-Z]/.test(password) && /[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password) && passwordStrength(password).level===4) return password;
  }
}

export function enhancePasswords(root=document) {
  const refresh=[];
  let counter=0;
  for(const input of root.querySelectorAll('input[type="password"]')) {
    if(input.id==='login-password') continue; // Borang log masuk sudah mempunyai butang khusus.
    const original=input.closest('label'), form=input.form;
    const wrapper=document.createElement('div');
    for(const attr of original.attributes) wrapper.setAttribute(attr.name,attr.value);
    wrapper.classList.add('password-control');
    original.before(wrapper);wrapper.append(original);
    original.removeAttribute('id');original.removeAttribute('hidden');original.removeAttribute('class');
    input.id ||= `password-field-${++counter}`;original.htmlFor=input.id;
    const field=document.createElement('div');field.className='password-input';wrapper.append(field);field.append(input);
    const toggle=document.createElement('button');toggle.type='button';toggle.className='quiet password-visibility';
    toggle.setAttribute('aria-controls',input.id);toggle.setAttribute('aria-pressed','false');toggle.textContent='Tunjuk kata laluan';
    toggle.onclick=()=>{ const visible=input.type==='password';input.type=visible?'text':'password';toggle.textContent=visible?'Sembunyi kata laluan':'Tunjuk kata laluan';toggle.setAttribute('aria-pressed',String(visible)); };
    field.append(toggle);
    const newPassword=input.autocomplete==='new-password' && input.name!=='confirmPassword';
    let update=()=>{};
    if(newPassword) {
      const tools=document.createElement('div');tools.className='password-suggestions';
      const generate=document.createElement('button');generate.type='button';generate.className='secondary suggest-password';generate.textContent='Cadangkan kata laluan';tools.append(generate);
      const meter=document.createElement('meter');meter.min=0;meter.max=4;meter.className='password-meter';meter.setAttribute('aria-label','Tahap kekuatan kata laluan');
      const strength=document.createElement('span');strength.className='password-strength';strength.setAttribute('aria-live','polite');
      const help=document.createElement('p');help.className='hint';help.textContent='Anggaran sahaja. Gunakan kata laluan unik; minimum 12 aksara. Cadangan dijana pada peranti ini.';
      wrapper.append(tools,meter,strength,help);
      update=()=>{ const score=passwordStrength(input.value);meter.value=score.level;meter.setAttribute('aria-valuetext',score.label);strength.textContent=`Tahap: ${score.label}`;wrapper.dataset.strength=String(score.level);if(!input.value) help.textContent='Anggaran sahaja. Gunakan kata laluan unik; minimum 12 aksara. Cadangan dijana pada peranti ini.'; };
      input.addEventListener('input',update);
      generate.onclick=()=>{
        try {
          input.value=suggestPassword();input.dispatchEvent(new Event('input',{bubbles:true}));
          const confirmation=form.elements.confirmPassword;
          if(confirmation) { confirmation.value=input.value;confirmation.dispatchEvent(new Event('input',{bubbles:true})); }
          help.textContent='Cadangan telah diisi. Gunakan Tunjuk kata laluan untuk menyemaknya dan simpan dengan selamat.';
        } catch { help.textContent='Cadangan tidak tersedia. Gunakan pelayar moden melalui localhost atau HTTPS, atau masukkan kata laluan sendiri.'; }
      };
    }
    const reset=()=>{ input.type='password';toggle.textContent='Tunjuk kata laluan';toggle.setAttribute('aria-pressed','false');update(); };
    form.addEventListener('reset',()=>queueMicrotask(reset));refresh.push(reset);update();
  }
  return ()=>refresh.forEach(reset=>reset());
}
