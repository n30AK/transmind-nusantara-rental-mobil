const TRANSMIND_NEXUS_KEY = ['sb_publishable_', 'MycpkacWOWLwO2gXclp2Cw_ApWaeeAw'].join('');
window.NEXUS_CONFIG = {
  supabaseUrl: "https://ynigwuutmqpnfnkhlaip.supabase.co",
  supabaseAnonKey: TRANSMIND_NEXUS_KEY
};

const NEXUS_PROTECTED_SCRIPTS = [
  './integrated-crud.js?v=20260922-7',
  './seo-f1-engine.js?v=20260925-2',
  './seo-f4-engine.js?v=20260924-1',
  './seo-f5-engine.js?v=20260924-1',
  './booking-growth-engine.js?v=20260925-1',
  './customer-care-autopilot.js?v=20260925-2',
  './ai-customer-care-growth-loop.js?v=20260925-2',
  './ai-customer-service-console.js?v=20260925-2',
  './customer-care-outcome-learning.js?v=20260925-1',
  './enhancements.js?v=2',
  './social-marketing.js?v=2',
  './growth-intelligence.js?v=2',
  './seo-stakeholder.js?v=3',
  './seo-live-center.js?v=2',
  './accounting-driver.js?v=4',
  './accounting-arap.js?v=2',
  './operations-command.js?v=1',
  './driver-management.js?v=4',
  './driver-workflow.js?v=1',
  './growth-command-center.js?v=1',
  './growth-channel-center.js?v=1',
  './demand-supply-command-center.js?v=1',
  './matching-command-center.js?v=1',
  './executive-command-center.js?v=1',
  './erp-governance.js?v=1',
  './erp-master-data.js?v=1',
  './production-readiness.js?v=1',
  './navigation-bridge.js?v=1',
  './manual-entry.js?v=4',
  './ai-customer-care.js?v=20260924-1',
  './ai-customer-service-console.js?v=20260925-2',
  './customer-care-outcome-learning.js?v=20260925-2',
  './ai-customer-care-growth-loop.js?v=20260925-3',
  './ai-customer-service-engine.js?v=20260925-2'
];

function loadNexusScript(src){
  if(document.querySelector('script[data-nexus-src="'+src.replace(/"/g,'&quot;')+'"]')) return;
  const s=document.createElement('script');
  s.src=src;
  s.dataset.nexusSrc=src;
  s.defer=true;
  document.head.appendChild(s);
}

function loadNexusProtectedModules(){
  if(window.__NEXUS_PROTECTED_MODULES_LOADED) return;
  window.__NEXUS_PROTECTED_MODULES_LOADED=true;
  NEXUS_PROTECTED_SCRIPTS.forEach(loadNexusScript);
}

function loadAuthRecovery(){
  loadNexusScript('./auth-recovery.js?v=4');
}

if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',loadAuthRecovery,{once:true});
}else{
  loadAuthRecovery();
}
window.addEventListener('nexus:authenticated',loadNexusProtectedModules,{once:true});

function nexusAccessValue(data){
  const row = Array.isArray(data) ? (data[0] || {}) : (data || {});
  if (typeof row === 'boolean') return row;
  if (typeof row === 'string') return row;
  if (row && typeof row === 'object') {
    if (typeof row.allowed === 'boolean') return row.allowed;
    if (typeof row.has_access === 'boolean') return row.has_access;
    if (typeof row.access === 'boolean') return row.access;
    if (typeof row.authorized === 'boolean') return row.authorized;
    if (typeof row.can_access === 'boolean') return row.can_access;
    if (Array.isArray(row.permissions)) return row.permissions;
    if (typeof row.permission_code === 'string') return [row.permission_code];
    if (typeof row.role_code === 'string') return row.role_code;
    if (typeof row.role === 'string') return row.role;
  }
  return data;
}

function nexusHasDashboardAccess(data){
  const v=nexusAccessValue(data);
  if(v===true) return true;
  if(Array.isArray(v)) return v.some(x=>String(x).toLowerCase()==='dashboard.view');
  if(typeof v==='string') return v.length>0;
  return false;
}

window.getTransmindSupabaseClient = function(){
  if (window.transmindSupabase) return window.transmindSupabase;
  if (!window.NEXUS_CONFIG?.supabaseUrl || !window.NEXUS_CONFIG?.supabaseAnonKey || !window.supabase) return null;
  const raw = window.supabase.createClient(window.NEXUS_CONFIG.supabaseUrl, window.NEXUS_CONFIG.supabaseAnonKey, {
    auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
  });
  const originalRpc = raw.rpc.bind(raw);
  raw.rpc = async function(name,args){
    const result = await originalRpc(name,args);
    if(name==='current_role_code' && result.error){
      const fallback = await originalRpc('nexus_my_access');
      if(!fallback.error){
        const value=nexusAccessValue(fallback.data);
        return {data:Array.isArray(value)?null:(typeof value==='string'?value:(value?.role_code||value?.role||null)),error:null};
      }
    }
    if(name==='has_permission' && (result.error || result.data!==true) && args?.p_permission_code==='dashboard.view'){
      const fallback = await originalRpc('nexus_my_access');
      if(!fallback.error && nexusHasDashboardAccess(fallback.data)) return {data:true,error:null};
    }
    return result;
  };
  window.transmindSupabase=raw;
  return raw;
};
