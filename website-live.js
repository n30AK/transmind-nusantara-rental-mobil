/* =========================================================
   TRANSMIND WEBSITE LIVE CONTENT BRIDGE
   NEXUS -> PUBLIC WEBSITE
   48H BOOKING CAMPAIGN + CONVERSION CTA
   ========================================================= */
(function(){
  'use strict';

  function addStyles(){
    if(document.getElementById('tm-live-campaign-style')) return;
    const style=document.createElement('style');
    style.id='tm-live-campaign-style';
    style.textContent=[
      '.tm-live-campaign{margin:10px auto;max-width:1180px;padding:14px 18px;border:1px solid rgba(210,173,50,.35);border-radius:14px;background:linear-gradient(135deg,rgba(24,20,10,.97),rgba(12,14,18,.97));color:#fff;display:flex;gap:16px;align-items:center;justify-content:space-between;box-shadow:0 10px 30px rgba(0,0,0,.18);position:relative;z-index:20}',
      '.tm-live-campaign .tm-copy{min-width:0}.tm-live-campaign .tm-type{font-size:10px;letter-spacing:1.6px;color:#f0cf68;font-weight:800;text-transform:uppercase}',
      '.tm-live-campaign h3{margin:4px 0;font-size:18px}.tm-live-campaign p{margin:0;color:#b9bec7;font-size:12px;line-height:1.45}',
      '.tm-live-campaign .tm-cta{display:inline-block;white-space:nowrap;text-decoration:none;background:#d2ad32;color:#111;font-weight:800;border-radius:9px;padding:10px 14px}',
      '.tm-live-campaign .tm-close{border:0;background:transparent;color:#8e949f;font-size:18px;cursor:pointer;padding:4px 6px}',
      '.tm-booking-float{display:none;position:fixed;left:14px;right:14px;bottom:14px;z-index:9999;text-align:center;text-decoration:none;background:#d2ad32;color:#111;font-weight:900;border-radius:12px;padding:13px 16px;box-shadow:0 12px 32px rgba(0,0,0,.35);letter-spacing:.2px}',
      '@media(max-width:650px){.tm-live-campaign{margin:8px 12px;padding:13px 14px;align-items:flex-start}.tm-live-campaign .tm-cta{font-size:11px}.tm-live-campaign h3{font-size:15px}.tm-live-campaign p{font-size:11px}.tm-booking-float{display:block}.tm-live-campaign .tm-close{font-size:16px}}'
    ].join('');
    document.head.appendChild(style);
  }

  function esc(v){
    return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function mountCampaign(c){
    const old=document.getElementById('transmind-live-campaign');
    if(old) old.remove();

    const el=document.createElement('section');
    el.className='tm-live-campaign';
    el.id='transmind-live-campaign';
    el.setAttribute('aria-label','Kampanye booking Transmind');
    el.innerHTML='<div class="tm-copy"><div class="tm-type">'+esc(c.campaign_type||'BOOKING')+'</div><h3>'+esc(c.title)+'</h3>'
      +(c.subtitle?'<p><strong>'+esc(c.subtitle)+'</strong></p>':'')
      +(c.body?'<p>'+esc(c.body)+'</p>':'')
      +'</div>'
      +(c.cta_url?'<a class="tm-cta" href="'+esc(c.cta_url)+'">'+esc(c.cta_label||'BOOKING SEKARANG')+'</a>':'')
      +'<button class="tm-close" type="button" aria-label="Tutup kampanye">×</button>';

    el.querySelector('.tm-close').addEventListener('click',()=>el.remove());

    const header=document.querySelector('header');
    if(header && header.parentNode) header.insertAdjacentElement('afterend',el);
    else document.body.insertBefore(el,document.body.firstChild);

    const float=document.createElement('a');
    float.className='tm-booking-float';
    float.href=c.cta_url||'#booking';
    float.textContent=c.cta_label||'BOOKING SEKARANG';
    float.setAttribute('aria-label','Booking rental mobil Transmind sekarang');
    document.body.appendChild(float);
  }

  function boot(){
    addStyles();
    if(!window.supabase || !window.TRANSMIND_SUPABASE_URL || !window.TRANSMIND_SUPABASE_ANON_KEY) return;

    const sb=window.supabase.createClient(window.TRANSMIND_SUPABASE_URL,window.TRANSMIND_SUPABASE_ANON_KEY);
    sb.from('website_campaigns')
      .select('campaign_type,title,subtitle,body,cta_label,cta_url,image_url,priority,active,starts_at,ends_at')
      .eq('active',true)
      .order('priority',{ascending:true})
      .limit(20)
      .then(({data,error})=>{
        if(error||!Array.isArray(data)) return;
        const now=Date.now();
        const live=data.filter(function(c){
          const start=c.starts_at?Date.parse(c.starts_at):0;
          const end=c.ends_at?Date.parse(c.ends_at):Infinity;
          return start<=now && now<=end;
        });
        if(live[0]) mountCampaign(live[0]);
      })
      .catch(()=>{});
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',boot);
  else boot();
})();