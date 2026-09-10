(() => {
  const mount = () => {
    if (!window.supabase || !window.NEXUS_CONFIG) return setTimeout(mount, 500);
    const page = document.getElementById('dashboard');
    if (!page || page.dataset.execMounted) return;
    page.dataset.execMounted = '1';
    const esc = s => String(s ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
    const rup = n => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0));
    page.innerHTML = `<div class="hero"><div><div class="eyebrow">EXECUTIVE COMMAND CENTER</div><div class="title">NEXUS Executive Control</div><div class="desc">Satu pandangan Direksi untuk revenue, profit, customer, fleet, risk, action dan forecast.</div></div><div class="hero-actions"><button id="execRefresh" class="secondary">↻ Refresh</button></div></div><div id="execMsg" class="notice">Memuat executive intelligence…</div><div id="execKpi" class="grid" style="margin-top:13px"></div><div class="split"><div class="card"><h3>Booking & Revenue</h3><div id="execBooking" class="metric-stack"></div></div><div class="card"><h3>Risk & Action</h3><div id="execRisk" class="metric-stack"></div></div></div><div class="split"><div class="card"><h3>30 Hari Terakhir</h3><div id="execTrend" class="list"></div></div><div class="card"><h3>Forecast</h3><div id="execForecast" class="metric-stack"></div></div></div>`;
    const client = window.__nexusSupabase || window.supabase.createClient(window.NEXUS_CONFIG.supabaseUrl,window.NEXUS_CONFIG.supabaseAnonKey);
    const call = async (fn,args={}) => { const {data,error}=await client.rpc(fn,args); if(error) throw error; return data; };
    const row=(a,b)=>`<div class="list-row"><span>${esc(a)}</span><b>${esc(b)}</b></div>`;
    async function load(){
      const msg=document.getElementById('execMsg'); msg.textContent='Memuat data…';
      try{
        const [kpi,trend]=await Promise.all([call('nexus_executive_command_center'),call('nexus_executive_kpi_trend',{p_days:30})]);
        document.getElementById('execKpi').innerHTML=[
          ['Revenue',rup(kpi.finance.revenue),'Total booking revenue'],['Margin',rup(kpi.finance.margin),`${kpi.finance.margin_percent}% margin`],['Booking',kpi.bookings.total,'Total booking'],['Customer',kpi.crm.customers,'Customer 360'],['Fleet',`${kpi.fleet.active_units}/${kpi.fleet.units}`,'Unit aktif / total'],['Driver',kpi.fleet.active_drivers,'Driver aktif'],['Critical Risk',kpi.risk.critical,'Sinyal kritis terbuka'],['Open Action',kpi.risk.open_actions,'Management action']
        ].map(x=>`<div class="card"><div class="k-label">${esc(x[0])}</div><div class="k-value">${esc(x[1])}</div><div class="k-note">${esc(x[2])}</div></div>`).join('');
        document.getElementById('execBooking').innerHTML=[row('Menunggu',kpi.bookings.pending),row('Dikonfirmasi',kpi.bookings.confirmed),row('Berjalan',kpi.bookings.running),row('Selesai',kpi.bookings.completed),row('Dibatalkan',kpi.bookings.cancelled),row('Active assignment',kpi.fleet.active_assignments)].join('');
        document.getElementById('execRisk').innerHTML=[row('Open alerts',kpi.risk.open_alerts),row('Critical',kpi.risk.critical),row('Open management actions',kpi.risk.open_actions),row('Last 30d revenue',rup(kpi.forecast.last_30d_revenue))].join('');
        const nonzero=trend.filter(x=>Number(x.bookings)>0||Number(x.revenue)>0).slice(-10).reverse();
        document.getElementById('execTrend').innerHTML=nonzero.length?nonzero.map(x=>row(new Date(x.metric_date).toLocaleDateString('id-ID',{day:'2-digit',month:'short'}),`${x.bookings} booking · ${rup(x.revenue)}`)).join(''):`<div class="empty">Belum ada aktivitas pada periode ini.</div>`;
        document.getElementById('execForecast').innerHTML=[row('Forecast 30 hari',kpi.forecast.next_30d_revenue?rup(kpi.forecast.next_30d_revenue):'Belum tersedia'),row('Confidence',kpi.forecast.confidence?`${Number(kpi.forecast.confidence)*100}%`:'Belum tersedia'),row('Basis', 'Run-rate revenue')].join('');
        msg.className='msg ok'; msg.textContent=`Updated ${new Date(kpi.as_of).toLocaleString('id-ID')}`;
      }catch(e){ msg.className='msg bad'; msg.textContent=e.message||'Gagal memuat Executive Command Center.'; }
    }
    document.getElementById('execRefresh').addEventListener('click',load); load();
  };
  window.addEventListener('DOMContentLoaded',mount);
  setTimeout(mount,1200);
})();
