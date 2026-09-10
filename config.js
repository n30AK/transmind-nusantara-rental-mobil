window.TRANSMIND_SUPABASE_URL =
    'https://unbysxbtzuncifugiqql.supabase.co';

window.TRANSMIND_SUPABASE_ANON_KEY =
    'sb_publishable_VAdOaPHUniU8qRRex4anQQ_46IgVo_C';

/* Growth + NEXUS live content bootstrap. */
window.addEventListener('DOMContentLoaded', function () {
    var g = document.createElement('script');
    g.src = './growth-live.js?v=1';
    g.defer = true;
    document.head.appendChild(g);

    var w = document.createElement('script');
    w.src = './website-live.js?v=1';
    w.defer = true;
    document.head.appendChild(w);
});