/* =========================================================
   TRANSMIND PUBLIC FINAL FIX
   - Supabase vehicles + Storage are authoritative for fleet
   - 24 active vehicles maximum
   - No image placeholder cards
   - Exact two WhatsApp contact rows
   - Does not alter the rest of the public layout
   ========================================================= */
(function(){
  'use strict';

  const MAX_FLEET = 24;
  const BUCKET = 'vehicle-images';
  const NUMBERS = [
    { display: '081292677888', wa: '6281292677888' },
    { display: '08816654141', wa: '628816654141' }
  ];

  let fleetObserver = null;
  let renderingFleet = false;

  function client(){
    const u = window.TRANSMIND_SUPABASE_URL;
    const k = window.TRANSMIND_SUPABASE_ANON_KEY;
    if(!u || !k || !window.supabase || typeof window.supabase.createClient !== 'function') return null;
    return window.supabase.createClient(u,k,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
  }

  function setStatus(text){
    const el = document.getElementById('fleetStatus');
    if(el) el.textContent = text || '';
  }

  function imageUrl(sb,path){
    if(!path) return '';
    if(/^https?:\/\//i.test(path)) return path;
    return sb.storage.from(BUCKET).getPublicUrl(path).data?.publicUrl || '';
  }

  function selectVehicle(id){
    const select = document.getElementById('vehicle');
    if(select){
      select.value = id;
      select.dispatchEvent(new Event('change',{bubbles:true}));
    }
    if(typeof window.updateVehicleInfo === 'function') window.updateVehicleInfo();
    const form = document.getElementById('bookingForm');
    if(form) form.scrollIntoView({behavior:'smooth',block:'center'});
  }

  function populateSelect(rows){
    const select = document.getElementById('vehicle');
    if(!select) return;
    const current = select.value;
    select.innerHTML = '<option value="">Pilih kendaraan</option>';
    rows.forEach(v=>{
      const o = document.createElement('option');
      o.value = v.id;
      o.textContent = v.name;
      select.appendChild(o);
    });
    if(current && rows.some(v=>String(v.id)===String(current))) select.value=current;
    if(typeof window.updateVehicleInfo === 'function') window.updateVehicleInfo();
  }

  function renderFleet(sb,rows){
    const box = document.getElementById('cars');
    if(!box) return;

    renderingFleet = true;
    if(fleetObserver) fleetObserver.disconnect();
    box.innerHTML = '';

    const valid = (rows || [])
      .filter(v=>v && v.id && v.name && v.active === true && String(v.image_path || '').trim())
      .slice(0,MAX_FLEET);

    valid.forEach(v=>{
      const card = document.createElement('article');
      card.className = 'car';
      card.dataset.vehicleId = v.id;

      const photo = document.createElement('div');
      photo.className = 'photo';

      const img = document.createElement('img');
      img.src = imageUrl(sb,v.image_path);
      img.alt = v.name + ' — Transmind Nusantara Rental Mobil';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.addEventListener('error',()=>{
        card.remove();
        updateStatus(box);
      },{once:true});
      photo.appendChild(img);
      card.appendChild(photo);

      const info = document.createElement('div');
      info.className = 'ci';

      if(v.category){
        const cat = document.createElement('b');
        cat.textContent = v.category;
        info.appendChild(cat);
      }

      const h = document.createElement('h3');
      h.textContent = v.name;
      info.appendChild(h);

      if(v.capacity){
        const p = document.createElement('p');
        p.textContent = v.capacity;
        info.appendChild(p);
      }

      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'btn gold';
      btn.textContent = 'PILIH ARMADA';
      btn.addEventListener('click',()=>selectVehicle(v.id));
      info.appendChild(btn);

      card.appendChild(info);
      box.appendChild(card);
    });

    populateSelect(valid);
    updateStatus(box);

    if(!valid.length) setStatus('Armada belum tersedia.');
    renderingFleet = false;

    observeFleet(box);
  }

  function updateStatus(box){
    const count = box ? box.querySelectorAll('.car').length : 0;
    setStatus(count ? 'Menampilkan ' + count + ' unit armada.' : 'Armada belum tersedia.');
  }

  function observeFleet(box){
    if(!window.MutationObserver || !box) return;
    fleetObserver = new MutationObserver(()=>{
      if(renderingFleet) return;
      const hasFinalCards = box.querySelector('.car');
      const hasLegacyCards = box.querySelector('.car-card, .car-image, .car-content');
      if(hasLegacyCards && !hasFinalCards){
        loadFleet();
      }
    });
    fleetObserver.observe(box,{childList:true,subtree:true});
  }

  async function loadFleet(){
    const sb = client();
    if(!sb) return;
    try{
      const {data,error} = await sb.from('vehicles')
        .select('id,name,category,capacity,active,image_path,sort_order')
        .eq('active',true)
        .not('image_path','is',null)
        .order('sort_order',{ascending:true,nullsFirst:false})
        .order('name',{ascending:true});
      if(error) throw error;
      renderFleet(sb,data || []);
      console.log('TRANSMIND PUBLIC FINAL: fleet', (data || []).length, '/ 24');
    }catch(error){
      console.error('TRANSMIND PUBLIC FINAL: fleet gagal',error);
      setStatus('Armada gagal dimuat.');
    }
  }

  const WA_ICON = '<svg class="tm-wa-icon-final" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><path fill="currentColor" d="M16 3.2A12.8 12.8 0 0 0 5.1 22.7L3.3 28.7l6.2-1.8A12.8 12.8 0 1 0 16 3.2Zm0 23.2a10.4 10.4 0 0 1-5.3-1.5l-.4-.2-3.7 1.1 1.1-3.6-.2-.4A10.4 10.4 0 1 1 16 26.4Zm5.7-7.8c-.3-.2-1.8-.9-2.1-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.2-.2.2-.3.3-.6.1-1.6-.8-2.7-1.5-3.8-3.3-.3-.5.3-.5.8-1.6.1-.2.1-.4 0-.6-.1-.2-.7-1.7-.9-2.3-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.1 1-1.1 2.5s1.1 2.9 1.2 3.1c.2.2 2.2 3.4 5.4 4.8 2 .9 2.8 1 3.8.9.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.1-.3-.2-.6-.4Z"/></svg>';

  function renderContact(){
    const c = document.getElementById('kontak');
    if(!c) return;

    if(!document.getElementById('tm-contact-final-style')){
      const s=document.createElement('style');
      s.id='tm-contact-final-style';
      s.textContent='#kontak .tm-wa-group-final{display:block!important;margin:10px 0 14px!important}#kontak .tm-wa-line-final{display:block!important;margin:6px 0!important;line-height:1.4!important}#kontak .tm-wa-line-final a{display:inline-flex!important;align-items:center!important;gap:8px!important;text-decoration:none!important;color:inherit!important}#kontak .tm-wa-icon-final{width:19px;height:19px;display:inline-block;flex:0 0 19px}';
      document.head.appendChild(s);
    }

    c.querySelectorAll('.tm-wa-group-final').forEach(e=>e.remove());
    c.querySelectorAll('[data-transmind-wa]').forEach(e=>{const p=e.closest('p'); if(p) p.remove(); else e.remove();});
    c.querySelectorAll('p').forEach(p=>{
      const t=(p.textContent||'').replace(/\s+/g,' ');
      if(/^\s*WhatsApp\s*:/i.test(t)) p.remove();
    });

    const group=document.createElement('div');
    group.className='tm-wa-group-final';
    NUMBERS.forEach(n=>{
      const row=document.createElement('div');
      row.className='tm-wa-line-final';
      row.innerHTML='<a href="https://wa.me/'+n.wa+'" target="_blank" rel="noopener noreferrer" aria-label="WhatsApp '+n.display+'">'+WA_ICON+'<span>'+n.display+'</span></a>';
      group.appendChild(row);
    });

    const paragraphs=Array.from(c.querySelectorAll('p'));
    const booking=paragraphs.find(p=>/Email\s*Booking/i.test(p.textContent||''));
    if(booking) c.insertBefore(group,booking);
    else c.appendChild(group);
  }

  function boot(){
    renderContact();
    [0,600,1400,2800,5000].forEach(ms=>setTimeout(loadFleet,ms));
    [0,700,1800,3500].forEach(ms=>setTimeout(renderContact,ms));
  }

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded',boot);
  else boot();
})();
