import React, { useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Screen, T, Button, Card, Photo, Skeleton, ErrorState, Row, AppBar, Tag3D } from '../components/ui.js';
import RequestQuoteSheet from '../components/RequestQuoteSheet.js';
import Icon from '../components/Icon.js';
import { useTheme, fonts } from '../theme/theme.js';
import { api } from '../api/client.js';
import { useModels } from '../hooks/data.js';
import { useStudio } from '../store/studio.js';
import { formatVnd } from '../utils/format.js';
import { defaultConfig } from '../utils/woods.js';
import { saveDesign } from '../utils/design.js';

// BE chưa liên kết sản phẩm ↔ mô hình 3D, nên chọn mẫu 3D tham khảo theo loại (từ tên danh mục/sản phẩm)
const GUESS = [['sofa', /sofa|ghế sofa/i], ['chair', /ghế|chair/i], ['table', /bàn|table/i], ['cabinet', /tủ|cabinet/i], ['shelf', /kệ|shelf/i], ['bed', /giường|bed/i]];
function guessModel(product, models) {
  if (!models?.length) return null;
  const text = `${product?.categoryName || ''} ${product?.name || ''}`;
  const t = GUESS.find(([, re]) => re.test(text))?.[0];
  return (t && models.find((m) => String(m.productType).toLowerCase() === t)) || models[0];
}

export default function ProductScreen({ navigation, route }) {
  const { c } = useTheme();
  const { id } = route.params;
  const q = useQuery({ queryKey: ['product', id], queryFn: () => api.getProduct(id) });
  const models = useModels();
  const openModel = useStudio((s) => s.openModel);
  const [img, setImg] = useState(0);
  const [sheet, setSheet] = useState(false);

  const p = q.data;
  const variants = p?.variants?.length ? p.variants : [];
  const [vi, setVi] = useState(0);
  const price = variants[vi]?.price ?? p?.priceFrom;
  const images = (p?.images || []).map((i) => i.url || i).filter(Boolean);
  if (!images.length && p?.primaryImageUrl) images.push(p.primaryImageUrl);
  const model = guessModel(p, models.data);

  const view3d = (ar) => {
    if (!model) return;
    openModel(model, { mode: 'product', base: price, productName: p.name });
    navigation.navigate(ar ? 'ArPerm' : 'Viewer');
  };

  // Gửi báo giá cần 1 thiết kế: tạo từ mẫu 3D tham khảo với tên = tên sản phẩm
  const ensureDesignId = async () => {
    const cfg = defaultConfig(model);
    const saved = await saveDesign({ model, cfg, name: p.name });
    return saved.id;
  };

  if (q.isError) return <Screen><AppBar title="" onBack={() => navigation.goBack()} /><ErrorState offline={!q.error?.response} onRetry={q.refetch} /></Screen>;

  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View>
          {q.isLoading ? <Skeleton h={392} r={0} /> : <Photo uri={images[img]} label={p?.name} style={{ height: 392, width: '100%' }} radius={0} />}
          <View style={{ position: 'absolute', top: 8, left: 8 }}>
            <Pressable onPress={() => navigation.goBack()} accessibilityLabel="Quay lại" style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: c.surf, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="back" size={24} color={c.ink} />
            </Pressable>
          </View>
          {model ? (
            <Pressable onPress={() => view3d(true)} style={{ position: 'absolute', right: 16, bottom: 16, height: 44, paddingHorizontal: 16, borderRadius: 22, backgroundColor: c.gold, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Icon name="ar" size={20} color="#2B2119" /><T v="semi" color="#2B2119">Xem AR</T>
            </Pressable>
          ) : null}
        </View>
        {images.length > 1 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ padding: 12, gap: 8 }}>
            {images.map((u, i) => (
              <Pressable key={u + i} onPress={() => setImg(i)} style={{ borderRadius: 14, borderWidth: 2, borderColor: i === img ? c.pri : 'transparent' }}>
                <Photo uri={u} style={{ width: 64, height: 64 }} radius={12} />
              </Pressable>
            ))}
          </ScrollView>
        ) : null}

        <View style={{ padding: 20, gap: 12 }}>
          {q.isLoading ? <><Skeleton h={28} w="70%" /><Skeleton h={22} w="40%" /></> : (
            <>
              <T v="h1">{p.name}</T>
              <T v="price" color={c.pri} style={{ fontSize: 26 }}>{price != null ? formatVnd(price) : 'Liên hệ'}</T>
              {variants.length > 1 ? (
                <Row style={{ flexWrap: 'wrap', gap: 8 }}>
                  {variants.map((v, i) => (
                    <Pressable key={v.id} onPress={() => setVi(i)} style={{ height: 40, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1.5, borderColor: i === vi ? c.pri : c.line, backgroundColor: i === vi ? c.surf2 : c.surf, justifyContent: 'center' }}>
                      <T v="label">{[v.color, v.dimensions].filter(Boolean).join(' · ') || 'Mặc định'}</T>
                    </Pressable>
                  ))}
                </Row>
              ) : null}
              {p.description ? <T mute>{p.description}</T> : null}
              <Card style={{ gap: 10 }}>
                {[['Chất liệu', p.materialName], ['Danh mục', p.categoryName]].filter(([, v]) => v).map(([k, v]) => (
                  <Row key={k} style={{ justifyContent: 'space-between' }}><T mute>{k}</T><T v="semi">{v}</T></Row>
                ))}
              </Card>
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: c.surf2, alignItems: 'center', justifyContent: 'center' }}><Icon name="store" size={24} color={c.pri} /></View>
                <View style={{ flex: 1 }}><T v="small" mute>Cung cấp bởi</T><T v="semi">{p.supplierName}</T></View>
              </Card>
              {model ? <Row style={{ gap: 8 }}><Tag3D label="Mẫu 3D tham khảo" /><T v="small" mute style={{ flex: 1 }}>Mô hình 3D minh hoạ theo loại sản phẩm.</T></Row> : null}
            </>
          )}
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, flexDirection: 'row', gap: 10, backgroundColor: c.surf, borderTopWidth: 1, borderTopColor: c.line }}>
        <Button title="Xem 3D" kind="outline" icon="cube" style={{ flex: 1 }} onPress={() => view3d(false)} disabled={!model} />
        <Button title="Yêu cầu báo giá" icon="quote" style={{ flex: 1.4 }} onPress={() => setSheet(true)} disabled={!model || !p} />
      </View>

      {p && model ? (
        <RequestQuoteSheet visible={sheet} onClose={() => setSheet(false)} designName={p.name} ensureDesignId={ensureDesignId}
          onSent={(quote) => { setSheet(false); navigation.navigate('QuoteDetail', { id: quote.id }); }} />
      ) : null}
    </Screen>
  );
}
