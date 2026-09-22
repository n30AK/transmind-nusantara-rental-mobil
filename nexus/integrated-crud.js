/* TRANSMIND NEXUS — relational application workspaces.
   Legacy shell is preserved. Each data submenu opens its own application workspace:
   FORM + navigation + data list. Write actions remain subject to backend RLS/permissions.
*/
(()=>{'use strict';
let db=null,reg=new Map(),cache={},state={};

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const nice=s=>String(s||'').replace(/_/g,' ').replace(/\b\w/g,m=>m.toUpperCase());
const cfg=()=>window.NEXUS_CONFIG||{};
const REL={
 vehicle_id:['vehicles','name'],unit_id:['vehicle_units','unit_code'],vehicle_unit_id:['vehicle_units','unit_code'],
 booking_id:['bookings','booking_code'],customer_id:['customers','full_name'],driver_id:['drivers','full_name'],
 partner_id:['partners','name'],transaction_id:['transactions','transaction_code'],cost_center_id:['nexus_cost_centers','name'],
 org_unit_id:['nexus_org_units','name'],business_unit_id:['nexus_business_units','name'],employee_id:['nexus_employees','full_name']
};
const READ_ONLY_MODES=new Set(['readonly','read_only','dashboard','bi','forecast','report','analytical']);

function client(){
 if(db)return db;
 if(window.getTransmindSupabaseClient)db=window.getTransmindSupabaseClient();
 else if(window.supabase&&cfg().supabaseUrl)db=window.supabase.createClient(cfg().supabaseUrl,cfg().supabaseAnonKey);
 return db;
}
function fieldType(f){
 const t=String(f?.type||'text').toLowerCase();
 if(t==='boolean')return'boolean';
 if(['integer','bigint','smallint','numeric','real','double precision','decimal'].includes(t))return'number';
 if(t==='date')return'date';
 if(t.includes('timestamp'))return'datetime-local';
 if(t==='jsonb')return'json';
 if(t==='array')return'array';
 return'text';
}
function writable(r){return r&&r.mode==='crud'&&!READ_ONLY_MODES.has(String(r.mode).toLowerCase())}
function isGenerated(f){return !!f?.default&&(/gen_random_uuid|uuid_generate|^now\(\)|CURRENT_TIMESTAMP/i.test(String(f.default)));}
function relOf(f,r){
 const meta=(r.relation_meta||[]).find(x=>x.column===f.name);
 const t=meta?.target_table||REL[f.name]?.[0];
 if(!t)return null;
 return [t,meta?.target_column||REL[f.name]?.[1]||'id',REL[f.name]?.[1]];
}
async function loadRelations(r){
 for(const f of (r.field_meta||[])){
  const rr=relOf(f,r); if(!rr||cache[rr[0]])continue;
  const q=await db.from(rr[0]).select('*').limit(1000);
  if(!q.error)cache[rr[0]]=q.data||[];
 }
}
function labelFor(x,rr){
 return x?.[rr[2]]??x?.name??x?.full_name??x?.booking_code??x?.unit_code??x?.transaction_code??x?.id;
}
function inputHtml(f,row,r,locked){
 const t=fieldType(f),v=row?.[f.name],rr=relOf(f,r),required=!f.nullable&&!isGenerated(f)&&!locked;
 const dis=locked?' disabled':'';
 if(rr){
  const opts=cache[rr[0]]||[];
  return '<div class="field"><label>'+esc(nice(f.name))+(required?' *':'')+'</label><select data-f="'+esc(f.name)+'"'+(required?' required':'')+dis+'><option value="">— pilih —</option>'+
   opts.map(x=>'<option value="'+esc(x[rr[1]])+'" '+(String(x[rr[1]])===String(v)?'selected':'')+'>'+esc(labelFor(x,rr))+'</option>').join('')+'</select></div>';
 }
 if(t==='boolean')return '<div class="field"><label>'+esc(nice(f.name))+'</label><select data-f="'+esc(f.name)+'"'+dis+'><option value="true" '+(v===true?'selected':'')+'>Ya</option><option value="false" '+(v===false?'selected':'')+'>Tidak</option></select></div>';
 if(t==='json'||t==='array')return '<div class="field form-full"><label>'+esc(nice(f.name))+'</label><textarea data-f="'+esc(f.name)+'" rows="4"'+dis+'>'+esc(v==null?'':JSON.stringify(v,null,2))+'</textarea></div>';
 const long=t==='text'&&String(v??'').length>160;
 const value=t==='datetime-local'&&v?String(v).slice(0,16):v??'';
 return '<div class="field '+(long?'form-full':'')+'"><label>'+esc(nice(f.name))+(required?' *':'')+'</label>'+
   (long?'<textarea data-f="'+esc(f.name)+'" rows="5"'+(required?' required':'')+dis+'>'+esc(value)+'</textarea>':
   '<input data-f="'+esc(f.name)+'" type="'+t+'" value="'+esc(value)+'"'+(required?' required':'')+dis+'>')+'</div>';
}
function page(id){
 const r=reg.get(id);if(!r)return;
 const existing=document.getElementById('page-'+id);
 if(existing){
  const content=existing.querySelector('#content-'+id);
  if(content){content.innerHTML='<div id="ws-'+esc(id)+'"></div>';return}
  if(existing.querySelector('#ws-'+id))return;
 }
 document.getElementById('pages').insertAdjacentHTML('beforeend',
  '<section id="page-'+esc(id)+'" class="page"><div class="hero"><div><div class="eyebrow">'+esc(r.group_name)+'</div><div class="title">'+esc(r.module_label)+'</div><div class="desc">'+esc(r.description||'Application workspace dengan form, navigasi data dan relasi.')+'</div></div>'+
  '<div class="hero-actions"><span id="mode-'+esc(id)+'" class="status">'+(writable(r)?'● APPLICATION FORM':'● READ ONLY')+'</span></div></div><div id="ws-'+esc(id)+'"></div></section>');
}
function printAllowed(r){
 const g=String(r?.group_name||'').toLowerCase();
 const id=String(r?.module_id||'').toLowerCase();
 return ['transaksi','armada','customer / crm','sales & marketing','partner','keuangan','laporan','procurement & inventory','hr & organization','dokumen'].includes(g)
   || /(^|-)report|invoice|receipt|contract|document|booking|payment|expense|revenue|commission|settlement|tax|payroll|customer|vehicle|driver|partner|purchase|inventory|stock|attendance|leave|performance/.test(id);
}
function printCss(){
 return '<style>@page{size:A4;margin:14mm}*{box-sizing:border-box}body{font:12px Arial,sans-serif;color:#111;margin:0}.head{border-bottom:2px solid #222;padding-bottom:10px;margin-bottom:14px}.brand{font-size:18px;font-weight:800;letter-spacing:1px}.meta{font-size:10px;color:#555;margin-top:4px}.title{font-size:16px;font-weight:700;margin:0 0 4px}.scope{font-size:10px;color:#555;margin-bottom:12px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #999;padding:6px;vertical-align:top;text-align:left}th{background:#eee;font-size:9px;text-transform:uppercase}.sign{margin-top:35px;display:flex;justify-content:flex-end}.sign>div{width:220px;text-align:center}.no-print{display:none!important}</style>';
}
function printWorkspace(id,row=null){
 const r=reg.get(id);if(!r||!printAllowed(r))return;
 const fs=(r.field_meta||[]).filter(f=>!['id','created_at','updated_at'].includes(f.name));
 const rows=row?[row]:(state[id]?.rows||[]);
 const title=r.module_label||id;
 const stamp=new Date().toLocaleString('id-ID');
 const body=row
  ? '<table><thead><tr><th>Field</th><th>Data</th></tr></thead><tbody>'+fs.map(f=>'<tr><th>'+esc(nice(f.name))+'</th><td>'+esc(row[f.name]??'')+'</td></tr>').join('')+'</tbody></table>'
  : '<table><thead><tr>'+fs.slice(0,8).map(f=>'<th>'+esc(nice(f.name))+'</th>').join('')+'</tr></thead><tbody>'+rows.map(x=>'<tr>'+fs.slice(0,8).map(f=>'<td>'+esc(x[f.name]??'')+'</td>').join('')+'</tr>').join('')+'</tbody></table>';
 const w=window.open('','_blank','width=1100,height=800');
 if(!w){setMessage(id,'Popup cetak diblokir browser. Izinkan popup untuk NEXUS.','warn');return}
 w.document.write('<!doctype html><html><head><meta charset="utf-8"><title>'+esc(title)+'</title>'+printCss()+'</head><body><div class="head"><div class="brand">TRANSMIND NEXUS</div><div class="meta">BUSINESS OPERATING SYSTEM · Dokumen Cetak</div></div><div class="title">'+esc(title)+'</div><div class="scope">'+esc(r.group_name)+' · '+esc(r.table_name)+' · Dicetak '+esc(stamp)+(row?' · Record terpilih':' · Daftar data')+'</div>'+body+'<div class="sign"><div>Dicetak oleh<br><br><br>________________________</div></div></body></html>');
 w.document.close();w.focus();setTimeout(()=>w.print(),250);
}
function setMessage(id,msg,kind=''){
 const e=document.getElementById('m-'+id);if(!e)return;e.textContent=msg||'';e.className='msg '+(kind||'');
}
function collect(id){
 const r=reg.get(id),out={};
 document.querySelectorAll('#f-'+id+' [data-f]').forEach(el=>{
  const f=(r.field_meta||[]).find(x=>x.name===el.dataset.f);if(!f)return;
  let v=el.value;if(v==='')v=null;
  const t=fieldType(f);
  if(v!==null&&t==='boolean')v=v==='true';
  else if(v!==null&&t==='number')v=Number(v);
  else if(v!==null&&(t==='json'||t==='array')){try{v=JSON.parse(v)}catch(e){throw Error(f.name+' harus JSON valid')}}
  else if(v!==null&&t==='datetime-local')v=new Date(v).toISOString();
  out[f.name]=v;
 });
 return out;
}
async function save(id,row){
 const r=reg.get(id);if(!writable(r))return setMessage(id,'Modul ini bersifat read-only.','warn');
 try{
  setMessage(id,'Menyimpan...');
  const data=collect(id);
  const q=row?await db.from(r.table_name).update(data).eq(r.pk_column,row[r.pk_column]):await db.from(r.table_name).insert(data);
  if(q.error)throw q.error;
  setMessage(id,row?'Update berhasil.':'Insert berhasil.','ok');
  await list(id,row?row[r.pk_column]:null);
 }catch(e){setMessage(id,e.message,'bad')}
}
async function del(id,row){
 const r=reg.get(id);if(!writable(r)||!row)return;
 if(!confirm('Hapus record ini? Foreign key dan RLS tetap menjadi pengaman backend.'))return;
 const q=await db.from(r.table_name).delete().eq(r.pk_column,row[r.pk_column]);
 if(q.error){setMessage(id,q.error.message,'bad');return}
 await list(id,null);
}
function bindForm(id,row){
 const r=reg.get(id),locked=!writable(r),form=document.getElementById('f-'+id);if(!form)return;
 document.getElementById('c-'+id).onclick=()=>renderForm(id,null);
 document.getElementById('b-'+id).onclick=()=>document.getElementById('list-'+id)?.scrollIntoView({behavior:'smooth',block:'start'});
 document.getElementById('f-'+id).onsubmit=e=>{e.preventDefault();save(id,row)};
 document.getElementById('d-'+id)?.addEventListener('click',()=>del(id,row));document.getElementById('p-'+id)?.addEventListener('click',()=>printWorkspace(id,row));
 if(locked)form.querySelectorAll('input,select,textarea').forEach(x=>x.disabled=true);
}
async function renderForm(id,row){
 const r=reg.get(id),h=document.getElementById('form-'+id);if(!r||!h)return;
 await loadRelations(r);
 const locked=!writable(r),fs=(r.field_meta||[]).filter(f=>!['id','created_at','updated_at'].includes(f.name));
 h.innerHTML='<div class="card"><div class="toolbar"><b>'+esc(row?'Edit Data':'Form Data')+'</b><span class="muted">'+esc(r.table_name)+'</span><span class="chip">'+(locked?'READ ONLY':(row?'EDIT':'INSERT'))+'</span></div>'+
 '<form id="f-'+id+'"><div class="form-grid">'+fs.map(f=>inputHtml(f,row,r,locked)).join('')+'</div><div id="m-'+id+'" class="msg"></div><div class="toolbar">'+
 (locked?'':'<button class="primary" type="submit">'+(row?'Update':'Insert')+'</button>')+
 '<button class="secondary" type="button" id="c-'+id+'">Cancel / New</button><button class="secondary" type="button" id="b-'+id+'">Back to Data</button>'+
 (row&&!locked?'<button class="secondary" type="button" id="d-'+id+'">Delete</button>':'')+(printAllowed(r)?'<button class="secondary" type="button" id="p-'+id+'">🖨 Cetak</button>':'')+
 '</div></form></div>';
 bindForm(id,row);
}
function renderTable(id,rows){
 const r=reg.get(id),fs=(r.field_meta||[]).filter(f=>!['id','created_at','updated_at'].includes(f.name)).slice(0,6);
 const t=document.getElementById('t-'+id);
 t.innerHTML='<div class="tr th"><span>KEY</span>'+fs.map(f=>'<span>'+esc(nice(f.name))+'</span>').join('')+'<span>ACTION</span></div>'+
 (rows.map(x=>'<div class="tr"><b>'+esc(String(x[r.pk_column]??'').slice(0,12))+'</b>'+
 fs.map(f=>'<span>'+esc(String(x[f.name]??'').slice(0,80))+'</span>').join('')+
 '<span>'+(writable(r)?'<button class="secondary" data-e="'+esc(x[r.pk_column])+'">Open / Edit</button>':'<button class="secondary" data-v="'+esc(x[r.pk_column])+'">View</button>')+'</span></div>').join('')||
 '<div class="empty">Belum ada data.</div>');
 t.querySelectorAll('[data-e],[data-v]').forEach(b=>b.onclick=()=>{
  const row=rows.find(x=>String(x[r.pk_column])===String(b.dataset.e??b.dataset.v));
  renderForm(id,row);document.getElementById('form-'+id)?.scrollIntoView({behavior:'smooth',block:'start'});
 });
}
async function list(id,selectedPk=null){
 const r=reg.get(id),h=document.getElementById('ws-'+id);if(!r||!h)return;
 let q=await db.from(r.table_name).select('*').limit(500);
 if(q.error){h.innerHTML='<div class="notice bad">'+esc(q.error.message)+'</div>';return}
 let rows=q.data||[];
 if(r.filter_column)rows=rows.filter(x=>String(x[r.filter_column])===String(r.filter_value));
 state[id]={rows};
 h.innerHTML='<div class="workspace-nav"><button class="secondary" id="back-'+id+'">← Back</button><button class="secondary" id="new-'+id+'">＋ Insert / New</button><button class="secondary" id="refresh-'+id+'">↻ Refresh</button><button class="secondary" id="searchbtn-'+id+'">⌕ Search</button>'+(printAllowed(r)?'<button class="secondary" id="print-'+id+'">🖨 Cetak</button>':'')+'</div><div id="form-'+id+'"></div><div id="list-'+id+'" class="card" style="margin-top:13px"><div class="toolbar"><b>Data '+esc(r.module_label)+'</b><input id="s-'+id+'" placeholder="Search..."></div><div id="t-'+id+'" class="table"></div></div>';
 renderTable(id,rows);
 document.getElementById('new-'+id).onclick=()=>{if(writable(r)){renderForm(id,null);document.getElementById('form-'+id)?.scrollIntoView({behavior:'smooth',block:'start'})}};
 document.getElementById('refresh-'+id).onclick=()=>list(id,selectedPk);
 document.getElementById('back-'+id).onclick=()=>window.history.back();
 document.getElementById('searchbtn-'+id).onclick=()=>document.getElementById('s-'+id)?.focus();document.getElementById('print-'+id)?.addEventListener('click',()=>printWorkspace(id));
 document.getElementById('s-'+id).oninput=e=>{const s=e.target.value.toLowerCase();renderTable(id,rows.filter(x=>Object.values(x).some(v=>String(v??'').toLowerCase().includes(s))))};
 const row=selectedPk?rows.find(x=>String(x[r.pk_column])===String(selectedPk)):null;
 await renderForm(id,row||null);
}
function card(l,v,n){return '<div class="card"><div class="k-label">'+esc(l)+'</div><div class="k-value">'+v+'</div><div class="k-note">'+esc(n)+'</div></div>'}
async function crm(){
 const el=document.getElementById('crmBody');if(!el)return;
 const cnt=async t=>(await db.from(t).select('*',{count:'exact',head:true})).count||0;
 const [c,b,d,e]=await Promise.all([cnt('customers'),cnt('bookings'),cnt('ai_companion_demand_signals'),cnt('website_analytics_events')]);
 el.innerHTML='<div class="grid">'+card('Customers',c,'Master CRM')+card('Bookings',b,'Transaksi')+card('AI Demand',d,'Intelligence')+card('Website Events',e,'Digital')+'</div><div class="notice" style="margin-top:13px">CRM Command Center adalah tampilan kendali. Perubahan data dilakukan melalui submenu data terkait dengan permission backend.</div>';
}
async function seo(days){
 const el=document.getElementById('seoBody');if(!el)return;
 try{const [a,b]=await Promise.all([db.rpc('nexus_seo_live_metrics',{p_days:days}),db.rpc('nexus_seo_funnel_metrics',{p_days:days})]);if(a.error||b.error)throw(a.error||b.error);
 const x=a.data||{},f=b.data||{};
 el.innerHTML='<div class="grid">'+card('Visitor Unik',x.unique_visitors||0,'session')+card('Page Views',x.page_views||0,'page')+card('Organic',x.organic_visitors||0,'visitor')+card('WhatsApp',x.whatsapp_clicks||0,'lead signal')+card('Booking',f.bookings||0,'booking')+card('Linked Booking',f.linked_bookings||0,'session-linked')+'</div>';
 }catch(e){el.innerHTML='<div class="notice bad">'+esc(e.message)+'</div>'}
}
function addSpecial(){
 const nav=document.getElementById('nav'),pages=document.getElementById('pages');if(!nav||!pages)return;
 const groups=[...nav.querySelectorAll('.nav-section')],crm=groups.find(x=>x.textContent.includes('Customer / CRM')),mg=groups.find(x=>x.textContent.includes('Management'));
 if(crm&&!crm.querySelector('[data-page="crm-command"]'))crm.querySelector('.submenu')?.insertAdjacentHTML('beforeend','<button data-page="crm-command" type="button">CRM Command Center</button>');
 if(mg&&!mg.querySelector('[data-page="seo-live"]'))mg.querySelector('.submenu')?.insertAdjacentHTML('beforeend','<button data-page="seo-live" type="button">SEO & Live Traffic</button>');
 if(!document.getElementById('page-crm-command'))pages.insertAdjacentHTML('beforeend','<section id="page-crm-command" class="page"><div class="hero"><div><div class="eyebrow">CUSTOMER / CRM</div><div class="title">CRM Command Center</div><div class="desc">Customer master, booking, demand dan follow-up dalam satu command center.</div></div></div><div id="crmBody"></div></section>');
 if(!document.getElementById('page-seo-live'))pages.insertAdjacentHTML('beforeend','<section id="page-seo-live" class="page"><div class="hero"><div><div class="eyebrow">SEO & DIGITAL DEMAND</div><div class="title">SEO & Live Traffic Command Center</div><div class="desc">Traffic, organic, WhatsApp, booking dan conversion dari data nyata.</div><div class="hero-actions"><button class="secondary" data-seo="1">24 Jam</button><button class="secondary" data-seo="7">7 Hari</button><button class="secondary" data-seo="30">30 Hari</button></div></div></div><div id="seoBody"></div></section>');
 document.querySelectorAll('[data-seo]').forEach(b=>b.onclick=()=>seo(Number(b.dataset.seo)));
}
function activate(id){
 document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
 document.getElementById('page-'+id)?.classList.add('active');
 document.querySelectorAll('.submenu button').forEach(b=>b.classList.toggle('active',b.dataset.page===id));
 const b=document.querySelector('.submenu button[data-page="'+id+'"]');
 if(b){document.querySelectorAll('.nav-section').forEach(x=>x.classList.remove('open'));b.closest('.nav-section')?.classList.add('open')}
 const r=reg.get(id);if(r)document.getElementById('breadcrumb').textContent=r.group_name+' / '+r.module_label;
}
function hook(){
 const nav=document.getElementById('nav');if(!nav)return;
 nav.addEventListener('click',e=>{
  const b=e.target.closest('[data-page]');if(!b)return;
  const id=b.dataset.page;
  if(id==='crm-command'||id==='seo-live'||reg.has(id)){
   e.preventDefault();e.stopImmediatePropagation();activate(id);
   if(id==='crm-command')crm();else if(id==='seo-live')seo(7);else{page(id);list(id)}
  }
 },true);
}
async function boot(){
 db=client();if(!db)return;
 const q=await db.from('nexus_module_registry').select('*').order('sort_order');
 if(q.error){console.error(q.error);return}
 (q.data||[]).forEach(x=>reg.set(x.module_id,x));
 addSpecial();hook();
}
window.NEXUS_WORKSPACE={registry:reg,list,renderForm,save,del};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,250));else setTimeout(boot,250);
})();