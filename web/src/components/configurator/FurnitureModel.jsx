import { useMemo } from 'react';
import * as THREE from 'three';
import { WOOD_MATERIALS, FINISH_COLORS } from '../../api/mock/customData.js';
import { useConfiguratorStore } from '../../stores/configuratorStore.js';

/*
 * Mô hình PARAMETRIC dựng từ box primitives thay vì load file .glb.
 * Tại sao chọn cách này cho MVP:
 * - Không cần asset 3D (team chưa có model gỗ thật) → demo được ngay
 * - Scale từng bộ phận theo dimensions THẬT (đổi width chỉ giãn mặt bàn,
 *   chân bàn giữ nguyên tiết diện) — đẹp hơn scale cả model .glb (chân bị béo ra)
 * - V1: thay từng <mesh> bằng node của file .glb + texture vân gỗ PBR, store giữ nguyên.
 *
 * useMemo: chỉ tính lại màu khi material/finish đổi — tránh tạo THREE.Color mới mỗi frame.
 */
function useWoodColor() {
  const materialId = useConfiguratorStore((s) => s.materialId);
  const finishId = useConfiguratorStore((s) => s.finishId);
  return useMemo(() => {
    const base = new THREE.Color(WOOD_MATERIALS.find((m) => m.id === materialId)?.hexColor ?? '#c8a165');
    const tint = new THREE.Color(FINISH_COLORS.find((f) => f.id === finishId)?.tint ?? '#ffffff');
    return base.multiply(tint); // nhân màu = giả lập lớp hoàn thiện phủ lên vân gỗ
  }, [materialId, finishId]);
}

// Đơn vị scene: 1 unit = 1m → chia cm cho 100
const m = (cm) => cm / 100;

function Wood({ position, args, color }) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} roughness={0.65} metalness={0.05} />
    </mesh>
  );
}

function Table({ w, h, d, color }) {
  const top = 0.04, leg = 0.06;
  return (
    <group>
      <Wood position={[0, h - top / 2, 0]} args={[w, top, d]} color={color} />
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], i) => (
        <Wood key={i} position={[x * (w / 2 - leg), (h - top) / 2, z * (d / 2 - leg)]} args={[leg, h - top, leg]} color={color} />
      ))}
    </group>
  );
}

function Cabinet({ w, h, d, color }) {
  const t = 0.02;
  return (
    <group>
      <Wood position={[0, h / 2, -d / 2 + t / 2]} args={[w, h, t]} color={color} />
      <Wood position={[-w / 2 + t / 2, h / 2, 0]} args={[t, h, d]} color={color} />
      <Wood position={[w / 2 - t / 2, h / 2, 0]} args={[t, h, d]} color={color} />
      <Wood position={[0, h - t / 2, 0]} args={[w, t, d]} color={color} />
      <Wood position={[0, t / 2, 0]} args={[w, t, d]} color={color} />
      {/* 2 cánh cửa hé ra một chút để thấy chiều sâu */}
      <Wood position={[-w / 4, h / 2, d / 2 - t / 2]} args={[w / 2 - 0.01, h - 2 * t, t]} color={color} />
      <Wood position={[w / 4, h / 2, d / 2 - t / 2]} args={[w / 2 - 0.01, h - 2 * t, t]} color={color} />
    </group>
  );
}

function Shelf({ w, h, d, color }) {
  const t = 0.025;
  const levels = 4;
  return (
    <group>
      <Wood position={[-w / 2 + t / 2, h / 2, 0]} args={[t, h, d]} color={color} />
      <Wood position={[w / 2 - t / 2, h / 2, 0]} args={[t, h, d]} color={color} />
      {Array.from({ length: levels + 1 }, (_, i) => (
        <Wood key={i} position={[0, (h / levels) * i + (i === 0 ? t / 2 : i === levels ? -t / 2 : 0), 0]} args={[w - 2 * t, t, d]} color={color} />
      ))}
    </group>
  );
}

function Chair({ w, h, d, color }) {
  const seatH = h * 0.5, t = 0.03, leg = 0.04;
  return (
    <group>
      <Wood position={[0, seatH, 0]} args={[w, t, d]} color={color} />
      <Wood position={[0, seatH + (h - seatH) / 2, -d / 2 + t / 2]} args={[w, h - seatH, t]} color={color} />
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z], i) => (
        <Wood key={i} position={[x * (w / 2 - leg), seatH / 2, z * (d / 2 - leg)]} args={[leg, seatH, leg]} color={color} />
      ))}
    </group>
  );
}

const MODELS = { table: Table, cabinet: Cabinet, shelf: Shelf, chair: Chair };

export default function FurnitureModel() {
  const productType = useConfiguratorStore((s) => s.productType);
  const dims = useConfiguratorStore((s) => s.dimensions);
  const color = useWoodColor();
  const Model = MODELS[productType] ?? Table;
  return <Model w={m(dims.width)} h={m(dims.height)} d={m(dims.depth)} color={color} />;
}
