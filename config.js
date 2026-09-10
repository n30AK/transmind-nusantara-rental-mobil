window.TRANSMIND_SUPABASE_URL =
    'https://ynigwuutmqpnfnkhlaip.supabase.co';

window.TRANSMIND_SUPABASE_ANON_KEY =
    'sb_publishable_MycpkacWOWLwO2gXclp2Cw_ApWaeeAw';

/* =========================================================
   TRANSMIND ATTRIBUTION ENGINE
   Invisible first-touch / last-touch capture.
   No public UI changes.
   ========================================================= */
(function () {
    'use strict';

    var STORAGE_KEY = 'transmind_attribution_v1';
    var host = window.location.host;

    function clean(value, max) {
        return String(value || '').trim().slice(0, max || 500);
    }

    function classifySource(params, referrer) {
        var utmSource = clean(params.get('utm_source'), 100).toLowerCase();
        if (utmSource) return utmSource;
        if (params.get('gclid')) return 'google';
        if (params.get('fbclid')) return 'facebook';
        if (!referrer) return 'direct';
        try {
            var refHost = new URL(referrer).host.toLowerCase();
            if (!refHost || refHost === host.toLowerCase()) return 'direct';
            if (/google\\.|bing\\.|yahoo\\.|duckduckgo\\.|yandex\\./i.test(refHost)) return 'organic';
            return 'referral';
        } catch (_) {
            return 'referral';
        }
    }

    var params = new URLSearchParams(window.location.search);
    var referrer = clean(document.referrer, 1000);
    var current = {
        source: classifySource(params, referrer),
        medium: clean(params.get('utm_medium'), 100),
        campaign: clean(params.get('utm_campaign'), 150),
        content: clean(params.get('utm_content'), 150),
        term: clean(params.get('utm_term'), 150),
        landing_page: clean(window.location.pathname + window.location.search, 1000),
        referrer_url: referrer,
        captured_at: new Date().toISOString()
    };

    var stored = null;
    try {
        stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    } catch (_) {}

    if (!stored || !stored.first_touch) {
        stored = { first_touch: current, last_touch: current };
    } else {
        stored.last_touch = current;
    }

    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
    } catch (_) {}

    window.TRANSMIND_ATTRIBUTION = stored;

    /* Patch Supabase before app.js initializes its client. */
    if (window.supabase && typeof window.supabase.createClient === 'function') {
        var originalCreateClient = window.supabase.createClient.bind(window.supabase);

        window.supabase.createClient = function () {
            var client = originalCreateClient.apply(window.supabase, arguments);
            var originalRpc = client.rpc.bind(client);

            client.rpc = function (fn, args, options) {
                if (fn !== 'create_booking' || !args) {
                    return originalRpc(fn, args, options);
                }

                var touch = stored.first_touch || stored.last_touch || {};
                var enriched = Object.assign({}, args, {
                    p_attribution_source: clean(touch.source, 100) || 'unknown',
                    p_attribution_medium: clean(touch.medium, 100),
                    p_attribution_campaign: clean(touch.campaign, 150),
                    p_attribution_content: clean(touch.content, 150),
                    p_attribution_term: clean(touch.term, 150),
                    p_landing_page: clean((stored.first_touch && stored.first_touch.landing_page) || touch.landing_page, 1000),
                    p_referrer_url: clean((stored.first_touch && stored.first_touch.referrer_url) || touch.referrer_url, 1000)
                });

                return originalRpc('create_booking_with_attribution', enriched, options);
            };

            return client;
        };
    }

    /* Existing optional live-content hooks. */
    window.addEventListener('DOMContentLoaded', function () {
        var w = document.createElement('script');
        w.src = './website-live.js?v=2';
        w.defer = true;
        document.head.appendChild(w);
    });
})();
