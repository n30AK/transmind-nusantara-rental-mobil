/* TRANSMIND GROWTH LIVE — first-party attribution + intent persistence
   Real-data only. No synthetic leads/bookings.
*/
(function () {
  'use strict';

  var KEY = 'transmind_growth_attribution_v2';
  var INTENT_KEY = 'transmind_growth_intent_v1';
  var params = new URLSearchParams(window.location.search);
  var names = ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'];
  var current = {};

  names.forEach(function (name) {
    var value = params.get(name);
    if (value) current[name] = value.slice(0, 200);
  });

  var existing = {};
  try { existing = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (_) {}

  if (!current.utm_source && existing.utm_source) current = existing;
  current.landing_path = current.landing_path || window.location.pathname;
  current.landing_url = current.landing_url || window.location.href.slice(0, 1000);
  current.captured_at = current.captured_at || new Date().toISOString();

  if (Object.keys(current).some(function (k) { return k.indexOf('utm_') === 0; })) {
    try { localStorage.setItem(KEY, JSON.stringify(current)); } catch (_) {}
  }

  function getAttribution() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (_) { return {}; }
  }

  function getIntent() {
    try { return JSON.parse(localStorage.getItem(INTENT_KEY) || '{}'); } catch (_) { return {}; }
  }

  function saveIntent(patch) {
    var intent = getIntent();
    Object.keys(patch || {}).forEach(function (key) {
      if (patch[key] !== undefined && patch[key] !== null && patch[key] !== '') {
        intent[key] = String(patch[key]).slice(0, 300);
      }
    });
    intent.updated_at = new Date().toISOString();
    try { localStorage.setItem(INTENT_KEY, JSON.stringify(intent)); } catch (_) {}
    window.TRANSMIND_GROWTH_INTENT = intent;
    return intent;
  }

  function injectBookingAttribution() {
    document.querySelectorAll('form').forEach(function (form) {
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
        if (bits.length) {
          var notes = form.querySelector('#notes, textarea[name="notes"], textarea[name="catatan"]');
          if (notes) {
            var marker = '[Growth Attribution: ' + bits.join(' | ') + ']';
            if (String(notes.value || '').indexOf('[Growth Attribution:') === -1) {
              notes.value = (notes.value ? notes.value + '\n' : '') + marker;
            }
          }
        }

        var vehicle = form.querySelector('#vehicle');
        var service = form.querySelector('#service');
        var area = form.querySelector('#area');
        var start = form.querySelector('#start');
        var end = form.querySelector('#end');
        saveIntent({
          intent_stage: 'booking_submit',
          vehicle: vehicle && vehicle.value,
          service: service && service.value,
          area: area && area.value,
          start_date: start && start.value,
          end_date: end && end.value
        });
        window.TRANSMIND_GROWTH_ATTRIBUTION = getAttribution();
      }, true);
    });
  }

  function boot() {
    document.addEventListener('change', function (e) {
      var el = e.target;
      if (!el || !el.id) return;

      if (el.id === 'vehicle') saveIntent({ intent_stage: 'vehicle_selected', vehicle: el.value });
      if (el.id === 'service') saveIntent({ service: el.value });
      if (el.id === 'area') saveIntent({ area: el.value });
      if (el.id === 'start') saveIntent({ start_date: el.value });
      if (el.id === 'end') saveIntent({ end_date: el.value });
    }, true);

    document.addEventListener('click', function (e) {
      var el = e.target && e.target.closest ? e.target.closest('a,button') : null;
      if (!el) return;

      var href = el.getAttribute('href') || '';
      var text = String(el.textContent || '').trim().slice(0, 120);

      if (/wa\.me|whatsapp/i.test(href + ' ' + text)) {
        saveIntent({ intent_stage: 'whatsapp_click', cta: text, whatsapp_href: href });
      }

      if (href.indexOf('#booking') !== -1 || /booking/i.test(text)) {
        saveIntent({ intent_stage: 'booking_cta_click', cta: text, landing_path: window.location.pathname });
      }
    }, true);
  }

  injectBookingAttribution();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();

  if (window.MutationObserver) {
    new MutationObserver(injectBookingAttribution).observe(document.documentElement, { childList: true, subtree: true });
  }

  window.TRANSMIND_GROWTH_ATTRIBUTION = getAttribution();
  window.TRANSMIND_GROWTH_INTENT = getIntent();
})();