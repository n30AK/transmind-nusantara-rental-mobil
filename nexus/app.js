(() => {
  const cfg = window.NEXUS_CONFIG || {};
  const $ = (id) => document.getElementById(id);
  const set = (id, value) => { const el = $(id); if (el) el.textContent = value; };
  const fmt = (n) => new Intl.NumberFormat('id-ID').format(Number(n || 0));
  let sb = null;
  let session = null;

  const card = (l, v, s = '') => `<div class="card"><div class="label">${l}</div><div class="value">${v}</div><div class="muted">${s}</div></div>`;
  const permissionMap = { crm:'customer.view', booking:'booking.view', fleet:'fleet.view', network:'partner.view', finance:'finance.view', trust:'document.view', ai:'dashboard.view' };

  function message(text, cls = '') { const el = $('auth-message'); if (!el) return; el.className = `auth-message ${cls}`; el.textContent = text || ''; }
  function showApp(show) { $('login-screen')?.classList.toggle('hidden', show); $('app-shell')?.classList.toggle('hidden', !show); }
  function setUser(user, role = '') { set('user-email', user?.email || 'Authenticated user'); set('user-role', role || 'AUTHENTICATED'); }
  async function getRole() { const { data } = await sb.rpc('current_role_code'); return data || ''; }
  async function hasPermission(code) { const { data } = await sb.rpc('has_permission', { p_permission_code: code }); return data === true; }

  async function applyAccess() {
    const buttons = [...document.querySelectorAll('.nav button')];
    for (const b of buttons) {
      const code = permissionMap[b.dataset.view];
      if (!code) continue;
      b.hidden = !(await hasPermission(code));
    }
    if (document.querySelector('.nav button.active')?.hidden) document.querySelector('.nav button:not([hidden])')?.click();
  }

  async function load() {
    if (!sb || !session) return;
    try {
      const { data:d, error:e } = await sb.from('nexus_dashboard_summary').select('*').single();
      if (e) throw e;
      set('vehicle-total',fmt(d.vehicle_units_total)); set('vehicle-available',fmt(d.vehicle_units_available));
      set('booking-total',fmt(d.bookings_total)); set('booking-active',fmt(d.bookings_active));
      set('demand-total',fmt(d.demand_total)); set('demand-open',fmt(d.demand_open));
      set('customer-total',fmt(d.customers_active)); set('partner-total',fmt(d.partners_active));
      set('payment-total',fmt(d.payments_open)); set('payment-paid',fmt(d.payments_paid));
      set('task-total',fmt(d.tasks_open)); set('notification-total',fmt(d.notifications_pending)); set('connection','● LIVE DATABASE');
      const { data:p } = await sb.from('nexus_booking_pipeline').select('*');
      $('pipeline').innerHTML=(p||[]).map(x=>`<div class="bar" style="height:${Math.max(4,Math.min(140,(x.total||0)*8))}px"><span>${x.status}<br>${x.total}</span></div>`).join('')||'<span class="muted">No pipeline data</span>';
      const { data:f } = await sb.from('nexus_fleet_status').select('*');
      $('fleetstatus').innerHTML=(f||[]).map(x=>`<div class="row"><span>${x.source_type||'—'}</span><span>${x.status}</span><b>${fmt(x.total)}</b></div>`).join('')||'<span class="muted">No fleet data</span>';
      const { data:a } = await sb.from('nexus_recent_activity').select('*').order('created_at',{ascending:false}).limit(20);
      $('activity').innerHTML=(a||[]).map(x=>`<div class="row"><span class="muted">${new Date(x.created_at).toLocaleString('id-ID')}</span><span>${x.activity_type} · ${x.label||''}</span><span>${x.detail||''}</span></div>`).join('')||'<span class="muted">No activity</span>';
      await loadModules();
    } catch(e) { console.error(e); set('connection','● ACCESS DENIED'); }
  }

  async function loadModules() {
    const q=async(t)=>{ const r=await sb.from(t).select('*',{count:'exact',head:true}); return r.count||0; };
    $('crmdata').innerHTML=card('Customers',fmt(await q('customers')),'CRM master');
    $('bookingdata').innerHTML=card('Bookings',fmt(await q('bookings')),'Reservation engine')+card('Demand',fmt(await q('demand_requests')),'Demand engine')+card('Attributions',fmt(await q('booking_attributions')),'Agent attribution');
    $('fleetdata').innerHTML=card('Vehicle Units',fmt(await q('vehicle_units')),'Supply')+card('Vehicle Types',fmt(await q('vehicle_types')),'Catalog');
    $('networkdata').innerHTML=card('Partners',fmt(await q('partners')),'Network')+card('Agents',fmt(await q('agents')),'Distribution');
    $('financedata').innerHTML=card('Payments',fmt(await q('payments')),'Payment engine')+card('Settlements',fmt(await q('settlements')),'Settlement')+card('Expenses',fmt(await q('expenses')),'ERP');
    $('trustdata').innerHTML=card('Documents',fmt(await q('documents')),'Document engine')+card('Verifications',fmt(await q('document_verifications')),'Trust');
    $('aidata').innerHTML=card('Advice Rules',fmt(await q('advice_rules')),'Decision intelligence')+card('Advice Events',fmt(await q('advice_events')),'Feedback loop')+card('SEO Queue',fmt(await q('seo_content_queue')),'Content intelligence');
  }

  async function signIn(ev) {
    ev.preventDefault(); message('Authenticating…');
    const email=$('login-email').value.trim(), password=$('login-password').value;
    const { data,error }=await sb.auth.signInWithPassword({email,password});
    if(error){message('Login gagal. Periksa email/password atau akun belum diaktifkan.','err');return;}
    session=data.session; const role=await getRole(); const allowed=await hasPermission('dashboard.view');
    if(!allowed){await sb.auth.signOut();session=null;message('Akun berhasil login, tetapi belum memiliki akses NEXUS.','err');return;}
    setUser(session.user,role); message(''); showApp(true); await applyAccess(); await load();
  }
  async function signOut(){await sb.auth.signOut();session=null;showApp(false);message('Anda telah keluar.');}

  async function boot(){
    if(!cfg.supabaseUrl||!cfg.supabaseAnonKey||cfg.supabaseAnonKey.includes('YOUR_')){showApp(false);message('NEXUS_CONFIG belum dikonfigurasi.','err');return;}
    sb=supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
    $('login-form')?.addEventListener('submit',signIn); $('logout')?.addEventListener('click',signOut);
    document.querySelectorAll('.nav button').forEach(b=>b.onclick=()=>{document.querySelectorAll('.nav button').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));$(b.dataset.view)?.classList.add('active');});
    const {data}=await sb.auth.getSession();
    if(data.session){session=data.session;const role=await getRole();if(await hasPermission('dashboard.view')){setUser(session.user,role);showApp(true);await applyAccess();await load();}else await sb.auth.signOut();}
    sb.auth.onAuthStateChange((_event,s)=>{session=s;if(!s)showApp(false);});
    setInterval(()=>session&&load(),60000);
  }
  window.NEXUS_LOAD=load; boot();
})();
