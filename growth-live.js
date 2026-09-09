/* TRANSMIND GROWTH LIVE — safe first-party attribution bootstrap */
(function () {
  'use strict';
  var KEY = 'transmind_growth_attribution_v1';
  var params = new URLSearchParams(window.location.search);
  var names = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'];
  var current = {};
  names.forEach(function (name) {
    var value = params.get(name);
    if (value) current[name] = value.slice(0, 200);
  });
  current.landing_path = window.location.pathname;
  current.captured_at = new Date().toISOString();
  if (Object.keys(current).some(function (k) { return k.indexOf('utm_') === 0; })) {
    try { localStorage.setItem(KEY, JSON.stringify(current)); } catch (_) {}
  }

  function getAttribution() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (_) { return {}; }
  }

  function injectBookingAttribution() {
    var forms = document.querySelectorAll('form');
    forms.forEach(function (form) {
      if (form.dataset.growthAttributionBound === '1') return;
      form.dataset.growthAttributionBound = '1';
      form.addEventListener('submit', function () {
        var a = getAttribution();
        var bits = [];
        if (a.utm_source) bits.push('source=' + a.utm_source);
        if (a.utm_medium) bits.push('medium=' + a.utm_medium);
        if (a.utm_campaign) bits.push('campaign=' + a.utm_campaign);
        if (a.utm_content) bits.push('content=' + a.utm_content);
        if (a.utm_term) bits.push('term=' + a.utm_term);
        if (!bits.length) return;
        var notes = form.querySelector('#notes, textarea[name="notes"], textarea[name="catatan"]');
        if (notes) {
          var marker = '[Growth Attribution: ' + bits.join(' | ') + ']';
          if (String(notes.value || '').indexOf('[Growth Attribution:') === -1) {
            notes.value = (notes.value ? notes.value + '\n' : '') + marker;
          }
        }
        window.TRANSMIND_GROWTH_ATTRIBUTION = a;
      }, true);
    });
  }

  injectBookingAttribution();
  new MutationObserver(injectBookingAttribution).observe(document.documentElement, { childList: true, subtree: true });
  window.TRANSMIND_GROWTH_ATTRIBUTION = getAttribution();
  console.log('TRANSMIND GROWTH LIVE aktif', window.TRANSMIND_GROWTH_ATTRIBUTION);
})();