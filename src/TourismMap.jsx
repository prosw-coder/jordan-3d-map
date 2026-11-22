import React,{useEffect,useRef,useState} from 'react';
import maplibregl,{setRTLTextPlugin} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {governorates} from './data/governorates.js';
import {attractions} from './data/tourism.js';
const matchGov=(feature)=>{const n=String(feature.properties?.shapeName||feature.properties?.NAME_1||feature.properties?.name||'').toLowerCase();return governorates.find(g=>n.includes(g.en.toLowerCase())||g.en.toLowerCase().includes(n)||n.includes(g.name.replace('العاصمة ','').toLowerCase()))?.id||''};
const collection=(items)=>({type:'FeatureCollection',features:items.map(p=>({type:'Feature',properties:{...p},geometry:{type:'Point',coordinates:p.coords}}))});
const settlements=[
{name:'إربد',coords:[35.85,32.55]},{name:'الرمثا',coords:[36.00,32.56]},{name:'الحصن',coords:[35.88,32.48]},
{name:'عجلون',coords:[35.75,32.33]},{name:'عنجرة',coords:[35.71,32.31]},{name:'كفرنجة',coords:[35.66,32.34]},
{name:'جرش',coords:[35.89,32.28]},{name:'سوف',coords:[35.84,32.36]},{name:'ساكب',coords:[35.82,32.27]},
{name:'السلط',coords:[35.73,32.04]},{name:'الفحيص',coords:[35.78,32.00]},{name:'دير علا',coords:[35.62,32.20]},
{name:'المفرق',coords:[36.20,32.34]},{name:'أم الجمال',coords:[36.37,32.33]},{name:'رحاب',coords:[36.10,32.10]},
{name:'الزرقاء',coords:[36.09,32.07]},{name:'الرصيفة',coords:[36.05,32.02]},{name:'الأزرق',coords:[36.83,31.83]},
{name:'مادبا',coords:[35.80,31.72]},{name:'ذيبان',coords:[35.78,31.50]},{name:'ماعين',coords:[35.61,31.60]},
{name:'عمّان',coords:[35.93,31.95]},{name:'ناعور',coords:[35.83,31.88]},{name:'سحاب',coords:[36.00,31.87]},
{name:'الكرك',coords:[35.70,31.18]},{name:'المزار الجنوبي',coords:[35.70,31.06]},{name:'غور الصافي',coords:[35.47,31.03]},
{name:'الطفيلة',coords:[35.62,30.84]},{name:'بصيرا',coords:[35.62,30.74]},{name:'القادسية',coords:[35.55,30.80]},
{name:'معان',coords:[35.73,30.19]},{name:'وادي موسى',coords:[35.48,30.32]},{name:'الشوبك',coords:[35.56,30.52]},
{name:'العقبة',coords:[35.00,29.53]},{name:'القويرة',coords:[35.31,29.82]},{name:'الديسة',coords:[35.48,29.66]}
];
export default function TourismMap({selectedGov,onSelectGov,selectedPlace,onSelectPlace}){
 const host=useRef(null),mapRef=useRef(null),ready=useRef(false),[mapReady,setMapReady]=useState(false),[mapError,setMapError]=useState(''),[is3D,setIs3D]=useState(true);
 useEffect(()=>{
  if(!host.current||mapRef.current)return;
  try{setRTLTextPlugin('https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.3.0/dist/mapbox-gl-rtl-text.js',null,true)}catch(e){};
  const map=new maplibregl.Map({container:host.current,style:'https://tiles.openfreemap.org/styles/liberty',center:[36.15,31.25],zoom:6.35,pitch:68,bearing:-9,antialias:true,attributionControl:true});
  mapRef.current=map;
  map.addControl(new maplibregl.NavigationControl({visualizePitch:true}), 'top-left');
  map.on('error',e=>{if(!ready.current&&e?.error)setMapError('قد يتأخر تحميل طبقات الخريطة حسب الاتصال بالإنترنت.')});
  map.on('load',async()=>{
   ready.current=true;
   try{
    map.addSource('terrain-dem',{type:'raster-dem',tiles:['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],tileSize:256,maxzoom:15,encoding:'terrarium'});
    map.setTerrain({source:'terrain-dem',exaggeration:2.05});\n    try{map.setFog({color:'#d8e1d4','high-color':'#7f9c91','horizon-blend':0.12,'space-color':'#10251f','star-intensity':0.08})}catch(e){}\n    const vectorSource=Object.keys(map.getStyle().sources||{}).find(k=>map.getStyle().sources[k].type==='vector');\n    if(vectorSource){try{map.addLayer({id:'jordan-3d-buildings',type:'fill-extrusion',source:vectorSource,'source-layer':'building',minzoom:13.2,filter:['all',['!=',['get','hide_3d'],true]],paint:{'fill-extrusion-color':['interpolate',['linear'],['coalesce',['get','render_height'],['get','height'],8],0,'#b9a98a',35,'#8f927e',100,'#737f73'],'fill-extrusion-height':['coalesce',['get','render_height'],['get','height'],8],'fill-extrusion-base':['coalesce',['get','render_min_height'],['get','min_height'],0],'fill-extrusion-opacity':0.88,'fill-extrusion-vertical-gradient':true}})}catch(e){console.info('3D buildings layer unavailable',e)}}
    const hillshade={id:'terrain-shade',type:'hillshade',source:'terrain-dem',paint:{'hillshade-exaggeration':0.32,'hillshade-shadow-color':'#26372f','hillshade-highlight-color':'#d4c49c'}};const firstSymbol=map.getStyle().layers.find(layer=>layer.type==='symbol')?.id;if(firstSymbol)map.addLayer(hillshade,firstSymbol);else map.addLayer(hillshade);
    const res=await fetch('/api/boundaries');
    if(!res.ok)throw new Error('boundary '+res.status);
    const geo=await res.json();
    geo.features=geo.features.map(f=>({...f,properties:{...f.properties,govId:matchGov(f)}}));
    map.addSource('governorates',{type:'geojson',data:geo});
    map.addLayer({id:'governorates-fill',type:'fill',source:'governorates',paint:{'fill-color':['match',['get','govId'],'amman','#c3a06c','irbid','#779b78','ajloun','#789c7a','jerash','#bd9367','balqa','#d1b878','mafraq','#a99a79','zarqa','#8da39a','madaba','#c6a47c','karak','#ad8069','tafilah','#879b7b','maan','#c19b6b','aqaba','#69999a','#82978b'],'fill-opacity':0.22}});
    map.addLayer({id:'governorates-outline',type:'line',source:'governorates',paint:{'line-color':'#e6d2a4','line-width':1.5,'line-opacity':0.9}});
    map.addSource('gov-labels',{type:'geojson',data:collection(governorates.map(g=>({id:g.id,name:g.name,coords:g.center})))});
    map.addLayer({id:'gov-labels',type:'symbol',source:'gov-labels',layout:{'text-field':['get','name'],'text-font':['Noto Sans Arabic UI Regular','Noto Sans Regular'],'text-size':13,'text-allow-overlap':false,'text-ignore-placement':false},paint:{'text-color':'#fff8e8','text-halo-color':'#10231e','text-halo-width':2}});
    map.addSource('settlements',{type:'geojson',data:collection(settlements)});
    map.addLayer({id:'settlement-labels',type:'symbol',source:'settlements',minzoom:7.1,layout:{'text-field':['get','name'],'text-font':['Noto Sans Arabic UI Regular','Noto Sans Regular'],'text-size':10,'text-allow-overlap':false,'text-ignore-placement':false},paint:{'text-color':'#e5eadc','text-halo-color':'#162c26','text-halo-width':2}});
    map.addSource('attractions',{type:'geojson',data:collection(attractions),promoteId:'id'});
    map.addLayer({id:'attraction-halo',type:'circle',source:'attractions',paint:{'circle-radius':['interpolate',['linear'],['zoom'],5,9,9,15,13,20],'circle-color':'#d8b777','circle-opacity':0.18}});
    map.addLayer({id:'attraction-points',type:'circle',source:'attractions',paint:{'circle-radius':['interpolate',['linear'],['zoom'],5,4,9,7,13,9],'circle-color':['case',['boolean',['feature-state','selected'],false],'#fff0bd','#d8b777'],'circle-stroke-color':['case',['boolean',['feature-state','selected'],false],'#e2bd70','#fff6dd'],'circle-stroke-width':['case',['boolean',['feature-state','selected'],false],3,1.5],'circle-opacity':0.98}});
    map.addLayer({id:'attraction-labels',type:'symbol',source:'attractions',minzoom:6.3,layout:{'text-field':['get','name'],'text-font':['Noto Sans Arabic UI Regular','Noto Sans Regular'],'text-size':11,'text-offset':[0,1.25],'text-anchor':'top','text-optional':true},paint:{'text-color':'#fff4d8','text-halo-color':'#10231e','text-halo-width':2}});
    map.on('click','attraction-points',e=>{const id=e.features?.[0]?.properties?.id;const p=attractions.find(x=>x.id===id);if(p)onSelectPlace(p)});
    map.on('mouseenter','attraction-points',()=>map.getCanvas().style.cursor='pointer');
    map.on('mouseleave','attraction-points',()=>map.getCanvas().style.cursor='');
    map.on('mouseenter','attraction-points',()=>map.getCanvas().style.cursor='pointer');
    map.on('mouseleave','attraction-points',()=>map.getCanvas().style.cursor='');
    map.on('click','governorates-fill',e=>{const id=e.features?.[0]?.properties?.govId;const g=governorates.find(x=>x.id===id);if(g)onSelectGov(g)});
    map.on('mouseenter','governorates-fill',()=>map.getCanvas().style.cursor='pointer');
    map.on('mouseleave','governorates-fill',()=>map.getCanvas().style.cursor='');
    ready.current=true;setMapReady(true);
   }catch(err){console.error('Map layers:',err);setMapError('تعذّر تحميل حدود المحافظات. ستبقى خريطة التضاريس متاحة.')};
  });
  return()=>{map.remove();mapRef.current=null;ready.current=false};
 },[]);
 useEffect(()=>{const map=mapRef.current;if(!map||!mapReady||!selectedGov||!map.getLayer('governorates-fill'))return;map.setPaintProperty('governorates-fill','fill-opacity',['case',['==',['get','govId'],selectedGov.id],0.58,0.12]);map.flyTo({center:selectedGov.center,zoom:8.1,pitch:is3D?68:0,bearing:is3D?-9:0,duration:1500,essential:true})},[selectedGov,mapReady,is3D]);
 useEffect(()=>{const map=mapRef.current;if(!map||!mapReady)return;const source=map.getSource('attractions');if(!source)return;const features=map.querySourceFeatures('attractions');features.forEach(f=>{if(f.properties?.id)map.setFeatureState({source:'attractions',id:f.properties.id},{selected:!!selectedPlace&&f.properties.id===selectedPlace.id})});if(selectedPlace)map.flyTo({center:selectedPlace.coords,zoom:10.5,pitch:is3D?68:0,bearing:is3D?-9:0,duration:1500,essential:true})},[selectedPlace,mapReady,is3D]);
 const toggleDimension=()=>{const map=mapRef.current;if(!map||!mapReady)return;const next=!is3D;setIs3D(next);if(next){map.setTerrain({source:'terrain-dem',exaggeration:2.05});map.easeTo({pitch:68,bearing:-9,duration:1000,essential:true})}else{map.setTerrain(null);map.easeTo({pitch:0,bearing:0,duration:1000,essential:true})}};
 return <div className="real-map-wrap"><div ref={host} className="real-map-canvas"/>{mapError&&<div className="map-status">{mapError}</div>}<div className="terrain-chip">{is3D?'تضاريس ثلاثية الأبعاد':'عرض مسطح ثنائي الأبعاد'} · أسماء عربية · مواقع سياحية</div><button className="dimension-toggle" onClick={toggleDimension} disabled={!mapReady}><span className={is3D?'dimension-icon active':'dimension-icon'}>3D</span><span>{is3D?'إيقاف 3D':'تفعيل 3D'}</span></button></div>;
}
