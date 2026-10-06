/* TRANSMIND SEO FUNNEL — first-party demand measurement for SEO landing pages */
(function(){
'use strict';
var SESSION_KEY='transmind_visitor_session_v3', ATTR_KEY='transmind_attribution_v1';
function clean(v,n){return String(v||'').trim().slice(0,n||500)}
function sid(){try{var s=sessionStorage.getItem(SESSION_KEY);if(s)return s}catch(_){}var id=(crypto&&crypto.randomUUID)?crypto.randomUUID():'tm-'+Date.now()+'-'+Math.random().toString(36).slice(2);try{sessionStorage.setItem(SESSION_KEY,id)}catch(_){}return id}
function attribution(){
 var p=new URLSearchParams(location.search),ref=document.referrer||'',host='';
 try{host=new URL(ref).host.toLowerCase()}catch(_){}
 var source=clean(p.get('utm_source'),100),medium=clean(p.get('utm_medium'),100);
 if(!source){if(/google\./i.test(host)){source='google';medium='organic'}else if(/bing\./i.test(host)){source='bing';medium='organic'}else if(/yahoo\./i.test(host)){source='yahoo';medium='organic'}else if(/duckduckgo\./i.test(host)){source='duckduckgo';medium='organic'}else if(/facebook\.|instagram\.|tiktok\.|youtube\.|linkedin\.|x\.com/i.test(host)){source=host.replace(/^www\\./,'');medium='social'}else if(host){source=host;medium='referral'}else{source='direct';medium=medium||'none'}}
 return {source:source,medium:medium,campaign:clean(p.get('utm_campaign'),150),content:clean(p.get('utm_content'),150),term:clean(p.get('utm_term'),150),referrer_host:clean(host,200)};
}
function client(){return window.getTransmindSupabaseClient?window.getTransmindSupabaseClient():null}
function send(type,meta){var db=client();if(!db)return;var a=attribution();db.from('website_analytics_events').insert({event_type:type,visitor_session_id:sid(),occurred_at:new Date().toISOString(),path:clean(location.pathname+location.search,1000),title:clean(document.title,250),source:a.source,medium:a.medium,campaign:a.campaign,content:a.content,term:a.term,referrer_host:a.referrer_host,metadata:Object.assign({seo_landing:true,device:innerWidth<700?'mobile':innerWidth<1100?'tablet':'desktop'},meta||{})}).then(function(){}).catch(function(){});try{localStorage.setItem(ATTR_KEY,JSON.stringify({first_touch:Object.assign(a,{landing_page:location.pathname+location.search,captured_at:new Date().toISOString()}),last_touch:a}))}catch(_){}window.TRANSMIND_ATTRIBUTION=window.TRANSMIND_ATTRIBUTION||{first_touch:a,last_touch:a};window.TRANSMIND_ATTRIBUTION.last_touch=a;window.TRANSMIND_VISITOR_SESSION_ID=sid()}
function boot(){
 send('session_start',{landing_page:location.pathname});
 send('page_view',{page_type:'seo_landing'});\n injectLeadPanel();
 if(attribution().medium==='organic')send('organic_landing',{search_engine:attribution().source});
 document.addEventListener('click',function(e){var el=e.target&&e.target.closest?e.target.closest('a,button'):null;if(!el)return;var href=el.getAttribute('href')||'',txt=clean(el.textContent||el.getAttribute('aria-label'),160),hay=(txt+' '+href).toLowerCase();if(/wa\\.me\\//i.test(href)||/whatsapp/i.test(txt))send('whatsapp_click',{label:txt,href:href,intent_stage:'whatsapp_click'});else if(/booking|cek kendaraan|ajukan kebutuhan|sewa|rental/i.test(hay))send('booking_cta_click',{label:txt,href:href,intent_stage:'booking_cta_click'});},true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
