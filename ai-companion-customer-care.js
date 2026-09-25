/* TransMind AI Customer Service — Conversion Care v3
 * Human-feeling, consent-aware customer care.
 * Converts real intent into assisted booking, admin handoff and reusable customer memory.
 * Browser follow-up works while the visitor is active/returns; true outbound WhatsApp follow-up
 * requires an authorized WhatsApp Business provider/webhook and is never faked here.
 */
(function(){
'use strict';
if(window.__TM_CUSTOMER_CARE_V3)return;window.__TM_CUSTOMER_CARE_V3=true;
const KEY='transmind_customer_care_v3',SESSION='transmind_ai_session_v1',WA='628816654141';
const FOLLOW=[30*60e3,24*3600e3,3*24*3600e3,7*24*3600e3];
const now=()=>new Date().toISOString();
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(_){return{}}};
const write=v=>{try{localStorage.setItem(KEY,JSON.stringify(v))}catch(_){}};
const sid=()=>{try{return localStorage.getItem(SESSION)||''}catch(_){return''}};
const val=id=>document.getElementById(id)?.value?.trim()||'';
const consent=()=>document.getElementById('tm-ai-consent')?.checked===true||document.getElementById('customerCareConsent')?.checked===true;
function memory(){
 const ids=['tm-ai-lead-name','tm-ai-lead-phone','tm-ai-pickup','tm-ai-dropoff','name','phone','vehicle','service','start','end','area','notes'];
 const m={};ids.forEach(id=>{const v=val(id);if(v)m[id]=v});
 return m;
}
function emit(type,detail){
 const p=Object.assign({event_type:type,session_id:sid(),path:location.pathname,occurred_at:now()},detail||{});
 window.dispatchEvent(new CustomEvent('transmind:customer-care',{detail:p}));
 try{const a=JSON.parse(localStorage.getItem('transmind_ai_demand_v3')||'[]');a.push(p);localStorage.setItem('transmind_ai_demand_v3',JSON.stringify(a.slice(-500)))}catch(_){}
 return p;
}
function lead(){
 const name=val('tm-ai-lead-name')||val('name'),phone=val('tm-ai-lead-phone')||val('phone');
 return name&&phone?{name,phone,consent:true,consent_status:'granted',memory:memory()}:null;
}
function followup(stage,reason){
 const s=read(),l=lead()||s.lead||null,delay=FOLLOW[Math.max(0,stage-1)]||FOLLOW[0];
 s.lead=l||s.lead||null;s.follow_up={stage,reason,scheduled_at:new Date(Date.now()+delay).toISOString(),status:'scheduled'};
 s.last_activity_at=now();write(s);emit('ai_followup_scheduled',s.follow_up);
 return s.follow_up;
}
async function backend(stage,extra){
 const l=lead();if(!l||!consent())return null;
 const endpoint=window.TRANSMIND_AI_ENDPOINT||'';
 if(!endpoint)return null;
 try{
  const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({
   message:extra?.message||'Saya ingin dibantu Transmind sampai siap booking.',
   session_id:sid(),path:location.pathname,referrer:location.href,
   lead:l,booking_stage:stage,customer_care:true,follow_up:extra?.follow_up||false,
   human_handoff:extra?.human_handoff||false,reason:extra?.reason||'',context:{memory:l.memory||{},customer_care_stage:stage}
  })});
  if(!r.ok)return null;const d=await r.json();return d;
 }catch(_){return null}
}
function handoff(reason){
 const s=read(),l=lead()||s.lead||null;
 s.lead=l;s.last_handoff={status:'waiting_admin',reason,started_at:now(),deadline:new Date(Date.now()+10*60e3).toISOString()};
 write(s);emit('human_handoff_requested',s.last_handoff);
 followup(1,'human_handoff');
 backend('human_handoff',{message:'Calon pelanggan membutuhkan bantuan admin Transmind untuk keputusan yang tidak boleh dijawab otomatis.',human_handoff:true,reason});
 update();
 return s.last_handoff;
}
function record(stage,detail){
 const s=read();s.lead=lead()||s.lead||null;s.last_stage={stage,at:now(),detail:detail||{},memory:memory()};
 if(stage==='booking_success'){s.follow_up={status:'booked',stage:0,scheduled_at:null};s.last_booking=s.last_stage}
 else if(stage==='booking_start'||stage==='quote'||stage==='whatsapp_click')followup(stage==='quote'?1:1,stage);
 write(s);emit(stage,s.last_stage);if(s.lead&&consent())backend(stage,{message:stage==='booking_success'?'Booking berhasil diselesaikan.':'Calon pelanggan masih membutuhkan bantuan menuju booking.'});update();return s;
}
function shouldHandoff(q){
 return /(refund|pengembalian|komplain|keluhan|diskon|nego|negosiasi|kontrak|corporate agreement|perjanjian|invoice|pembayaran.*(rekening|transfer)|rekening.*(pembayaran|transfer)|ketersediaan.*(pasti|confirm)|jamin|garansi|legal|surat|pajak)/i.test(q||'');
}
function card(){
 const panel=document.getElementById('transmind-ai-panel');if(!panel||document.getElementById('tm-care-card-v3'))return;
 const c=document.createElement('div');c.id='tm-care-card-v3';c.style.cssText='margin:0 12px 10px;padding:11px 12px;border:1px solid rgba(215,181,109,.28);border-radius:12px;background:#111;display:none;font-size:12px;line-height:1.5';
 c.innerHTML='<strong style="color:#e8cf9b">TransMind tetap mendampingi</strong><div id="tm-care-status-v3" style="opacity:.78;margin-top:4px"></div>';
 const f=document.getElementById('tm-ai-form');if(f)panel.insertBefore(c,f);
}
function update(){
 card();const c=document.getElementById('tm-care-card-v3'),t=document.getElementById('tm-care-status-v3');if(!c||!t)return;
 const s=read(),h=s.last_handoff;
 if(h?.status==='waiting_admin'){t.textContent='Permintaan Anda sudah diteruskan ke admin TransMind. AI tidak akan mengambil keputusan yang seharusnya dibuat manusia.';c.style.display='block';return}
 const fu=s.follow_up;
 if(fu?.status==='scheduled'&&fu.scheduled_at&&Date.now()>=Date.parse(fu.scheduled_at)){
   t.textContent='Selamat datang kembali. Kalau perjalanan Anda masih direncanakan, saya bisa membantu melanjutkan dari informasi sebelumnya.';c.style.display='block';
   emit('ai_return_followup_due',{reason:fu.reason});return;
 }
 c.style.display='none';
}
function bind(){
 document.querySelectorAll('a[href*="wa.me/"],a[href*="api.whatsapp.com"]').forEach(a=>{
  if(a.dataset.tmCareV3)return;a.dataset.tmCareV3='1';const h=(a.getAttribute('href')||'').toLowerCase();
  if(h.includes('wa.me/'+WA)||h.includes('api.whatsapp.com'))a.addEventListener('click',()=>record('whatsapp_click',{channel:'whatsapp',href:a.href}),{passive:true});
 });
}
function install(){
 card();bind();new MutationObserver(bind).observe(document.body,{childList:true,subtree:true});
 window.addEventListener('transmind:booking-start',e=>record('booking_start',e.detail||{}));
 window.addEventListener('transmind:booking-success',e=>record('booking_success',e.detail||{}));
 document.addEventListener('submit',e=>{if(e.target?.id==='bookingForm')record('booking_start',{form_id:'bookingForm'})},true);
 document.addEventListener('click',e=>{
  const el=e.target?.closest?.('a,button');if(!el)return;const href=el.getAttribute('href')||'',txt=el.textContent||'';
  if(/#booking/i.test(href)||/booking/i.test(txt))record('booking_cta_click',{label:txt.slice(0,100)});
 });
 const form=document.getElementById('tm-ai-form'),input=document.getElementById('tm-ai-input');
 if(form&&input){form.addEventListener('submit',()=>{const q=input.value.trim();if(shouldHandoff(q))handoff('keputusan_admin_diperlukan');else record('ai_conversation',{question:q})},true)}
 setInterval(update,15000);update();
 window.TRANSMIND_CUSTOMER_CARE={getState:read,recordHandoff:handoff,scheduleFollowup:followup,recordBooking:record,recordStage:record,update,requestHuman:handoff};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();