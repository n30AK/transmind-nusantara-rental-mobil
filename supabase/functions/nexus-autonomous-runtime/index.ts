import "jsr:@supabase/functions-js/edge-runtime.d.ts";

type Check = {
  source: string; metric: string; value_numeric?: number; value_text?: string;
  state: "DATA_AVAILABLE" | "NO_DATA" | "DATA_UNAVAILABLE" | "DATA_STALE" | "UNKNOWN";
  metadata?: Record<string, unknown>;
};

const SITE_URL = Deno.env.get("TRANSMIND_SITE_URL") ?? "https://transmindnusantararentalmobil.co.id/";
const NEXUS_URL = Deno.env.get("TRANSMIND_NEXUS_URL") ?? "https://transmindnusantararentalmobil.co.id/nexus/";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const LEGACY_RUNTIME_SECRET = Deno.env.get("NEXUS_RUNTIME_SECRET") ?? "";

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: {"content-type":"application/json","cache-control":"no-store"} });
}
async function sha256Hex(value:string) {
  const bytes=new TextEncoder().encode(value);
  const hash=await crypto.subtle.digest("SHA-256",bytes);
  return Array.from(new Uint8Array(hash)).map(b=>b.toString(16).padStart(2,"0")).join("");
}
async function auth(req:Request) {
  const provided=req.headers.get("x-nexus-runtime-secret")??"";
  if(!provided) return false;
  if(LEGACY_RUNTIME_SECRET && provided===LEGACY_RUNTIME_SECRET) return true;
  if(!SUPABASE_URL||!SERVICE_ROLE_KEY) return false;
  const r=await fetch(SUPABASE_URL+"/rest/v1/nexus_runtime_config?select=secret_sha256&config_key=eq.primary&limit=1",{headers:{apikey:SERVICE_ROLE_KEY,Authorization:"Bearer "+SERVICE_ROLE_KEY}});
  if(!r.ok) return false;
  const rows=await r.json();
  return Boolean(rows?.[0]?.secret_sha256 && rows[0].secret_sha256===await sha256Hex(provided));
}
async function probe(url:string):Promise<Check>{
  const started=performance.now();
  try{
    const r=await fetch(url,{method:"GET",redirect:"follow",headers:{"user-agent":"TransMind-NEXUS-Watchdog/1.0"}});
    const duration=Math.round(performance.now()-started);
    return {source:"WEBSITE",metric:url.includes("/nexus/")?"nexus_http_status":"site_http_status",value_numeric:r.status,state:r.ok?"DATA_AVAILABLE":"DATA_UNAVAILABLE",metadata:{url,latency_ms:duration,ok:r.ok}};
  }catch(error){return {source:"WEBSITE",metric:url.includes("/nexus/")?"nexus_http_status":"site_http_status",state:"DATA_UNAVAILABLE",metadata:{url,error:String(error)}}}
}
async function rest(path:string,init:RequestInit={}) {
  if(!SUPABASE_URL||!SERVICE_ROLE_KEY) throw new Error("Runtime database credentials are not configured.");
  const r=await fetch(SUPABASE_URL+"/rest/v1/"+path,{...init,headers:{apikey:SERVICE_ROLE_KEY,Authorization:"Bearer "+SERVICE_ROLE_KEY,"content-type":"application/json",...(init.headers??{})}});
  const body=await r.text();
  if(!r.ok) throw new Error("Supabase REST "+r.status+": "+body);
  return body?JSON.parse(body):null;
}
async function insert(table:string,payload:unknown){return rest(table,{method:"POST",headers:{Prefer:"return=minimal"},body:JSON.stringify(payload)})}
async function patch(table:string,filter:string,payload:unknown){return rest(table+"?"+filter,{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify(payload)})}

