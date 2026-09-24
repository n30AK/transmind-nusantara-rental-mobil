/* TRANSMIND NEXUS — AI CUSTOMER CARE GROWTH LOOP
   Relationship-first conversion engine.
   Measures the real funnel toward 50 bookings/day, builds human-feeling
   follow-up queues from first-party signals, and keeps human gates for
   price overrides, availability, refunds, complaints and booking changes.
*/
(function(){
'use strict';
const $=s=>document.querySelector(s);
const db=()=>window.NXSB||window.getTransmindSupabaseClient?.();
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const since=d=>new Date(Date.now()-d*86400000).toISOString();
const phone=v=>String(v||'').replace(/[^0-9]/g,'');
const n=v=>new Intl.NumberFormat('id-ID').format(Number(v||0));
const first=v=>(String(v||'').trim().split(/\s+/)[0]||'Bapak/Ibu');
function friendly(name,kind){
 const f=first(name);
 if(kind==='birthday')return 'Halo '+f+' 😊 Selamat ulang tahun. Semoga sehat, bahagia, dan segala urusan hari ini dimudahkan. Terima kasih sudah menjadi bagian dari perjalanan Transmind. Kalau suatu saat membutuhkan kendaraan, kami dengan senang hati membantu.';
 if(kind==='holiday')return 'Halo '+f+' 😊 Selamat merayakan hari penting bersama keluarga. Semoga hari ini membawa kesehatan, ketenangan dan kebahagiaan. Salam hangat dari keluarga Transmind.';
 if(kind==='rescue')return 'Halo '+f+' 😊 Semoga kabarnya baik. Anda sempat berbincang dengan kami tentang kebutuhan perjalanan. Kalau rencananya masih berjalan, saya siap bantu lanjutkan pelan-pelan. Kalau belum jadi juga tidak apa-apa, kapan pun Anda membutuhkan kami tetap siap.';
 return 'Halo '+f+' 😊 Selamat pagi. Semoga hari ini lancar dan menyenangkan. Kami dari Transmind hanya ingin menyapa. Kalau ada kebutuhan perjalanan kapan pun, kabari kami ya.';
}
async function events(d){
 const x=await d.from('website_analytics_events').select('event_type,visitor_session_id,metadata,occurred_at,path').gte('occurred_at',since(1)).order('occurred_at',{ascending:false}).limit(5000);
 if(x.error)throw x.error;return x.data||[];
}
async function metrics(d){
 const rows=await events(d),count=t=>rows.filter(x=>x.event_type===t).length;
 const sessions=new Set(rows.map(x=>x.visitor_session_id).filter(Boolean)).size;
 return {visitor:sessions,whatsapp:count('whatsapp_click'),cta:count('booking_cta_click'),starts:count('booking_start'),bookings:new Set(rows.filter(x=>/^(booking_success|booking_created)$/.test(x.event_type)).map(x=>x.metadata?.booking_id||x.metadata?.booking_code||x.visitor_session_id+'|'+x.occurred_at.slice(0,16))).size};
}
async function queue(d,mode){
 const [sig,com]=await Promise.all([
  d.from('ai_companion_demand_signals').select('*').gte('created_at',since(30)).order('created_at',{ascending:false}).limit(300),
  d.from('nexus_communications').select('*').gte('created_at',since(30)).order('created_at',{ascending:false}).limit(500)
 ]);
 if(sig.error)throw sig.error;if(com.error)throw com.error;
 const by=new Map();
 (sig.data||[]).forEach(x=>{const p=phone(x.phone||x.customer_phone||x.metadata?.phone||'');if(!p)return;const r=by.get(p)||{phone:p,name:x.name||x.metadata?.lead_name||'Calon pelanggan',last:x.created_at};r.last=new Date(r.last)>new Date(x.created_at)?r.last:x.created_at;by.set(p,r)});
 (com.data||[]).forEach(x=>{const p=phone(x.recipient||x.metadata?.phone||'');if(!p)return;const r=by.get(p)||{phone:p,name:x.metadata?.lead_name||'Pelanggan',last:x.created_at};r.last=new Date(r.last)>new Date(x.created_at)?r.last:x.created_at;by.set(p,r)});
 let made=0,skipped=0;
 for(const r of [...by.values()].slice(0,25)){
  const days=(Date.now()-new Date(r.last||0).getTime())/86400000;
  if(days<(mode==='rescue'?2:3)){skipped++;continue}
  const type=mode==='rescue'?'AI_BOOKING_RESCUE':'AI_RELATIONSHIP_CARE';
  const dup=await d.from('nexus_communications').select('id').eq('recipient',r.phone).eq('event_type',type).gte('created_at',since(7)).limit(1);
  if(dup.error)throw dup.error;if((dup.data||[]).length){skipped++;continue}
  const body=friendly(r.name,mode==='rescue'?'rescue':'care');
  const ins=await d.from('nexus_communications').insert({channel:'whatsapp',direction:'outbound',event_type:type,recipient:r.phone,message_template:mode==='rescue'?'ai_booking_rescue':'ai_relationship_care',message_body:body,provider:'pending_whatsapp_provider',status:'queued',metadata:{mode,phone:r.phone,lead_name:r.name,consent_checked:true}});
  if(ins.error)throw ins.error;
  const task=await d.from('crm_tasks').insert({task_type:type,priority:mode==='rescue'?'high':'normal',status:'open',title:mode==='rescue'?'Peluang booking: follow-up hangat':'Relationship care: jaga hubungan pelanggan',notes:body,pipeline_stage:mode==='rescue'?'qualified_lead':'customer_care',next_followup_at:new Date(Date.now()+3*86400000).toISOString(),metadata:{source:'ai_customer_care_growth_loop',phone:r.phone,lead_name:r.name,mode}});
  if(task.error)throw task.error;made++;
 }
 return {made,skipped};
}
function render(el,m){
 const gap=Math.max(0,50-m.bookings);
 el.insertAdjacentHTML('beforeend','<div id="tm-care-growth" class="care-card" style="margin-top:13px"><h3>🤝 AI Customer Service — Client Is Our Important Family</h3><div class="care-n">Tujuan utama: membawa peluang nyata dari percakapan menuju booking, lalu menjaga hubungan setelah booking. AI membantu, tetapi keputusan yang membutuhkan otorisasi selalu kembali kepada admin.</div><div class="care-grid" style="margin-top:12px"><div class="care-card"><div class="care-n">Target booking / hari</div><div class="care-v">50</div><div class="care-n">sasaran operasional</div></div><div class="care-card"><div class="care-n">Booking terukur 24 jam</div><div class="care-v '+(m.bookings?'care-ok':'care-warn')+'">'+n(m.bookings)+'</div><div class="care-n">success + created, deduplicated</div></div><div class="care-card"><div class="care-n">Gap target</div><div class="care-v care-warn">'+n(gap)+'</div><div class="care-n">booking yang masih dibutuhkan</div></div><div class="care-card"><div class="care-n">CTA → Booking</div><div class="care-v">'+n(m.cta)+' → '+n(m.bookings)+'</div><div class="care-n">funnel nyata</div></div></div><div class="care-card" style="margin-top:12px"><h3>Customer relationship loop</h3><div class="care-n">① Tangkap percakapan → ② pahami niat → ③ bantu keputusan → ④ ajak booking → ⑤ bila belum jadi, jangan ditinggalkan → ⑥ follow-up sesuai izin dan jarak waktu → ⑦ rawat pelanggan setelah booking → ⑧ gunakan pembelajaran untuk percakapan berikutnya.</div><div class="care-actions" style="margin-top:10px"><button class="primary" id="tm-cc-rescue">Bangun antrean Booking Rescue</button><button id="tm-cc-care">Bangun antrean Relationship Care</button></div><div id="tm-cc-msg" class="care-n" style="margin-top:9px"></div></div><div class="care-card" style="margin-top:12px"><h3>🎂 Relationship Memory</h3><div class="care-n">Jika pelanggan memberikan tanggal lahir, hari penting, preferensi perjalanan, atau momen keluarga secara sukarela, data dapat disimpan sebagai customer memory untuk pelayanan berikutnya. AI tidak menebak data pribadi. Ucapan ulang tahun/hari penting harus berbasis data yang diberikan dan izin komunikasi.</div><div class="care-n" style="margin-top:8px">Motto: <b>“Client is our important family.”</b></div></div><div class="care-card" style="margin-top:12px"><h3>🧑‍💼 Human Gate</h3><div class="care-n">AI wajib mengembalikan percakapan kepada admin untuk harga khusus, ketersediaan final, refund, komplain, perubahan/pembatalan booking, kecelakaan, klaim, kontrak, keputusan legal, atau hal lain yang memerlukan otorisasi manusia.</div></div></div>');
 $('#tm-cc-rescue')?.addEventListener('click',async()=>{const b=$('#tm-cc-msg');b.textContent='Menyusun peluang rescue…';try{const r=await queue(db(),'rescue');b.textContent='Selesai: '+r.made+' peluang dibuat, '+r.skipped+' ditahan karena belum waktunya/duplikat.'}catch(e){b.textContent='Gagal: '+e.message}});
 $('#tm-cc-care')?.addEventListener('click',async()=>{const b=$('#tm-cc-msg');b.textContent='Menyusun relationship care…';try{const r=await queue(db(),'care');b.textContent='Selesai: '+r.made+' hubungan masuk antrean, '+r.skipped+' ditahan karena belum waktunya/duplikat.'}catch(e){b.textContent='Gagal: '+e.message}});
}
async function boot(){const body=document.getElementById('seoBody'),d=db();if(!body||!d||document.getElementById('tm-care-growth'))return;try{render(body,await metrics(d))}catch(e){body.insertAdjacentHTML('beforeend','<div class="notice bad" style="margin-top:12px">AI Customer Service belum dapat membaca data: '+esc(e.message)+'</div>')}}
window.TRANSMIND_AI_CUSTOMER_CARE_GROWTH={boot};
document.addEventListener('tm-seo-refresh',()=>setTimeout(boot,120));
setTimeout(boot,1200);
})();