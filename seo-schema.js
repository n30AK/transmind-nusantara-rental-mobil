/* TRANSMIND SEO — unified structured data layer v5
   Adds missing schema to public pages without fabricating facts.
*/
(function(){
'use strict';

var ORIGIN='https://transmindnusantararentalmobil.co.id';
var BUSINESS_ID=ORIGIN+'/#localbusiness';
var ORG_ID=ORIGIN+'/#organization';
var SITE_ID=ORIGIN+'/#website';

function clean(v){return String(v||'').trim();}
function add(data,id){
  if(document.getElementById(id)) return;
  var s=document.createElement('script');
  s.type='application/ld+json';
  s.id=id;
  s.textContent=JSON.stringify(data);
  document.head.appendChild(s);
}
function existingTypes(){
  var out={};
  document.querySelectorAll('script[type="application/ld+json"]').forEach(function(node){
    try{
      var x=JSON.parse(node.textContent||'{}');
      var list=Array.isArray(x['@graph'])?x['@graph']:[x];
      list.forEach(function(item){
        if(item&&item['@type']) {
          (Array.isArray(item['@type'])?item['@type']:[item['@type']]).forEach(function(t){out[t]=true;});
        }
      });
    }catch(_){}
  });
  return out;
}
function business(){
  return {
    '@type':'AutoRental',
    '@id':BUSINESS_ID,
    'name':'Transmind Nusantara Rental Mobil',
    'url':ORIGIN+'/',
    'telephone':'+628816654141',
    'logo':ORIGIN+'/logo/transmind.png',
    'image':ORIGIN+'/logo/transmind.png',
    'areaServed':['Jakarta','Bekasi','Bogor','Depok','Tangerang','Jabodetabek'],
    'description':'Layanan rental mobil Jabodetabek untuk kebutuhan pribadi, bisnis, corporate, wedding dan pariwisata.',
    'address':{
      '@type':'PostalAddress',
      'streetAddress':'Jl. Taman Tulip Raya No.18 Blk C2, RT.003/RW.026, Pejuang, Kecamatan Medan Satria',
      'addressLocality':'Bekasi',
      'addressRegion':'Jawa Barat',
      'postalCode':'17131',
      'addressCountry':'ID'
    },
    'contactPoint':[{
      '@type':'ContactPoint',
      'contactType':'customer service',
      'telephone':'+628816654141',
      'availableLanguage':['id-ID']
    }],
    'hasMap':'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent('Jl. Taman Tulip Raya No.18 Blk C2, Pejuang, Medan Satria, Bekasi, Jawa Barat 17131'),
    'sameAs':[
      'https://www.instagram.com/transmind.nusantara/',
      'https://www.tiktok.com/@transmindrentalmobil',
      'https://x.com/transmindnusant'
    ]
  };
}
function organization(){
  return {
    '@type':'Organization',
    '@id':ORG_ID,
    'name':'Transmind Nusantara Rental Mobil',
    'url':ORIGIN+'/',
    'logo':ORIGIN+'/logo/transmind.png',
    'telephone':'+628816654141',
    'sameAs':[
      'https://www.instagram.com/transmind.nusantara/',
      'https://www.tiktok.com/@transmindrentalmobil',
      'https://x.com/transmindnusant'
    ]
  };
}
function website(){
  return {
    '@type':'WebSite',
    '@id':SITE_ID,
    'url':ORIGIN+'/',
    'name':'Transmind Nusantara Rental Mobil',
    'publisher':{'@id':ORG_ID},
    'inLanguage':'id-ID'
  };
}
function pageDescription(){
  return clean(document.querySelector('meta[name="description"]')?.content);
}
function pageTitle(){return clean(document.title)||'Transmind Nusantara Rental Mobil';}
function pageUrl(){return ORIGIN+(location.pathname==='/'?'/':location.pathname);}
function pathLabel(path){
  var map={
    '/rental-mobil-jakarta.html':'Rental Mobil Jakarta',
    '/rental-mobil-bekasi.html':'Rental Mobil Bekasi',
    '/rental-mobil-bogor.html':'Rental Mobil Bogor',
    '/rental-mobil-depok.html':'Rental Mobil Depok',
    '/rental-mobil-tangerang.html':'Rental Mobil Tangerang',
    '/rental-mobil-jabodetabek.html':'Rental Mobil Jabodetabek',
    '/rental-mobil-lepas-kunci-jabodetabek.html':'Rental Mobil Lepas Kunci Jabodetabek',
    '/rental-mobil-dengan-driver-jabodetabek.html':'Rental Mobil Dengan Driver Jabodetabek',
    '/rental-mobil-corporate-jabodetabek.html':'Rental Mobil Corporate Jabodetabek',
    '/rental-mobil-wedding-jabodetabek.html':'Rental Mobil Wedding Jabodetabek',
    '/rental-mobil-pariwisata-jabodetabek.html':'Rental Mobil Pariwisata Jabodetabek'
  };
  return map[path]||pageTitle();
}
function serviceType(path){
  if(path.indexOf('lepas-kunci')>=0)return 'Rental Mobil Lepas Kunci';
  if(path.indexOf('dengan-driver')>=0)return 'Rental Mobil Dengan Driver';
  if(path.indexOf('corporate')>=0)return 'Rental Mobil Corporate';
  if(path.indexOf('wedding')>=0)return 'Rental Mobil Wedding';
  if(path.indexOf('pariwisata')>=0)return 'Rental Mobil Pariwisata';
  if(/rental-mobil-(jakarta|bekasi|bogor|depok|tangerang)\.html$/.test(path))return 'Rental Mobil';
  return 'Rental Mobil Jabodetabek';
}
function breadcrumb(path,label){
  var items=[{
    '@type':'ListItem',
    'position':1,
    'name':'Transmind Nusantara Rental Mobil',
    'item':ORIGIN+'/'
  }];
  if(path!=='/'&&path!=='/index.html'){
    items.push({'@type':'ListItem','position':2,'name':label,'item':pageUrl()});
  }
  return {
    '@type':'BreadcrumbList',
    '@id':pageUrl()+'#breadcrumb',
    'itemListElement':items
  };
}
function webPage(path){
  return {
    '@type':'WebPage',
    '@id':pageUrl()+'#webpage',
    'url':pageUrl(),
    'name':pageTitle(),
    'description':pageDescription(),
    'isPartOf':{'@id':SITE_ID},
    'about':{'@id':ORG_ID},
    'inLanguage':'id-ID'
  };
}
function article(path){
  return {
    '@type':'Article',
    '@id':pageUrl()+'#article',
    'headline':pageTitle(),
    'description':pageDescription(),
    'mainEntityOfPage':pageUrl(),
    'author':{'@type':'Organization','name':'Transmind Nusantara Rental Mobil','url':ORIGIN+'/'},
    'publisher':{'@id':ORG_ID},
    'inLanguage':'id-ID',
    'dateModified':clean(document.querySelector('meta[property="article:modified_time"]')?.content)||'2026-10-03'
  };
}
function service(path){
  var label=pathLabel(path);
  return {
    '@type':'Service',
    '@id':pageUrl()+'#service',
    'name':label,
    'url':pageUrl(),
    'serviceType':serviceType(path),
    'provider':{'@id':BUSINESS_ID},
    'areaServed':[
      {'@type':'City','name':'Jakarta'},
      {'@type':'City','name':'Bekasi'},
      {'@type':'City','name':'Bogor'},
      {'@type':'City','name':'Depok'},
      {'@type':'City','name':'Tangerang'}
    ],
    'inLanguage':'id-ID'
  };
}
function boot(){
  var path=location.pathname||'/';
  if(path.indexOf('/admin')===0||path.indexOf('/nexus')===0) return;

  var types=existingTypes();
  var graph=[organization(),website()];

  if(path==='/'||path==='/index.html'){
    if(!types.AutoRental) graph.push(business());
    if(!types.WebPage) graph.push(webPage('/'));
    if(!types.BreadcrumbList) graph.push(breadcrumb('/','Transmind Nusantara Rental Mobil'));
    [
      ['Rental Mobil Lepas Kunci','/rental-mobil-lepas-kunci-jabodetabek.html'],
      ['Rental Mobil Dengan Driver','/rental-mobil-dengan-driver-jabodetabek.html'],
      ['Rental Mobil Corporate','/rental-mobil-corporate-jabodetabek.html'],
      ['Rental Mobil Wedding','/rental-mobil-wedding-jabodetabek.html'],
      ['Rental Mobil Pariwisata','/rental-mobil-pariwisata-jabodetabek.html']
    ].forEach(function(x){
      var id=ORIGIN+x[1]+'#service';
      if(!document.querySelector('script[type="application/ld+json"]')?.textContent?.includes(id)){
        graph.push({'@type':'Service','@id':id,'name':x[0],'url':ORIGIN+x[1],'provider':{'@id':BUSINESS_ID},'areaServed':{'@type':'AdministrativeArea','name':'Jabodetabek'},'inLanguage':'id-ID'});
      }
    });
  }else{
    var label=pathLabel(path);
    if(!types.WebPage) graph.push(webPage(path));
    if(!types.BreadcrumbList) graph.push(breadcrumb(path,label));
    if(path.indexOf('/rental-mobil-')===0&&!types.Service) graph.push(service(path));
    if(path.indexOf('/panduan-')===0&&!types.Article) graph.push(article(path));
  }

  add({'@context':'https://schema.org','@graph':graph},'transmind-seo-schema-v5');
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();