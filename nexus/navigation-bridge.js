/* TRANSMIND NEXUS navigation bridge
   Keeps the CRM Command Center reachable from every NEXUS workspace.
   Public frontend is untouched. */
(() => {
  const COMMAND_CENTER = './crm/';

  function addCommandCenterLink() {
    const head = document.querySelector('.side-head');
    if (!head || document.querySelector('[data-command-center-link]')) return;

    const link = document.createElement('a');
    link.href = COMMAND_CENTER;
    link.dataset.commandCenterLink = '1';
    link.setAttribute('aria-label', 'Kembali ke CRM Command Center');
    link.innerHTML = '<span aria-hidden="true">←</span><span>CRM COMMAND CENTER</span>';
    link.style.cssText = [
      'display:flex',
      'align-items:center',
      'gap:8px',
      'margin:12px 2px 0',
      'padding:9px 10px',
      'border:1px solid #3a321d',
      'border-radius:9px',
      'background:#121109',
      'color:#f0cf68',
      'text-decoration:none',
      'font-size:10px',
      'font-weight:800',
      'letter-spacing:1px',
      'transition:background .15s,border-color .15s,transform .15s'
    ].join(';');

    link.addEventListener('mouseenter', () => {
      link.style.background = '#19160c';
      link.style.borderColor = '#68551d';
      link.style.transform = 'translateX(1px)';
    });
    link.addEventListener('mouseleave', () => {
      link.style.background = '#121109';
      link.style.borderColor = '#3a321d';
      link.style.transform = 'translateX(0)';
    });

    head.appendChild(link);
  }

  function addTopbarLink() {
    const actions = document.querySelector('.top-actions');
    if (!actions || document.querySelector('[data-command-center-toplink]')) return;

    const link = document.createElement('a');
    link.href = COMMAND_CENTER;
    link.dataset.commandCenterToplink = '1';
    link.textContent = 'CRM COMMAND CENTER';
    link.style.cssText = [
      'display:inline-flex',
      'align-items:center',
      'padding:7px 10px',
      'border:1px solid #343943',
      'border-radius:999px',
      'background:#0d1015',
      'color:#cfd2d8',
      'text-decoration:none',
      'font-size:10px',
      'font-weight:800',
      'letter-spacing:.7px'
    ].join(';');

    actions.insertBefore(link, actions.firstChild);
  }

  function init() {
    addCommandCenterLink();
    addTopbarLink();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }

  // The NEXUS app builds its shell dynamically, so retry briefly without
  // polling forever. This also covers slower script/network initialization.
  let attempts = 0;
  const timer = setInterval(() => {
    init();
    attempts += 1;
    if (attempts >= 20 || document.querySelector('[data-command-center-link]')) {
      clearInterval(timer);
    }
  }, 250);
})();
