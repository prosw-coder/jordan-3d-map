import React, {useEffect,useMemo,useState,useRef} from 'react';
import {Canvas, useFrame} from '@react-three/fiber';
import {OrbitControls, Float} from '@react-three/drei';
import * as THREE from 'three';
import {governorates} from './data/governorates.js';

const DATA_URL='https://www.geoboundaries.org/api/current/gbOpen/JOR/ADM1/';
function project([lon,lat]) { return [(lon-36.8)*1.6, (lat-31.2)*1.6]; }
function ringToShape(ring) { const s=new THREE.Shape(); ring.forEach((p,i)=>{const [x,y]=project(p); if(i===0)s.moveTo(x,y);else s.lineTo(x,y);}); s.closePath(); return s; }
function Region({feature,index,selected,onSelect}) {
 const name=feature.properties?.shapeName||feature.properties?.NAME_1||feature.properties?.name||'';
 const record=governorates.find(g=>name.toLowerCase().includes(g.en.toLowerCase())||g.en.toLowerCase().includes(name.toLowerCase())||name.includes(g.name.replace('العاصمة ','')));
 const id=record?.id||String(index); const selectedNow=selected===id;
 const geometry=feature.geometry;
 const shapes=useMemo(()=>{const polys=geometry.type==='Polygon'?[geometry.coordinates]:geometry.coordinates;return polys.flatMap(poly=>{if(!poly?.[0])return[];const shape=ringToShape(poly[0]);poly.slice(1).forEach(h=>shape.holes.push(ringToShape(h)));return [shape];});},[geometry]);
 const color=record?.color||'#9eaa91';
 return <group onClick={(e)=>{e.stopPropagation();onSelect(record||{id,name,en:name,description:'اكتشف تفاصيل هذه المحافظة ومعالمها السياحية.',highlights:[]});}}>
 {shapes.map((shape,i)=><mesh key={i} position={[0,selectedNow?0.18:0,0]} rotation={[-Math.PI/2,0,0]} castShadow receiveShadow><extrudeGeometry args={[shape,{depth:selectedNow?0.23:0.13,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:0.035,bevelThickness:0.035}]} /><meshStandardMaterial color={selectedNow?'#d7b878':color} roughness={0.72} metalness={0.08}/></mesh>)}
 </group>;
}
function Scene({features,selected,onSelect}) {\n const controls=useRef();\n const selectedFeature=features.find((f,i)=>findRecord(f,i)?.id===selected);\n const center=useMemo(()=>{if(!selectedFeature)return [0,0];const coords=selectedFeature.geometry.type==='Polygon'?selectedFeature.geometry.coordinates.flat(1):selectedFeature.geometry.coordinates.flat(2);let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;coords.forEach(p=>{const [x,y]=project(p);minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);});return [(minX+maxX)/2,-(minY+maxY)/2];},[selectedFeature]);\n useFrame(({camera})=>{if(!controls.current)return;const target=new THREE.Vector3(center[0],0,center[1]);const desired=selectedFeature?new THREE.Vector3(center[0]+0.4,5.8,center[1]+6.2):new THREE.Vector3(0,8,11);controls.current.target.lerp(target,0.055);camera.position.lerp(desired,0.055);controls.current.update();});\n return <>
 <ambientLight intensity={1.5}/><directionalLight position={[5,9,6]} intensity={2.1} castShadow/><pointLight position={[-5,3,-4]} intensity={1.2} color="#d4b779"/>
 <mesh rotation={[-Math.PI/2,0,0]} position={[0,-0.18,0]} receiveShadow><planeGeometry args={[30,30]}/><meshStandardMaterial color="#102b27" roughness={1}/></mesh>
 <Float speed={0.6} rotationIntensity={0.015} floatIntensity={0.08}><group position={[0,0.04,0]}>{features.map((f,i)=><Region key={i} feature={f} index={i} selected={selected} onSelect={onSelect}/>)}</group></Float>
 <OrbitControls ref={controls} makeDefault enablePan={true} minDistance={4} maxDistance={19} minPolarAngle={0.25} maxPolarAngle={1.48} target={[0,0,0]}/>
 </>; }
export default function Map3D({selected,onSelect}) {
 const [features,setFeatures]=useState([]); const [status,setStatus]=useState('loading');
 useEffect(()=>{let alive=true;(async()=>{try{const meta=await fetch(DATA_URL).then(r=>{if(!r.ok)throw Error('boundary metadata unavailable');return r.json()});const url=meta.gjDownloadURL||meta.staticDownloadLink||meta.downloadURL; if(!url)throw Error('No GeoJSON URL');const geo=await fetch(url).then(r=>{if(!r.ok)throw Error('GeoJSON unavailable');return r.json()});if(alive){setFeatures(geo.features||[]);setStatus('ready');}}catch(e){console.error(e);if(alive)setStatus('error');}})();return()=>{alive=false};},[]);
 return <div className="map-stage"><Canvas shadows camera={{position:[0,8,11],fov:38}} dpr={[1,1.7]}><color attach="background" args={['#0b211e']}/><fog attach="fog" args={['#0b211e',17,28]}/>{features.length>0&&<Scene features={features} selected={selected} onSelect={onSelect}/>}</Canvas>
 {status==='loading'&&<div className="map-message"><span className="loader"/> جارٍ تحميل الحدود الجغرافية للمحافظات…</div>}
 {status==='error'&&<div className="map-message">تعذّر تحميل بيانات الحدود الآن. تحقق من الاتصال ثم أعد تحميل الصفحة.</div>}
 <div className="map-hint">اسحب للتدوير · قرّب بإصبعين أو عجلة الفأرة · اضغط على محافظة</div>
 </div>;
}
