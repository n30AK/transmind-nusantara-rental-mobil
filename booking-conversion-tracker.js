/* TransMind — Real Booking Conversion Tracker
   Turns the existing booking form success state into first-party booking_success telemetry.
   No synthetic conversions. */
(function(){
'use strict';
const track=window.TRANSMIND_TRACK_CONVERSION;
function emit(detail){
  try{window.dispatchEvent(new CustomEvent('transmind:booking-success',{detail}));}catch(_){}
  if(typeof track==='function'){
    try{track('booking_success',Object.assign({intent_stage:'booking_success'},detail||{}));}catch(_){}
  }
}
function boot(){
  const result=document.getElementById('result');
  if(!result)return;
  let last='';
  const read=()=>{
    const text=String(result.textContent||'').trim();
    if(!text||text===last)return;
    last=text;
    if(/^Berhasil(?:\s*:|$)/i.test(text)){
      const code=(text.match(/Berhasil\s*:\s*([^\s]+)/i)||[])[1]||'';
      emit({booking_code:code,source:'public_booking_form'});
    }
  };
  new MutationObserver(read).observe(result,{childList:true,subtree:true,characterData:true});
  read();
  document.getElementById('bookingForm')?.addEventListener('submit',function(){
    if(typeof track==='function')track('booking_start',{form_id:this.id,intent_stage:'booking_start'});
  },true);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();