import React, { useEffect } from 'react';
import { View, Image, Platform } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';
import { T, Card, Button, Skeleton, Row, useToast } from './ui.js';
import Icon from './Icon.js';
import { useTheme } from '../theme/theme.js';
import { usePaymentPoll, useRepayOrder, ORDERS_KEY } from '../hooks/shop.js';
import { errMsg } from '../api/client.js';
import { formatVnd, formatDateTime } from '../utils/format.js';

/*
 * Khối QR chuyển khoản cho ĐƠN HÀNG (port web OrderPaymentPanel) — dùng sau khi checkout và ở chi tiết đơn còn chờ thanh toán.
 * Nhiều đơn trong 1 lần checkout dùng CHUNG 1 payment → 1 QR. Poll GET /payments/{id} 4s/lần; 'paid' → webhook SePay đã tự
 * chuyển đơn sang 'paid', app chỉ làm mới cache đơn. 'expired' VẪN hiện QR (BE nhận tiền trả muộn qua QR cũ) + nút
 * "Lấy mã QR mới" (POST /orders/{id}/payment gia hạn CÙNG payment, txnRef giữ nguyên). Chỉ 'failed' mới bỏ QR.
 */
export default function OrderPaymentPanel({ paymentId, orderId, fallback = {}, onPaid }) {
  const { c } = useTheme();
  const toast = useToast();
  const qc = useQueryClient();
  const { data: payment, isError } = usePaymentPoll(paymentId);
  const repay = useRepayOrder();

  const status = payment?.status ?? fallback.status ?? 'pending';
  const qrUrl = payment?.qrUrl ?? fallback.qrUrl;
  const amount = payment?.amount ?? fallback.amount;
  const txnRef = payment?.txnRef ?? fallback.txnRef;
  const expiresAt = payment?.expiresAt ?? fallback.expiresAt;
  const expired = status === 'expired' || (status === 'pending' && expiresAt && new Date(expiresAt) <= new Date());

  useEffect(() => {
    if (status !== 'paid') return;
    qc.invalidateQueries({ queryKey: ORDERS_KEY });
    qc.invalidateQueries({ queryKey: ['order'] });
    onPaid?.();
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  const doRepay = () => repay.mutate(orderId, {
    onError: (e) => {
      if (e?.response?.status === 409) { // đơn/payment không còn chờ → tải lại để hiện trạng thái thật
        qc.invalidateQueries({ queryKey: ['payment', paymentId] });
        qc.invalidateQueries({ queryKey: ['order'] });
        qc.invalidateQueries({ queryKey: ORDERS_KEY });
      }
    },
  });
  const copy = async () => { await Clipboard.setStringAsync(txnRef); toast('Đã sao chép nội dung chuyển khoản'); };
  const saveQr = async () => {
    try {
      const perm = await MediaLibrary.requestPermissionsAsync(true);
      if (!perm.granted) { toast('Cần quyền lưu ảnh để lưu mã QR'); return; }
      const res = await FileSystem.downloadAsync(qrUrl, `${FileSystem.cacheDirectory}woodhub-order-qr-${paymentId}.png`);
      await MediaLibrary.saveToLibraryAsync(res.uri);
      toast('Đã lưu mã QR vào thư viện ảnh');
    } catch { toast('Không lưu được mã QR'); }
  };

  if (status === 'paid') {
    return (
      <Card style={{ alignItems: 'center', gap: 8, backgroundColor: c.bcBg, borderColor: c.bcBg }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, backgroundColor: c.surf, alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={36} color={c.bcTx} /></View>
        <T v="h3" color={c.bcTx}>Đã thanh toán</T>
        <T v="small" color={c.bcTx} style={{ textAlign: 'center' }}>Nhà cung cấp sẽ xác nhận và chuẩn bị hàng cho bạn.</T>
      </Card>
    );
  }
  if (status === 'failed') {
    return <Card style={{ backgroundColor: c.brBg, borderColor: c.brBg }}><T color={c.brTx}>Thanh toán không thành công. Bạn có thể huỷ đơn và đặt lại.</T></Card>;
  }
  return (
    <Card style={{ alignItems: 'center', gap: 8 }}>
      {qrUrl ? <Image source={{ uri: qrUrl }} accessibilityLabel="Mã QR chuyển khoản" style={{ width: 224, height: 224, borderRadius: 16, backgroundColor: '#fff' }} resizeMode="contain" /> : <Skeleton w={224} h={224} r={16} />}
      {amount != null ? <T v="h2" color={c.pri}>{formatVnd(amount)}</T> : null}
      {txnRef ? <Row style={{ gap: 6 }}><T v="small" mute>Nội dung CK:</T><T v="mono" color={c.ink}>{txnRef}</T></Row> : null}
      <Row style={{ gap: 10, alignSelf: 'stretch' }}>
        {txnRef ? <Button small kind="outline" icon="copy" title="Sao chép" style={{ flex: 1 }} onPress={copy} /> : null}
        {Platform.OS !== 'web' && qrUrl ? <Button small kind="outline" icon="download" title="Lưu QR" style={{ flex: 1 }} onPress={saveQr} /> : null}
      </Row>
      <T v="small" mute style={{ textAlign: 'center' }}>Mở app ngân hàng, quét mã và giữ nguyên nội dung chuyển khoản — trang tự cập nhật khi tiền vào.</T>
      {expired ? (
        <View style={{ alignSelf: 'stretch', gap: 8 }}>
          <View style={{ backgroundColor: c.bpBg, borderRadius: 12, padding: 10 }}>
            <T v="small" color={c.bpTx}>Đã quá giờ hiển thị của mã QR, nhưng bạn vẫn quét mã này để thanh toán được — hệ thống tự ghi nhận khi tiền vào.</T>
          </View>
          {orderId ? <Button small title="Lấy mã QR mới" icon="rotate" onPress={doRepay} loading={repay.isPending} /> : null}
          {repay.isError ? <T v="small" color={c.err}>{errMsg(repay.error, 'Không lấy được mã QR mới.')}</T> : null}
        </View>
      ) : expiresAt ? <T v="small" mute>Mã QR hết hạn lúc {formatDateTime(expiresAt)}</T> : null}
      {isError ? <T v="small" color={c.err}>Không kiểm tra được trạng thái thanh toán — sẽ thử lại.</T>
        : <Row style={{ gap: 8 }}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.gold }} /><T v="small">Đang chờ thanh toán…</T></Row>}
    </Card>
  );
}
