/* TRANSMIND CONVERSION BRIDGE
   Real first-party funnel telemetry. No fake conversions, no customer PII.
*/
(function(){
  'use strict';

  var EVENT_TABLE='website_analytics_events';

  function sid(){
    return window.TRANSMIND_VISITOR_SESSION_ID ||
      sessionStorage.getItem('transmind_visitor_session_v2') || '';
  }

  function clean(v,n){ return String(v==null?'':v).slice(0,n||300); }

  function intent(){
    try { return JSON.parse(localStorage.getItem('transmind_growth_intent_v1') || '{}'); }
    catch (_) { return {}; }
  }

  function track(type,meta){
    try{
      if(!window.supabase || !window.TRANSMIND_SUPABASE_URL ||
         !window.TRANSMIND_SUPABASE_ANON_KEY || !sid()) return Promise.resolve(false);

      var sb=window.getTransmindSupabaseClient?window.getTransmindSupabaseClient():null;
      if(!sb) return Promise.resolve(false);

      var a=window.TRANSMIND_ATTRIBUTION ||
        window.TRANSMIND_GROWTH_ATTRIBUTION || {};

      var i=intent();

      var source=a.source||a.utm_source||'';
      var medium=a.medium||a.utm_medium||'';
      var campaign=a.campaign||a.utm_campaign||'';
      var content=a.content||a.utm_content||'';
      var term=a.term||a.utm_term||'';

      var metadata=Object.assign({}, meta||{});
      metadata.intent_stage=metadata.intent_stage || i.intent_stage || '';
      metadata.vehicle=metadata.vehicle || i.vehicle || '';
      metadata.service=metadata.service || i.service || '';
      metadata.area=metadata.area || i.area || '';

      var row={
        event_type:type,
        visitor_session_id:sid(),
        occurred_at:new Date().toISOString(),
        path:location.pathname+location.search,
        title:document.title,
        source:clean(source,100),
        medium:clean(medium,100),
        campaign:clean(campaign,150),
        content:clean(content,150),
        term:clean(term,150),
        referrer_host:clean(document.referrer ? new URL(document.referrer).host : '',150),
        metadata:metadata
      };

      if(meta && meta.booking_id) row.booking_id=meta.booking_id;
      if(meta && meta.booking_code) row.booking_code=clean(meta.booking_code,100);

      return sb.from(EVENT_TABLE).insert(row)
        .then(function(){return true;})
        .catch(function(){return false;});
    }catch(_){
      return Promise.resolve(false);
    }
  }

  function boot(){
    document.addEventListener('click',function(e){
      var el=e.target && e.target.closest ? e.target.closest('a,button') : null;
      if(!el) return;

      var href=el.getAttribute('href')||'';
      var txt=clean(el.textContent,120);

      if(/wa\.me|whatsapp/i.test(href+' '+txt)){
        track('whatsapp_click',{
          label:txt.slice(0,80),
          href:clean(href,300),
          intent_stage:'whatsapp_click'
        });
      }else if(href.indexOf('#booking')!==-1 || /booking/i.test(txt)){
        track('booking_cta_click',{
          label:txt.slice(0,100),
          href:clean(href,300),
          intent_stage:'booking_cta_click'
        });
      }else if(el.matches('button,[role="button"]')){
        track('cta_click',{label:txt.slice(0,100)});
      }
    },true);

    document.addEventListener('submit',function(e){
      var form=e.target;
      if(!form || !(form instanceof HTMLFormElement)) return;

      track('booking_start',{
        form_id:clean(form.id,80),
        intent_stage:'booking_start'
      });
    },true);
  }

  window.TRANSMIND_TRACK_CONVERSION=track;

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot);
  else boot();
})();