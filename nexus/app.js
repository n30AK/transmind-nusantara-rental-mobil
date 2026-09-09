(() => {
  const cfg = window.NEXUS_CONFIG || {};
  const $ = (id) => document.getElementById(id);
  const set = (id, value) => { const el = $(id); if (el) el.textContent = value; };
  const fmt = (n) => new Intl.NumberFormat('id-ID').format(Number(n || 0));
  async function load() {
    if (!cfg.supabaseUrl || !cfg.supabaseAnonKey || cfg.supabaseAnonKey.includes('YOUR_')) {
      set('connection','CONFIG REQUIRED'); return;
    }
    try {
      const r = await fetch(`${cfg.supabaseUrl}/rest/v1/nexus_dashboard_summary?select=*`, {
        headers:{apikey:cfg.supabaseAnonKey,Authorization:`Bearer ${cfg.supabaseAnonKey}`}
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d=(await r.json())[0]||{};
      set('vehicle-total',fmt(d.vehicle_units_total)); set('vehicle-available',fmt(d.vehicle_units_available));
      set('booking-total',fmt(d.bookings_total)); set('booking-active',fmt(d.bookings_active));
      set('demand-total',fmt(d.demand_total)); set('demand-open',fmt(d.demand_open));
      set('customer-total',fmt(d.customers_active)); set('partner-total',fmt(d.partners_active));
      set('payment-total',fmt(d.payments_open)); set('payment-paid',fmt(d.payments_paid));
      set('task-total',fmt(d.tasks_open)); set('notification-total',fmt(d.notifications_pending));
      set('connection','LIVE DATABASE');
    } catch(e) { console.error(e); set('connection','DATABASE ERROR'); }
  }
  window.NEXUS_LOAD=load; load();
  setInterval(load,60000);
})();
