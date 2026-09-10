/* TRANSMIND PUBLIC CONTACT SAFETY LAYER */
(function(){
  'use strict';

  const NUMBERS=[
    {key:'081292677888',display:'081292677888',wa:'6281292677888'},
    {key:'08816654141',display:'08816654141',wa:'628816654141'}
  ];

  const ICON='<svg class="tm-wa-icon" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path fill="currentColor" d="M16 3.2A12.8 12.8 0 0 0 5.1 22.7L3.3 28.7l6.2-1.8A12.8 12.8 0 1 0 16 3.2Zm0 23.2a10.4 10.4 0 0 1-5.3-1.5l-.4-.2-3.7 1.1 1.1-3.6-.2-.4A10.4 10.4 0 1 1 16 26.4Zm5.7-7.8c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.3-.6.1-1.6-.8-2.7-1.5-3.8-3.3-.3-.5.3-.5.8-1.6.1-.2.1-.4 0-.6-.1-.2-.7-1.7-.9-2.3-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1-1.1 2.5s1.1 2.9 1.2 3.1c.2.2 2.2 3.4 5.4 4.8 2 .9 2.8 1 3.8.9.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.4Z"/></svg>';

  function boot(){
    const contact=document.querySelector('#kontak');
    if(!contact) return;

    const digits=(contact.textContent||'').replace(/\D/g,'');

    if(!document.getElementById('tm-wa-contact-style')){
      const style=document.createElement('style');
      style.id='tm-wa-contact-style';
      style.textContent='.tm-wa-line{margin:7px 0!important}.tm-wa-link{display:inline-flex;align-items:center;gap:7px;vertical-align:middle}.tm-wa-icon{width:19px;height:19px;display:inline-block;flex:0 0 19px}.tm-wa-link:hover{opacity:.86}.tm-wa-link:focus-visible{outline:2px solid currentColor;outline-offset:3px;border-radius:4px}@media(max-width:650px){.tm-wa-icon{width:18px;height:18px;flex-basis:18px}}';
      document.head.appendChild(style);
    }

    NUMBERS.forEach(function(item){
      const found=digits.includes(item.key) || digits.includes(item.wa);
      if(!found){
        const p=document.createElement('p');
        p.className='tm-wa-line';
        p.innerHTML='<b>WhatsApp:</b> <a class="tm-wa-link" data-transmind-wa="'+item.key+'" href="https://wa.me/'+item.wa+'" target="_blank" rel="noopener noreferrer">'+ICON+'<span>'+item.display+'</span></a>';
        contact.appendChild(p);
      }
    });

    contact.querySelectorAll('a').forEach(function(a){
      const raw=(a.textContent||'').replace(/\D/g,'');
      const item=NUMBERS.find(function(n){return raw.includes(n.key)||raw.includes(n.wa)});
      if(!item) return;
      a.href='https://wa.me/'+item.wa;
      a.target='_blank';
      a.rel='noopener noreferrer';
      a.classList.add('tm-wa-link');
      if(!a.querySelector('.tm-wa-icon')) a.insertAdjacentHTML('afterbegin',ICON);
    });
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
