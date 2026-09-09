window.TRANSMIND_SUPABASE_URL =
    'https://unbysxbtzuncifugiqql.supabase.co';

window.TRANSMIND_SUPABASE_ANON_KEY =
    'sb_publishable_VAdOaPHUniU8qRRex4anQQ_46IgVo_C';

/* Growth Intelligence bootstrap. Anonymous public collection is intentionally
   not enabled here until a signed/rate-limited collector is available. */
window.addEventListener('DOMContentLoaded', function () {
    var s = document.createElement('script');
    s.src = './growth-live.js?v=1';
    s.defer = true;
    document.head.appendChild(s);
});