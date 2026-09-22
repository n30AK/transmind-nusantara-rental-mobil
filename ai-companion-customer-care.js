/* TransMind AI Companion — Customer Care Bridge v1
 * Safe browser-side layer:
 * - captures WhatsApp handoff intent
 * - starts a customer-side waiting state
 * - records demand/lead signals locally and, when available, to Nexus analytics
 * - keeps human approval mandatory
 *
 * IMPORTANT: Browser code cannot read inbound WhatsApp messages. Production
 * inbound monitoring requires an authorized WhatsApp Business webhook.
 */
(function(){
  'use strict';

  const KEY = 'transmind_customer_care_v1';
  const SESSION = 'transmind_ai_session_v1';
  const WA = '628816654141';
  const WAIT_MS = 10 * 60 * 1000;

  function read(){
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch(_) { return {}; }
  }
  function write(v){
    try { localStorage.setItem(KEY, JSON.stringify(v)); } catch(_) {}
  }
  function sid(){
    try { return localStorage.getItem(SESSION) || ''; } catch(_) { return ''; }
  }
  function emit(type, detail){
    const payload = Object.assign({
      event_type: type,
      session_id: sid(),
      path: location.pathname,
      occurred_at: new Date().toISOString()
    }, detail || {});
    window.dispatchEvent(new CustomEvent('transmind:customer-care', {detail: payload}));
    try {
      const rows = JSON.parse(localStorage.getItem('transmind_ai_demand_v1') || '[]');
      rows.push(payload);
      localStorage.setItem('transmind_ai_demand_v1', JSON.stringify(rows.slice(-200)));
    } catch(_) {}
    return payload;
  }

  function saveLead(detail){
    const current = read();
    current.last_handoff = Object.assign({
      status: 'waiting_admin',
      started_at: new Date().toISOString(),
      deadline: new Date(Date.now()+WAIT_MS).toISOString()
    }, detail || {});
    write(current);
    emit('whatsapp_handoff_started', current.last_handoff);
    return current.last_handoff;
  }

  function findPanel(){
    return document.getElementById('transmind-ai-panel');
  }

  function addCareCard(){
    const panel = findPanel();
    if(!panel || document.getElementById('tm-care-card')) return;

    const card = document.createElement('div');
    card.id = 'tm-care-card';
    card.style.cssText = 'margin:0 12px 10px;padding:10px 12px;border:1px solid rgba(215,181,109,.28);border-radius:12px;background:#111;display:none;font-size:12px;line-height:1.45';
    card.innerHTML =
      '<strong style="color:#e8cf9b">Human handoff aktif</strong>' +
      '<div id="tm-care-status" style="opacity:.78;margin-top:3px"></div>' +
      '<button id="tm-care-help" type="button" style="margin-top:7px;border:1px solid rgba(215,181,109,.45);background:transparent;color:#e8cf9b;border-radius:8px;padding:6px 9px;cursor:pointer">Kembali ke AI Companion</button>';

    const form = document.getElementById('tm-ai-form');
    panel.insertBefore(card, form);

    document.getElementById('tm-care-help').addEventListener('click', function(){
      const s = read();
      s.last_handoff = Object.assign({}, s.last_handoff || {}, {status:'customer_returned_to_ai', returned_at:new Date().toISOString()});
      write(s);
      emit('customer_returned_to_ai', s.last_handoff);
      card.style.display='none';
    });
  }

  function updateCard(){
    addCareCard();
    const card=document.getElementById('tm-care-card');
    const status=document.getElementById('tm-care-status');
    if(!card || !status) return;
    const s=read(), h=s.last_handoff;
    if(!h || h.status !== 'waiting_admin'){ card.style.display='none'; return; }
    const deadline=Date.parse(h.deadline || '');
    const remaining=Math.max(0, deadline-Date.now());
    const min=Math.floor(remaining/60000);
    const sec=Math.floor((remaining%60000)/1000);
    status.textContent = remaining
      ? 'Permintaan WhatsApp tercatat. AI Companion tetap siap mendampingi Anda. Pengingat internal akan membutuhkan koneksi WhatsApp Business webhook untuk bekerja otomatis.'
      : 'Waktu tunggu melewati 10 menit. Silakan tetap gunakan AI Companion atau kirim ulang pesan ke admin.';
    card.style.display='block';
  }

  function trackWhatsApp(a){
    const href=(a.getAttribute('href')||'').toLowerCase();
    if(href.indexOf('wa.me/'+WA)!==-1 || href.indexOf('api.whatsapp.com')!==-1){
      a.addEventListener('click', function(){
        saveLead({
          channel:'whatsapp',
          href:a.href,
          source:'website',
          intent:'customer_contact_admin'
        });
        setTimeout(updateCard, 50);
      }, {passive:true});
    }
  }

  function install(){
    addCareCard();
    document.querySelectorAll('a[href*="wa.me/"],a[href*="api.whatsapp.com"]').forEach(trackWhatsApp);

    const observer=new MutationObserver(function(){
      document.querySelectorAll('a[href*="wa.me/"],a[href*="api.whatsapp.com"]').forEach(function(a){
        if(!a.dataset.tmCareBound) { a.dataset.tmCareBound='1'; trackWhatsApp(a); }
      });
    });
    observer.observe(document.body,{childList:true,subtree:true});

    setInterval(updateCard, 1000);
    updateCard();

    window.TRANSMIND_CUSTOMER_CARE = {
      getState: read,
      recordHandoff: saveLead,
      update: updateCard
    };
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',install);
  else install();
})();