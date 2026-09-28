/* TransMind Nexus — Booking 50/day Conversion Engine
 * First-party observed funnel only. No synthetic bookings or inferred revenue.
 */
(function(){
'use strict';
if(window.__TM_BOOKING_50_ENGINE)return;window.__TM_BOOKING_50_ENGINE=true;
const css='<style id="tm-booking-50-style">#seoBody .b50{margin-top:14px}.b50grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.b50c{background:linear-gradient(145deg,#171a21,#101319);border:1px solid #292f39;border-radius:15px;padding:16px}.b50c h3{margin:0 0 7px;font-size:13px}.b50num{font-size:27px;font-weight:900}.b50muted{color:#8e949f;font-size:10px;line-height:1.5}.b50bar{height:7px;border-radius:99px;background:#252a31;overflow:hidden;margin:10px 0}.b50fill{height:100%;background:#d2ad32;width:0}.b50rows{display:grid;gap:8px;margin-top:12px}.b50row{display:grid;grid-template-columns:1.2fr .7fr 1fr;gap:10px;padding:10px;border-bottom:1px solid #252a31;font-size:11px}.b50tag{display:inline-block;padding:4px 8px;border:1px solid #343943;border-radius:999px;font-size:9px}.b50actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.b50actions button{border:1px solid #343943;background:#0d1015;color:#e7e8eb;border-radius:9px;padding:9px 11px;font-size:11px}.b50actions .primary{background:#d2ad32;color:#111;border-color:#d2ad32;font-weight:800}@media(max-width:900px){.b50grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:600px){.b50grid{grid-template-columns:1fr}.b50row{min-width:560px}.b50c{overflow:auto}}</style>';
const client=()=>window.getTransmindSupabaseClient?window.getTransmindSupabaseClient():window.transmindSupabase||null;
const cut=d=>new Date(Date.now()-d*86400000).toISOString();
const esc=v=>String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const count=(rows,type)=>rows.filter(r=>String(r.event_type||'')===type).length;
function render(el,x,care){
 const target=50,book=x.booking_success,cta=x.booking_cta_click,start=x.booking_start,wa=x.whatsapp_click,rescue=x.booking_rescue_opportunity,failed=x.booking_failed;
 const conv=cta?book/cta*100:0,needed=target-book;
 el.insertAdjacentHTML('beforeend',css+'<section class="b50"><div class="f4g" style="display:none"></div><div class="b50grid">'+
 '<div class="b50c"><h3>Target harian</h3><div class="b50num">50</div><div class="b50muted">booking sukses / hari</div></div>'+
 '<div class="b50c"><h3>Booking sukses</h3><div class="b50num">'+book+'</div><div class="b50muted">event nyata 24 jam terakhir</div><div class="b50bar"><div class="b50fill" style="width:'+Math.min(100,book/target*100)+'%"></div></div></div>'+
 '<div class="b50c"><h3>Gap menuju target</h3><div class="b50num">'+Math.max(0,needed)+'</div><div class="b50muted">booking tambahan yang masih dibutuhkan</div></div>'+
 '<div class="b50c"><h3>CTA → booking</h3><div class="b50num">'+conv.toFixed(1)+'%</div><div class="b50muted">'+cta+' CTA · '+start+' mulai · '+book+' sukses</div></div>'+
 '</div>'+
 '<div class="b50c" style="margin-top:12px"><h3>Mesin penyelamatan konversi</h3><div class="b50rows">'+
 '<div class="b50row"><span>WhatsApp intent</span><strong>'+wa+'</strong><span class="b50tag">butuh follow-up</span></div>'+
 '<div class="b50row"><span>Booking rescue</span><strong>'+rescue+'</strong><span class="b50tag">form belum selesai</span></div>'+
 '<div class="b50row"><span>Booking gagal</span><strong>'+failed+'</strong><span class="b50tag">perlu dipulihkan</span></div>'+
 '</div><div class="b50actions"><button class="primary" id="b50-refresh">↻ Refresh funnel</button><button id="b50-copy">Copy daftar peluang</button></div></div>'+
 '<div class="b50c" style="margin-top:12px"><h3>Aturan operasi AI Customer Service</h3><div class="b50muted">AI membantu menjawab, mengingat konteks dengan persetujuan, menyelamatkan booking yang tertunda, membuat antrean follow-up dan menyerahkan keputusan khusus kepada admin. Pengiriman WhatsApp proaktif tetap membutuhkan provider WhatsApp Business resmi dan opt-in.</div></div></section>');
 document.getElementById('b50-refresh')?.addEventListener('click',()=>{el.dataset.b50='';run()});
 document.getElementById('b50-copy')?.addEventListener('click',async()=>{const text='Booking 24h: '+book+' / target 50\\nCTA: '+cta+'\\nBooking start: '+start+'\\nWhatsApp: '+wa+'\\nRescue: '+rescue+'\\nBooking gagal: '+failed+'\\nGap: '+Math.max(0,needed);try{await navigator.clipboard.writeText(text);this.textContent='Tersalin';}catch(_){}}); 
}
async function run(){
 const el=document.getElementById('seoBody'),db=client();if(!el||!db||el.dataset.b50==='1')return;el.dataset.b50='1';
 try{
  const r=await db.from('website_analytics_events').select('event_type,occurred_at,visitor_session_id').gte('occurred_at',cut(1)).order('occurred_at',{ascending:false}).limit(10000);
  if(r.error)throw r.error;const rows=r.data||[],x={};['booking_success','booking_cta_click','booking_start','whatsapp_click','booking_rescue_opportunity','booking_failed'].forEach(t=>x[t]=count(rows,t));
  render(el,x,null);
 }catch(e){el.insertAdjacentHTML('beforeend',css+'<section class="b50"><div class="b50c"><h3>Booking 50/hari</h3><div class="b50muted">Data funnel belum dapat dibaca saat ini. Refresh setelah koneksi Nexus tersedia.</div></div></section>');}
}
window.TRANSMIND_BOOKING_50={render:run};window.addEventListener('nexus:authenticated',()=>setTimeout(run,350));
})();