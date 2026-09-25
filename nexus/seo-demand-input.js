/* TransMind Nexus — Demand & Conversion Input / Booking Rescue Console
   Purpose: make the data-entry layer visible where SEO & Demand is viewed.
   Writes only first-party lead/follow-up signals; no synthetic bookings.
*/
(function(){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const db=()=>window.NXSB||window.getTransmindSupabaseClient?.()||window.transmindSupabase||null;
const since=d=>new Date(Date.now()-d*86400000).toISOString();
const phone=v=>String(v||'').replace(/\D/g,'');
const css=`<style id="tm-demand-input-style">
.tm-di{margin-top:14px}.tm-di-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.tm-di-card{background:linear-gradient(145deg,#171a21,#101319);border:1px solid #292f39;border-radius:15px;padding:16px}.tm-di-card h3{margin:0 0 10px;font-size:14px}.tm-di-note{font-size:11px;color:#8e949f;line-height:1.55}.tm-di-value{font-size:25px;font-weight:900;margin:5px 0}.tm-di-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}.tm-di-field label{display:block;color:#c8ccd4;font-size:11px;margin:0 0 6px}.tm-di-field input,.tm-di-field select,.tm-di-field textarea{width:100%;background:#0b0e13;border:1px solid #363b45;color:#fff;border-radius:10px;padding:11px;outline:none}.tm-di-field textarea{min-height:80px}.tm-di-full{grid-column:1/-1}.tm-di-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.tm-di-btn{border:1px solid #343943;background:#0d1015;color:#e7e8eb;border-radius:9px;padding:9px 12px;cursor:pointer}.tm-di-btn.primary{background:#d2ad32;color:#111;border-color:#d2ad32;font-weight:850}.tm-di-btn.green{border-color:#315d49;color:#9be1ba}.tm-di-table{overflow:auto}.tm-di-row{display:grid;grid-template-columns:1.1fr .75fr .8fr 1.2fr .8fr;gap:9px;min-width:820px;padding:10px 4px;border-bottom:1px solid #252a31;align-items:center;font-size:11px}.tm-di-head{color:#8e949f;text-transform:uppercase;letter-spacing:.7px;font-size:9px}.tm-di-pill{display:inline-block;width:max-content;border:1px solid #343943;border-radius:999px;padding:4px 8px;font-size:9px}@media(max-width:900px){.tm-di-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:650px){.tm-di-grid,.tm-di-form{grid-template-columns:1fr}.tm-di-full{grid-column:auto}.tm-di-card{overflow:auto}}
</style>`;
function session(){let x=localStorage.getItem('tm_nexus_session');if(!x){x='nexus-'+crypto.randomUUID();localStorage.setItem('tm_nexus_session',x)}return x}
async function load(host){
 const d=db();if(!d){host.insertAdjacentHTML('beforeend','<div class="notice bad tm-di">Database Nexus belum terhubung.</div>');return}
 const [ev,leads,queue,bookings]=await Promise.all([
  d.from('website_analytics_events').select('event_type').gte('occurred_at',since(1)).limit(5000),
  d.from('customer_care_leads').select('id,name,phone,intent,status,stage,human_required,human_reason,next_followup_at,last_activity_at').order('next_followup_at',{ascending:true}).limit(50),
  d.from('customer_care_followup_queue').select('id,lead_id,stage,scheduled_at,status,requires_human').in('status',['queued','admin_ready']).order('scheduled_at',{ascending:true}).limit(50),
  d.from('bookings').select('id,booking_code,status,created_at,customer_name,customer_phone').gte('created_at',since(1)).order('created_at',{ascending:false}).limit(100)
 ]);
 const rows=ev.data||[], L=leads.data||[], Q=queue.data||[], B=(bookings.data||[]).filter(x=>!['dibatalkan','cancelled','CANCELLED'].includes(String(x.status||'')));
 const count=t=>rows.filter(x=>x.event_type===t).length;
 host.insertAdjacentHTML('beforeend',css+`<section class="tm-di">
  <div class="tm-di-card"><h3>🧭 Data Demand & Conversion — LIVE INPUT</h3><div class="tm-di-note">Di sinilah data yang masuk dari CTA, percakapan, calon pelanggan, follow-up dan booking nyata dapat dilihat serta ditindaklanjuti. <b>Booking hanya bertambah bila transaksi benar-benar tercatat.</b></div></div>
  <div class="tm-di-grid" style="margin-top:12px">
   <div class="tm-di-card"><div class="tm-di-note">Visitor 24 jam</div><div class="tm-di-value">${count('page_view')}</div></div>
   <div class="tm-di-card"><div class="tm-di-note">WhatsApp 24 jam</div><div class="tm-di-value">${count('whatsapp_click')}</div></div>
   <div class="tm-di-card"><div class="tm-di-note">Booking CTA 24 jam</div><div class="tm-di-value">${count('booking_cta_click')}</div></div>
   <div class="tm-di-card"><div class="tm-di-note">Booking nyata 24 jam</div><div class="tm-di-value" style="color:${B.length?'#65d49a':'#e5c15a'}">${B.length}</div></div>
  </div>
  <div class="tm-di-card" style="margin-top:12px"><h3>👤 Tangkap Calon Pelanggan</h3><div class="tm-di-note">Form ini bukan untuk membuat angka booking. Form ini menangkap peluang nyata agar AI Customer Service dapat melanjutkan percakapan dan membuat follow-up.</div>
   <form id="tm-di-lead-form" class="tm-di-form" style="margin-top:12px">
    <div class="tm-di-field"><label>Nama *</label><input id="tm-di-name" required placeholder="Nama calon pelanggan"></div>
    <div class="tm-di-field"><label>WhatsApp *</label><input id="tm-di-phone" required placeholder="08xx / 62xx"></div>
    <div class="tm-di-field"><label>Intent *</label><select id="tm-di-intent"><option value="booking">Ingin booking</option><option value="pricing">Tanya harga</option><option value="consultation">Konsultasi</option><option value="travel_plan">Rencana perjalanan</option></select></div>
    <div class="tm-di-field"><label>Kendaraan / kelas</label><input id="tm-di-vehicle" placeholder="Contoh: Avanza"></div>
    <div class="tm-di-field"><label>Layanan</label><select id="tm-di-service"><option value="">Belum ditentukan</option><option>lepas kunci</option><option>dengan driver</option><option>corporate</option><option>pariwisata</option><option>wedding</option></select></div>
    <div class="tm-di-field"><label>Durasi (hari)</label><input id="tm-di-days" type="number" min="1" value="1"></div>
    <div class="tm-di-field"><label>Tanggal mulai</label><input id="tm-di-date" type="date"></div>
    <div class="tm-di-field"><label>Area / tujuan</label><input id="tm-di-area" placeholder="Jakarta / Bogor / dst."></div>
    <div class="tm-di-field tm-di-full"><label>Pesan / kebutuhan</label><textarea id="tm-di-message" placeholder="Apa yang dibutuhkan calon pelanggan?"></textarea></div>
    <div class="tm-di-field tm-di-full"><label><input id="tm-di-consent" type="checkbox" checked> Saya memiliki izin untuk follow-up layanan kepada calon pelanggan ini.</label></div>
    <div class="tm-di-actions tm-di-full"><button class="tm-di-btn primary" type="submit">Tangkap Lead & Buat Follow-up</button><span id="tm-di-msg" class="tm-di-note"></span></div>
   </form>
  </div>
  <div class="tm-di-card" style="margin-top:12px"><h3>🚨 Opportunity → Admin</h3><div class="tm-di-note">AI boleh membantu komunikasi, tetapi keputusan khusus tetap kembali kepada manusia. Queue berikut menjadi pengingat admin.</div>
   <div class="tm-di-table" style="margin-top:10px"><div class="tm-di-row tm-di-head"><span>CALON</span><span>INTENT</span><span>STAGE</span><span>NEXT FOLLOW-UP</span><span>HANDOFF</span></div>
   ${L.length?L.map(x=>'<div class="tm-di-row"><span><b>'+esc(x.name||'Calon pelanggan')+'</b><br><small>'+esc(x.phone||'')+'</small></span><span class="tm-di-pill">'+esc(x.intent||'—')+'</span><span>'+esc(x.stage||'new')+'</span><span>'+esc(x.next_followup_at?new Date(x.next_followup_at).toLocaleString('id-ID'):'—')+'</span><span class="tm-di-pill">'+(x.human_required?'ADMIN':'AI')+'</span></div>').join(''):'<div class="tm-di-note" style="padding:12px">Belum ada lead. Gunakan form di atas untuk menangkap peluang nyata.</div>'}
   </div>
  </div>
  <div class="tm-di-card" style="margin-top:12px"><h3>🎯 Misi 50 Booking / Hari</h3><div class="tm-di-note">Hari ini mesin tidak akan mengejar 50 dengan traffic palsu. Ia akan mengejar 50 melalui rantai nyata: <b>Visitor → CTA → Lead → Percakapan → Follow-up → Admin bila perlu → Booking nyata</b>.</div><div class="tm-di-grid" style="margin-top:10px"><div class="tm-di-card"><div class="tm-di-note">Lead terbuka</div><div class="tm-di-value">${L.filter(x=>x.status==='open').length}</div></div><div class="tm-di-card"><div class="tm-di-note">Follow-up queue</div><div class="tm-di-value">${Q.length}</div></div><div class="tm-di-card"><div class="tm-di-note">Handoff admin</div><div class="tm-di-value">${L.filter(x=>x.human_required).length}</div></div><div class="tm-di-card"><div class="tm-di-note">Gap ke 50</div><div class="tm-di-value" style="color:#e5c15a">${Math.max(0,50-B.length)}</div></div></div></div>
 </section>`);
 const form=document.getElementById('tm-di-lead-form');
 form?.addEventListener('submit',async e=>{
  e.preventDefault();const msg=document.getElementById('tm-di-msg'),p=phone(document.getElementById('tm-di-phone').value);
  if(p.length<9){msg.textContent='Nomor WhatsApp belum valid.';return}
  if(!document.getElementById('tm-di-consent').checked){msg.textContent='Izin follow-up harus dicentang.';return}
  msg.textContent='Menyimpan lead…';
  try{
   const lead={name:document.getElementById('tm-di-name').value.trim(),phone:p,consent_status:'granted',source:'nexus_demand_input',stage:'new',intent:document.getElementById('tm-di-intent').value,status:'open',last_activity_at:new Date().toISOString(),next_followup_at:new Date(Date.now()+30*60000).toISOString(),followup_stage:'30m',metadata:{vehicle:document.getElementById('tm-di-vehicle').value.trim(),service:document.getElementById('tm-di-service').value,date:document.getElementById('tm-di-date').value,days:Number(document.getElementById('tm-di-days').value||1),area:document.getElementById('tm-di-area').value.trim(),message:document.getElementById('tm-di-message').value.trim(),source_page:location.pathname}};
   const ins=await d.from('customer_care_leads').insert(lead).select('id').single();if(ins.error)throw ins.error;
   const q=await d.from('customer_care_followup_queue').insert({lead_id:ins.data.id,stage:'30m',scheduled_at:new Date(Date.now()+30*60000).toISOString(),channel:'whatsapp',message_body:'Halo '+lead.name.split(/\s+/)[0]+', terima kasih sudah menghubungi TransMind. Kami siap membantu melanjutkan kebutuhan perjalanan Anda.',status:'queued',requires_human:false,metadata:{source:'nexus_demand_input',phone:p,consent_status:'granted'}});if(q.error)throw q.error;
   const ev=await d.from('website_analytics_events').insert({event_type:'ai_lead_capture',visitor_session_id:session(),path:location.pathname,title:'Nexus Demand Input',source:'nexus',metadata:{lead_id:ins.data.id,intent:lead.intent,phone:p,consent_status:'granted'}});if(ev.error)throw ev.error;
   msg.textContent='Lead tersimpan. Follow-up 30 menit sudah masuk antrean. Refresh untuk melihatnya.';
   form.reset();document.getElementById('tm-di-consent').checked=true;
  }catch(err){msg.textContent='Gagal menyimpan: '+err.message}
 });
}
function boot(){const el=document.getElementById('seoBody');if(!el||el.dataset.tmDemandInput==='1')return;el.dataset.tmDemandInput='1';load(el).catch(e=>el.insertAdjacentHTML('beforeend','<div class="notice bad tm-di">Demand input gagal: '+esc(e.message)+'</div>'))}
window.TRANSMIND_DEMAND_INPUT={boot};
document.addEventListener('tm-seo-refresh',()=>setTimeout(()=>{const e=document.getElementById('seoBody');if(e)e.dataset.tmDemandInput='';boot()},250));
setTimeout(boot,1800);
})();