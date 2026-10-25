import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { Screen, AppBar, T, Card, Button, Badge, BottomSheet, Skeleton, ErrorState, Row } from '../components/ui.js';
import { useTheme } from '../theme/theme.js';
import { useBulkQuote, useAcceptBulkQuote, useRejectBulkQuote, useCancelBulkQuote, BULK_STATUS, savingPercent } from '../hooks/account.js';
import OrderPaymentPanel from '../components/OrderPaymentPanel.js';
import { errMsg } from '../api/client.js';
import { formatVnd, formatDate } from '../utils/format.js';

/*
 * Chi tiết yêu cầu báo giá số lượng lớn — phía khách (port web BulkQuoteDetailView).
 * - So sánh giá niêm yết ↔ giá NCC báo (% tiết kiệm). Giá báo là giá cuối cùng (BE không cộng thuế).
 * - Chấp nhận: POST accept { offerId đang xem } → 1 đơn chờ thanh toán + QR (dùng lại OrderPaymentPanel của checkout).
 * - 409 BULK_QUOTE_INVALID_STATE = NCC vừa báo giá lại / yêu cầu đã đổi trạng thái → tải lại để khách xem trước khi chấp nhận.
 */
const CONFIRM = {
  reject: ['Từ chối báo giá này?', 'Yêu cầu sẽ kết thúc.', 'Từ chối báo giá'],
  cancel: ['Huỷ yêu cầu báo giá này?', 'Nhà cung cấp sẽ không báo giá nữa.', 'Huỷ yêu cầu'],
};

