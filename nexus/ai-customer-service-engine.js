/* TransMind Nexus — AI Customer Service & Booking 50/day Command
 * Uses first-party analytics/RPC data only. No synthetic bookings or fake conversion.
 */
(function(){
'use strict';
const css='<style id="tm-ai-cs-style">.tmcs{margin-top:14px}.tmcs-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.tmcs-card{background:linear-gradient(145deg,#171a21,#101319);border:1px solid #292f39;border-radius:15px;padding:16px}.tmcs-card h3{margin:0 0 9px;font-size:14px}.tmcs-big{font-size:27px;font-weight:900;margin:5px 0}.tmcs-note{font-size:11px;color:#8e949f;line-height:1.5}.tmcs-bar{height:9px;background:#0a0d12;border-radius:99px;overflow:hidden;margin:10px 0}.tmcs-fill{height:100%;background:linear-gradient(90deg,#d2ad32,#65d49a);width:0}.tmcs-list{display:grid;gap:8px}.tmcs-row{display:grid;grid-template-columns:1.2fr .6fr 1.7fr;gap:10px;padding:10px 0;border-bottom:1px solid #252a31;font-size:11px;align-items:center}.tmcs-chip{display:inline-block;width:max-content;border:1px solid #343943;border-radius:999px;padding:4px 8px;font-size:9px}.tmcs-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:11px}.tmcs-actions button{border:1px solid #343943;background:#0d1015;color:#e7e8eb;border-radius:9px;padding:9px 11px;font-size:11px;cursor:pointer}.tmcs-actions .primary{background:#d2ad32;color:#111;border-color:#d2ad32;font-weight:800}@media(max-width:900px){.tmcs-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:650px){.tmcs-grid{grid-template-columns:1fr}.tmcs-row{min-width:620px}.tmcs-card{overflow:auto}}</style>';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const db=()=>window.NXSB||window.getTransmindSupabaseClient?.()||window.transmindSupabase||null;
const cut=d=>new Date(Date.now()-d*86400000).toISOString();
const num=v=>Number(v||0);
function localCare(){try{return JSON.parse(localStorage.getItem('transmind_ai_demand_v3')||'[]')}catch(_){return[]}}
function humanStage(t){return ({booking_cta_click:'CTA booking',booking_start:'Mulai booking',booking_success:'Booking berhasil',whatsapp_click:'WhatsApp',human_handoff_requested:'Perlu admin',ai_followup_scheduled:'Follow-up AI',ai_return_followup_due:'Follow-up kembali'})[t]||t}
async function render(){
 const host=document.getElementById('seoBody')||document.querySelector('#content-ai-customer-service');if(!host)return;
 host.innerHTML=css+'<div class="tmcs"><div class="tmcs-card"><h3>🤝 AI Customer Service</h3><div class="tmcs-note">Mesin pendamping calon pelanggan: jawab, bantu booking, simpan memori dengan persetujuan, minta keputusan admin saat diperlukan, dan membangun pembelajaran dari hasil nyata.</div></div><div id="tmcs-body"></div></div>';
 const body=document.getElementById('tmcs-body'),client=db();
 let live={},funnel={},events=[];
 try{
  if(client){
   const [a,b,c]=await Promise.all([
    client.rpc('nexus_seo_live_metrics',{p_days:1}),
    client.rpc('nexus_seo_funnel_metrics',{p_days:1}),
    client.from('website_analytics_events').select('event_type,occurred_at,metadata,source,path').gte('occurred_at',cut(1)).order('occurred_at',{ascending:false}).limit(3000)
   ]);
   live=a.data?.[0]||a.data||{};funnel=b.data?.[0]||b.data||{};events=c.data||[];
  }
 }catch(e){body.innerHTML+='<div class="tmcs-card" style="margin-top:12px"><div class="tmcs-note">Data real-time belum dapat dibaca: '+esc(e.message)+'</div></div>';return}
 const cta=num(funnel.booking_cta_clicks||funnel.booking_cta||live.booking_cta_clicks),book=num(funnel.bookings||live.bookings||0),wa=num(funnel.whatsapp_clicks||live.whatsapp_clicks||0),vis=num(funnel.visitors||live.visitors||live.unique_visitors||0);
 const target=50,gap=Math.max(0,target-book),rate=cta?book/cta*100:0,needed=gap;
 const counts={};events.forEach(e=>{const t=e.event_type||'event';counts[t]=(counts[t]||0)+1});
 const care=localCare().slice(-12).reverse();
 const rows=[
  ['CTA → Booking',cta+' CTA',book?'Ada booking':'Belum ada booking','Perbaiki handoff, form completion, availability confidence dan admin response.'],
  ['WhatsApp → Booking',wa+' klik',book?'Ada booking':'Belum ada booking','Pastikan percakapan tidak berhenti setelah klik; admin menerima peluang dan AI menyiapkan konteks.'],
  ['Follow-up',care.filter(x=>x.event_type==='ai_followup_scheduled').length+' terjadwal','Memory first-party','Gunakan follow-up yang relevan dan berbasis persetujuan; jangan mengirim spam.'],
  ['Human handoff',care.filter(x=>x.event_type==='human_handoff_requested').length+' event','Perlu keputusan admin','Prioritaskan pertanyaan harga khusus, negosiasi, refund, kontrak, pembayaran dan ketersediaan yang harus dikonfirmasi.']
 ];
 body.innerHTML='<div class="tmcs-grid" style="margin-top:12px">'+[
  ['Booking hari ini',book,'Booking nyata'],
  ['Target harian',target,'Target operasional'],
  ['Gap ke target',gap,'Booking tambahan diperlukan'],
  ['CTA → Booking',rate.toFixed(1)+'%','Rasio dari CTA tercatat']
 ].map(x=>'<div class="tmcs-card"><div class="tmcs-note">'+esc(x[0])+'</div><div class="tmcs-big">'+esc(x[1])+'</div><div class="tmcs-note">'+esc(x[2])+'</div></div>').join('')+'</div>'+
 '<div class="tmcs-card" style="margin-top:12px"><h3>🎯 Booking 50 / Hari</h3><div class="tmcs-note">Target ini diperlakukan sebagai sasaran operasional, bukan angka yang dipalsukan. Saat ini mesin hanya menghitung booking yang benar-benar tercatat.</div><div class="tmcs-bar"><div class="tmcs-fill" style="width:'+Math.min(100,book/target*100)+'%"></div></div><div class="tmcs-note">'+book+' / '+target+' booking tercatat hari ini · gap '+gap+'</div></div>'+
 '<div class="tmcs-card" style="margin-top:12px"><h3>🧠 AI Conversion Queue</h3><div class="tmcs-list">'+rows.map(r=>'<div class="tmcs-row"><b>'+esc(r[0])+'</b><span class="tmcs-chip">REAL SIGNAL</span><span>'+esc(r[1])+' — '+esc(r[2])+' — '+esc(r[3])+'</span></div>').join('')+'</div><div class="tmcs-actions"><button class="primary" id="tmcs-refresh">Refresh command center</button><button id="tmcs-copy">Copy priority queue</button></div></div>'+
 '<div class="tmcs-card" style="margin-top:12px"><h3>📚 Customer Memory & Learning</h3><div class="tmcs-note">'+(care.length?care.map(x=>'<div style="padding:7px 0;border-bottom:1px solid #252a31"><b>'+esc(humanStage(x.event_type))+'</b> · '+esc(new Date(x.occurred_at||Date.now()).toLocaleString('id-ID'))+' · '+esc(x.reason||x.stage||'customer signal')+'</div>').join(''):'Belum ada memori customer-care pada browser admin ini. Data backend tetap menjadi sumber utama bila tersedia.')+'</div></div>';
 document.getElementById('tmcs-refresh')?.addEventListener('click',render);
 document.getElementById('tmcs-copy')?.addEventListener('click',async()=>{const q=rows.map((r,i)=>(i+1)+'. '+r.join(' — ')).join('\n');try{await navigator.clipboard.writeText(q);alert('Priority queue disalin.')}catch(_){alert(q)}});
}
window.TRANSMIND_AI_CUSTOMER_SERVICE_CONSOLE={render};
})();