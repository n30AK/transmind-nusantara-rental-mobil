window.NEXUS_CONFIG = {
  supabaseUrl: "https://unbysxbtzuncifugiqql.supabase.co",
  supabaseAnonKey: "sb_publishable_VAdOaPHUniU8qRRex4anQQ_46IgVo_C"
};

// Modular NEXUS enhancement layer: loaded after the application shell is ready.
window.addEventListener('DOMContentLoaded', () => {
  const s = document.createElement('script');
  s.src = './enhancements.js?v=1';
  s.defer = true;
  document.head.appendChild(s);
});
