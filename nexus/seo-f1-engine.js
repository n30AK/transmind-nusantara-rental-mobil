/* TRANSMIND NEXUS — SEO F2 / DEMAND INTELLIGENCE
   First-party analytics only. No synthetic traffic, search scraping, fake rankings or fake conversions.
*/
(function(){
'use strict';
const css=`<style id="tm-seo-f2-style">
#seoBody .f2-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
#seoBody .f2-card{background:linear-gradient(145deg,#171a21,#101319);border:1px solid #292f39;border-radius:15px;padding:16px}
#seoBody .f2-card h3{margin:0 0 10px;font-size:14px}
#seoBody .f2-big{font-size:27px;font-weight:900;letter-spacing:-.04em}
#seoBody .f2-muted{color:#8e949f;font-size:11px;line-height:1.5}
#seoBody .f2-ok{color:#65d49a}.f2-warn{color:#e5c15a}.f2-blue{color:#7ea7ff}.f2-bad{color:#e87878}
#seoBody .f2-table{display:grid}.f2-row{display:grid;grid-template-columns:1.35fr .65fr .75fr 1fr;gap:10px;padding:10px 4px;border-bottom:1px solid #252a31;align-items:center;font-size:11px}
#seoBody .f2-head{color:#8e949f;font-size:9px;text-transform:uppercase;letter-spacing:.8px}
#seoBody .f2-pill{display:inline-block;padding:4px 8px;border:1px solid #343943;border-radius:999px;font-size:9px;width:max-content}
#seoBody .f2-actions{display:flex;gap:8px;flex-wrap:wrap}.f2-actions a{border:1px solid #343943;background:#0d1015;color:#e7e8eb;border-radius:9px;padding:9px 11px;text-decoration:none;font-size:11px}.f2-actions .primary{background:#d2ad32;color:#111;border-color:#d2ad32;font-weight:800}
#seoBody .f2-channels{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.f2-channel{border:1px solid #292f39;border-radius:12px;padding:12px;background:#0d1015}.f2-channel b{display:block;margin-bottom:4px}.f2-status{font-size:9px;color:#8e949f}
#seoBody .f2-section{margin-top:12px}
@media(max-width:1000px){#seoBody .f2-grid{grid-template-columns:repeat(2,1fr)}#seoBody .f2-channels{grid-template-columns:repeat(2,1fr)}}@media(max-width:650px){#seoBody .f2-grid,#seoBody .f2-channels{grid-template-columns:1fr}.f2-row{grid-template-columns:1.2fr .6fr .7fr 1fr;min-width:620px}.f2-table{overflow:auto}}
</style>`;
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function pct(a,b){return b?((Number(a||0)/Number(b||0))*100).toFixed(1)+'%':'0.0%';}
function client(){return window.getTransmindSupabaseClient?window.getTransmindSupabaseClient():null;}
function cutoff(days){return new Date(Date.now()-days*86400000).toISOString();}
async function events(db,days){const q=await db.from('website_analytics_events').select('event_type,path,source,medium,campaign,referrer_host,metadata,occurred_at').gte('occurred_at',cutoff(days)).order('occurred_at',{ascending:false}).limit(5000);if(q.error)throw q.error;return q.data||[];}
function agg(rows){const o={events:rows.length,pages:{},sources:{},types:{},geo:{},intent:{}};rows.forEach(r=>{const p=String(r.path||'/').split('?')[0],s=String(r.source||'direct')||'direct',t=String(r.event_type||'unknown');o.pages[p]=(o.pages[p]||0)+1;o.sources[s]=(o.sources[s]||0)+1;o.types[t]=(o.types[t]||0)+1;const m=String(r.metadata?.city||r.metadata?.area||r.metadata?.location||'').trim();if(m)o.geo[m]=(o.geo[m]||0)+1;const q=String(r.metadata?.intent||r.metadata?.query_intent||'').trim();if(q)o.intent[q]=(o.intent[q]||0)+1;});return o;}
function top(obj,n=8){return Object.entries(obj).sort((a,b)=>b[1]-a[1]).slice(0,n);}
function card(label,value,note,cls){return '<div class="f2-card"><div class="f2-muted">'+esc(label)+'</div><div class="f2-big '+(cls||'')+'">'+value+'</div><div class="f2-muted">'+esc(note||'')+'</div></div>';}
function pathGeo(p){const x=p.toLowerCase();for(const g of ['jakarta','bekasi','bogor','depok','tangerang'])if(x.includes(g))return g;return 'other';}
function intentFor(p){const x=p.toLowerCase();if(x.includes('airport'))return 'airport transfer';if(x.includes('wedding'))return 'wedding';if(x.includes('corporate'))return 'corporate';if(x.includes('wisata'))return 'tourism';if(x.includes('bekasi')||x.includes('bogor')||x.includes('depok')||x.includes('tangerang')||x.includes('jakarta'))return 'local rental';return 'general rental';}
function expansion(p,geo,intent){return [
  {asset:'Landing page',action:'Perkuat halaman intent',why:'Halaman sudah menerima sinyal demand'},
  {asset:'FAQ / answer block',action:'Jawab pertanyaan intent secara langsung',why:'Siap menjadi blok jawaban yang dapat dirujuk'},
  {asset:'Google Business content',action:'Buat post lokal yang relevan',why:'Distribusi lokal tanpa membuat halaman doorway'},
  {asset:'Short video brief',action:'Buat video singkat',why:'Ubah intent menjadi aset visual'},
  {asset:'Social distribution',action:'Potong menjadi 2–3 posting',why:'Distribusi lintas kanal'},
  {asset:'WhatsApp rescue',action:'CTA + follow-up',why:'Dorong demand yang sudah terukur'}
].map(x=>({...x,geo,intent,page:p}));}
async function render(days=7){
 const el=document.getElementById('seoBody');if(!el)return;const db=client();if(!db){el.innerHTML='<div class="notice bad">NEXUS database belum siap.</div>';return;}
 el.innerHTML='<div class="notice">SEO F2 sedang membaca data nyata Nexus…</div>';
 try{
  const [rows,live,funnel]=await Promise.all([events(db,days),db.rpc('nexus_seo_live_metrics',{p_days:days}),db.rpc('nexus_seo_funnel_metrics',{p_days:days})]);
  if(live.error)throw live.error;if(funnel.error)throw funnel.error;
  const [prevRows]=await Promise.all([events(db,Math.max(days*2,14))]);
  const a=agg(rows),all=agg(prevRows),x=live.data||{},f=funnel.data||{};
  const visitors=Number(x.unique_visitors||0),wa=Number(x.whatsapp_clicks||0),bookings=Number(f.bookings||0),linked=Number(f.linked_bookings||0),cta=Number(a.types.booking_cta_click||0),organic=Number(x.organic_visitors||0);
  const prevEvents=Math.max(all.events-a.events,0),growth=prevEvents?((a.events-prevEvents)/prevEvents*100):0;
  const pages=top(a.pages),sources=top(a.sources),geo={};pages.forEach(([p,n])=>{const g=pathGeo(p);geo[g]=(geo[g]||0)+n;});
  const intents={};pages.forEach(([p,n])=>{const i=intentFor(p);intents[i]=(intents[i]||0)+n;});
  const geoRows=top(geo,6),intentRows=top(intents,6);
  const opportunities=[];
  pages.forEach(([p,n])=>{if(n>=2)opportunities.push({title:'Perkuat '+p,why:n+' event nyata',action:'CTA + jawaban intent'});});
  geoRows.forEach(([g,n])=>{if(g!=='other'&&n>=2)opportunities.push({title:'Geo-intent '+g,why:n+' event dari halaman lokal',action:'Local content + GBP'});});
  intentRows.forEach(([i,n])=>{if(n>=2)opportunities.push({title:'Intent '+i,why:n+' event',action:'Content cluster + conversion path'});});
  if(organic===0)opportunities.push({title:'Search Console connector',why:'Organic belum tersedia pada data Nexus',action:'Hubungkan Search Console'});
  if(bookings===0&&visitors>0)opportunities.push({title:'Booking rescue',why:visitors+' visitor tanpa booking terukur',action:'CTA + WhatsApp follow-up'});
  const unique=[...new Map(opportunities.map(o=>[o.title,o])).values()].slice(0,10);
  const expansionRows=pages.slice(0,4).flatMap(([p])=>expansion(p,pathGeo(p),intentFor(p))).slice(0,12);
  const channels=[['Google Search Console','DISCOVERY','Menunggu OAuth'],['Google Business Profile','LOCAL','Menunggu API/OAuth'],['Bing Webmaster','DISCOVERY','Menunggu API/OAuth'],['Email','NURTURE','Provider/domain belum terhubung'],['SMS','OUTBOUND','Hanya untuk opt-in/compliant provider'],['Social Mesh','DISTRIBUTION','OAuth per platform belum terhubung']];
  el.innerHTML=css+
   '<div class="f2-grid">'+card('Visitor unik',visitors,'data Nexus','f2-blue')+card('WhatsApp',wa,pct(wa,visitors)+' dari visitor','f2-ok')+card('Booking',bookings,pct(bookings,visitors)+' dari visitor',bookings?'f2-ok':'f2-warn')+card('Event growth',growth.toFixed(1)+'%',days+' hari vs periode sebelumnya',growth>=0?'f2-ok':'f2-warn')+'</div>'+
   '<div class="f2-card f2-section"><h3>F1 Conversion Cockpit</h3><div class="f2-grid">'+card('Visitor → CTA',cta,pct(cta,visitors),'f2-blue')+card('Visitor → WhatsApp',wa,pct(wa,visitors),'f2-blue')+card('CTA → Booking',bookings,pct(bookings,cta),'f2-blue')+card('Booking → Linked',linked,pct(linked,bookings),'f2-blue')+'</div><div class="f2-muted" style="margin-top:10px">Semua rasio berasal dari event dan transaksi yang tercatat.</div></div>'+
   '<div class="f2-card f2-section"><h3>⚡ Demand Opportunity Radar</h3>'+(unique.length?unique.map(o=>'<div class="list-row"><span><b>'+esc(o.title)+'</b><br><small class="f2-muted">'+esc(o.why)+'</small></span><span class="f2-pill">'+esc(o.action)+'</span></div>').join(''):'<div class="f2-muted">Belum cukup data untuk menemukan peluang spesifik.</div>')+'</div>'+
   '<div class="f2-card f2-section"><h3>📍 Geo-Intent Radar</h3><div class="f2-table"><div class="f2-row f2-head"><span>Area signal</span><span>Event</span><span>Share</span><span>Next action</span></div>'+(geoRows.length?geoRows.map(r=>'<div class="f2-row"><span>'+esc(r[0])+'</span><b>'+r[1]+'</b><span>'+pct(r[1],a.events)+'</span><span class="f2-pill">LOCAL CONTENT</span></div>').join(''):'<div class="f2-muted">Belum ada sinyal geo eksplisit.</div>')+'</div></div>'+
   '<div class="f2-card f2-section"><h3>🧠 Intent Radar</h3><div class="f2-table"><div class="f2-row f2-head"><span>Intent</span><span>Event</span><span>Share</span><span>Content move</span></div>'+(intentRows.length?intentRows.map(r=>'<div class="f2-row"><span>'+esc(r[0])+'</span><b>'+r[1]+'</b><span>'+pct(r[1],a.events)+'</span><span class="f2-pill">ANSWER + CTA</span></div>').join(''):'<div class="f2-muted">Belum ada sinyal intent terstruktur.</div>')+'</div></div>'+
   '<div class="f2-card f2-section"><h3>🧬 Page Demand Map</h3><div class="f2-table"><div class="f2-row f2-head"><span>Page</span><span>Events</span><span>Geo</span><span>Intent</span></div>'+(pages.length?pages.map(r=>'<div class="f2-row"><span>'+esc(r[0])+'</span><b>'+r[1]+'</b><span>'+esc(pathGeo(r[0]))+'</span><span class="f2-pill">'+esc(intentFor(r[0]))+'</span></div>').join(''):'<div class="f2-muted">Belum ada page event.</div>')+'</div></div>'+
   '<div class="f2-card f2-section"><h3>🌐 1000-Bayangan Asset Expansion</h3><div class="f2-muted" style="margin-bottom:10px">Bukan 1000 halaman duplikat. Satu sinyal demand dapat diturunkan menjadi aset yang berbeda dan berguna; mesin hanya membuat queue, bukan spam.</div><div class="f2-table"><div class="f2-row f2-head"><span>Asset</span><span>Geo</span><span>Intent</span><span>Action</span></div>'+expansionRows.map(r=>'<div class="f2-row"><span><b>'+esc(r.asset)+'</b><br><small>'+esc(r.page)+'</small></span><span>'+esc(r.geo)+'</span><span>'+esc(r.intent)+'</span><span class="f2-pill">'+esc(r.action)+'</span></div>').join('')+'</div></div>'+
   '<div class="f2-card f2-section"><h3>🔌 Omnichannel Connector Mesh</h3><div class="f2-channels">'+channels.map(c=>'<div class="f2-channel"><b>'+esc(c[0])+'</b><span class="f2-status">'+esc(c[1])+' · '+esc(c[2])+'</span></div>').join('')+'</div><div class="f2-muted" style="margin-top:10px">Tidak ada kredensial yang dibuat-buat. Provider/OAuth eksternal harus diotorisasi pemilik akun sebelum data dapat masuk.</div></div>'+
   '<div class="f2-card f2-section"><h3>🎯 Immediate Conversion Actions</h3><div class="f2-actions"><a class="primary" href="https://transmindnusantararentalmobil.co.id/#booking">Buka Booking</a><a href="https://wa.me/628816654141" target="_blank" rel="noopener">WhatsApp Admin</a><a href="https://transmindnusantararentalmobil.co.id/rental-mobil-jakarta.html">Jakarta</a><a href="https://transmindnusantararentalmobil.co.id/rental-mobil-bekasi.html">Bekasi</a><a href="https://transmindnusantararentalmobil.co.id/rental-mobil-bogor.html">Bogor</a><a href="https://transmindnusantararentalmobil.co.id/rental-mobil-depok.html">Depok</a><a href="https://transmindnusantararentalmobil.co.id/rental-mobil-tangerang.html">Tangerang</a></div></div>';
 }catch(e){el.innerHTML='<div class="notice bad">SEO F2 tidak dapat membaca data: '+esc(e.message)+'</div>';}
}
function install(){if(window.__TM_SEO_F2_INSTALLED)return;window.__TM_SEO_F2_INSTALLED=true;window.TRANSMIND_SEO_F1={render};window.addEventListener('tm-seo-refresh',e=>render(Number(e.detail?.days||7)));document.addEventListener('click',e=>{const b=e.target.closest('[data-seo]');if(b)setTimeout(()=>render(Number(b.dataset.seo||7)),50);});}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();