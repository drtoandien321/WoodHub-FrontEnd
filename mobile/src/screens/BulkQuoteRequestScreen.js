import React, { useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Screen, AppBar, T, Card, Field, Button, Skeleton, Row } from '../components/ui.js';
import Icon from '../components/Icon.js';
import { useTheme } from '../theme/theme.js';
import { api, errMsg } from '../api/client.js';
import { useAddresses, formatAddressLine } from '../hooks/shop.js';
import { useCreateBulkQuote } from '../hooks/account.js';
import { formatVnd } from '../utils/format.js';

const MAX_QTY = 100_000;
const NOTE_MAX = 2000;

/*
 * Gửi yêu cầu báo giá số lượng lớn (port web BulkQuoteRequestButton/RequestModal) — CHỈ khách doanh nghiệp.
 * 1 yêu cầu gửi cho 1 NCC → gồm các biến thể của chính sản phẩm đang xem. Địa chỉ bắt buộc đã ghim vị trí (hasCoordinates).
 * VAT mặc định bật. Lỗi BUSINESS_PROFILE_REQUIRED → dẫn tới Hồ sơ doanh nghiệp.
 */
export default function BulkQuoteRequestScreen({ navigation, route }) {
  const { c } = useTheme();
  const { productId } = route.params;
  const prod = useQuery({ queryKey: ['product', productId], queryFn: () => api.getProduct(productId) }); // đã có cache từ trang SP
  const addrs = useAddresses();
  const create = useCreateBulkQuote();
  const p = prod.data;
  const variants = p?.variants || [];
  const usable = (addrs.data || []).filter((a) => a.hasCoordinates);

  const [qty, setQty] = useState({});
  const [addressId, setAddressId] = useState('');
  const [vat, setVat] = useState(true);
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const [needProfile, setNeedProfile] = useState(false);
  const [created, setCreated] = useState(null);

  // Mặc định: biến thể đầu 10 cái, địa chỉ mặc định đã ghim vị trí
  const qtyOf = (v, i) => qty[v.id] ?? (i === 0 ? '10' : '');
  const picked = addressId || (usable.find((a) => a.isDefault) ?? usable[0])?.id || '';
  const label = (v) => [v.sku, v.color, v.dimensions].filter(Boolean).join(' · ') || p?.name;

  const submit = async () => {
    setErr(''); setNeedProfile(false);
    const items = variants.map((v, i) => ({ variantId: v.id, quantity: Number(qtyOf(v, i)) })).filter((x) => x.quantity > 0);
    if (!items.length) { setErr('Nhập số lượng cho ít nhất 1 biến thể.'); return; }
    if (items.some((x) => !Number.isInteger(x.quantity) || x.quantity > MAX_QTY)) { setErr(`Số lượng là số nguyên, tối đa ${MAX_QTY.toLocaleString('vi-VN')}.`); return; }
    if (!picked) { setErr('Bạn chưa có địa chỉ đã ghim vị trí.'); return; }
    try { setCreated(await create.mutateAsync({ items, addressId: picked, vatInvoice: vat, note: note.trim() || undefined })); }
    catch (e) {
      if (e?.response?.data?.errorCode === 'BUSINESS_PROFILE_REQUIRED') { setNeedProfile(true); return; }
      setErr(errMsg(e, 'Không gửi được yêu cầu.'));
    }
  };

  if (created) {
    return (
      <Screen>
        <AppBar title="Yêu cầu báo giá" onBack={() => navigation.goBack()} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 12 }}>
          <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: c.bcBg, alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={44} color={c.bcTx} /></View>
          <T v="h3">Đã gửi yêu cầu báo giá</T>
          <T mute style={{ textAlign: 'center' }}>Nhà cung cấp sẽ gửi giá sỉ trong 7 ngày.</T>
          <Button title="Xem yêu cầu" onPress={() => navigation.replace('BulkQuoteDetail', { id: created.id })} style={{ alignSelf: 'stretch' }} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppBar title="Báo giá số lượng lớn" onBack={() => navigation.goBack()} />
      {!p ? <View style={{ padding: 20 }}><Skeleton h={260} r={22} /></View> : (
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}>
          <View><T v="h3">{p.name}</T>{p.supplierName ? <T v="small" mute>{p.supplierName}</T> : null}</View>

          <Card style={{ gap: 12 }}>
            {variants.map((v, i) => (
              <Row key={v.id} style={{ gap: 12 }}>
                <View style={{ flex: 1 }}><T v="semi" numberOfLines={2}>{label(v)}</T><T v="small" mute>Niêm yết {formatVnd(v.price)}</T></View>
                <View style={{ width: 96 }}>
                  <Field value={qtyOf(v, i)} onChangeText={(t) => setQty((s) => ({ ...s, [v.id]: t.replace(/\D/g, '') }))} keyboardType="number-pad" placeholder="0" accessibilityLabel={`Số lượng ${label(v)}`} />
                </View>
              </Row>
            ))}
          </Card>

          <View style={{ gap: 8 }}>
            <T v="label">Giao tới</T>
            {addrs.isLoading ? <Skeleton h={64} r={14} /> : usable.length ? usable.map((a) => {
              const on = a.id === picked;
              return (
                <Card key={a.id} onPress={() => setAddressId(a.id)} pad={12} style={{ borderColor: on ? c.pri : c.line, borderWidth: on ? 1.5 : 1 }}>
                  <T v="semi">{a.recipientName} · {a.recipientPhone}</T>
                  <T v="small" mute>{formatAddressLine(a)}</T>
                </Card>
              );
            }) : (
              <Card pad={12} style={{ gap: 8 }}>
                <T color={c.bpTx}>Bạn chưa có địa chỉ đã ghim vị trí.</T>
                <Button small kind="outline" title="Quản lý sổ địa chỉ" onPress={() => navigation.navigate('Addresses')} />
              </Card>
            )}
          </View>

          <Pressable onPress={() => setVat(!vat)} accessibilityRole="checkbox" accessibilityState={{ checked: vat }} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={{ width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: vat ? c.pri : c.line, backgroundColor: vat ? c.pri : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
              {vat ? <Icon name="check" size={16} color={c.onpri} /> : null}
            </View>
            <T style={{ flex: 1 }}>Xuất hoá đơn VAT cho đơn sau này</T>
          </Pressable>

          <Field label="Ghi chú cho nhà cung cấp" value={note} onChangeText={(t) => setNote(t.slice(0, NOTE_MAX))} multiline placeholder="VD: Giao trước 15/11, cần màu đồng bộ" />

          {needProfile ? (
            <Card style={{ backgroundColor: c.bpBg, borderColor: c.bpBg, gap: 8 }} pad={12}>
              <T color={c.bpTx}>Cần hồ sơ công ty đủ tên, mã số thuế, địa chỉ trước khi gửi yêu cầu.</T>
              <Button small kind="outline" title="Bổ sung hồ sơ" onPress={() => navigation.navigate('Account')} />
            </Card>
          ) : null}
          {err ? <T color={c.err}>{err}</T> : null}
          <Button title="Gửi yêu cầu" onPress={submit} loading={create.isPending} />
        </ScrollView>
      )}
    </Screen>
  );
}
