/* TransMind Nexus — F6 Semantic Entity Graph + AI Answer Optimization
 * Aggressive-but-safe growth layer: entity clarity, answer-ready opportunities,
 * internal semantic relationships and first-party evidence only.
 * Never fabricates rankings, reviews, traffic or AI visibility.
 */
(()=>{'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const db=()=>window.NXSB||window.getTransmindSupabaseClient?.()||window.transmindSupabase||null;
const since=d=>new Date(Date.now()-d*86400000).toISOString();
const areas=['Jakarta','Bekasi','Bogor','Depok','Tangerang'];
const intents=[['rental','Rental mobil umum'],['pricing','Harga rental mobil'],['driver','Rental dengan pengemudi'],['corporate','Rental corporate'],['tourism','Rental pariwisata'],['wedding','Rental wedding'],['booking','Booking rental mobil']];
async function safe(p,f){try{const r=await p;if(r?.error)throw r.error;return r?.data??f}catch(_){return f}}
async function render(){
 const host=document.getElementById('seoBody');if(!host||host.dataset.tmF6==='1')return;host.dataset.tmF6='1';const d=db();
 if(!d){host.insertAdjacentHTML('beforeend','<div class="notice bad">Semantic Intelligence belum terhubung ke backend.</div>');return}
 const [ev,book,leads]=await Promise.all([
  safe(d.from('website_analytics_events').select('event_type,path,source,metadata,occurred_at,visitor_session_id').gte('occurred_at',since(30)).limit(10000),[]),
  safe(d.from('bookings').select('booking_code,status,created_at,total_price,customer_id').gte('created_at',since(30)).limit(2000),[]),
  safe(d.from('customer_care_leads').select('intent,status,stage,metadata,created_at').gte('created_at',since(30)).limit(2000),[])
 ]);
 const events=Array.isArray(ev)?ev:[], bookings=(Array.isArray(book)?book:[]).filter(x=>!['dibatalkan','cancelled','canceled','refund','refunded'].includes(String(x.status||'').toLowerCase()));
 const pageViews=events.filter(x=>x.event_type==='page_view'),cta=events.filter(x=>x.event_type==='booking_cta_click').length,wa=events.filter(x=>x.event_type==='whatsapp_click').length,sessions=new Set(events.map(x=>x.visitor_session_id).filter(Boolean)).size;
 const localCounts=areas.map(area=>({area,count:pageViews.filter(x=>String(x.path||'').toLowerCase().includes(area.toLowerCase())).length}));
 const intentCounts=intents.map(([key,label])=>({key,label,count:(leads||[]).filter(x=>String(x.intent||'').toLowerCase().includes(key)).length}));
 const weak=[...localCounts.filter(x=>x.count===0).map(x=>({type:'geo',label:x.area,action:'Perkuat halaman lokal dengan bukti layanan nyata dan jalur booking yang jelas.'})),...intentCounts.filter(x=>x.count===0).slice(0,5).map(x=>({type:'intent',label:x.label,action:'Buat jawaban yang benar-benar menjawab kebutuhan pelanggan lalu hubungkan ke booking.'}))];
 const css='<style id="tm-f6-style">.tmf6{margin-top:14px}.tmf6-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.tmf6-card{background:linear-gradient(145deg,#171a21,#101319);border:1px solid #292f39;border-radius:15px;padding:16px}.tmf6-big{font-size:25px;font-weight:900;margin:5px 0}.tmf6-note{font-size:11px;color:#8e949f;line-height:1.55}.tmf6-list{display:grid;gap:7px}.tmf6-row{display:grid;grid-template-columns:120px 1fr auto;gap:10px;padding:9px 0;border-bottom:1px solid #252a31;align-items:center;font-size:11px}.tmf6-chip{border:1px solid #343943;border-radius:999px;padding:4px 8px;width:max-content;font-size:9px}.tmf6-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.tmf6-btn{border:1px solid #343943;background:#0d1015;color:#e7e8eb;border-radius:9px;padding:9px 11px;cursor:pointer}.tmf6-primary{background:#d2ad32;color:#111;font-weight:850;border-color:#d2ad32}@media(max-width:850px){.tmf6-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:560px){.tmf6-grid{grid-template-columns:1fr}.tmf6-row{grid-template-columns:1fr}}</style>';
 const entityRows=areas.map(a=>'<div class="tmf6-row"><span class="tmf6-chip">GEO</span><b>'+esc(a)+'</b><span>Service area</span></div>').join('');
 const intentRows=intents.map(x=>'<div class="tmf6-row"><span class="tmf6-chip">INTENT</span><b>'+esc(x[1])+'</b><span>'+intentCounts.find(y=>y.key===x[0])?.count+' lead</span></div>').join('');
 const oppRows=weak.slice(0,10).map(x=>'<div class="tmf6-row"><span class="tmf6-chip">'+esc(x.type.toUpperCase())+'</span><b>'+esc(x.label)+'</b><span>'+esc(x.action)+'</span></div>').join('')||'<div class="tmf6-note">Belum ada gap entity/intent yang terdeteksi dari data 30 hari.</div>';
 host.insertAdjacentHTML('beforeend',css+'<section class="tmf6"><div class="tmf6-card"><h3>🧠 F6 Semantic Entity Graph + AI Answer Optimization</h3><div class="tmf6-note">Mesin menghubungkan Transmind → layanan → area → intent → halaman → CTA → lead → booking. Optimasi agresif dilakukan dengan memperjelas entitas dan jawaban, bukan memanipulasi hasil pencarian.</div></div><div class="tmf6-grid" style="margin-top:12px"><div class="tmf6-card"><div class="tmf6-note">Visitor/session signal · 30 hari</div><div class="tmf6-big">'+sessions+'</div></div><div class="tmf6-card"><div class="tmf6-note">Booking CTA · 30 hari</div><div class="tmf6-big">'+cta+'</div></div><div class="tmf6-card"><div class="tmf6-note">WhatsApp · 30 hari</div><div class="tmf6-big">'+wa+'</div></div><div class="tmf6-card"><div class="tmf6-note">Booking nyata · 30 hari</div><div class="tmf6-big">'+bookings.length+'</div></div></div><div class="tmf6-card" style="margin-top:12px"><h3>🔗 Entity Coverage</h3><div class="tmf6-list">'+entityRows+'</div></div><div class="tmf6-card" style="margin-top:12px"><h3>🎯 Intent Coverage</h3><div class="tmf6-list">'+intentRows+'</div></div><div class="tmf6-card" style="margin-top:12px"><h3>⚡ AI Answer Opportunity Queue</h3><div class="tmf6-note">Prioritas berasal dari sinyal first-party. Setiap peluang harus menghasilkan jawaban yang berguna, bukti layanan yang nyata, dan jalur booking yang jelas.</div><div class="tmf6-list" style="margin-top:8px">'+oppRows+'</div><div class="tmf6-actions"><button class="tmf6-btn tmf6-primary" id="tmf6-refresh">↻ Refresh intelligence</button><button class="tmf6-btn" id="tmf6-copy">Copy answer queue</button></div></div></section>');
 document.getElementById('tmf6-refresh')?.addEventListener('click',()=>{host.dataset.tmF6='';render()});
 document.getElementById('tmf6-copy')?.addEventListener('click',async()=>{const text='TRANSMIND F6 — AI ANSWER QUEUE\n'+weak.slice(0,10).map((x,i)=>(i+1)+'. '+x.type+' | '+x.label+' | '+x.action).join('\n');try{await navigator.clipboard.writeText(text);alert('Answer queue disalin.')}catch(_){alert(text)}});
}
window.TRANSMIND_SEO_F6={render};
document.addEventListener('tm-seo-refresh',()=>setTimeout(render,200));
setTimeout(render,2200);
})();