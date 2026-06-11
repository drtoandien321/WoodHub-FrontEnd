import { View, Text, Pressable, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors.js';
import { formatVnd } from '../api/mockData.js';

export default function ProductCard({ product, onPress }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}>
      {/* Khối màu placeholder thay ảnh (mock); BE thật sẽ trả image URL → đổi sang <Image> */}
      <View style={[styles.thumb, { backgroundColor: product.color }]} />
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>
        <Text style={styles.supplier} numberOfLines={1}>{product.supplierName}</Text>
        <View style={styles.row}>
          <Text style={styles.price}>{formatVnd(product.price)}</Text>
          <Text style={styles.rating}>★ {product.rating}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: COLORS.white, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: COLORS.ivoryDark },
  thumb: { height: 110 },
  body: { padding: 10, gap: 2 },
  name: { color: COLORS.text, fontWeight: '500', fontSize: 13, lineHeight: 18 },
  supplier: { color: COLORS.textMuted, fontSize: 11 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  price: { color: COLORS.walnut, fontWeight: '700', fontSize: 13 },
  rating: { color: COLORS.textMuted, fontSize: 11 },
});
