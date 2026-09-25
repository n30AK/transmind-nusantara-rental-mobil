/* TransMind — Booking Conversion Rescue v3
 * Turns real booking intent into assisted completion.
 * No fake bookings, no synthetic conversions, no unsolicited outbound messaging.
 */
(function(){
'use strict';
const SESSION='transmind_ai_session_v1';
const sid=()=>{try{return sessionStorage.getItem(SESSION)||localStorage.getItem(SESSION)||''}catch(_){return''}};
const $=id=>document.getElementById(id);
let active=false,timer=null,lastLeadKey='';
function consent(){return $('customerCareConsent')?.checked===true}
function hasCore(){return ['name','phone','vehicle','start','end','area'].every(id=>String($(id)?.value||'').trim())}
function openAI(reason){
 const launcher=$('transmind-ai-launcher');
 if(!launcher||active)return;
 active=true; launcher.click();
 setTimeout(()=>{
  const box=$('tm-ai-messages'); if(!box)return;
  const existing=[...box.children].some(x=>/bantu.*booking|lanjutkan.*booking|belum yakin/i.test(x.textContent||''));
  if(existing)return;
  const e=document.createElement('div');e.className='tm-ai-msg tm-ai-bot';
  e.textContent=reason==='error'
   ? 'Tidak apa-apa, kita rapikan bersama. Kalau ada bagian booking yang membuat ragu, ceritakan saja—saya bantu sampai jelas.'
   : 'Kalau Anda masih mempertimbangkan booking, saya bisa bantu cek kendaraan, tanggal, layanan, dan perkiraannya. Tidak perlu mengulang dari awal.';
  box.appendChild(e);box.scrollTop=box.scrollHeight;
 },220);
}
function schedule(ms,reason){clearTimeout(timer);timer=setTimeout(()=>{if(document.visibilityState==='visible'&&!hasCore())openAI(reason)},ms)}
function sendLead(stage){
 if(!consent()||!hasCore())return;
 const key=stage+'|'+$('phone')?.value.trim()+'|'+$('start')?.value;
 if(key===lastLeadKey)return;lastLeadKey=key;
 const db=window.getTransmindSupabaseClient?.()||window.transmindSupabase;if(!db)return;
 const name=$('name').value.trim(),phone=$('phone').value.trim();
 const memory=['vehicle','service','start','end','area','notes','pickupLocation','dropoffLocation'].map(id=>({id,v:$(id)?.value?.trim()||''})).filter(x=>x.v).map(x=>({type:x.id,value:x.v,consent:true}));
 db.functions.invoke('transmind-ai',{body:{message:stage==='booking_start'?'Saya sedang menyiapkan booking dan ingin dibantu sampai selesai.':'Saya belum menyelesaikan booking dan ingin bantuan.',session_id:sid(),path:location.pathname,referrer:location.href,lead:{name,phone,consent:true,consent_status:'granted',memory},quote:true,booking_stage:stage}}).catch(()=>{});
}
document.addEventListener('DOMContentLoaded',()=>{
 const form=$('bookingForm');if(!form)return;
 form.addEventListener('focusin',()=>schedule(18000,'start'),{once:true});
 form.addEventListener('input',()=>{if(consent())schedule(22000,'start')});
 form.addEventListener('submit',()=>{sendLead('booking_start');clearTimeout(timer)},true);
 window.addEventListener('transmind:booking-start',()=>sendLead('booking_start'));
 window.addEventListener('transmind:booking-success',()=>{active=true;clearTimeout(timer)});
 const result=$('result');if(result)new MutationObserver(()=>{
  const t=result.textContent||'';
  if(/Booking gagal|tidak menerima|Sistem tidak siap|Terjadi kesalahan/i.test(t))openAI('error');
 }).observe(result,{childList:true,subtree:true,characterData:true});
});
})();