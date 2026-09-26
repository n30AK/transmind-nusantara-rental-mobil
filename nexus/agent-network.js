/* TransMind Nexus — Agent Network Orchestrator
 * Operational control surface for demand -> care -> follow-up -> booking -> human handoff -> learning.
 * Uses real Nexus data only. No synthetic conversions and no unsolicited outbound messaging.
 */
(()=>{'use strict';
const db=()=>window.NXSB||window.getTransmindSupabaseClient?.()||window.transmindSupabase||null;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const css=`<style id="tm-agent-network-style">
.an-wrap{margin-top:8px}.an-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.an-card{background:linear-gradient(145deg,#171a21,#101319);border:1px solid #292f39;border-radius:16px;padding:16px}.an-card h3{margin:0 0 8px;font-size:14px}.an-k{font-size:25px;font-weight:900}.an-note{font-size:11px;color:#8e949f;line-height:1.55}.an-agents{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:12px}.an-agent{border:1px solid #292f39;background:#0e1116;border-radius:13px;padding:13px}.an-agent-head{display:flex;justify-content:space-between;gap:10px;align-items:center}.an-dot{display:inline-flex;align-items:center;gap:6px;font-size:10px;color:#65d49a}.an-dot:before{content:'●'}.an-flow{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}.an-step{padding:8px 10px;border:1px solid #343943;border-radius:999px;background:#0b0e13;font-size:10px}.an-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.an-btn{border:1px solid #343943;background:#0d1015;color:#e7e8eb;border-radius:9px;padding:9px 12px;cursor:pointer}.an-btn:hover{border-color:#68551d;color:#f0cf68}.an-btn.primary{background:#d2ad32;border-color:#d2ad32;color:#111;font-weight:850}.an-btn.danger{border-color:#663737;color:#f09a9a}.an-btn.ok{border-color:#2e5b47;color:#8be0b4}.an-table{overflow:auto}.an-row{display:grid;grid-template-columns:1.15fr .65fr 1.15fr 1fr;gap:10px;min-width:780px;padding:10px 4px;border-bottom:1px solid #252a31;font-size:11px;align-items:center}.an-head{color:#8e949f;text-transform:uppercase;letter-spacing:.7px;font-size:9px}.an-row-actions{display:flex;gap:5px;flex-wrap:wrap}.an-row-actions .an-btn{padding:6px 8px;font-size:10px}.an-form{display:grid;grid-template-columns:1fr 1fr;gap:10px}.an-field{display:grid;gap:5px}.an-field.full{grid-column:1/-1}.an-field label{font-size:10px;color:#bfc4cc}.an-field input,.an-field select,.an-field textarea{width:100%;background:#0b0e13;border:1px solid #363b45;color:#fff;border-radius:9px;padding:10px;outline:none}.an-field textarea{min-height:76px;resize:vertical}.an-modal{position:fixed;inset:0;background:#000b;display:none;align-items:center;justify-content:center;padding:18px;z-index:90}.an-modal.open{display:flex}.an-modal-card{width:min(720px,100%);max-height:92vh;overflow:auto;background:#101319;border:1px solid #303640;border-radius:18px;padding:20px;box-shadow:0 22px 70px #000b}.an-modal-head{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px}.an-status{font-size:11px;margin-top:8px;min-height:18px}.an-status.ok{color:#65d49a}.an-status.bad{color:#e87878}.an-status.warn{color:#e5c15a}.an-target{border:1px solid #3c3420;background:#17140b;color:#d9d1b0}.an-agent-tools{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
@media(max-width:900px){.an-grid{grid-template-columns:repeat(2,1fr)}.an-agents{grid-template-columns:1fr}.an-form{grid-template-columns:1fr}.an-field.full{grid-column:auto}}
@media(max-width:600px){.an-grid{grid-template-columns:1fr}.an-card{padding:14px}.an-actions .an-btn{flex:1;min-width:120px}.an-row{min-width:920px}}
</style>`;

async function q(p,f=[]){try{const r=await p;if(r?.error)throw r.error;return r?.data??f}catch(_){return f}}
function navTo(id){try{if(typeof window.showPage==='function'){window.showPage(id);return}const b=document.querySelector(`.submenu button[data-page="${CSS.escape(id)}"]`);b?.click()}catch(_){}}
function digits(v){return String(v||'').replace(/[^0-9]/g,'')}
function wa(phone){const p=digits(phone);if(!p)return;const normalized=p.startsWith('0')?'62'+p.slice(1):p;window.open('https://wa.me/'+normalized,'_blank','noopener')}
function fmt(v){return v?new Date(v).toLocaleString('id-ID'): '—'}
function notice(text,kind=''){const el=document.getElementById('an-msg');if(!el)return;el.className='an-status '+kind;el.textContent=text}
async function scheduleLead(d,lead,minutes=30,reason='AI follow-up'){
 const at=new Date(Date.now()+minutes*60000).toISOString();
 const message=lead.name?`Halo ${lead.name}, semoga harinya berjalan baik. Saya dari TransMind. Saya ingin memastikan kebutuhan perjalanan Anda masih kami bantu. Kalau Anda sudah siap, saya bisa bantu lanjutkan detail bookingnya.`:'Halo, semoga harinya berjalan baik. Kami dari TransMind siap membantu kebutuhan perjalanan Anda.';
 const up=await d.from('customer_care_leads').update({next_followup_at:at,last_activity_at:new Date().toISOString(),followup_stage:minutes<=30?'30m':'later'}).eq('id',lead.id);
 if(up.error)throw up.error;
 const ins=await d.from('customer_care_followup_queue').insert({lead_id:lead.id,stage:minutes<=30?'30m':'later',scheduled_at:at,channel:'whatsapp',message_body:message,status:'queued',requires_human:false,metadata:{created_from:'agent_network',reason}});
 if(ins.error)throw ins.error;
}
async function handoff(d,lead,reason){
 const up=await d.from('customer_care_leads').update({human_required:true,human_reason:reason||'Keputusan admin diperlukan',status:'paused',last_activity_at:new Date().toISOString(),next_followup_at:null}).eq('id',lead.id);
 if(up.error)throw up.error;
 const ins=await d.from('customer_care_followup_queue').insert({lead_id:lead.id,stage:'human',scheduled_at:new Date().toISOString(),channel:'whatsapp',message_body:'Admin perlu mengambil alih percakapan ini.',status:'admin_ready',requires_human:true,metadata:{created_from:'agent_network',human_reason:reason||'Keputusan admin diperlukan'}});
 if(ins.error)throw ins.error;
}
async function learn(d,lead,outcome){
 const r=await d.from('customer_care_learning').insert({lead_id:lead.id,signal_type:'agent_network_outcome',signal_value:{source:'agent_network',status:outcome},outcome,created_at:new Date().toISOString()});
 if(r.error)throw r.error;
}
async function createLead(d,form){
 const name=form.name.trim(),phone=form.phone.trim();
 if(!name||!phone)throw new Error('Nama dan WhatsApp wajib diisi.');
 const next=new Date(Date.now()+30*60000).toISOString();
 const ins=await d.from('customer_care_leads').insert({name,phone,consent_status:form.consent?'granted':'unknown',source:'agent_network',stage:'new',intent:form.intent||null,status:'open',human_required:false,last_activity_at:new Date().toISOString(),next_followup_at:next,followup_stage:'30m',metadata:{created_from:'agent_network',note:form.note||''}}).select('id,name,phone,status,stage,intent,human_required,human_reason,next_followup_at').single();
 if(ins.error)throw ins.error;
 const message=`Halo ${name}, terima kasih sudah menghubungi TransMind. Saya siap membantu kebutuhan perjalanan Anda. Kalau Anda berkenan, boleh saya bantu cek detail kendaraan, tanggal dan tujuan perjalanan Anda?`;
 const qins=await d.from('customer_care_followup_queue').insert({lead_id:ins.data.id,stage:'30m',scheduled_at:next,channel:'whatsapp',message_body:message,status:'queued',requires_human:false,metadata:{created_from:'agent_network',consent:form.consent}});
 if(qins.error)throw qins.error;
 return ins.data;
}
function leadForm(){
 return `<div class="an-card" style="margin-top:12px"><div class="hero" style="margin-bottom:10px"><div><h3>Tambah peluang baru</h3><div class="an-note">Dipakai admin untuk memasukkan calon pelanggan yang datang dari WhatsApp, telepon, partner, atau sumber lain. Sistem langsung membuat antrean follow-up, tanpa mengirim pesan otomatis.</div></div></div>
 <form id="an-lead-form" class="an-form">
  <div class="an-field"><label>Nama calon pelanggan *</label><input id="an-name" required placeholder="Nama"></div>
  <div class="an-field"><label>WhatsApp / telepon *</label><input id="an-phone" required placeholder="08xx / +62"></div>
  <div class="an-field"><label>Kebutuhan utama</label><select id="an-intent"><option value="">Pilih kebutuhan</option><option value="sewa mobil">Sewa mobil</option><option value="dengan driver">Dengan driver</option><option value="lepas kunci">Lepas kunci</option><option value="corporate">Corporate</option><option value="wisata">Wisata</option><option value="wedding">Wedding</option><option value="lainnya">Lainnya</option></select></div>
  <div class="an-field"><label>Persetujuan follow-up</label><select id="an-consent"><option value="yes">Ya, diizinkan</option><option value="unknown">Belum diketahui</option></select></div>
  <div class="an-field full"><label>Catatan konteks</label><textarea id="an-note" placeholder="Tanggal, area, kendaraan, keberatan, atau konteks percakapan..."></textarea></div>
  <div class="an-actions form-full"><button class="an-btn primary" type="submit">＋ Simpan & jadwalkan follow-up</button><button class="an-btn" type="button" id="an-clear-form">Bersihkan</button></div>
 </form></div>`;
}
async function render(){
 const host=document.getElementById('agent-network-page');if(!host)return;
 const d=db();if(!d){host.innerHTML=css+'<div class="an-card"><h3>Agent Network</h3><div class="an-note">Backend NEXUS belum terhubung.</div></div>';return}
 const since=new Date(Date.now()-86400000).toISOString();
 const [ev,leads,queue,tasks,learning,bookings]=await Promise.all([
  q(d.from('website_analytics_events').select('event_type,visitor_session_id').gte('occurred_at',since).limit(1000)),
  q(d.from('customer_care_leads').select('id,name,phone,status,stage,intent,human_required,human_reason,next_followup_at').in('status',['open','paused']).order('next_followup_at',{ascending:true}).limit(100)),
  q(d.from('customer_care_followup_queue').select('id,lead_id,stage,scheduled_at,status,requires_human').in('status',['queued','admin_ready']).order('scheduled_at',{ascending:true}).limit(100)),
  q(d.from('crm_tasks').select('id,title,status,priority,next_followup_at,task_type,metadata').in('status',['open','OPEN','IN_PROGRESS']).limit(100)),
  q(d.from('customer_care_learning').select('id,signal_type,outcome,created_at').gte('created_at',since).order('created_at',{ascending:false}).limit(100)),
  q(d.from('bookings').select('id,status,created_at').gte('created_at',since).limit(1000))
 ]);
 const count=t=>ev.filter(x=>x.event_type===t).length;
 const vis=new Set(ev.map(x=>x.visitor_session_id).filter(Boolean)).size;
 const valid=x=>!['cancelled','canceled','dibatalkan','refund','refunded'].includes(String(x.status||'').toLowerCase());
 const book=bookings.filter(valid).length,cta=count('booking_cta_click'),waCount=count('whatsapp_click'),start=count('booking_start');
 const due=queue.filter(x=>new Date(x.scheduled_at||0)<=new Date()).length,human=leads.filter(x=>x.human_required).length,gap=Math.max(0,50-book);
 const agents=[
  ['Demand Agent','Membaca visitor, CTA, WhatsApp dan titik kebocoran demand.',vis+' visitor','seo-live'],
  ['Customer Care Agent','Menjaga konteks percakapan dan mengarahkan calon pelanggan ke langkah berikutnya.',leads.length+' lead aktif','ai-customer-service'],
  ['Booking Rescue Agent','Mengejar peluang CTA/start yang belum menjadi booking tanpa membuat booking palsu.',Math.max(0,cta-book)+' peluang','booking-pending'],
  ['CRM Follow-up Agent','Menjaga pekerjaan follow-up dan memastikan peluang tidak hilang.',tasks.length+' task','crm-followup'],
  ['Human Gate Agent','Menghentikan AI ketika keputusan membutuhkan otorisasi admin.',human+' handoff','crm-followup'],
  ['Relationship Care Agent','Menjaga hubungan dengan lead yang belum jadi, sesuai consent.',queue.length+' antrean','crm-followup'],
  ['Learning Agent','Mengubah outcome nyata menjadi sinyal pembelajaran.',learning.length+' sinyal','ai-customer-service'],
  ['Revenue Agent','Menghubungkan booking nyata dengan target operasional 50/hari.',gap+' gap target','sales-conversion']
 ];
 host.innerHTML=css+`<div class="an-wrap">
 <div class="hero"><div><div class="eyebrow">AGENT NETWORK</div><div class="title">TransMind AI Agent Network</div><div class="desc">Jaringan kerja yang menjaga setiap peluang: mengenali demand, membantu percakapan, menjadwalkan follow-up, menyelamatkan booking, menyerahkan keputusan ke admin, lalu belajar dari hasil nyata.</div></div><div class="hero-actions"><button class="an-btn" id="an-refresh">↻ Refresh</button><button class="an-btn primary" id="an-run">▶ Jalankan siklus</button></div></div>
 <div class="an-grid">
  <div class="an-card"><div class="an-note">Visitor 24 jam</div><div class="an-k">${vis}</div><div class="an-note">${cta} booking CTA · ${waCount} WhatsApp</div></div>
  <div class="an-card"><div class="an-note">Booking nyata 24 jam</div><div class="an-k">${book}</div><div class="an-note">${start} memulai booking · tidak menghitung CTA sebagai booking</div></div>
  <div class="an-card an-target"><div class="an-note">Target booking harian</div><div class="an-k">${book} / 50</div><div class="an-note">Masih perlu ${gap} booking untuk mencapai target harian</div></div>
  <div class="an-card"><div class="an-note">Handoff manusia</div><div class="an-k">${human}</div><div class="an-note">${due} follow-up sudah jatuh tempo</div></div>
 </div>
 <div class="an-card" style="margin-top:12px"><div class="hero" style="margin-bottom:8px"><div><h3>Kontrol cepat</h3><div class="an-note">Masuk langsung ke pekerjaan yang perlu dikerjakan admin.</div></div></div><div class="an-actions">
  <button class="an-btn primary" data-nav="booking-new">＋ Buat Booking</button><button class="an-btn" data-nav="crm-followup">📌 Follow-up</button><button class="an-btn" data-nav="crm-lead">👤 Lead</button><button class="an-btn" data-nav="crm-360">Customer 360</button><button class="an-btn" data-nav="sales-conversion">Conversion</button><button class="an-btn" data-nav="seo-live">SEO & Demand</button>
 </div></div>
 ${leadForm()}
 <div class="an-card" style="margin-top:12px"><h3>Jalur kerja Agent Network</h3><div class="an-flow">${agents.map((a,i)=>'<span class="an-step">'+(i+1)+' · '+esc(a[0])+'</span>').join('')}</div><div class="an-note" style="margin-top:9px">Data yang tampil berasal dari event, lead, antrean follow-up, task, learning dan booking nyata. Tidak ada booking, traffic, ranking, atau respons yang dibuat-buat.</div></div>
 <div class="an-agents">${agents.map(a=>'<div class="an-agent"><div class="an-agent-head"><b>'+esc(a[0])+'</b><span class="an-dot">ACTIVE</span></div><div class="an-note" style="margin-top:7px">'+esc(a[1])+'</div><div class="an-note" style="margin-top:8px"><b>'+esc(a[2])+'</b></div><div class="an-agent-tools"><button class="an-btn" data-nav="'+esc(a[3])+'">Buka workspace</button></div></div>').join('')}</div>
 <div class="an-card" style="margin-top:12px"><h3>Human Gate</h3><div class="an-note">AI membantu informasi yang sudah disetujui. AI menyerahkan percakapan kepada admin untuk harga khusus, ketersediaan final, refund, komplain, perubahan/pembatalan booking, kecelakaan/klaim, kontrak, legal, atau keputusan lain yang memerlukan otorisasi.</div></div>
 <div class="an-card" style="margin-top:12px"><div class="hero" style="margin-bottom:8px"><div><h3>Antrean peluang & tindakan</h3><div class="an-note">Setiap baris memiliki tindakan langsung; tidak perlu kembali ke menu lain untuk menyelamatkan peluang.</div></div></div><div class="an-table"><div class="an-row an-head"><span>Peluang</span><span>Status</span><span>Next action</span><span>Waktu / action</span></div>${leads.slice(0,30).map(x=>'<div class="an-row"><span><b>'+esc(x.name||'Calon pelanggan')+'</b><br><small>'+esc(x.phone||'')+' · '+esc(x.intent||'kebutuhan belum dicatat')+'</small></span><span>'+esc(x.human_required?'HUMAN GATE':(x.stage||x.status||'open'))+'</span><span>'+esc(x.human_required?('Admin: '+(x.human_reason||'keputusan diperlukan')):'AI follow-up / booking rescue')+'</span><span><div>'+esc(fmt(x.next_followup_at))+'</div><div class="an-row-actions" data-lead-id="'+esc(x.id)+'"><button class="an-btn" data-action="wa">WhatsApp</button><button class="an-btn" data-action="followup">＋30m</button><button class="an-btn danger" data-action="handoff">Admin</button><button class="an-btn ok" data-action="booked">Booked</button></div></span></div>').join('')||'<div class="an-note" style="padding:12px">Belum ada lead terbuka. Gunakan form di atas untuk memasukkan peluang yang datang dari luar website.</div>'}</div></div>
 <div class="an-card" style="margin-top:12px"><h3>Learning Loop</h3><div class="an-note">Outcome “booking”, “belum jadi”, “stop”, respons dan hasil follow-up menjadi sinyal untuk memperbaiki strategi percakapan dan timing. Data yang membutuhkan consent tidak digunakan di luar tujuan pelayanan yang disetujui.</div><div id="an-msg" class="an-status"></div></div>
 </div>
 <div id="an-modal" class="an-modal" aria-hidden="true"><div class="an-modal-card"><div class="an-modal-head"><div><h3 style="margin:0">Tindakan Agent Network</h3><div class="an-note">Selesaikan pekerjaan tanpa meninggalkan workspace.</div></div><button class="an-btn" id="an-modal-close">Tutup</button></div><div id="an-modal-body"></div></div></div>`;
 const byId=new Map(leads.map(x=>[x.id,x]));
 document.querySelectorAll('[data-nav]').forEach(b=>b.addEventListener('click',()=>navTo(b.dataset.nav)));
 document.getElementById('an-refresh')?.addEventListener('click',render);
 document.getElementById('an-run')?.addEventListener('click',async()=>{notice('Menjalankan siklus follow-up…','warn');try{const r=await d.rpc('process_customer_care_followups');if(r.error)throw r.error;notice('Siklus selesai. '+(r.data||0)+' peluang jatuh tempo diproses ke antrean.','ok');setTimeout(render,700)}catch(e){notice('Siklus belum dapat dijalankan: '+e.message,'bad')}});
 document.getElementById('an-lead-form')?.addEventListener('submit',async e=>{e.preventDefault();const f={name:document.getElementById('an-name').value,phone:document.getElementById('an-phone').value,intent:document.getElementById('an-intent').value,consent:document.getElementById('an-consent').value==='yes',note:document.getElementById('an-note').value};const btn=e.submitter;btn.disabled=true;btn.textContent='Menyimpan…';try{await createLead(d,f);notice('Lead tersimpan. Follow-up pertama sudah dijadwalkan 30 menit; belum ada pesan yang dikirim otomatis.','ok');e.target.reset();setTimeout(render,600)}catch(err){notice('Lead belum tersimpan: '+err.message,'bad')}finally{btn.disabled=false;btn.textContent='＋ Simpan & jadwalkan follow-up'}});
 document.getElementById('an-clear-form')?.addEventListener('click',()=>document.getElementById('an-lead-form')?.reset());
 const modal=document.getElementById('an-modal'),body=document.getElementById('an-modal-body');
 document.getElementById('an-modal-close')?.addEventListener('click',()=>{modal.classList.remove('open');modal.setAttribute('aria-hidden','true')});
 document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('click',async()=>{const wrap=b.closest('[data-lead-id]'),lead=byId.get(wrap?.dataset.leadId);if(!lead)return;const action=b.dataset.action;try{
   if(action==='wa'){wa(lead.phone);notice('WhatsApp dibuka. Gunakan konteks lead di Nexus untuk melanjutkan percakapan.','ok');return}
   if(action==='followup'){await scheduleLead(d,lead,30,'manual_agent_network');notice('Follow-up +30 menit dijadwalkan. Tidak ada pesan otomatis yang dikirim.','ok');setTimeout(render,600);return}
   if(action==='handoff'){await handoff(d,lead,'Admin perlu mengambil keputusan atau memberi jawaban yang tidak boleh dibuat AI.');notice('Lead dipindahkan ke Human Gate dan masuk antrean admin.','ok');setTimeout(render,600);return}
   if(action==='booked'){await d.from('customer_care_leads').update({status:'booked',stage:'booked',human_required:false,next_followup_at:null,last_activity_at:new Date().toISOString()}).eq('id',lead.id);await learn(d,lead,'booked');notice('Lead ditandai BOOKED dan dicatat ke learning loop. Pastikan booking nyata sudah tercatat di modul Booking.','ok');setTimeout(render,600);return}
 }catch(err){notice('Tindakan gagal: '+err.message,'bad')} }));
}
function mount(){const n=document.getElementById('nav');if(!n)return;let sec=[...n.querySelectorAll('.nav-section')].find(x=>/AI Intelligence/i.test(x.textContent));if(!sec)return;let sub=sec.querySelector('.submenu');if(!sub||sub.querySelector('[data-page="agent-network"]'))return;const b=document.createElement('button');b.dataset.page='agent-network';b.textContent='Agent Network';sub.appendChild(b);b.addEventListener('click',()=>{document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));document.getElementById('agent-network-page').classList.add('active');document.querySelectorAll('.submenu button').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.getElementById('breadcrumb').textContent='AI Intelligence / Agent Network';render();setMobileNav?.(false)});}
function boot(){if(!window.NXSB){setTimeout(boot,500);return}mount();if(!document.getElementById('agent-network-page')){const p=document.createElement('section');p.id='agent-network-page';p.className='page';document.getElementById('pages')?.appendChild(p)}}
window.TRANSMIND_AGENT_NETWORK={render,boot};window.addEventListener('load',()=>setTimeout(boot,700));
})();