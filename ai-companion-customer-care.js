/* TransMind AI Customer Service — Conversion Care v4
 * Booking 50/day mission: human-feeling care, consent-aware memory,
 * return-visitor continuity, booking rescue, admin handoff and learning.
 *
 * IMPORTANT:
 * - No fake bookings or synthetic conversions.
 * - No unsolicited outbound WhatsApp.
 * - Proactive WhatsApp delivery requires an authorized WhatsApp Business
 *   provider/webhook and valid opt-in; until then the system creates an
 *   admin-ready queue and resumes the conversation when the customer returns.
 */
(function(){
'use strict';
if(window.__TM_CUSTOMER_CARE_V4)return;window.__TM_CUSTOMER_CARE_V4=true;

const KEY='transmind_customer_care_v4';
const SESSION='transmind_ai_session_v1';
const WA='628816654141';
const FOLLOW=[30*60e3,24*3600e3,3*24*3600e3,7*24*3600e3];
const now=()=>new Date().toISOString();
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(_){return{}}};
const write=v=>{try{localStorage.setItem(KEY,JSON.stringify(v))}catch(_){}};
const sid=()=>{try{return localStorage.getItem(SESSION)||''}catch(_){return''}};
const val=id=>document.getElementById(id)?.value?.trim()||'';

function hasConsent(){
 const s=read();
 return document.getElementById('tm-ai-consent')?.checked===true
   || document.getElementById('customerCareConsent')?.checked===true
   || s.lead?.consent===true
   || s.lead?.consent_status==='granted';
}

function memory(){
 const ids=['tm-ai-pickup','tm-ai-dropoff','pickupLocation','dropoffLocation','name','phone','vehicle','service','start','end','area','notes'];
 const m={};
 ids.forEach(id=>{
   const el=document.getElementById(id);
   const v=el?.value?.trim()||'';
   if(v)m[id]=v;
 });
 return m;
}

function emit(type,detail){
 const p=Object.assign({event_type:type,session_id:sid(),path:location.pathname,occurred_at:now()},detail||{});
 window.dispatchEvent(new CustomEvent('transmind:customer-care',{detail:p}));
 try{
   const a=JSON.parse(localStorage.getItem('transmind_ai_demand_v4')||'[]');
   a.push(p);localStorage.setItem('transmind_ai_demand_v4',JSON.stringify(a.slice(-500)));
 }catch(_){}
 return p;
}

function currentLead(){
 const s=read();
 const name=val('tm-ai-lead-name')||val('name')||s.lead?.name||'';
 const phone=val('tm-ai-lead-phone')||val('phone')||s.lead?.phone||'';
 if(!name||phone.replace(/\D/g,'').length<9)return null;
 return {
   name,phone,
   consent:hasConsent(),
   consent_status:hasConsent()?'granted':'unknown',
   memory:Object.assign({},s.lead?.memory||{},memory())
 };
}

function rememberLead(l){
 if(!l)return;
 const s=read();
 s.lead=Object.assign({},s.lead||{},l,{last_seen_at:now(),memory:Object.assign({},s.lead?.memory||{},l.memory||{})});
 s.last_activity_at=now();
 write(s);
}

function followup(stage,reason){
 const s=read(),l=currentLead()||s.lead||null;
 if(l)rememberLead(l);
 const delay=FOLLOW[Math.max(0,stage-1)]||FOLLOW[0];
 s.follow_up={
   stage,reason,
   scheduled_at:new Date(Date.now()+delay).toISOString(),
   status:'scheduled'
 };
 s.last_activity_at=now();
 write(s);
 emit('ai_followup_scheduled',s.follow_up);
 return s.follow_up;
}

async function backend(stage,extra){
 const l=currentLead();
 if(!l||!l.consent)return null;
 rememberLead(l);
 const endpoint=window.TRANSMIND_AI_ENDPOINT||'';
 if(!endpoint)return null;
 try{
   const r=await fetch(endpoint,{
     method:'POST',
     headers:{'Content-Type':'application/json'},
     body:JSON.stringify({
       message:extra?.message||'Saya ingin dibantu Transmind sampai siap booking.',
       session_id:sid(),
       path:location.pathname,
       referrer:location.href,
       lead:l,
       booking_stage:stage,
       customer_care:true,
       follow_up:extra?.follow_up||false,
       human_handoff:extra?.human_handoff||false,
       reason:extra?.reason||'',
       context:{
         memory:l.memory||{},
         customer_care_stage:stage,
         return_visit:Boolean(extra?.return_visit),
         source:'customer_care_v4'
       }
     })
   });
   if(!r.ok)return null;
   return await r.json();
 }catch(_){return null}
}

function handoff(reason){
 const s=read(),l=currentLead()||s.lead||null;
 if(l)rememberLead(l);
 s.last_handoff={
   status:'waiting_admin',
   reason,
   started_at:now(),
   deadline:new Date(Date.now()+10*60e3).toISOString()
 };
 write(s);
 emit('human_handoff_requested',s.last_handoff);
 followup(1,'human_handoff');
 backend('human_handoff',{
   message:'Calon pelanggan membutuhkan bantuan admin Transmind untuk keputusan yang tidak boleh dijawab otomatis.',
   human_handoff:true,reason
 });
 update();
 return s.last_handoff;
}

function record(stage,detail){
 const s=read(),l=currentLead()||s.lead||null;
 if(l)rememberLead(l);
 s.last_stage={stage,at:now(),detail:detail||{},memory:memory()};
 if(stage==='booking_success'){
   s.follow_up={status:'booked',stage:0,scheduled_at:null};
   s.last_booking=s.last_stage;
   s.relationship_state='customer';
 }else if(stage==='lead_lost'||stage==='booking_deferred'){
   s.relationship_state='nurture';
   s.follow_up={status:'scheduled',stage:2,scheduled_at:new Date(Date.now()+FOLLOW[1]).toISOString(),reason:stage};
 }else if(stage==='booking_start'||stage==='quote'||stage==='whatsapp_click'){
   followup(1,stage);
 }
 write(s);
 emit(stage,s.last_stage);
 if(l&&l.consent)backend(stage,{
   message:stage==='booking_success'
     ?'Booking berhasil diselesaikan.'
     :'Calon pelanggan masih membutuhkan bantuan menuju booking.',
   return_visit:false
 });
 update();
 return s;
}

function shouldHandoff(q){
 return /(refund|pengembalian|komplain|keluhan|diskon|nego|negosiasi|kontrak|corporate agreement|perjanjian|invoice|pembayaran.*(rekening|transfer)|rekening.*(pembayaran|transfer)|ketersediaan.*(pasti|confirm)|jamin|garansi|legal|surat|pajak)/i.test(q||'');
}

function shouldNurture(q){
 return /(belum jadi|tidak jadi|gak jadi|nggak jadi|nanti dulu|lain kali|masih pikir|pertimbangkan dulu|belum siap|belum pasti|tunda|ditunda|cancel|batal)/i.test(q||'');
}

function card(){
 const panel=document.getElementById('transmind-ai-panel');
 if(!panel||document.getElementById('tm-care-card-v4'))return;
 const c=document.createElement('div');
 c.id='tm-care-card-v4';
 c.style.cssText='margin:0 12px 10px;padding:11px 12px;border:1px solid rgba(215,181,109,.28);border-radius:12px;background:#111;display:none;font-size:12px;line-height:1.5';
 c.innerHTML='<strong style="color:#e8cf9b">TransMind tetap mendampingi</strong><div id="tm-care-status-v4" style="opacity:.78;margin-top:4px"></div>';
 const f=document.getElementById('tm-ai-form');
 if(f)panel.insertBefore(c,f);
}

function update(){
 card();
 const c=document.getElementById('tm-care-card-v4'),t=document.getElementById('tm-care-status-v4');
 if(!c||!t)return;
 const s=read(),h=s.last_handoff;
 if(h?.status==='waiting_admin'){
   t.textContent='Saya sudah meneruskan konteksnya ke admin TransMind. Untuk keputusan khusus, admin yang akan memastikan jawabannya.';
   c.style.display='block';return;
 }
 if(s.follow_up?.status==='scheduled'&&s.follow_up.scheduled_at&&Date.now()>=Date.parse(s.follow_up.scheduled_at)){
   if(s.follow_up.reason==='booking_success'||s.follow_up.status==='booked'){c.style.display='none';return}
   t.textContent='Senang melihat Anda kembali. Saya masih menyimpan konteks kebutuhan perjalanan Anda. Kalau rencananya masih berjalan, kita bisa lanjut tanpa mengulang dari awal.';
   c.style.display='block';
   emit('ai_return_followup_due',{reason:s.follow_up.reason});
   return;
 }
 c.style.display='none';
}

function bind(){
 document.querySelectorAll('a[href*="wa.me/"],a[href*="api.whatsapp.com"]').forEach(a=>{
   if(a.dataset.tmCareV4)return;
   a.dataset.tmCareV4='1';
   const h=(a.getAttribute('href')||'').toLowerCase();
   if(h.includes('wa.me/'+WA)||h.includes('api.whatsapp.com')){
     a.addEventListener('click',()=>{
       record('whatsapp_click',{channel:'whatsapp',href:a.href});
     },{passive:true});
   }
 });
}

function install(){
 card();bind();
 new MutationObserver(bind).observe(document.body,{childList:true,subtree:true});

 window.addEventListener('transmind:booking-start',e=>record('booking_start',e.detail||{}));
 window.addEventListener('transmind:booking-success',e=>record('booking_success',e.detail||{}));
 window.addEventListener('transmind:customer-care-lead-captured',e=>record('lead_captured',e.detail||{}));

 document.addEventListener('submit',e=>{
   if(e.target?.id==='bookingForm')record('booking_start',{form_id:'bookingForm'});
 },true);

 document.addEventListener('click',e=>{
   const el=e.target?.closest?.('a,button');
   if(!el)return;
   const href=el.getAttribute('href')||'',txt=el.textContent||'';
   if(/#booking/i.test(href)||/booking|pesan sekarang|mulai perjalanan/i.test(txt)){
     record('booking_cta_click',{label:txt.slice(0,100),href});
   }
 },true);

 const form=document.getElementById('tm-ai-form'),input=document.getElementById('tm-ai-input');
 if(form&&input){
   form.addEventListener('submit',()=>{
     const q=input.value.trim();
     if(shouldHandoff(q))handoff('keputusan_admin_diperlukan');
     else if(shouldNurture(q))record('booking_deferred',{question:q});
     else record('ai_conversation',{question:q});
   },true);
 }

 const bookingForm=document.getElementById('bookingForm');
 if(bookingForm){
   let touched=false;
   const rescue=()=>{
     if(touched||document.visibilityState!=='visible')return;
     const incomplete=['name','phone','vehicle','start','end'].some(id=>!val(id));
     if(incomplete){
       emit('booking_rescue_opportunity',{reason:'form_started_but_incomplete'});
       const s=read();s.rescue_opportunity_at=now();write(s);
     }
   };
   bookingForm.addEventListener('focusin',()=>{touched=true;clearTimeout(window.__tmCareRescueTimer);window.__tmCareRescueTimer=setTimeout(rescue,12000)},{once:true});
   bookingForm.addEventListener('submit',()=>{touched=true;clearTimeout(window.__tmCareRescueTimer)},true);
 }

 // Continuity: a returning visitor is not treated as a brand-new lead.
 const s=read();
 if(s.lead?.name&&s.lead?.phone&&s.lead?.consent===true){
   emit('customer_returned',{name:s.lead.name,phone:s.lead.phone});
   if(s.follow_up?.status==='scheduled'&&s.follow_up.scheduled_at&&Date.now()>=Date.parse(s.follow_up.scheduled_at)){
     backend('return_visit',{
       message:'Pelanggan kembali ke website setelah follow-up sebelumnya. Sambut dengan hangat dan lanjutkan dari konteks terakhir, tanpa mengarang informasi baru.',
       follow_up:true,return_visit:true
     });
   }
 }

 setInterval(update,15000);
 update();
 window.TRANSMIND_CUSTOMER_CARE={
   getState:read,
   recordHandoff:handoff,
   scheduleFollowup:followup,
   recordBooking:record,
   recordStage:record,
   markDeferred:()=>record('booking_deferred',{source:'manual'}),
   update,
   requestHuman:handoff
 };
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();