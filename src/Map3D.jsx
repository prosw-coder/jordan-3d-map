import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float } from '@react-three/drei';
import * as THREE from 'three';
import { governorates } from './data/governorates.js';

const DATA_URL = 'https://www.geoboundaries.org/api/current/gbOpen/JOR/ADM1/';

function project([lon, lat]) {
  return [(lon - 36.8) * 1.6, (lat - 31.2) * 1.6];
}

function ringToShape(ring) {
  const shape = new THREE.Shape();
  ring.forEach((point, index) => {
    const [x, y] = project(point);
    if (index === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  });
  shape.closePath();
  return shape;
}

function findRecord(feature) {
  const name = feature.properties?.shapeName || feature.properties?.NAME_1 || feature.properties?.name || '';
  const normalized = name.toLowerCase();
  return governorates.find((item) =>
    normalized.includes(item.en.toLowerCase()) ||
    item.en.toLowerCase().includes(normalized) ||
    name.includes(item.name.replace('العاصمة ', ''))
  );
}

function Region({ feature, selected, onSelect }) {
  const record = findRecord(feature);
  const id = record?.id || feature.properties?.shapeID || feature.properties?.shapeName;
  const selectedNow = selected === id;
  const geometry = feature.geometry;

  const shapes = useMemo(() => {
    const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
    return polygons.flatMap((polygon) => {
      if (!polygon?.[0]) return [];
      const shape = ringToShape(polygon[0]);
      polygon.slice(1).forEach((hole) => shape.holes.push(ringToShape(hole)));
      return [shape];
    });
  }, [geometry]);

  return (
    <group onClick={(event) => {
      event.stopPropagation();
      onSelect(record || {
        id,
        name: feature.properties?.shapeName || 'المحافظة',
        en: feature.properties?.shapeName || '',
        description: 'اكتشف تفاصيل هذه المحافظة ومعالمها السياحية.',
        highlights: []
      });
    }}>
      {shapes.map((shape, index) => (
        <mesh key={index} rotation={[-Math.PI / 2, 0, 0]} position={[0, selectedNow ? 0.18 : 0, 0]} castShadow receiveShadow>
          <extrudeGeometry args={[shape, {
            depth: selectedNow ? 0.23 : 0.13,
            bevelEnabled: true,
            bevelSegments: 2,
            steps: 1,
            bevelSize: 0.035,
            bevelThickness: 0.035
          }]} />
          <meshStandardMaterial
            color={selectedNow ? '#d7b878' : (record?.color || '#9eaa91')}
            roughness={0.72}
            metalness={0.08}
          />
        </mesh>
      ))}
    </group>
  );
}

function Scene({ features, selected, onSelect }) {
  const controls = useRef();
  const selectedFeature = features.find((feature) => findRecord(feature)?.id === selected);

  const center = useMemo(() => {
    if (!selectedFeature) return [0, 0];
    const coordinates = selectedFeature.geometry.type === 'Polygon'
      ? selectedFeature.geometry.coordinates.flat(1)
      : selectedFeature.geometry.coordinates.flat(2);

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    coordinates.forEach((point) => {
      const [x, y] = project(point);
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    });
    return [(minX + maxX) / 2, -(minY + maxY) / 2];
  }, [selectedFeature]);

  useFrame(({ camera }) => {
    if (!controls.current) return;
    const target = new THREE.Vector3(center[0], 0, center[1]);
    const destination = selectedFeature
      ? new THREE.Vector3(center[0] + 0.4, 5.8, center[1] + 6.2)
      : new THREE.Vector3(0, 8, 11);
    controls.current.target.lerp(target, 0.055);
    camera.position.lerp(destination, 0.055);
    controls.current.update();
  });

  return (
    <>
      <ambientLight intensity={1.5} />
      <directionalLight position={[5, 9, 6]} intensity={2.1} castShadow />
      <pointLight position={[-5, 3, -4]} intensity={1.2} color="#d4b779" />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.18, 0]} receiveShadow>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#102b27" roughness={1} />
      </mesh>
      <Float speed={0.6} rotationIntensity={0.015} floatIntensity={0.08}>
        <group position={[0, 0.04, 0]}>
          {features.map((feature, index) => (
            <Region key={feature.properties?.shapeID || index} feature={feature} selected={selected} onSelect={onSelect} />
          ))}
        </group>
      </Float>
      <OrbitControls
        ref={controls}
        makeDefault
        enablePan
        minDistance={4}
        maxDistance={19}
        minPolarAngle={0.25}
        maxPolarAngle={1.48}
        target={[0, 0, 0]}
      />
    </>
  );
}

export default function Map3D({ selected, onSelect }) {
  const [features, setFeatures] = useState([]);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const metadata = await fetch(DATA_URL).then((response) => {
          if (!response.ok) throw new Error('Boundary metadata unavailable');
          return response.json();
        });
        const geoJsonUrl = metadata.gjDownloadURL || metadata.simplifiedGeometryGeoJSON;
        if (!geoJsonUrl) throw new Error('GeoJSON URL missing');
        const geoJson = await fetch(geoJsonUrl).then((response) => {
          if (!response.ok) throw new Error('GeoJSON download unavailable');
          return response.json();
        });
        if (active) {
          setFeatures(geoJson.features || []);
          setStatus('ready');
        }
      } catch (error) {
        console.error(error);
        if (active) setStatus('error');
      }
    })();
    return () => { active = false; };
  }, []);

  return (
    <div className="map-stage">
      <Canvas shadows camera={{ position: [0, 8, 11], fov: 38 }} dpr={[1, 1.7]}>
        <color attach="background" args={['#0b211e']} />
        <fog attach="fog" args={['#0b211e', 17, 28]} />
        {features.length > 0 && <Scene features={features} selected={selected} onSelect={onSelect} />}
      </Canvas>
      {status === 'loading' && <div className="map-message"><span className="loader" /> جارٍ تحميل الحدود الجغرافية للمحافظات…</div>}
      {status === 'error' && <div className="map-message">تعذّر تحميل بيانات الحدود الآن. تحقق من الاتصال ثم أعد تحميل الصفحة.</div>}
      <div className="map-hint">اسحب للتدوير · قرّب بإصبعين أو عجلة الفأرة · اضغط على محافظة</div>
    </div>
  );
}
