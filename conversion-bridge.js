/* TRANSMIND CONVERSION BRIDGE
   Public funnel telemetry only. No visual changes, no prices, no customer PII.
*/
(function(){
  'use strict';
  var EVENT_TABLE='website_analytics_events';
  function sid(){return window.TRANSMIND_VISITOR_SESSION_ID||''}
  function clean(v,n){return String(v==null?'':v).slice(0,n||300)}
  function track(type,meta){
    try{
      if(!window.supabase||!window.TRANSMIND_SUPABASE_URL||!window.TRANSMIND_SUPABASE_ANON_KEY||!sid()) return;
      var sb=window.supabase.createClient(window.TRANSMIND_SUPABASE_URL,window.TRANSMIND_SUPABASE_ANON_KEY);
      var a=window.TRANSMIND_ATTRIBUTION||{}, t=a.first_touch||a.last_touch||{};
      sb.from(EVENT_TABLE).insert({
        event_type:type, visitor_session_id:sid(), occurred_at:new Date().toISOString(),
        path:location.pathname, title:document.title,
        source:clean(t.source,100), medium:clean(t.medium,100), campaign:clean(t.campaign,150),
        content:clean(t.content,150), term:clean(t.term,150),
        referrer_host:clean(document.referrer?new URL(document.referrer).host:'',150),
        metadata:meta||{}
      }).then(function(){}).catch(function(){});
    }catch(_){ }
  }
  function boot(){
    track('page_view',{entry:true});
    document.addEventListener('click',function(e){
      var el=e.target&&e.target.closest?e.target.closest('a,button'):null;
      if(!el)return;
      var href=el.getAttribute('href')||'';
      var txt=clean(el.textContent,120);
      if(/wa\.me|whatsapp/i.test(href+txt)) track('whatsapp_click',{label:txt.slice(0,80),href:clean(href,300)});
      else if(el.matches('button,[role="button"]')) track('cta_click',{label:txt.slice(0,100)});
    },true);
    document.addEventListener('submit',function(e){
      var f=e.target;
      if(!f||!(f instanceof HTMLFormElement))return;
      track('booking_start',{form_id:clean(f.id,80),form_action:clean(f.getAttribute('action'),200)});
    },true);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
