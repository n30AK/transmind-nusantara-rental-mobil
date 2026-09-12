const TRANSMIND_NEXUS_KEY = ['sb_publishable_', 'MycpkacWOWLwO2gXclp2Cw_ApWaeeAw'].join('');
window.NEXUS_CONFIG = {
  supabaseUrl: "https://ynigwuutmqpnfnkhlaip.supabase.co",
  supabaseAnonKey: TRANSMIND_NEXUS_KEY
};

window.addEventListener('DOMContentLoaded', () => {
  if (!document.querySelector('link[data-transmind-seo-print]')) {
    const css = document.createElement('link');
    css.rel = 'stylesheet';
    css.href = './seo-print.css?v=1';
    css.dataset.transmindSeoPrint = '1';
    document.head.appendChild(css);
  }
  const scripts = [
    ['./auth-recovery.js?v=3'],
    ['./enhancements.js?v=2'],
    ['./social-marketing.js?v=2'],
    ['./growth-intelligence.js?v=2'],
    ['./manual-controls.js?v=4'],
    ['./seo-stakeholder.js?v=1'],
    ['./seo-live-center.js?v=2'],
    ['./accounting-driver.js?v=2'],
    ['./accounting-arap.js?v=1'],
    ['./operations-command.js?v=1'],
    ['./driver-management.js?v=4'],
    ['./driver-workflow.js?v=1'],
    ['./growth-command-center.js?v=1'],
    ['./growth-channel-center.js?v=1'],
    ['./demand-supply-command-center.js?v=1'],
    ['./matching-command-center.js?v=1'],
    ['./executive-command-center.js?v=1'],
    ['./erp-governance.js?v=1'],
    ['./erp-master-data.js?v=1'],
    ['./production-readiness.js?v=1'],
    ['./navigation-bridge.js?v=1'],
    ['./manual-entry.js?v=2']
  ];
  scripts.forEach(([src]) => {
    const s = document.createElement('script'); s.src = src; s.defer = true; document.head.appendChild(s);
  });
});