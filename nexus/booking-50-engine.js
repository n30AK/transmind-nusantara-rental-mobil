/* TransMind Nexus — Booking 50/Day Conversion Cockpit v1
 * Uses only observed first-party events and the existing funnel RPC.
 * It does not fabricate bookings or traffic.
 */
(function(){
'use strict';
const cut=d=>new Date(Date.now()-d*86400000).toISOString();
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const client=()=>window.getTransmindSupabaseClient?window.getTransmindSupabaseClient():null;
async function render(){
 const host=document.getElementById('seoBody');if(!host||host.dataset.b50==='1')return;host.dataset.b50='1';
 const db=client();if(!db)return;
 try{
  const [ev,fun]=await Promise.all([
   db.from('website_analytics_events').select('event_type,occurred_at,metadata,source').gte('occurred_at',cut(30)).order('occurred_at',{ascending:false}).limit(5000),
   db.rpc('nexus_seo_funnel_metrics',{p_days:30})
  ]);
  if(ev.error)throw ev.error;if(fun.error)throw fun.error;
  const rows=ev.data||[],f=fun.data||{};
  const todayKey=new Date().toISOString().slice(0,10);
  const today=rows.filter(r=>String(r.occurred_at||'').slice(0,10)===todayKey);
  const count=(arr,...types)=>arr.filter(r=>types.includes(String(r.event_type||'').toLowerCase())).length;
  const visitors=count(today,'page_view','visit','session_start','visitor');
  const wa=count(today,'whatsapp_click','whatsapp_handoff');
  const cta=count(today,'booking_cta_click','booking_start','booking_click','booking_cta');
  const success=count(today,'booking_success','booking_confirmed');
  const funnelBookings=Number(f.bookings||0);
  const bookings=Math.max(success,funnelBookings);
  const target=50,remaining=Math.max(0,target-bookings);
  const conv=cta?bookings/cta:null;
  const needed=conv&&conv>0?Math.ceil(remaining/conv):null;
  const health=bookings>=target?'TARGET_REACHED':bookings>0?'CONVERSION_OBSERVED':'BOOKING_SIGNAL_MISSING';
  host.insertAdjacentHTML('beforeend',`<style id="tm-b50-css">.b50{margin-top:14px}.b50g{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.b50c{background:linear-gradient(145deg,#171a21,#101319);border:1px solid #292f39;border-radius:15px;padding:16px}.b50l{font-size:10px;color:#8e949f;text-transform:uppercase;letter-spacing:.8px}.b50v{font-size:28px;font-weight:900;margin:7px 0}.b50n{font-size:11px;color:#8e949f;line-height:1.5}.b50q{margin-top:12px;padding:14px;border:1px solid #40371f;background:#17140b;border-radius:13px}.b50tag{display:inline-block;border:1px solid #5c4b1e;color:#e8cf9b;border-radius:999px;padding:4px 8px;font-size:9px}.b50a{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.b50a button{border:1px solid #343943;background:#0d1015;color:#e7e8eb;border-radius:9px;padding:9px 11px;cursor:pointer}.b50a .primary{background:#d2ad32;color:#111;border-color:#d2ad32;font-weight:800}@media(max-width:800px){.b50g{grid-template-columns:1fr 1fr}}@media(max-width:520px){.b50g{grid-template-columns:1fr}}</style><div class="b50"><div class="b50c"><div class="b50l">Booking hari ini</div><div class="b50v">${bookings}</div><div class="b50n">Target harian: <b>${target}</b></div></div><div class="b50c"><div class="b50l">Sisa target</div><div class="b50v">${remaining}</div><div class="b50n">booking menuju 50/hari</div></div><div class="b50c"><div class="b50l">Booking CTA</div><div class="b50v">${cta}</div><div class="b50n">sinyal hari ini yang teramati</div></div><div class="b50c"><div class="b50l">WhatsApp</div><div class="b50v">${wa}</div><div class="b50n">handoff/klik teramati</div></div><div class="b50q"><span class="b50tag">${esc(health)}</span><h3 style="margin:9px 0 5px">🎯 Booking 50 / Hari — Conversion Cockpit</h3><div class="b50n">${bookings===0?'Belum ada booking sukses yang teramati hari ini. Jangan menaikkan traffic secara buta: audit dulu jalur CTA → form/WhatsApp → booking confirmed → atribusi.':needed?'Dengan conversion teramati '+(conv*100).toFixed(1)+'%, sistem membutuhkan sekitar '+needed+' CTA tambahan untuk mengejar sisa target '+remaining+'.':'Booking sudah teramati, tetapi conversion CTA→booking belum cukup stabil untuk menghitung kebutuhan CTA secara bertanggung jawab.'}</div><div class="b50a"><button class="primary" id="tm-b50-refresh">Refresh conversion</button><button id="tm-b50-copy">Copy recovery actions</button></div></div></div>`);
  document.getElementById('tm-b50-refresh')?.addEventListener('click',()=>{host.dataset.b50='';render()});
  document.getElementById('tm-b50-copy')?.addEventListener('click',async()=>{const txt='Booking 50/hari — actions: audit booking confirmation; pastikan booking_success tercatat; follow-up seluruh CTA; prioritaskan WhatsApp handoff; ukur CTA→booking; re-engage lead yang belum booking.';try{await navigator.clipboard.writeText(txt);alert('Recovery actions disalin.')}catch(_){alert(txt)}});
 }catch(e){host.insertAdjacentHTML('beforeend','<div class="notice bad b50">Conversion Cockpit gagal membaca data: '+esc(e.message)+'</div>')}
}
window.TRANSMIND_BOOKING_50={render};let n=0;const boot=()=>{if(document.getElementById('seoBody'))return render();if(++n<30)setTimeout(boot,500)};boot();
})();