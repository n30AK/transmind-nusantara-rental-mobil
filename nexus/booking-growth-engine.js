/* TransMind Nexus — Booking 50/day Growth Engine v4
 * Uses protected command-center RPC for authoritative booking truth.
 */
(()=>{'use strict';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const db=()=>window.NXSB||window.getTransmindSupabaseClient?.()||window.transmindSupabase||null;
async function render(){
 const el=document.getElementById('seoBody'),d=db();if(!el||!d||el.dataset.tmGrowthV4==='1')return;el.dataset.tmGrowthV4='1';
 try{
  const r=await d.rpc('nexus_seo_command_center',{p_days:1});if(r.error)throw r.error;const x=r.data||{};
  const vis=Number(x.unique_visitors||0),cta=Number(x.booking_cta_clicks||0),start=Number(x.booking_starts||0),wa=Number(x.whatsapp_clicks||0),book=Number(x.bookings||0),gap=Math.max(0,50-book);
  const pct=(a,b)=>b?((a/b)*100).toFixed(1)+'%':'0.0%';
  const leak=cta>0&&start===0?'CTA → booking form':start>0&&book===0?'Booking form → successful booking':wa>0&&book===0?'WhatsApp → booking':book>0?'Scale demand':'Demand/traffic';
  const html='<style id="tm-growth-v4-style">.tm-g4{margin-top:14px}.tm-g4-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.tm-g4-card{background:linear-gradient(145deg,#171a21,#101319);border:1px solid #292f39;border-radius:15px;padding:16px}.tm-g4-num{font-size:25px;font-weight:900;margin:6px 0}.tm-g4-note{font-size:11px;color:#8e949f;line-height:1.5}.tm-g4-hot{color:#e5c15a}.tm-g4-bad{color:#e87878}.tm-g4-ok{color:#65d49a}@media(max-width:850px){.tm-g4-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:520px){.tm-g4-grid{grid-template-columns:1fr}}</style><div class="tm-g4"><div class="tm-g4-card"><b>🎯 BOOKING 50 / HARI</b><div class="tm-g4-note" style="margin-top:5px">Booking dihitung dari transaksi nyata melalui protected command-center RPC.</div><div class="tm-g4-grid" style="margin-top:12px">'+[['Visitor unik',vis,'session'],['CTA unik',cta,'booking CTA'],['Booking start',start,'form start'],['Booking nyata',book,'ledger']].map((x,i)=>'<div class="tm-g4-card"><div class="tm-g4-note">'+x[0]+'</div><div class="tm-g4-num '+(i===3?(book?'tm-g4-ok':'tm-g4-bad'):'')+'">'+x[1]+'</div><div class="tm-g4-note">'+x[2]+'</div></div>').join('')+'</div></div><div class="tm-g4-grid" style="margin-top:12px">'+[['CTA → Start',pct(start,cta)],['Start → Booking',pct(book,start)],['WhatsApp unik',wa],['Gap target',gap]].map(x=>'<div class="tm-g4-card"><div class="tm-g4-note">'+x[0]+'</div><div class="tm-g4-num">'+x[1]+'</div><div class="tm-g4-note">data nyata</div></div>').join('')+'</div><div class="tm-g4-card" style="margin-top:12px"><b>🔎 Bottleneck nyata</b><div class="tm-g4-num tm-g4-hot">'+esc(leak)+'</div><div class="tm-g4-note">NEXUS mengarahkan pekerjaan ke titik kebocoran aktual, bukan sekadar mengejar visitor.</div></div></div>';
  el.insertAdjacentHTML('beforeend',html);
 }catch(e){el.insertAdjacentHTML('beforeend','<div class="notice bad tm-g4">Booking Growth Engine: '+esc(e.message)+'</div>')}
}
window.TRANSMIND_BOOKING_GROWTH={render};setTimeout(render,1500);document.addEventListener('tm-seo-refresh',()=>setTimeout(render,150));
})();