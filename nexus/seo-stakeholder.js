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
  async function load(){const session=(await window.NXSB.auth.getSession()).data.session;if(!session)return;
    const {data,error}=await window.NXSB.rpc('nexus_seo_live_metrics',{p_days:30});
    if(error){const body=document.getElementById('seoStakeholderBody');if(body)body.innerHTML='<div class="notice bad">'+esc(error.message)+'</div>';return;}
    const x=data||{},daily=Array.isArray(x.daily)?x.daily:[],sources=Array.isArray(x.sources)?x.sources:[],landing=Array.isArray(x.landing_pages)?x.landing_pages:[];
    const kpi=[['Unique visitors',x.unique_visitors??0,'actual sessions'],['Page views',x.page_views??0,'actual page views'],['Organic visitors',x.organic_visitors??0,'actual organic source'],['Organic share',Number(x.organic_share_pct||0).toFixed(2)+'%','of unique visitors'],['WhatsApp clicks',x.whatsapp_clicks??0,'actual lead signal'],['Bookings',x.bookings??0,'actual bookings']];
    document.getElementById('seoStakeholderKpis').innerHTML=kpi.map(x=>`<div class="card"><div class="k-label">${esc(x[0])}</div><div class="k-value">${typeof x[1]==='number'?fmt(x[1]):esc(x[1])}</div><div class="k-note">${esc(x[2])}</div></div>`).join('');
    const dailyRows=daily.map(r=>'<div class="list-row"><span>'+esc(r.day_label||r.day)+'</span><b>'+fmt(r.visitors||0)+'</b></div>').join('')||'<div class="empty">Belum ada data harian.</div>';
    const sourceRows=sources.map(r=>'<div class="list-row"><span>'+esc(r.source||'direct')+'</span><b>'+fmt(r.visitors||0)+'</b></div>').join('')||'<div class="empty">Belum ada source data.</div>';
    const landingRows=landing.map(r=>'<div class="list-row"><span>'+esc(r.path||'—')+'</span><b>'+fmt(r.visitors||0)+'</b></div>').join('')||'<div class="empty">Belum ada landing page data.</div>';
    document.getElementById('seoStakeholderBody').innerHTML='<div class="card"><h3>Traffic 30 Hari</h3><div class="list">'+dailyRows+'</div></div><div class="card"><h3>Sources & Landing Pages</h3><div class="list">'+sourceRows+'</div><div style="margin-top:12px">'+landingRows+'</div></div>';
  };