/* TRANSMIND NEXUS — SEO Research Layer
   First-party planning + verified research signal surface.
   It never invents rankings, traffic, volume or competitor metrics.
*/
(()=>{'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clusters=[
 ['Rental mobil Jakarta','Jakarta','/rental-mobil-jakarta.html','Commercial','HIGH'],
 ['Rental mobil Bekasi','Bekasi','/rental-mobil-bekasi.html','Commercial','HIGH'],
 ['Rental mobil Bogor','Bogor','/rental-mobil-bogor.html','Commercial','HIGH'],
 ['Rental mobil Depok','Depok','/rental-mobil-depok.html','Commercial','HIGH'],
 ['Rental mobil Tangerang','Tangerang','/rental-mobil-tangerang.html','Commercial','HIGH'],
 ['Rental mobil Jabodetabek','Jabodetabek','/rental-mobil-jabodetabek.html','Commercial','HIGH'],
 ['Rental mobil lepas kunci Jabodetabek','Jabodetabek','/rental-mobil-lepas-kunci-jabodetabek.html','Transactional','HIGH'],
 ['Rental mobil dengan driver Jabodetabek','Jabodetabek','/rental-mobil-dengan-driver-jabodetabek.html','Transactional','HIGH'],
 ['Rental mobil corporate Jabodetabek','Jabodetabek','/rental-mobil-corporate-jabodetabek.html','B2B','HIGH'],
 ['Rental mobil wedding Jabodetabek','Jabodetabek','/rental-mobil-wedding-jabodetabek.html','Event','MEDIUM'],
 ['Rental mobil pariwisata Jabodetabek','Jabodetabek','/rental-mobil-pariwisata-jabodetabek.html','Travel','HIGH'],
 ['Sewa mobil harian Jakarta','Jakarta','/rental-mobil-jakarta.html','Commercial','MEDIUM'],
 ['Sewa mobil untuk perjalanan bisnis Jakarta','Jakarta','/rental-mobil-corporate-jabodetabek.html','B2B','MEDIUM'],
 ['Sewa mobil keluarga Jabodetabek','Jabodetabek','/rental-mobil-jabodetabek.html','Travel','MEDIUM'],
 ['Sewa mobil wisata Jabodetabek','Jabodetabek','/rental-mobil-pariwisata-jabodetabek.html','Travel','MEDIUM']
];
function css(){if(document.getElementById('tmSeoResearchStyle'))return;const s=document.createElement('style');s.id='tmSeoResearchStyle';s.textContent='#tmSeoResearch{margin-top:12px}.tm-sr-table{overflow:auto}.tm-sr-row{display:grid;grid-template-columns:1.55fr .65fr .65fr 1.25fr 1.15fr;gap:8px;min-width:780px;padding:9px 4px;border-bottom:1px solid #252a31;align-items:center;font-size:10px}.tm-sr-head{font-size:9px;color:#8e949f;text-transform:uppercase;letter-spacing:.7px}.tm-sr-pill{display:inline-block;width:max-content;padding:4px 7px;border:1px solid #343943;border-radius:999px;font-size:9px}.tm-sr-note{font-size:10px;color:#8e949f;line-height:1.5}.tm-sr-signal{margin-top:12px;padding-top:10px;border-top:1px solid #252a31}.tm-sr-signal-row{display:grid;grid-template-columns:1.1fr .8fr .9fr 1.7fr;gap:8px;padding:8px 4px;border-bottom:1px solid #252a31;font-size:10px}.tm-sr-source{color:#8e949f;font-size:9px}@media(max-width:650px){.tm-sr-row{grid-template-columns:1.3fr .6fr .8fr 1.2fr 1fr}.tm-sr-signal-row{grid-template-columns:1fr 1fr}.tm-sr-signal-row>*:last-child{grid-column:1/-1}}';document.head.appendChild(s)}
function client(){try{if(window.getTransmindSupabaseClient)return window.getTransmindSupabaseClient();if(window.NEXUS_CONFIG&&window.supabase)return window.supabase.createClient(window.NEXUS_CONFIG.supabaseUrl,window.NEXUS_CONFIG.supabaseAnonKey)}catch(e){}return null}
async function verifiedSignals(){
 const sb=client();if(!sb)return[];
 try{const r=await sb.from('nexus_seo_signals').select('keyword,market,competitor_domain,target_url,signal_score,evidence,source,observed_at').eq('signal_type','serp_competitor').order('observed_at',{ascending:false}).limit(20);return r.data||[]}catch(e){return[]}
}
async function renderLayer(){
 const host=document.getElementById('seoBody');if(!host)return;css();if(document.getElementById('tmSeoResearch'))return;
 const signals=await verifiedSignals();
 const signalHtml=signals.length
  ? '<div class="tm-sr-signal"><b>Verified research signals</b><div class="tm-sr-note" style="margin:5px 0 8px">Sinyal berikut berasal dari observasi SERP yang dicatat ke NEXUS; ini bukan klaim posisi/ranking.</div><div class="tm-sr-signal-row" style="color:#8e949f;text-transform:uppercase;font-size:9px"><span>Query</span><span>Area</span><span>Competitor</span><span>Evidence</span></div>'+signals.map(x=>'<div class="tm-sr-signal-row"><span><b>'+esc(x.keyword)+'</b></span><span>'+esc(x.market)+'</span><span>'+esc(x.competitor_domain||'-')+'<br><span class="tm-sr-source">'+esc(x.source)+'</span></span><span>'+esc(x.evidence||'')+'</span></div>').join('')+'</div>'
  : '<div class="tm-sr-signal"><b>Verified research signals</b><div class="tm-sr-note">Belum ada sinyal eksternal tersimpan.</div></div>';
 const box=document.createElement('section');box.id='tmSeoResearch';box.className='sc-card';
 box.innerHTML='<h3>🔎 SEO Research & Competitive Intelligence</h3><div class="tm-sr-note">NEXUS memisahkan <b>target</b> dari <b>fakta terverifikasi</b>. Volume pencarian, ranking, CTR dan backlink tidak boleh ditebak.</div><div class="tm-sr-table" style="margin-top:10px"><div class="tm-sr-row tm-sr-head"><span>Intent / Query</span><span>Area</span><span>Priority</span><span>Landing Page</span><span>Status</span></div>'+clusters.map(x=>'<div class="tm-sr-row"><span><b>'+esc(x[0])+'</b><br><small class="tm-sr-note">'+esc(x[3])+'</small></span><span>'+esc(x[1])+'</span><span><span class="tm-sr-pill">'+esc(x[4])+'</span></span><span>'+esc(x[2])+'</span><span><span class="tm-sr-pill">TARGET · VERIFY</span></span></div>').join('')+'</div>'+signalHtml+'<div style="margin-top:12px" class="tm-sr-note"><b>Next external-data layer:</b> Google Search Console untuk query/impression/CTR/position aktual; Ahrefs/Semrush/Ubersuggest untuk keyword gap, competitor discovery dan backlink discovery. Tools tersebut mempercepat riset tetapi tidak menjamin ranking.</div><div style="margin-top:8px" class="tm-sr-note"><b>Backlink guardrail:</b> citation lokal, partner/affiliate relevan, directory bisnis sah, supplier/partner pages, PR lokal dan konten yang layak dirujuk. Tidak memakai link farm, PBN, spam komentar atau backlink massal.</div>';
 host.appendChild(box)
}
function wrap(){let tries=0;const t=setInterval(()=>{tries++;const api=window.TRANSMIND_SEO_F1;if(!api||api.__researchWrapped)return;if(typeof api.render!=='function')return;const original=api.render;api.render=async function(days){const result=await original(days);setTimeout(()=>renderLayer(),40);return result};api.__researchWrapped=true;clearInterval(t)},500);setTimeout(()=>clearInterval(t),20000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wrap);else wrap();
})();