/* TRANSMIND FLEET HARD FIX v1
   Production rule: render the 24 active vehicles that have real image_path values.
   This layer intentionally runs after the legacy fleet renderer so it can correct
   stale/partial rendering without changing the public design.
*/
(function(){
  'use strict';

  const MAX=24;
  const BUCKET='vehicle-images';

  function esc(v){
    return String(v==null?'':v)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');
  }

  function client(){
    const url=window.TRANSMIND_SUPABASE_URL;
    const key=window.TRANSMIND_SUPABASE_ANON_KEY;
    if(!url||!key||!window.supabase||typeof window.supabase.createClient!=='function') return null;
    return window.supabase.createClient(url,key);
  }

  function imageUrl(sb,path){
    if(!path) return '';
    if(/^https?:\\/\\//i.test(path)) return path;
    return sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl||'';
  }

  function render(sb,vehicles){
    const box=document.querySelector('#cars');
    if(!box) return;
    box.innerHTML='';

    vehicles.slice(0,MAX).forEach(function(v){
      const card=document.createElement('div');
      card.className='car-card';
      card.dataset.vehicleId=v.id;

      const img=document.createElement('img');
      img.className='car-image';
      img.alt=v.name||'Armada Transmind';
      img.loading='lazy';
      img.src=imageUrl(sb,v.image_path);
      img.onerror=function(){
        console.warn('Armada image failed:',v.name,v.image_path);
        card.remove();
        updateStatus();
      };

      const content=document.createElement('div');
      content.className='car-content';

      const title=document.createElement('h3');
      title.textContent=v.name||'';
      content.appendChild(title);

      if(v.category){
        const category=document.createElement('p');
        category.className='car-category';
        category.textContent=v.category;
        content.appendChild(category);
      }

      if(v.capacity){
        const capacity=document.createElement('p');
        capacity.className='car-capacity';
        capacity.textContent='Kapasitas: '+v.capacity+' orang';
        content.appendChild(capacity);
      }

      const button=document.createElement('button');
      button.type='button';
      button.className='btn gold';
      button.textContent='PILIH ARMADA';
      button.addEventListener('click',function(){
        if(typeof window.selectVehicle==='function') window.selectVehicle(v.id);
      });
      content.appendChild(button);

      card.appendChild(img);
      card.appendChild(content);
      box.appendChild(card);
    });

    updateStatus();
  }

  function updateStatus(){
    const box=document.querySelector('#cars');
    const status=document.querySelector('#fleetStatus');
    if(status&&box) status.textContent='Menampilkan '+box.querySelectorAll('.car-card').length+' unit armada.';
  }

  async function boot(){
    const box=document.querySelector('#cars');
    if(!box) return;
    const sb=client();
    if(!sb) return;

    try{
      const res=await sb.from('vehicles')
        .select('id,name,category,capacity,active,image_path,sort_order')
        .eq('active',true)
        .not('image_path','is',null)
        .order('sort_order',{ascending:true,nullsFirst:false})
        .order('name',{ascending:true})
        .limit(MAX);

      if(res.error) throw res.error;
      const vehicles=(res.data||[]).filter(v=>v&&v.id&&v.name&&v.image_path);
      console.log('TRANSMIND FLEET HARD FIX:',vehicles.length,'photo-ready vehicles');
      render(sb,vehicles);
    }catch(err){
      console.error('TRANSMIND FLEET HARD FIX gagal:',err);
    }
  }

  function start(){
    setTimeout(boot,900);
    setTimeout(boot,2200);
  }

  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start);
  else start();
})();
