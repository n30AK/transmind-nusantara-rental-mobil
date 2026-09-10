(()=>{
  const wait=setInterval(()=>{if(!window.NXSB||!document.getElementById('growth-seo'))return;clearInterval(wait);init()},300);
  const fmt=n=>new Intl.NumberFormat('id-ID').format(Number(n||0));
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function init(){
    const page=document.getElementById('growth-seo'); if(page.querySelector('#seoStakeholderPanel'))return;
    const panel=document.createElement('div');panel.id='seoStakeholderPanel';panel.className='card';panel.style.marginTop='13px';
    panel.innerHTML=`<div class="hero" style="margin-bottom:10px"><div><div class="eyebrow">STAKEHOLDER VIEW</div><h3 style="margin:4px 0">SEO Performance Control Room</h3><div class="desc">Kinerja SEO ditampilkan hanya dari data aktual. Tidak ada angka estimasi yang disamarkan sebagai hasil.</div></div><div class="hero-actions"><button class="secondary" id="seoPrintReport">Print / PDF Report</button><button class="secondary" id="seoRefreshLive">Refresh</button></div></div><div id="seoStakeholderKpis" class="grid"></div><div id="seoStakeholderBody" class="split"></div>`;
    page.appendChild(panel);
    panel.querySelector('#seoRefreshLive').onclick=load;panel.querySelector('#seoPrintReport').onclick=()=>window.print();load();
  }
  async function load(){
    const org=(await window.NXSB.rpc('current_organization_id')).data;if(!org)return;
    const{data:rows}=await window.NXSB.from('growth_seo_metrics').select('metric_date,metric_key,metric_value,metadata').eq('organization_id',org).order('metric_date',{ascending:false}).limit(500);
    const data=rows||[];
    const latest=data[0]?.metric_date||'—';
    const get=k=>{const r=data.find(x=>x.metric_key===k);return r?Number(r.metric_value):null};
    const kpi=[['Organic clicks',get('clicks'),'Search Console'],['Impressions',get('impressions'),'Search Console'],['CTR',get('ctr')===null?null:(get('ctr')<=1?get('ctr')*100:get('ctr')),'percent'],['Avg. position',get('position'),'Search Console'],['SEO rows stored',data.length,'database'],['Latest data',latest,'date']];
    document.getElementById('seoStakeholderKpis').innerHTML=kpi.map(x=>`<div class="card"><div class="k-label">${esc(x[0])}</div><div class="k-value">${x[1]===null?'—':x[0]==='CTR'?x[1].toFixed(2)+'%':typeof x[1]==='number'?fmt(x[1]):esc(x[1])}</div><div class="k-note">${esc(x[2])}</div></div>`).join('');
    const daily={};data.forEach(r=>{daily[r.metric_date]??={};daily[r.metric_date][r.metric_key]=Number(r.metric_value)});const dates=Object.keys(daily).sort().slice(-14);
    const chart=dates.length?`<div class="card"><h3>SEO trend — 14 titik terakhir</h3>${dates.map(d=>{const v=daily[d].clicks??0;const max=Math.max(1,...dates.map(x=>daily[x].clicks??0));return `<div class="list-row"><span>${esc(d)}</span><span style="flex:1;margin:0 12px;height:8px;background:#22262e;border-radius:8px;overflow:hidden"><span style="display:block;height:100%;width:${Math.round(v/max*100)}%;background:var(--gold)"></span></span><b>${fmt(v)}</b></div>`}).join('')}</div>`:`<div class="card"><h3>Status Data</h3><div class="notice"><b>BASELINE — belum ada Search Console metrics.</b><br>Hubungkan Google Search Console untuk mengisi clicks, impressions, CTR, average position, queries, pages, country dan device. Setelah data masuk, panel ini otomatis berubah menjadi hasil aktual.</div></div>`;
    const actions=`<div class="card"><h3>Stakeholder Interpretation</h3><div class="list"><div class="list-row"><span>SEO foundation</span><b class="ok">READY</b></div><div class="list-row"><span>Attribution → booking → revenue</span><b class="ok">READY</b></div><div class="list-row"><span>Search Console data</span><b class="warn">${data.length?'CONNECTED DATA':'NOT IMPORTED'}</b></div><div class="list-row"><span>Decision quality</span><b>${data.length?'MEASURED':'BASELINE'}</b></div></div><div class="notice" style="margin-top:12px">Target manajemen: <b>SEO → Demand → Booking → Revenue</b>. Ranking dan traffic diperlakukan sebagai leading indicators, bukan tujuan akhir.</div></div>`;
    document.getElementById('seoStakeholderBody').innerHTML=chart+actions;
  }
})();