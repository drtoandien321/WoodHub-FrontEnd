import React from 'react';
import { View, Pressable } from 'react-native';
import { Photo, T, Tag3D } from './ui.js';
import { useTheme } from '../theme/theme.js';
import { formatVnd } from '../utils/format.js';
import { TYPE_LABELS } from '../utils/woods.js';

// Thẻ mẫu 3D (cuộn ngang ở Home, lưới ở Templates)
export function ModelCard({ model, onPress, width = 156 }) {
  const { c } = useTheme();
  return (
    <Pressable onPress={onPress} style={{ width }}>
      <View>
        <Photo uri={model.posterUrl} label={model.slug} style={typeof width === 'number' ? { width, height: width * 0.85 } : { width: '100%', aspectRatio: 1.18 }} radius={20} />
        <View style={{ position: 'absolute', top: 8, left: 8 }}><Tag3D ar label="AR" /></View>
      </View>
      <T v="semi" numberOfLines={1} style={{ marginTop: 8 }}>{model.name}</T>
      <T v="small" mute>{TYPE_LABELS[String(model.productType || '').toLowerCase()] || 'Nội thất'}</T>
    </Pressable>
  );
}

// Thẻ sản phẩm trong lưới 2 cột
export function ProductCard({ product, onPress }) {
  const { c } = useTheme();
  return (
    <Pressable onPress={onPress} style={{ flex: 1 }}>
      <Photo uri={product.primaryImageUrl} label={product.name} style={{ width: '100%', aspectRatio: 1 }} radius={20} />
      <T v="semi" numberOfLines={2} style={{ marginTop: 8, minHeight: 40 }}>{product.name}</T>
      <T v="small" mute numberOfLines={1}>{product.supplierName}</T>
      <T v="semi" color={c.pri} style={{ marginTop: 2 }}>{product.priceFrom != null ? `Từ ${formatVnd(product.priceFrom)}` : 'Liên hệ'}</T>
    </Pressable>
  );
}

// Lưới 2 cột không dùng FlatList lồng (dùng trong ScrollView)
export function Grid2({ items, render, gap = 14 }) {
  const rows = [];
  for (let i = 0; i < items.length; i += 2) rows.push(items.slice(i, i + 2));
  return (
    <View style={{ gap }}>
      {rows.map((r, i) => (
        <View key={i} style={{ flexDirection: 'row', gap }}>
          {r.map(render)}
          {r.length === 1 ? <View style={{ flex: 1 }} /> : null}
        </View>
      ))}
    </View>
  );
}
