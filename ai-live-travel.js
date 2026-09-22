(function(){
'use strict';
const ENDPOINT=window.TRANSMIND_AI_ENDPOINT||'';
let liveLocation=null;
function postContext(){
  if(!window.TRANSMIND_AI||typeof window.TRANSMIND_AI.ask!=='function')return;
  window.TRANSMIND_AI.liveLocation=liveLocation;
}
function enable(){
  if(!navigator.geolocation){alert('Perangkat/browser tidak mendukung GPS.');return;}
  navigator.geolocation.watchPosition(function(p){
    liveLocation={lat:p.coords.latitude,lng:p.coords.longitude,accuracy_m:Math.round(p.coords.accuracy||0),updated_at:new Date().toISOString()};
    try{sessionStorage.setItem('transmind_live_location_v1',JSON.stringify(liveLocation))}catch(_){}
    const b=document.getElementById('tm-ai-location');
    if(b)b.textContent='● GPS aktif ('+liveLocation.accuracy_m+' m)';
    postContext();
  },function(){const b=document.getElementById('tm-ai-location');if(b)b.textContent='Gunakan lokasi saya';},{enableHighAccuracy:true,maximumAge:15000,timeout:10000});
}
function patchAsk(){
  if(!window.TRANSMIND_AI||typeof window.TRANSMIND_AI.ask!=='function')return setTimeout(patchAsk,300);
  const original=window.TRANSMIND_AI.ask;
  window.TRANSMIND_AI.ask=async function(q){
    const oldFetch=window.fetch;
    window.fetch=function(url,opt){
      try{
        if(String(url)===ENDPOINT&&opt&&opt.body){
          const body=JSON.parse(opt.body);
          body.context=body.context||{};
          if(liveLocation)body.context.location=liveLocation;
          opt.body=JSON.stringify(body);
        }
      }catch(_){}
      return oldFetch(url,opt);
    };
    try{return await original(q)}finally{window.fetch=oldFetch}
  };
}
function init(){
  const form=document.getElementById('tm-ai-form');
  if(!form||document.getElementById('tm-ai-location'))return;
  const b=document.createElement('button');
  b.type='button';b.id='tm-ai-location';b.className='tm-ai-suggestion';b.textContent='Gunakan lokasi saya';
  b.title='Izinkan GPS agar AI dapat menghitung rute dinamis dari lokasi perangkat.';
  b.addEventListener('click',enable);
  form.parentNode.insertBefore(b,form);
  try{const x=JSON.parse(sessionStorage.getItem('transmind_live_location_v1')||'null');if(x&&x.lat&&x.lng)liveLocation=x}catch(_){}
  patchAsk();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();