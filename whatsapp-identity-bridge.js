/* TRANSMIND — WhatsApp Identity Bridge v1
 * Links a browser session to a voluntarily supplied phone number or to a
 * WhatsApp handoff reference. A website click alone cannot reveal the
 * visitor's WhatsApp number; only an authorized WhatsApp Business webhook
 * can return the sender number. This bridge prepares that correlation safely.
 */
(function(){
'use strict';
const KEY='transmind_identity_v1';
const SESSION_KEY='transmind_ai_session_v1';
const WA='628816654141';

function clean(v,max){return String(v??'').trim().slice(0,max||500);}
function normalizePhone(v){
  let p=String(v||'').replace(/[^0-9+]/g,'');
  if(p.startsWith('+'))p=p.slice(1);
  if(p.startsWith('08'))p='62'+p.slice(1);
  if(p.startsWith('8'))p='62'+p;
  return /^62[0-9]{8,15}$/.test(p)?p:'';
}
function session(){
  try{return localStorage.getItem(SESSION_KEY)||sessionStorage.getItem('transmind_visitor_session_v2')||''}catch(_){return''}
}
function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(_){return{}}}
function write(v){try{localStorage.setItem(KEY,JSON.stringify(v))}catch(_){}}
function ref(){
  const s=session()||'anonymous';
  let h=0;for(let i=0;i<s.length;i++)h=((h<<5)-h+s.charCodeAt(i))|0;
  return 'TM-'+Math.abs(h).toString(36).toUpperCase().padStart(6,'0');
}
function captureLead(lead,source){
  const phone=normalizePhone(lead?.phone);
  const name=clean(lead?.name,160);
  if(!phone)return null;
  const current=read();
  const next=Object.assign({},current,{phone,name:name||current.name||'',source:source||'customer_provided',captured_at:new Date().toISOString(),session_id:session(),consent_status:'granted',wa_ref:current.wa_ref||ref()});
  write(next);
  window.dispatchEvent(new CustomEvent('transmind:identity-captured',{detail:next}));
  return next;
}
function getLead(){
  const x=read();
  return x.phone?{name:x.name||'',phone:x.phone,source:x.source||'',consent_status:x.consent_status||'unknown'}:null;
}
function rememberWhatsAppHandoff(extra){
  const current=read(),next=Object.assign({},current,{wa_ref:current.wa_ref||ref(),wa_handoff_at:new Date().toISOString(),wa_handoff_source:extra?.source||'website',session_id:session()});
  write(next);return next;
}
function whatsappUrl(extra){
  const state=rememberWhatsAppHandoff(extra||{});
  const lead=getLead();
  const refText=state.wa_ref;
  const text=extra?.text||('Halo Transmind Nusantara, saya ingin melanjutkan konsultasi rental. Ref '+refText+'.');
  return 'https://wa.me/'+WA+'?text='+encodeURIComponent(text);
}
function bindLinks(){
  document.querySelectorAll('a[href*="wa.me/"],a[href*="api.whatsapp.com"]').forEach(a=>{
    if(a.dataset.tmIdentityBound)return;
    a.dataset.tmIdentityBound='1';
    a.addEventListener('click',()=>{
      const original=a.getAttribute('href')||'';
      const state=rememberWhatsAppHandoff({source:'website_link'});
      let text='Halo Transmind Nusantara, saya ingin melanjutkan konsultasi rental. Ref '+state.wa_ref+'.';
      try{const u=new URL(original,location.href);const existing=u.searchParams.get('text');if(existing)text=existing+' Ref '+state.wa_ref+'.';}catch(_){}
      a.href=whatsappUrl({text,source:'website_link'});
    },{passive:true});
  });
}
function bindForms(){
  const bookingPhone=document.getElementById('phone'),bookingName=document.getElementById('name');
  const aiPhone=document.getElementById('tm-ai-lead-phone'),aiName=document.getElementById('tm-ai-lead-name');
  const capture=source=>captureLead({phone:(source==='booking'?bookingPhone?.value:aiPhone?.value),name:(source==='booking'?bookingName?.value:aiName?.value)},source);
  bookingPhone?.addEventListener('input',()=>capture('booking'));
  bookingPhone?.addEventListener('change',()=>capture('booking'));
  aiPhone?.addEventListener('input',()=>capture('ai_followup'));
  aiPhone?.addEventListener('change',()=>capture('ai_followup'));
  window.addEventListener('transmind:booking-success',e=>{
    const d=e.detail||{},x=getLead();if(d.phone||x?.phone)captureLead({phone:d.phone||x.phone,name:d.name||x?.name||''},'booking_success');
  });
}
function init(){bindForms();bindLinks();new MutationObserver(()=>{bindForms();bindLinks()}).observe(document.body,{childList:true,subtree:true});}
window.TRANSMIND_IDENTITY={normalizePhone,captureLead,getLead,whatsappUrl,rememberWhatsAppHandoff,session,reference:ref};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();