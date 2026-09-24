/* TransMind AI Customer Service — Care Orchestrator v3
 * Goal: move observed demand toward confirmed booking while preserving human authority.
 * Uses first-party browser signals + Supabase CRM queues. WhatsApp outbound remains provider-gated.
 */
(function(){
'use strict';
const VERSION='3.0.0', KEY='transmind_customer_care_v3', SESSION='transmind_ai_session_v1';
const WA=['628816654141','6281292677888'];
const STAGES=[
 {name:'new_lead',delay:15*60e3,copy:'Halo, saya masih siap membantu jika Anda ingin melanjutkan kebutuhan perjalanan Anda.'},
 {name:'warm_lead',delay:24*3600e3,copy:'Selamat pagi, semoga harinya lancar. Kalau rencana perjalanan Anda masih berjalan, saya bisa bantu cek kembali pilihan kendaraan dan kebutuhannya.'},
 {name:'decision',delay:3*24*3600e3,copy:'Halo, saya ingin memastikan kebutuhan perjalanan Anda tidak terlewat. Jika tanggal atau kendaraan berubah, saya bisa bantu menyesuaikannya.'},
 {name:'reengage',delay:7*24*3600e3,copy:'Halo, semoga kabarnya baik. Bila Anda masih membutuhkan kendaraan untuk perjalanan, silakan kabari kami. Kami siap membantu.'}
];
const read=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{}')}catch(_){return{}}};
const write=v=>{try{localStorage.setItem(KEY,JSON.stringify(v))}catch(_){}};
const sid=()=>{try{return localStorage.getItem(SESSION)||window.TRANSMIND_VISITOR_SESSION_ID||''}catch(_){return window.TRANSMIND_VISITOR_SESSION_ID||''}};
const emit=(type,detail)=>{const p=Object.assign({event_type:type,session_id:sid(),path:location.pathname,occurred_at:new Date().toISOString(),care_version:VERSION},detail||{});window.dispatchEvent(new CustomEvent('transmind:customer-care',{detail:p}));try{const a=JSON.parse(localStorage.getItem('transmind_ai_demand_v3')||'[]');a.push(p);localStorage.setItem('transmind_ai_demand_v3',JSON.stringify(a.slice(-500)))}catch(_){}return p};
function setState(patch){const s=Object.assign({},read(),patch,{updated_at:new Date().toISOString()});write(s);return s}
function schedule(stage,lead,reason){const i=Math.max(0,Math.min(STAGES.length-1,Number(stage)||0)),cfg=STAGES[i];return setState({follow_up:{stage:i,name:cfg.name,scheduled_at:new Date(Date.now()+cfg.delay).toISOString(),lead:lead||read().follow_up?.lead||null,status:'queued',reason:reason||'lead_nurture'}})}
function handoff(detail){const h=Object.assign({status:'waiting_admin',started_at:new Date().toISOString(),deadline:new Date(Date.now()+15*60e3).toISOString(),priority:'high'},detail||{});setState({last_handoff:h});emit('human_handoff_requested',h);return h}
function recordOutcome(outcome,detail){const o=Object.assign({outcome,at:new Date().toISOString()},detail||{});setState({last_outcome:o});emit('customer_outcome',o);if(outcome==='no_booking')schedule(1,detail?.lead,'no_booking_reengagement');if(outcome==='booked')setState({follow_up:{status:'booked',stage:-1,scheduled_at:null}});return o}
function remember(memory){if(!memory)return;const s=read(),items=Array.isArray(s.memory)?s.memory:[];items.push(Object.assign({at:new Date().toISOString()},memory));setState({memory:items.slice(-80)});emit('customer_memory_captured',memory)}
function booking(type,detail){if(type==='booking_success')return recordOutcome('booked',detail);if(type==='booking_start')return emit(type,detail);return recordOutcome(type,detail)}
function bindWhatsApp(){document.querySelectorAll('a[href*="wa.me/"],a[href*="api.whatsapp.com"]').forEach(a=>{if(a.dataset.tmCareV3)return;a.dataset.tmCareV3='1';a.addEventListener('click',()=>{const href=a.getAttribute('href')||'';const phone=WA.find(n=>href.includes(n))||WA[0];emit('whatsapp_handoff',{channel:'whatsapp',phone,href,source:'website',intent:'customer_contact_admin'});handoff({channel:'whatsapp',phone,source:'website',intent:'customer_contact_admin'});},{passive:true})})}
function card(){const panel=document.getElementById('transmind-ai-panel');if(!panel||document.getElementById('tm-care-card-v3'))return;const c=document.createElement('div');c.id='tm-care-card-v3';c.style.cssText='margin:0 12px 10px;padding:12px;border:1px solid rgba(215,181,109,.28);border-radius:13px;background:linear-gradient(145deg,#141414,#0e0e0e);display:none;font-size:12px;line-height:1.55';c.innerHTML='<strong style="color:#e8cf9b">TransMind tetap mendampingi</strong><div id="tm-care-status-v3" style="opacity:.8;margin-top:4px"></div>';const f=document.getElementById('tm-ai-form');if(f)panel.insertBefore(c,f)}
function updateCard(){card();const c=document.getElementById('tm-care-card-v3'),t=document.getElementById('tm-care-status-v3');if(!c||!t)return;const s=read(),h=s.last_handoff;if(!h||h.status!=='waiting_admin'){c.style.display='none';return}t.textContent='Saya sudah mencatat kebutuhan Anda. Jika perlu keputusan khusus, admin TransMind akan mengambil alih dengan konteks percakapan yang sudah disiapkan.';c.style.display='block'}
function install(){bindWhatsApp();card();new MutationObserver(bindWhatsApp).observe(document.body,{childList:true,subtree:true});window.addEventListener('transmind:booking-success',e=>booking('booking_success',e.detail||{}));window.addEventListener('transmind:booking-start',e=>booking('booking_start',e.detail||{}));window.addEventListener('transmind:customer-outcome',e=>recordOutcome(e.detail?.outcome||'unknown',e.detail||{}));window.TRANSMIND_CUSTOMER_CARE={version:VERSION,getState:read,setState,recordHandoff:handoff,scheduleFollowup:schedule,recordBooking:booking,recordOutcome,remember,stages:STAGES,whatsappNumbers:WA};updateCard();setInterval(updateCard,15000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();