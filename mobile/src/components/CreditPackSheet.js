import React, { useEffect, useState } from 'react';
import { View, Image } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { BottomSheet, T, Card, Button, Skeleton, Row, useToast } from './ui.js';
import Icon from './Icon.js';
import { useTheme } from '../theme/theme.js';
import { usePaymentPoll } from '../hooks/shop.js';
import { api, errMsg } from '../api/client.js';
import { formatVnd, formatDateTime } from '../utils/format.js';

/*
 * Mua gói lượt thiết kế (port web CreditPackPaymentModal): POST /payments/credit-pack { packId } → QR → poll 4s.
 * 'paid' → BE đã tự cộng lượt vào ví (purchasedRemaining tăng) → chỉ làm mới usage. Hết hạn / thất bại → tạo mã mới.
 * Khác gói đăng ký: lượt mua dùng đến hết, không reset theo tháng.
 */
export default function CreditPackSheet({ pack, onClose }) {
  const { c } = useTheme();
  const toast = useToast();
  const qc = useQueryClient();
  const [payment, setPayment] = useState(null);
  const [err, setErr] = useState('');
  const poll = usePaymentPoll(payment?.id);
  const p = poll.data ?? payment;
  const st = p?.status;

  const start = async () => {
    setPayment(null); setErr('');
    try { setPayment(await api.createCreditPackPayment(pack.id)); } catch (e) { setErr(errMsg(e, 'Không tạo được mã thanh toán.')); }
  };
  useEffect(() => { if (pack) start(); else setPayment(null); }, [pack?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (st === 'paid') qc.invalidateQueries({ queryKey: ['usage'] }); }, [st]); // eslint-disable-line react-hooks/exhaustive-deps

  const copy = async () => { await Clipboard.setStringAsync(p.txnRef); toast('Đã sao chép nội dung chuyển khoản'); };

  return (
    <BottomSheet visible={!!pack} onClose={onClose} title={pack ? `Mua ${pack.displayName}` : ''}>
      {pack ? (
        <>
          <Card style={{ backgroundColor: c.surf2 }} pad={12}>
            <Row style={{ justifyContent: 'space-between' }}><T v="semi">+{pack.credits} lượt thiết kế 3D</T><T v="semi" color={c.pri}>{formatVnd(pack.price)}</T></Row>
            <T v="small" mute>Dùng đến hết, không reset theo tháng — dùng sau khi hết hạn mức của gói.</T>
          </Card>
          {st === 'paid' ? (
            <View style={{ alignItems: 'center', gap: 8, paddingVertical: 12 }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: c.bcBg, alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={44} color={c.bcTx} /></View>
              <T v="h3">Đã cộng {pack.credits} lượt thiết kế!</T>
              <Button title="Hoàn tất" onPress={onClose} style={{ alignSelf: 'stretch', marginTop: 8 }} />
            </View>
          ) : st === 'expired' || st === 'failed' ? (
            <View style={{ gap: 10 }}>
              <T color={st === 'expired' ? c.bpTx : c.err}>{st === 'expired' ? 'Mã QR đã hết hạn.' : 'Thanh toán không thành công.'}</T>
              <Button title="Tạo mã mới" onPress={start} />
            </View>
          ) : err ? (
            <View style={{ gap: 10 }}><T color={c.err}>{err}</T><Button title="Thử lại" onPress={start} /></View>
          ) : !p ? (
            <View style={{ alignItems: 'center', gap: 10 }}><Skeleton w={220} h={220} r={16} /><T v="small" mute>Đang tạo mã thanh toán…</T></View>
          ) : (
            <View style={{ alignItems: 'center', gap: 8 }}>
              <Image source={{ uri: p.qrUrl }} accessibilityLabel="Mã QR chuyển khoản" style={{ width: 224, height: 224, borderRadius: 16, backgroundColor: '#fff' }} resizeMode="contain" />
              <T v="h2" color={c.pri}>{formatVnd(p.amount)}</T>
              <Row style={{ gap: 6 }}><T v="small" mute>Nội dung CK:</T><T v="mono" color={c.ink}>{p.txnRef}</T></Row>
              <Button small kind="outline" icon="copy" title="Sao chép nội dung" onPress={copy} style={{ alignSelf: 'stretch' }} />
              <T v="small" mute style={{ textAlign: 'center' }}>Quét bằng app ngân hàng, giữ nguyên nội dung chuyển khoản. Hết hạn: {formatDateTime(p.expiresAt)}</T>
              <Row style={{ gap: 8 }}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.gold }} /><T v="small">Đang chờ thanh toán…</T></Row>
            </View>
          )}
        </>
      ) : null}
    </BottomSheet>
  );
}
