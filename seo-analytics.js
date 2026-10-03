/* TRANSMIND SEO / LIVE VISITOR ANALYTICS — privacy-light, no PII */
(function(){
'use strict';
if(location.pathname.indexOf('/nexus')===0||!window.supabase||!window.TRANSMIND_SUPABASE_URL||!window.TRANSMIND_SUPABASE_ANON_KEY)return;
var KEY='transmind_visitor_session_v3',sessionId='';
try{sessionId=sessionStorage.getItem(KEY)||''}catch(_){}
if(!sessionId){
  sessionId=(crypto&&crypto.randomUUID)?crypto.randomUUID():'tm-'+Date.now()+'-'+Math.random().toString(36).slice(2);
  try{sessionStorage.setItem(KEY,sessionId)}catch(_){}
}
var a=window.TRANSMIND_ATTRIBUTION||{},touch=a.first_touch||a.last_touch||{},sb=window.getTransmindSupabaseClient?window.getTransmindSupabaseClient():null,sent={};
function clean(v,n){return String(v||'').trim().slice(0,n||500)}
function refHost(){try{return document.referrer?new URL(document.referrer).host:''}catch(_){return''}}
function classify(){
  var host=refHost().toLowerCase(),source=clean(touch.source,100),medium=clean(touch.medium,100);
  if(!source){
    if(/google\./i.test(host)){source='google';medium='organic'}
    else if(/bing\./i.test(host)){source='bing';medium='organic'}
    else if(/yahoo\./i.test(host)){source='yahoo';medium='organic'}
    else if(/duckduckgo\./i.test(host)){source='duckduckgo';medium='organic'}
    else if(/facebook\.|instagram\.|tiktok\.|youtube\.|linkedin\.|x\.com/i.test(host)){source=host.replace(/^www\./,'');medium='social'}
    else if(host){source=host;medium=medium||'referral'}
    else {source='direct';medium=medium||'none'}
  }
  return {source:source||'direct',medium:medium||'none'};
}
function send(type,meta,once){
  if(!sb)return;
  var key=type+'|'+location.pathname;
  if(once&&sent[key])return;
  if(once)sent[key]=1;
  var c=classify();
  sb.from('website_analytics_events').insert({
    event_type:type,
    visitor_session_id:sessionId,
    occurred_at:new Date().toISOString(),
    path:clean(location.pathname+location.search,1000),
    title:clean(document.title,250),
    source:c.source,
    medium:c.medium,
    campaign:clean(touch.campaign,150),
    content:clean(touch.content,150),
    term:clean(touch.term,150),
    referrer_host:clean(refHost(),250),
    metadata:Object.assign({
      screen_width:innerWidth,
      device:innerWidth<700?'mobile':innerWidth<1100?'tablet':'desktop',
      landing_page:location.pathname,
      attribution_version:'v3'
    },meta||{})
  }).then(function(){}).catch(function(){});
}
function clickHandler(e){
  var el=e.target&&e.target.closest?e.target.closest('a,button'):null;
  if(!el)return;
  var href=el.getAttribute('href')||'',text=clean(el.textContent||el.getAttribute('aria-label'),180),hay=(text+' '+href).toLowerCase();
  if(/wa\.me\//i.test(href)||/whatsapp/i.test(text))send('whatsapp_click',{href:clean(href,500),label:text},false);
  else if(/booking|pesan|sewa|reserv/i.test(hay))send('booking_cta_click',{href:clean(href,500),label:text},false);
  else if(/^tel:/i.test(href))send('phone_click',{href:clean(href,500),label:text},false);
}
function boot(){
  var c=classify();
  send('session_start',{landing_page:location.pathname,attribution_source:c.source,attribution_medium:c.medium},true);
  send('page_view',{screen_width:innerWidth,device:innerWidth<700?'mobile':innerWidth<1100?'tablet':'desktop'},true);
  if(c.medium==='organic')send('organic_landing',{search_engine:c.source},true);
  document.addEventListener('click',clickHandler,{passive:true});
  setTimeout(function(){if(document.visibilityState==='visible')send('session_engaged',{seconds:15},true)},15000);
  setInterval(function(){if(document.visibilityState==='visible')send('heartbeat',{visible:true},false)},30000);
  document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')send('visibility_resume',{visible:true})},{passive:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();