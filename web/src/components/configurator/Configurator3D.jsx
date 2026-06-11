import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, ContactShadows, Environment } from '@react-three/drei';
import FurnitureModel from './FurnitureModel.jsx';

/*
 * Canvas của react-three-fiber = scene Three.js viết kiểu React component.
 * Mô hình tự re-render khi configuratorStore đổi — không cần imperative code.
 * Component này được lazy-load qua trang CustomConfigure → three.js không
 * dính vào bundle của landing/shop.
 */
export default function Configurator3D() {
  return (
    <Canvas shadows camera={{ position: [2.4, 1.8, 2.8], fov: 45 }} className="touch-none">
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 6, 3]} intensity={1.1} castShadow shadow-mapSize={[1024, 1024]} />
      <Suspense fallback={null}>
        <FurnitureModel />
        {/* Bóng tiếp xúc mềm — rẻ hơn nhiều so với bật shadow map toàn scene */}
        <ContactShadows position={[0, 0, 0]} opacity={0.45} scale={8} blur={2.2} far={3} />
        <Environment preset="apartment" />
      </Suspense>
      <gridHelper args={[10, 20, '#c9b896', '#e0d6c2']} position={[0, 0.001, 0]} />
      <OrbitControls makeDefault minDistance={1.2} maxDistance={7} maxPolarAngle={Math.PI / 2.05} target={[0, 0.6, 0]} />
    </Canvas>
  );
}
