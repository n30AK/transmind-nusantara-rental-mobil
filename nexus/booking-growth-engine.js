/* TransMind Nexus — Booking 50/day Growth Engine v3
 * Funnel truth: unique visitor/session → CTA → booking start → real booking.
 * Booking truth comes from bookings ledger; analytics are telemetry only.
 */
(()=>{'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const db=()=>window.NXSB||window.getTransmindSupabaseClient?.()||window.transmindSupabase||null;
const since=d=>new Date(Date.now()-d*86400000).toISOString();
const bad=new Set(['dibatalkan','cancelled','canceled','refund','refunded']);
const valid=x=>!bad.has(String(x?.status||'').trim().toLowerCase());
const count=(rows,t)=>rows.filter(x=>x.event_type===t).length;
const unique=(rows,t)=>new Set(rows.filter(x=>x.event_type===t).map(x=>x.visitor_session_id).filter(Boolean)).size;
async function render(){
 const el=document.getElementById('seoBody'),d=db();if(!el||!d||el.dataset.tmGrowthV3==='1')return;el.dataset.tmGrowthV3='1';
 try{
  const [ev,tasks,bookRows]=await Promise.all([
   d.from('website_analytics_events').select('event_type,visitor_session_id,booking_id,booking_code,metadata,occurred_at').gte('occurred_at',since(1)).order('occurred_at',{ascending:false}).limit(5000),
   d.from('crm_tasks').select('id,title,status,priority,next_followup_at,metadata').in('status',['open','OPEN','IN_PROGRESS']).order('next_followup_at',{ascending:true}).limit(100),
   d.from('bookings').select('id,booking_code,status,created_at,total_price').gte('created_at',since(1)).order('created_at',{ascending:false}).limit(1000)
  ]);
  if(ev.error)throw ev.error;if(tasks.error)throw tasks.error;
  const rows=ev.data||[],authoritative=(bookRows.data||[]).filter(valid);
  const visitors=new Set(rows.map(x=>x.visitor_session_id).filter(Boolean)).size;
  const ctaEvents=count(rows,'booking_cta_click'),ctaVisitors=unique(rows,'booking_cta_click');
  const starts=count(rows,'booking_start'),startVisitors=unique(rows,'booking_start');
  const waEvents=count(rows,'whatsapp_click'),waVisitors=unique(rows,'whatsapp_click');
  const bookings=authoritative.length;
  const gap=Math.max(0,50-bookings);
  const pct=(a,b)=>b?((a/b)*100).toFixed(1)+'%':'0.0%';
  let leak='Demand → CTA';
  if(ctaVisitors>0&&startVisitors===0)leak='CTA → booking form';
  else if(startVisitors>0&&bookings===0)leak='Booking form → successful booking';
  else if(waVisitors>0&&bookings===0)leak='WhatsApp → booking';
  else if(bookings>0)leak='Scale traffic';
  const html='<style id="tm-growth-v3-style">.tm-g3{margin-top:14px}.tm-g3-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.tm-g3-card{background:linear-gradient(145deg,#171a21,#101319);border:1px solid #292f39;border-radius:15px;padding:16px}.tm-g3-num{font-size:25px;font-weight:900;margin:6px 0}.tm-g3-note{font-size:11px;color:#8e949f;line-height:1.5}.tm-g3-hot{color:#e5c15a}.tm-g3-bad{color:#e87878}.tm-g3-ok{color:#65d49a}.tm-g3-row{display:grid;grid-template-columns:1.1fr .8fr 1fr 1fr;gap:10px;padding:10px 0;border-bottom:1px solid #252a31;font-size:11px}@media(max-width:850px){.tm-g3-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:520px){.tm-g3-grid{grid-template-columns:1fr}.tm-g3-row{grid-template-columns:1fr 1fr}}</style>'+
  '<div class="tm-g3"><div class="tm-g3-card"><b>🎯 BOOKING 50 / HARI</b><div class="tm-g3-note" style="margin-top:5px">Booking hanya dihitung dari ledger transaksi nyata. CTA berulang dari orang yang sama tidak dihitung sebagai calon pelanggan baru.</div><div class="tm-g3-grid" style="margin-top:12px">'+
  [['Visitor unik',visitors,'session'],['CTA unik',ctaVisitors,ctaEvents+' event'],['Booking start unik',startVisitors,starts+' event'],['Booking nyata',bookings,'ledger']].map((x,i)=>'<div class="tm-g3-card"><div class="tm-g3-note">'+x[0]+'</div><div class="tm-g3-num '+(i===3?(bookings?'tm-g3-ok':'tm-g3-bad'):'')+'">'+x[1]+'</div><div class="tm-g3-note">'+x[2]+'</div></div>').join('')+'</div></div>'+
  '<div class="tm-g3-grid" style="margin-top:12px">'+
  [['CTA → Start',pct(startVisitors,ctaVisitors),'unique visitors'],['Start → Booking',pct(bookings,startVisitors),'real ledger'],['WhatsApp unik',waVisitors,waEvents+' event'],['Gap target',gap,'booking tambahan']].map(x=>'<div class="tm-g3-card"><div class="tm-g3-note">'+x[0]+'</div><div class="tm-g3-num">'+x[1]+'</div><div class="tm-g3-note">'+x[2]+'</div></div>').join('')+'</div>'+
  '<div class="tm-g3-card" style="margin-top:12px"><b>🔎 Bottleneck nyata</b><div class="tm-g3-num tm-g3-hot">'+esc(leak)+'</div><div class="tm-g3-note">Jangan mengejar angka visitor saja. Jika CTA sudah ada tetapi booking start atau transaksi tidak terjadi, perbaikan harus diarahkan ke tahap tersebut.</div></div>'+
  '<div class="tm-g3-card" style="margin-top:12px"><b>👥 Admin opportunity queue</b><div class="tm-g3-row"><span>Task aktif</span><b>'+((tasks.data||[]).length)+'</b><span>Follow-up</span><span>Gunakan CRM untuk peluang yang membutuhkan manusia.</span></div></div></div>';
  el.insertAdjacentHTML('beforeend',html);
 }catch(e){el.insertAdjacentHTML('beforeend','<div class="notice bad tm-g3">Booking Growth Engine: '+esc(e.message)+'</div>')}
}
window.TRANSMIND_BOOKING_GROWTH={render};
setTimeout(render,1500);
document.addEventListener('tm-seo-refresh',()=>setTimeout(render,150));
})();