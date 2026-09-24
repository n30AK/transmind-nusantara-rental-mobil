/* TransMind Nexus SEO F5 — Content Opportunity Engine; observed first-party signals only. */
(function(){
'use strict';
const css='<style id="tm-seo-f5-style">#seoBody .f5{margin-top:14px}.f5g{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.f5c{background:linear-gradient(145deg,#171a21,#101319);border:1px solid #292f39;border-radius:15px;padding:16px}.f5c h3{margin:0 0 10px;font-size:14px}.f5n{color:#8e949f;font-size:11px;line-height:1.5}.f5b{font-size:25px;font-weight:900}.f5r{display:grid;grid-template-columns:1.25fr .6fr 1.6fr;gap:10px;padding:10px 4px;border-bottom:1px solid #252a31;font-size:11px;align-items:center}.f5p{display:inline-block;padding:4px 8px;border:1px solid #343943;border-radius:999px;font-size:9px;width:max-content}.f5a{display:flex;gap:8px;flex-wrap:wrap}.f5a button{border:1px solid #343943;background:#0d1015;color:#e7e8eb;border-radius:9px;padding:9px 11px;font-size:11px;cursor:pointer}.f5a .primary{background:#d2ad32;color:#111;border-color:#d2ad32;font-weight:800}@media(max-width:800px){.f5g{grid-template-columns:1fr}.f5r{min-width:650px}.f5c{overflow:auto}}</style>';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const client=()=>window.getTransmindSupabaseClient?window.getTransmindSupabaseClient():window.transmindSupabase||null;
const cut=d=>new Date(Date.now()-d*86400000).toISOString();
function intentFor(p){p=String(p||'').toLowerCase();if(p.includes('corporate'))return'corporate';if(p.includes('wedding'))return'wedding';if(p.includes('wisata'))return'wisata';if(p.includes('jakarta'))return'jakarta';if(p.includes('bekasi'))return'bekasi';if(p.includes('bogor'))return'bogor';if(p.includes('depok'))return'depok';if(p.includes('tangerang'))return'tangerang';return'rental umum'}
async function run(){
 const el=document.getElementById('seoBody'),db=client();if(!el||!db||el.dataset.f5==='1')return;el.dataset.f5='1';
 try{
  const [ev,live,fun]=await Promise.all([db.from('website_analytics_events').select('event_type,path,source,metadata,occurred_at').gte('occurred_at',cut(30)).order('occurred_at',{ascending:false}).limit(5000),db.rpc('nexus_seo_live_metrics',{p_days:30}),db.rpc('nexus_seo_funnel_metrics',{p_days:30})]);
  if(ev.error)throw ev.error;if(live.error)throw live.error;if(fun.error)throw fun.error;
  const rows=ev.data||[],pages={},events={},sources={};
  rows.forEach(r=>{const p=String(r.path||'/').split('?')[0]||'/';pages[p]=(pages[p]||0)+1;const t=String(r.event_type||'event');events[t]=(events[t]||0)+1;const s=String(r.source||'direct')||'direct';sources[s]=(sources[s]||0)+1});
  const top=Object.entries(pages).sort((a,b)=>b[1]-a[1]).slice(0,8),x=live.data||{},f=fun.data||{},wa=Number(x.whatsapp_clicks||0),bookings=Number(f.bookings||0);
  const local=['jakarta','bekasi','bogor','depok','tangerang'],seen=local.filter(g=>Object.keys(pages).some(p=>p.toLowerCase().includes(g))),missing=local.filter(g=>!seen.includes(g));
  const queue=[];
  top.slice(0,4).forEach(([p,n])=>queue.push(['Perkuat halaman '+intentFor(p),n+' event','Tambahkan bukti pengalaman, detail layanan, area dan CTA yang benar-benar relevan dengan halaman tersebut.']));
  missing.slice(0,3).forEach(g=>queue.push(['Validasi peluang lokal '+g,'Belum ada event lokal 30 hari','Jangan membuat doorway page otomatis; buat halaman hanya jika ada layanan, informasi dan kebutuhan nyata.']));
  if(wa>bookings)queue.push(['Perbaiki jalur konversi','WhatsApp click '+wa+' vs booking '+bookings,'Telusuri handoff dan atribusi sebelum menambah konten baru.']);
  if(!queue.length)queue.push(['Eksperimen konten terukur','Belum ada gap besar','Pilih satu perubahan kecil, ukur event dan booking, lalu pertahankan hanya yang terbukti membantu.']);
  const observed=Object.keys(pages).length;
  el.insertAdjacentHTML('beforeend',css+'<div class="f5"><div class="f5c"><h3>✦ F5 Content Opportunity Engine</h3><div class="f5n">Mengubah demand nyata menjadi antrean konten yang dapat ditinjau. Tidak melakukan auto-publish, keyword stuffing, doorway page, atau data sintetis.</div></div><div class="f5g" style="margin-top:12px"><div class="f5c"><div class="f5n">Observed pages</div><div class="f5b">'+observed+'</div><div class="f5n">30 hari</div></div><div class="f5c"><div class="f5n">Event types</div><div class="f5b">'+Object.keys(events).length+'</div><div class="f5n">first-party</div></div><div class="f5c"><div class="f5n">Local gaps</div><div class="f5b">'+missing.length+'</div><div class="f5n">perlu validasi</div></div></div><div class="f5c" style="margin-top:12px"><h3>🧩 Content Opportunity Queue</h3><div class="f5r"><b>Opportunity</b><b>Signal</b><b>Applied action</b></div>'+queue.map((a,i)=>'<div class="f5r"><span><b>'+(i+1)+'. '+esc(a[0])+'</b></span><span class="f5p">OBSERVED</span><span>'+esc(a[1])+' — '+esc(a[2])+'</span></div>').join('')+'<div class="f5a" style="margin-top:10px"><button class="primary" id="tm-f5-refresh">Refresh opportunities</button><button id="tm-f5-copy">Copy content queue</button></div></div></div>');
  document.getElementById('tm-f5-refresh')?.addEventListener('click',()=>{el.dataset.f5='';run()});
  document.getElementById('tm-f5-copy')?.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(queue.map((a,i)=>(i+1)+'. '+a.join(' — ')).join('\n'));alert('Content queue disalin.')}catch(_){alert('Clipboard tidak tersedia.')}});
 }catch(e){el.insertAdjacentHTML('beforeend','<div class="notice bad f5">F5 gagal membaca opportunity: '+esc(e.message)+'</div>')}
}
window.TRANSMIND_SEO_F5={render:run};
let n=0;const boot=()=>{if(document.getElementById('seoBody')&&window.TRANSMIND_SEO_F4)return run();if(++n<30)setTimeout(boot,500)};boot();
})();