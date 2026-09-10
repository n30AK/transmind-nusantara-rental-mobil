/* TRANSMIND FLEET — SUPABASE STORAGE AUTHORITATIVE */
(function(){
  'use strict';
  const MAX=24;
  const BUCKET='vehicle-images';

  function getClient(){
    const u=window.TRANSMIND_SUPABASE_URL,k=window.TRANSMIND_SUPABASE_ANON_KEY;
    if(!u||!k||!window.supabase||typeof window.supabase.createClient!=='function')return null;
    return window.supabase.createClient(u,k,{auth:{persistSession:false,autoRefreshToken:false}});
  }

  function publicUrl(sb,path){
    if(!path)return '';
    if(/^https?:\/\//i.test(path))return path;
    return sb.storage.from(BUCKET).getPublicUrl(path).data?.publicUrl||'';
  }

  function status(box){
    const s=document.querySelector('#fleetStatus');
    if(s&&box)s.textContent='Menampilkan '+box.querySelectorAll('.car').length+' unit armada.';
  }

  function render(sb,rows){
    const box=document.querySelector('#cars');
    if(!box)return false;
    box.innerHTML='';

    rows.filter(v=>v&&v.id&&v.name&&v.active===true&&v.image_path).slice(0,MAX).forEach(v=>{
      const card=document.createElement('article');
      card.className='car';
      card.dataset.vehicleId=v.id;

      const photo=document.createElement('div');
      photo.className='photo';
      const img=document.createElement('img');
      img.src=publicUrl(sb,v.image_path);
      img.alt=v.name+' — Transmind Nusantara Rental Mobil';
      img.loading='lazy';
      img.decoding='async';
      img.onerror=function(){card.remove();status(box)};
      photo.appendChild(img);
      card.appendChild(photo);

      const info=document.createElement('div');
      info.className='ci';
      const cat=document.createElement('b');
      cat.textContent=v.category||'';
      if(v.category)info.appendChild(cat);
      const h=document.createElement('h3');
      h.textContent=v.name;
      info.appendChild(h);
      if(v.capacity){
        const p=document.createElement('p');
        p.textContent=v.capacity;
        info.appendChild(p);
      }
      const btn=document.createElement('button');
      btn.type='button';
      btn.className='btn gold';
      btn.textContent='PILIH ARMADA';
      btn.addEventListener('click',function(){
        if(typeof window.selectVehicle==='function')window.selectVehicle(v.id);
      });
      info.appendChild(btn);
      card.appendChild(info);
      box.appendChild(card);
    });

    status(box);
    console.log('TRANSMIND FLEET: Supabase vehicles + Storage',box.querySelectorAll('.car').length,'/ 24');
    return true;
  }

  async function load(){
    const box=document.querySelector('#cars');
    const sb=getClient();
    if(!box||!sb)return;
    try{
      const r=await sb.from('vehicles')
        .select('id,name,category,capacity,active,image_path,sort_order')
        .eq('active',true)
        .not('image_path','is',null)
        .order('sort_order',{ascending:true,nullsFirst:false})
        .order('name',{ascending:true});
      if(r.error)throw r.error;
      render(sb,r.data||[]);
    }catch(e){
      console.error('TRANSMIND FLEET STORAGE gagal:',e);
    }
  }

  function start(){
    [0,500,1200,2500,4500].forEach(ms=>setTimeout(load,ms));
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
