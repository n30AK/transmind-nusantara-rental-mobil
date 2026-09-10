const TRANSMIND_NEXUS_KEY = ['sb_publishable_', 'MycpkacWOWLwO2gXclp2Cw_ApWaeeAw'].join('');
window.NEXUS_CONFIG = {
  supabaseUrl: "https://ynigwuutmqpnfnkhlaip.supabase.co",
  supabaseAnonKey: TRANSMIND_NEXUS_KEY
};

window.addEventListener('DOMContentLoaded', () => {
  const scripts = [
    ['./enhancements.js?v=2'],
    ['./social-marketing.js?v=1'],
    ['./growth-intelligence.js?v=2'],
    ['./crud-control.js?v=1'],
    ['./manual-controls.js?v=1'],
    ['./seo-stakeholder.js?v=1'],
    ['./accounting-driver.js?v=2'],
    ['./accounting-arap.js?v=1'],
    ['./operations-command.js?v=1'],
    ['./driver-management.js?v=4'],
    ['./driver-workflow.js?v=1'],
    ['./growth-command-center.js?v=1'],
    ['./demand-supply-command-center.js?v=1'],
    ['./matching-command-center.js?v=1']
  ];
  for (const [src] of scripts) {
    const s = document.createElement('script');
    s.src = src;
    s.defer = true;
    document.head.appendChild(s);
  }
});