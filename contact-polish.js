/* TRANSMIND CONTACT POLISH v2 */
(function(){
  'use strict';
  const items=[
    {key:'081292677888',label:'WhatsApp',display:'081292677888',wa:'6281292677888'},
    {key:'08816654141',label:'WhatsApp',display:'08816654141',wa:'628816654141'}
  ];
  const icon='<svg class="tm-wa-icon-v2" viewBox="0 0 32 32" aria-hidden="true"><path fill="currentColor" d="M16 3.2A12.8 12.8 0 0 0 5.1 22.7L3.3 28.7l6.2-1.8A12.8 12.8 0 1 0 16 3.2Zm0 23.2a10.4 10.4 0 0 1-5.3-1.5l-.4-.2-3.7 1.1 1.1-3.6-.2-.4A10.4 10.4 0 1 1 16 26.4Zm5.7-7.8c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.3-.6.1-1.6-.8-2.7-1.5-3.8-3.3-.3-.5.3-.5.8-1.6.1-.2.1-.4 0-.6-.1-.2-.7-1.7-.9-2.3-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1-1.1 2.5s1.1 2.9 1.2 3.1c.2.2 2.2 3.4 5.4 4.8 2 .9 2.8 1 3.8.9.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.4Z"/></svg>';
  function boot(){
    const c=document.querySelector('#kontak'); if(!c)return;
    const s=document.createElement('style');
    s.textContent='#kontak .tm-contact-v2{display:flex!important;align-items:center;gap:8px;margin:8px 0!important;line-height:1.35}#kontak .tm-contact-v2 .tm-contact-label{min-width:78px;font-weight:700}#kontak .tm-contact-v2 a{display:inline-flex;align-items:center;gap:7px;white-space:nowrap}#kontak .tm-wa-icon-v2{width:19px;height:19px;flex:0 0 19px}@media(max-width:650px){#kontak .tm-contact-v2 .tm-contact-label{min-width:70px}#kontak .tm-wa-icon-v2{width:18px;height:18px;flex-basis:18px}}';
    document.head.appendChild(s);
    items.forEach(item=>{
      const anchors=Array.from(c.querySelectorAll('a')).filter(a=>{const d=(a.textContent||'').replace(/\D/g,'');return d.includes(item.key)||d.includes(item.wa)});
      if(anchors.length){
        const a=anchors[0]; a.href='https://wa.me/'+item.wa; a.target='_blank'; a.rel='noopener noreferrer';
        a.innerHTML=icon+'<span>'+item.display+'</span>';
        const p=a.closest('p'); if(p){p.className='tm-contact-v2';p.innerHTML='<span class="tm-contact-label">WhatsApp:</span> '+a.outerHTML;}
        anchors.slice(1).forEach(x=>{const px=x.closest('p');if(px)px.remove();});
      }else{
        const p=document.createElement('p');p.className='tm-contact-v2';p.innerHTML='<span class="tm-contact-label">WhatsApp:</span> <a href="https://wa.me/'+item.wa+'" target="_blank" rel="noopener noreferrer">'+icon+'<span>'+item.display+'</span></a>';c.appendChild(p);
      }
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
