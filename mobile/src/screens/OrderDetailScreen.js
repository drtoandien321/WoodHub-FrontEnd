import React, { useState } from 'react';
import { View, ScrollView, Linking } from 'react-native';
import { Screen, AppBar, T, Card, Badge, Button, Skeleton, ErrorState, Row, BottomSheet } from '../components/ui.js';
import OrderPaymentPanel from '../components/OrderPaymentPanel.js';
import { useTheme } from '../theme/theme.js';
import { useOrder, useCancelOrder } from '../hooks/shop.js';
import { errMsg } from '../api/client.js';
import { formatVnd, formatDateTime } from '../utils/format.js';
import { ORDER_STATUS, ORDER_FLOW } from '../utils/orders.js';

/*
 * Chi tiết đơn (port web pages/OrderDetail.jsx): tiến trình trạng thái, giao tới, NCC + chi nhánh gửi, sản phẩm, tổng tiền.
 * Còn chờ thanh toán → khối QR (lấy mã mới khi hết hạn) + nút huỷ đơn (chỉ BE cho huỷ ở pending_payment).
 */
export default function OrderDetailScreen({ navigation, route }) {
  const { c } = useTheme();
  const { id } = route.params;
  const q = useOrder(id);
  const cancel = useCancelOrder();
  const [ask, setAsk] = useState(false);
  const [err, setErr] = useState('');

  if (q.isError) return <Screen><AppBar title="Chi tiết đơn" onBack={() => navigation.goBack()} /><ErrorState offline={!q.error?.response} onRetry={q.refetch} /></Screen>;
  const o = q.data;
  if (!o) return <Screen><AppBar title="Chi tiết đơn" onBack={() => navigation.goBack()} /><View style={{ padding: 20, gap: 12 }}><Skeleton h={90} r={22} /><Skeleton h={200} r={22} /></View></Screen>;

  const [kind, label] = ORDER_STATUS[o.status] || ['muted', o.status];
  const step = ORDER_FLOW.indexOf(o.status);
  const pending = o.status === 'pending_payment';
  const doCancel = async () => {
    setErr('');
    try { await cancel.mutateAsync(o.id); setAsk(false); } catch (e) { setErr(errMsg(e, 'Không huỷ được đơn.')); setAsk(false); }
  };
  const money = (k, v, color) => <Row key={k} style={{ justifyContent: 'space-between' }}><T v="small" mute={!color} color={color}>{k}</T><T v="small" color={color}>{v}</T></Row>;

  return (
    <Screen>
      <AppBar title="Chi tiết đơn" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 40 }}>
        <Card style={{ gap: 8 }}>
          <Row style={{ justifyContent: 'space-between' }}><T v="mono" color={c.pri}>{o.orderCode}</T><Badge kind={kind} label={label} /></Row>
          <T v="small" mute>Đặt lúc {formatDateTime(o.placedAt || o.createdAt)}</T>
          {step >= 0 ? (
            <Row style={{ gap: 4, marginTop: 4 }}>
              {ORDER_FLOW.map((s, i) => <View key={s} style={{ flex: 1, height: 6, borderRadius: 3, backgroundColor: i <= step ? c.pri : c.surf2 }} />)}
            </Row>
          ) : <T v="small" mute>{o.status === 'cancelled' ? 'Đơn đã huỷ.' : 'Đơn đã hoàn tiền.'}</T>}
        </Card>

        {pending ? (
          <>
            <OrderPaymentPanel paymentId={o.paymentId} orderId={o.id}
              fallback={{ status: o.paymentStatus, qrUrl: o.paymentQrUrl, txnRef: o.paymentTxnRef, expiresAt: o.paymentExpiresAt, amount: o.totalAmount }}
              onPaid={() => q.refetch()} />
            <Button title="Huỷ đơn" kind="danger" onPress={() => setAsk(true)} />
          </>
        ) : null}
        {err ? <T color={c.err}>{err}</T> : null}

        <Card style={{ gap: 4 }}>
          <T v="label">Giao tới</T>
          <T v="semi">{o.recipientName} · {o.recipientPhone}</T>
          <T v="small" mute>{[o.shippingAddress, o.ward, o.district, o.city].filter(Boolean).join(', ')}</T>
          {o.distanceKm != null ? <T v="small" mute>Khoảng cách ~{o.distanceKm} km</T> : null}
        </Card>

        <Card style={{ gap: 4 }}>
          <T v="label">Nhà cung cấp</T>
          <T v="semi">{o.supplierName}</T>
          {o.storeAddress ? <T v="small" mute>Gửi từ chi nhánh: {[o.storeAddress, o.storeCity].filter(Boolean).join(', ')}</T> : null}
          {o.storePhone ? <T v="small" color={c.pri} onPress={() => Linking.openURL(`tel:${o.storePhone}`)}>{o.storePhone}</T> : null}
          {o.note ? <T v="small" mute>Ghi chú: {o.note}</T> : null}
        </Card>

        <Card style={{ gap: 8 }}>
          {(o.items || []).map((i) => (
            <Row key={i.id} style={{ justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <T v="semi" numberOfLines={2}>{i.productName}</T>
                <T v="small" mute>{[i.color, i.dimensions].filter(Boolean).join(' · ')}{[i.color, i.dimensions].some(Boolean) ? ' · ' : ''}{formatVnd(i.unitPrice)} × {i.quantity}</T>
              </View>
              <T v="semi">{formatVnd(i.lineTotal)}</T>
            </Row>
          ))}
          <View style={{ height: 1, backgroundColor: c.line, marginVertical: 4 }} />
          {money('Tạm tính', formatVnd(o.subtotal))}
          {Number(o.productDiscount) > 0 ? money('Giảm giá sản phẩm', `−${formatVnd(o.productDiscount)}`, c.forest) : null}
          {money('Phí vận chuyển', Number(o.shippingFee) === 0 ? 'Miễn phí' : formatVnd(o.shippingFee))}
          {Number(o.shippingDiscount) > 0 ? money('Giảm phí ship', `−${formatVnd(o.shippingDiscount)}`, c.forest) : null}
          <Row style={{ justifyContent: 'space-between' }}><T v="semi">Tổng cộng</T><T v="price" color={c.pri}>{formatVnd(o.totalAmount)}</T></Row>
        </Card>
      </ScrollView>

      <BottomSheet visible={ask} onClose={() => setAsk(false)} title="Huỷ đơn này?"
        footer={<Row style={{ gap: 10 }}><Button title="Không" kind="outline" style={{ flex: 1 }} onPress={() => setAsk(false)} /><Button title="Huỷ đơn" kind="danger" style={{ flex: 1 }} onPress={doCancel} loading={cancel.isPending} /></Row>}>
        <T mute>Đơn {o.orderCode} sẽ bị huỷ. Bạn chưa chuyển khoản nên không cần hoàn tiền.</T>
      </BottomSheet>
    </Screen>
  );
}
