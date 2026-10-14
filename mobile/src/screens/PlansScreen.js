import React, { useEffect, useRef, useState } from 'react';
import { View, ScrollView, Image, Platform } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system/legacy';
import { Screen, AppBar, T, Card, Button, Badge, BottomSheet, Skeleton, ErrorState, ProgressBar, Row, useToast } from '../components/ui.js';
import Icon from '../components/Icon.js';
import { useTheme } from '../theme/theme.js';
import { api, errMsg } from '../api/client.js';
import { formatVnd, formatDate } from '../utils/format.js';
import { sortPlans, planHighlights, planValidity } from '../utils/planFeatures.js';
import { formatDay } from '../utils/quoteSummary.js';

const FEATURE = { design: 'Thiết kế 3D / tháng', ai_chat: 'Chat trợ lý AI / tháng' };
const label = (h) => (h.type === 'text' ? h.text : `${FEATURE[h.key] || h.key}: ${h.kind === 'unlimited' ? 'không giới hạn' : h.count}`);

/*
 * Thanh toán gói bằng VietQR/SePay (giống PaymentQrModal của web): tạo payment → hiện QR → hỏi trạng thái mỗi 4 giây.
 * paid → BE tự kích hoạt gói qua webhook (app KHÔNG gọi POST /subscriptions cho gói trả phí). KHÔNG đụng số tiền/nội dung chuyển khoản.
 */
