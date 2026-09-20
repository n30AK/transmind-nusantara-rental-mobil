'use strict';
(()=> {
const client=supabase.createClient(window.TRANSMIND_SUPABASE_URL,window.TRANSMIND_SUPABASE_ANON_KEY);
const $=id=>document.getElementById(id), esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]));
let role=null,current='home',rows=[],recordIndex=-1,pendingDelete=null,undoStack=[],txView='all',lookups={customers:{},vehicles:{},units:{},transactions:{},bookings:{}},related={};

const modules={
home:{title:'Workspace',desc:'Pintu masuk pekerjaan dan seluruh modul aplikasi Nexus.',table:null},
customers:{title:'Customers',desc:'Master customer, verifikasi, relasi booking dan riwayat.',table:'customers'},
crm_tasks:{title:'CRM Tasks',desc:'Follow-up, pipeline, prioritas dan assignment pelanggan.',table:'crm_tasks'},
interactions:{title:'Interactions',desc:'Riwayat komunikasi customer dan booking lintas channel.',table:'customer_interactions'},
transactions:{title:'Transactions Ledger',desc:'Ledger transaksi komersial yang terhubung ke booking, customer dan armada.',table:'transactions'},
operations_tasks:{title:'Operations Tasks',desc:'Work queue operasional yang terhubung ke booking dan customer.',table:'nexus_operations_tasks'},
growth_actions:{title:'Growth Actions',desc:'Aksi pertumbuhan yang ditindaklanjuti dari data nyata.',table:'nexus_growth_actions'},
opportunities:{title:'Opportunities',desc:'Peluang pertumbuhan dan intent yang bersumber dari data nyata.',table:'nexus_growth_opportunities'},
campaign_queue:{title:'Campaign Queue',desc:'Campaign dengan policy, approval, jadwal dan status publikasi.',table:'nexus_campaign_queue'},
website_campaigns:{title:'Website Campaigns',desc:'Konten campaign yang tampil di website publik.',table:'website_campaigns'},
signals:{title:'Intelligence Signals',desc:'Sinyal intelligence untuk keputusan dan tindakan.',table:'nexus_intelligence_signals'},
analytics:{title:'Production Analytics',desc:'Telemetry produksi read-only.',table:'website_analytics_events'}
};
const txViews={
all:{title:'Semua Booking',desc:'Seluruh booking production dengan relasi customer, armada, transaksi dan operasi.'},
new:{title:'Booking Baru',desc:'Booking yang dibuat hari ini — berdasarkan created_at data production.'},
today:{title:'Booking Hari Ini',desc:'Booking yang jadwal rental-nya mencakup tanggal hari ini.'},
upcoming:{title:'Booking Mendatang',desc:'Booking dengan tanggal mulai setelah hari ini.'},
calendar:{title:'Kalender Rental',desc:'Kalender operasional berdasarkan rentang rental booking nyata.'},
pending:{title:'Booking Pending',desc:'Booking dengan status Menunggu.'},
confirmed:{title:'Booking Confirmed',desc:'Booking dengan status Dikonfirmasi.'},
running:{title:'Booking Berjalan',desc:'Booking dengan status Berjalan.'},
completed:{title:'Booking Selesai',desc:'Booking dengan status Selesai.'},
cancelled:{title:'Pembatalan',desc:'Booking dengan status Dibatalkan, termasuk jejak transaksi terkait.'},
refunds:{title:'Refund',desc:'Refund nyata yang terhubung ke transaksi dan booking.'}
};
const perms={owner:9,admin:9,manager:8,sales:6,operator:6,marketing:6,fleet:6,finance:6,analyst:4,viewer:2};
const fallback={
customers:['id','full_name','phone','nik','address','current_address','emergency_name','emergency_phone','emergency_relation','phone_verified','identity_verified','verification_status','risk_level','notes','created_at','updated_at'],
bookings:['id','booking_code','customer_name','customer_phone','vehicle_id','service','start_date','end_date','area','notes','status','created_at','total_price','name','phone','total_days','unit_id','start_datetime','end_datetime','estimated_ready_at','customer_id','verification_status','hold_until','verified_at','verified_by','verification_token','attribution_source','attribution_medium','attribution_campaign','attribution_content','attribution_term','landing_page','referrer_url','agent_id','agent_link_id','partner_id','attribution_code','attributed_at','purpose_primary','purpose_secondary','journey_type','journey_confidence','journey_intelligence'],
transactions:['id','transaction_code','booking_id','customer_id','agent_id','partner_id','vehicle_id','unit_id','gross_amount','transaction_status','currency','source','created_at','confirmed_at','successful_at','cancelled_at','updated_at'],
payments:['id','transaction_id','payment_reference','amount','payment_method','payment_status','paid_at','notes','created_at'],
refunds:['id','transaction_id','refund_reference','refund_amount','refund_reason','refund_status','processed_at','created_at'],
transaction_fees:['id','transaction_id','fee_type','fee_amount','fee_status','created_at','earned_at'],
crm_tasks:['id','customer_id','booking_id','task_type','priority','status','due_at','assigned_to','title','notes','metadata','completed_at','created_at','updated_at','pipeline_stage','contacted_at','last_contacted_at','next_followup_at','lost_reason','quote_value'],
customer_interactions:['id','customer_id','booking_id','interaction_type','channel','direction','subject','content','outcome','metadata','occurred_at','created_at'],
nexus_operations_tasks:['id','booking_id','customer_id','task_type','priority','status','title','notes','due_at','assigned_to','metadata','completed_at','created_at','updated_at'],
nexus_growth_actions:['id','customer_id','booking_id','action_type','priority','status','channel','title','message_body','due_at','metadata','created_at','completed_at','updated_at'],
nexus_growth_opportunities:['id','opportunity_key','channel','intent_level','source_type','query_or_theme','landing_path','recommended_action','evidence','status','created_at','updated_at'],
nexus_campaign_queue:['id','campaign_key','channel','campaign_type','objective','status','policy_status','approval_required','human_approved','title','body','cta_label','landing_path','utm_source','utm_medium','utm_campaign','utm_content','utm_term','factual_basis','policy_notes','target_audience','scheduled_at','published_at','spend_cap','created_at','updated_at'],
website_campaigns:['id','campaign_key','campaign_type','title','subtitle','body','cta_label','cta_url','image_url','priority','active','starts_at','ends_at','created_at','updated_at'],
nexus_intelligence_signals:['id','signal_code','signal_type','severity','entity_type','entity_id','booking_id','title','summary','score','metadata','status','detected_at','resolved_at','created_at','updated_at'],
website_analytics_events:['id','event_type','visitor_session_id','occurred_at','path','title','source','medium','campaign','content','term','referrer_host','metadata','booking_id','booking_code']
};
const rank=()=>perms[role]||0;
function canWrite(m){if(m==='analytics')return false;if(['transactions','payments','refunds','transaction_fees'].includes(m))return ['owner','admin','manager','finance'].includes(role);if(['signals','opportunities'].includes(m))return ['owner','admin','manager','analyst','marketing'].includes(role);if(['campaign_queue','website_campaigns'].includes(m))return ['owner','admin','manager','marketing'].includes(role);if(m==='growth_actions')return ['owner','admin','manager','marketing','sales','operator'].includes(role);return rank()>=6}
function canDelete(){return ['owner','admin','manager'].includes(role)}
function notify(s){const e=$('toast');e.textContent=s;e.classList.add('show');clearTimeout(window.__toast);window.__toast=setTimeout(()=>e.classList.remove('show'),2800)}
function todayISO(){return new Date().toLocaleDateString('en-CA',{timeZone:'Asia/Jakarta'})}
function setHeader(title,desc){$('moduleTitle').textContent=title;$('moduleDesc').textContent=desc;document.querySelectorAll('#nav a').forEach(a=>a.classList.remove('active'))}
function bindNavigation(){
document.querySelectorAll('.nav-section').forEach(b=>b.onclick=()=>{b.classList.toggle('open');b.querySelector('b').textContent=b.classList.contains('open')?'−':'+'});
document.querySelectorAll('#nav a[data-module]').forEach(a=>a.onclick=e=>{e.preventDefault();openModule(a.dataset.module)});
document.querySelectorAll('#nav a[data-tx-view]').forEach(a=>a.onclick=e=>{e.preventDefault();openTxView(a.dataset.txView)});
}
function markActive(selector,value){document.querySelectorAll(selector).forEach(a=>a.classList.toggle('active',a.getAttribute(selector.includes('tx-view')?'data-tx-view':'data-module')===value))}
function home(){setHeader('Workspace','Pintu masuk pekerjaan dan seluruh modul aplikasi Nexus.');document.querySelector('[data-module="home"]')?.classList.add('active');$('content').innerHTML='<div class="summary"><div class="metric"><span>AUTHORITY</span><b>'+esc(role||'—')+'</b><span>Role aktif</span></div><div class="metric"><span>DATABASE</span><b>LIVE</b><span>Supabase production</span></div><div class="metric"><span>MODE</span><b>ERP / CRM</b><span>Application workflow</span></div><div class="metric"><span>TRANSAKSI</span><b>11</b><span>Submenu booking & refund</span></div></div><div class="notice">Modul Transaksi adalah pusat proses booking: input → verifikasi → konfirmasi → rental → selesai/pembatalan → transaksi → payment/refund. Semua angka dan record berasal dari database production.</div><div class="tx-flow">'+Object.entries(txViews).map(([k,v])=>'<button class="flow-card" data-flow="'+k+'"><b>'+v.title+'</b><span>'+v.desc+'</span></button>').join('')+'</div>';document.querySelectorAll('[data-flow]').forEach(x=>x.onclick=()=>openTxView(x.dataset.flow))}
async function loadLookups(){
const [c,v,u,t,b]=await Promise.all([
client.from('customers').select('id,full_name,phone').limit(1000),
client.from('vehicles').select('id,name,slug').limit(1000),
client.from('vehicle_units').select('id,unit_code,vehicle_id,status').limit(1000),
client.from('transactions').select('id,transaction_code,booking_id,gross_amount,transaction_status').limit(1000),
client.from('bookings').select('id,booking_code,customer_id,vehicle_id,unit_id,status,start_date,end_date,total_price').limit(1000)
]);
lookups.customers=Object.fromEntries((c.data||[]).map(x=>[x.id,x]));
lookups.vehicles=Object.fromEntries((v.data||[]).map(x=>[x.id,x]));
lookups.units=Object.fromEntries((u.data||[]).map(x=>[x.id,x]));
lookups.transactions=Object.fromEntries((t.data||[]).map(x=>[x.id,x]));
lookups.bookings=Object.fromEntries((b.data||[]).map(x=>[x.id,x]));
}
function labelRelation(kind,id){if(!id)return '—';const x=lookups[kind]?.[id];if(!x)return String(id).slice(0,12)+'…';return kind==='customers'?x.full_name:kind==='vehicles'?x.name:kind==='units'?x.unit_code:kind==='transactions'?x.transaction_code:kind==='bookings'?x.booking_code:String(id).slice(0,12)+'…'}
function statusPill(s){if(!s)return '—';return '<span class="pill '+String(s).toLowerCase().replaceAll(' ','-')+'">'+esc(s)+'</span>'}
function txColumns(){return ['booking_code','customer','vehicle','unit','service','start_date','end_date','status','total_price','created_at']}
function txDisplay(r){return {'booking_code':r.booking_code,'customer':labelRelation('customers',r.customer_id)||r.customer_name,'vehicle':labelRelation('vehicles',r.vehicle_id),'unit':labelRelation('units',r.unit_id),'service':r.service,'start_date':r.start_date,'end_date':r.end_date,'status':r.status,'total_price':r.total_price,'created_at':r.created_at}}
async function getBookings(){
const r=await client.from('bookings').select('*').order('start_date',{ascending:true}).limit(1000);if(r.error){notify(r.error.message);return []}return r.data||[]
}
function applyTxFilter(data,view){
const t=todayISO();
if(view==='new')return data.filter(r=>String(r.created_at||'').slice(0,10)===t);
if(view==='today')return data.filter(r=>r.start_date<=t&&r.end_date>=t);
if(view==='upcoming')return data.filter(r=>r.start_date>t);
if(view==='pending')return data.filter(r=>r.status==='Menunggu');
if(view==='confirmed')return data.filter(r=>r.status==='Dikonfirmasi');
if(view==='running')return data.filter(r=>r.status==='Berjalan');
if(view==='completed')return data.filter(r=>r.status==='Selesai');
if(view==='cancelled')return data.filter(r=>r.status==='Dibatalkan');
return data
}
async function openTxView(view){
txView=view;markActive('[data-tx-view]',view);setHeader(txViews[view].title,txViews[view].desc);
if(view==='calendar'){await renderCalendar();return}
if(view==='refunds'){await renderRefunds();return}
await loadLookups();rows=applyTxFilter(await getBookings(),view);renderBookingList()
}
function txToolbar(){return '<div class="toolbar"><div class="search">⌕ <input id="filter" placeholder="Cari kode booking, customer, telepon, armada, area…"></div><button class="btn ghost" id="clearFilter">Clear</button></div>'}
function renderBookingList(){
const writable=canWrite('bookings'), cols=txColumns();
const counts='<div class="stat-strip"><span>Total <b>'+rows.length+'</b></span><span>Menunggu <b>'+rows.filter(x=>x.status==='Menunggu').length+'</b></span><span>Confirmed <b>'+rows.filter(x=>x.status==='Dikonfirmasi').length+'</b></span><span>Berjalan <b>'+rows.filter(x=>x.status==='Berjalan').length+'</b></span><span>Selesai <b>'+rows.filter(x=>x.status==='Selesai').length+'</b></span><span>Batal <b>'+rows.filter(x=>x.status==='Dibatalkan').length+'</b></span></div>';
$('content').innerHTML='<div class="module-head"><div><b>'+rows.length+' booking</b><div class="muted">Relasi: Customer ↔ Booking ↔ Armada/Unit ↔ Transaction ↔ Payment/Refund ↔ CRM/Operations.</div></div><div class="module-actions">'+(writable?'<button class="btn primary" id="insertBtn">＋ Booking Baru</button>':'')+'<button class="btn ghost" id="exportBtn">Export CSV</button><button class="btn ghost" id="printBtn">Print</button></div></div>'+counts+txToolbar()+'<div class="table-card"><table class="table wide-table"><thead><tr>'+cols.map(c=>'<th>'+c.replaceAll('_',' ')+'</th>').join('')+'<th>Aksi</th></tr></thead><tbody id="tbody"></tbody></table></div>';
const draw=()=>{const q=($('filter').value||'').toLowerCase();const vis=rows.filter(r=>JSON.stringify({...r,customer:labelRelation('customers',r.customer_id),vehicle:labelRelation('vehicles',r.vehicle_id),unit:labelRelation('units',r.unit_id)}).toLowerCase().includes(q));$('tbody').innerHTML=vis.length?vis.map(r=>{const d=txDisplay(r);return '<tr>'+cols.map(c=>'<td>'+(c==='status'?statusPill(d[c]):c==='total_price'?(d[c]==null?'—':Number(d[c]).toLocaleString('id-ID')):esc(d[c]??'—'))+'</td>').join('')+'<td><div class="row-actions"><button class="btn ghost" data-view="'+r.id+'">View</button>'+(writable?'<button class="btn ghost" data-edit="'+r.id+'">Update</button>':'')+(canDelete()&&writable?'<button class="btn danger" data-del="'+r.id+'">Delete</button>':'')+'</div></td></tr>'}).join(''):'<tr><td colspan="'+(cols.length+1)+'" class="empty">Tidak ada data untuk filter ini.</td></tr>';attachTxRows()};$('filter').oninput=draw;$('clearFilter').onclick=()=>{$('filter').value='';draw()};draw();
if(writable)$('insertBtn').onclick=()=>openBookingRecord(null);$('exportBtn').onclick=()=>exportRows(rows,'bookings');$('printBtn').onclick=()=>window.print()
}
function attachTxRows(){document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>openBookingRecord(b.dataset.view));document.querySelectorAll('[data-edit]').forEach(b=>b.onclick=()=>openBookingRecord(b.dataset.edit));document.querySelectorAll('[data-del]').forEach(b=>b.onclick=()=>requestDelete('bookings',b.dataset.del))}
async function relatedForBooking(id){
const [tr,pay,ref,fee,crm,int,ops,fin,attr]=await Promise.all([
client.from('transactions').select('*').eq('booking_id',id).order('created_at',{ascending:false}),
client.from('payments').select('*').in('transaction_id',(lookups.transactions&&Object.keys(lookups.transactions).filter(x=>lookups.transactions[x].booking_id===id).length?Object.keys(lookups.transactions).filter(x=>lookups.transactions[x].booking_id===id):['00000000-0000-0000-0000-000000000000'])),
client.from('refunds').select('*').in('transaction_id',(lookups.transactions&&Object.keys(lookups.transactions).filter(x=>lookups.transactions[x].booking_id===id).length?Object.keys(lookups.transactions).filter(x=>lookups.transactions[x].booking_id===id):['00000000-0000-0000-0000-000000000000'])),
client.from('transaction_fees').select('*').in('transaction_id',(lookups.transactions&&Object.keys(lookups.transactions).filter(x=>lookups.transactions[x].booking_id===id).length?Object.keys(lookups.transactions).filter(x=>lookups.transactions[x].booking_id===id):['00000000-0000-0000-0000-000000000000'])),
client.from('crm_tasks').select('*').eq('booking_id',id).order('created_at',{ascending:false}),
client.from('customer_interactions').select('*').eq('booking_id',id).order('occurred_at',{ascending:false}),
client.from('nexus_operations_tasks').select('*').eq('booking_id',id).order('created_at',{ascending:false}),
client.from('nexus_booking_financials').select('*').eq('booking_id',id).maybeSingle(),
client.from('booking_attributions').select('*').eq('booking_id',id).order('captured_at',{ascending:false})
]);
related={transactions:tr.data||[],payments:pay.data||[],refunds:ref.data||[],fees:fee.data||[],crm:crm.data||[],interactions:int.data||[],operations:ops.data||[],financial:fin.data||null,attributions:attr.data||[]};
}
function bookingFieldHTML(c,v){
const relSelect=(kind,arr)=>'<select data-field="'+c+'"><option value="">—</option>'+arr.map(x=>'<option value="'+x.id+'" '+(String(v??'')===String(x.id)?'selected':'')+'>'+esc(kind==='customers'?x.full_name:kind==='vehicles'?x.name:x.unit_code)+'</option>').join('');
if(c==='customer_id')return relSelect('customers',Object.values(lookups.customers));
if(c==='vehicle_id')return relSelect('vehicles',Object.values(lookups.vehicles));
if(c==='unit_id')return relSelect('units',Object.values(lookups.units));
if(c==='status')return '<select data-field="status">'+['Menunggu','Dikonfirmasi','Berjalan','Selesai','Dibatalkan'].map(o=>'<option '+(o===v?'selected':'')+'>'+o+'</option>').join('')+'</select>';
if(['notes','purpose_primary','journey_type'].includes(c))return '<textarea data-field="'+c+'">'+esc(v??'')+'</textarea>';
if(c==='purpose_secondary')return '<input data-field="'+c+'" value="'+esc(Array.isArray(v)?v.join(', '):v??'')+'">';
if(c==='journey_intelligence')return '<textarea data-field="'+c+'">'+esc(v?JSON.stringify(v,null,2):'{}')+'</textarea>';
if(['total_price','total_days','journey_confidence'].includes(c))return '<input data-field="'+c+'" type="number" value="'+esc(v??'')+'">';
if(c.endsWith('_date'))return '<input data-field="'+c+'" type="date" value="'+esc(v??'')+'">';
if(c.endsWith('_datetime')||c.endsWith('_at')||c==='hold_until')return '<input data-field="'+c+'" type="datetime-local" value="'+(v?new Date(v).toISOString().slice(0,16):'')+'">';
return '<input data-field="'+c+'" value="'+esc(v??'')+'">'
}
const bookingEditable=['customer_id','vehicle_id','unit_id','service','start_date','end_date','area','notes','status','total_price','total_days','start_datetime','end_datetime','estimated_ready_at','verification_status','hold_until','attribution_source','attribution_medium','attribution_campaign','attribution_content','attribution_term','landing_page','referrer_url','attribution_code','purpose_primary','purpose_secondary','journey_type','journey_confidence','journey_intelligence'];
function openBookingRecord(id){
const row=id?rows.find(x=>x.id===id):null;recordIndex=row?rows.findIndex(x=>x.id===id):rows.length;$('drawerTitle').textContent=(row?'Booking '+row.booking_code:'Booking Baru');$('drawerSubtitle').textContent=row?labelRelation('customers',row.customer_id)+' · '+labelRelation('vehicles',row.vehicle_id)+' · '+(row.start_date||'')+' → '+(row.end_date||''):'Input transaksi booking baru';
$('recordNav').innerHTML='<button type="button" class="btn ghost" id="first">First</button><button type="button" class="btn ghost" id="prev">‹ Back</button><span class="position">'+(row?(recordIndex+1)+' / '+rows.length:'New')+'</span><button type="button" class="btn ghost" id="next">Next ›</button><button type="button" class="btn ghost" id="last">Last</button><button type="button" class="btn ghost" id="undoBtn">↶ Undo</button>';
$('detailTabs').innerHTML='<button type="button" class="tab active" data-tab="main">Booking</button><button type="button" class="tab" data-tab="financial">Financial</button><button type="button" class="tab" data-tab="crm">CRM</button><button type="button" class="tab" data-tab="ops">Operations</button><button type="button" class="tab" data-tab="attribution">Attribution</button>';
$('formBody').innerHTML='<div id="tabMain"><div class="detail-summary">'+detailBox('Customer',labelRelation('customers',row?.customer_id)||row?.customer_name)+detailBox('Armada',labelRelation('vehicles',row?.vehicle_id))+detailBox('Unit',labelRelation('units',row?.unit_id))+detailBox('Status',statusPill(row?.status||'Menunggu'))+'</div><div class="field-grid">'+bookingEditable.map(c=>'<div class="field '+(['notes','journey_intelligence'].includes(c)?'full':'')+'"><label>'+c.replaceAll('_',' ')+'</label>'+bookingFieldHTML(c,row?.[c])+'</div>').join('')+'</div></div><div id="tabFinancial" class="related-panel hidden"></div><div id="tabCrm" class="related-panel hidden"></div><div id="tabOps" class="related-panel hidden"></div><div id="tabAttribution" class="related-panel hidden"></div>';
$('drawer').classList.remove('hidden');$('saveBtn').style.display=canWrite('bookings')?'block':'none';if(!canWrite('bookings'))$('formBody').querySelectorAll('input,select,textarea').forEach(x=>x.disabled=true);
$('recordForm').onsubmit=e=>saveBooking(e,row);$('first').onclick=()=>navigateBooking(0);$('prev').onclick=()=>navigateBooking(Math.max(0,recordIndex-1));$('next').onclick=()=>navigateBooking(Math.min(rows.length-1,recordIndex+1));$('last').onclick=()=>navigateBooking(Math.max(0,rows.length-1));$('undoBtn').onclick=undoLast;
document.querySelectorAll('.detail-tabs .tab').forEach(t=>t.onclick=()=>showBookingTab(t.dataset.tab));
if(row)relatedForBooking(row.id).then(()=>{renderRelatedPanels();});
}
function detailBox(k,v){return '<div class="detail-box"><span>'+k+'</span><b>'+v+'</b></div>'}
function showBookingTab(t){document.querySelectorAll('.detail-tabs .tab').forEach(x=>x.classList.toggle('active',x.dataset.tab===t));['Main','Financial','Crm','Ops','Attribution'].forEach(x=>$('tab'+x)?.classList.toggle('hidden',x.toLowerCase()!==t))}
function renderRelatedPanels(){
$('tabFinancial').innerHTML='<h3>Financial & Payment</h3><div class="related-grid">'+detailBox('Revenue',related.financial?.revenue??'—')+detailBox('Supplier Cost',related.financial?.supplier_cost??'—')+detailBox('Driver Cost',related.financial?.driver_cost??'—')+detailBox('Gross Margin',related.financial?.gross_margin??'—')+detailBox('Margin %',related.financial?.margin_percent??'—')+detailBox('Financial Status',related.financial?.financial_status??'—')+'</div>'+relatedTable('Transactions',related.transactions,['transaction_code','gross_amount','transaction_status','source'])+relatedTable('Payments',related.payments,['payment_reference','amount','payment_method','payment_status','paid_at'])+relatedTable('Refunds',related.refunds,['refund_reference','refund_amount','refund_reason','refund_status','processed_at'])+relatedTable('Fees',related.fees,['fee_type','fee_amount','fee_status']);
$('tabCrm').innerHTML=relatedTable('CRM Tasks',related.crm,['task_type','priority','status','title','next_followup_at'])+relatedTable('Interactions',related.interactions,['interaction_type','channel','direction','subject','outcome']);
$('tabOps').innerHTML=relatedTable('Operations Tasks',related.operations,['task_type','priority','status','title','due_at']);
$('tabAttribution').innerHTML=relatedTable('Booking Attribution',related.attributions,['attribution_source','attribution_code','attribution_method','captured_at']);
}
function relatedTable(title,data,cols){return '<div class="related-section"><div class="related-head"><h3>'+title+'</h3><span>'+data.length+' record</span></div><div class="mini-table"><table><thead><tr>'+cols.map(c=>'<th>'+c.replaceAll('_',' ')+'</th>').join('')+'</tr></thead><tbody>'+ (data.length?data.map(r=>'<tr>'+cols.map(c=>'<td>'+esc(r[c]??'—')+'</td>').join('')+'</tr>').join(''):'<tr><td colspan="'+cols.length+'">Tidak ada record terkait.</td></tr>')+'</tbody></table></div></div>'}
function navigateBooking(i){if(!rows[i])return;openBookingRecord(rows[i].id)}
async function saveBooking(e,row){e.preventDefault();const payload={};for(const c of bookingEditable){const el=document.querySelector('[data-field="'+c+'"]');if(!el||el.disabled)continue;let v=el.value;if(v==='')v=null;if(c==='purpose_secondary'&&v)v=v.split(',').map(x=>x.trim()).filter(Boolean);if(c==='journey_intelligence'){try{v=v?JSON.parse(v):{} }catch{notify('journey_intelligence harus JSON valid');return}}if(['total_price','total_days','journey_confidence'].includes(c)&&v!==null)v=Number(v);payload[c]=v}
let result,before=row?JSON.parse(JSON.stringify(row)):null;
if(row)result=await client.from('bookings').update(payload).eq('id',row.id).select().single();else result=await client.from('bookings').insert(payload).select().single();
if(result.error){notify(result.error.message);return}const saved=result.data;undoStack.push({table:'bookings',action:row?'update':'insert',id:saved.id,before,after:saved});if(undoStack.length>20)undoStack.shift();notify(row?'Booking diperbarui':'Booking ditambahkan');$('drawer').classList.add('hidden');await openTxView(txView)}
function requestDelete(table,id){if(!canDelete())return;pendingDelete={table,id};$('confirmText').textContent='Record akan dihapus dari '+table+'. Relasi database/RLS tetap berlaku.';$('confirmModal').classList.remove('hidden')}
async function executeDelete(){if(!pendingDelete)return;const p=pendingDelete;pendingDelete=null;$('confirmModal').classList.add('hidden');let old=null;if(p.table==='bookings')old=rows.find(x=>x.id===p.id);else{const r=await client.from(p.table).select('*').eq('id',p.id).maybeSingle();old=r.data}const r=await client.from(p.table).delete().eq('id',p.id);if(r.error){notify(r.error.message);return}undoStack.push({table:p.table,action:'delete',id:p.id,before:old});notify('Record dihapus');await (p.table==='bookings'?openTxView(txView):openModule(current))}
async function undoLast(){const u=undoStack.pop();if(!u){notify('Tidak ada perubahan untuk di-undo');return}let r;if(u.action==='insert')r=await client.from(u.table).delete().eq('id',u.id);else if(u.action==='update')r=await client.from(u.table).update(u.before).eq('id',u.id);else if(u.action==='delete'){const copy={...u.before};delete copy.id;r=await client.from(u.table).insert(copy)}if(r?.error){notify(r.error.message);undoStack.push(u);return}notify('Undo berhasil');if(u.table==='bookings')await openTxView(txView);else await openModule(current)}
async function renderCalendar(){
await loadLookups();rows=await getBookings();const t=new Date(),y=t.getFullYear(),m=t.getMonth(),first=new Date(y,m,1),last=new Date(y,m+1,0),days=last.getDate(),startDow=first.getDay();let html='<div class="calendar-head"><button class="btn ghost" id="calPrev">‹</button><h2>'+t.toLocaleDateString('id-ID',{month:'long',year:'numeric'})+'</h2><button class="btn ghost" id="calNext">›</button></div><div class="calendar-grid"><div>Min</div><div>Sen</div><div>Sel</div><div>Rab</div><div>Kam</div><div>Jum</div><div>Sab</div>';
for(let i=0;i<startDow;i++)html+='<div class="cal-day muted-day"></div>';
for(let d=1;d<=days;d++){const iso=new Date(y,m,d).toLocaleDateString('en-CA');const dayRows=rows.filter(r=>r.start_date<=iso&&r.end_date>=iso);html+='<div class="cal-day"><strong>'+d+'</strong>'+dayRows.slice(0,6).map(r=>'<button class="cal-booking '+String(r.status).toLowerCase()+'" data-cal-booking="'+r.id+'"><b>'+esc(r.booking_code)+'</b><span>'+esc(labelRelation('customers',r.customer_id))+'</span></button>').join('')+(dayRows.length>6?'<small>+'+(dayRows.length-6)+' lainnya</small>':'')+'</div>'}
html+='</div><div class="notice" style="margin-top:12px">Kalender menggunakan tanggal rental nyata dari <b>bookings.start_date → bookings.end_date</b>; klik booking untuk membuka record lengkap.</div>';$('content').innerHTML=html;document.querySelectorAll('[data-cal-booking]').forEach(b=>b.onclick=()=>openBookingRecord(b.dataset.calBooking))
}
async function renderRefunds(){
const r=await client.from('refunds').select('*').order('created_at',{ascending:false}).limit(1000);if(r.error){$('content').innerHTML='<div class="notice error">'+esc(r.error.message)+'</div>';return}rows=r.data||[];const writable=canWrite('refunds');$('content').innerHTML='<div class="module-head"><div><b>'+rows.length+' refund</b><div class="muted">Relasi Refund → Transaction → Booking → Customer / Armada.</div></div><div class="module-actions">'+(writable?'<button class="btn primary" id="insertBtn">＋ Refund Baru</button>':'')+'<button class="btn ghost" id="exportBtn">Export CSV</button><button class="btn ghost" id="printBtn">Print</button></div></div>'+txToolbar()+'<div class="table-card"><table class="table"><thead><tr><th>Refund Ref</th><th>Transaction</th><th>Booking</th><th>Amount</th><th>Reason</th><th>Status</th><th>Processed</th><th>Aksi</th></tr></thead><tbody id="tbody"></tbody></table></div>';const draw=()=>{const q=($('filter').value||'').toLowerCase();const vis=rows.filter(r=>JSON.stringify(r).toLowerCase().includes(q)||labelRelation('transactions',r.transaction_id).toLowerCase().includes(q));$('tbody').innerHTML=vis.map(r=>'<tr><td>'+esc(r.refund_reference)+'</td><td>'+esc(labelRelation('transactions',r.transaction_id))+'</td><td>'+esc(labelRelation('bookings',lookups.transactions[r.transaction_id]?.booking_id))+'</td><td>'+Number(r.refund_amount||0).toLocaleString('id-ID')+'</td><td>'+esc(r.refund_reason||'—')+'</td><td>'+statusPill(r.refund_status)+'</td><td>'+esc(r.processed_at||'—')+'</td><td><div class="row-actions"><button class="btn ghost" data-ref-view="'+r.id+'">View</button>'+(writable?'<button class="btn ghost" data-ref-edit="'+r.id+'">Update</button>':'')+(canDelete()?'<button class="btn danger" data-ref-del="'+r.id+'">Delete</button>':'')+'</div></td></tr>').join('')||'<tr><td colspan="8" class="empty">Tidak ada refund.</td></tr>';document.querySelectorAll('[data-ref-view],[data-ref-edit]').forEach(b=>b.onclick=()=>openGenericRecord('refunds',b.dataset.refView||b.dataset.refEdit));document.querySelectorAll('[data-ref-del]').forEach(b=>b.onclick=()=>requestDelete('refunds',b.dataset.refDel))};$('filter').oninput=draw;$('clearFilter').onclick=()=>{$('filter').value='';draw()};draw();if(writable)$('insertBtn').onclick=()=>openGenericRecord('refunds',null);$('exportBtn').onclick=()=>exportRows(rows,'refunds');$('printBtn').onclick=()=>window.print()
}
function exportRows(data,name){if(!data.length)return;const cols=Object.keys(data[0]),csv=[cols.join(','),...data.map(r=>cols.map(c=>'"'+String(r[c]??'').replaceAll('"','""')+'"').join(','))].join('\n'),a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download=name+'-'+new Date().toISOString().slice(0,10)+'.csv';a.click()}
function fieldHTML(table,c,v){let type='text';if(c.endsWith('_at'))type='datetime-local';if(c==='refund_amount'||c==='amount'||c==='fee_amount'||c==='gross_amount')type='number';if(c==='refund_status')return '<select data-field="'+c+'">'+['pending','approved','processed','rejected','cancelled'].map(o=>'<option '+(o===v?'selected':'')+'>'+o+'</option>').join('')+'</select>';if(c==='payment_status')return '<select data-field="'+c+'">'+['pending','paid','failed','cancelled'].map(o=>'<option '+(o===v?'selected':'')+'>'+o+'</option>').join('')+'</select>';return '<input data-field="'+c+'" type="'+type+'" value="'+esc(v??'')+'">'}
async function openGenericRecord(table,id){
const r=await client.from(table).select('*').eq('id',id).maybeSingle();const row=r.data||null;const cols=fallback[table]||Object.keys(row||{});$('drawerTitle').textContent=(row?'Update ':'Insert ')+(table==='refunds'?'Refund':table);$('drawerSubtitle').textContent=row?'Record linked to transaction '+labelRelation('transactions',row.transaction_id):'Financial transaction record';$('recordNav').innerHTML='<button type="button" class="btn ghost" id="undoBtn">↶ Undo</button>';$('detailTabs').innerHTML='';$('formBody').innerHTML='<div class="field-grid">'+cols.filter(c=>!['id','created_at'].includes(c)).map(c=>'<div class="field '+(['refund_reason','notes'].includes(c)?'full':'')+'"><label>'+c.replaceAll('_',' ')+'</label>'+fieldHTML(table,c,row?.[c])+'</div>').join('')+'</div>';$('drawer').classList.remove('hidden');$('saveBtn').style.display=canWrite(table)?'block':'none';$('recordForm').onsubmit=async e=>{e.preventDefault();const payload={};for(const c of cols.filter(c=>!['id','created_at'].includes(c))){const el=document.querySelector('[data-field="'+c+'"]');if(!el)continue;let v=el.value||null;if(['refund_amount','amount','fee_amount','gross_amount'].includes(c)&&v!==null)v=Number(v);payload[c]=v}let before=row?JSON.parse(JSON.stringify(row)):null;let res=row?await client.from(table).update(payload).eq('id',row.id).select().single():await client.from(table).insert(payload).select().single();if(res.error){notify(res.error.message);return}undoStack.push({table,action:row?'update':'insert',id:res.data.id,before,after:res.data});notify(row?'Record diperbarui':'Record ditambahkan');$('drawer').classList.add('hidden');await renderRefunds()};$('undoBtn').onclick=undoLast
}
async function openModule(m){current=m;setHeader(modules[m].title,modules[m].desc);document.querySelector('[data-module="'+m+'"]')?.classList.add('active');if(m==='analytics'){const r=await client.from('website_analytics_events').select('*').order('occurred_at',{ascending:false}).limit(300);rows=r.data||[];return renderGenericTable(m,rows)}const table=modules[m].table;if(!table)return home();const r=await client.from(table).select('*').order('created_at',{ascending:false}).limit(500);if(r.error){$('content').innerHTML='<div class="notice error">'+esc(r.error.message)+'</div>';return}rows=r.data||[];renderGenericTable(m,rows)}
function renderGenericTable(m,data){const writable=canWrite(m),cols=(data[0]?Object.keys(data[0]):fallback[modules[m].table]||[]).filter(c=>!['id','created_at','updated_at'].includes(c)).slice(0,10);$('content').innerHTML='<div class="module-head"><div><b>'+data.length+' record</b><div class="muted">Production data • authority: '+esc(role)+'</div></div><div class="module-actions">'+(writable?'<button class="btn primary" id="insertBtn">＋ Insert</button>':'')+'<button class="btn ghost" id="exportBtn">Export CSV</button><button class="btn ghost" id="printBtn">Print</button></div></div>'+txToolbar()+'<div class="table-card"><table class="table"><thead><tr>'+cols.map(c=>'<th>'+c.replaceAll('_',' ')+'</th>').join('')+'<th>Aksi</th></tr></thead><tbody id="tbody"></tbody></table></div>';const draw=()=>{const q=($('filter').value||'').toLowerCase();const vis=data.filter(r=>JSON.stringify(r).toLowerCase().includes(q));$('tbody').innerHTML=vis.map(r=>'<tr>'+cols.map(c=>'<td>'+esc(r[c]??'—')+'</td>').join('')+'<td><div class="row-actions"><button class="btn ghost" data-gview="'+r.id+'">View</button>'+(writable?'<button class="btn ghost" data-gedit="'+r.id+'">Update</button>':'')+(canDelete()&&writable?'<button class="btn danger" data-gdel="'+r.id+'">Delete</button>':'')+'</div></td></tr>').join('')||'<tr><td colspan="'+(cols.length+1)+'" class="empty">Tidak ada data.</td></tr>';document.querySelectorAll('[data-gview],[data-gedit]').forEach(b=>b.onclick=()=>openGenericRecord(modules[m].table,b.dataset.gview||b.dataset.gedit));document.querySelectorAll('[data-gdel]').forEach(b=>b.onclick=()=>requestDelete(modules[m].table,b.dataset.gdel))};$('filter').oninput=draw;$('clearFilter').onclick=()=>{$('filter').value='';draw()};draw();if(writable)$('insertBtn').onclick=()=>openGenericRecord(modules[m].table,null);$('exportBtn').onclick=()=>exportRows(data,m);$('printBtn').onclick=()=>window.print()}
async function openAuth(){const s=await client.auth.getSession();if(s.data.session)return true;$('authModal').classList.remove('hidden');return new Promise(resolve=>{$('authForm').onsubmit=async e=>{e.preventDefault();$('authError').textContent='';const r=await client.auth.signInWithPassword({email:$('authEmail').value.trim(),password:$('authPassword').value});if(r.error){$('authError').textContent=r.error.message;return}$('authModal').classList.add('hidden');resolve(true)}})}
async function init(){
bindNavigation();$('cancelDelete').onclick=()=>{$('confirmModal').classList.add('hidden');pendingDelete=null};$('confirmDelete').onclick=executeDelete;document.querySelectorAll('[data-close]').forEach(x=>x.onclick=()=>x.closest('.drawer-wrap')?.classList.add('hidden'));$('refreshBtn').onclick=()=>current==='home'?home():openTxView(txView);$('logoutBtn').onclick=async()=>{await client.auth.signOut();location.reload()};if(!(await openAuth()))return;const s=await client.auth.getSession(),uid=s.data.session.user.id,p=await client.from('user_profiles').select('role,full_name').eq('id',uid).maybeSingle();role=p.data?.role||s.data.session.user.app_metadata?.role||'viewer';$('roleBadge').textContent=(p.data?.full_name||s.data.session.user.email||'User')+' · '+role;$('dbStatus').textContent='Production DB · authenticated';home()
}
init()
})();