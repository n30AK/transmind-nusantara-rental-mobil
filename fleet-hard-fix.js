/* TRANSMIND FLEET STORAGE RENDERER v2 */
(function(){
  'use strict';
  const MAX=24,BUCKET='vehicle-images',IMAGE_EXT=/\.(jpe?g|png|webp|gif)$/i;
  function client(){
    const u=window.TRANSMIND_SUPABASE_URL,k=window.TRANSMIND_SUPABASE_ANON_KEY;
    if(!u||!k||!window.supabase||typeof window.supabase.createClient!=='function') return null;
    return window.supabase.createClient(u,k,{auth:{persistSession:false,autoRefreshToken:false}});
  }
  function imageUrl(sb,path){return path&&/^https?:\/\//i.test(path)?path:(path?sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl||'':'');}
  async function storageFiles(sb){
    const r=await sb.storage.from(BUCKET).list('',{limit:100,offset:0,sortBy:{column:'name',order:'asc'}});
    if(r.error) throw r.error;
    const s=new Set();(r.data||[]).forEach(x=>{if(x&&x.id!==null&&x.name&&IMAGE_EXT.test(x.name))s.add(x.name);});return s;
  }
  function updateStatus(){const b=document.querySelector('#cars'),s=document.querySelector('#fleetStatus');if(s&&b)s.textContent='Menampilkan '+b.querySelectorAll('.car').length+' unit armada.';}
  function render(sb,vehicles,files){
    const box=document.querySelector('#cars');if(!box)return;box.innerHTML='';
    vehicles.filter(v=>v&&v.id&&v.name&&v.image_path&&files.has(v.image_path)).slice(0,MAX).forEach(v=>{
      const card=document.createElement('article');card.className='car';card.dataset.vehicleId=v.id;
      const photo=document.createElement('div');photo.className='photo';
      const img=document.createElement('img');img.src=imageUrl(sb,v.image_path);img.alt=v.name+' — Transmind Nusantara Rental Mobil';img.loading='lazy';img.decoding='async';img.onerror=()=>{card.remove();updateStatus()};photo.appendChild(img);card.appendChild(photo);
      const info=document.createElement('div');info.className='ci';
      if(v.category){const b=document.createElement('b');b.textContent=v.category;info.appendChild(b);}
      const h=document.createElement('h3');h.textContent=v.name;info.appendChild(h);
      if(v.capacity){const p=document.createElement('p');p.textContent=v.capacity;info.appendChild(p);}
      const btn=document.createElement('button');btn.type='button';btn.className='btn gold';btn.textContent='PILIH ARMADA';btn.onclick=()=>{if(typeof window.selectVehicle==='function')window.selectVehicle(v.id)};info.appendChild(btn);
      card.appendChild(info);box.appendChild(card);
    });
    updateStatus();console.log('TRANSMIND FLEET STORAGE:',box.querySelectorAll('.car').length,'/ 24');
  }
  async function boot(){
    const box=document.querySelector('#cars'),sb=client();if(!box||!sb)return;
    try{
      const [vr,files]=await Promise.all([
        sb.from('vehicles').select('id,name,category,capacity,active,image_path,sort_order').eq('active',true).not('image_path','is',null).order('sort_order',{ascending:true,nullsFirst:false}).order('name',{ascending:true}).limit(MAX),
        storageFiles(sb)
      ]);
      if(vr.error)throw vr.error;render(sb,vr.data||[],files);
    }catch(e){console.error('TRANSMIND FLEET STORAGE gagal:',e);box.innerHTML='';updateStatus();}
  }
  function start(){boot();setTimeout(boot,1200)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
