/* TRANSMIND NEXUS — Auth Recovery
   Production-safe password recovery helper. Uses Supabase Auth only; no service_role key.
*/
(function(){
  'use strict';
  const cfg = window.NEXUS_CONFIG || {};
  const RESET_URL = 'https://transmindnusantararentalmobil.co.id/nexus/reset-password.html';
  const COOLDOWN_MS = 90000;
  const STORAGE_KEY = 'transmind_nexus_recovery_cooldown_v1';
  const client = (window.supabase && cfg.supabaseUrl && cfg.supabaseAnonKey)
    ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey)
    : null;
  let timer = null;

  function msg(text, cls){
    const el=document.getElementById('loginMsg');
    if(el){ el.className='msg '+(cls||''); el.textContent=text; }
  }

  function getCooldown(email){
    try{
      const raw=sessionStorage.getItem(STORAGE_KEY);
      if(!raw) return 0;
      const data=JSON.parse(raw);
      if(data.email!==email) return 0;
      return Math.max(0, Number(data.until||0)-Date.now());
    }catch(_){ return 0; }
  }

  function setCooldown(email, ms){
    try{ sessionStorage.setItem(STORAGE_KEY, JSON.stringify({email,until:Date.now()+ms})); }catch(_){ }
  }

  function startCooldown(button,email,ms){
    if(timer) clearInterval(timer);
    const until=Date.now()+ms;
    try{ sessionStorage.setItem(STORAGE_KEY, JSON.stringify({email,until})); }catch(_){ }
    const tick=()=>{
      const left=Math.max(0,until-Date.now());
      if(left<=0){
        clearInterval(timer); timer=null;
        button.disabled=false;
        button.textContent='Lupa Password?';
        return;
      }
      button.disabled=true;
      button.textContent='Coba lagi ('+Math.ceil(left/1000)+' dtk)';
    };
    tick();
    timer=setInterval(tick,1000);
  }

  function restoreCooldown(button,email){
    const left=getCooldown(email);
    if(left>0){ startCooldown(button,email,left); return true; }
    return false;
  }

  function isRateLimitError(e){
    const text=((e?.message||'')+' '+(e?.code||'')).toLowerCase();
    return e?.status===429 || text.includes('rate limit') || text.includes('too many') || text.includes('over_email_send_rate_limit') || text.includes('over_request_rate_limit');
  }

  function injectRecoveryLink(){
    const form=document.getElementById('loginForm');
    if(!form || document.getElementById('nexusForgotPassword')) return;
    const wrap=document.createElement('div');
    wrap.style.cssText='margin-top:12px;text-align:center';
    wrap.innerHTML='<button id="nexusForgotPassword" type="button" style="background:none;border:0;color:#f0cf68;text-decoration:underline;padding:6px 8px;font-size:12px;cursor:pointer">Lupa Password?</button>';
    form.insertAdjacentElement('afterend',wrap);
    const button=document.getElementById('nexusForgotPassword');
    const getEmail=()=>document.getElementById('email')?.value?.trim().toLowerCase()||'';
    const restore=()=>{ const email=getEmail(); if(email) restoreCooldown(button,email); };
    restore();
    button.addEventListener('click', async function(){
      const email=getEmail();
      if(!email){
        document.getElementById('email')?.focus();
        msg('Masukkan email akun NEXUS terlebih dahulu.','warn');
        return;
      }
      const left=getCooldown(email);
      if(left>0){
        startCooldown(this,email,left);
        msg('Tunggu '+Math.ceil(left/1000)+' detik sebelum meminta email reset berikutnya.','warn');
        return;
      }
      if(!client){ msg('Koneksi Auth NEXUS belum siap. Muat ulang halaman.','bad'); return; }
      this.disabled=true;
      msg('Mengirim email pemulihan password...','warn');
      try{
        const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:RESET_URL});
        if(error) throw error;
        setCooldown(email,COOLDOWN_MS);
        startCooldown(this,email,COOLDOWN_MS);
        msg('Email pemulihan telah dikirim. Gunakan link terbaru. Jika belum masuk, periksa Spam/Junk.','ok');
      }catch(e){
        if(isRateLimitError(e)){
          setCooldown(email,COOLDOWN_MS);
          startCooldown(this,email,COOLDOWN_MS);
          msg('Permintaan reset terlalu sering. Supabase sedang membatasi pengiriman email. Tunggu beberapa menit, lalu coba sekali lagi.','bad');
        }else{
          this.disabled=false;
          msg(e?.message || 'Gagal mengirim email pemulihan password.','bad');
        }
      }
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
