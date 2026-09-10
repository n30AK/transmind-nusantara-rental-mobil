/* TRANSMIND SEO / LIVE VISITOR ANALYTICS — privacy-light, no PII */
(function(){
  'use strict';
  if (location.pathname.indexOf('/nexus') === 0 || !window.supabase || !window.TRANSMIND_SUPABASE_URL || !window.TRANSMIND_SUPABASE_ANON_KEY) return;

  var KEY='transmind_visitor_session_v1';
  var sessionId='';
  try { sessionId=localStorage.getItem(KEY)||''; } catch(_){}
  if(!sessionId){
    sessionId=(crypto&&crypto.randomUUID)?crypto.randomUUID():'tm-'+Date.now()+'-'+Math.random().toString(36).slice(2);
    try{localStorage.setItem(KEY,sessionId);}catch(_){}
  }

  var attribution=window.TRANSMIND_ATTRIBUTION||{};
  var touch=attribution.last_touch||attribution.first_touch||{};
  var sb=window.supabase.createClient(window.TRANSMIND_SUPABASE_URL,window.TRANSMIND_SUPABASE_ANON_KEY);
  var sent={};
  function clean(v,n){return String(v||'').slice(0,n||500);}
  function refHost(){try{return document.referrer?new URL(document.referrer).host:'';}catch(_){return '';}}
  function send(type,meta){
    var key=type+'|'+location.pathname;
    if(type==='page_view'&&sent[key]) return;
    sent[key]=1;
    sb.from('website_analytics_events').insert({
      event_type:type,
      visitor_session_id:sessionId,
      path:clean(location.pathname+location.search,1000),
      title:clean(document.title,250),
      source:clean(touch.source||'direct',100),
      medium:clean(touch.medium,100),
      campaign:clean(touch.campaign,150),
      content:clean(touch.content,150),
      term:clean(touch.term,150),
      referrer_host:clean(refHost(),250),
      metadata:meta||{}
    }).then(function(){}).catch(function(){});
  }

  function boot(){
    send('page_view',{screen_width:innerWidth,device:innerWidth<700?'mobile':innerWidth<1100?'tablet':'desktop'});
    document.addEventListener('click',function(e){
      var a=e.target&&e.target.closest?e.target.closest('a'):null;
      if(!a) return;
      var href=a.getAttribute('href')||'';
      if(/wa\.me\//i.test(href) || /whatsapp/i.test(a.textContent||'')) send('whatsapp_click',{href:clean(href,500)});
      else if(/booking|pesan|sewa|reserv/i.test((a.textContent||'')+' '+href)) send('cta_click',{href:clean(href,500),label:clean(a.textContent,150)});
    },{passive:true});
    setInterval(function(){send('heartbeat',{visible:document.visibilityState==='visible'});},60000);
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
