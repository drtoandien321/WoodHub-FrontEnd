import { useRef, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import Slider from '../components/Slider.js';
import { Canvas, useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';
import { COLORS } from '../theme/colors.js';
import { api } from '../api/client.js';
import { useConfiguratorStore, LIMITS } from '../store/configuratorStore.js';
import { PRODUCT_TYPES, WOOD_MATERIALS, FINISH_COLORS, formatVnd } from '../api/mockData.js';

/*
 * Configurator 3D bản native:
 * - Canvas import từ '@react-three/fiber/native' (render qua expo-gl) — KHÔNG dùng drei
 *   vì hỗ trợ native của drei chưa ổn định (Environment/OrbitControls hay crash).
 * - Thay OrbitControls bằng auto-rotate qua useFrame: đơn giản, mượt, đủ cho demo.
 * - Mô hình parametric DÙNG CHUNG Ý TƯỞNG với web (box primitives, 1 unit = 1m),
 *   logic giá lấy từ configuratorStore — 2 nền tảng luôn ra giá giống nhau.
 */
const m = (cm) => cm / 100;

function Wood({ position, args, color }) {
  return (
    <mesh position={position}>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} roughness={0.65} metalness={0.05} />
    </mesh>
  );
}

function buildParts(type, w, h, d) {
  // Trả về mảng {position, args} cho từng loại — port từ web/FurnitureModel.jsx
  if (type === 'cabinet') {
    const t = 0.02;
    return [
      { position: [0, h / 2, -d / 2 + t / 2], args: [w, h, t] },
      { position: [-w / 2 + t / 2, h / 2, 0], args: [t, h, d] },
      { position: [w / 2 - t / 2, h / 2, 0], args: [t, h, d] },
      { position: [0, h - t / 2, 0], args: [w, t, d] },
      { position: [0, t / 2, 0], args: [w, t, d] },
      { position: [-w / 4, h / 2, d / 2 - t / 2], args: [w / 2 - 0.01, h - 2 * t, t] },
      { position: [w / 4, h / 2, d / 2 - t / 2], args: [w / 2 - 0.01, h - 2 * t, t] },
    ];
  }
  if (type === 'shelf') {
    const t = 0.025, levels = 4;
    const parts = [
      { position: [-w / 2 + t / 2, h / 2, 0], args: [t, h, d] },
      { position: [w / 2 - t / 2, h / 2, 0], args: [t, h, d] },
    ];
    for (let i = 0; i <= levels; i++) {
      parts.push({ position: [0, (h / levels) * i + (i === 0 ? t / 2 : i === levels ? -t / 2 : 0), 0], args: [w - 2 * t, t, d] });
    }
    return parts;
  }
  if (type === 'chair') {
    const seatH = h * 0.5, t = 0.03, leg = 0.04;
    return [
      { position: [0, seatH, 0], args: [w, t, d] },
      { position: [0, seatH + (h - seatH) / 2, -d / 2 + t / 2], args: [w, h - seatH, t] },
      ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z]) => ({ position: [x * (w / 2 - leg), seatH / 2, z * (d / 2 - leg)], args: [leg, seatH, leg] })),
    ];
  }
  // table (mặc định)
  const top = 0.04, leg = 0.06;
  return [
    { position: [0, h - top / 2, 0], args: [w, top, d] },
    ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z]) => ({ position: [x * (w / 2 - leg), (h - top) / 2, z * (d / 2 - leg)], args: [leg, h - top, leg] })),
  ];
}

function FurnitureModel() {
  const groupRef = useRef();
  const { productType, dimensions, materialId, finishId } = useConfiguratorStore();

  // Auto-rotate: mỗi frame xoay nhẹ quanh trục Y (thay cho OrbitControls)
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.4;
  });

  const base = new THREE.Color(WOOD_MATERIALS.find((mat) => mat.id === materialId)?.hexColor ?? '#c8a165');
  const tint = new THREE.Color(FINISH_COLORS.find((f) => f.id === finishId)?.tint ?? '#ffffff');
  const color = base.multiply(tint);

  const parts = buildParts(productType, m(dimensions.width), m(dimensions.height), m(dimensions.depth));

  return (
    <group ref={groupRef} position={[0, -m(dimensions.height) / 2, 0]}>
      {parts.map((p, i) => <Wood key={i} position={p.position} args={p.args} color={color} />)}
    </group>
  );
}

