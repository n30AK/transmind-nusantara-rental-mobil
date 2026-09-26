/* TransMind Nexus — Agent Network Orchestrator
 * Unifies demand, customer care, booking rescue, CRM follow-up, human gate,
 * relationship care and learning into one operational network.
 * No synthetic conversions and no unsolicited outbound messaging.
 */
(()=>{'use strict';
const db=()=>window.NXSB||window.getTransmindSupabaseClient?.()||window.transmindSupabase||null;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const css=`<style id="tm-agent-network-style">
.an-wrap{margin-top:8px}.an-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.an-card{background:linear-gradient(145deg,#171a21,#101319);border:1px solid #292f39;border-radius:16px;padding:16px}.an-card h3{margin:0 0 8px;font-size:14px}.an-k{font-size:25px;font-weight:900}.an-note{font-size:11px;color:#8e949f;line-height:1.55}.an-agents{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:12px}.an-agent{border:1px solid #292f39;background:#0e1116;border-radius:13px;padding:13px}.an-agent-head{display:flex;justify-content:space-between;gap:10px}.an-dot{display:inline-flex;align-items:center;gap:6px;font-size:10px;color:#65d49a}.an-dot:before{content:'●'}.an-flow{display:flex;gap:7px;flex-wrap:wrap;margin-top:12px}.an-step{padding:8px 10px;border:1px solid #343943;border-radius:999px;background:#0b0e13;font-size:10px}.an-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}.an-btn{border:1px solid #343943;background:#0d1015;color:#e7e8eb;border-radius:9px;padding:9px 12px;cursor:pointer}.an-btn.primary{background:#d2ad32;border-color:#d2ad32;color:#111;font-weight:850}.an-table{overflow:auto}.an-row{display:grid;grid-template-columns:1.2fr .7fr 1fr 1.2fr;gap:10px;min-width:700px;padding:10px 4px;border-bottom:1px solid #252a31;font-size:11px}.an-head{color:#8e949f;text-transform:uppercase;letter-spacing:.7px;font-size:9px}
@media(max-width:900px){.an-grid{grid-template-columns:repeat(2,1fr)}.an-agents{grid-template-columns:1fr}}@media(max-width:600px){.an-grid{grid-template-columns:1fr}}
</style>`;
async function q(p,f=[]){try{const r=await p;if(r?.error)throw r.error;return r?.data??f}catch(_){return f}}
async function render(){
 const host=document.getElementById('seoBody')||document.querySelector('#agent-network-page');if(!host)return;
 if(host.id!=='agent-network-page'){let p=document.getElementById('agent-network-page');if(!p){p=document.createElement('section');p.id='agent-network-page';p.className='page';document.getElementById('pages')?.appendChild(p)}host=p}
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
 const count=t=>ev.filter(x=>x.event_type===t).length,vis=new Set(ev.map(x=>x.visitor_session_id).filter(Boolean)).size;
 const valid=x=>!['cancelled','canceled','dibatalkan','refund','refunded'].includes(String(x.status||'').toLowerCase());
 const book=bookings.filter(valid).length,cta=count('booking_cta_click'),wa=count('whatsapp_click'),start=count('booking_start');
 const due=queue.filter(x=>new Date(x.scheduled_at||0)<=new Date()).length,human=leads.filter(x=>x.human_required).length,gap=Math.max(0,50-book);
 const agents=[
 ['Demand Agent','Membaca visitor, CTA, WhatsApp dan titik kebocoran demand.',vis+' visitor'],
 ['Customer Care Agent','Menjaga konteks percakapan dan mengarahkan ke langkah booking.',leads.length+' lead aktif'],
 ['Booking Rescue Agent','Menangani peluang CTA/start yang belum menjadi booking.',Math.max(0,cta-book)+' peluang'],
 ['CRM Follow-up Agent','Membuat dan menjaga pekerjaan follow-up yang jatuh tempo.',tasks.length+' task'],
 ['Human Gate Agent','Menghentikan AI pada keputusan yang wajib ditangani manusia.',human+' handoff'],
 ['Relationship Care Agent','Menjaga hubungan setelah lead belum jadi, sesuai consent.',queue.length+' antrean'],
 ['Learning Agent','Mengubah outcome nyata menjadi sinyal pembelajaran.',learning.length+' sinyal'],
 ['Revenue Agent','Menghubungkan booking nyata dengan target 50/hari.',gap+' gap target']
 ];
 host.innerHTML=css+`<div class="an-wrap">
 <div class="hero"><div><div class="eyebrow">AGENT NETWORK</div><div class="title">TransMind AI Agent Network</div><div class="desc">Satu jaringan kerja untuk mengubah demand nyata menjadi percakapan, follow-up, booking, handoff manusia, dan pembelajaran berkelanjutan.</div></div><div class="hero-actions"><button class="an-btn" id="an-refresh">↻ Refresh</button><button class="an-btn primary" id="an-run">▶ Jalankan siklus</button></div></div>
 <div class="an-grid">
  <div class="an-card"><div class="an-note">Visitor 24 jam</div><div class="an-k">${vis}</div></div>
  <div class="an-card"><div class="an-note">CTA → Booking</div><div class="an-k">${book}</div><div class="an-note">${cta} CTA · ${start} mulai booking · ${wa} WhatsApp</div></div>
  <div class="an-card"><div class="an-note">Booking / Target</div><div class="an-k">${book} / 50</div><div class="an-note">gap ${gap}</div></div>
  <div class="an-card"><div class="an-note">Handoff manusia</div><div class="an-k">${human}</div><div class="an-note">keputusan yang tidak boleh dijawab AI</div></div>
 </div>
 <div class="an-card" style="margin-top:12px"><h3>Jalur kerja Agent Network</h3><div class="an-flow">${agents.map((a,i)=>'<span class="an-step">'+(i+1)+' · '+esc(a[0])+'</span>').join('')}</div><div class="an-note" style="margin-top:9px">Setiap agent memakai data nyata yang tersedia. Tidak ada booking, ranking, traffic, atau respons yang dibuat-buat.</div></div>
 <div class="an-agents">${agents.map(a=>'<div class="an-agent"><div class="an-agent-head"><b>'+esc(a[0])+'</b><span class="an-dot">ACTIVE</span></div><div class="an-note" style="margin-top:7px">'+esc(a[1])+'</div><div class="an-note" style="margin-top:8px"><b>'+esc(a[2])+'</b></div></div>').join('')}</div>
 <div class="an-card" style="margin-top:12px"><h3>Human Gate</h3><div class="an-note">AI boleh membantu informasi dan proses yang sudah disetujui. AI wajib menyerahkan percakapan kepada admin untuk harga khusus, ketersediaan final, refund, komplain, perubahan/pembatalan booking, kecelakaan/klaim, kontrak, legal, atau keputusan lain yang memerlukan otorisasi.</div></div>
 <div class="an-card" style="margin-top:12px"><h3>Antrean yang membutuhkan tindakan</h3><div class="an-table"><div class="an-row an-head"><span>Peluang</span><span>Status</span><span>Next action</span><span>Waktu</span></div>${leads.slice(0,20).map(x=>'<div class="an-row"><span><b>'+esc(x.name||'Calon pelanggan')+'</b><br><small>'+esc(x.phone||'')+'</small></span><span>'+esc(x.stage||x.status||'open')+'</span><span>'+esc(x.human_required?('Admin: '+(x.human_reason||'keputusan diperlukan')):'AI follow-up / booking rescue')+'</span><span>'+esc(x.next_followup_at?new Date(x.next_followup_at).toLocaleString('id-ID'):'Segera')+'</span></div>').join('')||'<div class="an-note" style="padding:12px">Belum ada lead terbuka.</div>'}</div></div>
 <div class="an-card" style="margin-top:12px"><h3>Learning Loop</h3><div class="an-note">Outcome “booking”, “belum jadi”, “stop”, respons, dan hasil follow-up menjadi sinyal. Data yang memerlukan consent tidak digunakan di luar tujuan pelayanan yang disetujui.</div><div id="an-msg" class="an-note" style="margin-top:8px"></div></div>
 </div>`;
 document.getElementById('an-refresh')?.addEventListener('click',render);
 document.getElementById('an-run')?.addEventListener('click',async()=>{const m=document.getElementById('an-msg');m.textContent='Menjalankan siklus follow-up…';try{const r=await d.rpc('process_customer_care_followups');if(r.error)throw r.error;m.textContent='Siklus selesai. '+(r.data||0)+' peluang jatuh tempo diteruskan ke antrean admin.';setTimeout(render,500)}catch(e){m.textContent='Siklus belum dapat dijalankan: '+e.message}});
}
function mount(){const n=document.getElementById('nav');if(!n)return;let sec=[...n.querySelectorAll('.nav-section')].find(x=>/AI Intelligence/i.test(x.textContent));if(!sec)return;let sub=sec.querySelector('.submenu');if(!sub||sub.querySelector('[data-page="agent-network"]'))return;const b=document.createElement('button');b.dataset.page='agent-network';b.textContent='Agent Network';sub.appendChild(b);b.addEventListener('click',()=>{document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));document.getElementById('agent-network-page').classList.add('active');document.querySelectorAll('.submenu button').forEach(x=>x.classList.remove('active'));b.classList.add('active');document.getElementById('breadcrumb').textContent='AI Intelligence / Agent Network';render()});}
function boot(){if(!window.NXSB){setTimeout(boot,500);return}mount();if(!document.getElementById('agent-network-page')){const p=document.createElement('section');p.id='agent-network-page';p.className='page';document.getElementById('pages')?.appendChild(p)}}
window.TRANSMIND_AGENT_NETWORK={render,boot};window.addEventListener('load',()=>setTimeout(boot,700));
})();