/* TransMind Nexus — AI Customer Service / Booking 50-Day Command Center v6
 * Uses protected aggregate RPCs for booking truth and customer-care queues.
 * Human gate + consent-aware follow-up + relationship learning.
 */
(function(){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=v=>Number(v||0);
const db=()=>window.NXSB||window.getTransmindSupabaseClient?.()||window.transmindSupabase||null;
const css=`<style id="tm-ai-cs-style">
.tmcs{margin-top:14px}.tmcs-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.tmcs-card{background:linear-gradient(145deg,#171a21,#101319);border:1px solid #292f39;border-radius:15px;padding:16px}.tmcs-card h3{margin:0 0 9px;font-size:14px}.tmcs-big{font-size:27px;font-weight:900;margin:5px 0}.tmcs-note{font-size:11px;color:#8e949f;line-height:1.5}.tmcs-bar{height:9px;background:#0a0d12;border-radius:99px;overflow:hidden;margin:10px 0}.tmcs-fill{height:100%;background:linear-gradient(90deg,#d2ad32,#65d49a)}.tmcs-list{display:grid;gap:8px}.tmcs-row{display:grid;grid-template-columns:1.05fr .55fr 1.7fr;gap:10px;padding:10px 0;border-bottom:1px solid #252a31;font-size:11px;align-items:center}.tmcs-chip{display:inline-block;width:max-content;border:1px solid #343943;border-radius:999px;padding:4px 8px;font-size:9px}.tmcs-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:11px}.tmcs-actions button{border:1px solid #343943;background:#0d1015;color:#e7e8eb;border-radius:9px;padding:9px 11px;font-size:11px;cursor:pointer}.tmcs-actions .primary{background:#d2ad32;color:#111;border-color:#d2ad32;font-weight:800}.tmcs-hot{border-color:#624d18;background:linear-gradient(145deg,#211b0d,#111319)}.tmcs-table{overflow:auto}.tmcs-tr{display:grid;grid-template-columns:1.15fr .8fr .8fr 1fr 1.1fr;gap:8px;min-width:820px;padding:10px 5px;border-bottom:1px solid #252a31;align-items:center;font-size:11px}.tmcs-th{font-size:9px;color:#8e949f;text-transform:uppercase;letter-spacing:.7px}.tmcs-wa{border:1px solid #355d4a!important;color:#b8f0d1!important;background:#0d1712!important}@media(max-width:900px){.tmcs-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:650px){.tmcs-grid{grid-template-columns:1fr}.tmcs-row{min-width:620px}.tmcs-card{overflow:auto}}
</style>`;
async function safe(p,f){try{const r=await p;if(r?.error)throw r.error;return r?.data??f}catch(_){return f}}
function wa(phone,message){const p=String(phone||'').replace(/\D/g,'');return 'https://wa.me/'+(p||'628816654141')+'?text='+encodeURIComponent(message||'Halo, saya dari TransMind.')}
function humanReason(x){return x?.human_reason||'Keputusan admin diperlukan.'}
async function render(){
 const host=document.getElementById('seoBody')||document.querySelector('#content-ai-customer-service');if(!host)return;
 const client=db();if(!client){host.innerHTML='<div class="tmcs-card">NEXUS belum terhubung ke backend.</div>';return}
 host.innerHTML=css+'<div class="tmcs"><div class="tmcs-card tmcs-hot"><h3>🤝 AI Customer Service — Booking 50 / Hari</h3><div class="tmcs-note">Mesin ini membaca booking truth dan customer-care queue melalui RPC terproteksi, menjaga konteks pelanggan, mengejar next action, dan menyerahkan keputusan sensitif kepada admin.</div></div><div id="tmcs-body"></div></div>';
 const body=document.getElementById('tmcs-body');
 const [seo,care]=await Promise.all([
  safe(client.rpc('nexus_seo_command_center',{p_days:1}),{}),
  safe(client.rpc('nexus_customer_care_dashboard',{p_days:1}),{})
 ]);
 const x=seo||{},c=care||{},book=num(x.bookings),target=num(x.target_bookings_per_day)||50,gap=Math.max(0,num(x.booking_gap)||target-book),vis=num(x.unique_visitors),cta=num(x.booking_cta_clicks),waClicks=num(x.whatsapp_clicks),starts=num(x.booking_starts),leads=Array.isArray(c.lead_items)?c.lead_items:[],due=Array.isArray(c.due_items)?c.due_items:[],handoff=leads.filter(l=>l.human_required).length;
 const sourceOk=Object.keys(x).length>0&&Object.keys(c).length>0;
 const conversion=cta?book/cta*100:0;
 const queue=leads.slice(0,12).map(l=>{
  const msg=l.human_required?'Halo '+(l.name||'kak')+', saya dari Transmind. Saya teruskan detailnya ke admin agar keputusan akhirnya tepat.':'Halo '+(l.name||'kak')+', saya dari Transmind. Saya ingin membantu melanjutkan kebutuhan rental yang kemarin dibahas. Kalau masih dibutuhkan, saya siap bantu cek kembali.';
  return '<div class="tmcs-tr"><span><b>'+esc(l.name||'Calon pelanggan')+'</b><br><small class="tmcs-note">'+esc(l.phone||'')+'</small></span><span class="tmcs-chip">'+esc(l.stage||'lead')+'</span><span>'+esc(l.intent||'rental')+'</span><span>'+esc(l.next_followup_at?new Date(l.next_followup_at).toLocaleString('id-ID'):'—')+'</span><span><a class="tmcs-wa" style="display:inline-block;padding:7px 9px;border-radius:8px;text-decoration:none" target="_blank" rel="noopener" href="'+wa(l.phone,msg)+'">Kirim via WhatsApp</a></span></div>'
 }).join('')||'<div class="tmcs-note" style="padding:15px 5px">Belum ada lead dengan consent pada queue.</div>';
 const dueRows=due.slice(0,10).map(q=>'<div class="tmcs-row"><b>'+esc(q.name||'Calon pelanggan')+'</b><span class="tmcs-chip">'+esc(q.priority||'normal')+'</span><span>'+esc(q.stage||'follow-up')+' · '+esc(q.message_body||'Siap ditindaklanjuti.')+'</span></div>').join('')||'<div class="tmcs-note">Belum ada follow-up yang jatuh tempo.</div>';
 body.innerHTML='<div class="tmcs-grid" style="margin-top:12px">'+[
  ['Booking nyata hari ini',book,'ledger melalui protected RPC'],
  ['Target harian',target,'sasaran operasional'],
  ['Gap',gap,'booking tambahan menuju target'],
  ['CTA → Booking',conversion.toFixed(1)+'%','booking nyata / CTA']
 ].map(x=>'<div class="tmcs-card"><div class="tmcs-note">'+esc(x[0])+'</div><div class="tmcs-big">'+esc(x[1])+'</div><div class="tmcs-note">'+esc(x[2])+'</div></div>').join('')+'</div>'+
 '<div class="tmcs-card" style="margin-top:12px"><h3>🎯 Funnel Truth</h3><div class="tmcs-note">Visitor '+vis+' · CTA '+cta+' · Booking start '+starts+' · WhatsApp '+waClicks+' · Booking nyata '+book+'.</div><div class="tmcs-bar"><div class="tmcs-fill" style="width:'+Math.min(100,book/target*100)+'%"></div></div><div class="tmcs-note">'+book+' / '+target+' booking hari ini · '+gap+' lagi. '+(sourceOk?'Data command center terbaca.':'Periksa akses RPC/NEXUS.')+'</div></div>'+
 '<div class="tmcs-card" style="margin-top:12px"><h3>🚨 Admin Opportunity Radar</h3><div class="tmcs-list">'+
 '<div class="tmcs-row"><b>Lead aktif</b><span class="tmcs-chip">'+leads.filter(l=>l.status==='open').length+'</span><span>Setiap lead ber-consent harus memiliki next action.</span></div>'+
 '<div class="tmcs-row"><b>Handoff manusia</b><span class="tmcs-chip">'+handoff+'</span><span>Harga khusus, ketersediaan final, refund, komplain, perubahan booking, kontrak/legal dan keputusan khusus tidak dijawab AI.</span></div>'+
 '<div class="tmcs-row"><b>Follow-up jatuh tempo</b><span class="tmcs-chip">'+due.length+'</span><span>Pesan siap kirim; outbound otomatis hanya jika provider resmi dan izin tersedia.</span></div>'+
 '<div class="tmcs-row"><b>Admin task</b><span class="tmcs-chip">'+num(c.open_tasks)+'</span><span>CRM menjadi pengingat peluang agar tidak hilang.</span></div>'+
 '</div></div>'+
 '<div class="tmcs-card" style="margin-top:12px"><h3>👥 Follow-up Calon Pelanggan</h3><div class="tmcs-note">Urutan default: 30 menit → 1 hari → 3 hari → 7 hari. Setelah booking berhasil, queue dibatalkan. Jika pelanggan menunda/tidak jadi, sistem pindah ke relationship care 7/30/60/90 hari sesuai consent.</div><div class="tmcs-table" style="margin-top:10px"><div class="tmcs-tr tmcs-th"><span>CALON PELANGGAN</span><span>STAGE</span><span>INTENT</span><span>NEXT</span><span>ACTION</span></div>'+queue+'</div></div>'+
 '<div class="tmcs-card" style="margin-top:12px"><h3>⏰ Yang Harus Dilakukan Admin Sekarang</h3><div class="tmcs-list">'+dueRows+'</div></div>'+
 '<div class="tmcs-card" style="margin-top:12px"><h3>🧠 Learning Loop</h3><div class="tmcs-note">AI menyimpan sinyal percakapan, keberatan, kebutuhan, hasil follow-up dan booking. Sinyal dipakai untuk memperbaiki prioritas, timing dan konteks respons berikutnya; bukan untuk membuat booking palsu.</div><div class="tmcs-actions"><button class="primary" id="tmcs-refresh">↻ Refresh</button><button id="tmcs-copy">Copy priority queue</button></div></div>';
 document.getElementById('tmcs-refresh')?.addEventListener('click',render);
 document.getElementById('tmcs-copy')?.addEventListener('click',async()=>{const q=['BOOKING 50/HARI: '+book+'/'+target+' | GAP '+gap,'LEAD AKTIF: '+leads.length,'HANDOFF: '+handoff,'FOLLOW-UP DUE: '+due.length,...due.slice(0,10).map((x,i)=>(i+1)+'. '+(x.name||'Lead')+' | '+(x.phone||'')+' | '+(x.stage||'')+' | '+(x.message_body||''))].join('\n');try{await navigator.clipboard.writeText(q);alert('Priority queue disalin.')}catch(_){alert(q)}});
}
window.TRANSMIND_AI_CUSTOMER_SERVICE_CONSOLE={render};
setTimeout(()=>{if(document.getElementById('seoBody'))render()},1000);
})();