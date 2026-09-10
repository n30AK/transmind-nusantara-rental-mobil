/* TRANSMIND CONTACT POLISH v3 — TWO WHATSAPP LINES */
(function(){
  'use strict';
  const items=[
    {key:'081292677888',display:'081292677888',wa:'6281292677888'},
    {key:'08816654141',display:'08816654141',wa:'628816654141'}
  ];
  const icon='<svg class="tm-wa-icon-v3" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path fill="currentColor" d="M16 3.2A12.8 12.8 0 0 0 5.1 22.7L3.3 28.7l6.2-1.8A12.8 12.8 0 1 0 16 3.2Zm0 23.2a10.4 10.4 0 0 1-5.3-1.5l-.4-.2-3.7 1.1 1.1-3.6-.2-.4A10.4 10.4 0 1 1 16 26.4Zm5.7-7.8c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.3-.6.1-1.6-.8-2.7-1.5-3.8-3.3-.3-.5.3-.5.8-1.6.1-.2.1-.4 0-.6-.1-.2-.7-1.7-.9-2.3-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1-1.1 2.5s1.1 2.9 1.2 3.1c.2.2 2.2 3.4 5.4 4.8 2 .9 2.8 1 3.8.9.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.4Z"/></svg>';

  function boot(){
    const c=document.querySelector('#kontak');
    if(!c) return;

    const style=document.createElement('style');
    style.textContent='#kontak .tm-contact-v3{display:flex!important;align-items:center;gap:8px;margin:7px 0!important;line-height:1.35}#kontak .tm-contact-v3 a{display:inline-flex!important;align-items:center;gap:7px;white-space:nowrap;text-decoration:none}#kontak .tm-wa-icon-v3{width:19px;height:19px;flex:0 0 19px;display:inline-block}#kontak .tm-contact-v3 a:hover{opacity:.86}@media(max-width:650px){#kontak .tm-contact-v3{gap:7px;margin:6px 0!important}#kontak .tm-wa-icon-v3{width:18px;height:18px;flex-basis:18px}}';
    document.head.appendChild(style);

    const paragraphs=Array.from(c.querySelectorAll('p'));
    items.forEach(item=>{
      const matches=paragraphs.filter(p=>{
        const d=(p.textContent||'').replace(/\D/g,'');
        return d.includes(item.key)||d.includes(item.wa);
      });
      let p=matches[0];
      if(!p){
        p=document.createElement('p');
        c.appendChild(p);
      }
      p.className='tm-contact-v3';
      p.innerHTML='<a href="https://wa.me/'+item.wa+'" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp '+item.display+'">'+icon+'<span>'+item.display+'</span></a>';
      matches.slice(1).forEach(x=>x.remove());
    });
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
