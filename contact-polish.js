/* TRANSMIND CONTACT FINAL
   Single deterministic WhatsApp block.
   Required order:
   AREA OPERASI
   Rental Mobil Jabodetabek
   Basis di Bekasi...
   [WhatsApp icon] 081292677888
   [WhatsApp icon] 08816654141
   Email Booking
   Email Admin
   PEMBAYARAN
*/
(function(){
  'use strict';

  const NUMBERS=[
    {display:'081292677888',wa:'6281292677888'},
    {display:'08816654141',wa:'628816654141'}
  ];

  const ICON='<svg class="tm-wa-icon-final" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path fill="currentColor" d="M16 3.2A12.8 12.8 0 0 0 5.1 22.7L3.3 28.7l6.2-1.8A12.8 12.8 0 1 0 16 3.2Zm0 23.2a10.4 10.4 0 0 1-5.3-1.5l-.4-.2-3.7 1.1 1.1-3.6-.2-.4A10.4 10.4 0 1 1 16 26.4Zm5.7-7.8c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.3-.6.1-1.6-.8-2.7-1.5-3.8-3.3-.3-.5.3-.5.8-1.6.1-.2.1-.4 0-.6-.1-.2-.7-1.7-.9-2.3-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1-1.1 2.5s1.1 2.9 1.2 3.1c.2.2 2.2 3.4 5.4 4.8 2 .9 2.8 1 3.8.9.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.4Z"/></svg>';

  function cleanOld(c){
    c.querySelectorAll('.tm-wa-group-final').forEach(e=>e.remove());
    c.querySelectorAll('[data-transmind-wa]').forEach(e=>e.closest('p')?.remove()||e.remove());
    c.querySelectorAll('p').forEach(p=>{
      const t=(p.textContent||'').replace(/\s+/g,' ');
      if(/WhatsApp\s*:/i.test(t)||/08816654141/.test(t)) p.remove();
    });
  }

  function render(){
    const c=document.querySelector('#kontak');
    if(!c)return false;

    if(!document.getElementById('tm-contact-final-style')){
      const s=document.createElement('style');
      s.id='tm-contact-final-style';
      s.textContent='#kontak .tm-wa-group-final{display:block!important;margin:10px 0 14px!important}#kontak .tm-wa-line-final{display:block!important;margin:6px 0!important;line-height:1.4!important}#kontak .tm-wa-line-final a{display:inline-flex!important;align-items:center!important;gap:8px!important;text-decoration:none!important}#kontak .tm-wa-icon-final{width:19px;height:19px;display:inline-block;flex:0 0 19px}#kontak .tm-wa-line-final a:hover{opacity:.86}';
      document.head.appendChild(s);
    }

    // Always rebuild only our controlled block; do not alter the rest of #kontak.
    cleanOld(c);

    const group=document.createElement('div');
    group.className='tm-wa-group-final';
    NUMBERS.forEach(n=>{
      const row=document.createElement('div');
      row.className='tm-wa-line-final';
      row.innerHTML='<a href="https://wa.me/'+n.wa+'" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp '+n.display+'">'+ICON+'<span>'+n.display+'</span></a>';
      group.appendChild(row);
    });

    const ps=Array.from(c.querySelectorAll('p'));
    const booking=ps.find(p=>/Email\s*Booking/i.test(p.textContent||''));
    if(booking){c.insertBefore(group,booking);return true;}
    const admin=ps.find(p=>/Email\s*Admin/i.test(p.textContent||''));
    if(admin){c.insertBefore(group,admin);return true;}
    c.appendChild(group);return true;
  }

  function boot(){
    [0,400,900,1800,3500].forEach(ms=>setTimeout(render,ms));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
