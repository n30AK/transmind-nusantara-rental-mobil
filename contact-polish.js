/* TRANSMIND CONTACT - SINGLE SOURCE OF TRUTH
   Exact order inside #kontak:
   AREA OPERASI -> Rental Mobil Jabodetabek -> Basis di Bekasi... -> WhatsApp 1 -> WhatsApp 2 -> Email Booking -> Email Admin -> PEMBAYARAN
*/
(function(){
  'use strict';

  const items=[
    {display:'081292677888',wa:'6281292677888'},
    {display:'08816654141',wa:'628816654141'}
  ];

  const icon='<svg class="tm-wa-icon-final" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path fill="currentColor" d="M16 3.2A12.8 12.8 0 0 0 5.1 22.7L3.3 28.7l6.2-1.8A12.8 12.8 0 1 0 16 3.2Zm0 23.2a10.4 10.4 0 0 1-5.3-1.5l-.4-.2-3.7 1.1 1.1-3.6-.2-.4A10.4 10.4 0 1 1 16 26.4Zm5.7-7.8c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.3-.6.1-1.6-.8-2.7-1.5-3.8-3.3-.3-.5.3-.5.8-1.6.1-.2.1-.4 0-.6-.1-.2-.7-1.7-.9-2.3-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1-1.1 2.5s1.1 2.9 1.2 3.1c.2.2 2.2 3.4 5.4 4.8 2 .9 2.8 1 3.8.9.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.4Z"/></svg>';

  function boot(){
    const c=document.querySelector('#kontak');
    if(!c) return;

    if(!document.getElementById('tm-contact-final-style')){
      const style=document.createElement('style');
      style.id='tm-contact-final-style';
      style.textContent='#kontak .tm-wa-group-final{margin:10px 0 14px!important}#kontak .tm-wa-line-final{display:flex!important;align-items:center!important;gap:8px!important;margin:6px 0!important;line-height:1.35!important}#kontak .tm-wa-line-final a{display:inline-flex!important;align-items:center!important;gap:8px!important;text-decoration:none!important;white-space:nowrap!important}#kontak .tm-wa-icon-final{width:19px;height:19px;flex:0 0 19px;display:inline-block}#kontak .tm-wa-line-final a:hover{opacity:.86}@media(max-width:650px){#kontak .tm-wa-group-final{margin:8px 0 12px!important}#kontak .tm-wa-line-final{margin:5px 0!important}#kontak .tm-wa-icon-final{width:18px;height:18px;flex-basis:18px}}';
      document.head.appendChild(style);
    }

    // Remove every previous WhatsApp implementation, including old appended rows.
    c.querySelectorAll('.tm-wa-group-final,[data-transmind-wa],.tm-wa-link').forEach(el=>{
      const p=el.closest('p');
      if(p && /08\d{8,}|62\d{9,}|WhatsApp/i.test(p.textContent||'')) p.remove();
      else if(el.classList.contains('tm-wa-group-final')) el.remove();
      else el.remove();
    });

    // Remove orphan WhatsApp paragraphs left by legacy scripts.
    c.querySelectorAll('p').forEach(p=>{
      const text=p.textContent||'';
      const digits=text.replace(/\D/g,'');
      if(/WhatsApp/i.test(text) || digits.includes('081292677888') || digits.includes('08816654141') || digits.includes('6281292677888') || digits.includes('628816654141')) p.remove();
    });

    const group=document.createElement('div');
    group.className='tm-wa-group-final';
    group.setAttribute('aria-label','Kontak WhatsApp');

    items.forEach(item=>{
      const row=document.createElement('div');
      row.className='tm-wa-line-final';
      row.innerHTML='<a href="https://wa.me/'+item.wa+'" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp '+item.display+'">'+icon+'<span>'+item.display+'</span></a>';
      group.appendChild(row);
    });

    // Put the WhatsApp group immediately before Email Booking.
    const paragraphs=Array.from(c.querySelectorAll('p'));
    const emailBooking=paragraphs.find(p=>/Email\s*Booking/i.test(p.textContent||''));
    if(emailBooking) c.insertBefore(group,emailBooking);
    else {
      const emailAdmin=paragraphs.find(p=>/Email\s*Admin/i.test(p.textContent||''));
      if(emailAdmin) c.insertBefore(group,emailAdmin);
      else c.appendChild(group);
    }
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,500));
  else setTimeout(boot,500);
})();
