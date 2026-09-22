(function(){
'use strict';
/* TransMind Live Travel Location v2 — resilient browser geolocation bridge. */
const ENDPOINT=window.TRANSMIND_AI_ENDPOINT||'';
const STORAGE_KEY='transmind_live_location_v2';
const LEGACY_KEY='transmind_live_location_v1';
let liveLocation=null;
let watchId=null;
let busy=false;

function button(){return document.getElementById('tm-ai-location')}
function setButton(text,disabled){const b=button();if(!b)return;b.textContent=text;b.disabled=!!disabled;b.setAttribute('aria-busy',busy?'true':'false')}
function notify(message){
  let n=document.getElementById('tm-ai-location-status');
  if(!n){n=document.createElement('div');n.id='tm-ai-location-status';n.className='tm-ai-location-status';n.setAttribute('role','status');const b=button();if(b&&b.parentNode)b.parentNode.insertBefore(n,b.nextSibling)}
  n.textContent=message;
}
function postContext(){
  if(!window.TRANSMIND_AI||typeof window.TRANSMIND_AI.ask!=='function')return;
  window.TRANSMIND_AI.liveLocation=liveLocation;
}
function save(){if(!liveLocation)return;try{sessionStorage.setItem(STORAGE_KEY,JSON.stringify(liveLocation));sessionStorage.setItem(LEGACY_KEY,JSON.stringify(liveLocation))}catch(_){}postContext()}
function load(){try{const x=JSON.parse(sessionStorage.getItem(STORAGE_KEY)||sessionStorage.getItem(LEGACY_KEY)||'null');if(x&&Number.isFinite(x.lat)&&Number.isFinite(x.lng))liveLocation=x}catch(_){}postContext()}
function explainError(err){
  if(!err)return 'Lokasi belum tersedia.';
  if(err.code===1)return 'Akses lokasi ditolak. Izinkan Location/Lokasi untuk situs TransMind di ikon gembok/alamat browser, lalu tekan tombol lagi.';
  if(err.code===2)return 'Lokasi tidak dapat ditemukan. Pastikan GPS/lokasi perangkat aktif, lalu coba lagi.';
  if(err.code===3)return 'Pengambilan lokasi terlalu lama. Pastikan koneksi dan layanan lokasi aktif, lalu coba lagi.';
  return 'Lokasi belum tersedia. Silakan coba lagi.';
}
function gotPosition(p){
  const c=p&&p.coords||{};
  if(!Number.isFinite(c.latitude)||!Number.isFinite(c.longitude))throw new Error('invalid coordinates');
  liveLocation={lat:Number(c.latitude),lng:Number(c.longitude),accuracy_m:Math.round(Number(c.accuracy)||0),updated_at:new Date().toISOString(),source:'browser_geolocation'};
  save();
  busy=false;
  setButton('● GPS aktif ('+liveLocation.accuracy_m+' m)',false);
  notify('Lokasi berhasil dibaca. Sekarang tanyakan rute/perjalanan Anda kepada AI Companion.');
}
function failed(err){
  busy=false;
  setButton('Gunakan lokasi saya',false);
  notify(explainError(err));
}
function enable(){
  if(busy)return;
  if(!window.isSecureContext){notify('GPS browser membutuhkan koneksi HTTPS. Buka TransMind melalui alamat HTTPS.');return}
  if(!navigator.geolocation){notify('Browser/perangkat ini tidak menyediakan layanan lokasi.');return}
  busy=true;setButton('⏳ Mengambil lokasi...',true);notify('Meminta izin lokasi dari browser...');
  navigator.geolocation.getCurrentPosition(gotPosition,failed,{enableHighAccuracy:true,maximumAge:0,timeout:20000});
  if(watchId===null&&navigator.geolocation.watchPosition){
    watchId=navigator.geolocation.watchPosition(function(p){if(p&&p.coords&&Number.isFinite(p.coords.latitude)&&Number.isFinite(p.coords.longitude))gotPosition(p)},function(){}, {enableHighAccuracy:true,maximumAge:15000,timeout:20000});
  }
}
function patchAsk(){
  if(!window.TRANSMIND_AI||typeof window.TRANSMIND_AI.ask!=='function')return setTimeout(patchAsk,300);
  if(window.TRANSMIND_AI.__locationPatched)return;
  const original=window.TRANSMIND_AI.ask;
  window.TRANSMIND_AI.ask=async function(q){
    if(liveLocation)window.TRANSMIND_AI.liveLocation=liveLocation;
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
  window.TRANSMIND_AI.__locationPatched=true;
  postContext();
}
function init(){
  const form=document.getElementById('tm-ai-form');
  if(!form)return setTimeout(init,500);
  let b=document.getElementById('tm-ai-location');
  if(!b){
    b=document.createElement('button');b.type='button';b.id='tm-ai-location';b.className='tm-ai-suggestion';b.textContent='Gunakan lokasi saya';b.title='Izinkan GPS agar AI dapat menghitung rute dinamis dari lokasi perangkat.';b.setAttribute('aria-label','Gunakan lokasi saya untuk mengirim lokasi ke AI Companion');b.addEventListener('click',enable);
    form.parentNode.insertBefore(b,form);
  }
  load();
  if(liveLocation){setButton('● GPS aktif ('+liveLocation.accuracy_m+' m)',false);notify('Lokasi tersimpan untuk sesi ini.');}
  patchAsk();
  if(navigator.permissions&&navigator.permissions.query){navigator.permissions.query({name:'geolocation'}).then(function(status){status.onchange=function(){if(status.state==='denied')notify('Izin lokasi saat ini diblokir. Ubah izin Location/Lokasi pada pengaturan situs browser.');};if(status.state==='denied')notify('Izin lokasi diblokir oleh browser. Ubah izin Location/Lokasi pada pengaturan situs.');}).catch(function(){})}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
