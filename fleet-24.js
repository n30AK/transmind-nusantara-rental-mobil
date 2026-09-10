/* TRANSMIND PUBLIC FLEET — EXACTLY UP TO 24 PHOTO-READY CARDS */
(function(){
  'use strict';
  const MAX=24;
  function clean(){
    const box=document.querySelector('#cars'); if(!box)return;
    const cards=Array.from(box.querySelectorAll('.car-card'));
    cards.forEach(card=>{
      const img=card.querySelector('img');
      const src=img&&img.getAttribute('src')||'';
      if(!img||!src||src.indexOf('data:image/svg+xml')===0) card.remove();
    });
    const valid=Array.from(box.querySelectorAll('.car-card'));
    valid.slice(MAX).forEach(card=>card.remove());
    const status=document.querySelector('#fleetStatus');
    if(status)status.textContent='Menampilkan '+Math.min(valid.length,MAX)+' unit armada.';
  }
  function boot(){
    clean();
    const box=document.querySelector('#cars'); if(!box)return;
    new MutationObserver(function(){clean()}).observe(box,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
