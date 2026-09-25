/* TransMind Nexus — AI Customer Service Console
   Visible workspace for lead capture, AI handoff, human gate and follow-up queue.
*/
(function(){
'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const db=()=>window.NXSB||window.getTransmindSupabaseClient?.();
const css=`<style id="tm-acs-console-style">
#tm-acs{margin-top:4px}.acs-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.acs-card{background:linear-gradient(145deg,#171a21,#101319);border:1px solid #292f39;border-radius:16px;padding:16px}.acs-card h3{margin:0 0 11px;font-size:14px}.acs-note{font-size:11px;color:#8e949f;line-height:1.55}.acs-value{font-size:26px;font-weight:900;margin:5px 0}.acs-ok{color:#65d49a}.acs-warn{color:#e5c15a}.acs-danger{color:#e87878}.acs-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}.acs-field label{display:block;color:#c8ccd4;font-size:11px;margin:0 0 6px}.acs-field input,.acs-field select,.acs-field textarea{width:100%;background:#0b0e13;border:1px solid #363b45;color:#fff;border-radius:10px;padding:11px;outline:none}.acs-field textarea{min-height:92px;resize:vertical}.acs-full{grid-column:1/-1}.acs-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:11px}.acs-btn{border:1px solid #343943;background:#0d1015;color:#e7e8eb;border-radius:9px;padding:9px 12px;cursor:pointer}.acs-btn.primary{background:#d2ad32;border-color:#d2ad32;color:#111;font-weight:850}.acs-btn.green{border-color:#315d49;color:#9be1ba}.acs-table{overflow:auto}.acs-row{display:grid;grid-template-columns:1.15fr 1fr .75fr 1.45fr .9fr;gap:10px;align-items:center;min-width:850px;padding:10px 4px;border-bottom:1px solid #252a31;font-size:11px}.acs-head{color:#8e949f;text-transform:uppercase;letter-spacing:.7px;font-size:9px}.acs-pill{display:inline-block;width:max-content;border:1px solid #343943;border-radius:999px;padding:4px 8px;font-size:9px}.acs-chat{display:grid;grid-template-rows:auto 1fr auto;min-height:390px}.acs-messages{min-height:220px;max-height:330px;overflow:auto;background:#0a0d11;border:1px solid #252a31;border-radius:12px;padding:12px}.acs-msg{max-width:85%;padding:9px 11px;border-radius:12px;margin:7px 0;white-space:pre-wrap;line-height:1.45;font-size:12px}.acs-msg.ai{background:#171b22;border:1px solid #2a303a}.acs-msg.user{margin-left:auto;background:#28200d;border:1px solid #57491c}.acs-chatbar{display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:10px}.acs-chatbar textarea{background:#0b0e13;border:1px solid #363b45;color:#fff;border-radius:10px;padding:10px;min-height:58px}.acs-gate{border-left:3px solid #d2ad32;padding-left:11px}.acs-check{display:flex;gap:8px;align-items:flex-start;color:#c7cbd2;font-size:11px;line-height:1.4}.acs-check input{margin-top:2px}@media(max-width:950px){.acs-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:700px){.acs-grid,.acs-form{grid-template-columns:1fr}.acs-full{grid-column:auto}.acs-chat{min-height:340px}}
</style>`;
const sessionId=()=>{let x=localStorage.getItem('tm_nexus_ai_cs_session');if(!x){x='nexus-ai-cs-'+crypto.randomUUID();localStorage.setItem('tm_nexus_ai_cs_session',x)}return x};
const fmt=d=>d?new Date(d).toLocaleString('id-ID',{dateStyle:'short',timeStyle:'short'}):'—';
function shell(el){
 el.innerHTML=css+`<div id="tm-acs">
 <div class="hero"><div><div class="eyebrow">AI CUSTOMER SERVICE</div><div class="title">Customer Care & Booking Growth</div><div class="desc">Satu ruang untuk menangkap calon pelanggan, menguji percakapan AI, melihat peluang booking dan memberi pekerjaan yang jelas kepada admin.</div></div><div class="hero-actions"><button class="acs-btn" id="acs-refresh">↻ Refresh</button></div></div>
 <div class="acs-grid">
  <div class="acs-card"><div class="acs-note">Target booking / hari</div><div class="acs-value acs-warn">50</div><div class="acs-note">sasaran operasional</div></div>
  <div class="acs-card"><div class="acs-note">CTA 24 jam</div><div class="acs-value" id="acs-cta">—</div><div class="acs-note">minat masuk funnel</div></div>
  <div class="acs-card"><div class="acs-note">WhatsApp 24 jam</div><div class="acs-value" id="acs-wa">—</div><div class="acs-note">handoff percakapan</div></div>
  <div class="acs-card"><div class="acs-note">Booking Start 24 jam</div><div class="acs-value" id="acs-start">—</div><div class="acs-note">form booking benar-benar dimulai</div></div>
  <div class="acs-card"><div class="acs-note">Booking 24 jam</div><div class="acs-value acs-danger" id="acs-book">—</div><div class="acs-note">yang benar-benar tercatat</div></div>
 </div>
 <div class="acs-grid" style="margin-top:12px">
  <div class="acs-card"><div class="acs-note">AI lead captured</div><div class="acs-value" id="acs-leads">—</div><div class="acs-note">nama + WhatsApp</div></div>
  <div class="acs-card"><div class="acs-note">Admin follow-up</div><div class="acs-value" id="acs-tasks">—</div><div class="acs-note">tugas terbuka</div></div>
  <div class="acs-card"><div class="acs-note">Rescue queue</div><div class="acs-value" id="acs-rescue">—</div><div class="acs-note">peluang yang perlu disentuh</div></div>
  <div class="acs-card"><div class="acs-note">Tracking health</div><div class="acs-value acs-ok" id="acs-health">CHECK</div><div class="acs-note">CTA → start → success</div></div>
 </div>
 <div class="acs-grid" style="margin-top:12px;grid-template-columns:1.1fr .9fr">
  <div class="acs-card"><h3>👤 Form Calon Pelanggan</h3><div class="acs-note">Ini adalah pintu data resmi. Setelah data masuk, AI dapat melanjutkan percakapan; bila membutuhkan keputusan khusus, sistem membuat pekerjaan untuk admin.</div>
   <form id="acs-lead-form" class="acs-form" style="margin-top:12px">
    <div class="acs-field"><label>Nama *</label><input id="acs-name" required placeholder="Nama calon pelanggan"></div>
    <div class="acs-field"><label>WhatsApp *</label><input id="acs-phone" required placeholder="08xx / 62xx"></div>
    <div class="acs-field"><label>Kebutuhan *</label><select id="acs-intent"><option value="booking">Saya ingin booking</option><option value="pricing">Saya ingin tanya harga</option><option value="rental_consultation">Saya ingin konsultasi</option><option value="travel_planning">Saya sedang merencanakan perjalanan</option></select></div>
    <div class="acs-field"><label>Kendaraan</label><input id="acs-vehicle" placeholder="Contoh: Toyota Avanza"></div>
    <div class="acs-field"><label>Layanan</label><select id="acs-service"><option value="">Pilih layanan</option><option>lepas kunci</option><option>dengan driver</option><option>corporate</option><option>pariwisata</option><option>wedding</option></select></div>
    <div class="acs-field"><label>Durasi (hari)</label><input id="acs-days" type="number" min="1" value="1"></div>
    <div class="acs-field"><label>Tanggal mulai</label><input id="acs-date" type="date"></div>
    <div class="acs-field"><label>Area / tujuan</label><input id="acs-area" placeholder="Jakarta / Bogor / dst."></div>
    <div class="acs-field acs-full"><label>Pesan pertama</label><textarea id="acs-message" placeholder="Contoh: Saya mau sewa Avanza untuk 2 hari dengan driver."></textarea></div>
    <div class="acs-field acs-full"><label class="acs-check"><input id="acs-consent" type="checkbox" checked> Saya menyetujui Transmind menyimpan data ini untuk pelayanan dan follow-up yang relevan. Follow-up WhatsApp tetap mengikuti izin dan aturan komunikasi.</label></div>
    <div class="acs-actions acs-full"><button class="acs-btn primary" type="submit">Tangkap Lead & Jalankan AI</button><span id="acs-form-msg" class="acs-note"></span></div>
   </form>
  </div>
  <div class="acs-card acs-chat"><h3>💬 Uji Percakapan AI</h3><div id="acs-messages" class="acs-messages"><div class="acs-msg ai">Halo, saya Customer Care Transmind. Ceritakan kebutuhan perjalanan Anda. Saya bantu sampai langkah booking, dan untuk keputusan tertentu saya akan meneruskannya kepada admin.</div></div><div class="acs-chatbar"><textarea id="acs-chat-input" placeholder="Tulis pesan calon pelanggan…"></textarea><button class="acs-btn primary" id="acs-send">Kirim</button></div><div id="acs-chat-msg" class="acs-note" style="margin-top:7px"></div></div>
 </div>
 <div class="acs-card" style="margin-top:12px"><h3>🎯 Jalur menuju 50 booking / hari</h3><div class="acs-note">NEXUS sekarang memisahkan minat, mulai booking, dan booking berhasil. Bila CTA tinggi tetapi booking nol, AI tidak menutupi masalah dengan angka estimasi: sistem menunjukkan titik kebocoran yang harus diperbaiki.</div><div class="acs-grid" style="margin-top:10px"><div class="acs-card"><div class="acs-note">CTA → Start</div><div class="acs-value" id="acs-rate-start">—</div></div><div class="acs-card"><div class="acs-note">Start → Booking</div><div class="acs-value" id="acs-rate-book">—</div></div><div class="acs-card"><div class="acs-note">WhatsApp → Booking</div><div class="acs-value" id="acs-rate-wa">—</div></div><div class="acs-card"><div class="acs-note">Gap ke 50</div><div class="acs-value acs-warn" id="acs-gap50">—</div></div></div></div><div class="acs-card" style="margin-top:12px"><h3>🧑‍💼 Human Gate</h3><div class="acs-gate acs-note">AI tidak mengambil keputusan final untuk harga khusus/diskon, ketersediaan final, refund, komplain, perubahan atau pembatalan booking, kecelakaan/klaim, kontrak, legal, atau keputusan lain yang memerlukan kewenangan manusia. AI menyiapkan konteks dan membuat tugas admin.</div></div>
 <div class="acs-card" style="margin-top:12px"><h3>⏰ Tindakan Admin Sekarang</h3><div class="acs-note">Peluang yang sudah jatuh tempo ditampilkan di sini. AI menyiapkan pesan dan konteks; admin tetap melakukan keputusan dan pengiriman WhatsApp sampai provider outbound resmi diaktifkan.</div><div id="acs-due" class="acs-table" style="margin-top:10px"><div class="acs-note">Memuat antrean jatuh tempo…</div></div></div><div class="acs-card" style="margin-top:12px"><h3>📋 Opportunity & Follow-up Queue</h3><div class="acs-note">Lead yang belum booking tidak dibuang. Data yang memiliki izin komunikasi dapat menjadi dasar follow-up yang wajar, bukan spam. Provider WhatsApp eksternal belum dianggap aktif hanya karena antrean dibuat.</div><div class="acs-table" style="margin-top:10px"><div class="acs-row acs-head"><span>Calon pelanggan</span><span>Intent</span><span>Status</span><span>Follow-up berikutnya</span><span>Aksi</span></div><div id="acs-rows"><div class="acs-note" style="padding:15px">Memuat…</div></div></div></div>
 </div>`;
}
async function callAI(message,lead){
 const d=db();if(!d)throw new Error('Koneksi NEXUS belum siap.');
 const r=await d.functions.invoke('transmind-ai',{body:{message,session_id:sessionId(),path:'/nexus/ai-customer-service',referrer:location.href,lead,quote:true}});
 if(r.error)throw r.error;return r.data;
}
function addMsg(text,who){const box=document.getElementById('acs-messages');const div=document.createElement('div');div.className='acs-msg '+who;div.textContent=text;box.appendChild(div);box.scrollTop=box.scrollHeight}
async function sendChat(){
 const input=document.getElementById('acs-chat-input'),msg=document.getElementById('acs-chat-msg'),v=input.value.trim();if(!v)return;
 addMsg(v,'user');input.value='';msg.textContent='AI sedang membantu…';
 try{const r=await callAI(v,{});addMsg(r.answer||'Saya perlu meneruskan ini kepada admin Transmind.', 'ai');msg.textContent=r.human_required?'Perlu keputusan admin — konteks sudah disiapkan.':(r.lead?.captured?'Lead tertangkap dan follow-up dibuat.':'Percakapan tercatat.')}catch(e){addMsg('Maaf, saya sedang mengalami kendala. Admin Transmind dapat melanjutkan percakapan ini.','ai');msg.textContent=e.message}
}
async function submitLead(e){
 e.preventDefault();const msg=document.getElementById('acs-form-msg');msg.textContent='Menyimpan dan meminta AI menyiapkan langkah berikutnya…';
 const name=document.getElementById('acs-name').value.trim(),phone=document.getElementById('acs-phone').value.trim(),intent=document.getElementById('acs-intent').value,vehicle=document.getElementById('acs-vehicle').value.trim(),service=document.getElementById('acs-service').value,days=Number(document.getElementById('acs-days').value||1),date=document.getElementById('acs-date').value,area=document.getElementById('acs-area').value.trim(),custom=document.getElementById('acs-message').value.trim(),consent=document.getElementById('acs-consent').checked;
 if(!consent){msg.textContent='Follow-up tidak dapat dijadwalkan tanpa izin komunikasi.';return}
 const generated=custom||['Saya ingin booking','Saya ingin tanya harga','Saya ingin konsultasi','Saya sedang merencanakan perjalanan'][['booking','pricing','rental_consultation','travel_planning'].indexOf(intent)]||'Saya ingin konsultasi rental.';
 const memory=[];if(date)memory.push({type:'trip_date',value:date,consent:true});if(area)memory.push({type:'trip_area',value:area,consent:true});if(service)memory.push({type:'service_preference',value:service,consent:true});
 try{
  const r=await callAI(generated,{name,phone,vehicle_id:null,service,duration_days:days,quote:intent!=='rental_consultation',lead:{name,phone,consent:true,consent_status:'granted',memory}});
  document.getElementById('acs-form-msg').textContent=r.lead?.captured?'Lead tersimpan. AI sudah menyiapkan follow-up dan jalur WhatsApp.':'Data diterima, tetapi lead belum dapat dibuat otomatis. Periksa kembali nomor WhatsApp.';
  if(r.answer)addMsg(r.answer,'ai'); await renderData();
 }catch(err){msg.textContent='Gagal: '+err.message}
}
async function renderData(){
 const d=db();if(!d)return;
 const since=new Date(Date.now()-86400000).toISOString();
 const [ev,tasks,sigs,comms,due,bookingView]=await Promise.all([
  d.from('website_analytics_events').select('event_type,visitor_session_id,metadata,occurred_at').gte('occurred_at',since).limit(3000),
  d.from('crm_tasks').select('id,title,status,priority,next_followup_at,quote_value,metadata,created_at').in('status',['open','OPEN','IN_PROGRESS']).order('next_followup_at',{ascending:true}).limit(100),
  d.from('ai_companion_demand_signals').select('id,intent,tags,phone,customer_phone,metadata,created_at').gte('created_at',new Date(Date.now()-30*86400000).toISOString()).order('created_at',{ascending:false}).limit(100),
  d.from('nexus_communications').select('id,recipient,event_type,status,message_body,metadata,created_at').gte('created_at',new Date(Date.now()-30*86400000).toISOString()).order('created_at',{ascending:false}).limit(100),
  d.from('crm_tasks').select('id,title,status,priority,next_followup_at,quote_value,notes,metadata').eq('task_type','AI_CUSTOMER_CARE_FOLLOWUP').in('status',['open','OPEN','IN_PROGRESS']).lte('next_followup_at',new Date().toISOString()).order('next_followup_at',{ascending:true}).limit(30),
  d.from('nexus_console_booking_360').select('booking_code,status,created_at').gte('created_at',since).order('created_at',{ascending:false}).limit(200)
 ]);
 const all=[ev,tasks,sigs,comms,due,bookingView];const bad=all.find(x=>x.error);if(bad)throw bad.error;
 const rows=ev.data||[],count=t=>rows.filter(x=>x.event_type===t).length;
 document.getElementById('acs-cta').textContent=count('booking_cta_click');document.getElementById('acs-wa').textContent=count('whatsapp_click');document.getElementById('acs-start').textContent=count('booking_start');
 const bookingRows=rows.filter(x=>/^(booking_success|booking_created)$/.test(String(x.event_type||'')));const bookingKeys=new Set(bookingRows.map(x=>String(x.metadata?.booking_id||x.metadata?.booking_code||x.visitor_session_id+'|'+String(x.occurred_at||'').slice(0,16))));
 const persistedBookings=(bookingView.data||[]).filter(x=>!['Dibatalkan','CANCELLED','REFUND','CANCELLED'].includes(String(x.status||'').toUpperCase()));
 const booking=Math.max(bookingKeys.size,persistedBookings.length);document.getElementById('acs-book').textContent=booking;
 const phones=new Set((sigs.data||[]).map(x=>String(x.phone||x.customer_phone||x.metadata?.phone||'').replace(/\D/g,'')).filter(x=>x.length>=9));
 document.getElementById('acs-leads').textContent=phones.size;document.getElementById('acs-tasks').textContent=(tasks.data||[]).length;
 const rescue=(tasks.data||[]).filter(x=>/rescue|lead|customer care/i.test(String(x.title||'')+' '+String(x.metadata?.mode||''))).length;document.getElementById('acs-rescue').textContent=rescue;
 const starts=count('booking_start'),cta=count('booking_cta_click'),wa=count('whatsapp_click');const rate=(a,b)=>b?((a/b)*100).toFixed(1)+'%':'0.0%';document.getElementById('acs-rate-start').textContent=rate(starts,cta);document.getElementById('acs-rate-book').textContent=rate(booking,starts);document.getElementById('acs-rate-wa').textContent=rate(booking,wa);document.getElementById('acs-gap50').textContent=String(Math.max(0,50-booking));const health=(starts>0&&booking===0)?'CHECKOUT LEAK':((cta>0&&starts===0)?'FORM START GAP':'HEALTHY');document.getElementById('acs-health').textContent=health;document.getElementById('acs-health').className='acs-value '+(health==='HEALTHY'?'acs-ok':'acs-warn');
 const by=new Map();
 (sigs.data||[]).forEach(x=>{const p=String(x.phone||x.customer_phone||x.metadata?.phone||'').replace(/\D/g,'');if(!p)return;const r=by.get(p)||{phone:p,name:x.name||x.metadata?.lead_name||'Calon pelanggan',intent:x.intent||'consultation',at:x.created_at};r.intent=x.intent||r.intent;r.at=new Date(r.at)>new Date(x.created_at)?r.at:x.created_at;by.set(p,r)});
 (tasks.data||[]).forEach(x=>{const p=String(x.metadata?.phone||'').replace(/\D/g,'');if(!p)return;const r=by.get(p)||{phone:p,name:x.metadata?.lead_name||'Calon pelanggan',intent:'booking',at:x.created_at};r.name=r.name||x.metadata?.lead_name;r.task=x.title;r.next=x.next_followup_at;r.quote=x.quote_value;by.set(p,r)});
 const dueBox=document.getElementById('acs-due');const dueRows=due.data||[];if(dueBox){dueBox.innerHTML=dueRows.length?'<div class="acs-row acs-head"><span>Prioritas</span><span>Peluang</span><span>Jatuh tempo</span><span>Nilai</span><span>Aksi</span></div>'+dueRows.map(x=>'<div class="acs-row"><span class="acs-pill">'+esc(x.priority||'normal')+'</span><span><b>'+esc(x.title||'Follow-up calon pelanggan')+'</b><br><small>'+esc(x.notes||'')+'</small></span><span>'+esc(fmt(x.next_followup_at))+'</span><span>'+esc(x.quote_value??'—')+'</span><span><button class="acs-btn green acs-due-wa" data-phone="'+esc(x.metadata?.phone||'')+'">Buka WhatsApp</button></span></div>').join(''):'<div class="acs-note" style="padding:12px">Tidak ada follow-up yang jatuh tempo sekarang.</div>';dueBox.querySelectorAll('.acs-due-wa').forEach(b=>b.onclick=()=>{const p=String(b.dataset.phone||'').replace(/\D/g,'');if(p)window.open('https://wa.me/'+p,'_blank','noopener')})}
 const out=document.getElementById('acs-rows');const list=[...by.values()].slice(0,20);
 out.innerHTML=list.length?list.map(r=>'<div class="acs-row"><span><b>'+esc(r.name)+'</b><br><small>'+esc(r.phone)+'</small></span><span class="acs-pill">'+esc(r.intent)+'</span><span class="acs-pill">'+(r.task?'ADMIN FOLLOW-UP':'LEAD')+'</span><span>'+esc(fmt(r.next||r.at))+'</span><span><button class="acs-btn green acs-wa-open" data-phone="'+esc(r.phone)+'">WhatsApp</button></span></div>').join(''):'<div class="acs-note" style="padding:15px">Belum ada lead dengan nomor WhatsApp yang tertangkap. Gunakan form di atas untuk uji end-to-end.</div>';
 document.querySelectorAll('.acs-wa-open').forEach(b=>b.onclick=()=>window.open('https://wa.me/'+b.dataset.phone,'_blank','noopener'));
}
async function render(){
 const host=document.getElementById('content-ai-customer-service'),d=db();if(!host||host.dataset.mounted==='1'||!d)return;host.dataset.mounted='1';shell(host);
 document.getElementById('acs-lead-form').addEventListener('submit',submitLead);document.getElementById('acs-send').addEventListener('click',sendChat);document.getElementById('acs-chat-input').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendChat()}});document.getElementById('acs-refresh').addEventListener('click',renderData);
 try{await renderData()}catch(e){document.getElementById('acs-form-msg').textContent='Data belum dapat dimuat: '+e.message}
}
window.TRANSMIND_AI_CUSTOMER_SERVICE_CONSOLE={render};
document.addEventListener('tm-seo-refresh',()=>setTimeout(()=>{const h=document.getElementById('content-ai-customer-service');if(h?.dataset.mounted)renderData()},100));
let tries=0;const boot=()=>{if(document.getElementById('content-ai-customer-service'))render();else if(++tries<40)setTimeout(boot,500)};boot();
})();