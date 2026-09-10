(() => {
  'use strict';
  const cfg = window.NEXUS_CONFIG || {};
  let db = null, mounted = false;
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const rup = n => new Intl.NumberFormat('id-ID',{style:'currency',currency:'IDR',maximumFractionDigits:0}).format(Number(n||0));
  const getDb = () => {
    if (!db && window.supabase && cfg.supabaseUrl && cfg.supabaseAnonKey) db = window.supabase.createClient(cfg.supabaseUrl,cfg.supabaseAnonKey);
    return db;
  };
  async function rpc(name,args={}) { const c=getDb(); if(!c) throw new Error('Supabase belum siap'); const {data,error}=await c.rpc(name,args); if(error) throw error; return data; }
  async function mount(){
    const page=document.querySelector('.page.active');
    if(!page || !['dashboard-sales','sales','sales-conversion','sales-pipeline'].includes(page.id)) return;
    if(mounted && page.querySelector('.nx-growth')) return;
    mounted=true;
    const root=document.createElement('section'); root.className='nx-growth';
    root.innerHTML=`<style>
      .nx-growth{margin-top:18px}.nx-growth .ghead{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;flex-wrap:wrap;margin-bottom:14px}.nx-growth .gtitle{font-size:19px;font-weight:850}.nx-growth .gsub{color:#8e949f;font-size:11px;margin-top:4px}.nx-growth .gactions{display:flex;gap:7px;flex-wrap:wrap}.nx-growth button{background:#0d1015;color:#e7e8eb;border:1px solid #343943;border-radius:9px;padding:8px 11px}.nx-growth button.primary{background:#d2ad32;color:#111;border-color:#d2ad32;font-weight:800}.nx-growth .ggrid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}.nx-growth .gcard{background:linear-gradient(145deg,#171a21,#11141a);border:1px solid #272c35;border-radius:13px;padding:13px}.nx-growth .glab{font-size:9px;color:#8e949f;text-transform:uppercase;letter-spacing:.8px}.nx-growth .gval{font-size:20px;font-weight:850;margin-top:7px}.nx-growth .panel{margin-top:12px;background:#11141a;border:1px solid #272c35;border-radius:14px;padding:15px}.nx-growth .panel h3{margin:0 0 11px;font-size:14px}.nx-growth .row{display:grid;grid-template-columns:100px 1fr 90px 110px 82px;gap:10px;padding:10px 0;border-bottom:1px solid #242831;align-items:center}.nx-growth .row:last-child{border-bottom:0}.nx-growth .muted{color:#8e949f;font-size:11px}.nx-growth .chip{display:inline-block;border:1px solid #3a3e47;border-radius:999px;padding:4px 7px;font-size:9px;width:max-content}.nx-growth .high{color:#f0cf68;border-color:#66551e}.nx-growth .over{color:#e87878}.nx-growth .empty{text-align:center;color:#8e949f;padding:22px}.nx-growth .msg{font-size:11px;margin-top:8px;color:#8e949f}.nx-growth .ok{color:#65d49a}.nx-growth .bad{color:#e87878}@media(max-width:900px){.nx-growth .ggrid{grid-template-columns:repeat(2,1fr)}.nx-growth .row{grid-template-columns:80px 1fr 75px 80px}.nx-growth .row .hide-m{display:none}}@media(max-width:600px){.nx-growth .ggrid{grid-template-columns:1fr}.nx-growth .row{grid-template-columns:1fr auto}.nx-growth .row>*:nth-child(n+3){display:none}}
    </style>
    <div class="ghead"><div><div class="gtitle">Growth & Conversion Command Center</div><div class="gsub">Demand → Follow-up → Conversion → Revenue → Repeat</div></div><div class="gactions"><button id="gxRun" class="primary">Run Growth Engine</button><button id="gxRefresh">Refresh</button></div></div>
    <div id="gxMsg" class="msg"></div><div id="gxMetrics" class="ggrid"></div>
    <div class="panel"><h3>Sales Action Queue</h3><div id="gxRows"><div class="empty">Memuat...</div></div></div>`;
    page.prepend(root);
    root.querySelector('#gxRefresh').onclick=load;
    root.querySelector('#gxRun').onclick=run;
    await load();
  }
  function metric(label,val){return `<div class="gcard"><div class="glab">${esc(label)}</div><div class="gval">${esc(val)}</div></div>`;}
  async function load(){
    const root=document.querySelector('.nx-growth'); if(!root)return;
    const msg=root.querySelector('#gxMsg'); msg.textContent='Memuat data...'; msg.className='msg';
    try{
      const [cc,gm]=await Promise.all([rpc('nexus_growth_command_center'),rpc('nexus_growth_metrics')]);
      root.querySelector('#gxMetrics').innerHTML=[metric('Open Actions',cc?.open_actions??0),metric('High Priority',cc?.high_priority??0),metric('Pending Follow-up',cc?.pending_followups??0),metric('Repeat Opportunity',cc?.repeat_opportunities??0),metric('Revenue',rup(gm?.revenue))].join('');
      msg.textContent=`Conversion ${gm?.conversion_rate??0}% · Completion ${gm?.completion_rate??0}% · Booking ${gm?.total_bookings??0}`; msg.className='msg ok';
      await loadActions(root);
    }catch(e){msg.textContent=e.message||'Gagal memuat Growth Engine';msg.className='msg bad';}
  }
  async function loadActions(root){
    // The action table is intentionally accessed through a controlled RPC, not direct browser SELECT.
    try{
      const data=await rpc('nexus_growth_actions_list',{p_limit:40});
      const rows=Array.isArray(data)?data:(data?.items||[]);
      if(!rows.length){root.querySelector('#gxRows').innerHTML='<div class="empty">Tidak ada growth action terbuka.</div>';return;}
      root.querySelector('#gxRows').innerHTML=rows.map(x=>`<div class="row"><span class="chip ${x.priority==='high'?'high':''}">${esc(x.priority||'normal')}</span><div><b>${esc(x.title||x.action_type||'Growth Action')}</b><div class="muted">${esc(x.message_body||'')}</div></div><span class="muted">${esc(x.action_type||'')}</span><span class="muted ${x.due_at&&new Date(x.due_at)<new Date()?'over':''}">${x.due_at?esc(new Date(x.due_at).toLocaleString('id-ID')):'-'}</span><button data-complete="${esc(x.id)}">Done</button></div>`).join('');
      root.querySelectorAll('[data-complete]').forEach(b=>b.onclick=async()=>{b.disabled=true;try{await rpc('nexus_complete_growth_action',{p_action_id:b.dataset.complete});await load();}catch(e){alert(e.message||'Gagal menyelesaikan action');b.disabled=false;}});
    }catch(e){root.querySelector('#gxRows').innerHTML=`<div class="empty">Queue belum dapat dimuat: ${esc(e.message||'RPC belum tersedia')}</div>`;}
  }
  async function run(){
    const root=document.querySelector('.nx-growth'); if(!root)return; const btn=root.querySelector('#gxRun'),msg=root.querySelector('#gxMsg');btn.disabled=true;msg.textContent='Menjalankan Growth Engine...';msg.className='msg';
    try{const r=await rpc('nexus_run_growth_engine');msg.textContent=`Growth Engine selesai · ${esc(JSON.stringify(r))}`;msg.className='msg ok';await load();}
    catch(e){msg.textContent=e.message||'Growth Engine membutuhkan sesi internal yang sah.';msg.className='msg bad';}
    finally{btn.disabled=false;}
  }
  const boot=()=>{try{mount();}catch(e){console.warn('[NEXUS Growth]',e);}};
  document.addEventListener('click',()=>setTimeout(boot,80)); window.addEventListener('load',boot); setInterval(boot,1000);
})();
