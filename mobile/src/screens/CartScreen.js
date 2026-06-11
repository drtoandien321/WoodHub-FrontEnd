import { View, Text, FlatList, Pressable, StyleSheet, Alert } from 'react-native';
import { COLORS } from '../theme/colors.js';
import { useCartStore } from '../store/cartStore.js';
import { formatVnd } from '../api/mockData.js';

export default function CartScreen() {
  const { items, updateQty, removeItem, clear } = useCartStore();
  const subtotal = useCartStore((s) => s.subtotal());

  const handleCheckout = () => {
    /*
     * MVP mobile: checkout chỉ là Alert xác nhận (flow đặt hàng đầy đủ nằm ở web).
     * V1: thêm CheckoutScreen gọi POST /orders giống web.
     */
    Alert.alert('Demo checkout', `Tổng đơn: ${formatVnd(subtotal)}\nFlow thanh toán đầy đủ xem bản web.`, [
      { text: 'Xóa giỏ (giả lập đặt hàng)', onPress: clear },
      { text: 'Đóng', style: 'cancel' },
    ]);
  };

  if (!items.length)
    return (
      <View style={[styles.screen, styles.center]}>
        <Text style={{ fontSize: 40 }}>🪵</Text>
        <Text style={styles.emptyTitle}>Giỏ hàng đang trống</Text>
        <Text style={styles.emptyHint}>Thêm sản phẩm từ tab Cửa hàng nhé.</Text>
      </View>
    );

  return (
    <View style={styles.screen}>
      <FlatList
        data={items}
        keyExtractor={(i) => i.productId}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={[styles.thumb, { backgroundColor: item.color ?? COLORS.oak }]} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.price}>{formatVnd(item.price)}</Text>
            </View>
            <View style={styles.qtyRow}>
              <Pressable onPress={() => updateQty(item.productId, item.qty - 1)} style={styles.qtyBtn}><Text style={styles.qtyBtnText}>−</Text></Pressable>
              <Text style={styles.qty}>{item.qty}</Text>
              <Pressable onPress={() => updateQty(item.productId, item.qty + 1)} style={styles.qtyBtn}><Text style={styles.qtyBtnText}>+</Text></Pressable>
            </View>
            <Pressable onPress={() => removeItem(item.productId)}><Text style={styles.remove}>✕</Text></Pressable>
          </View>
        )}
      />
      <View style={styles.footer}>
        <View>
          <Text style={{ fontSize: 12, color: COLORS.textMuted }}>Tạm tính</Text>
          <Text style={styles.total}>{formatVnd(subtotal)}</Text>
        </View>
        <Pressable onPress={handleCheckout} style={styles.btn}>
          <Text style={styles.btnText}>Thanh toán</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.ivory },
  center: { alignItems: 'center', justifyContent: 'center', gap: 6 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: COLORS.text },
  emptyHint: { fontSize: 13, color: COLORS.textMuted },
  card: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: COLORS.white, borderRadius: 16, padding: 10, borderWidth: 1, borderColor: COLORS.ivoryDark },
  thumb: { width: 52, height: 44, borderRadius: 10 },
  name: { fontSize: 13, fontWeight: '500', color: COLORS.text },
  price: { fontSize: 12, color: COLORS.walnut, fontWeight: '600' },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: COLORS.ivoryDark, alignItems: 'center', justifyContent: 'center' },
  qtyBtnText: { fontSize: 16, color: COLORS.walnut, lineHeight: 18 },
  qty: { minWidth: 18, textAlign: 'center', color: COLORS.text, fontVariant: ['tabular-nums'] },
  remove: { color: COLORS.error, padding: 6 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: COLORS.white, borderTopWidth: 1, borderTopColor: COLORS.ivoryDark },
  total: { fontSize: 18, fontWeight: '700', color: COLORS.walnut },
  btn: { backgroundColor: COLORS.walnut, borderRadius: 999, paddingHorizontal: 24, paddingVertical: 12 },
  btnText: { color: COLORS.white, fontWeight: '600' },
});
