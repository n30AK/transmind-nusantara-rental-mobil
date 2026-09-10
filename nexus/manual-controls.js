(()=>{'use strict';
const MAP={'fleet-types':'Data Kendaraan','fleet-units':'Unit Kendaraan','crm-master':'Customer Master','crm-interaction':'Interaksi Customer','partner-master':'Partner Master','network-agent':'Agent Master','booking':'Semua Booking','booking-pending':'Booking Pending','fleet-assignment':'Assignment','finance-payment':'Pembayaran','finance-revenue':'Transaksi','finance-commission':'Commission','finance-settlement':'Settlement','finance-reconcile':'Ledger Entries','finance-invoice':'Invoice / Refund','finance-cost':'Biaya Transaksi','fleet':'Armada','crm':'Customer','partner':'Partner','erp-master':'ERP Master Data'};
const boot=()=>{
  const pages=[...document.querySelectorAll('.page.active')];
  const p=pages[0];
  if(!p)return;
  const key=p.id, title=MAP[key];
  let global=document.querySelector('.nx-global-entry');
  if(!global){
    global=document.createElement('div');global.className='nx-global-entry';
    global.style='position:sticky;top:0;z-index:18;margin:0 0 16px;padding:10px 12px;border:1px solid #3b3420;border-radius:12px;background:linear-gradient(90deg,#18150c,#11141a);box-shadow:0 8px 25px #0004;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap';
    global.innerHTML='<div><b style="color:#f0cf68;letter-spacing:1px;font-size:11px">NEXUS DATA CONTROL</b><span style="color:#8e949f;font-size:11px;margin-left:10px">Manual entry & workflow</span></div><button data-global-open style="background:#d2ad32;color:#111;border:1px solid #d2ad32;border-radius:9px;padding:8px 13px;font-weight:800;cursor:pointer">Open Data Workspace →</button>';
    const main=document.querySelector('.main');if(main)main.prepend(global);
    global.querySelector('[data-global-open]').onclick=()=>location.href='./manual-workspace.html?page='+encodeURIComponent(key||'fleet-types');
  }
  if(!title)return;
  let box=p.querySelector('.nx-embedded-workspace');
  if(!box){
    box=document.createElement('section');box.className='card nx-embedded-workspace';box.style='margin-top:18px;padding:0;overflow:hidden;border:1px solid #30343c;background:#0b0e13';
    box.innerHTML='<div style="padding:13px 16px;border-bottom:1px solid #292e37;display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap"><div><div style="font-size:9px;letter-spacing:1.7px;color:#f0cf68;font-weight:800">CONTROLLED DATA ENTRY</div><div style="font-size:16px;font-weight:850;margin-top:4px">'+title+' · Live Workspace</div><div style="color:#8e949f;font-size:11px;margin-top:4px">Database-connected. Permission, validation, audit dan workflow diproses server-side.</div></div><button data-full style="background:#0d1015;color:#eee;border:1px solid #383d46;border-radius:9px;padding:8px 12px;cursor:pointer">Fullscreen ↗</button></div><iframe title="NEXUS Manual Data Workspace" style="display:block;width:100%;height:820px;border:0;background:#07080b"></iframe>';
    p.appendChild(box);
    const frame=box.querySelector('iframe');frame.src='./manual-workspace.html?page='+encodeURIComponent(key)+'&embed=1&v=3';
    box.querySelector('[data-full]').onclick=()=>window.open('./manual-workspace.html?page='+encodeURIComponent(key),'_blank','noopener');
  }
};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setInterval(boot,500));else setInterval(boot,500);
})();