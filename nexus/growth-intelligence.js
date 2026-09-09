/* TRANSMIND GROWTH INTELLIGENCE — specialized agent foundation */
(() => {
  const wait = setInterval(() => {
    if (!window.NXSB || !document.getElementById('pages') || !document.getElementById('nav')) return;
    clearInterval(wait);
    init();
  }, 250);

  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const q = s => String(s ?? '').trim();

  function addNav() {
    const nav = document.getElementById('nav');
    if (nav.querySelector('[data-growth-main]')) return;
    const sec = document.createElement('div');
    sec.className = 'nav-section';
    sec.innerHTML = `<button class="nav-main" data-growth-main><span>🧠</span><span>Growth Intelligence</span><span class="arrow">›</span></button><div class="submenu">
      <button data-page="growth-dashboard">Growth Dashboard</button>
      <button data-page="growth-prospects">Prospect Intelligence</button>
      <button data-page="growth-seo">SEO AI Agent</button>
      <button data-page="growth-policy">Policy & Safety</button>
      <button data-page="growth-revenue">Growth Revenue</button>
    </div>`;
    nav.appendChild(sec);
    sec.querySelector('[data-growth-main]').addEventListener('click', () => sec.classList.toggle('open'));
    sec.querySelectorAll('[data-page]').forEach(b => b.addEventListener('click', () => window.NX_GROWTH.open(b.dataset.page)));
  }

  function page(id, html) {
    const pages = document.getElementById('pages');
    if (pages.querySelector('#' + id)) return;
    const el = document.createElement('section'); el.className = 'page'; el.id = id; el.innerHTML = html; pages.appendChild(el);
  }

  function render() {
    page('growth-dashboard', `<div class="hero"><div><div class="eyebrow">TRANSMIND AI AGENT</div><div class="title">Growth Intelligence</div><div class="desc">Radar terintegrasi untuk SEO, market signals, prospect intelligence, policy safety, social growth, dan revenue attribution. Data aktual saja; tidak ada metrik fiktif.</div></div><div class="hero-actions"><button class="primary" id="growthRefresh">Run Health Scan</button></div></div><div class="grid" id="growthKpis"></div><div class="split"><div class="card"><h3>AI Action Queue</h3><div id="growthActions" class="list"></div></div><div class="card"><h3>Agent Status</h3><div class="metric-stack"><div class="list-row"><span>SEO Agent</span><b class="ok">READY</b></div><div class="list-row"><span>Prospect Agent</span><b class="ok">READY</b></div><div class="list-row"><span>Policy Guardian</span><b class="ok">READY</b></div><div class="list-row"><span>Revenue Intelligence</span><b class="ok">READY</b></div></div></div></div>`);
    page('growth-prospects', `<div class="hero"><div><div class="eyebrow">PROSPECT INTELLIGENCE</div><div class="title">Prospect Radar</div><div class="desc">Prospek bisnis berbasis sinyal publik yang dapat ditelusuri. Agent tidak mengambil data privat atau melewati kontrol platform.</div></div></div><div class="toolbar"><input id="prospectSearch" placeholder="Cari nama, industri, lokasi, sinyal..."><button class="secondary" id="prospectRefresh">Refresh</button></div><div class="card"><div class="table" id="prospectTable"></div></div>`);
    page('growth-seo', `<div class="hero"><div><div class="eyebrow">SEO AI AGENT</div><div class="title">SEO Intelligence</div><div class="desc">Fondasi agent untuk technical SEO, Search Console, keyword intelligence, local SEO, content governance, dan SEO-to-revenue.</div></div></div><div class="grid"><div class="card"><div class="k-label">SEO metrics stored</div><div class="k-value" id="seoMetricCount">0</div><div class="k-note">Belum ada data eksternal yang diimpor.</div></div><div class="card"><div class="k-label">Policy events</div><div class="k-value" id="seoPolicyCount">0</div><div class="k-note">Monitor resmi siap dihubungkan.</div></div><div class="card"><div class="k-label">Prospect signals</div><div class="k-value" id="seoProspectCount">0</div><div class="k-note">Sumber publik + scoring.</div></div><div class="card"><div class="k-label">Autonomy</div><div class="k-value">SAFE</div><div class="k-note">Read/analyze/recommend sebelum publish.</div></div></div><div class="card" style="margin-top:13px"><h3>Agent Guardrails</h3><div class="notice">Tidak melakukan keyword stuffing, cloaking, fake backlinks, traffic manipulation, fake engagement, private-data scraping, atau tindakan yang mencoba menghindari kebijakan platform.</div></div>`);
    page('growth-policy', `<div class="hero"><div><div class="eyebrow">POLICY & SAFETY</div><div class="title">Digital Risk Center</div><div class="desc">Satu tempat untuk memantau perubahan kebijakan dan risiko Google, AdSense, TikTok, X, serta kanal digital lain.</div></div></div><div class="card"><div id="policyTable" class="list"></div></div>`);
    page('growth-revenue', `<div class="hero"><div><div class="eyebrow">REVENUE INTELLIGENCE</div><div class="title">Growth Revenue</div><div class="desc">Menghubungkan campaign/prospect/SEO dengan booking dan pembayaran aktual. Budget bukan expense; revenue hanya dari payment yang terealisasi.</div></div></div><div class="grid" id="growthRevenueKpis"></div>`);
  }

  async function orgId() {
    const { data } = await window.NXSB.rpc('current_organization_id');
    return data || null;
  }

  async function loadDashboard() {
    const org = await orgId();
    if (!org) return;
    const [p,m,pol,runs] = await Promise.all([
      window.NXSB.from('growth_prospects').select('id,prospect_score,status').eq('organization_id',org),
      window.NXSB.from('growth_seo_metrics').select('id',{count:'exact',head:true}).eq('organization_id',org),
      window.NXSB.from('growth_policy_events').select('id,severity,status').eq('organization_id',org),
      window.NXSB.from('growth_agent_runs').select('id,status,started_at,items_flagged').eq('organization_id',org).order('started_at',{ascending:false}).limit(5)
    ]);
    const prospects=p.data||[], policies=pol.data||[], flagged=policies.filter(x=>x.status==='OPEN' && ['HIGH','CRITICAL'].includes(x.severity)).length;
    document.getElementById('growthKpis').innerHTML = [['Prospects',prospects.length,'signals tersimpan'],['Hot Prospects',prospects.filter(x=>x.prospect_score>=75).length,'score ≥ 75'],['SEO Metrics',m.count||0,'data aktual tersimpan'],['Policy Risk',flagged,'HIGH/CRITICAL open']].map(x=>`<div class="card"><div class="k-label">${x[0]}</div><div class="k-value">${x[1]}</div><div class="k-note">${x[2]}</div></div>`).join('');
    document.getElementById('growthActions').innerHTML = flagged ? `<div class="list-row"><span>Review policy events berisiko tinggi</span><b class="warn">${flagged}</b></div>` : `<div class="empty">Belum ada action berisiko tinggi.</div>`;
  }

  async function loadProspects() {
    const org=await orgId(); if(!org) return;
    const term=q(document.getElementById('prospectSearch')?.value).toLowerCase();
    const {data,error}=await window.NXSB.from('growth_prospects').select('*').eq('organization_id',org).order('prospect_score',{ascending:false}).limit(100);
    if(error){document.getElementById('prospectTable').innerHTML=`<div class="empty">${esc(error.message)}</div>`;return;}
    const rows=(data||[]).filter(x=>!term || [x.name,x.industry,x.location,x.signal_type,x.signal_summary].join(' ').toLowerCase().includes(term));
    document.getElementById('prospectTable').innerHTML = `<div class="tr th"><span>Score</span><span>Prospect</span><span>Signal</span><span>Service</span><span>Status</span></div>` + (rows.length?rows.map(x=>`<div class="tr"><span><b>${x.prospect_score}</b>/100</span><span><b>${esc(x.name)}</b><small>${esc(x.industry||'')} · ${esc(x.location||'')}</small></span><span>${esc(x.signal_type||'—')}<small>${esc(x.signal_summary||'')}</small></span><span>${esc(x.recommended_service||'—')}</span><span class="chip">${esc(x.status)}</span></div>`).join(''):`<div class="empty">Belum ada prospect signal.</div>`);
  }

  async function loadPolicy(){const org=await orgId();if(!org)return;const {data}=await window.NXSB.from('growth_policy_events').select('*').eq('organization_id',org).order('detected_at',{ascending:false}).limit(50);document.getElementById('policyTable').innerHTML=(data||[]).length?(data||[]).map(x=>`<div class="list-row"><span><b>${esc(x.platform)}</b> · ${esc(x.title||x.event_type||'Policy event')}<small>${esc(x.summary||'')}</small></span><b>${esc(x.severity)}</b></div>`).join(''):`<div class="empty">Belum ada policy event. Sumber resmi akan dihubungkan pada connector agent.</div>`;}

  async function loadSeo(){const org=await orgId();if(!org)return;const [m,p]=await Promise.all([window.NXSB.from('growth_seo_metrics').select('id',{count:'exact',head:true}).eq('organization_id',org),window.NXSB.from('growth_prospects').select('id',{count:'exact',head:true}).eq('organization_id',org)]);document.getElementById('seoMetricCount').textContent=m.count||0;document.getElementById('seoProspectCount').textContent=p.count||0;const pol=await window.NXSB.from('growth_policy_events').select('id',{count:'exact',head:true}).eq('organization_id',org);document.getElementById('seoPolicyCount').textContent=pol.count||0;}

  async function loadRevenue(){const org=await orgId();if(!org)return;const [{data:attr},{data:spend}]=await Promise.all([window.NXSB.from('marketing_attributions').select('booking_id').eq('organization_id',org),window.NXSB.from('marketing_spend').select('amount').eq('organization_id',org).eq('status','POSTED')]);const ids=[...new Set((attr||[]).map(x=>x.booking_id))];let paid=0;if(ids.length){const {data}=await window.NXSB.from('payments').select('amount').eq('organization_id',org).in('booking_id',ids).not('paid_at','is',null);paid=(data||[]).reduce((a,x)=>a+Number(x.amount||0),0);}const cost=(spend||[]).reduce((a,x)=>a+Number(x.amount||0),0);const roas=cost?paid/cost:null;document.getElementById('growthRevenueKpis').innerHTML=[['Attributed bookings',ids.length,'booking aktual'],['Paid revenue',new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(paid),'payment paid_at terisi'],['Posted marketing spend',new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(cost),'expense-linked spend'],['ROAS',roas===null?'—':roas.toFixed(2)+'×','belum dihitung tanpa spend']].map(x=>`<div class="card"><div class="k-label">${x[0]}</div><div class="k-value">${x[1]}</div><div class="k-note">${x[2]}</div></div>`).join('');}

  function open(id){document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));const el=document.getElementById(id);if(!el)return;el.classList.add('active');document.querySelectorAll('.submenu button').forEach(b=>b.classList.toggle('active',b.dataset.page===id));document.querySelector('[data-growth-main]')?.closest('.nav-section')?.classList.add('open');document.getElementById('breadcrumb').textContent='Growth Intelligence / '+(id.replace('growth-','').replace(/-/g,' '));if(id==='growth-dashboard')loadDashboard();if(id==='growth-prospects')loadProspects();if(id==='growth-seo')loadSeo();if(id==='growth-policy')loadPolicy();if(id==='growth-revenue')loadRevenue();}

  function init(){addNav();render();document.getElementById('growthRefresh').onclick=loadDashboard;document.getElementById('prospectRefresh').onclick=loadProspects;document.getElementById('prospectSearch').oninput=loadProspects;window.NX_GROWTH={open};}
})();
