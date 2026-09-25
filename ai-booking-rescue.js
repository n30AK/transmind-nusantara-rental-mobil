/* TransMind — AI Booking Rescue
   Opens a human-feeling assistance prompt after a high-intent booking CTA
   when the visitor has not started the booking form. No fake conversion. */
(function(){
'use strict';
let timer=null,started=false;
function launcher(){return document.getElementById('transmind-ai-launcher')}
function openRescue(){
  if(started||document.getElementById('bookingForm')?.querySelector('input')?.value)return;
  const l=launcher(); if(l) l.click();
  setTimeout(()=>{
    const box=document.getElementById('tm-ai-messages');
    if(!box)return;
    const existing=[...box.children].some(x=>/masih mencari kendaraan|bantu sampai booking/i.test(x.textContent||''));
    if(existing)return;
    const e=document.createElement('div');e.className='tm-ai-msg tm-ai-bot';
    e.textContent='Masih mencari kendaraan atau belum yakin dengan detail booking? Tidak apa-apa. Ceritakan kebutuhan Anda, saya bantu dari sini sampai siap dipesan.';
    box.appendChild(e);box.scrollTop=box.scrollHeight;
  },250);
}
function arm(){
  clearTimeout(timer); started=false;
  timer=setTimeout(openRescue,25000);
}
document.addEventListener('click',e=>{
  const el=e.target?.closest?.('a,button'); if(!el)return;
  const href=el.getAttribute('href')||'',txt=(el.textContent||'');
  if(/#booking/i.test(href)||/booking/i.test(txt)) arm();
});
window.addEventListener('transmind:booking-start',()=>{started=true;clearTimeout(timer)});
window.addEventListener('transmind:booking-success',()=>{started=true;clearTimeout(timer)});
})();