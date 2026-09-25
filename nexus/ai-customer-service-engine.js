/* TransMind Nexus — AI Customer Service / Booking 50-Day Command Center
 * Production-safe: reads real first-party booking + demand + customer-care signals.
 * Does not manufacture bookings, send unsolicited WhatsApp, or expose secrets.
 */
(function(){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>Number(v||0);
const db=()=>window.NXSB||window.getTransmindSupabaseClient?.()||window.transmindSupabase||null;
const today=new Date().toISOString().slice(0,10);
const css=`<style id="tm-ai-cs-style">
.tmcs{margin-top:14px}.tmcs-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}
.tmcs-card{background:linear-gradient(145deg,#171a21,#101319);border:1px solid #292f39;border-radius:15px;padding:16px}
.tmcs-card h3{margin:0 0 9px;font-size:14px}.tmcs-big{font-size:27px;font-weight:900;margin:5px 0}
.tmcs-note{font-size:11px;color:#8e949f;line-height:1.5}.tmcs-bar{height:9px;background:#0a0d12;border-radius:99px;overflow:hidden;margin:10px 0}
.tmcs-fill{height:100%;background:linear-gradient(90deg,#d2ad32,#65d49a);width:0}
.tmcs-list{display:grid;gap:8px}.tmcs-row{display:grid;grid-template-columns:1.05fr .55fr 1.7fr;gap:10px;padding:10px 0;border-bottom:1px solid #252a31;font-size:11px;align-items:center}
.tmcs-chip{display:inline-block;width:max-content;border:1px solid #343943;border-radius:999px;padding:4px 8px;font-size:9px}
.tmcs-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:11px}.tmcs-actions button{border:1px solid #343943;background:#0d1015;color:#e7e8eb;border-radius:9px;padding:9px 11px;font-size:11px;cursor:pointer}
.tmcs-actions .primary{background:#d2ad32;color:#111;border-color:#d2ad32;font-weight:800}.tmcs-hot{border-color:#624d18;background:linear-gradient(145deg,#211b0d,#111319)}
.tmcs-table{overflow:auto}.tmcs-tr{display:grid;grid-template-columns:1.15fr .8fr .8fr 1fr 1.1fr;gap:8px;min-width:820px;padding:10px 5px;border-bottom:1px solid #252a31;align-items:center;font-size:11px}
.tmcs-th{font-size:9px;color:#8e949f;text-transform:uppercase;letter-spacing:.7px}
.tmcs-wa{border:1px solid #355d4a!important;color:#b8f0d1!important;background:#0d1712!important}
@media(max-width:900px){.tmcs-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:650px){.tmcs-grid{grid-template-columns:1fr}.tmcs-row{min-width:620px}.tmcs-card{overflow:auto}}
</style>`;

async function safe(promise,fallback){try{const r=await promise;if(r?.error)throw r.error;return r?.data??fallback}catch(_){return fallback}}
function wa(phone,message){const p=String(phone||'').replace(/\D/g,'');return 'https://wa.me/'+(p||'628816654141')+'?text='+encodeURIComponent(message||'Halo, saya dari TransMind.');}
function stageLabel(s){return ({'30m':'30 menit','1d':'1 hari','3d':'3 hari','7d':'7 hari'}[s]||s||'—')}
function humanReason(x){return x?.human_reason||x?.reason||'Keputusan admin diperlukan.'}

async function render(){
 const host=document.getElementById('seoBody')||document.querySelector('#content-ai-customer-service');
 if(!host)return;
 host.innerHTML=css+'<div class="tmcs"><div class="tmcs-card tmcs-hot"><h3>🤝 AI Customer Service — Booking 50 / Hari</h3><div class="tmcs-note">Fokus mesin: mengubah demand nyata menjadi percakapan yang selesai, follow-up yang relevan, handoff admin yang tepat, dan booking yang benar-benar tercatat.</div></div><div id="tmcs-body"></div></div>';
 const body=document.getElementById('tmcs-body'),client=db();
 if(!client){body.innerHTML='<div class="tmcs-card" style="margin-top:12px"><div class="tmcs-note">NEXUS belum terhubung ke backend.</div></div>';return;}

 const [live,funnel,daily,bookings,leads,queue,tasks]=await Promise.all([
  safe(client.rpc('nexus_seo_live_metrics',{p_days:1}),{}),
  safe(client.rpc('nexus_seo_funnel_metrics',{p_days:1}),{}),
  safe(client.from('nexus_business_daily').select('*').eq('report_date',today).limit(1),[]),
  safe(client.from('nexus_console_booking_360').select('booking_code,status,start_date,end_date,customer_master_name,customer_name,customer_phone').order('start_date',{ascending:false}).limit(500),[]),
  safe(client.from('customer_care_leads').select('*').eq('status','open').order('next_followup_at',{ascending:true}).limit(100),[]),
  safe(client.from('customer_care_followup_queue').select('*').eq('status','queued').order('scheduled_at',{ascending:true}).limit(100),[]),
  safe(client.from('crm_tasks').select('*').eq('status','open').order('next_followup_at',{ascending:true}).limit(100),[])
 ]);
 const L=Array.isArray(live)?(live[0]||{}):live;
 const F=Array.isArray(funnel)?(funnel[0]||{}):funnel;
 const D=Array.isArray(daily)?(daily[0]||{}):daily;
 const B=Array.isArray(bookings)?bookings:[];
 const openLeads=Array.isArray(leads)?leads:[];
 const pending=Array.isArray(queue)?queue:[];
 const openTasks=Array.isArray(tasks)?tasks:[];
 const actualBookings=num(D.bookings ?? F.bookings ?? L.bookings);
 const confirmed=num(D.confirmed ?? F.confirmed);
 const completed=num(D.completed ?? F.completed);
 const cta=num(F.booking_cta_clicks ?? F.booking_cta ?? L.booking_cta_clicks);
 const waClicks=num(F.whatsapp_clicks ?? L.whatsapp_clicks);
 const visitors=num(F.visitors ?? L.visitors ?? L.unique_visitors);
 const target=50,gap=Math.max(0,target-actualBookings),conversion=cta?actualBookings/cta*100:0;
 const hot=openLeads.filter(x=>x.human_required).length;
 const due=pending.filter(x=>new Date(x.scheduled_at||0)<=new Date()).length;
 const bookingRows=B.filter(x=>String(x.start_date||'').slice(0,10)===today && !['CANCELLED','REFUND'].includes(String(x.status||'').toUpperCase()));
 const realBookingFallback=actualBookings||bookingRows.length;

 const queueRows=openLeads.slice(0,12).map(x=>{
   const msg='Halo '+(x.name||'kak')+', saya dari TransMind. Saya ingin membantu melanjutkan kebutuhan rental yang kemarin dibahas. Kalau masih dibutuhkan, saya siap bantu cek kembali detailnya.';
   return '<div class="tmcs-tr"><span><b>'+esc(x.name||'Calon pelanggan')+'</b><br><small class="tmcs-note">'+esc(x.phone||'')+'</small></span><span class="tmcs-chip">'+esc(x.stage||'qualified_lead')+'</span><span>'+esc(x.intent||'rental')+'</span><span>'+esc(x.next_followup_at?new Date(x.next_followup_at).toLocaleString('id-ID'):'—')+'</span><span><a class="tmcs-wa" style="display:inline-block;padding:7px 9px;border-radius:8px;text-decoration:none" target="_blank" rel="noopener" href="'+wa(x.phone,msg)+'">WhatsApp admin</a></span></div>';
 }).join('')||'<div class="tmcs-note" style="padding:15px 5px">Belum ada calon pelanggan terbuka pada queue backend.</div>';

 const humanRows=openLeads.filter(x=>x.human_required).slice(0,8).map(x=>'<div class="tmcs-row"><b>'+esc(x.name||'Calon pelanggan')+'</b><span class="tmcs-chip">ADMIN</span><span>'+esc(humanReason(x))+'</span></div>').join('')||'<div class="tmcs-note">Tidak ada handoff admin yang menunggu.</div>';

 body.innerHTML=
 '<div class="tmcs-grid" style="margin-top:12px">'+[
  ['Booking hari ini',realBookingFallback,'booking nyata'],
  ['Target harian',target,'sasaran operasional'],
  ['Gap',gap,'tambahan booking menuju target'],
  ['CTA → Booking',conversion.toFixed(1)+'%','berdasarkan booking tercatat / CTA']
 ].map(x=>'<div class="tmcs-card"><div class="tmcs-note">'+esc(x[0])+'</div><div class="tmcs-big">'+esc(x[1])+'</div><div class="tmcs-note">'+esc(x[2])+'</div></div>').join('')+'</div>'+
 '<div class="tmcs-card" style="margin-top:12px"><h3>🎯 Conversion Mission</h3><div class="tmcs-note">Visitor '+visitors+' · WhatsApp '+waClicks+' · Booking CTA '+cta+' · Booking nyata '+realBookingFallback+'. Mesin mengejar kebocoran funnel, bukan menaikkan angka secara artifisial.</div><div class="tmcs-bar"><div class="tmcs-fill" style="width:'+Math.min(100,realBookingFallback/target*100)+'%"></div></div><div class="tmcs-note">'+realBookingFallback+' / '+target+' booking hari ini · '+gap+' lagi untuk mencapai target.</div></div>'+
 '<div class="tmcs-card" style="margin-top:12px"><h3>🚨 Admin Opportunity Radar</h3><div class="tmcs-list">'+
 '<div class="tmcs-row"><b>Calon pelanggan terbuka</b><span class="tmcs-chip">'+openLeads.length+'</span><span>Jangan biarkan CTA/AI conversation berhenti tanpa next action.</span></div>'+
 '<div class="tmcs-row"><b>Handoff manusia</b><span class="tmcs-chip">'+hot+'</span><span>Harga khusus, refund, perubahan booking, kontrak, legal, ketersediaan pasti dan keputusan lain harus kembali ke admin.</span></div>'+
 '<div class="tmcs-row"><b>Follow-up jatuh tempo</b><span class="tmcs-chip">'+due+'</span><span>Queue siap diproses; pengiriman WhatsApp tetap melalui provider/admin yang berwenang.</span></div>'+
 '<div class="tmcs-row"><b>Task admin terbuka</b><span class="tmcs-chip">'+openTasks.length+'</span><span>CRM task menjadi pengingat peluang yang membutuhkan manusia.</span></div>'+
 '</div></div>'+
 '<div class="tmcs-card" style="margin-top:12px"><h3>👥 Follow-up Calon Pelanggan</h3><div class="tmcs-note">AI mempertahankan konteks dan urutan follow-up 30m → 1h → 3h → 7h bila consent tersedia. Jika sudah booking, follow-up harus berhenti.</div><div class="tmcs-table" style="margin-top:10px"><div class="tmcs-tr tmcs-th"><span>CALON PELANGGAN</span><span>STAGE</span><span>INTENT</span><span>NEXT</span><span>ACTION</span></div>'+queueRows+'</div></div>'+
 '<div class="tmcs-card" style="margin-top:12px"><h3>🧑‍💼 Handoff ke Admin</h3><div class="tmcs-list">'+humanRows+'</div></div>'+
 '<div class="tmcs-card" style="margin-top:12px"><h3>📈 Learning Loop</h3><div class="tmcs-note">Setiap lead/percakapan/booking menjadi sinyal untuk memperbaiki respons, timing follow-up, kebutuhan informasi, dan prioritas admin. Memori customer hanya dipakai ketika customer memberikan consent dan dapat dihentikan.</div><div class="tmcs-actions"><button class="primary" id="tmcs-refresh">Refresh command center</button><button id="tmcs-copy">Copy admin priority queue</button></div></div>';

 document.getElementById('tmcs-refresh')?.addEventListener('click',render);
 document.getElementById('tmcs-copy')?.addEventListener('click',async()=>{
   const q=[
    'BOOKING 50/HARI — '+realBookingFallback+'/'+target+' — GAP '+gap,
    'OPEN LEADS: '+openLeads.length,
    'HANDOFF ADMIN: '+hot,
    'FOLLOW-UP DUE: '+due,
    ...openLeads.slice(0,10).map((x,i)=>(i+1)+'. '+(x.name||'Lead')+' | '+(x.phone||'')+' | '+(x.intent||'rental')+' | next '+(x.next_followup_at||'—'))
   ].join('\n');
   try{await navigator.clipboard.writeText(q);alert('Priority queue admin disalin.')}catch(_){alert(q)}
 });
}
window.TRANSMIND_AI_CUSTOMER_SERVICE_CONSOLE={render};
})();