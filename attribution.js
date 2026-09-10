/* =========================================================
   TRANSMIND ATTRIBUTION ENGINE — PUBLIC
   Captures first/last touch without changing public UI.
   Bridges existing create_booking() to
   create_booking_with_attribution().
   ========================================================= */
(function () {
    'use strict';

    const STORAGE_KEY = 'transmind_attribution_v1';
    const host = window.location.host;

    function clean(value, max = 500) {
        return String(value || '').trim().slice(0, max);
    }

    function classifySource(params, referrer) {
        const utmSource = clean(params.get('utm_source'), 100).toLowerCase();
        if (utmSource) return utmSource;
        if (params.get('gclid')) return 'google';
        if (params.get('fbclid')) return 'facebook';
        if (!referrer) return 'direct';

        try {
            const refHost = new URL(referrer).host.toLowerCase();
            if (!refHost || refHost === host.toLowerCase()) return 'direct';
            if (/google\.|bing\.|yahoo\.|duckduckgo\.|yandex\./i.test(refHost)) return 'organic';
            return 'referral';
        } catch (_) {
            return 'referral';
        }
    }

    function readAttribution() {
        const params = new URLSearchParams(window.location.search);
        const referrer = clean(document.referrer, 1000);
        const now = new Date().toISOString();
        const current = {
            source: classifySource(params, referrer),
            medium: clean(params.get('utm_medium'), 100),
            campaign: clean(params.get('utm_campaign'), 150),
            content: clean(params.get('utm_content'), 150),
            term: clean(params.get('utm_term'), 150),
            landing_page: clean(window.location.pathname + window.location.search, 1000),
            referrer_url: referrer,
            captured_at: now
        };

        let stored = null;
        try {
            stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
        } catch (_) {}

        if (!stored || !stored.first_touch) {
            stored = {
                first_touch: current,
                last_touch: current
            };
        } else {
            stored.last_touch = current;
        }

        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
        } catch (_) {}

        return {
            first: stored.first_touch,
            last: stored.last_touch
        };
    }

    const attribution = readAttribution();
    window.TRANSMIND_ATTRIBUTION = attribution;

    function patchSupabase() {
        if (!window.supabase || typeof window.supabase.createClient !== 'function') return;
        if (window.supabase.__transmindAttributionPatched) return;

        const originalCreateClient = window.supabase.createClient.bind(window.supabase);

        window.supabase.createClient = function () {
            const client = originalCreateClient.apply(window.supabase, arguments);
            const originalRpc = client.rpc.bind(client);

            client.rpc = function (fn, args, options) {
                if (fn !== 'create_booking' || !args) {
                    return originalRpc(fn, args, options);
                }

                const touch = attribution.first || attribution.last || {};
                const enriched = Object.assign({}, args, {
                    p_attribution_source: clean(touch.source, 100) || 'unknown',
                    p_attribution_medium: clean(touch.medium, 100),
                    p_attribution_campaign: clean(touch.campaign, 150),
                    p_attribution_content: clean(touch.content, 150),
                    p_attribution_term: clean(touch.term, 150),
                    p_landing_page: clean((attribution.first && attribution.first.landing_page) || touch.landing_page, 1000),
                    p_referrer_url: clean((attribution.first && attribution.first.referrer_url) || touch.referrer_url, 1000)
                });

                return originalRpc('create_booking_with_attribution', enriched, options);
            };

            return client;
        };

        window.supabase.__transmindAttributionPatched = true;
    }

    patchSupabase();
})();
