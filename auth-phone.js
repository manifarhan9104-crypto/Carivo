// Carivo phone authentication: OTP by SMS (Supabase Auth)
(function(){
  const sb=()=>window.carivoSupabase;
  const authModal=document.querySelector('#authModal'), authContent=document.querySelector('#authContent');
  let pendingPhone='';
  function normalizePhone(v){
    v=(v||'').replace(/[\s-]/g,'');
    if(v.startsWith('09')) return '+98'+v.slice(1);
    if(v.startsWith('9')&&v.length===10) return '+98'+v;
    if(v.startsWith('+98')) return v;
    return v;
  }
  function showPhone(){
    authContent.innerHTML=`<span class="badge">ورود امن به Carivo</span><h2>شماره موبایل</h2><p>شماره موبایل خودت را وارد کن تا کد تأیید پیامکی برایت ارسال شود.</p><form id="phoneForm"><label>شماره موبایل<input id="phoneNumber" inputmode="tel" autocomplete="tel" required placeholder="0912 123 4567"></label><button class="primary" type="submit">📱 دریافت کد تأیید</button></form>`;
    authModal.hidden=false;
    document.querySelector('#phoneForm').onsubmit=sendOtp;
  }
  async function sendOtp(e){
    e.preventDefault(); if(!sb()) return alert('اتصال Supabase آماده نیست.');
    pendingPhone=normalizePhone(document.querySelector('#phoneNumber').value);
    if(!/^\+989\d{9}$/.test(pendingPhone)) return alert('شماره موبایل ایران را به‌صورت 09xxxxxxxxx وارد کن.');
    const {error}=await sb().auth.signInWithOtp({phone:pendingPhone});
    if(error) return alert(error.message);
    authContent.innerHTML=`<span class="badge">کد ارسال شد 📩</span><h2>تأیید شماره</h2><p>کد پیامک‌شده به <b>${pendingPhone}</b> را وارد کن.</p><form id="otpForm"><label>کد تأیید<input id="otpCode" inputmode="numeric" autocomplete="one-time-code" maxlength="6" required placeholder="123456"></label><button class="primary" type="submit">تأیید و ورود</button></form><button class="auth-link" id="changePhone">تغییر شماره</button>`;
    document.querySelector('#otpForm').onsubmit=verifyOtp; document.querySelector('#changePhone').onclick=showPhone;
  }
  async function verifyOtp(e){
    e.preventDefault(); const token=document.querySelector('#otpCode').value.trim();
    const {data,error}=await sb().auth.verifyOtp({phone:pendingPhone,token,type:'sms'});
    if(error) return alert(error.message);
    const user=data.user; const name=prompt('نام و نام خانوادگی‌ات را وارد کن:')||'کاربر Carivo';
    await sb().from('profiles').upsert({id:user.id,full_name:name,phone:pendingPhone});
    authModal.hidden=true; window.currentUser=user; if(typeof updateAuthUI==='function') updateAuthUI();
  }
  async function init(){
    if(!sb()) return;
    const {data}=await sb().auth.getSession(); window.currentUser=data.session?.user||null;
    if(typeof updateAuthUI==='function') updateAuthUI();
    sb().auth.onAuthStateChange((_event,session)=>{window.currentUser=session?.user||null;if(typeof updateAuthUI==='function')updateAuthUI();});
  }
  window.openPhoneAuth=showPhone;
  document.querySelector('#authClose')?.addEventListener('click',()=>authModal.hidden=true);
  const login=document.querySelector('#login'); if(login) login.onclick=showPhone;
  const post=document.querySelector('#post'); if(post) post.onclick=()=>window.currentUser?document.querySelector('#modal').hidden=false:showPhone();
  const cta=document.querySelector('#cta'); if(cta) cta.onclick=()=>window.currentUser?document.querySelector('#modal').hidden=false:showPhone();
  init();
})();
