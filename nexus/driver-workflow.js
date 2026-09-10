(()=>{
'use strict';
const C=window.NEXUS_CONFIG||{}; if(!C.supabaseUrl||!C.supabaseAnonKey)return;
const db=supabase.createClient(C.supabaseUrl,C.supabaseAnonKey);
const esc=s=>String(s??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
const root=()=>document.querySelector('.page.active .nx-driver');
async function rpc(name,args){const r=await db.rpc(name,args);if(r.error){alert(r.error.message);throw r.error}return r.data}
function add(){const h=root();if(!h||!h.querySelector('.nx-dtable'))return;h.querySelectorAll('tbody tr').forEach(tr=>{if(tr.dataset.workflowReady==='1')return;const step=tr.querySelector('[data-step]');const card=tr.querySelector('[data-card]');if(!step)return;const id=step.dataset.step;const status=(tr.cells[4]?.textContent||'').trim().toLowerCase();const box=step.parentElement;const mk=(label,fn)=>{const b=document.createElement('button');b.className='secondary';b.textContent=label;b.dataset.workflow='1';b.onclick=fn;box.appendChild(document.createTextNode(' '));box.appendChild(b)};if(status==='accepted')mk('Start Trip',async()=>{await rpc('nexus_start_driver_trip',{p_assignment_id:id});location.reload()});if(status==='started')mk('Complete',async()=>{await rpc('nexus_complete_driver_trip',{p_assignment_id:id});location.reload()});if(status==='completed')mk('Release Unit',async()=>{if(!confirm('Release driver dan unit setelah trip selesai?'))return;await rpc('nexus_release_completed_assignment',{p_assignment_id:id});location.reload()});tr.dataset.workflowReady='1'})}
const mo=new MutationObserver(add);mo.observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});setInterval(add,700);setTimeout(add,1500);
})();