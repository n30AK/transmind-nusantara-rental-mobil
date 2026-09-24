/* TransMind — consent-aware booking lead capture
 * Captures high-intent booking starts only when the visitor explicitly opts in.
 * Uses the existing transmind-ai customer-care endpoint; no PII is sent to analytics.
 */
(function(){
'use strict';
const CONSENT='customerCareConsent',SESSION='transmind_ai_session_v1';
function sid(){try{let v=sessionStorage.getItem(SESSION)||localStorage.getItem(SESSION);if(!v){v=(crypto&&crypto.randomUUID)?crypto.randomUUID():'tm-'+Date.now()+'-'+Math.random().toString(36).slice(2);sessionStorage.setItem(SESSION,v)}return v}catch(_){return'tm-'+Date.now()}}
function client(){return window.getTransmindSupabaseClient?window.getTransmindSupabaseClient():window.transmindSupabase||null}
function val(id){return document.getElementById(id)?.value?.trim()||''}
function consent(){return document.getElementById(CONSENT)?.checked===true}
function once(key){try{if(sessionStorage.getItem(key))return false;sessionStorage.setItem(key,'1');return true}catch(_){return true}}
async function capture(stage){
 if(!consent()||!once('tm-care-capture-'+stage+'-'+new Date().toISOString().slice(0,10)))return;
 const db=client();if(!db)return;
 const name=val('name'),phone=val('phone');if(!name||phone.replace(/\D/g,'').length<9)return;
 const service=val('service'),vehicle=document.getElementById('vehicle')?.selectedOptions?.[0]?.textContent?.trim()||'';
 const start=val('start'),end=val('end'),area=val('area'),notes=val('notes'),pickup=val('pickupLocation'),dropoff=val('dropoffLocation');
 const msg=stage==='booking_start'
  ? 'Saya sedang menyiapkan booking Transmind dan ingin dibantu melanjutkan prosesnya.'
  : 'Saya sudah menyelesaikan booking Transmind.';
 const memory=[['booking_stage',stage],['vehicle',vehicle],['service',service],['start_date',start],['end_date',end],['area',area],['pickup_location',pickup],['dropoff_location',dropoff]].filter(x=>x[1]).map(x=>({type:x[0],value:x[1],consent:true}));
 try{
  const r=await db.functions.invoke('transmind-ai',{body:{message:msg,session_id:sid(),path:location.pathname,referrer:location.href,lead:{name,phone,consent:true,consent_status:'granted',memory},quote:stage==='booking_start',booking_stage:stage}});
  if(r.error)throw r.error;
  window.dispatchEvent(new CustomEvent('transmind:customer-care-lead-captured',{detail:{stage,name,phone}}));
 }catch(e){console.warn('TransMind customer-care lead capture:',e)}
}
function boot(){
 const f=document.getElementById('bookingForm');if(!f||f.dataset.tmLeadCapture)return;f.dataset.tmLeadCapture='1';
 f.addEventListener('submit',()=>setTimeout(()=>capture('booking_start'),120),true);
 window.addEventListener('transmind:booking-success',()=>capture('booking_success'));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();