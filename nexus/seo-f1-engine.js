/* TRANSMIND NEXUS — SEO F1 / DEMAND RADAR
   Real-data only. Reads first-party website_analytics_events + existing Nexus RPCs.
   No synthetic traffic, no automated search scraping, no ranking guarantees.
*/
(function(){
'use strict';
const css=`<style id="tm-seo-f1-style">
#seoBody .tm-f1-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
#seoBody .tm-f1-card{background:linear-gradient(145deg,#171a21,#101319);border:1px solid #292f39;border-radius:15px;padding:16px}
#seoBody .tm-f1-card h3{margin:0 0 10px;font-size:14px}
#seoBody .tm-f1-big{font-size:28px;font-weight:900;letter-spacing:-.04em}
#seoBody .tm-f1-muted{color:#8e949f;font-size:11px;line-height:1.5}
#seoBody .tm-f1-ok{color:#65d49a}.tm-f1-warn{color:#e5c15a}.tm-f1-blue{color:#7ea7ff}
#seoBody .tm-f1-table{display:grid;gap:0}.tm-f1-row{display:grid;grid-template-columns:1.4fr .7fr .7fr 1fr;gap:10px;padding:10px 4px;border-bottom:1px solid #252a31;align-items:center;font-size:11px}.tm-f1-head{color:#8e949f;font-size:9px;text-transform:uppercase;letter-spacing:.8px}
#seoBody .tm-f1-pill{display:inline-block;padding:4px 8px;border:1px solid #343943;border-radius:999px;font-size:9px}
#seoBody .tm-f1-actions{display:flex;gap:8px;flex-wrap:wrap}.tm-f1-actions a{border:1px solid #343943;background:#0d1015;color:#e7e8eb;border-radius:9px;padding:9px 11px;text-decoration:none;font-size:11px}.tm-f1-actions .primary{background:#d2ad32;color:#111;border-color:#d2ad32;font-weight:800}
#seoBody .tm-f1-channels{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.tm-f1-channel{border:1px solid #292f39;border-radius:12px;padding:12px;background:#0d1015}.tm-f1-channel b{display:block;margin-bottom:4px}.tm-f1-status{font-size:9px;color:#8e949f}
@media(max-width:1000px){#seoBody .tm-f1-grid{grid-template-columns:repeat(2,1fr)}#seoBody .tm-f1-channels{grid-template-columns:repeat(2,1fr)}}@media(max-width:650px){#seoBody .tm-f1-grid,#seoBody .tm-f1-channels{grid-template-columns:1fr}.tm-f1-row{grid-template-columns:1.2fr .6fr .6fr 1fr;min-width:650px}.tm-f1-table{overflow:auto}}
</style>`;
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function pct(a,b){return b?((a/b)*100).toFixed(1)+'%':'0.0%';}
function card(label,value,note,cls){return '<div class="tm-f1-card"><div class="tm-f1-muted">'+esc(label)+'</div><div class="tm-f1-big '+(cls||'')+'">'+value+'</div><div class="tm-f1-muted">'+esc(note||'')+'</div></div>';}
function cutoff(days){return new Date(Date.now()-days*86400000).toISOString();}
function client(){return window.getTransmindSupabaseClient?window.getTransmindSupabaseClient():null;}
async function events(db,days){const q=await db.from('website_analytics_events').select('event_type,path,source,medium,campaign,referrer_host,metadata,occurred_at').gte('occurred_at',cutoff(days)).order('occurred_at',{ascending:false}).limit(2000);if(q.error)throw q.error;return q.data||[];}
function aggregate(rows){const out={events:rows.length,pages:{},sources:{},types:{}};rows.forEach(r=>{const p=String(r.path||'/').split('?')[0];out.pages[p]=(out.pages[p]||0)+1;const s=String(r.source||'direct')||'direct';out.sources[s]=(out.sources[s]||0)+1;const t=String(r.event_type||'unknown');out.types[t]=(out.types[t]||0)+1;});return out;}
function top(obj,n=8){return Object.entries(obj).sort((a,b)=>b[1]-a[1]).slice(0,n);}
async function render(days){
  const el=document.getElementById('seoBody');if(!el)return;const db=client();if(!db){el.innerHTML='<div class="notice bad">NEXUS database belum siap.</div>';return;}
  el.innerHTML='<div class="notice">SEO F1 sedang membaca data nyata Nexus…</div>';
  try{
    const [rows,live,funnel]=await Promise.all([events(db,days),db.rpc('nexus_seo_live_metrics',{p_days:days}),db.rpc('nexus_seo_funnel_metrics',{p_days:days})]);
    if(live.error)throw live.error;if(funnel.error)throw funnel.error;
    const a=aggregate(rows),x=live.data||{},f=funnel.data||{},visitors=Number(x.unique_visitors||0),wa=Number(x.whatsapp_clicks||0),bookings=Number(f.bookings||0),linked=Number(f.linked_bookings||0),cta=a.types.booking_cta_click||0,organic=Number(x.organic_visitors||0);
    const pageRows=top(a.pages),sourceRows=top(a.sources),opportunities=[];
    pageRows.forEach(([p,n])=>{if(n>=2)opportunities.push({title:'Perkuat halaman '+p,why:n+' event terukur',action:'CTA booking + internal link relevan'});});
    sourceRows.forEach(([s,n])=>{if(s!=='direct'&&n>=2)opportunities.push({title:'Optimalkan source '+s,why:n+' event',action:'UTM + landing intent sesuai'});});
    if(organic===0)opportunities.push({title:'Hubungkan Search Console',why:'Organic belum terbaca di Nexus',action:'Masukkan OAuth Search Console'}); 
    if(bookings===0&&visitors>0)opportunities.push({title:'Booking rescue',why:visitors+' visitor tanpa booking terukur',action:'Perkuat CTA + WhatsApp + follow-up'});
    const uniqueOpp=[...new Map(opportunities.map(o=>[o.title,o])).values()].slice(0,8),channels=[['Google Search Console','DISCOVERY','OAuth diperlukan'],['Google Business Profile','LOCAL','API/OAuth diperlukan'],['Bing Webmaster','DISCOVERY','API/OAuth diperlukan'],['SMS Gateway','OUTBOUND','Provider + credential diperlukan'],['Email Marketing','NURTURE','Provider/domain credential diperlukan'],['Social Mesh','DISTRIBUTION','OAuth per platform diperlukan']];
    el.innerHTML=css+
    '<div class="tm-f1-grid">'+card('Visitor unik',visitors,'data Nexus','tm-f1-blue')+card('WhatsApp',wa,pct(wa,visitors)+' dari visitor','tm-f1-ok')+card('Booking',bookings,pct(bookings,visitors)+' dari visitor',bookings?'tm-f1-ok':'tm-f1-warn')+card('Linked booking',linked,pct(linked,bookings)+' dari booking',linked?'tm-f1-ok':'tm-f1-warn')+'</div>'+
    '<div class="tm-f1-card" style="margin-top:12px"><h3>F1 Conversion Cockpit</h3><div class="tm-f1-grid">'+card('Visitor → CTA',cta,pct(cta,visitors),'tm-f1-blue')+card('Visitor → WhatsApp',wa,pct(wa,visitors),'tm-f1-blue')+card('CTA → Booking',bookings,pct(bookings,cta),'tm-f1-blue')+card('Booking → Linked',linked,pct(linked,bookings),'tm-f1-blue')+'</div><div class="tm-f1-muted" style="margin-top:10px">Rasio berasal dari event dan booking yang benar-benar tercatat.</div></div>'+
    '<div class="tm-f1-card" style="margin-top:12px"><h3>⚡ Opportunity Radar</h3>'+(uniqueOpp.length?uniqueOpp.map(o=>'<div class="list-row"><span><b>'+esc(o.title)+'</b><br><small class="tm-f1-muted">'+esc(o.why)+'</small></span><span class="tm-f1-pill">'+esc(o.action)+'</span></div>').join(''):'<div class="tm-f1-muted">Belum cukup data untuk menemukan peluang spesifik. Mesin tidak mengarang peluang.</div>')+'</div>'+
    '<div class="tm-f1-card" style="margin-top:12px"><h3>🔭 Search / Source Radar</h3><div class="tm-f1-table"><div class="tm-f1-row tm-f1-head"><span>Source</span><span>Event</span><span>Share</span><span>Status</span></div>'+(sourceRows.length?sourceRows.map(r=>'<div class="tm-f1-row"><span>'+esc(r[0])+'</span><b>'+r[1]+'</b><span>'+pct(r[1],a.events)+'</span><span class="tm-f1-pill">REAL DATA</span></div>').join(''):'<div class="tm-f1-muted" style="padding:15px">Belum ada source event.</div>')+'</div></div>'+
    '<div class="tm-f1-card" style="margin-top:12px"><h3>🧬 Page Demand Map</h3><div class="tm-f1-table"><div class="tm-f1-row tm-f1-head"><span>Page</span><span>Events</span><span>Share</span><span>Signal</span></div>'+(pageRows.length?pageRows.map(r=>'<div class="tm-f1-row"><span>'+esc(r[0])+'</span><b>'+r[1]+'</b><span>'+pct(r[1],a.events)+'</span><span class="tm-f1-pill">'+(r[1]>=5?'HOT':'EMERGING')+'</span></div>').join(''):'<div class="tm-f1-muted" style="padding:15px">Belum ada page event.</div>')+'</div></div>'+
    '<div class="tm-f1-card" style="margin-top:12px"><h3>🚀 Channel Mesh</h3><div class="tm-f1-channels">'+channels.map(c=>'<div class="tm-f1-channel"><b>'+esc(c[0])+'</b><span class="tm-f1-status">'+esc(c[1])+' · '+esc(c[2])+'</span></div>').join('')+'</div><div class="tm-f1-muted" style="margin-top:10px">Titik integrasi disiapkan tanpa kredensial palsu. Aktivasi provider/OAuth menjadi langkah berikutnya.</div></div>'+
    '<div class="tm-f1-card" style="margin-top:12px"><h3>🎯 Immediate Conversion Actions</h3><div class="tm-f1-actions"><a class="primary" href="https://transmindnusantararentalmobil.co.id/#booking">Buka Booking</a><a href="https://wa.me/628816654141" target="_blank" rel="noopener">WhatsApp Admin</a><a href="https://transmindnusantararentalmobil.co.id/rental-mobil-jakarta.html">Jakarta</a><a href="https://transmindnusantararentalmobil.co.id/rental-mobil-bekasi.html">Bekasi</a><a href="https://transmindnusantararentalmobil.co.id/rental-mobil-bogor.html">Bogor</a><a href="https://transmindnusantararentalmobil.co.id/rental-mobil-depok.html">Depok</a><a href="https://transmindnusantararentalmobil.co.id/rental-mobil-tangerang.html">Tangerang</a></div></div>';
  }catch(e){el.innerHTML='<div class="notice bad">SEO F1 tidak dapat membaca data: '+esc(e.message)+'</div>';}
}
function install(){
  if(window.__TM_SEO_F1_INSTALLED)return;window.__TM_SEO_F1_INSTALLED=true;window.TRANSMIND_SEO_F1={render};
  const nav=document.getElementById('nav');
  if(nav&&!nav.dataset.seoF1Bound){nav.dataset.seoF1Bound='1';nav.addEventListener('click',function(e){const b=e.target.closest('[data-page="seo-live"]');if(b)setTimeout(()=>render(7),40);},true);}
  document.addEventListener('click',function(e){const b=e.target.closest('[data-seo]');if(b){const days=Number(b.dataset.seo||7);setTimeout(()=>render(days),50);}},true);
  window.addEventListener('tm-seo-refresh',e=>render(Number(e.detail?.days||7)));
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
})();