/* TransMind Nexus — Customer Care Outcome Learning
 * Lets admins close the loop without losing the learning signal.
 */
(function(){
'use strict';
const db=()=>window.NXSB||window.getTransmindSupabaseClient?.()||null;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const norm=v=>String(v||'').replace(/\D/g,'');
async function boot(){
 const host=document.getElementById('content-ai-customer-service'); if(!host||host.dataset.tmOutcomeMounted)return;
 const d=db(); if(!d)return;
 host.dataset.tmOutcomeMounted='1';
 const box=document.createElement('div');box.className='acs-card';box.style.marginTop='12px';
 box.innerHTML='<h3>🧠 Pembelajaran dari hasil follow-up</h3><div class="acs-note">Admin menandai hasil komunikasi. Hasil ini menjadi sinyal pembelajaran agar AI tidak mengulang pendekatan yang sama dan tidak terus mengejar pelanggan yang sudah booking atau meminta berhenti.</div><div id="tm-outcome-rows" class="acs-table" style="margin-top:10px"><div class="acs-note">Memuat peluang…</div></div>';
 host.appendChild(box);
 await render();
 async function render(){
  const out=document.getElementById('tm-outcome-rows'); if(!out)return;
  const [leads,tasks]=await Promise.all([
   d.from('customer_care_leads').select('id,name,phone,status,stage,intent,quote_value,last_activity_at,next_followup_at,human_required,human_reason').in('status',['open','paused']).order('last_activity_at',{ascending:false}).limit(30),
   d.from('crm_tasks').select('id,status,priority,title,next_followup_at,metadata').eq('task_type','AI_CUSTOMER_CARE_FOLLOWUP').in('status',['open','OPEN','IN_PROGRESS']).order('next_followup_at',{ascending:true}).limit(50)
  ]);
  if(leads.error||tasks.error){out.innerHTML='<div class="acs-note">Antrean outcome belum dapat dibaca: '+esc((leads.error||tasks.error).message)+'</div>';return}
  const rows=leads.data||[];
  if(!rows.length){out.innerHTML='<div class="acs-note" style="padding:12px">Belum ada lead terbuka yang membutuhkan outcome.</div>';return}
  out.innerHTML='<div class="acs-row acs-head"><span>Calon pelanggan</span><span>Status</span><span>Intent</span><span>Follow-up</span><span>Hasil</span></div>'+rows.map(x=>'<div class="acs-row"><span><b>'+esc(x.name)+'</b><br><small>'+esc(x.phone)+'</small></span><span class="acs-pill">'+esc(x.status)+'</span><span>'+esc(x.intent||'consultation')+'</span><span>'+esc(x.next_followup_at||'—')+'</span><span class="acs-actions"><button class="acs-btn green" data-cc-outcome="contacted" data-id="'+esc(x.id)+'">Dihubungi</button><button class="acs-btn primary" data-cc-outcome="booked" data-id="'+esc(x.id)+'">Booking</button><button class="acs-btn" data-cc-outcome="lost" data-id="'+esc(x.id)+'">Belum jadi</button><button class="acs-btn" data-cc-outcome="dnc" data-id="'+esc(x.id)+'">Stop</button></span></div>').join('');
  out.querySelectorAll('[data-cc-outcome]').forEach(b=>b.addEventListener('click',()=>apply(b.dataset.id,b.dataset.ccOutcome)));
 }
 async function apply(id,outcome){
  const lead=(await d.from('customer_care_leads').select('id,name,phone,status,stage,intent,quote_value').eq('id',id).maybeSingle()).data;
  if(!lead)return;
  const map={contacted:{status:'open',stage:'followed_up',label:'contacted'},booked:{status:'booked',stage:'booked',label:'booked'},lost:{status:'lost',stage:'lost',label:'lost'},dnc:{status:'do_not_contact',stage:'closed',label:'do_not_contact'}}[outcome];
  const now=new Date().toISOString();
  const upd=await d.from('customer_care_leads').update({status:map.status,stage:map.stage,last_activity_at:now,next_followup_at:map.status==='open'?new Date(Date.now()+3*86400000).toISOString():null,followup_stage:map.status==='open'?'3d':'closed',metadata:{last_admin_outcome:map.label,last_admin_outcome_at:now}}).eq('id',id);
  if(upd.error){alert(upd.error.message);return}
  await d.from('customer_care_learning').insert({lead_id:id,signal_type:'admin_outcome',signal_value:{outcome:map.label,phone:lead.phone,intent:lead.intent,quote_value:lead.quote_value},outcome:map.label});
  if(map.status!=='open'){
   await d.from('customer_care_followup_queue').update({status:'cancelled',outcome:'admin_'+map.label}).eq('lead_id',id).in('status',['queued','admin_ready']);
  }
  await d.from('crm_tasks').update({status:'completed',notes:'Outcome admin: '+map.label+' · '+now,metadata:{lead_id:id,outcome:map.label}}).eq('task_type','AI_CUSTOMER_CARE_FOLLOWUP').eq('status','open').contains('metadata',{lead_id:id});
  await render();
 }
}
document.addEventListener('tm-acs-mounted',boot);setTimeout(boot,1500);setInterval(()=>{if(document.visibilityState==='visible')boot()},30000);
})();