(() => {
  'use strict';
  const cfg = window.NEXUS_CONFIG || {};
  const sb = supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
  const $ = id => document.getElementById(id);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmtDate = v => v ? new Date(v).toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'}) : '—';
  const rup = n => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0));
  const wa = p => { const d=String(p||'').replace(/\D/g,''); if(!d)return ''; return d.startsWith('0')?'62'+d.slice(1):d.startsWith('62')?d:d; };
  const stages=['NEW','CONTACTED','QUALIFIED','QUOTED','NEGOTIATION','CONFIRMED','PAID','COMPLETED','LOST','CANCELLED'];
  const outcomeStage={contacted:'CONTACTED',responded:'QUALIFIED',quoted:'QUOTED',confirmed:'CONFIRMED',paid:'PAID',completed:'COMPLETED'};
  let session=null, rows=[], selected=null;
  function msg(text,bad=false){const e=$('loginMsg');e.textContent=text||'';e.className='msg '+(bad?'bad':'ok');}
  function metric(label,value,note=''){return `<div class="metric"><span>${label}</span><b>${value}</b><small class="muted">${note}</small></div>`;}
  function showApp(v){$('login').classList.toggle('hidden',v);$('app').classList.toggle('hidden',!v);}
  async function roleAllowed(){const {data,error}=await sb.rpc('nexus_crm_command_center');if(error)throw error;return data;}
  async function load(){
    if(!session)return;$('connection').textContent='● LIVE';
    const {data,error}=await sb.rpc('nexus_crm_command_center');
    if(error){$('connection').textContent='● ERROR';console.error(error);return;}
    const payload=Array.isArray(data)?data[0]:data,summary=payload?.summary||{};
    rows=payload?.queue||payload?.active_queue||[];
    $('metrics').innerHTML=[metric('New Leads',summary.new_leads||0,'baru masuk'),metric('Follow-up Due',summary.followup_due||0,'perlu ditindak'),metric('Quoted',summary.quoted||0,'sudah penawaran'),metric('Confirmed',summary.confirmed||0,'siap dijalankan'),metric('Paid',summary.paid||0,'sudah bayar')].join('');
    render();
  }
  function filtered(){
    const q=$('search').value.trim().toLowerCase(),stage=$('stage').value,scope=$('scope').value,now=Date.now();
    return rows.filter(r=>{const hay=[r.customer_name,r.customer_phone,r.booking_code,r.service,r.title].join(' ').toLowerCase();if(q&&!hay.includes(q))return false;if(stage&&r.pipeline_stage!==stage)return false;if(scope==='due'&&!(r.next_followup_at&&new Date(r.next_followup_at).getTime()<=now))return false;if(scope==='priority'&&!['high','urgent','critical'].includes(String(r.priority||'').toLowerCase()))return false;return true;});
  }
  function render(){
    const list=filtered();$('queueCount').textContent=`${list.length} task`;
    $('queue').innerHTML=list.length?list.map(r=>{const p=String(r.priority||'').toLowerCase(),cls=['high','urgent','critical'].includes(p)?' high':'';return `<div class="row" data-id="${esc(r.task_id)}"><div><div class="customer">${esc(r.customer_name||'Tanpa nama')}</div><small>${esc(r.customer_phone||'')} · ${esc(r.booking_code||'Tanpa booking')}</small></div><div><span class="priority${cls}">${esc(r.priority||'normal')}</span><div class="muted">${esc(r.service||'')} · ${fmtDate(r.start_date)}</div></div><div><select class="stage-select" data-stage="${esc(r.task_id)}">${stages.map(s=>`<option ${s===r.pipeline_stage?'selected':''}>${s}</option>`).join('')}</select></div><div class="row-actions"><button class="mini" data-open="${esc(r.task_id)}">Detail</button>${r.customer_phone?`<a class="mini gold" target="_blank" rel="noopener" href="https://wa.me/${wa(r.customer_phone)}?text=${encodeURIComponent('Halo '+(r.customer_name||'')+', kami dari Transmind Nusantara. Kami siap membantu kebutuhan rental Anda.')}">WhatsApp</a>`:''}</div></div>`;}).join(''):`<div class="empty">Tidak ada task sesuai filter.</div>`;
    document.querySelectorAll('[data-open]').forEach(b=>b.onclick=()=>select(b.dataset.open));document.querySelectorAll('[data-stage]').forEach(s=>s.onchange=()=>changeStage(s.dataset.stage,s.value));if(selected)select(selected.task_id,true);
  }
  function select(id,silent=false){
    const r=rows.find(x=>String(x.task_id)===String(id));if(!r)return;selected=r;const phone=wa(r.customer_phone);
    $('detail').innerHTML=`<div class="detail-body"><div class="detail-title"><div><div class="eyebrow">CUSTOMER / CRM</div><h2>${esc(r.customer_name||'Tanpa nama')}</h2><div class="muted">${esc(r.customer_phone||'—')}</div></div><span class="priority">${esc(r.pipeline_stage||'NEW')}</span></div><div class="facts"><div class="fact"><span>Booking</span><b>${esc(r.booking_code||'—')}</b></div><div class="fact"><span>Layanan</span><b>${esc(r.service||'—')}</b></div><div class="fact"><span>Periode</span><b>${fmtDate(r.start_date)}<br>${fmtDate(r.end_date)}</b></div><div class="fact"><span>Nilai booking</span><b>${rup(r.total_price)}</b></div><div class="fact"><span>Nilai quotation</span><b>${r.quote_value?rup(r.quote_value):'Belum diisi'}</b></div><div class="fact"><span>Follow-up</span><b>${fmtDate(r.next_followup_at)}</b></div><div class="fact"><span>Kontak terakhir</span><b>${fmtDate(r.last_contacted_at)}</b></div></div><div class="actions">${phone?`<a class="mini gold" target="_blank" rel="noopener" href="https://wa.me/${phone}?text=${encodeURIComponent('Halo '+(r.customer_name||'')+', kami dari Transmind Nusantara. Kami siap membantu kebutuhan rental Anda.')}">Buka WhatsApp</a>`:''}<button id="focusQuote" class="mini">Atur quotation</button></div><div class="section-label">Catat kontak</div><form id="contactForm" class="contact-form"><select id="outcome"><option value="contacted">Sudah dihubungi</option><option value="responded">Merespons</option><option value="quoted">Sudah quotation</option><option value="confirmed">Confirmed</option><option value="paid">Paid</option><option value="completed">Selesai</option></select><input id="followup" type="datetime-local" value="${r.next_followup_at?new Date(r.next_followup_at).toISOString().slice(0,16):''}"><button class="primary" type="submit">Simpan aktivitas</button></form><div id="detailMsg" class="msg"></div></div>`;
    $('contactForm').onsubmit=async e=>{e.preventDefault();await logContact(r.task_id,$('outcome').value,$('followup').value)};
    $('focusQuote').onclick=()=>{const v=prompt('Nilai quotation (angka Rupiah):',r.quote_value||r.total_price||'');if(v!==null)update(r.task_id,r.pipeline_stage,r.next_followup_at,Number(String(v).replace(/\D/g,''))||null,r.lost_reason||null)};
    if(!silent)window.scrollTo({top:0,behavior:'smooth'});
  }
  async function changeStage(id,stage){const r=rows.find(x=>String(x.task_id)===String(id));if(!r)return;let reason=r.lost_reason||null;if(stage==='LOST'){reason=prompt('Alasan lost (wajib diisi):',reason||'');if(!reason){render();return;}}await update(id,stage,r.next_followup_at,r.quote_value,reason);}
  async function update(id,stage,next,quote,lost){$('connection').textContent='● SAVING';const {error}=await sb.rpc('nexus_crm_update_pipeline',{p_task_id:id,p_stage:stage,p_next_followup_at:next||null,p_quote_value:quote??null,p_lost_reason:lost||null});if(error){$('connection').textContent='● ERROR';alert(error.message);return;}await load();select(id,true);$('connection').textContent='● LIVE';}
  async function logContact(id,outcome,next){
    $('connection').textContent='● SAVING';
    const {error}=await sb.rpc('nexus_crm_log_contact',{p_task_id:id,p_outcome:outcome,p_channel:'whatsapp',p_next_followup_at:next?new Date(next).toISOString():null});
    if(error){$('connection').textContent='● ERROR';$('detailMsg').textContent=error.message;$('detailMsg').className='msg bad';return;}
    const stage=outcomeStage[outcome];
    if(stage){const r=rows.find(x=>String(x.task_id)===String(id));await sb.rpc('nexus_crm_update_pipeline',{p_task_id:id,p_stage:stage,p_next_followup_at:next?new Date(next).toISOString():null,p_quote_value:r?.quote_value??null,p_lost_reason:r?.lost_reason||null});}
    $('detailMsg').textContent='Aktivitas tersimpan, pipeline diperbarui, dan audit tercatat.';$('detailMsg').className='msg ok';await load();if(selected)select(id,true);$('connection').textContent='● LIVE';
  }
  async function signIn(e){e.preventDefault();msg('Authenticating…');const {data,error}=await sb.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});if(error){msg('Login gagal. Periksa kredensial atau akses NEXUS.',true);return;}session=data.session;try{await roleAllowed();showApp(true);msg('');$('connection').textContent='● LIVE';await load();}catch(err){await sb.auth.signOut();session=null;showApp(false);msg('Akun belum memiliki akses CRM NEXUS.',true);console.error(err);}}
  async function boot(){
    $('loginForm').onsubmit=signIn;$('logout').onclick=async()=>{await sb.auth.signOut();session=null;showApp(false)};['search','stage','scope'].forEach(id=>$(id).oninput=render);$('refresh').onclick=load;
    const {data}=await sb.auth.getSession();if(data.session){session=data.session;try{await roleAllowed();showApp(true);await load()}catch(e){await sb.auth.signOut();session=null;}}
    sb.auth.onAuthStateChange((_e,s)=>{session=s;if(!s)showApp(false)});setInterval(()=>session&&load(),60000);
  }
  boot();
})();
