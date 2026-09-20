'use strict';
(function(){
const url=window.TRANSMIND_SUPABASE_URL,key=window.TRANSMIND_SUPABASE_ANON_KEY;
const client=window.supabase.createClient(url,key);
let rows=[],lastUndo=null,undoBusy=false,editImage=null;
const $=id=>document.getElementById(id), toast=m=>{const e=$('toast');e.textContent=m;e.classList.add('show');clearTimeout(window.__tmToast);window.__tmToast=setTimeout(()=>e.classList.remove('show'),2600)};
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
function setUndo(fn){lastUndo=fn;$('undoBtn').disabled=!fn}
async function init(){
 const {data:{session}}=await client.auth.getSession();
 if(session){$('sessionState').textContent='Admin session';$('logoutBtn').classList.remove('hidden');$('fleetApp').classList.remove('hidden');await load();}
 else{$('sessionState').textContent='Login required';$('loginPanel').classList.remove('hidden')}
 client.auth.onAuthStateChange(async(_,s)=>{if(s){$('loginPanel').classList.add('hidden');$('fleetApp').classList.remove('hidden');$('logoutBtn').classList.remove('hidden');await load()}});
}
async function load(){
 const {data,error}=await client.from('vehicles').select('*').order('sort_order',{ascending:true}).order('name',{ascending:true});
 if(error){toast(error.message);return} rows=data||[];render();
}
function render(){
 const q=$('search').value.trim().toLowerCase(),f=$('statusFilter').value;
 const view=rows.filter(v=>(!q||[v.name,v.slug,v.category,v.capacity].some(x=>String(x||'').toLowerCase().includes(q)))&&(f==='all'||(f==='active'?v.active:!v.active)));
 $('totalCount').textContent=rows.length;$('activeCount').textContent=rows.filter(v=>v.active).length;$('inactiveCount').textContent=rows.filter(v=>!v.active).length;$('unitCount').textContent=rows.reduce((n,v)=>n+(Number(v.total_units)||0),0);
 $('fleetRows').innerHTML=view.length?view.map(v=>'<tr><td><div class="vehicle-cell">'+(v.image_path?'<img class="thumb" src="'+esc(publicUrl(v.image_path))+'" alt="">':'<div class="thumb"></div>')+'<div><b>'+esc(v.name)+'</b><small>'+esc(v.slug)+'</small></div></div></td><td>'+esc(v.category||'—')+'</td><td>'+esc(v.capacity||'—')+'</td><td>'+Number(v.total_units||0)+'</td><td><span class="badge '+(v.active?'ok':'off')+'">'+(v.active?'Aktif':'Nonaktif')+'</span></td><td>'+Number(v.sort_order||0)+'</td><td><div class="row-actions"><button class="btn ghost" data-edit="'+v.id+'">Edit</button><button class="btn ghost" data-toggle="'+v.id+'">'+(v.active?'Nonaktifkan':'Aktifkan')+'</button><button class="btn danger" data-delete="'+v.id+'">Hapus</button></div></td></tr>').join(''):'<tr><td colspan="7" class="loading">Tidak ada data yang cocok.</td></tr>';
}
function publicUrl(path){return client.storage.from('vehicle-images').getPublicUrl(path).data.publicUrl}
function openDrawer(v){
 $('drawerTitle').textContent=v?'Edit Armada':'Tambah Armada';$('vehicleId').value=v?.id||'';$('name').value=v?.name||'';$('slug').value=v?.slug||'';$('category').value=v?.category||'';$('capacity').value=v?.capacity||'';$('totalUnits').value=v?.total_units??5;$('sortOrder').value=v?.sort_order??0;$('active').checked=v?.active!==false;$('formError').textContent='';editImage=null;
 $('photoPreview').innerHTML=v?.image_path?'<img src="'+esc(publicUrl(v.image_path))+'" alt="">':'No image';$('drawer').classList.remove('hidden');$('drawer').setAttribute('aria-hidden','false');$('name').focus()
}
function closeAll(){document.querySelectorAll('.drawer-wrap,.modal-wrap').forEach(e=>{e.classList.add('hidden');e.setAttribute('aria-hidden','true')})}
async function save(e){
 e.preventDefault();$('saveBtn').disabled=true;$('formError').textContent='';
 const id=$('vehicleId').value||null,name=$('name').value.trim(),slug=$('slug').value.trim().toLowerCase().replace(/[^a-z0-9-]+/g,'-').replace(/^-|-$/g,'');
 if(!name||!slug){$('formError').textContent='Nama dan slug wajib diisi.';$('saveBtn').disabled=false;return}
 let old=rows.find(v=>v.id===id)||null,image_path=old?.image_path||null;
 if(editImage){const ext=(editImage.name.split('.').pop()||'jpg').toLowerCase(),path='fleet/'+slug+'-'+Date.now()+'.'+ext;const up=await client.storage.from('vehicle-images').upload(path,editImage,{upsert:false});if(up.error){$('formError').textContent=up.error.message;$('saveBtn').disabled=false;return}image_path=path}
 const payload={name,slug,category:$('category').value||null,capacity:$('capacity').value.trim()||null,total_units:Math.max(0,Number($('totalUnits').value)||0),sort_order:Number($('sortOrder').value)||0,active:$('active').checked,image_path};
 let res=id?await client.from('vehicles').update(payload).eq('id',id).select().single():await client.from('vehicles').insert(payload).select().single();
 if(res.error){$('formError').textContent=res.error.message;$('saveBtn').disabled=false;return}
 const saved=res.data;
 setUndo(async()=>{if(id){await client.from('vehicles').update(old).eq('id',id)}else{await client.from('vehicles').delete().eq('id',saved.id)}await load();toast('Perubahan terakhir dibatalkan');setUndo(null)});
 await load();closeAll();toast(id?'Armada diperbarui':'Armada ditambahkan');$('saveBtn').disabled=false
}
async function toggle(id){
 const v=rows.find(x=>x.id===id);if(!v)return;const next=!v.active,res=await client.from('vehicles').update({active:next}).eq('id',id).select().single();if(res.error){toast(res.error.message);return}
 setUndo(async()=>{await client.from('vehicles').update({active:v.active}).eq('id',id);await load();toast('Status dikembalikan');setUndo(null)});await load();toast(next?'Armada diaktifkan':'Armada dinonaktifkan')
}
function askDelete(id){const v=rows.find(x=>x.id===id);if(!v)return;$('confirmText').textContent='Armada "'+v.name+'" akan dihapus permanen dari master database.';$('confirmDelete').dataset.id=id;$('confirm').classList.remove('hidden')}
async function del(id){
 const v=rows.find(x=>x.id===id);if(!v)return;const res=await client.from('vehicles').delete().eq('id',id);if(res.error){toast(res.error.message);return}
 setUndo(async()=>{await client.from('vehicles').insert(v);await load();toast('Armada dipulihkan');setUndo(null)});await load();closeAll();toast('Armada dihapus')
}
$('newBtn').addEventListener('click',()=>openDrawer());$('fleetForm').addEventListener('submit',save);$('imageFile').addEventListener('change',e=>{editImage=e.target.files[0]||null;if(editImage){$('photoPreview').innerHTML='<img src="'+URL.createObjectURL(editImage)+'" alt="">'}});$('search').addEventListener('input',render);$('statusFilter').addEventListener('change',render);$('clearSearch').addEventListener('click',()=>{$('search').value='';render();$('search').focus()});$('search').addEventListener('input',()=>{$('clearSearch').classList.toggle('hidden',!$('search').value)});
$('fleetRows').addEventListener('click',e=>{const b=e.target.closest('button');if(!b)return;if(b.dataset.edit)openDrawer(rows.find(v=>v.id===b.dataset.edit));if(b.dataset.toggle)toggle(b.dataset.toggle);if(b.dataset.delete)askDelete(b.dataset.delete)});
document.querySelectorAll('[data-close]').forEach(e=>e.addEventListener('click',closeAll));$('confirmDelete').addEventListener('click',e=>del(e.currentTarget.dataset.id));$('undoBtn').addEventListener('click',async()=>{if(lastUndo&&!undoBusy){undoBusy=true;const f=lastUndo;setUndo(null);await f();undoBusy=false}});$('loginForm').addEventListener('submit',async e=>{e.preventDefault();$('loginError').textContent='';const r=await client.auth.signInWithPassword({email:$('loginEmail').value,password:$('loginPassword').value});if(r.error)$('loginError').textContent=r.error.message});$('logoutBtn').addEventListener('click',()=>client.auth.signOut());init();
})();