(()=>{
const boot=()=>{
 const nav=document.querySelector('.nav-section'); const pages=document.getElementById('pages'); if(!pages)return;
 if(!document.getElementById('navErpMaster')){
  const sections=[...document.querySelectorAll('.nav-section')];
  const target=sections.find(x=>/management/i.test(x.innerText));
  if(target){const sub=target.querySelector('.submenu'); if(sub){const b=document.createElement('button');b.id='navErpMaster';b.dataset.page='erp-master';b.textContent='ERP Master Data';sub.appendChild(b);}}
 }
 if(document.getElementById('page-erp-master'))return;
 const p=document.createElement('section');p.id='page-erp-master';p.className='page';p.innerHTML=`<div class="hero"><div><div class="eyebrow">ERP / MASTER DATA</div><div class="title">Master Data & Organization</div><div class="desc">Struktur organisasi, business unit, cost center, employee registry, dan kontrol anggaran internal.</div></div><div class="hero-actions"><button class="primary" id="erpMasterRefresh">Refresh</button></div></div><div class="grid" id="erpMasterKpi"></div><div class="split"><div class="card"><h3>Governance Scope</h3><div class="list" id="erpMasterList"></div></div><div class="card"><h3>Status</h3><div id="erpMasterStatus" class="notice">Memuat...</div></div></div>`;pages.appendChild(p);
 const render=d=>{d=d||{}; const items=[['Organizational Units',d.org_units],['Business Units',d.business_units],['Cost Centers',d.cost_centers],['Active Employees',d.employees],['Budget Records',d.budgets],['Open Budget Value',d.budget_total]];document.getElementById('erpMasterKpi').innerHTML=items.map(x=>`<div class="card"><div class="k-label">${x[0]}</div><div class="k-value">${x[0]==='Open Budget Value'?rup(x[1]):Number(x[1]||0).toLocaleString('id-ID')}</div><div class="k-note">Internal ERP</div></div>`).join('');document.getElementById('erpMasterList').innerHTML=items.map(x=>`<div class="list-row"><span>${x[0]}</span><b>${x[0]==='Open Budget Value'?rup(x[1]):Number(x[1]||0).toLocaleString('id-ID')}</b></div>`).join('');};
 const rup=n=>new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0));
 async function load(){try{const {data,error}=await window.NXSB.rpc('nexus_erp_master_center');if(error)throw error;render(data);document.getElementById('erpMasterStatus').textContent='Terhubung. Master data siap diisi melalui workflow ERP internal.';}catch(e){document.getElementById('erpMasterStatus').textContent='Belum dapat memuat data: '+(e.message||e);}}
 document.getElementById('erpMasterRefresh').onclick=load;
 document.getElementById('navErpMaster')?.addEventListener('click',()=>{document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));p.classList.add('active');document.getElementById('breadcrumb').textContent='Management / ERP Master Data';load();});
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();