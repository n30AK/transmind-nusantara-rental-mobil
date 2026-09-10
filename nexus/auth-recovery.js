/* TRANSMIND NEXUS — Auth Recovery
   Production-safe password recovery helper. Uses Supabase Auth only; no service_role key.
*/
(function(){
  'use strict';
  const cfg = window.NEXUS_CONFIG || {};
  const RESET_URL = 'https://transmindnusantararentalmobil.co.id/nexus/reset-password.html';
  const client = (window.supabase && cfg.supabaseUrl && cfg.supabaseAnonKey)
    ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey)
    : null;

  function msg(text, cls){
    const el=document.getElementById('loginMsg');
    if(el){ el.className='msg '+(cls||''); el.textContent=text; }
  }

  function injectRecoveryLink(){
    const form=document.getElementById('loginForm');
    if(!form || document.getElementById('nexusForgotPassword')) return;
    const wrap=document.createElement('div');
    wrap.style.cssText='margin-top:12px;text-align:center';
    wrap.innerHTML='<button id="nexusForgotPassword" type="button" style="background:none;border:0;color:#f0cf68;text-decoration:underline;padding:6px 8px;font-size:12px;cursor:pointer">Lupa Password?</button>';
    form.insertAdjacentElement('afterend',wrap);
    document.getElementById('nexusForgotPassword').addEventListener('click', async function(){
      const email=document.getElementById('email')?.value?.trim();
      if(!email){
        document.getElementById('email')?.focus();
        msg('Masukkan email akun NEXUS terlebih dahulu.','warn');
        return;
      }
      if(!client){ msg('Koneksi Auth NEXUS belum siap. Muat ulang halaman.','bad'); return; }
      this.disabled=true;
      msg('Mengirim email pemulihan password...','warn');
      try{
        const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:RESET_URL});
        if(error) throw error;
        msg('Email pemulihan telah dikirim. Gunakan link terbaru dan selesaikan reset password.','ok');
      }catch(e){
        msg(e?.message || 'Gagal mengirim email pemulihan password.','bad');
      }finally{ this.disabled=false; }
    });
  }

  function showRecoveryNotice(){
    const hash=new URLSearchParams(window.location.hash.replace(/^#/ ,''));
    const code=hash.get('error_code');
    const desc=hash.get('error_description');
    if(code || desc){
      const text=desc ? decodeURIComponent(desc.replace(/\+/g,' ')) : 'Link autentikasi tidak valid atau sudah kedaluwarsa.';
      msg(text+' Silakan minta link pemulihan baru.','bad');
      history.replaceState(null,'',window.location.pathname+window.location.search);
    }
  }

  function init(){
    injectRecoveryLink();
    showRecoveryNotice();
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