async function firstPartyAnalytics():Promise<Check[]> {
  const since=new Date(Date.now()-24*60*60*1000).toISOString();
  try {
    const rows=await rest("website_analytics_events?select=visitor_session_id,event_type,occurred_at,source,medium&occurred_at=gte."+encodeURIComponent(since)+"&limit=2000");
    const events=Array.isArray(rows)?rows:[];
    const sessions=new Set(events.map((r:any)=>r.visitor_session_id).filter(Boolean));
    const pageViews=events.filter((r:any)=>r.event_type==="page_view").length;
    const sessionStarts=events.filter((r:any)=>r.event_type==="session_start").length;
    const organicEvents=events.filter((r:any)=>String(r.source??"").toLowerCase()==="organic" || String(r.medium??"").toLowerCase()==="organic").length;
    const latest=events.reduce((m:any,r:any)=>!m||new Date(r.occurred_at)>new Date(m)?r.occurred_at:m,null);
    const state=events.length>0?"DATA_AVAILABLE":"NO_DATA";
    const meta={source:"TRANSMIND_FIRST_PARTY",window:"24h",events:events.length,sessions:sessions.size,page_views:pageViews,session_starts:sessionStarts,organic_attributed_events:organicEvents,latest_event_at:latest};
    return [
      {source:"ANALYTICS",metric:"events_24h",value_numeric:events.length,state,metadata:meta},
      {source:"ANALYTICS",metric:"sessions_24h",value_numeric:sessions.size,state,metadata:meta},
      {source:"ANALYTICS",metric:"page_views_24h",value_numeric:pageViews,state,metadata:meta},
      {source:"ANALYTICS",metric:"organic_attributed_events_24h",value_numeric:organicEvents,state,metadata:meta},
    ];
  } catch(error) {
    return [{source:"ANALYTICS",metric:"events_24h",state:"DATA_UNAVAILABLE",metadata:{source:"TRANSMIND_FIRST_PARTY",error:String(error)}}];
  }
}

