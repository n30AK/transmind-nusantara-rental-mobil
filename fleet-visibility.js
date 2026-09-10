/* TRANSMIND FLEET VISIBILITY SAFETY LAYER
   Public rule: a vehicle card is shown only when a real image exists.
*/
(function(){
  'use strict';

  function removeImageLessCards(){
    const container=document.querySelector('#cars');
    if(!container) return;

    container.querySelectorAll('.car-card').forEach(function(card){
      const img=card.querySelector('img');
      if(!img) { card.remove(); return; }

      const src=img.getAttribute('src')||'';
      const missing=!src || src.indexOf('data:image/svg+xml')===0;
      if(missing) card.remove();
    });
  }

  function boot(){
    removeImageLessCards();
    const container=document.querySelector('#cars');
    if(!container) return;
    new MutationObserver(removeImageLessCards).observe(container,{childList:true,subtree:true});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
