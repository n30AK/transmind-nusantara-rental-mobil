/* TransMind AI Customer Service — Care & Conversion Bridge v2
 * Captures high-intent handoffs, booking stages and a customer follow-up state.
 * Two-way WhatsApp automation still requires an authorized WhatsApp Business webhook/provider.
 */
(function(){
'use strict';
const KEY='transmind_customer_care_v2',SESSION='transmind_ai_session_v1',WA='628816654141';
const FOLLOW=[30*60e3,24*3600e3,3*24*3600e3,7*24*3600e3];
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(_){return{}}};
const write=v=>{try{localStorage.setItem(KEY,JSON.stringify(v))}catch(_){}};
const sid=()=>{try{return localStorage.getItem(SESSION)||''}catch(_){return''}};
const emit=(type,detail)=>{const p=Object.assign({event_type:type,session_id:sid(),path:location.pathname,occurred_at:new Date().toISOString()},detail||{});window.dispatchEvent(new CustomEvent('transmind:customer-care',{detail:p}));try{const a=JSON.parse(localStorage.getItem('transmind_ai_demand_v2')||'[]');a.push(p);localStorage.setItem('transmind_ai_demand_v2',JSON.stringify(a.slice(-300)))}catch(_){}return p};
function schedule(stage,lead){const s=read();s.follow_up={stage,scheduled_at:new Date(Date.now()+(FOLLOW[Math.max(0,stage-1)]||FOLLOW[0])).toISOString(),lead:lead||s.follow_up?.lead||null,status:'scheduled'};write(s);emit('ai_followup_scheduled',s.follow_up);return s.follow_up}
function handoff(detail){const s=read();s.last_handoff=Object.assign({status:'waiting_admin',started_at:new Date().toISOString(),deadline:new Date(Date.now()+10*60e3).toISOString()},detail||{});write(s);emit('human_handoff_requested',s.last_handoff);schedule(1,detail?.lead);return s}
function booking(type,detail){const s=read();s.last_booking=Object.assign({type,at:new Date().toISOString()},detail||{});s.follow_up=type==='booking_success'?{stage:0,status:'booked',scheduled_at:null}:schedule(1,detail?.lead);write(s);emit(type,s.last_booking);return s}
function card(){const panel=document.getElementById('transmind-ai-panel');if(!panel||document.getElementById('tm-care-card'))return;const c=document.createElement('div');c.id='tm-care-card';c.style.cssText='margin:0 12px 10px;padding:11px 12px;border:1px solid rgba(215,181,109,.28);border-radius:12px;background:#111;display:none;font-size:12px;line-height:1.5';c.innerHTML='<strong style="color:#e8cf9b">TransMind tetap mendampingi</strong><div id="tm-care-status" style="opacity:.78;margin-top:4px"></div>';const f=document.getElementById('tm-ai-form');if(f)panel.insertBefore(c,f)}
function update(){card();const c=document.getElementById('tm-care-card'),t=document.getElementById('tm-care-status');if(!c||!t)return;const s=read(),h=s.last_handoff;if(!h||h.status!=='waiting_admin'){c.style.display='none';return}t.textContent='Permintaan Anda sudah dicatat. Untuk keputusan khusus, admin TransMind akan mengambil alih; AI tetap dapat membantu hal lain.';c.style.display='block'}
function bind(){document.querySelectorAll('a[href*="wa.me/"],a[href*="api.whatsapp.com"]').forEach(a=>{if(a.dataset.tmCareBound)return;a.dataset.tmCareBound='1';const h=(a.getAttribute('href')||'').toLowerCase();if(h.includes('wa.me/'+WA)||h.includes('api.whatsapp.com'))a.addEventListener('click',()=>handoff({channel:'whatsapp',href:a.href,source:'website',intent:'customer_contact_admin'}),{passive:true})});}
function install(){card();bind();new MutationObserver(bind).observe(document.body,{childList:true,subtree:true});window.addEventListener('transmind:booking-success',e=>booking('booking_success',e.detail||{}));window.addEventListener('transmind:booking-start',e=>booking('booking_start',e.detail||{}));setInterval(update,15000);update();window.TRANSMIND_CUSTOMER_CARE={getState:read,recordHandoff:handoff,scheduleFollowup:schedule,recordBooking:booking,update}}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();