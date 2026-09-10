window.NEXUS_CONFIG = {
  supabaseUrl: "https://ynigwuutmqpnfnkhlaip.supabase.co",
  supabaseAnonKey: "sb_publishable_VAdOaPHUniU8qRRex4anQQ_46IgVo_C"
};

window.addEventListener('DOMContentLoaded', () => {
  const scripts = [
    ['./enhancements.js?v=2'],
    ['./social-marketing.js?v=1'],
    ['./growth-intelligence.js?v=2'],
    ['./crud-control.js?v=1'],
    ['./seo-stakeholder.js?v=1'],
    ['./accounting-driver.js?v=2'],
    ['./accounting-arap.js?v=1']
  ];
  for (const [src] of scripts) {
    const s = document.createElement('script');
    s.src = src;
    s.defer = true;
    document.head.appendChild(s);
  }
});
