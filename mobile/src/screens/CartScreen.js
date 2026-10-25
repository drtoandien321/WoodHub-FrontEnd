import React, { useState } from 'react';
import { View, FlatList, Pressable } from 'react-native';
import { Screen, AppBar, T, Card, Photo, Button, Stepper, Skeleton, ErrorState, EmptyState, Row } from '../components/ui.js';
import Icon from '../components/Icon.js';
import { useTheme } from '../theme/theme.js';
import { useCart, useUpdateCartItem, useRemoveCartItem, cartErrMsg } from '../hooks/shop.js';
import { formatVnd } from '../utils/format.js';

/*
 * Giỏ hàng (port web pages/Cart.jsx). Giỏ lưu ở server, thêm theo BIẾN THỂ. Mỗi thao tác trả giỏ mới → cache tự cập nhật.
 * Món ngừng bán (available=false) không đặt được: BE trả 409 khi checkout → khoá nút "Thanh toán", gợi ý xoá.
 * Phí ship chưa biết ở đây: BE tính theo khoảng cách từ chi nhánh tới địa chỉ chọn ở bước thanh toán.
 */
export default function CartScreen({ navigation }) {
  const { c } = useTheme();
  const q = useCart();
  const update = useUpdateCartItem();
  const remove = useRemoveCartItem();
  const [busyId, setBusyId] = useState(null);
  const [err, setErr] = useState('');

  const run = (id, fn) => {
    setBusyId(id); setErr('');
    fn().catch((e) => setErr(cartErrMsg(e))).finally(() => setBusyId(null));
  };

  if (q.isError) return <Screen><AppBar title="Giỏ hàng" onBack={() => navigation.goBack()} /><ErrorState offline={!q.error?.response} onRetry={q.refetch} /></Screen>;
  const cart = q.data;
  const items = cart?.items ?? [];
  const unavailable = cart?.unavailableCount ?? items.filter((i) => i.available === false).length;

  return (
    <Screen>
      <AppBar title={items.length ? `Giỏ hàng (${cart.totalQuantity})` : 'Giỏ hàng'} onBack={() => navigation.goBack()} />
      <FlatList
        data={q.isLoading ? [] : items} keyExtractor={(i) => String(i.id)} onRefresh={q.refetch} refreshing={q.isRefetching}
        contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: items.length ? 160 : 40, flexGrow: 1 }}
        ListHeaderComponent={(
          <View style={{ gap: 12 }}>
            {q.isLoading ? [0, 1].map((i) => <Skeleton key={i} h={112} r={22} />) : null}
            {unavailable > 0 ? (
              <Card style={{ backgroundColor: c.brBg, borderColor: c.brBg }}><T color={c.brTx}>{unavailable} sản phẩm đã ngừng bán — xoá khỏi giỏ để tiếp tục thanh toán.</T></Card>
            ) : null}
            {err ? <T color={c.err}>{err}</T> : null}
          </View>
        )}
        ListEmptyComponent={q.isLoading ? null : (
          <EmptyState icon="cart" title="Giỏ hàng trống" hint="Thêm sản phẩm bạn thích để đặt mua." action="Xem cửa hàng" onAction={() => navigation.navigate('Main', { screen: 'Shop' })} />
        )}
        renderItem={({ item }) => {
          const off = item.available === false;
          const changed = item.priceAtAddition != null && Number(item.priceAtAddition) !== Number(item.unitPrice);
          const busy = busyId === item.id;
          return (
            <Card style={{ gap: 10, opacity: busy ? 0.6 : 1 }}>
              <Row style={{ gap: 12, alignItems: 'flex-start' }}>
                <Pressable onPress={() => navigation.navigate('Product', { id: item.productId })}>
                  <Photo uri={item.imageUrl} label={item.productName} style={{ width: 84, height: 84, opacity: off ? 0.45 : 1 }} radius={16} icon="image" />
                </Pressable>
                <View style={{ flex: 1, gap: 2 }}>
                  <T v="semi" numberOfLines={2}>{item.productName}</T>
                  {[item.color, item.dimensions].filter(Boolean).length ? <T v="small" mute>{[item.color, item.dimensions].filter(Boolean).join(' · ')}</T> : null}
                  {off ? <T v="small" color={c.err}>{item.unavailableReason || 'Sản phẩm đã ngừng bán'}</T> : null}
                  {changed && !off ? <T v="small" color={c.goldtx}>Giá đã thay đổi: {formatVnd(item.priceAtAddition)} → {formatVnd(item.unitPrice)}</T> : null}
                  <T v="semi" color={c.pri} style={{ marginTop: 4 }}>{formatVnd(item.lineTotal)}</T>
                  {item.quantity > 1 ? <T v="small" mute>{formatVnd(item.unitPrice)} / sản phẩm</T> : null}
                </View>
                <Pressable onPress={() => run(item.id, () => remove.mutateAsync(item.id))} disabled={busy} accessibilityLabel={`Xoá ${item.productName}`}
                  style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="trash" size={20} color={c.mute} />
                </Pressable>
              </Row>
              {!off ? (
                <Stepper value={item.quantity} min={1} max={999}
                  onChange={(qty) => { if (qty !== item.quantity) run(item.id, () => update.mutateAsync({ itemId: item.id, quantity: qty })); }} />
              ) : null}
            </Card>
          );
        }}
      />

      {items.length ? (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, gap: 8, backgroundColor: c.surf, borderTopWidth: 1, borderTopColor: c.line }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <T mute>Tạm tính ({cart.totalQuantity} sản phẩm)</T>
            <T v="price" color={c.pri}>{formatVnd(cart.subtotal)}</T>
          </Row>
          <T v="small" mute>Phí ship tính ở bước thanh toán theo khoảng cách tới địa chỉ nhận.</T>
          <Button title="Thanh toán" icon="card" onPress={() => navigation.navigate('Checkout')} disabled={unavailable > 0 || !!busyId} />
        </View>
      ) : null}
    </Screen>
  );
}