export default function CustomScreen({ navigation }) {
  const { productType, dimensions, materialId, finishId, initForType, setDimension, setMaterial, setFinish, estimatePrice } =
    useConfiguratorStore();
  const [saving, setSaving] = useState(false);
  const limits = LIMITS[productType] ?? LIMITS.table;

  const handleSave = async () => {
    setSaving(true);
    try {
      const design = await api.saveDesign({ productType, dimensions, materialId, finishId });
      navigation.navigate('WorkshopMatch', { designId: design.id });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, gap: 16 }}>
      {/* Khung 3D — chiều cao cố định để ScrollView không tranh gesture với GL view */}
      <View style={styles.canvasBox}>
        <Canvas camera={{ position: [2.2, 1.6, 2.6], fov: 45 }}>
          <ambientLight intensity={0.7} />
          <directionalLight position={[4, 6, 3]} intensity={1.1} />
          <FurnitureModel />
        </Canvas>
      </View>

      {/* Chọn loại sản phẩm */}
      <View style={styles.pillRow}>
        {PRODUCT_TYPES.map((t) => (
          <Pressable key={t.id} onPress={() => initForType(t.id)} style={[styles.pill, productType === t.id && styles.pillActive]}>
            <Text style={[styles.pillText, productType === t.id && styles.pillTextActive]}>{t.emoji} {t.name}</Text>
          </Pressable>
        ))}
      </View>

      {/* Kích thước */}
      <Text style={styles.sectionTitle}>Kích thước (cm)</Text>
      {Object.entries(dimensions).map(([key, value]) => (
        <Slider
          key={key}
          label={{ width: 'Chiều rộng', height: 'Chiều cao', depth: 'Chiều sâu' }[key]}
          value={value}
          min={limits[key][0]}
          max={limits[key][1]}
          onChange={(v) => setDimension(key, v)}
        />
      ))}

      {/* Chất liệu */}
      <Text style={styles.sectionTitle}>Chất liệu gỗ</Text>
      <View style={styles.pillRow}>
        {WOOD_MATERIALS.map((mat) => (
          <Pressable key={mat.id} onPress={() => setMaterial(mat.id)} style={[styles.swatch, materialId === mat.id && styles.swatchActive]}>
            <View style={[styles.swatchColor, { backgroundColor: mat.hexColor }]} />
            <Text style={styles.swatchText}>{mat.name}</Text>
          </Pressable>
        ))}
      </View>

      {/* Màu hoàn thiện */}
      <Text style={styles.sectionTitle}>Màu hoàn thiện</Text>
      <View style={styles.pillRow}>
        {FINISH_COLORS.map((f) => (
          <Pressable key={f.id} onPress={() => setFinish(f.id)} style={[styles.swatch, finishId === f.id && styles.swatchActive]}>
            <View style={[styles.swatchColor, { backgroundColor: f.tint, borderRadius: 999 }]} />
            <Text style={styles.swatchText}>{f.name}</Text>
          </Pressable>
        ))}
      </View>

      {/* Giá ước tính + lưu */}
      <View style={styles.priceBox}>
        <Text style={{ color: COLORS.textMuted, fontSize: 12 }}>Giá ước tính</Text>
        <Text style={styles.priceText}>{formatVnd(estimatePrice())}</Text>
      </View>
      <Pressable onPress={handleSave} disabled={saving} style={[styles.btn, saving && { opacity: 0.7 }]}>
        {saving ? <ActivityIndicator color={COLORS.white} /> : <Text style={styles.btnText}>Lưu thiết kế & tìm xưởng</Text>}
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.ivory },
  canvasBox: { height: 280, borderRadius: 20, overflow: 'hidden', backgroundColor: '#e8ddc8' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: { borderWidth: 1, borderColor: COLORS.oak, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  pillActive: { backgroundColor: COLORS.walnut, borderColor: COLORS.walnut },
  pillText: { fontSize: 12, color: COLORS.walnut },
  pillTextActive: { color: COLORS.white },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: COLORS.text, marginTop: 4 },
  swatch: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: COLORS.ivoryDark, backgroundColor: COLORS.white, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 7 },
  swatchActive: { borderColor: COLORS.walnut, borderWidth: 1.5 },
  swatchColor: { width: 18, height: 18, borderRadius: 5, borderWidth: 1, borderColor: 'rgba(0,0,0,0.1)' },
  swatchText: { fontSize: 12, color: COLORS.text },
  priceBox: { backgroundColor: COLORS.ivoryDark, borderRadius: 16, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceText: { fontSize: 18, fontWeight: '700', color: COLORS.walnut },
  btn: { backgroundColor: COLORS.walnut, borderRadius: 999, paddingVertical: 14, alignItems: 'center', marginBottom: 24 },
  btnText: { color: COLORS.white, fontWeight: '600' },
});
