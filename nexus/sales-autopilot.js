(()=>{
'use strict';
const boot=()=>{
 if(!window.NXSB||window.__NX_SALES_AUTOPILOT)return;
 window.__NX_SALES_AUTOPILOT=true;
 const sb=window.NXSB;
 const style=document.createElement('style');style.textContent=`.nx-sa{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:12px 0}.nx-sa .card{min-height:110px}.nx-sa-score{font-size:28px;font-weight:850}.nx-sa-hot{color:#e87878}.nx-sa-high{color:#e5c15a}.nx-sa-table{overflow:auto}.nx-sa-row{display:grid;grid-template-columns:90px 1.4fr 90px 1.2fr 110px;gap:10px;padding:11px 7px;border-bottom:1px solid #252a31;align-items:center;min-width:760px}.nx-sa-row.head{color:#8e949f;font-size:10px;text-transform:uppercase}.nx-sa-btn{background:#d2ad32;color:#111;border:0;border-radius:8px;padding:7px 10px;font-weight:800;cursor:pointer}.nx-sa-empty{padding:25px;text-align:center;color:#8e949f}@media(max-width:900px){.nx-sa{grid-template-columns:repeat(2,1fr)}}@media(max-width:600px){.nx-sa{grid-template-columns:1fr}}`;document.head.appendChild(style);
 const findPage=()=>[...document.querySelectorAll('.page')].find(p=>/sales|lead|marketing/i.test(p.id+' '+p.textContent));
 const render=async()=>{
  let page=document.getElementById('sales-autopilot-page');
  if(!page){page=document.createElement('section');page.id='sales-autopilot-page';page.className='page';document.getElementById('pages')?.appendChild(page);}
  const [{data:prospects,error:pe},{data:actions,error:ae},{data:tasks,error:te}]=await Promise.all([
   sb.from('growth_prospects').select('id,name,prospect_score,status,recommended_service,recommended_action,signal_summary,location,updated_at').order('prospect_score',{ascending:false}).limit(50),
   sb.from('growth_action_queue').select('id,title,priority,status,source_id,created_at').eq('status','OPEN').order('created_at',{ascending:false}).limit(50),
   sb.from('workflow_tasks').select('id,title,priority,status,entity_id,due_at,assigned_to').eq('task_type','GROWTH_SALES_FOLLOW_UP').in('status',['OPEN','IN_PROGRESS']).order('due_at',{ascending:true}).limit(50)
  ]);
  if(pe||ae||te){page.innerHTML='<div class="card"><h3>Sales Autopilot</h3><div class="notice">Data sales belum dapat dimuat. Periksa session dan permission NEXUS.</div></div>';return;}
  const ps=prospects||[],as=actions||[],ts=tasks||[];const hot=ps.filter(x=>Number(x.prospect_score)>=90).length,high=ps.filter(x=>Number(x.prospect_score)>=75&&Number(x.prospect_score)<90).length;
  page.innerHTML=`<div class="hero"><div><div class="eyebrow">SALES AUTOPILOT</div><div class="title">Sales Command Center</div><div class="desc">AI memprioritaskan peluang nyata agar tim sales menjemput bola, bukan menunggu lead.</div></div><div class="hero-actions"><button class="nx-sa-btn" id="nx-sa-refresh">Refresh</button></div></div><div class="nx-sa"><div class="card"><div class="k-label">HOT ≥90</div><div class="nx-sa-score nx-sa-hot">${hot}</div><div class="k-note">Immediate attention</div></div><div class="card"><div class="k-label">HIGH 75–89</div><div class="nx-sa-score nx-sa-high">${high}</div><div class="k-note">Priority follow-up</div></div><div class="card"><div class="k-label">OPEN ACTIONS</div><div class="nx-sa-score">${as.length}</div><div class="k-note">AI action queue</div></div><div class="card"><div class="k-label">SALES TASKS</div><div class="nx-sa-score">${ts.length}</div><div class="k-note">Open / in progress</div></div></div><div class="card"><h3>Prioritas Penjualan</h3><div class="nx-sa-table"><div class="nx-sa-row head"><div>Score</div><div>Prospect</div><div>Priority</div><div>Recommended action</div><div>Status</div></div>${ps.length?ps.slice(0,25).map(p=>`<div class="nx-sa-row"><div><b>${Number(p.prospect_score)||0}</b></div><div><b>${esc(p.name||'Prospect')}</b><div class="k-note">${esc(p.location||'')} · ${esc(p.recommended_service||'Rental Mobil')}</div></div><div>${Number(p.prospect_score)>=90?'URGENT':Number(p.prospect_score)>=75?'HIGH':'MONITOR'}</div><div>${esc(p.recommended_action||'Review and follow up')}</div><div><span class="chip">${esc(p.status||'NEW')}</span></div></div>`).join(''):'<div class="nx-sa-empty">Belum ada prospect nyata. Sistem tidak membuat data palsu.</div>'}</div></div><div class="card" style="margin-top:13px"><h3>Prinsip Eksekusi</h3><div class="notice">Sales tetap menggunakan kanal resmi dan komunikasi yang diizinkan. Autopilot menentukan <b>siapa, prioritas, alasan, dan kapan</b>; bukan melakukan spam.</div></div>`;
  document.getElementById('nx-sa-refresh')?.addEventListener('click',render);
 };
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const nav=()=>{
  const nav=document.getElementById('nav');if(!nav)return;
  let sec=[...nav.querySelectorAll('.nav-section')].find(x=>/Sales & Marketing/i.test(x.textContent));
  if(!sec)return;
  if(![...sec.querySelectorAll('button')].some(b=>b.dataset.page==='sales-autopilot')){const sub=sec.querySelector('.submenu');if(sub){const b=document.createElement('button');b.dataset.page='sales-autopilot';b.textContent='Sales Autopilot';sub.appendChild(b);b.addEventListener('click',()=>{document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));document.getElementById('sales-autopilot-page').classList.add('active');document.querySelectorAll('.submenu button').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.getElementById('breadcrumb').textContent='Sales & Marketing / Sales Autopilot';render();});}}
 };
 const wait=()=>{if(window.NXSB){nav();render();}else setTimeout(wait,500)};wait();
};window.addEventListener('load',()=>setTimeout(boot,800));
})();
