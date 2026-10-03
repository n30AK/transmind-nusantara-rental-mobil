/* TRANSMIND NEXUS — SEO Research Layer
   First-party planning layer for keyword/competitor/backlink research.
   It does not invent rankings, traffic or competitor metrics.
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
const competitors=[
 'Rental mobil Jakarta',
 'Rental mobil Bekasi',
 'Rental mobil Jabodetabek',
 'Rental mobil lepas kunci Jakarta',
 'Rental mobil dengan driver Jakarta',
 'Rental mobil corporate Jakarta'
];
function css(){if(document.getElementById('tmSeoResearchStyle'))return;const s=document.createElement('style');s.id='tmSeoResearchStyle';s.textContent='#tmSeoResearch{margin-top:12px}.tm-sr-table{overflow:auto}.tm-sr-row{display:grid;grid-template-columns:1.6fr .7fr .7fr 1.3fr 1fr;gap:8px;min-width:760px;padding:9px 4px;border-bottom:1px solid #252a31;align-items:center;font-size:10px}.tm-sr-head{font-size:9px;color:#8e949f;text-transform:uppercase;letter-spacing:.7px}.tm-sr-pill{display:inline-block;width:max-content;padding:4px 7px;border:1px solid #343943;border-radius:999px;font-size:9px}.tm-sr-note{font-size:10px;color:#8e949f;line-height:1.5}@media(max-width:650px){.tm-sr-row{grid-template-columns:1.4fr .6fr .8fr 1.2fr 1fr}}';document.head.appendChild(s)}
function renderLayer(){const host=document.getElementById('seoBody');if(!host)return;css();if(document.getElementById('tmSeoResearch'))return;const box=document.createElement('section');box.id='tmSeoResearch';box.className='sc-card';box.innerHTML='<h3>🔎 SEO Research & Competitive Intelligence</h3><div class="tm-sr-note">Ini adalah target riset yang dapat diuji dengan data nyata. NEXUS tidak mengklaim posisi Google, volume pencarian, backlink atau metrik kompetitor tanpa sumber terverifikasi.</div><div class="tm-sr-table" style="margin-top:10px"><div class="tm-sr-row tm-sr-head"><span>Intent / Query</span><span>Area</span><span>Priority</span><span>Landing Page</span><span>Research Status</span></div>'+clusters.map(x=>'<div class="tm-sr-row"><span><b>'+esc(x[0])+'</b><br><small class="tm-sr-note">'+esc(x[3])+'</small></span><span>'+esc(x[1])+'</span><span><span class="tm-sr-pill">'+esc(x[4])+'</span></span><span>'+esc(x[2])+'</span><span><span class="tm-sr-pill">TARGET · VERIFY</span></span></div>').join('')+'</div><div style="margin-top:12px;padding-top:10px;border-top:1px solid #252a31"><b>Competitor research queue</b><div class="tm-sr-note" style="margin-top:5px">'+competitors.map(esc).join(' · ')+'</div></div><div style="margin-top:10px" class="tm-sr-note"><b>Backlink strategy:</b> prioritaskan citation lokal, partner/affiliate yang relevan, directory bisnis yang sah, supplier/partner pages, PR lokal, dan konten yang layak dirujuk. Tidak menggunakan link farm, PBN, spam komentar atau backlink massal.</div><div style="margin-top:10px" class="tm-sr-note"><b>Third-party policy:</b> Ahrefs/Semrush/Ubersuggest dapat ditambahkan nanti untuk volume keyword, competitor gap dan backlink discovery. Mereka membantu riset, tetapi tidak menjamin ranking. Untuk ranking/CTR/query aktual, Google Search Console tetap menjadi sumber utama.</div>';host.appendChild(box)}
function wrap(){let tries=0;const t=setInterval(()=>{tries++;const api=window.TRANSMIND_SEO_F1;if(!api||api.__researchWrapped)return;if(typeof api.render!=='function')return;const original=api.render;api.render=async function(days){const result=await original(days);setTimeout(renderLayer,40);return result};api.__researchWrapped=true;clearInterval(t)},500);setTimeout(()=>clearInterval(t),20000)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wrap);else wrap();
})();