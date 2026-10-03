/* TRANSMIND PUBLIC COPY GUARD
   Keeps internal architecture terms out of customer-facing pages. */
(function(){
  'use strict';
  const replacements=[
    ['Booking Transmind 24/7','Booking Transmind'],
    ['Permintaan booking diproses setiap saat','Ajukan kebutuhan perjalanan Anda kapan saja.'],
    ['Pilih armada, tanggal, layanan dan area. Kirim booking online untuk masuk ke sistem Transmind Nexus dan diproses tim.','Pilih armada, tanggal, layanan, dan area. Kirim permintaan booking, lalu kami bantu konfirmasi ketersediaan dan detail perjalanan Anda.'],
    ['Pilih armada, tanggal, layanan dan area. Kirim booking online untuk masuk ke sistem Transmind Nexus dan diproses tim','Pilih armada, tanggal, layanan, dan area. Kirim permintaan booking, lalu kami bantu konfirmasi ketersediaan dan detail perjalanan Anda.'],
    ['Transmind Nexus','Transmind'],
    ['XUS 24/7','LAYANAN BOOKING']
  ];
  function clean(root){
    if(!root)return;
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];
    while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(node=>{
      if(node.parentElement&&/^(SCRIPT|STYLE|NOSCRIPT|TEXTAREA)$/i.test(node.parentElement.tagName))return;
      let next=node.nodeValue||'';
      replacements.forEach(([from,to])=>{next=next.split(from).join(to)});
      if(next!==node.nodeValue)node.nodeValue=next;
    });
  }
  function boot(){
    clean(document.body);
    if(!window.MutationObserver||!document.body)return;
    let scheduled=false;
    new MutationObserver(()=>{
      if(scheduled)return;
      scheduled=true;
      requestAnimationFrame(()=>{scheduled=false;clean(document.body)});
    }).observe(document.body,{subtree:true,childList:true,characterData:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();