import React, { useEffect, useState } from 'react';
import { View, TextInput, Pressable, FlatList } from 'react-native';
import { Screen, T, Button, Chip, Skeleton, ErrorState, EmptyState, BottomSheet, Field } from '../components/ui.js';
import { ProductCard } from '../components/cards.js';
import Icon from '../components/Icon.js';
import CartButton from '../components/CartButton.js';
import { useTheme, fonts } from '../theme/theme.js';
import { useProducts, useCategories, useMaterials } from '../hooks/data.js';

const SORTS = [
  { k: 'createdAt,desc', l: 'Mới nhất' },
  { k: 'price,asc', l: 'Giá thấp → cao' },
  { k: 'price,desc', l: 'Giá cao → thấp' },
];

export default function ShopScreen({ navigation, route }) {
  const { c } = useTheme();
  const [keyword, setKeyword] = useState('');
  const [categoryId, setCategoryId] = useState(null);
  const [f, setF] = useState({ materialId: null, minPrice: '', maxPrice: '', has3d: false });
  const [sort, setSort] = useState(SORTS[0].k);
  const [sheet, setSheet] = useState(false);
  const [draft, setDraft] = useState(f);
  const cats = useCategories();
  const mats = useMaterials();

  // Nhận bộ lọc từ Home (từ khoá / danh mục)
  useEffect(() => {
    const p = route.params;
    if (!p) return;
    if (p.keyword !== undefined) setKeyword(p.keyword);
    if (p.categoryId !== undefined) setCategoryId(p.categoryId);
  }, [route.params]);

  const params = {
    size: 30, sort,
    keyword: keyword.trim() || undefined, categoryId: categoryId || undefined,
    materialId: f.materialId || undefined, has3d: f.has3d || undefined,
    minPrice: f.minPrice ? Number(f.minPrice) : undefined, maxPrice: f.maxPrice ? Number(f.maxPrice) : undefined,
  };
  const q = useProducts(params);
  const count = [f.materialId, f.minPrice, f.maxPrice, f.has3d].filter(Boolean).length;
  const items = q.data?.items || [];

  return (
    <Screen>
      <View style={{ paddingHorizontal: 20, paddingTop: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <T v="h1">Cửa hàng</T>
        <CartButton />
      </View>
      <View style={{ paddingHorizontal: 20, marginTop: 12, flexDirection: 'row', gap: 10 }}>
        <View style={{ flex: 1, height: 52, borderRadius: 16, borderWidth: 1.5, borderColor: c.line, backgroundColor: c.surf, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10 }}>
          <Icon name="search" size={22} color={c.mute} />
          <TextInput value={keyword} onChangeText={setKeyword} placeholder="Tìm sản phẩm…" placeholderTextColor={c.mute} returnKeyType="search"
            style={{ flex: 1, fontFamily: fonts.regular, fontSize: 16, color: c.ink }} />
        </View>
        <Pressable onPress={() => { setDraft(f); setSheet(true); }} accessibilityLabel="Bộ lọc"
          style={{ width: 52, height: 52, borderRadius: 16, borderWidth: 1.5, borderColor: count ? c.pri : c.line, backgroundColor: c.surf, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="filter" size={22} color={count ? c.pri : c.ink} />
          {count ? <View style={{ position: 'absolute', top: -6, right: -6, minWidth: 20, height: 20, borderRadius: 10, backgroundColor: c.gold, alignItems: 'center', justifyContent: 'center' }}><T v="small" color="#2B2119" style={{ fontFamily: fonts.bold, fontSize: 12, lineHeight: 16 }}>{count}</T></View> : null}
        </Pressable>
      </View>

      <FlatList
        horizontal data={[{ id: null, name: 'Tất cả' }, ...(cats.data || [])]} keyExtractor={(k) => String(k.id)} showsHorizontalScrollIndicator={false}
        // height cố định: FlatList ngang + flexGrow 0 trên RN-web co về 0 → chip bị cắt mất chữ
        style={{ flexGrow: 0, height: 48, marginTop: 12 }} contentContainerStyle={{ paddingHorizontal: 20, gap: 8, alignItems: 'center' }}
        renderItem={({ item }) => <Chip label={item.name} selected={categoryId === item.id} onPress={() => setCategoryId(item.id)} />}
      />

      <View style={{ paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginVertical: 10 }}>
        <T v="small" mute>{q.isLoading ? 'Đang tải…' : `${q.data?.total ?? items.length} sản phẩm`}</T>
        <Pressable onPress={() => setSort(SORTS[(SORTS.findIndex((s) => s.k === sort) + 1) % SORTS.length].k)} style={{ height: 44, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Icon name="down" size={18} color={c.pri} /><T v="semi" color={c.pri}>{SORTS.find((s) => s.k === sort).l}</T>
        </Pressable>
      </View>

      {q.isError ? <ErrorState offline={!q.error?.response} onRetry={q.refetch} /> : (
        <FlatList
          data={q.isLoading ? [] : items} numColumns={2} keyExtractor={(p) => String(p.id)}
          columnWrapperStyle={{ gap: 14 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 28, gap: 16, flexGrow: 1 }}
          onRefresh={q.refetch} refreshing={q.isRefetching}
          ListHeaderComponent={q.isLoading ? <View style={{ flexDirection: 'row', gap: 14 }}>{[0, 1].map((i) => <Skeleton key={i} h={220} r={20} style={{ flex: 1 }} />)}</View> : null}
          ListEmptyComponent={q.isLoading ? null : <EmptyState icon="search" title="Không tìm thấy sản phẩm" hint="Thử đổi từ khoá hoặc bỏ bớt bộ lọc." action="Xoá bộ lọc"
            onAction={() => { setKeyword(''); setCategoryId(null); setF({ materialId: null, minPrice: '', maxPrice: '', has3d: false }); }} />}
          renderItem={({ item }) => <ProductCard product={item} onPress={() => navigation.navigate('Product', { id: item.id })} />}
        />
      )}

      <BottomSheet visible={sheet} onClose={() => setSheet(false)} title="Bộ lọc"
        footer={<View style={{ flexDirection: 'row', gap: 10 }}>
          <Button title="Đặt lại" kind="outline" style={{ flex: 1 }} onPress={() => setDraft({ materialId: null, minPrice: '', maxPrice: '', has3d: false })} />
          <Button title="Áp dụng" style={{ flex: 2 }} onPress={() => { setF(draft); setSheet(false); }} />
        </View>}>
        <T v="label">Chất liệu</T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {(mats.data || []).map((m) => <Chip key={m.id} label={m.name} selected={draft.materialId === m.id} onPress={() => setDraft({ ...draft, materialId: draft.materialId === m.id ? null : m.id })} />)}
        </View>
        <T v="label">Khoảng giá (₫)</T>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}><Field value={draft.minPrice} onChangeText={(t) => setDraft({ ...draft, minPrice: t.replace(/\D/g, '') })} keyboardType="number-pad" placeholder="Từ" /></View>
          <View style={{ flex: 1 }}><Field value={draft.maxPrice} onChangeText={(t) => setDraft({ ...draft, maxPrice: t.replace(/\D/g, '') })} keyboardType="number-pad" placeholder="Đến" /></View>
        </View>
        <Pressable onPress={() => setDraft({ ...draft, has3d: !draft.has3d })} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, height: 48 }}>
          <View style={{ width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, borderColor: c.pri, backgroundColor: draft.has3d ? c.pri : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
            {draft.has3d ? <Icon name="check" size={16} color={c.onpri} /> : null}
          </View>
          <T>Chỉ hiện sản phẩm có 3D</T>
        </Pressable>
      </BottomSheet>
    </Screen>
  );
}
