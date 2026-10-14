import React, { useState } from 'react';
import { View, ScrollView, Pressable, TextInput, RefreshControl } from 'react-native';
import { Screen, T, Button, Chip, Skeleton, ErrorState } from '../components/ui.js';
import { ModelCard, ProductCard, Grid2 } from '../components/cards.js';
import Icon from '../components/Icon.js';
import { useTheme } from '../theme/theme.js';
import { useAuth } from '../store/auth.js';
import { useStudio } from '../store/studio.js';
import { useModels, useProducts, useCategories } from '../hooks/data.js';

export default function HomeScreen({ navigation }) {
  const { c } = useTheme();
  const user = useAuth((s) => s.user);
  const openModel = useStudio((s) => s.openModel);
  const [q, setQ] = useState('');
  const models = useModels({ size: 10 });
  const products = useProducts({ size: 8, sort: 'createdAt,desc' });
  const cats = useCategories();

  const refreshing = models.isRefetching || products.isRefetching;
  const refresh = () => { models.refetch(); products.refetch(); cats.refetch(); };
  const search = () => navigation.navigate('Shop', { keyword: q.trim() });
  const first = (user?.name || '').trim().split(/\s+/).slice(-1)[0];

  const offline = (models.isError && !models.error?.response) || (products.isError && !products.error?.response);
  if (models.isError && products.isError) {
    return <Screen><ErrorState offline={offline} onRetry={refresh} /></Screen>;
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} refreshControl={<RefreshControl refreshing={!!refreshing} onRefresh={refresh} />}>
        <View style={{ paddingHorizontal: 20, paddingTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View>
            <T mute>Xin chào{first ? `, ${first}` : ''} 👋</T>
            <T v="h2">Tìm món đồ cho ngôi nhà</T>
          </View>
          <Pressable onPress={() => navigation.navigate('Chat')} accessibilityLabel="Trợ lý AI"
            style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: c.surf2, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="chat" size={24} color={c.pri} />
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: 20, marginTop: 14 }}>
          <View style={{ height: 52, borderRadius: 16, borderWidth: 1.5, borderColor: c.line, backgroundColor: c.surf, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10 }}>
            <Icon name="search" size={22} color={c.mute} />
            <TextInput value={q} onChangeText={setQ} onSubmitEditing={search} returnKeyType="search" placeholder="Tìm bàn, ghế, tủ…" placeholderTextColor={c.mute}
              style={{ flex: 1, fontFamily: 'BeVietnamPro_400Regular', fontSize: 16, color: c.ink }} />
          </View>
        </View>

        {/* Hero AR — lõi của sản phẩm */}
        <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
          <View style={{ backgroundColor: c.hero, borderRadius: 26, padding: 20, overflow: 'hidden', borderLeftWidth: 6, borderLeftColor: c.gold }}>
            <View style={{ position: 'absolute', right: -30, top: -30, width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(248,244,236,0.08)' }} />
            <Icon name="ar" size={34} color="#E2BE48" />
            <T v="h2" color="#F8F4EC" style={{ marginTop: 8 }}>Đặt thử vào phòng bạn bằng AR</T>
            <T color="rgba(248,244,236,0.8)" style={{ marginTop: 4, marginBottom: 14 }}>Xem đồ nội thất đúng kích thước thật ngay trong không gian của bạn.</T>
            <Button title="Thử ngay" kind="gold" icon="ar" onPress={() => navigation.navigate('Templates', { intent: 'ar' })} style={{ alignSelf: 'flex-start' }} />
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, marginTop: 18 }}>
          <Chip label="Tất cả" selected onPress={() => navigation.navigate('Shop')} />
          {(cats.data || []).slice(0, 8).map((k) => (
            <Chip key={k.id} label={k.name} onPress={() => navigation.navigate('Shop', { categoryId: k.id })} />
          ))}
        </ScrollView>

        <View style={{ marginTop: 22 }}>
          <View style={{ paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <T v="h3">Mẫu 3D nổi bật</T>
            <Pressable onPress={() => navigation.navigate('Templates')} style={{ height: 44, justifyContent: 'center' }}><T v="semi" color={c.pri}>Xem tất cả</T></Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}>
            {models.isLoading
              ? [0, 1, 2].map((i) => <Skeleton key={i} w={156} h={170} r={20} />)
              : (models.data || []).map((m) => (
                <ModelCard key={m.slug} model={m} onPress={() => { openModel(m, { mode: 'template' }); navigation.navigate('Viewer'); }} />
              ))}
          </ScrollView>
        </View>

        <View style={{ marginTop: 24, paddingHorizontal: 20 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <T v="h3">Sản phẩm mới</T>
            <Pressable onPress={() => navigation.navigate('Shop')} style={{ height: 44, justifyContent: 'center' }}><T v="semi" color={c.pri}>Xem tất cả</T></Pressable>
          </View>
          {products.isLoading ? (
            <View style={{ flexDirection: 'row', gap: 14 }}>{[0, 1].map((i) => <Skeleton key={i} w={undefined} h={210} r={20} style={{ flex: 1 }} />)}</View>
          ) : (
            <Grid2 items={products.data?.items || []} render={(p) => <ProductCard key={p.id} product={p} onPress={() => navigation.navigate('Product', { id: p.id })} />} />
          )}
        </View>
      </ScrollView>
    </Screen>
  );
}
