/* TRANSMIND SEO FOUNDATION — structured data only, no visible UI */
(function(){
  'use strict';
  function boot(){
    if(document.querySelector('script[data-transmind-seo-schema]'))return;
    var data={
      '@context':'https://schema.org',
      '@graph':[
        {'@type':'LocalBusiness','@id':'https://transmindnusantararentalmobil.co.id/#business','name':'Transmind Nusantara Rental Mobil','url':'https://transmindnusantararentalmobil.co.id/','telephone':'+628816654141','areaServed':['Bekasi','Jakarta','Bogor','Depok','Tangerang','Jabodetabek'],'priceRange':'$$','description':'Rental mobil Jabodetabek untuk lepas kunci, dengan driver, corporate, wedding dan pariwisata.'},
        {'@type':'WebSite','@id':'https://transmindnusantararentalmobil.co.id/#website','url':'https://transmindnusantararentalmobil.co.id/','name':'Transmind Nusantara Rental Mobil','publisher':{'@id':'https://transmindnusantararentalmobil.co.id/#business'}},
        {'@type':'Service','name':'Rental Mobil Lepas Kunci','provider':{'@id':'https://transmindnusantararentalmobil.co.id/#business'},'areaServed':'Jabodetabek'},
        {'@type':'Service','name':'Rental Mobil Dengan Driver','provider':{'@id':'https://transmindnusantararentalmobil.co.id/#business'},'areaServed':'Jabodetabek'},
        {'@type':'Service','name':'Rental Mobil Corporate','provider':{'@id':'https://transmindnusantararentalmobil.co.id/#business'},'areaServed':'Jabodetabek'},
        {'@type':'Service','name':'Rental Mobil Wedding','provider':{'@id':'https://transmindnusantararentalmobil.co.id/#business'},'areaServed':'Jabodetabek'},
        {'@type':'Service','name':'Rental Mobil Pariwisata','provider':{'@id':'https://transmindnusantararentalmobil.co.id/#business'},'areaServed':'Jabodetabek'}
      ]
    };
    var s=document.createElement('script');s.type='application/ld+json';s.dataset.transmindSeoSchema='1';s.textContent=JSON.stringify(data);document.head.appendChild(s);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
