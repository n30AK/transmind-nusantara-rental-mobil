/* =========================================================
   TRANSMIND WEBSITE LIVE CONTENT BRIDGE
   NEXUS -> PUBLIC WEBSITE
   Contact WhatsApp is managed by contact-polish.js only.
   ========================================================= */
(function(){
  'use strict';

  function setupWhatsAppContact(){
    const contact=document.querySelector('#kontak');
    if(!contact) return;

    // Do not create, append, or move WhatsApp contact rows here.
    // contact-polish.js is the single source of truth for the two numbers.
  }

  function boot(){
    setupWhatsAppContact();

    if(!window.supabase || !window.TRANSMIND_SUPABASE_URL || !window.TRANSMIND_SUPABASE_ANON_KEY) return;
    const sb=window.supabase.createClient(window.TRANSMIND_SUPABASE_URL,window.TRANSMIND_SUPABASE_ANON_KEY);
    const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    if(!document.getElementById('tm-live-campaign-style')){
      const style=document.createElement('style');
      style.id='tm-live-campaign-style';
      style.textContent='.tm-live-campaign{margin:12px auto;max-width:1180px;padding:14px 18px;border:1px solid rgba(210,173,50,.35);border-radius:14px;background:linear-gradient(135deg,rgba(24,20,10,.96),rgba(12,14,18,.96));color:#fff;display:flex;gap:16px;align-items:center;justify-content:space-between;box-shadow:0 10px 30px rgba(0,0,0,.18)}.tm-live-campaign .tm-copy{min-width:0}.tm-live-campaign .tm-type{font-size:10px;letter-spacing:1.6px;color:#f0cf68;font-weight:800;text-transform:uppercase}.tm-live-campaign h3{margin:4px 0;font-size:18px}.tm-live-campaign p{margin:0;color:#b9bec7;font-size:12px;line-height:1.45}.tm-live-campaign .tm-cta{display:inline-block;white-space:nowrap;text-decoration:none;background:#d2ad32;color:#111;font-weight:800;border-radius:9px;padding:9px 13px}.tm-live-campaign .tm-close{border:0;background:transparent;color:#8e949f;font-size:18px;cursor:pointer}@media(max-width:650px){.tm-live-campaign{margin:10px 12px;align-items:flex-start}.tm-live-campaign .tm-cta{font-size:11px}.tm-live-campaign h3{font-size:15px}}';
      document.head.appendChild(style);
    }
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
