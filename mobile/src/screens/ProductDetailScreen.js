import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { COLORS } from '../theme/colors.js';
import { api } from '../api/client.js';
import { formatVnd } from '../api/mockData.js';
import { useCartStore } from '../store/cartStore.js';

export default function ProductDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [product, setProduct] = useState(null);
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

  useEffect(() => { api.getProduct(id).then(setProduct); }, [id]);

  if (!product) return <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.walnut} />;

  const handleAdd = () => {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, gap: 14 }}>
      <View style={[styles.thumb, { backgroundColor: product.color }]} />
      <Text style={styles.name}>{product.name}</Text>
      <Text style={styles.meta}>{product.supplierName} · ★ {product.rating} · chất liệu: {product.material}</Text>
      <Text style={styles.price}>{formatVnd(product.price)}</Text>
      <Text style={styles.desc}>{product.description}</Text>

      <Pressable onPress={handleAdd} style={[styles.btn, added && { backgroundColor: COLORS.success }]}>
        <Text style={styles.btnText}>{added ? 'Đã thêm vào giỏ ✓' : 'Thêm vào giỏ'}</Text>
      </Pressable>
      <Pressable onPress={() => navigation.getParent()?.navigate('Custom')} style={styles.btnGhost}>
        <Text style={styles.btnGhostText}>🪄 Tùy biến mẫu tương tự trong Custom 3D</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.ivory },
  thumb: { height: 220, borderRadius: 20 },
  name: { fontSize: 22, fontWeight: '700', color: COLORS.text },
  meta: { fontSize: 12, color: COLORS.textMuted },
  price: { fontSize: 20, fontWeight: '700', color: COLORS.walnut },
  desc: { fontSize: 14, lineHeight: 21, color: COLORS.text },
  btn: { backgroundColor: COLORS.walnut, borderRadius: 999, paddingVertical: 13, alignItems: 'center' },
  btnText: { color: COLORS.white, fontWeight: '600' },
  btnGhost: { borderWidth: 1.5, borderColor: COLORS.oak, borderRadius: 999, paddingVertical: 12, alignItems: 'center' },
  btnGhostText: { color: COLORS.walnut, fontWeight: '500', fontSize: 13 },
});