export default function BulkQuoteDetailScreen({ navigation, route }) {
  const { c } = useTheme();
  const { id } = route.params;
  const q = useBulkQuote(id);
  const accept = useAcceptBulkQuote();
  const reject = useRejectBulkQuote();
  const cancel = useCancelBulkQuote();
  const [checkout, setCheckout] = useState(null); // CheckoutResponse sau khi chấp nhận
  const [ask, setAsk] = useState(null); // 'reject' | 'cancel'
  const [err, setErr] = useState('');

  const onError = (e) => {
    if (e?.response?.data?.errorCode === 'BULK_QUOTE_INVALID_STATE') {
      q.refetch(); setErr('Nhà cung cấp vừa gửi báo giá mới hoặc yêu cầu đã thay đổi — đã tải lại, vui lòng xem lại trước khi chấp nhận.');
      return;
    }
    setErr(errMsg(e));
  };
  const doAccept = async () => {
    setErr('');
    try { setCheckout(await accept.mutateAsync({ id: b.id, offerId: b.offer.id })); } catch (e) { onError(e); }
  };
  const doConfirm = async () => {
    setErr('');
    try { await (ask === 'reject' ? reject : cancel).mutateAsync(b.id); setAsk(null); } catch (e) { setAsk(null); onError(e); }
  };

  if (q.isError) return <Screen><AppBar title="Yêu cầu báo giá" onBack={() => navigation.goBack()} /><ErrorState offline={!q.error?.response} onRetry={q.refetch} /></Screen>;
  const b = q.data;
  const offer = b?.offer;
  const [kind, label] = b ? BULK_STATUS[b.status] || ['muted', b.status] : [];
  const priceOf = (itemId) => offer?.items?.find((x) => x.quoteItemId === itemId);
  const open = b && ['pending', 'offered'].includes(b.status);
  const canAccept = b?.status === 'offered' && offer && !offer.expired;

  return (
    <Screen>
      <AppBar title="Yêu cầu báo giá" onBack={() => navigation.goBack()} />
      {!b ? <View style={{ padding: 20, gap: 12 }}><Skeleton h={120} r={22} /><Skeleton h={200} r={22} /></View> : (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}>
          <View style={{ gap: 6 }}>
            <T v="h2">{b.supplier?.companyName || b.supplier?.name}</T>
            <Row style={{ gap: 8, flexWrap: 'wrap' }}>
              <Badge kind={kind} label={label} />
              {b.vatRequested ? <Badge kind="muted" label="Có yêu cầu hoá đơn VAT" /> : null}
            </Row>
            <T v="small" mute>{formatDate(b.createdAt)}{b.status === 'pending' && b.expiresAt ? ` · Hạn báo giá: ${formatDate(b.expiresAt)}` : ''}</T>
          </View>

          {b.orderId ? (
            <Card style={{ backgroundColor: c.bcBg, borderColor: c.bcBg, gap: 8 }} pad={12}>
              <T color={c.bcTx}>Đã tạo đơn hàng từ báo giá.</T>
              <Button small kind="outline" title="Xem đơn hàng" onPress={() => navigation.navigate('OrderDetail', { id: b.orderId })} />
            </Card>
          ) : null}
          {b.status === 'declined' ? (
            <Card style={{ backgroundColor: c.brBg, borderColor: c.brBg }} pad={12}>
              <T color={c.brTx}>Nhà cung cấp đã từ chối yêu cầu.{b.declineReason ? ` Lý do: ${b.declineReason}` : ''}</T>
            </Card>
          ) : null}

          {/* Sản phẩm + so sánh giá (thẻ thay bảng cho vừa màn hình điện thoại) */}
          <Card style={{ gap: 12 }}>
            {b.items.map((it, i) => {
              const p = priceOf(it.id);
              const pct = savingPercent(it.listPrice, p?.unitPrice);
              return (
                <View key={it.id} style={{ gap: 4, paddingTop: i ? 12 : 0, borderTopWidth: i ? 1 : 0, borderTopColor: c.line }}>
                  <T v="semi" color={it.productId ? c.pri : c.ink} onPress={it.productId ? () => navigation.navigate('Product', { id: it.productId }) : undefined}>{it.productName}</T>
                  {[it.variantSku, it.color, it.dimensions].filter(Boolean).length ? <T v="small" mute>{[it.variantSku, it.color, it.dimensions].filter(Boolean).join(' · ')}</T> : null}
                  <Row style={{ justifyContent: 'space-between' }}><T v="small" mute>Số lượng</T><T v="small">{it.quantity}</T></Row>
                  <Row style={{ justifyContent: 'space-between' }}><T v="small" mute>Giá niêm yết</T><T v="small" mute>{it.listPrice != null ? formatVnd(it.listPrice) : '—'}</T></Row>
                  {offer ? (
                    <>
                      <Row style={{ justifyContent: 'space-between' }}>
                        <T v="small" mute>Đơn giá báo</T>
                        <T v="small" style={{ fontWeight: '600' }}>{p ? formatVnd(p.unitPrice) : '—'}{pct > 0 ? `  (tiết kiệm ${pct}%)` : ''}</T>
                      </Row>
                      <Row style={{ justifyContent: 'space-between' }}><T v="small" mute>Thành tiền</T><T v="small">{p ? formatVnd(p.lineTotal) : '—'}</T></Row>
                    </>
                  ) : null}
                </View>
              );
            })}
            <View style={{ gap: 4, paddingTop: 12, borderTopWidth: 1, borderTopColor: c.line }}>
              <T v="small"><T v="small" mute>Giao tới: </T>{b.recipientName} ({b.recipientPhone}), {[b.shippingAddress, b.ward, b.district, b.city].filter(Boolean).join(', ')}</T>
              {b.note ? <T v="small"><T v="small" mute>Ghi chú của bạn: </T>{b.note}</T> : null}
            </View>
          </Card>

          {/* Báo giá hiện hành */}
          {offer ? (
            <Card style={{ gap: 8, borderColor: c.pri }}>
              <T v="h3">Báo giá của nhà cung cấp</T>
              <Row style={{ justifyContent: 'space-between' }}><T mute>Tiền hàng</T><T>{formatVnd(offer.subtotal)}</T></Row>
              <Row style={{ justifyContent: 'space-between' }}><T mute>Phí vận chuyển</T><T>{Number(offer.shippingFee) === 0 ? 'Miễn phí' : formatVnd(offer.shippingFee)}</T></Row>
              <Row style={{ justifyContent: 'space-between', paddingTop: 8, borderTopWidth: 1, borderTopColor: c.line }}><T v="semi">Tổng thanh toán</T><T v="semi" color={c.pri}>{formatVnd(offer.totalAmount)}</T></Row>
              <T v="small" mute>
                Thời gian giao: {offer.leadTimeDays} ngày · {offer.expired ? '' : `Hiệu lực tới ${formatDate(offer.validUntil)}`}
                {b.offerCount > 1 ? ` · Đã báo giá lại ${b.offerCount - 1} lần` : ''}
              </T>
              {offer.expired ? <T v="small" color={c.err}>Báo giá đã hết hạn — nhắn nhà cung cấp để báo giá lại.</T> : null}
              {offer.note ? <T v="small"><T v="small" mute>Ghi chú của nhà cung cấp: </T>{offer.note}</T> : null}
            </Card>
          ) : b.status === 'pending' ? (
            <Card style={{ alignItems: 'center' }}><T mute>Nhà cung cấp chưa gửi báo giá.</T></Card>
          ) : null}

          {checkout ? (
            <View style={{ gap: 10 }}>
              <T v="h3">Thanh toán đơn từ báo giá</T>
              <OrderPaymentPanel paymentId={checkout.payment?.id} orderId={checkout.orders?.[0]?.id} fallback={checkout.payment} onPaid={q.refetch} />
              {checkout.orders?.[0]?.id ? <Button kind="outline" title="Xem đơn hàng" onPress={() => navigation.navigate('OrderDetail', { id: checkout.orders[0].id })} /> : null}
            </View>
          ) : open ? (
            <View style={{ gap: 10 }}>
              {canAccept ? <Button title="Chấp nhận & thanh toán" onPress={doAccept} loading={accept.isPending} /> : null}
              {b.status === 'offered' ? <Button title="Từ chối báo giá" kind="outline" onPress={() => setAsk('reject')} /> : null}
              <Button title="Huỷ yêu cầu" kind="ghost" onPress={() => setAsk('cancel')} />
            </View>
          ) : null}
          {err ? <T color={c.err}>{err}</T> : null}
        </ScrollView>
      )}

      <BottomSheet visible={!!ask} onClose={() => setAsk(null)} title={ask ? CONFIRM[ask][0] : ''}
        footer={<Row style={{ gap: 10 }}><Button title="Để lại" kind="outline" style={{ flex: 1 }} onPress={() => setAsk(null)} /><Button title={ask ? CONFIRM[ask][2] : ''} kind="danger" style={{ flex: 1 }} onPress={doConfirm} loading={reject.isPending || cancel.isPending} /></Row>}>
        <T mute>{ask ? CONFIRM[ask][1] : ''}</T>
      </BottomSheet>
    </Screen>
  );
}
