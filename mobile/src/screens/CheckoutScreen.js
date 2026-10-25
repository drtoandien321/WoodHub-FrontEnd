import React, { useEffect, useMemo, useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { Screen, AppBar, T, Card, Button, Field, Skeleton, EmptyState, Row, Badge } from '../components/ui.js';
import OrderPaymentPanel from '../components/OrderPaymentPanel.js';
import Icon from '../components/Icon.js';
import { useTheme } from '../theme/theme.js';
import { useCart, useAddresses, useAvailableVouchers, useOrderPreview, useCheckout, cartKeyOf, formatAddressLine } from '../hooks/shop.js';
import { useAuth } from '../store/auth.js';
import { errMsg } from '../api/client.js';
import { formatVnd } from '../utils/format.js';
import { CONFIRM_NOTICE } from '../utils/orders.js';

/*
 * Thanh toán (port web pages/Checkout.jsx). FE chỉ gửi địa chỉ (bắt buộc có toạ độ), ghi chú, voucher đã chọn; BE tự tách đơn
 * theo NCC, chọn chi nhánh gần nhất, tính ship, áp voucher, tạo 1 QR chung và xoá giỏ. Phí ship/giảm giá lấy từ
 * POST /orders/preview (cùng phép tính với checkout) — không tự đoán ở app.
 * Voucher: chưa đụng tay → luôn theo gợi ý (recommended) của BE; đã đụng → giữ lựa chọn, bỏ cái không còn dùng được.
 */
const NOTE_MAX = 500;

export default function CheckoutScreen({ navigation, route }) {
  const { c } = useTheme();
  const cartQ = useCart();
  const addrQ = useAddresses();
  const checkout = useCheckout();
  const isBusiness = useAuth((s) => s.user?.customerType) === 'business';

  const [selectedId, setSelectedId] = useState(null);
  const [note, setNote] = useState('');
  const [voucherIds, setVoucherIds] = useState([]);
  const [touched, setTouched] = useState(false);
  const [vat, setVat] = useState(false);
  const [err, setErr] = useState('');
  const [result, setResult] = useState(null);
  const [paid, setPaid] = useState(false);

  const addresses = addrQ.data || [];
  const selected = addresses.find((a) => a.id === selectedId);
  const cart = cartQ.data;
  const items = cart?.items ?? [];
  const cartKey = cartKeyOf(cart);

  // Quay về từ form địa chỉ → chọn luôn địa chỉ vừa lưu
  useEffect(() => { if (route.params?.selectAddressId) setSelectedId(route.params.selectAddressId); }, [route.params?.selectAddressId]);
  // Tự chọn: mặc định có toạ độ, không thì địa chỉ đầu tiên có toạ độ
  useEffect(() => {
    if (selectedId || !addresses.length) return;
    const usable = addresses.filter((a) => a.hasCoordinates);
    setSelectedId((usable.find((a) => a.isDefault) ?? usable[0])?.id ?? null);
  }, [addresses, selectedId]);

  const addressId = selected?.hasCoordinates ? selected.id : undefined;
  const vq = useAvailableVouchers({ addressId, cartKey, enabled: items.length > 0 && !result });
  const vouchers = useMemo(() => vq.data ?? [], [vq.data]);
  useEffect(() => {
    if (!vq.data) return;
    setVoucherIds((ids) => (touched
      ? ids.filter((id) => vouchers.some((v) => v.id === id && v.eligible))
      : vouchers.filter((v) => v.recommended && v.eligible).map((v) => v.id)));
  }, [vq.data, vouchers, touched]);

  const pv = useOrderPreview({ addressId, promotionIds: voucherIds, cartKey, enabled: items.length > 0 && !result });
  const p = pv.data;
  const couponErrors = p?.couponErrors ?? [];
  const unavailable = cart?.unavailableCount ?? items.filter((i) => i.available === false).length;
  const canSubmit = !!addressId && !checkout.isPending && unavailable === 0 && couponErrors.length === 0;

  const toggleVoucher = (v) => {
    if (!v.eligible) return;
    setTouched(true);
    setVoucherIds((ids) => (ids.includes(v.id) ? ids.filter((x) => x !== v.id) : [...ids, v.id]));
  };

  const submit = () => {
    setErr('');
    checkout.mutate(
      { addressId, note: note.trim() || undefined, promotionIds: voucherIds.length ? voucherIds : undefined, vatInvoice: isBusiness && vat ? true : undefined },
      {
        onSuccess: (res) => setResult(res),
        onError: (e) => {
          const code = String(e?.response?.data?.errorCode ?? '');
          if (code === 'PRODUCT_UNAVAILABLE') cartQ.refetch();
          if (code.startsWith('COUPON_')) { vq.refetch(); setErr(`${errMsg(e)} Danh sách voucher vừa được cập nhật, vui lòng chọn lại.`); return; }
          setErr(errMsg(e, 'Đặt hàng chưa thành công, vui lòng thử lại.'));
        },
      },
    );
  };

  // ===== Màn THANH TOÁN sau khi đặt =====
  if (result) {
    return (
      <Screen>
        <AppBar title={paid ? 'Đặt hàng thành công' : 'Thanh toán'} onBack={() => navigation.navigate('Orders')} />
        <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 40 }}>
          {result.orders.length > 1 ? <T v="small" mute>Giỏ hàng được tách thành {result.orders.length} đơn theo nhà cung cấp — bạn chỉ cần thanh toán 1 lần.</T> : null}
          {!paid ? <Card style={{ backgroundColor: c.bnBg, borderColor: c.bnBg }} pad={12}><T v="small" color={c.bnTx}>{CONFIRM_NOTICE}</T></Card> : null}
          <OrderPaymentPanel paymentId={result.payment?.id} orderId={result.orders[0]?.id} fallback={result.payment} onPaid={() => setPaid(true)} />
          {result.orders.map((o) => (
            <Card key={o.id} onPress={() => navigation.navigate('OrderDetail', { id: o.id })} style={{ gap: 6 }}>
              <Row style={{ justifyContent: 'space-between' }}><T v="semi">{o.supplierName}</T><T v="mono" color={c.pri}>{o.orderCode}</T></Row>
              <T v="small" mute>Giao từ {[o.storeAddress, o.storeCity].filter(Boolean).join(', ')}{o.distanceKm != null ? ` · ~${o.distanceKm} km` : ''}</T>
              <Row style={{ justifyContent: 'space-between' }}><T mute>Tổng đơn</T><T v="semi" color={c.pri}>{formatVnd(o.totalAmount)}</T></Row>
            </Card>
          ))}
          <Row style={{ justifyContent: 'space-between' }}><T v="semi">Tổng thanh toán</T><T v="price" color={c.pri}>{formatVnd(result.grandTotal)}</T></Row>
          <Button title="Xem đơn hàng" kind="outline" onPress={() => navigation.navigate('Orders')} />
        </ScrollView>
      </Screen>
    );
  }

  if (cartQ.isLoading || addrQ.isLoading) return <Screen><AppBar title="Thanh toán" onBack={() => navigation.goBack()} /><View style={{ padding: 20, gap: 12 }}><Skeleton h={120} r={22} /><Skeleton h={160} r={22} /></View></Screen>;
  if (!items.length) {
    return <Screen><AppBar title="Thanh toán" onBack={() => navigation.goBack()} /><EmptyState icon="cart" title="Giỏ hàng trống" hint="Thêm sản phẩm vào giỏ trước khi thanh toán." action="Xem cửa hàng" onAction={() => navigation.navigate('Main', { screen: 'Shop' })} /></Screen>;
  }

  return (
    <Screen>
      <AppBar title="Thanh toán" onBack={() => navigation.goBack()} />
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 180 }}>
        {/* 1. Địa chỉ */}
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="h3">1. Địa chỉ nhận hàng</T>
          <Pressable onPress={() => navigation.navigate('AddressForm', { requireCoordinates: true, returnTo: 'Checkout' })} style={{ height: 44, justifyContent: 'center' }}><T v="semi" color={c.pri}>+ Thêm</T></Pressable>
        </Row>
        {!addresses.length ? <Card><T mute>Bạn chưa có địa chỉ nào. Thêm địa chỉ có ghim vị trí để BE tính phí giao hàng.</T></Card> : addresses.map((a) => {
          const on = a.id === selectedId;
          return (
            <Card key={a.id} onPress={() => (a.hasCoordinates ? setSelectedId(a.id) : navigation.navigate('AddressForm', { address: a, requireCoordinates: true, returnTo: 'Checkout' }))}
              style={{ gap: 4, borderColor: on ? c.pri : c.line, borderWidth: on ? 2 : 1 }}>
              <Row style={{ gap: 8, flexWrap: 'wrap' }}>
                <Icon name={on ? 'check' : 'pin'} size={18} color={on ? c.pri : c.mute} />
                <T v="semi">{a.recipientName}</T><T mute>· {a.recipientPhone}</T>
                {a.isDefault ? <Badge kind="closed" label="Mặc định" /> : null}
              </Row>
              <T v="small" mute>{formatAddressLine(a)}</T>
              {!a.hasCoordinates ? <T v="small" color={c.goldtx}>Chưa ghim vị trí — bấm để ghim trước khi đặt</T> : null}
            </Card>
          );
        })}

        {/* 2. Sản phẩm */}
        <T v="h3">2. Sản phẩm ({cart.totalQuantity})</T>
        <Card style={{ gap: 8 }}>
          {items.map((i) => (
            <Row key={i.id} style={{ justifyContent: 'space-between', gap: 10 }}>
              <T style={{ flex: 1 }} numberOfLines={2}>{i.productName} × {i.quantity}</T><T v="semi">{formatVnd(i.lineTotal)}</T>
            </Row>
          ))}
          <Pressable onPress={() => navigation.navigate('Cart')} style={{ height: 40, justifyContent: 'center' }}><T v="small" color={c.pri}>Sửa giỏ hàng</T></Pressable>
        </Card>

        {/* 3. Voucher */}
        <T v="h3">3. Voucher</T>
        {vq.isLoading ? <Skeleton h={64} r={16} /> : !vouchers.length ? <T v="small" mute>Chưa có voucher dùng được cho giỏ hàng này.</T> : vouchers.map((v) => {
          const on = voucherIds.includes(v.id);
          return (
            <Card key={v.id} onPress={() => toggleVoucher(v)} pad={12} style={{ gap: 4, opacity: v.eligible ? 1 : 0.55, borderColor: on ? c.pri : c.line, borderWidth: on ? 2 : 1 }}>
              <Row style={{ gap: 8 }}>
                <Icon name={v.type === 'shipping' ? 'truck' : 'tag'} size={18} color={c.pri} />
                <T v="semi" style={{ flex: 1 }} numberOfLines={1}>{v.name}</T>
                {on ? <Icon name="check" size={18} color={c.pri} /> : null}
              </Row>
              <T v="small" mute>{[v.scope === 'shop' && v.supplierName ? `Của ${v.supplierName}` : 'Toàn sàn', v.minOrderAmount ? `Đơn từ ${formatVnd(v.minOrderAmount)}` : null, v.estimatedDiscount ? `Giảm ~${formatVnd(v.estimatedDiscount)}` : null].filter(Boolean).join(' · ')}</T>
              {!v.eligible && v.reason ? <T v="small" color={c.goldtx}>{v.reason}</T> : null}
            </Card>
          );
        })}
        {couponErrors.map((e) => <T key={e.promotionId} v="small" color={c.err}>{e.message || e.errorCode}</T>)}

        {/* 4. Ghi chú + VAT */}
        <T v="h3">4. Ghi chú cho người bán</T>
        <Field value={note} onChangeText={(t) => setNote(t.slice(0, NOTE_MAX))} placeholder="Ví dụ: giao giờ hành chính" multiline />
        {isBusiness ? (
          <Pressable onPress={() => setVat(!vat)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 }}>
            <View style={{ width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, borderColor: c.pri, backgroundColor: vat ? c.pri : 'transparent', alignItems: 'center', justifyContent: 'center' }}>{vat ? <Icon name="check" size={16} color={c.onpri} /> : null}</View>
            <T style={{ flex: 1 }}>Xuất hoá đơn VAT theo hồ sơ doanh nghiệp</T>
          </Pressable>
        ) : null}
        {unavailable > 0 ? <T color={c.err}>Giỏ có {unavailable} sản phẩm ngừng bán — quay lại giỏ để xoá.</T> : null}
        {err ? <T color={c.err}>{err}</T> : null}
      </ScrollView>

      {/* Tóm tắt + đặt hàng */}
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: 16, gap: 6, backgroundColor: c.surf, borderTopWidth: 1, borderTopColor: c.line }}>
        <Row style={{ justifyContent: 'space-between' }}><T v="small" mute>Tạm tính</T><T v="small">{formatVnd(p?.subtotal ?? cart.subtotal)}</T></Row>
        <Row style={{ justifyContent: 'space-between' }}>
          <T v="small" mute>Phí vận chuyển</T>
          <T v="small">{p ? (Number(p.shippingFee) === 0 ? 'Miễn phí' : formatVnd(p.shippingFee)) : 'Chọn địa chỉ để tính'}</T>
        </Row>
        {Number(p?.discount) > 0 ? <Row style={{ justifyContent: 'space-between' }}><T v="small" color={c.forest}>Giảm giá</T><T v="small" color={c.forest}>−{formatVnd(p.discount)}</T></Row> : null}
        {(p?.groups ?? []).filter((g) => g.amountToFreeShip > 0).map((g) => <T key={g.supplierId} v="small" color={c.goldtx}>Mua thêm {formatVnd(g.amountToFreeShip)} của {g.supplierName} để được miễn phí ship</T>)}
        <Row style={{ justifyContent: 'space-between' }}><T v="semi">Tổng cộng</T><T v="price" color={c.pri}>{formatVnd(p?.grandTotal ?? cart.subtotal)}</T></Row>
        <Button title="Đặt hàng & lấy mã QR" icon="card" onPress={submit} disabled={!canSubmit} loading={checkout.isPending} />
      </View>
    </Screen>
  );
}
