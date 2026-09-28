/* TransMind Nexus — Booking 50/day Command Center v1
 * Converts real ledger + first-party funnel signals into an actionable daily operating loop.
 * No synthetic traffic, fake bookings, ranking manipulation, or unsolicited messaging.
 */
(function(){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const db=()=>window.NXSB||window.getTransmindSupabaseClient?.()||window.transmindSupabase||null;
const badStatus=new Set(['dibatalkan','cancelled','canceled','rejected','refund','refunded']);
const validBooking=x=>!badStatus.has(String(x?.status||'').trim().toLowerCase());
function jakartaStart(){const p=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Jakarta',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const o=Object.fromEntries(p.map(x=>[x.type,x.value]));return new Date(Date.UTC(+o.year,+o.month-1,+o.day)-7*3600000);}
function pct(a,b){return b?((a/b)*100).toFixed(1)+'%':'0.0%';}
async function q(p,f=[]){try{const r=await p;if(r?.error)throw r.error;return r?.data??f}catch(_){return f}}
async function render(){
 const host=document.getElementById('seoBody'),d=db();if(!host||!d||document.getElementById('tm-booking50'))return;
 const start=jakartaStart(),end=new Date(start.getTime()+86400000),since30=new Date(start.getTime()-29*86400000);
 const [events,bookings,leads,queue,tasks,comms]=await Promise.all([
  q(d.from('website_analytics_events').select('event_type,visitor_session_id,booking_id,booking_code,occurred_at,path,metadata').gte('occurred_at',since30.toISOString()).limit(10000)),
  q(d.from('bookings').select('id,booking_code,status,created_at,total_price,customer_id').gte('created_at',since30.toISOString()).limit(3000)),
  q(d.from('customer_care_leads').select('id,name,phone,status,stage,intent,quote_value,human_required,next_followup_at,last_activity_at,created_at').in('status',['open','paused','lost']).order('next_followup_at',{ascending:true}).limit(100)),
  q(d.from('customer_care_followup_queue').select('id,lead_id,stage,status,scheduled_at,requires_human,message_body').in('status',['queued','admin_ready']).order('scheduled_at',{ascending:true}).limit(100)),
  q(d.from('crm_tasks').select('id,status,priority,title,next_followup_at,task_type,metadata').in('status',['open','OPEN','IN_PROGRESS']).order('next_followup_at',{ascending:true}).limit(100)),
  q(d.from('nexus_communications').select('id,status,provider,event_type,created_at,recipient').order('created_at',{ascending:false}).limit(100))
 ]);
 const todayEvents=events.filter(x=>{const t=Date.parse(x.occurred_at||'');return t>=start.getTime()&&t<end.getTime()});
 const todayBookings=bookings.filter(x=>{const t=Date.parse(x.created_at||'');return t>=start.getTime()&&t<end.getTime()&&validBooking(x)});
 const count=t=>todayEvents.filter(x=>x.event_type===t).length;
 const visitors=new Set(todayEvents.map(x=>x.visitor_session_id).filter(Boolean)).size;
 const cta=count('booking_cta_click'),starts=count('booking_start'),wa=count('whatsapp_click'),bookingEvents=count('booking_success')+count('booking_created');
 const actual=Math.max(todayBookings.length,bookingEvents),gap=Math.max(0,50-actual);
 const openLeads=leads.filter(x=>x.status==='open'||x.status==='paused');
 const due=queue.filter(x=>x.status==='admin_ready'||Date.parse(x.scheduled_at||0)<=Date.now());
 const human=openLeads.filter(x=>x.human_required).length;
 const telemetryHealthy=todayEvents.length>0;
 const outboundConfigured=comms.some(x=>!String(x.provider||'').includes('pending_whatsapp_provider')&&['sent','delivered','read'].includes(String(x.status||'').toLowerCase()));
 const bottleneck=starts>0&&actual===0?'Checkout → booking':cta>0&&starts===0?'CTA → form start':wa>0&&actual===0?'WhatsApp → booking':visitors===0?'Demand/traffic':'Conversion rate';
 const actions=[];
 if(visitors===0)actions.push(['Traffic','Tidak ada visitor terukur pada hari kalender Jakarta. Jalankan distribusi konten/local demand hari ini.']);
 if(cta>0&&starts===0)actions.push(['CTA leak',cta+' CTA tetapi 0 booking_start. Uji jalur CTA ke form dan pastikan setiap CTA membuka alur booking.']);
 if(starts>0&&actual===0)actions.push(['Checkout rescue',starts+' booking_start tanpa booking nyata. Prioritaskan AI rescue + admin callback.']);
 if(wa>0&&actual===0)actions.push(['WhatsApp rescue',wa+' handoff WhatsApp tanpa booking tercatat. Admin harus menerima antrean dengan konteks lead.']);
 if(openLeads.length)actions.push(['Lead queue',openLeads.length+' peluang aktif; '+due.length+' sudah jatuh tempo.']);
 if(!actions.length)actions.push(['Scale','Pertahankan jalur yang menghasilkan booking dan tambah demand secara bertahap.']);
 const style=`<style id="tm-booking50-style">#tm-booking50{margin-top:14px}.b50-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.b50-card{background:linear-gradient(145deg,#171a21,#101319);border:1px solid #292f39;border-radius:15px;padding:16px}.b50-k{font-size:26px;font-weight:900;margin-top:5px}.b50-note{font-size:11px;color:#8e949f;line-height:1.5}.b50-bar{height:9px;background:#0a0d12;border-radius:99px;overflow:hidden;margin:10px 0}.b50-bar i{display:block;height:100%;background:linear-gradient(90deg,#d2ad32,#65d49a);width:${Math.min(100,actual/50*100)}%}.b50-row{display:grid;grid-template-columns:150px 1fr;gap:12px;padding:10px 0;border-bottom:1px solid #252a31}.b50-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:11px}.b50-btn{display:inline-block;border:1px solid #343943;background:#0d1015;color:#e7e8eb;border-radius:9px;padding:9px 12px;text-decoration:none;cursor:pointer}.b50-primary{background:#d2ad32;color:#111;border-color:#d2ad32;font-weight:850}.b50-ok{color:#65d49a}.b50-warn{color:#e5c15a}.b50-bad{color:#e87878}@media(max-width:900px){.b50-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:600px){.b50-grid{grid-template-columns:1fr}.b50-row{grid-template-columns:1fr}}</style>`;
 const health=telemetryHealthy?'SIGNAL TERBACA':'TIDAK ADA SIGNAL HARI INI',healthCls=telemetryHealthy?'b50-ok':'b50-bad';
 const html=style+`<div id="tm-booking50"><div class="b50-card"><b>🎯 BOOKING 50 / HARI — DAILY OPERATING COMMAND</b><div class="b50-note" style="margin-top:5px">Perhitungan hari kalender menggunakan WIB/Jakarta. Booking hanya dihitung dari transaksi nyata atau event sukses yang terikat transaksi; tidak ada angka buatan.</div><div class="b50-bar"><i></i></div><div class="b50-note"><b>${actual}</b> booking hari ini · <b>${gap}</b> gap menuju target · ${pct(actual,50)} tercapai</div></div><div class="b50-grid" style="margin-top:12px">${[['Visitor',visitors,'first-party session'],['Booking CTA',cta,pct(cta,visitors)+' dari visitor'],['Booking Start',starts,pct(starts,cta)+' dari CTA'],['Booking Nyata',actual,pct(actual,visitors)+' dari visitor']].map((x,i)=>`<div class="b50-card"><div class="b50-note">${x[0]}</div><div class="b50-k ${i===3?(actual?'b50-ok':'b50-bad'):''}">${x[1]}</div><div class="b50-note">${x[2]}</div></div>`).join('')}</div><div class="b50-grid" style="margin-top:12px">${[['WhatsApp',wa],['Lead aktif',openLeads.length],['Follow-up jatuh tempo',due.length],['Human handoff',human]].map(x=>`<div class="b50-card"><div class="b50-note">${x[0]}</div><div class="b50-k">${x[1]}</div><div class="b50-note">real-time queue</div></div>`).join('')}</div><div class="b50-card" style="margin-top:12px"><b>Telemetry health</b><div class="b50-row"><span class="b50-note">Hari ini WIB</span><span class="${healthCls}"><b>${health}</b> · ${todayEvents.length} event tercatat</span></div><div class="b50-row"><span class="b50-note">Bottleneck</span><span><b>${esc(bottleneck)}</b></span></div><div class="b50-row"><span class="b50-note">Outbound WhatsApp</span><span class="${outboundConfigured?'b50-ok':'b50-warn'}">${outboundConfigured?'PROVIDER TERDETEKSI':'QUEUE/ADMIN MODE — provider WhatsApp outbound belum terhubung'}</span></div></div><div class="b50-card" style="margin-top:12px"><b>AI Customer Service — next actions</b>${actions.slice(0,6).map(a=>`<div class="b50-row"><span><b>${esc(a[0])}</b></span><span>${esc(a[1])}</span></div>`).join('')}<div class="b50-actions"><a class="b50-btn b50-primary" href="/nexus/?page=ai-customer-service">Buka AI Customer Service</a><a class="b50-btn" href="/nexus/crm/">Buka CRM Command Center</a><button class="b50-btn" id="tm-b50-refresh">↻ Refresh</button></div></div></div>`;
 host.insertAdjacentHTML('beforeend',html);document.getElementById('tm-b50-refresh')?.addEventListener('click',()=>{document.getElementById('tm-booking50')?.remove();render()});
}
window.TRANSMIND_BOOKING_50={render};
const boot=()=>{if(document.getElementById('seoBody')&&db())render();else setTimeout(boot,700)};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
document.addEventListener('tm-seo-refresh',()=>setTimeout(()=>{document.getElementById('tm-booking50')?.remove();render()},100));
})();