import React,{useEffect,useMemo,useRef,useState} from 'react';
import {Canvas,useFrame} from '@react-three/fiber';
import {OrbitControls,Float} from '@react-three/drei';
import * as THREE from 'three';
import {governorates} from './data/governorates.js';
const DATA_URL='https://www.geoboundaries.org/api/current/gbOpen/JOR/ADM1/';
const SCALE=1.6;
const project=([lon,lat])=>[(lon-36.8)*SCALE,(lat-31.2)*SCALE];
const polygons=g=>!g?[]:g.type==='Polygon'?[g.coordinates]:g.type==='MultiPolygon'?g.coordinates:[];
function recordForFeature(feature,index){const name=feature.properties?.shapeName||feature.properties?.NAME_1||feature.properties?.name||'';return governorates.find(g=>name.toLowerCase().includes(g.en.toLowerCase())||g.en.toLowerCase().includes(name.toLowerCase())||name.includes(g.name.replace('العاصمة ','')))||governorates[index]}
function featureCenter(feature){const pts=polygons(feature?.geometry).flat(2).filter(p=>Array.isArray(p)&&typeof p[0]==='number');if(!pts.length)return[0,.1,0];const avg=pts.reduce((a,p)=>[a[0]+p[0]/pts.length,a[1]+p[1]/pts.length],[0,0]);const [x,y]=project(avg);return[x,.1,-y]}
function toShape(ring){const s=new THREE.Shape();ring.forEach((p,i)=>{const [x,y]=project(p);i?s.lineTo(x,y):s.moveTo(x,y)});s.closePath();return s}
function Region({feature,index,selected,onSelect}){
 const geometry=feature.geometry;
 const record=recordForFeature(feature,index);
 const shapes=useMemo(()=>polygons(geometry).flatMap(poly=>{if(!poly?.[0])return[];const s=toShape(poly[0]);poly.slice(1).forEach(h=>s.holes.push(toShape(h)));return[s]}),[geometry]);
 const center=useMemo(()=>{const pts=polygons(geometry).flat(2).filter(p=>Array.isArray(p)&&typeof p[0]==='number');if(!pts.length)return[0,.1,0];const avg=pts.reduce((a,p)=>[a[0]+p[0]/pts.length,a[1]+p[1]/pts.length],[0,0]);const [x,y]=project(avg);return[x,.1,-y]},[geometry]);
 return <group onClick={e=>{e.stopPropagation();onSelect({...record,center})}}>
 {shapes.map((shape,i)=><mesh key={i} position={[0,selected?.id===record?.id?0.18:0,0]} rotation={[-Math.PI/2,0,0]} castShadow receiveShadow><extrudeGeometry args={[shape,{depth:selected?.id===record?.id?0.23:0.13,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.035,bevelThickness:.035}]}/><meshStandardMaterial color={selected?.id===record?.id?'#d7b878':record?.color||'#9eaa91'} roughness={.72} metalness={.08}/></mesh>)}
 </group>
}
function Scene({features,selected,onSelect}){
 const controls=useRef();const target=useRef(new THREE.Vector3());
 const selectedFeature=features.find((feature,index)=>recordForFeature(feature,index)?.id===selected?.id);
 useEffect(()=>{const center=selected?.center||featureCenter(selectedFeature);target.current.set(center?.[0]||0,0,center?.[2]||0)},[selected?.id,selected?.center,selectedFeature]);
 useFrame(({camera},dt)=>{if(!controls.current)return;const a=1-Math.exp(-dt*2.6);controls.current.target.lerp(target.current,a);const offset=selected?new THREE.Vector3(.6,5.7,6.3):new THREE.Vector3(0,8,11);camera.position.lerp(target.current.clone().add(offset),a);controls.current.update()});
 return <><ambientLight intensity={1.5}/><directionalLight position={[5,9,6]} intensity={2.1} castShadow/><pointLight position={[-5,3,-4]} intensity={1.2} color="#d4b779"/><mesh rotation={[-Math.PI/2,0,0]} position={[0,-.18,0]} receiveShadow><planeGeometry args={[30,30]}/><meshStandardMaterial color="#102b27" roughness={1}/></mesh><Float speed={.55} rotationIntensity={.012} floatIntensity={.045}><group position={[0,.04,0]}>{features.map((f,i)=><Region key={f.properties?.shapeID||i} feature={f} index={i} selected={selected} onSelect={onSelect}/>)}</group></Float><OrbitControls ref={controls} makeDefault enablePan enableDamping dampingFactor={.08} minDistance={4} maxDistance={19} minPolarAngle={.25} maxPolarAngle={1.48}/></>
}
export default function Map3D({selected,onSelect}){
 const [features,setFeatures]=useState([]);const [status,setStatus]=useState('loading');
 useEffect(()=>{let active=true;(async()=>{try{const mr=await fetch(DATA_URL);if(!mr.ok)throw Error('Boundary metadata unavailable');const meta=await mr.json();const url=meta.gjDownloadURL||meta.staticDownloadLink||meta.downloadURL;if(!url)throw Error('GeoJSON URL missing');const gr=await fetch(url);if(!gr.ok)throw Error('GeoJSON unavailable');const geo=await gr.json();if(!Array.isArray(geo.features)||geo.features.length!==12)throw Error('Expected 12 governorates');if(active){setFeatures(geo.features);setStatus('ready')}}catch(e){console.error('Jordan boundaries:',e);if(active)setStatus('error')}})();return()=>{active=false}},[]);
 return <div className="map-stage"><Canvas shadows camera={{position:[0,8,11],fov:38}} dpr={[1,1.7]}><color attach="background" args={['#0b211e']}/><fog attach="fog" args={['#0b211e',17,28]}/>{features.length>0&&<Scene features={features} selected={selected} onSelect={onSelect}/>}</Canvas>{status==='loading'&&<div className="map-message"><span className="loader"/> جارٍ تحميل الحدود الجغرافية للمحافظات…</div>}{status==='error'&&<div className="map-message">تعذّر تحميل بيانات الحدود الآن. تحقق من الاتصال ثم أعد تحميل الصفحة.</div>}<div className="map-hint">اسحب للتدوير · قرّب بإصبعين أو عجلة الفأرة · اضغط على محافظة</div></div>
}