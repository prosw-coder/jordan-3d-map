export async function onRequest({request}) {
 const url=new URL(request.url), q=(url.searchParams.get('q')||'').trim().slice(0,120);
 const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'public, max-age=3600, s-maxage=86400','Access-Control-Allow-Origin':'*'};
 if(!q)return Response.json({error:'Missing image search query',images:[]},{status:400,headers});
 try{
  const api=new URL('https://commons.wikimedia.org/w/api.php');
  api.searchParams.set('action','query');api.searchParams.set('generator','search');api.searchParams.set('gsrsearch',q+' filetype:bitmap');api.searchParams.set('gsrnamespace','6');api.searchParams.set('gsrlimit','10');api.searchParams.set('prop','imageinfo');api.searchParams.set('iiprop','url|extmetadata');api.searchParams.set('iiurlwidth','1800');api.searchParams.set('format','json');api.searchParams.set('origin','*');
  const response=await fetch(api,{headers:{'Accept':'application/json','User-Agent':'DiscoverJordan3D/1.0 (tourism photo gallery)'} ,cf:{cacheTtl:3600,cacheEverything:true}});
  if(!response.ok)throw new Error('Commons API '+response.status);
  const data=await response.json();
  const images=Object.values(data.query?.pages||{}).map(page=>{
   const info=page.imageinfo?.[0]||{},meta=info.extmetadata||{};
   return {pageid:page.pageid,title:page.title,url:info.thumburl||info.url,thumb:info.thumburl||info.url,source:info.descriptionurl,artist:(meta.Artist?.value||'').replace(/<[^>]*>/g,'').slice(0,180),license:meta.LicenseShortName?.value||meta.License?.value||'راجع صفحة المصدر'};
  }).filter(x=>x.url&&x.source);
  return Response.json({images},{headers});
 }catch(error){return Response.json({error:'Image search failed',detail:String(error?.message||error),images:[]},{status:502,headers:{...headers,'Cache-Control':'no-store'}})}
}