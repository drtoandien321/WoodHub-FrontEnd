import { useEffect, useState } from 'react';
import { View, FlatList, Pressable, Text, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors.js';
import { api } from '../api/client.js';
import { PRODUCT_TYPES } from '../api/mockData.js';
import ProductCard from '../components/ProductCard.js';

export default function ShopScreen({ navigation }) {
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api.getProducts(category).then((res) => { setProducts(res.items); setLoading(false); });
  }, [category]);

  return (
    <View style={styles.screen}>
      {/* Filter pill — đổi category là refetch (useEffect deps) */}
      <View style={styles.filters}>
        <Pressable onPress={() => setCategory(null)} style={[styles.pill, !category && styles.pillActive]}>
          <Text style={[styles.pillText, !category && styles.pillTextActive]}>Tất cả</Text>
        </Pressable>
        {PRODUCT_TYPES.map((t) => (
          <Pressable key={t.id} onPress={() => setCategory(t.id)} style={[styles.pill, category === t.id && styles.pillActive]}>
            <Text style={[styles.pillText, category === t.id && styles.pillTextActive]}>{t.name}</Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={products}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ padding: 16, gap: 12 }}
        refreshing={loading}
        onRefresh={() => setCategory((c) => c)}
        renderItem={({ item }) => (
          <View style={{ flex: 1 }}>
            <ProductCard product={item} onPress={() => navigation.navigate('ProductDetail', { id: item.id })} />
          </View>
        )}
        ListEmptyComponent={!loading && <Text style={styles.empty}>Chưa có sản phẩm trong danh mục này.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.ivory },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingTop: 12 },
  pill: { borderWidth: 1, borderColor: COLORS.oak, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 },
  pillActive: { backgroundColor: COLORS.walnut, borderColor: COLORS.walnut },
  pillText: { fontSize: 12, color: COLORS.walnut },
  pillTextActive: { color: COLORS.white },
  empty: { textAlign: 'center', color: COLORS.textMuted, marginTop: 40 },
});