function base64url(bytes:Uint8Array){let s="";for(const b of bytes)s+=String.fromCharCode(b);return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}
function utf8b64url(s:string){return base64url(new TextEncoder().encode(s))}
function pemToDer(pem:string){const clean=pem.replace(/-----BEGIN PRIVATE KEY-----/g,"").replace(/-----END PRIVATE KEY-----/g,"").replace(/\\s/g,"").replace(/\s/g,"");const bin=atob(clean);return Uint8Array.from(bin,c=>c.charCodeAt(0))}
async function createGscJwt(){const email=Deno.env.get("GSC_SERVICE_ACCOUNT_EMAIL")??"";const privateKey=Deno.env.get("GSC_SERVICE_ACCOUNT_PRIVATE_KEY")??"";if(!email||!privateKey)throw new Error("GSC credentials are not configured");const now=Math.floor(Date.now()/1000);const header=utf8b64url(JSON.stringify({alg:"RS256",typ:"JWT"}));const claim=utf8b64url(JSON.stringify({iss:email,scope:"https://www.googleapis.com/auth/webmasters.readonly",aud:"https://oauth2.googleapis.com/token",iat:now,exp:now+3600}));const input=header+"."+claim;const key=await crypto.subtle.importKey("pkcs8",pemToDer(privateKey),{name:"RSASSA-PKCS1-v1_5",hash:"SHA-256"},false,["sign"]);const sig=await crypto.subtle.sign("RSASSA-PKCS1-v1_5",key,new TextEncoder().encode(input));return input+"."+base64url(new Uint8Array(sig))}
async function gscToken(){const jwt=await createGscJwt();const r=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"content-type":"application/x-www-form-urlencoded"},body:"grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion="+encodeURIComponent(jwt)});const body=await r.text();if(!r.ok)throw new Error("Google OAuth "+r.status+": "+body);const d=JSON.parse(body);if(!d.access_token)throw new Error("Google OAuth returned no access token");return d.access_token}
async function gscQuery(token:string,dimensions:string[],startDate:string,endDate:string,rowLimit=250){const property=Deno.env.get("GSC_PROPERTY")??"sc-domain:transmindnusantararentalmobil.co.id";const endpoint="https://www.googleapis.com/webmasters/v3/sites/"+encodeURIComponent(property)+"/searchAnalytics/query";const r=await fetch(endpoint,{method:"POST",headers:{Authorization:"Bearer "+token,"content-type":"application/json"},body:JSON.stringify({startDate,endDate,dimensions,rowLimit,dataState:"final"})});const body=await r.text();if(!r.ok)throw new Error("Search Console "+r.status+": "+body);return JSON.parse(body)}
function dateDaysAgo(days:number){return new Date(Date.now()-days*86400000).toISOString().slice(0,10)}
async function searchIntelligence():Promise<Check[]>{const email=Deno.env.get("GSC_SERVICE_ACCOUNT_EMAIL")??"";const key=Deno.env.get("GSC_SERVICE_ACCOUNT_PRIVATE_KEY")??"";const property=Deno.env.get("GSC_PROPERTY")??"sc-domain:transmindnusantararentalmobil.co.id";if(!email||!key)return[{source:"SEARCH",metric:"organic_search_console",state:"UNKNOWN",metadata:{reason:"GOOGLE_SEARCH_CONSOLE_CREDENTIALS_NOT_CONFIGURED",property,required_scope:"https://www.googleapis.com/auth/webmasters.readonly"}}];try{const token=await gscToken();const start=dateDaysAgo(28),end=dateDaysAgo(1);const totals=await gscQuery(token,[],start,end,1);const queries=await gscQuery(token,["query"],start,end,50);const pages=await gscQuery(token,["page"],start,end,50);const row=totals.rows?.[0]??{};const clicks=Number(row.clicks??0),impressions=Number(row.impressions??0),ctr=Number(row.ctr??0),position=Number(row.position??0);const compact=(rows:any[])=>rows.slice(0,10).map((x:any)=>({keys:x.keys??[],clicks:x.clicks??0,impressions:x.impressions??0,ctr:x.ctr??0,position:x.position??0}));const meta={property,window:"28d",start_date:start,end_date:end,query_rows:queries.rows?.length??0,page_rows:pages.rows?.length??0,top_queries:compact(queries.rows??[]),top_pages:compact(pages.rows??[])};const state=(totals.rows?.length??0)>0?"DATA_AVAILABLE":"NO_DATA";return[{source:"SEARCH",metric:"organic_search_console",value_numeric:clicks,state,metadata:meta},{source:"SEARCH",metric:"clicks_28d",value_numeric:clicks,state,metadata:meta},{source:"SEARCH",metric:"impressions_28d",value_numeric:impressions,state,metadata:meta},{source:"SEARCH",metric:"ctr_28d",value_numeric:ctr,state,metadata:meta},{source:"SEARCH",metric:"average_position_28d",value_numeric:position,state,metadata:meta},{source:"SEARCH",metric:"top_queries_28d",value_text:JSON.stringify(meta.top_queries),state,metadata:{property,window:"28d"}},{source:"SEARCH",metric:"top_pages_28d",value_text:JSON.stringify(meta.top_pages),state,metadata:{property,window:"28d"}}]}catch(error){return[{source:"SEARCH",metric:"organic_search_console",state:"DATA_UNAVAILABLE",metadata:{property,error:String(error),required_scope:"https://www.googleapis.com/auth/webmasters.readonly"}}]}}

