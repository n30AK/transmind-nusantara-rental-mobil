/* TRANSMIND NEXUS — AI CUSTOMER CARE + BOOKING RESCUE
   Purpose: convert measured demand into human-feeling follow-up, protect admin decisions,
   and build consent-aware relationship memory. No bulk spam, no fabricated facts.
*/
(function(){
'use strict';
const css='<style id="tm-care-style">#seoBody .care{margin-top:14px}.care-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.care-card{background:linear-gradient(145deg,#171a21,#101319);border:1px solid #292f39;border-radius:15px;padding:16px}.care-card h3{margin:0 0 10px;font-size:14px}.care-n{color:#8e949f;font-size:11px;line-height:1.55}.care-v{font-size:25px;font-weight:900;margin:5px 0}.care-row{display:grid;grid-template-columns:1.1fr .7fr 1.8fr .9fr;gap:10px;padding:10px 4px;border-bottom:1px solid #252a31;font-size:11px;align-items:center}.care-pill{display:inline-block;width:max-content;padding:4px 8px;border:1px solid #343943;border-radius:999px;font-size:9px}.care-actions{display:flex;gap:8px;flex-wrap:wrap}.care-actions button{border:1px solid #343943;background:#0d1015;color:#e7e8eb;border-radius:9px;padding:9px 11px;font-size:11px;cursor:pointer}.care-actions .primary{background:#d2ad32;color:#111;border-color:#d2ad32;font-weight:800}.care-ok{color:#65d49a}.care-warn{color:#e5c15a}.care-bad{color:#e87878}@media(max-width:1000px){.care-grid{grid-template-columns:repeat(2,1fr)}.care-row{min-width:760px}.care-card{overflow:auto}}@media(max-width:650px){.care-grid{grid-template-columns:1fr}}</style>';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const client=()=>window.getTransmindSupabaseClient?window.getTransmindSupabaseClient():null;
const cut=d=>new Date(Date.now()-d*86400000).toISOString();
const normPhone=v=>String(v||'').replace(/[^0-9]/g,'');
const daysAgo=d=>Math.max(1,Math.round((Date.now()-new Date(d).getTime())/86400000));
const human=(n)=>new Intl.NumberFormat('id-ID').format(Number(n||0));
function safeName(row){return String(row?.name||row?.customer_name||row?.metadata?.lead_name||'Calon pelanggan').trim();}
function makeMessage(row,mode){
 const name=safeName(row),first=name.split(/\s+/)[0]||'Bapak/Ibu';
 if(mode==='rescue')return 'Halo '+first+', semoga harinya berjalan lancar 😊 Saya dari Transmind. Kemarin Anda sempat melihat/menanyakan layanan kami. Kalau rencananya masih berjalan, saya siap bantu cek kendaraan dan waktunya. Tidak perlu buru-buru, kabari saya kalau sudah siap.';
 if(mode==='booked')return 'Halo '+first+', semoga kabarnya baik 😊 Transmind hanya ingin menyapa. Semoga semua aktivitas dan perjalanan Anda hari ini lancar. Kalau suatu saat membutuhkan kendaraan lagi, kami siap membantu.';
 return 'Halo '+first+', selamat pagi 😊 Semoga hari ini dimudahkan dan dilancarkan segala urusannya. Saya dari Transmind, hanya ingin menyapa. Kalau ada kebutuhan perjalanan kapan pun, silakan kabari kami.';
}
function shouldFollow(row,mode){
 const consent=row?.metadata?.followup_consent!==false && row?.metadata?.whatsapp_opt_in!==false;
 if(!consent)return false;
 const last=row?.metadata?.last_relationship_touch_at||row?.last_seen_at||row?.occurred_at||row?.created_at;
 const gap=mode==='rescue'?2:3;
 return !last||daysAgo(last)>=gap;
}
async function fetchRows(db){
 const out={signals:[],tasks:[],comms:[],events:[]};
 const [s,t,c,e]=await Promise.all([
  db.from('ai_companion_demand_signals').select('*').gte('created_at',cut(30)).order('created_at',{ascending:false}).limit(300),
  db.from('crm_tasks').select('*').gte('created_at',cut(30)).order('created_at',{ascending:false}).limit(300),
  db.from('nexus_communications').select('*').gte('created_at',cut(30)).order('created_at',{ascending:false}).limit(500),
  db.from('website_analytics_events').select('event_type,session_id,metadata,occurred_at,path').gte('occurred_at',cut(30)).order('occurred_at',{ascending:false}).limit(5000)
 ]);
 if(s.error)throw s.error;if(t.error)throw t.error;if(c.error)throw c.error;if(e.error)throw e.error;
 out.signals=s.data||[];out.tasks=t.data||[];out.comms=c.data||[];out.events=e.data||[];return out;
}
function metrics(d){
 const types={};d.events.forEach(x=>types[x.event_type]=(types[x.event_type]||0)+1);
 const wa=Number(types.whatsapp_click||types.whatsapp_cta_click||0);
 const cta=Number(types.booking_cta_click||types.booking_click||0);
 const measuredBooking=Number(types.booking_confirmed||types.booking_created||types.booking_submitted||types.booking_success||0);
 const rescueSignals=d.signals.filter(x=>['booking','pricing','rental_consultation','travel_planning'].includes(String(x.intent||''))).length;
 const queued=d.comms.filter(x=>['queued','pending','awaiting_provider'].includes(String(x.status||''))).length;
 const sent=d.comms.filter(x=>String(x.direction)==='outbound'&&['sent','delivered','read'].includes(String(x.status||''))).length;
 return {wa,cta,measuredBooking,rescueSignals,queued,sent,types};
}
function uniqueCandidates(d){
 const by=new Map();
 d.signals.forEach(s=>{
  const phone=normPhone(s.phone||s.customer_phone||s.metadata?.phone||'');
  const key=phone||String(s.session_id||s.id);
  if(!key)return;
  const old=by.get(key)||{...s,signals:0,phone};
  old.signals++;old.latest=Math.max(new Date(old.latest||0).getTime(),new Date(s.created_at||0).getTime())?new Date(Math.max(new Date(old.latest||0).getTime(),new Date(s.created_at||0).getTime())).toISOString():old.latest;
  old.tags=[...new Set([...(old.tags||[]),...(s.tags||[])])];
  by.set(key,old);
 });
 return [...by.values()];
}
async function queueFollowups(db,candidates,mode){
 let created=0,skipped=0;
 for(const row of candidates.slice(0,20)){
  const phone=normPhone(row.phone||row.customer_phone||row.metadata?.phone);
  if(!phone||!shouldFollow(row,mode)){skipped++;continue;}
  const exists=(await db.from('nexus_communications').select('id').eq('recipient',phone).eq('event_type',mode==='rescue'?'AI_BOOKING_RESCUE':'AI_RELATIONSHIP_CARE').gte('created_at',cut(7)).limit(1)).data||[];
  if(exists.length){skipped++;continue;}
  const body=makeMessage(row,mode);
  const cid=row.customer_id||row.metadata?.customer_id||null;
  const ins=await db.from('nexus_communications').insert({customer_id:cid,channel:'whatsapp',direction:'outbound',event_type:mode==='rescue'?'AI_BOOKING_RESCUE':'AI_RELATIONSHIP_CARE',recipient:phone,message_template:mode==='rescue'?'ai_booking_rescue':'ai_relationship_care',message_body:body,provider:'pending_whatsapp_provider',status:'queued',metadata:{followup_mode:mode,consent_checked:true,created_by:'nexus_ai_customer_care',next_review_at:new Date(Date.now()+3*86400000).toISOString()}});
  if(ins.error)throw ins.error;
  if(cid)await db.from('crm_tasks').insert({customer_id:cid,task_type:mode==='rescue'?'AI_BOOKING_RESCUE':'AI_RELATIONSHIP_CARE',priority:mode==='rescue'?'high':'normal',status:'open',title:mode==='rescue'?'Peluang booking dari AI Customer Care':'Relationship care dari AI Customer Care',notes:body,pipeline_stage:mode==='rescue'?'qualified_lead':'customer_care',next_followup_at:new Date(Date.now()+3*86400000).toISOString(),metadata:{source:'nexus_ai_customer_care',mode,phone}});
  created++;
 }
 return {created,skipped};
}
async function render(){
 const el=document.getElementById('seoBody'),db=client();if(!el||!db||el.dataset.care==='1')return;el.dataset.care='1';
 try{
  const d=await fetchRows(db),m=metrics(d),candidates=uniqueCandidates(d);
  const rescue=candidates.filter(x=>x.phone&&String(x.intent||'')!=='').slice(0,8);
  el.insertAdjacentHTML('beforeend',css+'<div class="care"><div class="care-card"><h3>🤝 AI Customer Care — Booking Growth Loop</h3><div class="care-n">AI tidak sekadar menjawab. Ia membaca sinyal percakapan, mengingat konteks yang memang dibutuhkan untuk pelayanan, menyusun follow-up yang hangat, memberi sinyal kepada admin saat keputusan diperlukan, dan mengembalikan komunikasi kepada manusia untuk kasus yang tidak boleh diputuskan AI.</div></div><div class="care-grid" style="margin-top:12px"><div class="care-card"><div class="care-n">Target booking / hari</div><div class="care-v">50</div><div class="care-n">target operasional Nexus</div></div><div class="care-card"><div class="care-n">Booking terukur 30 hari</div><div class="care-v '+(m.measuredBooking?'care-ok':'care-warn')+'">'+human(m.measuredBooking)+'</div><div class="care-n">event booking yang benar-benar tercatat</div></div><div class="care-card"><div class="care-n">Opportunity signals</div><div class="care-v care-blue">'+human(m.rescueSignals)+'</div><div class="care-n">AI / pricing / booking intent</div></div><div class="care-card"><div class="care-n">Follow-up queue</div><div class="care-v">'+human(m.queued)+'</div><div class="care-n">menunggu provider WhatsApp</div></div></div><div class="care-card" style="margin-top:12px"><h3>🎯 Booking 50/hari — jalur yang kita ukur</h3><div class="care-n">Visitor → CTA → WhatsApp / AI → follow-up → admin bila perlu → booking → repeat booking. Angka 0 pada kartu Booking tidak akan lagi dianggap sebagai “tidak ada pelanggan” tanpa memeriksa apakah booking memang tercatat atau hanya tracking-nya yang putus.</div><div class="care-row" style="margin-top:10px"><b>Signal</b><b>Jumlah</b><b>Makna</b><b>Status</b></div><div class="care-row"><span>Visitor</span><b>'+human(m.types.visitor||0)+'</b><span>Traffic yang tercatat</span><span class="care-pill">OBSERVED</span></div><div class="care-row"><span>Booking CTA</span><b>'+human(m.cta)+'</b><span>Minat untuk masuk alur booking</span><span class="care-pill">OBSERVED</span></div><div class="care-row"><span>WhatsApp</span><b>'+human(m.wa)+'</b><span>Handoff percakapan</span><span class="care-pill">OBSERVED</span></div><div class="care-row"><span>Booking</span><b>'+human(m.measuredBooking)+'</b><span>Konversi yang sudah terhubung ke event booking</span><span class="care-pill '+(m.measuredBooking?'care-ok':'care-warn')+'">'+(m.measuredBooking?'MEASURED':'TRACKING GAP')+'</span></div></div><div class="care-card" style="margin-top:12px"><h3>🧠 AI Follow-up Queue</h3><div class="care-n">Follow-up tidak dikirim massal. Sistem memeriksa jarak waktu, riwayat sentuhan, opt-in, dan sinyal kebutuhan. Pesan dibuat singkat, manusiawi, dan tidak berpura-pura menjadi manusia. Untuk keputusan harga final, ketersediaan, refund, komplain, perubahan booking, atau hal sensitif, AI membuat tugas untuk admin.</div><div class="care-row" style="margin-top:10px"><b>Prospek</b><b>Intent</b><span>Rencana</span><span>Human gate</span></div>'+rescue.map(r=>'<div class="care-row"><span><b>'+esc(safeName(r))+'</b><br><small>'+esc(r.phone)+'</small></span><span class="care-pill">'+esc(r.intent||'care')+'</span><span>'+esc(makeMessage(r,'rescue'))+'</span><span class="care-pill care-warn">ADMIN IF NEEDED</span></div>').join('')+'<div class="care-actions" style="margin-top:10px"><button class="primary" id="tm-care-rescue">Buat antrean rescue</button><button id="tm-care-warm">Buat antrean relationship care</button></div><div id="tm-care-msg" class="care-n" style="margin-top:9px"></div></div></div>');
  document.getElementById('tm-care-rescue')?.addEventListener('click',async()=>{const b=document.getElementById('tm-care-msg');b.textContent='Menyusun antrean rescue…';try{const x=await queueFollowups(db,rescue,'rescue');b.textContent='Selesai: '+x.created+' antrean dibuat, '+x.skipped+' dilewati karena belum memenuhi syarat.';}catch(e){b.textContent='Antrean gagal dibuat: '+e.message;}});
  document.getElementById('tm-care-warm')?.addEventListener('click',async()=>{const b=document.getElementById('tm-care-msg');b.textContent='Menyusun antrean relationship care…';try{const x=await queueFollowups(db,rescue,'care');b.textContent='Selesai: '+x.created+' antrean dibuat, '+x.skipped+' dilewati karena belum memenuhi syarat.';}catch(e){b.textContent='Antrean gagal dibuat: '+e.message;}});
 }catch(e){el.insertAdjacentHTML('beforeend','<div class="notice bad care">AI Customer Care tidak dapat membaca queue: '+esc(e.message)+'</div>')}
}
window.TRANSMIND_AI_CUSTOMER_CARE={render};
let n=0;const boot=()=>{if(document.getElementById('seoBody')){render();return}if(++n<30)setTimeout(boot,500)};boot();
})();