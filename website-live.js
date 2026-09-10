/* =========================================================
   TRANSMIND WEBSITE LIVE CONTENT BRIDGE
   NEXUS -> PUBLIC WEBSITE
   Only active, scheduled website campaigns are public.
   ========================================================= */
(function(){
  'use strict';

  const WA_ICON='<svg class="tm-wa-icon" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path fill="currentColor" d="M16 3.2A12.8 12.8 0 0 0 5.1 22.7L3.3 28.7l6.2-1.8A12.8 12.8 0 1 0 16 3.2Zm0 23.2a10.4 10.4 0 0 1-5.3-1.5l-.4-.2-3.7 1.1 1.1-3.6-.2-.4A10.4 10.4 0 1 1 16 26.4Zm5.7-7.8c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.3-.6.1-1.6-.8-2.7-1.5-3.8-3.3-.3-.5.3-.5.8-1.6.1-.2.1-.4 0-.6-.1-.2-.7-1.7-.9-2.3-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1-1.1 2.5s1.1 2.9 1.2 3.1c.2.2 2.2 3.4 5.4 4.8 2 .9 2.8 1 3.8.9.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.4Z"/></svg>';

  function setupWhatsAppContact(){
    const contact=document.querySelector('#kontak');
    if(!contact) return;

    const paragraphs=Array.from(contact.querySelectorAll('p'));
    let waParagraph=null;
    paragraphs.forEach(p=>{
      if(/WhatsApp/i.test(p.textContent||'')) waParagraph=p;
    });

    if(waParagraph){
      const links=waParagraph.querySelectorAll('a');
      links.forEach(a=>{
        const raw=(a.textContent||'').replace(/\D/g,'');
        if(raw.length>=10){
          const normalized=raw.startsWith('0')?'62'+raw.slice(1):raw;
          a.href='https://wa.me/'+normalized;
          a.target='_blank';
          a.rel='noopener noreferrer';
          a.classList.add('tm-wa-link');
          if(!a.querySelector('.tm-wa-icon')) a.insertAdjacentHTML('afterbegin',WA_ICON);
        }
      });
    }

    if(!contact.querySelector('[data-transmind-wa="08816654141"]')){
      const p=document.createElement('p');
      p.innerHTML='<b>WhatsApp:</b> <a class="tm-wa-link" data-transmind-wa="08816654141" href="https://wa.me/628816654141" target="_blank" rel="noopener noreferrer">'+WA_ICON+'<span>08816654141</span></a>';
      contact.appendChild(p);
    }

    if(!document.getElementById('tm-wa-contact-style')){
      const style=document.createElement('style');
      style.id='tm-wa-contact-style';
      style.textContent='.tm-wa-link{display:inline-flex;align-items:center;gap:6px}.tm-wa-icon{width:18px;height:18px;display:inline-block;flex:0 0 18px;vertical-align:-4px}.tm-wa-link:hover{opacity:.86}.tm-wa-link:focus-visible{outline:2px solid currentColor;outline-offset:3px;border-radius:4px}';
      document.head.appendChild(style);
    }
  }

  function boot(){
    setupWhatsAppContact();

    if(!window.supabase || !window.TRANSMIND_SUPABASE_URL || !window.TRANSMIND_SUPABASE_ANON_KEY) return;
    const sb=window.supabase.createClient(window.TRANSMIND_SUPABASE_URL,window.TRANSMIND_SUPABASE_ANON_KEY);
    const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const style=document.createElement('style');
    style.textContent='.tm-live-campaign{margin:12px auto;max-width:1180px;padding:14px 18px;border:1px solid rgba(210,173,50,.35);border-radius:14px;background:linear-gradient(135deg,rgba(24,20,10,.96),rgba(12,14,18,.96));color:#fff;display:flex;gap:16px;align-items:center;justify-content:space-between;box-shadow:0 10px 30px rgba(0,0,0,.18)}.tm-live-campaign .tm-copy{min-width:0}.tm-live-campaign .tm-type{font-size:10px;letter-spacing:1.6px;color:#f0cf68;font-weight:800;text-transform:uppercase}.tm-live-campaign h3{margin:4px 0;font-size:18px}.tm-live-campaign p{margin:0;color:#b9bec7;font-size:12px;line-height:1.45}.tm-live-campaign .tm-cta{display:inline-block;white-space:nowrap;text-decoration:none;background:#d2ad32;color:#111;font-weight:800;border-radius:9px;padding:9px 13px}.tm-live-campaign .tm-close{border:0;background:transparent;color:#8e949f;font-size:18px;cursor:pointer}@media(max-width:650px){.tm-live-campaign{margin:10px 12px;align-items:flex-start}.tm-live-campaign .tm-cta{font-size:11px}.tm-live-campaign h3{font-size:15px}}';
    document.head.appendChild(style);
    sb.from('website_campaigns').select('campaign_type,title,subtitle,body,cta_label,cta_url,image_url').order('priority',{ascending:true}).limit(1).then(({data,error})=>{
      if(error||!data||!data[0]) return;
      const c=data[0];
      const el=document.createElement('section'); el.className='tm-live-campaign'; el.id='transmind-live-campaign';
      el.innerHTML='<div class="tm-copy"><div class="tm-type">'+esc(c.campaign_type||'PROMO')+'</div><h3>'+esc(c.title)+'</h3>'+(c.subtitle?'<p><strong>'+esc(c.subtitle)+'</strong></p>':'')+(c.body?'<p>'+esc(c.body)+'</p>':'')+'</div>'+(c.cta_url?'<a class="tm-cta" href="'+esc(c.cta_url)+'">'+esc(c.cta_label||'Lihat Penawaran')+'</a>':'')+'<button class="tm-close" aria-label="Tutup">×</button>';
      el.querySelector('.tm-close').onclick=()=>el.remove();
      const target=document.querySelector('main')||document.querySelector('#home')||document.body;
      target.insertBefore(el,target.firstChild);
    });
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot); else boot();
})();
