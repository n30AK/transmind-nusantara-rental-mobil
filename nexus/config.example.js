// Copy to config.js only in the Nexus deployment environment.
// Never put a Supabase service_role/secret key here.
window.NEXUS_CONFIG = {
  supabaseUrl: 'https://YOUR_PROJECT_REF.supabase.co',
  supabaseAnonKey: 'YOUR_SUPABASE_ANON_KEY'
};
