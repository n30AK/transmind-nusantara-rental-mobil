/* TransMind Nexus — Booking 50/day Growth Engine */
(()=>{'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const db=()=>window.NXSB||window.getTransmindSupabaseClient?.()||window.transmindSupabase||null;
const since=d=>new Date(Date.now()-d*86400000).toISOString();
const count=(rows,t)=>rows.filter(x=>x.event_type===t).length;
async function render(){
 const el=document.getElementById('seoBody'),d=db();if(!el||!d||el.dataset.tmGrowth==='1')return;el.dataset.tmGrowth='1';
 try{
  const [ev,tasks]=await Promise.all([
   d.from('website_analytics_events').select('event_type,visitor_session_id,booking_id,booking_code,metadata,occurred_at').gte('occurred_at',since(1)).order('occurred_at',{ascending:false}).limit(5000),
   d.from('crm_tasks').select('id,title,status,priority,next_followup_at,metadata').in('status',['open','OPEN','IN_PROGRESS']).order('next_followup_at',{ascending:true}).limit(100)
  ]);
  if(ev.error)throw ev.error;if(tasks.error)throw tasks.error;
  const rows=ev.data||[],cta=count(rows,'booking_cta_click'),wa=count(rows,'whatsapp_click'),starts=count(rows,'booking_start');
  const success=rows.filter(x=>/^(booking_success|booking_created)$/.test(String(x.event_type||'')));
  const keys=new Set(success.map(x=>String(x.booking_id||x.booking_code||((x.visitor_session_id||'')+'|'+String(x.occurred_at||'').slice(0,16)))));
  const bookings=keys.size,target=50,gap=Math.max(0,target-bookings);
  const pct=(a,b)=>b?((a/b)*100).toFixed(1)+'%':'0.0%';
  const leak=starts>0&&bookings===0?'Checkout → booking':cta>0&&starts===0?'CTA → form start':wa>bookings?'WhatsApp → booking':'Demand → booking';
  const action=bookings>=target?'Pertahankan pola yang terbukti menghasilkan booking dan tingkatkan kapasitas secara bertahap.':'Prioritaskan kebocoran '+leak+'. Jangan menambah traffic sebelum jalur yang sudah menghasilkan niat dapat menyelesaikan booking.';
  const html='<style id="tm-growth-style">.tm-g{margin-top:14px}.tm-g-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.tm-g-card{background:linear-gradient(145deg,#171a21,#101319);border:1px solid #292f39;border-radius:15px;padding:16px}.tm-g-num{font-size:26px;font-weight:900;margin-top:5px}.tm-g-note{font-size:11px;color:#8e949f;line-height:1.5}.tm-g-hot{color:#e5c15a}.tm-g-danger{color:#e87878}@media(max-width:850px){.tm-g-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:520px){.tm-g-grid{grid-template-columns:1fr}}</style>'+
  '<div class="tm-g"><div class="tm-g-card"><div class="tm-g-note">BOOKING BERHASIL · 24 JAM</div><div class="tm-g-num '+(bookings?'':'tm-g-danger')+'">'+bookings+'</div><div class="tm-g-note">transaksi nyata</div></div>'+
  '<div class="tm-g-card"><div class="tm-g-note">TARGET</div><div class="tm-g-num tm-g-hot">50</div><div class="tm-g-note">booking / hari</div></div>'+
  '<div class="tm-g-card"><div class="tm-g-note">GAP TARGET</div><div class="tm-g-num tm-g-hot">'+gap+'</div><div class="tm-g-note">booking tambahan</div></div>'+
  '<div class="tm-g-card"><div class="tm-g-note">ADMIN QUEUE</div><div class="tm-g-num">'+(tasks.data||[]).length+'</div><div class="tm-g-note">peluang aktif</div></div>'+
  '<div class="tm-g-card" style="grid-column:1/-1"><b>Jalur konversi 24 jam</b><div class="tm-g-grid" style="margin-top:10px">'+
  '<div class="tm-g-card"><div class="tm-g-note">CTA → Start</div><div class="tm-g-num">'+pct(starts,cta)+'</div></div>'+
  '<div class="tm-g-card"><div class="tm-g-note">Start → Booking</div><div class="tm-g-num">'+pct(bookings,starts)+'</div></div>'+
  '<div class="tm-g-card"><div class="tm-g-note">WhatsApp → Booking</div><div class="tm-g-num">'+pct(bookings,wa)+'</div></div>'+
  '<div class="tm-g-card"><div class="tm-g-note">Prioritas saat ini</div><div class="tm-g-num" style="font-size:16px">'+esc(leak)+'</div></div></div>'+
  '<div class="tm-g-note" style="margin-top:12px">'+esc(action)+'</div></div></div>';
  el.insertAdjacentHTML('beforeend',html);
 }catch(e){el.insertAdjacentHTML('beforeend','<div class="notice bad tm-g">Booking Growth Engine: '+esc(e.message)+'</div>')}
}
window.TRANSMIND_BOOKING_GROWTH={render};
setTimeout(render,1500);
document.addEventListener('tm-seo-refresh',()=>setTimeout(render,150));
})();