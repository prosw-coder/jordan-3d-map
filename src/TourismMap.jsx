import React,{useEffect,useRef,useState} from 'react';
import maplibregl,{setRTLTextPlugin} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {governorates} from './data/governorates.js';
import {attractions} from './data/tourism.js';
const matchGov=(feature)=>{const n=String(feature.properties?.shapeName||feature.properties?.NAME_1||feature.properties?.name||'').toLowerCase();return governorates.find(g=>n.includes(g.en.toLowerCase())||g.en.toLowerCase().includes(n)||n.includes(g.name.replace('العاصمة ','').toLowerCase()))?.id||''};
const collection=(items)=>({type:'FeatureCollection',features:items.map(p=>({type:'Feature',properties:{...p},geometry:{type:'Point',coordinates:p.coords}}))});
export default function TourismMap({selectedGov,onSelectGov,selectedPlace,onSelectPlace}){
 const host=useRef(null),mapRef=useRef(null),ready=useRef(false),[mapReady,setMapReady]=useState(false),[mapError,setMapError]=useState('');
 useEffect(()=>{
  if(!host.current||mapRef.current)return;
  try{setRTLTextPlugin('https://unpkg.com/@mapbox/mapbox-gl-rtl-text@0.3.0/dist/mapbox-gl-rtl-text.js',null,true)}catch(e){};
  const map=new maplibregl.Map({container:host.current,style:'https://tiles.openfreemap.org/styles/liberty',center:[36.15,31.25],zoom:6.15,pitch:56,bearing:-7,antialias:true,attributionControl:true});
  mapRef.current=map;
  map.addControl(new maplibregl.NavigationControl({visualizePitch:true}), 'top-left');
  map.on('error',e=>{if(!ready.current&&e?.error)setMapError('قد يتأخر تحميل طبقات الخريطة حسب الاتصال بالإنترنت.')});
  map.on('load',async()=>{
   ready.current=true;
   try{
    map.addSource('terrain-dem',{type:'raster-dem',tiles:['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],tileSize:256,maxzoom:15,encoding:'terrarium'});
    map.setTerrain({source:'terrain-dem',exaggeration:1.35});
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
    map.addSource('attractions',{type:'geojson',data:collection(attractions)});
    map.addLayer({id:'attraction-points',type:'circle',source:'attractions',paint:{'circle-radius':['interpolate',['linear'],['zoom'],5,4,9,7,13,9],'circle-color':'#d8b777','circle-stroke-color':'#fff6dd','circle-stroke-width':1.5,'circle-opacity':0.98}});
    map.addLayer({id:'attraction-labels',type:'symbol',source:'attractions',minzoom:6.3,layout:{'text-field':['get','name'],'text-font':['Noto Sans Arabic UI Regular','Noto Sans Regular'],'text-size':11,'text-offset':[0,1.25],'text-anchor':'top','text-optional':true},paint:{'text-color':'#fff4d8','text-halo-color':'#10231e','text-halo-width':2}});
    map.on('click','attraction-points',e=>{const id=e.features?.[0]?.properties?.id;const p=attractions.find(x=>x.id===id);if(p)onSelectPlace(p)});
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
 useEffect(()=>{const map=mapRef.current;if(!map||!mapReady||!selectedGov||!map.getLayer('governorates-fill'))return;map.setPaintProperty('governorates-fill','fill-opacity',['case',['==',['get','govId'],selectedGov.id],0.58,0.12]);map.flyTo({center:selectedGov.center,zoom:8.1,pitch:62,duration:1500,essential:true})},[selectedGov,mapReady]);
 useEffect(()=>{const map=mapRef.current;if(!map||!mapReady||!selectedPlace)return;map.flyTo({center:selectedPlace.coords,zoom:10.5,pitch:64,duration:1300,essential:true})},[selectedPlace,mapReady]);
 return <div className="real-map-wrap"><div ref={host} className="real-map-canvas"/>{mapError&&<div className="map-status">{mapError}</div>}<div className="terrain-chip">تضاريس ثلاثية الأبعاد · أسماء عربية · مواقع سياحية</div></div>;
}
