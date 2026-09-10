/* TRANSMIND LIVE REPAIR v1
   Authoritative public fleet + contact layer.
   Runs after legacy app.js and deliberately re-renders the final state.
*/
(function () {
  'use strict';

  const SUPABASE_URL = window.TRANSMIND_SUPABASE_URL;
  const SUPABASE_KEY = window.TRANSMIND_SUPABASE_ANON_KEY;
  const BUCKET = 'vehicle-images';
  const MAX = 24;
  const NUMBERS = [
    ['081292677888', '6281292677888'],
    ['08816654141', '628816654141']
  ];

  let timerIds = [];
  let observer = null;
  let rendering = false;

  function getClient() {
    if (!SUPABASE_URL || !SUPABASE_KEY || !window.supabase?.createClient) return null;
    return window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    });
  }

  function status(text) {
    const el = document.getElementById('fleetStatus');
    if (el) el.textContent = text;
  }

  function storageUrl(sb, path) {
    if (!path) return '';
    if (/^https?:\/\//i.test(path)) return path;
    return sb.storage.from(BUCKET).getPublicUrl(path).data?.publicUrl || '';
  }

  function renderFleet(sb, rows) {
    const box = document.getElementById('cars');
    if (!box) return;

    rendering = true;
    box.innerHTML = '';

    const valid = (rows || [])
      .filter(v => v && v.id && v.name && v.active === true && String(v.image_path || '').trim())
      .slice(0, MAX);

    valid.forEach(v => {
      const card = document.createElement('article');
      card.className = 'car';
      card.dataset.vehicleId = String(v.id);

      const photo = document.createElement('div');
      photo.className = 'photo';

      const img = document.createElement('img');
      img.src = storageUrl(sb, v.image_path);
      img.alt = v.name + ' — Transmind Nusantara Rental Mobil';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.addEventListener('error', () => {
        card.remove();
        updateFleetStatus(box);
      }, { once: true });
      photo.appendChild(img);
      card.appendChild(photo);

      const info = document.createElement('div');
      info.className = 'ci';

      if (v.category) {
        const cat = document.createElement('b');
        cat.textContent = v.category;
        info.appendChild(cat);
      }

      const title = document.createElement('h3');
      title.textContent = v.name;
      info.appendChild(title);

      if (v.capacity) {
        const capacity = document.createElement('p');
        capacity.textContent = v.capacity;
        info.appendChild(capacity);
      }

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'btn gold';
      button.textContent = 'PILIH ARMADA';
      button.addEventListener('click', () => {
        const select = document.getElementById('vehicle');
        if (select) {
          select.value = String(v.id);
          select.dispatchEvent(new Event('change', { bubbles: true }));
        }
        if (typeof window.updateVehicleInfo === 'function') window.updateVehicleInfo();
        document.getElementById('bookingForm')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
      info.appendChild(button);

      card.appendChild(info);
      box.appendChild(card);
    });

    const select = document.getElementById('vehicle');
    if (select) {
      const current = select.value;
      select.innerHTML = '<option value="">Pilih kendaraan</option>';
      valid.forEach(v => {
        const option = document.createElement('option');
        option.value = String(v.id);
        option.textContent = v.name;
        select.appendChild(option);
      });
      if (valid.some(v => String(v.id) === String(current))) select.value = current;
      if (typeof window.updateVehicleInfo === 'function') window.updateVehicleInfo();
    }

    updateFleetStatus(box);
    rendering = false;
  }

  function updateFleetStatus(box) {
    const count = box?.querySelectorAll('.car').length || 0;
    status(count ? 'Menampilkan ' + count + ' unit armada.' : 'Armada belum tersedia.');
  }

  async function loadFleet() {
    const sb = getClient();
    if (!sb) return;

    try {
      const { data, error } = await sb.from('vehicles')
        .select('id,name,category,capacity,active,image_path,sort_order')
        .eq('active', true)
        .not('image_path', 'is', null)
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('name', { ascending: true });
      if (error) throw error;
      renderFleet(sb, data || []);
      console.log('TRANSMIND LIVE REPAIR: fleet authoritative =', (data || []).length);
    } catch (e) {
      console.error('TRANSMIND LIVE REPAIR: fleet error', e);
      status('Armada gagal dimuat.');
    }
  }

  function renderContacts() {
    const contact = document.getElementById('kontak');
    if (!contact) return;

    // Remove only previously generated contact blocks or old WhatsApp paragraph.
    contact.querySelectorAll('.tm-live-wa-group').forEach(el => el.remove());
    contact.querySelectorAll('p').forEach(p => {
      const text = (p.textContent || '').replace(/\s+/g, ' ').trim();
      if (/^WhatsApp\s*:/i.test(text) || /0812-?9267-?7888/.test(text) || /08816654141/.test(text)) p.remove();
    });

    const group = document.createElement('div');
    group.className = 'tm-live-wa-group';
    group.style.cssText = 'display:block;margin:10px 0 14px;';

    NUMBERS.forEach(([display, wa]) => {
      const p = document.createElement('p');
      p.style.cssText = 'margin:6px 0;';
      p.innerHTML = '<a href="https://wa.me/' + wa + '" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:8px;text-decoration:none;">' +
        '<span aria-hidden="true" style="font-weight:700;font-size:18px;">◉</span>' +
        '<span>' + display + '</span></a>';
      group.appendChild(p);
    });

    const paragraphs = [...contact.querySelectorAll('p')];
    const email = paragraphs.find(p => /Email\s+Booking/i.test(p.textContent || ''));
    if (email) email.parentNode.insertBefore(group, email);
    else contact.querySelector('.payment-box')?.parentNode?.insertBefore(group, contact.querySelector('.payment-box'));
  }

  function schedule() {
    timerIds.forEach(clearTimeout);
    timerIds = [0, 800, 1800, 3500, 6000].map(ms => setTimeout(() => {
      renderContacts();
      loadFleet();
    }, ms));
  }

  function observe() {
    const box = document.getElementById('cars');
    if (!box || !window.MutationObserver || observer) return;
    observer = new MutationObserver(() => {
      if (rendering) return;
      const legacy = box.querySelector('.car-card, .car-image, .car-content');
      if (legacy) loadFleet();
    });
    observer.observe(box, { childList: true, subtree: true });
  }

  function boot() {
    renderContacts();
    loadFleet();
    observe();
    schedule();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
