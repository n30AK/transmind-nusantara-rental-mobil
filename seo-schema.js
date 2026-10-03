/* TRANSMIND SEO — structured data */
(function(){
'use strict';
function add(data,id){if(document.getElementById(id))return;var s=document.createElement('script');s.type='application/ld+json';s.id=id;s.textContent=JSON.stringify(data);document.head.appendChild(s)}
function boot(){
var origin='https://transmindnusantararentalmobil.co.id', page=location.pathname;
var org={'@type':'Organization','@id':origin+'/#organization','name':'Transmind Nusantara Rental Mobil','url':origin+'/','logo':origin+'/logo/transmind.png','telephone':'+628816654141','sameAs':['https://www.instagram.com/transmind.nusantara/','https://www.tiktok.com/@transmindrentalmobil','https://x.com/transmindnusant']};
var graph=[org,{'@type':'WebSite','@id':origin+'/#website','url':origin+'/','name':'Transmind Nusantara Rental Mobil','publisher':{'@id':origin+'/#organization'},'inLanguage':'id-ID'}];
var cities={'/rental-mobil-jakarta.html':'Jakarta','/rental-mobil-bekasi.html':'Bekasi','/rental-mobil-bogor.html':'Bogor','/rental-mobil-depok.html':'Depok','/rental-mobil-tangerang.html':'Tangerang'};
var city=cities[page];
if(page==='/'||page==='/index.html')graph.push({'@type':'LocalBusiness','@id':origin+'/#localbusiness','name':'Transmind Nusantara Rental Mobil','url':origin+'/','telephone':'+628816654141','logo':origin+'/logo/transmind.png','areaServed':['Jakarta','Bekasi','Bogor','Depok','Tangerang','Jabodetabek'],'description':'Layanan rental mobil Jabodetabek untuk kebutuhan pribadi, bisnis, corporate, wedding dan pariwisata.'});
if(city){graph.push({'@type':'WebPage','@id':origin+page+'#webpage','url':origin+page,'name':document.title,'isPartOf':{'@id':origin+'/#website'},'about':{'@id':origin+'/#organization'},'inLanguage':'id-ID'},{'@type':'Service','@id':origin+page+'#service','name':'Rental Mobil '+city,'provider':{'@id':origin+'/#organization'},'areaServed':{'@type':'City','name':city},'serviceType':['Rental mobil lepas kunci','Rental mobil dengan driver','Rental mobil corporate','Rental mobil wedding','Rental mobil pariwisata']});}
if(page==='/')[['Rental Mobil Lepas Kunci','Jabodetabek'],['Rental Mobil Dengan Driver','Jabodetabek'],['Rental Mobil Corporate','Jabodetabek'],['Rental Mobil Wedding','Jabodetabek'],['Rental Mobil Pariwisata','Jabodetabek']].forEach(function(x){graph.push({'@type':'Service','name':x[0],'provider':{'@id':origin+'/#organization'},'areaServed':x[1]})});
add({'@context':'https://schema.org','@graph':graph},'transmind-seo-schema');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
