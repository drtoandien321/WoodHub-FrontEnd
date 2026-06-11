import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors.js';
import { api } from '../api/client.js';
import ProductCard from '../components/ProductCard.js';

export default function HomeScreen({ navigation }) {
  const [featured, setFeatured] = useState([]);

  useEffect(() => {
    // useEffect fetch đơn giản cho MVP; nếu app phình to → cân nhắc React Query bản RN
    api.getProducts().then((res) => setFeatured(res.items.slice(0, 4)));
  }, []);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16, gap: 16 }}>
      {/* Hero mobile: rút gọn từ hero web, giữ thông điệp + 2 CTA */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>Gỗ thật,{'\n'}thiết kế của bạn</Text>
        <Text style={styles.heroSub}>Mua nội thất có sẵn hoặc tự thiết kế 3D và ghép với xưởng mộc phù hợp.</Text>
        <View style={styles.heroBtns}>
          <Pressable style={styles.btnPrimary} onPress={() => navigation.navigate('Shop')}>
            <Text style={styles.btnPrimaryText}>Khám phá ngay</Text>
          </Pressable>
          <Pressable style={styles.btnOutline} onPress={() => navigation.navigate('Custom')}>
            <Text style={styles.btnOutlineText}>Thiết kế 3D</Text>
          </Pressable>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Sản phẩm nổi bật</Text>
      <View style={styles.grid}>
        {featured.map((p) => (
          <View key={p.id} style={{ width: '48%' }}>
            <ProductCard product={p} onPress={() => navigation.navigate('Shop', { screen: 'ProductDetail', params: { id: p.id } })} />
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.ivory },
  hero: { backgroundColor: COLORS.oak, borderRadius: 24, padding: 22, gap: 10 },
  heroTitle: { fontSize: 30, fontWeight: '700', color: '#3c2a18', lineHeight: 36 },
  heroSub: { color: '#4a3522', opacity: 0.85, fontSize: 13, lineHeight: 19 },
  heroBtns: { flexDirection: 'row', gap: 10, marginTop: 6 },
  btnPrimary: { backgroundColor: COLORS.walnut, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999 },
  btnPrimaryText: { color: COLORS.white, fontWeight: '600', fontSize: 13 },
  btnOutline: { borderWidth: 1.5, borderColor: COLORS.walnut, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999 },
  btnOutlineText: { color: COLORS.walnut, fontWeight: '600', fontSize: 13 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: COLORS.text },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
});
