/* TRANSMIND NEXUS — SEO & LIVE TRAFFIC COMMAND CENTER */
(function(){
  'use strict';
  var sb=null;
  function esc(s){return String(s??'').replace(/[&<>"']/g,function(c){return({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]);});}
  function rup(n){return new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0));}
  function num(n){return new Intl.NumberFormat('id-ID').format(Number(n||0));}
  function ensure(){
    if(!window.NEXUS_CONFIG || !window.supabase) return false;
    if(!sb) sb=window.supabase.createClient(window.NEXUS_CONFIG.supabaseUrl,window.NEXUS_CONFIG.supabaseAnonKey);
    return true;
  }
  function css(){
    if(document.getElementById('tmSeoCss')) return;
    var s=document.createElement('style');s.id='tmSeoCss';s.textContent=''
      +'.tm-seo-page .seo-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin:14px 0}.tm-seo-page .seo-card{background:linear-gradient(145deg,#171a21,#11141a);border:1px solid #272c35;border-radius:14px;padding:15px}.tm-seo-page .seo-label{color:#8e949f;font-size:10px;text-transform:uppercase;letter-spacing:.8px}.tm-seo-page .seo-value{font-size:24px;font-weight:850;margin:7px 0}.tm-seo-page .seo-note{font-size:11px;color:#8e949f}.tm-seo-page .seo-layout{display:grid;grid-template-columns:1.5fr .9fr;gap:13px}.tm-seo-page .seo-panel{background:#11141a;border:1px solid #272c35;border-radius:14px;padding:16px}.tm-seo-page .seo-panel h3{margin:0 0 13px}.tm-seo-page .seo-bars{display:grid;gap:8px}.tm-seo-page .seo-bar{display:grid;grid-template-columns:90px 1fr 55px;gap:8px;align-items:center;font-size:11px}.tm-seo-page .seo-track{height:9px;background:#242832;border-radius:99px;overflow:hidden}.tm-seo-page .seo-fill{height:100%;background:linear-gradient(90deg,#9f7e18,#f0cf68);border-radius:99px}.tm-seo-page .seo-table{width:100%;border-collapse:collapse;font-size:11px}.tm-seo-page .seo-table th,.tm-seo-page .seo-table td{text-align:left;padding:9px 7px;border-bottom:1px solid #252a31}.tm-seo-page .seo-table th{color:#8e949f;font-size:9px;text-transform:uppercase}.tm-seo-page .seo-chart{height:210px;display:flex;align-items:end;gap:5px;padding:12px 0}.tm-seo-page .seo-col{flex:1;min-width:14px;display:flex;flex-direction:column;justify-content:end;height:100%;gap:5px}.tm-seo-page .seo-col i{display:block;background:#d2ad32;border-radius:4px 4px 0 0;min-height:2px}.tm-seo-page .seo-col span{font-size:8px;color:#747b86;text-align:center;overflow:hidden;white-space:nowrap}.tm-seo-page .seo-actions{display:flex;gap:8px;flex-wrap:wrap}.tm-seo-page .seo-actions button{background:#0d1015;color:#e7e8eb;border:1px solid #343943;border-radius:9px;padding:8px 11px}.tm-seo-page .seo-actions button.active{border-color:#68551d;color:#f0cf68}.tm-seo-page .seo-status{margin-top:10px;color:#8e949f;font-size:11px}@media(max-width:1100px){.tm-seo-page .seo-grid{grid-template-columns:repeat(2,1fr)}.tm-seo-page .seo-layout{grid-template-columns:1fr}}@media(max-width:650px){.tm-seo-page .seo-grid{grid-template-columns:1fr}}
    ';document.head.appendChild(s);
  }
  function buildPage(){
    var pages=document.getElementById('pages');if(!pages||document.getElementById('seo-live-page')) return;
    var d=document.createElement('section');d.id='seo-live-page';d.className='page tm-seo-page';
    d.innerHTML='<div class="hero"><div><div class="eyebrow">SEO & DIGITAL DEMAND</div><div class="title">SEO & Live Traffic Command Center</div><div class="desc">Traffic website, sumber pengunjung, organic demand, WhatsApp leads, booking dan forecast funnel dalam satu layar. Data pengunjung dimulai dari tracker live website; data Search Console dapat disambungkan untuk impressions, clicks, CTR dan average position.</div></div><div class="seo-actions"><button data-days="1">24 Jam</button><button data-days="7" class="active">7 Hari</button><button data-days="30">30 Hari</button><button id="seoRefresh">Refresh</button></div></div><div id="seoBody"><div class="notice">Memuat data SEO...</div></div>';
    pages.appendChild(d);
    d.querySelectorAll('[data-days]').forEach(function(b){b.onclick=function(){d.querySelectorAll('[data-days]').forEach(function(x){x.classList.remove('active')});b.classList.add('active');load(Number(b.dataset.days));};});
    d.querySelector('#seoRefresh').onclick=function(){load(Number((d.querySelector('[data-days].active')||{}).dataset?.days||7));};
  }
  function render(x){
    var body=document.getElementById('seoBody');if(!body)return;
    var daily=Array.isArray(x.daily)?x.daily:[];var sources=Array.isArray(x.sources)?x.sources:[];var landing=Array.isArray(x.landing_pages)?x.landing_pages:[];
    var max=Math.max(1,...daily.map(function(r){return Number(r.visitors||0)}));
    var sourceMax=Math.max(1,...sources.map(function(r){return Number(r.visitors||0)}));
    body.innerHTML='<div class="seo-grid">'
      +card('Pengunjung aktif 5m',num(x.active_visitors_5m),'real-time, last 5 minutes')
      +card('Pengunjung unik',num(x.unique_visitors),'session unik')
      +card('Page views',num(x.page_views),'total halaman dibuka')
      +card('Organic visitors',num(x.organic_visitors),Number(x.organic_share_pct||0).toFixed(2)+'% dari visitor')
      +card('Booking',num(x.bookings),rup(x.booking_revenue))
      +'</div><div class="seo-layout"><div class="seo-panel"><h3>Visitor trend</h3><div class="seo-chart">'+daily.map(function(r){var h=Math.max(2,Math.round((Number(r.visitors||0)/max)*170));return '<div class="seo-col"><i style="height:'+h+'px" title="'+esc(r.day_label||r.day)+': '+num(r.visitors)+' visitor"></i><span>'+esc(String(r.day_label||r.day).slice(5))+'</span></div>';}).join('')+'</div><div class="seo-status">Booking conversion proxy: <b>'+Number(x.booking_conversion_proxy_pct||0).toFixed(2)+'%</b> = booking / unique website sessions. Ini belum merupakan user-level conversion karena session belum ditautkan langsung ke booking.</div></div><div class="seo-panel"><h3>Source / channel</h3><div class="seo-bars">'+sources.map(function(r){return '<div class="seo-bar"><span>'+esc(r.source)+'</span><div class="seo-track"><div class="seo-fill" style="width:'+Math.max(2,Math.round((Number(r.visitors||0)/sourceMax)*100))+'%"></div></div><b>'+num(r.visitors)+'</b></div>';}).join('')+'</div><div class="seo-status">WhatsApp clicks: <b>'+num(x.whatsapp_clicks)+'</b></div></div></div>'
      +'<div class="seo-layout" style="margin-top:13px"><div class="seo-panel"><h3>Top landing pages</h3><table class="seo-table"><thead><tr><th>Page</th><th>Visitors</th></tr></thead><tbody>'+landing.map(function(r){return '<tr><td>'+esc(r.path)+'</td><td>'+num(r.visitors)+'</td></tr>';}).join('')+'</tbody></table></div><div class="seo-panel"><h3>SEO → Forecast bridge</h3><div class="list"><div class="list-row"><span>Traffic demand</span><b>'+num(x.unique_visitors)+'</b></div><div class="list-row"><span>Organic demand</span><b>'+num(x.organic_visitors)+'</b></div><div class="list-row"><span>Lead signal</span><b>'+num(x.whatsapp_clicks)+'</b></div><div class="list-row"><span>Confirmed business event</span><b>'+num(x.bookings)+'</b></div><div class="list-row"><span>Revenue</span><b>'+rup(x.booking_revenue)+'</b></div></div><div class="notice" style="margin-top:12px">Forecasting berikutnya akan memakai visitor → lead → booking → revenue sebagai funnel demand, bukan hanya booking historis.</div></div></div>';
  }
  function card(label,value,note){return '<div class="seo-card"><div class="seo-label">'+label+'</div><div class="seo-value">'+value+'</div><div class="seo-note">'+note+'</div></div>';}
  async function load(days){
    if(!ensure())return;var body=document.getElementById('seoBody');if(body)body.innerHTML='<div class="notice">Mengambil data live...</div>';
    var res=await sb.rpc('nexus_seo_live_metrics',{p_days:days});
    if(res.error){if(body)body.innerHTML='<div class="notice bad">SEO metrics belum dapat diakses: '+esc(res.error.message)+'</div>';return;}
    render(res.data||{});
  }
  function attach(){
    if(!document.body||!window.NEXUS_CONFIG)return;
    css();buildPage();
    var top=document.querySelector('.top-actions');
    if(top&&!document.getElementById('seoTopBtn')){var b=document.createElement('button');b.id='seoTopBtn';b.className='secondary';b.textContent='SEO LIVE';b.onclick=function(){var p=document.getElementById('seo-live-page');document.querySelectorAll('.page').forEach(function(x){x.classList.remove('active')});if(p){p.classList.add('active');var bc=document.getElementById('breadcrumb');if(bc)bc.textContent='SEO / Live Traffic';load(7);}};top.prepend(b);}
  }
  function boot(){var tries=0;var t=setInterval(function(){tries++;attach();if(document.getElementById('seo-live-page')&&document.querySelector('.top-actions'))clearInterval(t);if(tries>80)clearInterval(t);},250);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