Deno.serve(async(req)=>{
  if(req.method!=="POST") return json({error:"POST required"},405);
  if(!await auth(req)) return json({error:"Unauthorized"},401);
  const startedAt=new Date();
  const runId="NXR-"+startedAt.toISOString().replace(/[-:.TZ]/g,"")+"-"+crypto.randomUUID().slice(0,8);
  const trigger=req.headers.get("x-nexus-trigger")??"SCHEDULED";
  try{
    await insert("nexus_runtime_runs",{run_id:runId,trigger,status:"RUNNING",summary:{phase:"WAKE"}});
    const checks=await Promise.all([probe(SITE_URL),probe(NEXUS_URL)]);
    const analytics=await firstPartyAnalytics();
    checks.push(...analytics);
    checks.push(...await searchIntelligence());
    await insert("nexus_measurements",checks.map(c=>({run_id:runId,source:c.source,metric:c.metric,value_numeric:c.value_numeric??null,value_text:c.value_text??null,state:c.state,metadata:c.metadata??{}})));
    const anomalies:Array<Record<string,any>>=[];
    const site=checks.find(c=>c.metric==="site_http_status");
    const nexus=checks.find(c=>c.metric==="nexus_http_status");
    if(site?.state!=="DATA_AVAILABLE") anomalies.push({incident_key:"SITE_UNAVAILABLE",severity:"HIGH",diagnosis:{root_cause:"website_probe_failed",confidence:0.95},evidence:site});
    if(nexus?.state!=="DATA_AVAILABLE") anomalies.push({incident_key:"NEXUS_UNAVAILABLE",severity:"HIGH",diagnosis:{root_cause:"nexus_route_probe_failed",confidence:0.95},evidence:nexus});
    for(const anomaly of anomalies){
      const existing=await rest("nexus_incidents?select=id&incident_key=eq."+encodeURIComponent(String(anomaly.incident_key))+"&state=in.(OPEN,ACKNOWLEDGED)&limit=1");
      if(!existing?.length){
        const created=await rest("nexus_incidents",{method:"POST",headers:{Prefer:"return=representation"},body:JSON.stringify({run_id:runId,incident_key:anomaly.incident_key,severity:anomaly.severity,diagnosis:anomaly.diagnosis,evidence:anomaly.evidence,confidence:anomaly.diagnosis?.confidence??null})});
        await insert("nexus_actions",{incident_id:created?.[0]?.id??null,run_id:runId,action_type:"RETEST_AND_ESCALATE",risk_level:"L1",authorization_state:"NOT_REQUIRED",execution_state:"PLANNED",plan:{steps:["probe","compare","escalate_if_persistent"],mutation:false}});
      }
    }
    const retest=await Promise.all([probe(SITE_URL),probe(NEXUS_URL)]);
    const failedAfterRetest=retest.some(c=>c.state!=="DATA_AVAILABLE");
    const finishedAt=new Date();
    const status=anomalies.length===0&&!failedAfterRetest?"PASS":"ANOMALY";
    if(anomalies.length>0){
      for(const anomaly of anomalies){
        const persisted=await rest("nexus_incidents?select=id,state&incident_key=eq."+encodeURIComponent(String(anomaly.incident_key))+"&state=in.(OPEN,ACKNOWLEDGED)&limit=1");
        const incidentId=persisted?.[0]?.id??null;
        if(incidentId){
          const persistent=failedAfterRetest;
          await patch("nexus_incidents","id=eq."+encodeURIComponent(String(incidentId)),{state:persistent?"ESCALATED":"RESOLVED",resolved_at:persistent?null:finishedAt.toISOString(),evidence:{initial:anomaly.evidence,retest,persistent}});
          await patch("nexus_actions","incident_id=eq."+encodeURIComponent(String(incidentId))+"&execution_state=eq.PLANNED",{execution_state:persistent?"VERIFIED_ESCALATION":"VERIFIED",result:{mutation:false,retest_passed:!persistent,escalated:persistent,verified_at:finishedAt.toISOString()},executed_at:finishedAt.toISOString(),verified_at:finishedAt.toISOString()});
        }
      }
    }
    await patch("nexus_runtime_runs","run_id=eq."+encodeURIComponent(runId),{finished_at:finishedAt.toISOString(),status,duration_ms:finishedAt.getTime()-startedAt.getTime(),summary:{phase:"VERIFY",checks,retest,anomalies:anomalies.length,policy:"observe-diagnose-retest-escalate; no automatic production mutation"}});
    return json({ok:true,run_id:runId,status,heartbeat:"ALIVE",autonomous_loop:["WAKE","DISCOVER","ASSESS","DIAGNOSE","PLAN","MEASURE","RETEST","VERIFY","AUDIT"],anomalies,checks,retest,mutation_performed:false});
  }catch(error){
    try{await patch("nexus_runtime_runs","run_id=eq."+encodeURIComponent(runId),{finished_at:new Date().toISOString(),status:"ERROR",summary:{phase:"ERROR",error:String(error)}})}catch(_){}
    return json({ok:false,run_id:runId,status:"ERROR",error:String(error)},500);
  }
});