function PaymentSheet({ plan, subscription, onClose }) {
  const { c } = useTheme();
  const toast = useToast();
  const qc = useQueryClient();
  const [payment, setPayment] = useState(null);
  const [err, setErr] = useState('');
  const timer = useRef(null);

  const start = async () => {
    setPayment(null); setErr('');
    try { setPayment(await api.createPayment(plan.id)); } catch (e) { setErr(errMsg(e)); }
  };
  useEffect(() => { if (plan) start(); return () => clearTimeout(timer.current); }, [plan?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Poll tới khi hết trạng thái pending
  useEffect(() => {
    if (!payment || payment.status !== 'pending') return undefined;
    let stop = false;
    const tick = async () => {
      try {
        const p = await api.getPayment(payment.id);
        if (stop) return;
        if (p.status !== 'pending') {
          setPayment(p);
          if (p.status === 'paid') ['subscription', 'usage', 'payments'].forEach((k) => qc.invalidateQueries({ queryKey: [k] }));
          return;
        }
      } catch { /* lỗi mạng thoáng qua: thử lại vòng sau */ }
      timer.current = setTimeout(tick, 4000);
    };
    timer.current = setTimeout(tick, 4000);
    return () => { stop = true; clearTimeout(timer.current); };
  }, [payment?.id, payment?.status]); // eslint-disable-line react-hooks/exhaustive-deps

  const copy = async () => { await Clipboard.setStringAsync(payment.txnRef); toast('Đã sao chép nội dung chuyển khoản'); };
  const saveQr = async () => {
    try {
      const perm = await MediaLibrary.requestPermissionsAsync(true);
      if (!perm.granted) { toast('Cần quyền lưu ảnh để lưu mã QR'); return; }
      const file = `${FileSystem.cacheDirectory}woodhub-qr-${payment.id}.png`;
      const res = await FileSystem.downloadAsync(payment.qrUrl, file);
      await MediaLibrary.saveToLibraryAsync(res.uri);
      toast('Đã lưu mã QR vào thư viện ảnh');
    } catch { toast('Không lưu được mã QR'); }
  };

  const st = payment?.status;
  const v = plan ? planValidity(subscription, plan) : null;
  return (
    <BottomSheet visible={!!plan} onClose={onClose} title={plan ? `Thanh toán gói ${plan.displayName}` : ''}>
      {plan ? (
        <>
          <Card style={{ backgroundColor: c.surf2, gap: 6 }} pad={12}>
            <Row style={{ justifyContent: 'space-between' }}><T v="semi">Bạn sẽ nhận</T><T v="semi" color={c.pri}>{formatVnd(plan.price)}/tháng</T></Row>
            {planHighlights(plan).slice(0, 3).map((h, i) => <T key={i} v="small">• {label(h)}</T>)}
            {v ? <T v="small" mute>{v.stacked ? `Cộng dồn: hạn hiện tại ${formatDay(v.currentEnd)} → ${formatDay(v.to)}` : `Hiệu lực dự kiến: ${formatDay(v.from)} → ${formatDay(v.to)}`}</T> : null}
          </Card>
          {st === 'paid' ? (
            <View style={{ alignItems: 'center', gap: 8, paddingVertical: 12 }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: c.bnBg, alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={44} color={c.bnTx} /></View>
              <T v="h3">Thanh toán thành công</T>
              <T mute style={{ textAlign: 'center' }}>Gói {plan.displayName} đã được kích hoạt.</T>
              <Button title="Hoàn tất" onPress={onClose} style={{ alignSelf: 'stretch', marginTop: 8 }} />
            </View>
          ) : st === 'expired' || st === 'failed' ? (
            <View style={{ alignItems: 'center', gap: 10 }}>
              <T color={st === 'expired' ? c.bpTx : c.err}>{st === 'expired' ? 'Mã QR đã hết hạn.' : 'Thanh toán không thành công.'}</T>
              <Button title="Tạo mã mới" onPress={start} style={{ alignSelf: 'stretch' }} />
            </View>
          ) : err ? (
            <View style={{ gap: 10 }}><T color={c.err}>{err}</T><Button title="Thử lại" onPress={start} /></View>
          ) : !payment ? (
            <View style={{ gap: 10, alignItems: 'center' }}><Skeleton h={220} w={220} r={16} /><T v="small" mute>Đang tạo mã thanh toán…</T></View>
          ) : (
            <View style={{ alignItems: 'center', gap: 8 }}>
              <Image source={{ uri: payment.qrUrl }} style={{ width: 230, height: 230, borderRadius: 16, backgroundColor: '#fff' }} resizeMode="contain" />
              <T v="h2" color={c.pri}>{formatVnd(payment.amount)}</T>
              <Row style={{ gap: 6 }}><T v="small" mute>Nội dung CK:</T><T v="mono" color={c.ink}>{payment.txnRef}</T></Row>
              <Row style={{ gap: 10, alignSelf: 'stretch' }}>
                <Button small kind="outline" icon="copy" title="Sao chép" style={{ flex: 1 }} onPress={copy} />
                {Platform.OS !== 'web' ? <Button small kind="outline" icon="download" title="Lưu QR" style={{ flex: 1 }} onPress={saveQr} /> : null}
              </Row>
              <T v="small" mute style={{ textAlign: 'center' }}>Mở app ngân hàng, quét mã và giữ nguyên nội dung chuyển khoản. Hết hạn: {formatDate(payment.expiresAt)}</T>
              <Row style={{ gap: 8 }}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c.gold }} /><T v="small">Đang chờ thanh toán…</T></Row>
            </View>
          )}
        </>
      ) : null}
    </BottomSheet>
  );
}

export default function PlansScreen({ navigation }) {
  const { c } = useTheme();
  const toast = useToast();
  const qc = useQueryClient();
  const plans = useQuery({ queryKey: ['plans'], queryFn: api.getPlans });
  const sub = useQuery({ queryKey: ['subscription'], queryFn: api.getMySubscription });
  const usage = useQuery({ queryKey: ['usage'], queryFn: api.getMyUsage });
  const [pay, setPay] = useState(null);
  const [busy, setBusy] = useState(null);

  const choose = async (p) => {
    if (Number(p.price) > 0) { setPay(p); return; }
    setBusy(p.id);
    try { await api.subscribe(p.id); ['subscription', 'usage'].forEach((k) => qc.invalidateQueries({ queryKey: [k] })); toast('Đã chuyển sang gói miễn phí'); }
    catch (e) { toast(errMsg(e)); } finally { setBusy(null); }
  };

  if (plans.isError) return <Screen><AppBar title="Gói dịch vụ" onBack={() => navigation.goBack()} /><ErrorState offline={!plans.error?.response} onRetry={plans.refetch} /></Screen>;
  const current = sub.data?.plan?.id;

  return (
    <Screen>
      <AppBar title="Gói dịch vụ" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 40 }}>
        {usage.data?.length ? (
          <Card style={{ gap: 10 }}>
            <T v="h3">Hạn mức tháng này</T>
            {usage.data.map((u) => (
              <View key={u.feature} style={{ gap: 6 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <T v="small">{FEATURE[u.feature]?.replace(' / tháng', '') || u.feature}</T>
                  <T v="small" mute>{u.unlimited ? 'Không giới hạn' : `${u.used}/${u.limit} (còn ${u.remaining})`}</T>
                </Row>
                {!u.unlimited && u.limit > 0 ? <ProgressBar pct={(u.used / u.limit) * 100} color={u.remaining === 0 ? c.err : c.pri} /> : null}
              </View>
            ))}
          </Card>
        ) : null}

        {plans.isLoading ? [0, 1].map((i) => <Skeleton key={i} h={170} r={22} />) : sortPlans(plans.data).map((p) => {
          const mine = current === p.id;
          return (
            <Card key={p.id} style={{ gap: 10, borderColor: mine ? c.pri : c.line, borderWidth: mine ? 2 : 1 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <T v="h2">{p.displayName}</T>
                {mine ? <Badge kind="closed" label="Đang dùng" /> : null}
              </Row>
              <T v="price" color={c.pri}>{Number(p.price) > 0 ? `${formatVnd(p.price)}/tháng` : 'Miễn phí'}</T>
              {planHighlights(p).map((h, i) => <Row key={i} style={{ gap: 8, alignItems: 'flex-start' }}><Icon name="check" size={18} color={c.forest} /><T v="small" style={{ flex: 1 }}>{label(h)}</T></Row>)}
              {mine && sub.data?.endDate ? <T v="small" mute>Còn hạn tới {formatDate(sub.data.endDate)}</T> : null}
              <Button title={mine ? (Number(p.price) > 0 ? 'Gia hạn' : 'Gói hiện tại') : Number(p.price) > 0 ? 'Nâng cấp' : 'Chọn gói'} kind={mine && Number(p.price) === 0 ? 'soft' : 'pri'}
                disabled={mine && Number(p.price) === 0} loading={busy === p.id} onPress={() => choose(p)} />
            </Card>
          );
        })}
      </ScrollView>
      <PaymentSheet plan={pay} subscription={sub.data} onClose={() => setPay(null)} />
    </Screen>
  );
}
