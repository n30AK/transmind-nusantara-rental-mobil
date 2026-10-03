/* TRANSMIND SEO — structured data v2 */
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
  {'@type':'LocalBusiness','@id':origin+'/#localbusiness','name':'Transmind Nusantara Rental Mobil','url':origin+'/','telephone':'+628816654141','logo':origin+'/logo/transmind.png','areaServed':['Jakarta','Bekasi','Bogor','Depok','Tangerang','Jabodetabek'],'description':'Layanan rental mobil Jabodetabek untuk kebutuhan pribadi, bisnis, corporate, wedding dan pariwisata.'}
 );
 [['Rental Mobil Lepas Kunci','Jabodetabek'],['Rental Mobil Dengan Driver','Jabodetabek'],['Rental Mobil Corporate','Jabodetabek'],['Rental Mobil Wedding','Jabodetabek'],['Rental Mobil Pariwisata','Jabodetabek']].forEach(function(x){graph.push({'@type':'Service','name':x[0],'provider':{'@id':origin+'/#organization'},'areaServed':x[1]})});
}
add({'@context':'https://schema.org','@graph':graph},'transmind-seo-schema');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
