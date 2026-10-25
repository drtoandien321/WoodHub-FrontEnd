import React, { useState } from 'react';
import { View, FlatList } from 'react-native';
import { Screen, AppBar, Chip, T, Skeleton, ErrorState, EmptyState } from '../components/ui.js';
import { ModelCard } from '../components/cards.js';
import { useModels } from '../hooks/data.js';
import { useStudio } from '../store/studio.js';
import { TYPES, TYPE_LABELS } from '../utils/woods.js';

export default function TemplatesScreen({ navigation, route }) {
  const intent = route.params?.intent;
  const q = useModels({ size: 60 });
  const openModel = useStudio((s) => s.openModel);
  const [type, setType] = useState(null);
  const list = (q.data || []).filter((m) => !type || String(m.productType).toLowerCase() === type);

  return (
    <Screen>
      <AppBar title={intent === 'ar' ? 'Chọn mẫu để thử AR' : 'Chọn mẫu 3D'} onBack={() => navigation.goBack()} />
      <FlatList horizontal data={[null, ...TYPES]} keyExtractor={(t) => String(t)} showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, height: 52 }}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingBottom: 8, alignItems: 'center' }}
        renderItem={({ item }) => <Chip label={item ? TYPE_LABELS[item] : 'Tất cả'} selected={type === item} onPress={() => setType(item)} />} />
      {q.isError ? <ErrorState offline={!q.error?.response} onRetry={q.refetch} /> : (
        <FlatList
          data={q.isLoading ? [] : list} numColumns={2} keyExtractor={(m) => m.slug} columnWrapperStyle={{ gap: 14 }}
          contentContainerStyle={{ padding: 20, gap: 18, flexGrow: 1 }}
          ListHeaderComponent={q.isLoading ? <View style={{ flexDirection: 'row', gap: 14 }}>{[0, 1].map((i) => <Skeleton key={i} h={190} r={20} style={{ flex: 1 }} />)}</View> : null}
          ListEmptyComponent={q.isLoading ? null : <EmptyState title="Chưa có mẫu phù hợp" hint="Thử chọn loại khác." />}
          renderItem={({ item }) => (
            <View style={{ flex: 1 }}>
              <ModelCard model={item} width="100%" onPress={() => { openModel(item, { mode: 'template' }); navigation.navigate(intent === 'ar' ? 'ArPerm' : 'Viewer'); }} />
            </View>
          )}
        />
      )}
    </Screen>
  );
}
