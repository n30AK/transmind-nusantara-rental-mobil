/* TRANSMIND SEO — structured data v4 */
(function(){
'use strict';
function add(data,id){if(document.getElementById(id))return;var s=document.createElement('script');s.type='application/ld+json';s.id=id;s.textContent=JSON.stringify(data);document.head.appendChild(s)}
function boot(){
var origin='https://transmindnusantararentalmobil.co.id', page=location.pathname;
var org={'@type':'Organization','@id':origin+'/#organization','name':'Transmind Nusantara Rental Mobil','url':origin+'/','logo':origin+'/logo/transmind.png','telephone':'+628816654141','sameAs':['https://www.instagram.com/transmind.nusantara/','https://www.tiktok.com/@transmindrentalmobil','https://x.com/transmindnusant']};
var site={'@type':'WebSite','@id':origin+'/#website','url':origin+'/','name':'Transmind Nusantara Rental Mobil','publisher':{'@id':origin+'/#organization'},'inLanguage':'id-ID'};
var graph=[org,site];
if(page==='/'||page==='/index.html'){
 graph.push(
  {'@type':'WebPage','@id':origin+'/#webpage','url':origin+'/','name':document.title,'description':document.querySelector('meta[name="description"]')?.content||'Rental mobil Jabodetabek Transmind Nusantara.','isPartOf':{'@id':origin+'/#website'},'about':{'@id':origin+'/#organization'},'inLanguage':'id-ID'},
  {'@type':'BreadcrumbList','@id':origin+'/#breadcrumb','itemListElement':[{'@type':'ListItem','position':1,'name':'Transmind Nusantara Rental Mobil','item':origin+'/'}]},
  {'@type':'AutoRental','@id':origin+'/#localbusiness','name':'Transmind Nusantara Rental Mobil','url':origin+'/','telephone':'+628816654141','logo':origin+'/logo/transmind.png','areaServed':['Jakarta','Bekasi','Bogor','Depok','Tangerang','Jabodetabek'],'description':'Layanan rental mobil Jabodetabek untuk kebutuhan pribadi, bisnis, corporate, wedding dan pariwisata.','address':{'@type':'PostalAddress','streetAddress':'Jl. Taman Tulip Raya No.18 Blk C2, RT.003/RW.026, Pejuang, Kecamatan Medan Satria','addressLocality':'Bekasi','addressRegion':'Jawa Barat','postalCode':'17131','addressCountry':'ID'},'contactPoint':[{'@type':'ContactPoint','contactType':'customer service','telephone':'+628816654141','availableLanguage':['id-ID']}],'hasMap':'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent('Jl. Taman Tulip Raya No.18 Blk C2, Pejuang, Medan Satria, Bekasi, Jawa Barat 17131'),'keywords':'rental mobil Jakarta, sewa mobil Jakarta, rental mobil Bekasi, rental mobil Bogor, rental mobil Depok, rental mobil Tangerang, rental mobil Jabodetabek'}
 );
 [["Rental Mobil Lepas Kunci","/rental-mobil-lepas-kunci-jabodetabek.html"],["Rental Mobil Dengan Driver","/rental-mobil-dengan-driver-jabodetabek.html"],["Rental Mobil Corporate","/rental-mobil-corporate-jabodetabek.html"],["Rental Mobil Wedding","/rental-mobil-wedding-jabodetabek.html"],["Rental Mobil Pariwisata","/rental-mobil-pariwisata-jabodetabek.html"]].forEach(function(x){graph.push({'@type':'Service','@id':origin+x[1]+'#service','name':x[0],'url':origin+x[1],'provider':{'@id':origin+'/#organization'},'areaServed':{'@type':'AdministrativeArea','name':'Jabodetabek'}})});
}
add({'@context':'https://schema.org','@graph':graph},'transmind-seo-schema');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
