import { useEffect, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Pressable, StyleSheet } from 'react-native';
import { COLORS } from '../theme/colors.js';
import { api } from '../api/client.js';

// Hiển thị kết quả matching rule-based — logic chấm điểm nằm trong api/client.js
export default function WorkshopMatchScreen({ route }) {
  const { designId } = route.params;
  const [matches, setMatches] = useState(null);

  useEffect(() => {
    api.matchWorkshops({ designId }).then((res) => setMatches(res.matches));
  }, [designId]);

  if (!matches) return <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.walnut} />;

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      data={matches}
      keyExtractor={(w) => w.id}
      ListHeaderComponent={
        <Text style={styles.intro}>
          Lọc theo năng lực sản xuất (loại, kích thước tối đa, vật liệu), xếp hạng theo đánh giá · tốc độ · kinh nghiệm.
        </Text>
      }
      ListEmptyComponent={
        <Text style={styles.empty}>Chưa tìm thấy xưởng phù hợp. Thử giảm kích thước hoặc đổi chất liệu.</Text>
      }
      renderItem={({ item, index }) => (
        <View style={styles.card}>
          <View style={styles.scoreBadge}>
            <Text style={styles.scoreText}>{item.score}</Text>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.name}>{item.name}</Text>
              {index === 0 && <Text style={styles.best}>Phù hợp nhất</Text>}
            </View>
            <Text style={styles.meta}>{item.district}</Text>
            <Text style={styles.meta}>★ {item.rating} · {item.completedJobs} đơn · giao ~{item.leadTimeDays} ngày</Text>
          </View>
          <Pressable style={styles.btn}>
            <Text style={styles.btnText}>Báo giá</Text>
          </Pressable>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: COLORS.ivory },
  intro: { fontSize: 12, color: COLORS.textMuted, lineHeight: 18, marginBottom: 4 },
  empty: { textAlign: 'center', color: COLORS.textMuted, marginTop: 40 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: COLORS.white, borderRadius: 18, padding: 14, borderWidth: 1, borderColor: COLORS.ivoryDark },
  scoreBadge: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.walnut, alignItems: 'center', justifyContent: 'center' },
  scoreText: { color: COLORS.white, fontWeight: '700' },
  name: { fontWeight: '600', color: COLORS.text, fontSize: 14 },
  best: { fontSize: 10, color: COLORS.white, backgroundColor: COLORS.gold, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, overflow: 'hidden' },
  meta: { fontSize: 11, color: COLORS.textMuted },
  btn: { backgroundColor: COLORS.walnut, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8 },
  btnText: { color: COLORS.white, fontSize: 12, fontWeight: '600' },
});
