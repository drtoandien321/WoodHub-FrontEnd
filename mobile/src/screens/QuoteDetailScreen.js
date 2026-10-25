import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Screen, AppBar, T, Card, Badge, Photo, Button, Field, BottomSheet, Skeleton, ErrorState, Row, useToast } from '../components/ui.js';
import { useTheme } from '../theme/theme.js';
import { useAuth } from '../store/auth.js';
import { api, errMsg } from '../api/client.js';
import { formatVnd, formatDateTime } from '../utils/format.js';
import { STATUS } from './QuotesScreen.js';
import { readDesignSnapshot } from '../utils/design.js';
import { useMyDesigns } from '../hooks/data.js';

const TERMINAL = ['accepted', 'rejected', 'expired', 'cancelled'];
const OFFER = { pending: ['pending', 'Chờ phản hồi'], accepted: ['closed', 'Đã chấp nhận'], rejected: ['rej', 'Đã từ chối'], superseded: ['muted', 'Đã bị thay thế'] };

export default function QuoteDetailScreen({ navigation, route }) {
  const { c } = useTheme();
  const toast = useToast();
  const qc = useQueryClient();
  const me = useAuth((s) => s.user);
  const { id } = route.params;
  const q = useQuery({ queryKey: ['quote', id], queryFn: () => api.getQuote(id) });
  const designs = useMyDesigns(); // fallback tên/ảnh cho báo giá cũ (xem QuotesScreen)
  const [sheet, setSheet] = useState(false);
  const [price, setPrice] = useState('');
  const [days, setDays] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState('');
  const [err, setErr] = useState('');

  const refresh = () => { qc.invalidateQueries({ queryKey: ['quote', id] }); qc.invalidateQueries({ queryKey: ['my-quotes'] }); };
  const run = async (key, fn, okMsg) => {
    setBusy(key); setErr('');
    try { await fn(); refresh(); if (okMsg) toast(okMsg); return true; } catch (e) { setErr(errMsg(e)); return false; } finally { setBusy(''); }
  };

  if (q.isError) return <Screen><AppBar title="Báo giá" onBack={() => navigation.goBack()} /><ErrorState offline={!q.error?.response} onRetry={q.refetch} /></Screen>;
  const quote = q.data;
  if (!quote) return <Screen><AppBar title="Báo giá" onBack={() => navigation.goBack()} /><View style={{ padding: 20, gap: 12 }}><Skeleton h={100} r={22} /><Skeleton h={140} r={22} /></View></Screen>;

  const offers = quote.offers || [];
  const latest = offers[offers.length - 1];
  const terminal = TERMINAL.includes(quote.status);
  const mine = me?.id === quote.customerId ? 'customer' : 'workshop';
  const canRespond = latest?.status === 'pending' && latest.offeredBy !== mine && !terminal;
  const [kind, label] = STATUS[quote.status] || ['muted', quote.status];
  const s0 = readDesignSnapshot(quote.designSnapshot);
  const own = (designs.data || []).find((d) => d.id === quote.customDesignId);
  const snap = { ...s0, name: s0.name || own?.name || null, posterUrl: s0.posterUrl || own?.thumbnailUrl || null };

  const sendCounter = async () => {
    const ok = await run('counter', () => api.createOffer({ quoteId: id, price: Number(price), leadTimeDays: Number(days), note: note.trim() || undefined }), 'Đã gửi đề xuất');
    if (ok) { setSheet(false); setPrice(''); setDays(''); setNote(''); }
  };

  return (
    <Screen>
      <AppBar title="Chi tiết báo giá" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}>
        <Card style={{ gap: 12 }}>
          <Row style={{ gap: 12, alignItems: 'flex-start' }}>
            <Photo uri={snap.posterUrl} label={snap.name} style={{ width: 72, height: 72 }} radius={16} />
            <View style={{ flex: 1, gap: 4 }}>
              {snap.name ? <T v="semi" numberOfLines={2}>{snap.name}</T> : null}
              <T v={snap.name ? 'small' : 'h3'} mute={!!snap.name} numberOfLines={2}>{quote.workshopName}</T>
              <Badge kind={kind} label={label} />
            </View>
          </Row>
          <Row style={{ gap: 20 }}>
            <View><T v="small" mute>Số lượng</T><T v="semi">{quote.quantity}</T></View>
            {quote.location ? <View style={{ flex: 1 }}><T v="small" mute>Khu vực</T><T v="semi">{quote.location}</T></View> : null}
          </Row>
          {quote.note ? <T v="small" mute>{quote.note}</T> : null}
        </Card>

        {quote.status === 'accepted' ? (
          <Card style={{ backgroundColor: c.bnBg, borderColor: c.bnBg }}><T color={c.bnTx}>Báo giá đã được chốt — xưởng sẽ liên hệ để bắt đầu sản xuất.</T></Card>
        ) : null}

        <T v="h3">Lịch sử thương lượng</T>
        {offers.length === 0 ? <T mute>Xưởng chưa phản hồi. Bạn sẽ thấy báo giá tại đây khi có.</T> : (
          <View style={{ gap: 0 }}>
            {offers.map((o, i) => {
              const [k, l] = OFFER[o.status] || ['muted', o.status];
              return (
                <Row key={o.id} style={{ alignItems: 'flex-start', gap: 12 }}>
                  <View style={{ alignItems: 'center', width: 16, alignSelf: 'stretch' }}>
                    <View style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: o.offeredBy === 'workshop' ? c.pri : c.gold, marginTop: 6 }} />
                    {i < offers.length - 1 ? <View style={{ flex: 1, width: 2, backgroundColor: c.line }} /> : null}
                  </View>
                  <Card style={{ flex: 1, marginBottom: 12, gap: 4 }}>
                    <Row style={{ justifyContent: 'space-between' }}>
                      <T v="label">{o.offeredBy === 'workshop' ? 'Xưởng đề xuất' : 'Bạn đề xuất'}</T><Badge kind={k} label={l} />
                    </Row>
                    <T v="price" color={c.pri}>{formatVnd(o.price)}</T>
                    <T v="small" mute>Giao trong ~{o.leadTimeDays} ngày{o.createdAt ? ` · ${formatDateTime(o.createdAt)}` : ''}</T>
                    {o.note ? <T v="small">{o.note}</T> : null}
                  </Card>
                </Row>
              );
            })}
          </View>
        )}
        {err ? <T color={c.err}>{err}</T> : null}

        {canRespond ? (
          <Row style={{ gap: 10 }}>
            <Button title="Từ chối" kind="danger" style={{ flex: 1 }} loading={busy === 'rej'} onPress={() => run('rej', () => api.rejectOffer({ quoteId: id, offerId: latest.id }), 'Đã từ chối đề xuất')} />
            <Button title="Chấp nhận" style={{ flex: 1.3 }} loading={busy === 'acc'} onPress={() => run('acc', () => api.acceptOffer({ quoteId: id, offerId: latest.id }), 'Đã chốt báo giá')} />
          </Row>
        ) : null}
        {!terminal ? <Button title="Đề xuất giá khác" kind="outline" icon="edit" onPress={() => setSheet(true)} /> : null}
        {!terminal && mine === 'customer' ? <Button title="Huỷ yêu cầu" kind="ghost" loading={busy === 'cancel'} onPress={() => run('cancel', () => api.cancelQuote(id), 'Đã huỷ yêu cầu')} /> : null}
      </ScrollView>

      <BottomSheet visible={sheet} onClose={() => setSheet(false)} title="Đề xuất giá của bạn"
        footer={<Button title="Gửi đề xuất" onPress={sendCounter} loading={busy === 'counter'} disabled={!Number(price) || !Number(days)} />}>
        <Field label="Giá mong muốn (₫ / sản phẩm)" value={price} onChangeText={(t) => setPrice(t.replace(/\D/g, ''))} keyboardType="number-pad" />
        <Field label="Thời gian giao (ngày)" value={days} onChangeText={(t) => setDays(t.replace(/\D/g, ''))} keyboardType="number-pad" />
        <Field label="Ghi chú" value={note} onChangeText={setNote} multiline />
        {err ? <T v="small" color={c.err}>{err}</T> : null}
      </BottomSheet>
    </Screen>
  );
}
