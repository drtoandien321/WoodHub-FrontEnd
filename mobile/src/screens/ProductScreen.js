import React, { useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Screen, T, Button, Card, Photo, Skeleton, ErrorState, Row, AppBar, Tag3D, Stepper, useToast } from '../components/ui.js';
import Icon from '../components/Icon.js';
import CartButton from '../components/CartButton.js';
import { useAddCartItem, cartErrMsg } from '../hooks/shop.js';
import { useTheme, fonts } from '../theme/theme.js';
import { api } from '../api/client.js';
import { useStudio } from '../store/studio.js';
import { useAuth } from '../store/auth.js';
import { formatVnd } from '../utils/format.js';

/*
 * Trang sản phẩm. Mô hình 3D/AR lấy từ ProductResponse.model3d (admin gắn mẫu cho SP — giống web ProductModel3dButton);
 * SP chưa gắn mẫu thì KHÔNG hiện 3D/AR. Bản cũ tự đoán "mẫu 3D tham khảo" theo tên danh mục (thời BE chưa liên kết) → ghế
 * mở ra mô hình chậu than, và nút "Yêu cầu báo giá" tạo thiết kế từ mẫu đó gửi cho xưởng — luồng web không có (hàng bán
 * sẵn mua qua giỏ hàng; khách doanh nghiệp dùng báo giá số lượng lớn) → đã bỏ.
 * Mua: giỏ server-side thêm theo BIẾN THỂ (variantId) — BE tự lấy giá, FE không gửi giá. "Mua ngay" = thêm rồi mở giỏ.
 */

export default function ProductScreen({ navigation, route }) {
  const { c } = useTheme();
  const { id } = route.params;
  const q = useQuery({ queryKey: ['product', id], queryFn: () => api.getProduct(id) });
  const openModel = useStudio((s) => s.openModel);
  const [img, setImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [cartErr, setCartErr] = useState('');
  const add = useAddCartItem();
  const toast = useToast();
  const business = useAuth((s) => s.user?.customerType) === 'business';

  const p = q.data;
  const variants = p?.variants?.length ? p.variants : [];
  const [vi, setVi] = useState(0);
  const price = variants[vi]?.price ?? p?.priceFrom;
  const images = (p?.images || []).map((i) => i.url || i).filter(Boolean);
  if (!images.length && p?.primaryImageUrl) images.push(p.primaryImageUrl);
  const model = p?.model3d?.modelGlbUrl ? p.model3d : null;

  const view3d = (ar) => {
    if (!model) return;
    openModel(model, { mode: 'product', base: price, productName: p.name });
    navigation.navigate(ar ? 'ArPerm' : 'Viewer');
  };

  const variant = variants[vi];
  const addToCart = async (thenOpen) => {
    if (!variant) return;
    setCartErr('');
    try {
      await add.mutateAsync({ variantId: variant.id, quantity: qty });
      if (thenOpen) navigation.navigate('Cart'); else toast(`Đã thêm ${qty} sản phẩm vào giỏ`);
    } catch (e) { setCartErr(cartErrMsg(e)); }
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
          <View style={{ position: 'absolute', top: 8, right: 8 }}><CartButton bg={c.surf} /></View>
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
              {model ? (
                <Card style={{ gap: 10 }}>
                  <Row style={{ gap: 8 }}><Tag3D label="3D · AR" /><T v="small" mute style={{ flex: 1 }}>Xoay xem 3D hoặc đặt thử vào phòng bằng AR.</T></Row>
                  <Row style={{ gap: 10 }}>
                    <Button small title="Xem 3D" kind="outline" icon="cube" style={{ flex: 1 }} onPress={() => view3d(false)} />
                    <Button small title="Đặt thử AR" kind="gold" icon="ar" style={{ flex: 1 }} onPress={() => view3d(true)} />
                  </Row>
                </Card>
              ) : null}
              {variant ? (
                <Row style={{ justifyContent: 'space-between' }}>
                  <T v="label">Số lượng</T>
                  <Stepper value={qty} onChange={setQty} min={1} max={999} />
                </Row>
              ) : null}
              {cartErr ? <T color={c.err}>{cartErr}</T> : null}
              {business && variants.length ? (
                <View style={{ gap: 4 }}>
                  <Button title="Yêu cầu báo giá số lượng lớn" kind="outline" icon="quote" onPress={() => navigation.navigate('BulkQuoteRequest', { productId: p.id })} />
                  <T v="small" mute>Dành cho khách doanh nghiệp — nhà cung cấp gửi giá sỉ trong 7 ngày.</T>
                </View>
              ) : null}
            </>
          )}
        </View>
      </ScrollView>

      {p ? (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, flexDirection: 'row', gap: 10, backgroundColor: c.surf, borderTopWidth: 1, borderTopColor: c.line }}>
          {variant ? (
            <>
              <Button title="Thêm vào giỏ" kind="outline" icon="cart" style={{ flex: 1 }} onPress={() => addToCart(false)} loading={add.isPending} />
              <Button title="Mua ngay" style={{ flex: 1 }} onPress={() => addToCart(true)} disabled={add.isPending} />
            </>
          ) : <T mute style={{ flex: 1, textAlign: 'center' }}>Sản phẩm chưa có phiên bản để đặt mua.</T>}
        </View>
      ) : null}
    </Screen>
  );
}
