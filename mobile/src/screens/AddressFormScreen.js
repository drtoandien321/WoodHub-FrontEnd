import React, { useState } from 'react';
import { View, ScrollView, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import * as Location from 'expo-location';
import { Screen, AppBar, T, Field, Button, Row } from '../components/ui.js';
import MapPicker from '../components/MapPicker.js';
import Icon from '../components/Icon.js';
import { useTheme } from '../theme/theme.js';
import { useCreateAddress, useUpdateAddress } from '../hooks/shop.js';
import { geocodeAddress, GOONG_READY } from '../services/goong.js';

const PHONE_RE = /^0\d{9}$/; // SĐT VN 10 số — cùng quy tắc web

/*
 * Thêm / sửa địa chỉ giao hàng (port web AddressFormModal). Toạ độ là phần QUAN TRỌNG NHẤT: BE dùng để tính phí ship.
 * Luồng chuẩn (giống web): nhập địa chỉ → "Định vị từ địa chỉ" (Goong geocode) → ghim nhảy tới, kéo/bấm để chỉnh đúng nhà.
 * Chưa cấu hình key Goong của app → báo rõ + cho "Dùng vị trí hiện tại" (GPS) làm tạm để vẫn đặt được hàng.
 * route.params: { address? (sửa), requireCoordinates?, returnTo? (màn quay về, nhận selectAddressId) }
 */
export default function AddressFormScreen({ navigation, route }) {
  const { c } = useTheme();
  const initial = route.params?.address ?? null;
  const requireCoordinates = !!route.params?.requireCoordinates;
  const returnTo = route.params?.returnTo;
  const create = useCreateAddress();
  const update = useUpdateAddress();

  const [f, setF] = useState(() => ({
    recipientName: initial?.recipientName ?? '', recipientPhone: initial?.recipientPhone ?? '', addressLine: initial?.addressLine ?? '',
    ward: initial?.ward ?? '', district: initial?.district ?? '', city: initial?.city ?? '', isDefault: initial?.isDefault ?? false,
  }));
  const [coords, setCoords] = useState(() => (initial?.latitude != null && initial?.longitude != null ? { latitude: initial.latitude, longitude: initial.longitude } : null));
  const [touched, setTouched] = useState(false);
  const [locating, setLocating] = useState(false);
  const [locErr, setLocErr] = useState('');
  const [err, setErr] = useState('');
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));

  const errors = {
    recipientName: f.recipientName.trim() ? '' : 'Nhập tên người nhận',
    recipientPhone: PHONE_RE.test(f.recipientPhone.replace(/\s/g, '')) ? '' : 'Số điện thoại gồm 10 số, bắt đầu bằng 0',
    addressLine: f.addressLine.trim() ? '' : 'Nhập số nhà, tên đường',
    city: f.city.trim() ? '' : 'Nhập tỉnh / thành phố',
    coords: requireCoordinates && !coords ? 'Cần ghim vị trí trên bản đồ để tính phí giao hàng' : '',
  };
  const ok = Object.values(errors).every((e) => !e);
  const show = (k) => (touched ? errors[k] : '');

  // Kết quả geocode chỉ điền vào ô ĐANG TRỐNG — không ghi đè thứ khách đã gõ
  const locate = async () => {
    if (!f.addressLine.trim()) { setLocErr('Nhập địa chỉ trước rồi bấm định vị.'); return; }
    setLocating(true); setLocErr('');
    try {
      const r = await geocodeAddress([f.addressLine, f.ward, f.district, f.city].map((s) => s.trim()).filter(Boolean).join(', '));
      if (!r) { setLocErr('Không tìm thấy vị trí — hãy bấm trực tiếp lên bản đồ để ghim.'); return; }
      setCoords({ latitude: r.latitude, longitude: r.longitude });
      setF((s) => ({ ...s, ward: s.ward || r.ward, district: s.district || r.district, city: s.city || r.city }));
    } catch { setLocErr('Không định vị được (lỗi mạng hoặc key bản đồ). Thử lại hoặc bấm lên bản đồ.'); } finally { setLocating(false); }
  };

  const useGps = async () => {
    setLocating(true); setLocErr('');
    try {
      const perm = await Location.requestForegroundPermissionsAsync();
      if (!perm.granted) { setLocErr('Bạn chưa cho phép truy cập vị trí.'); return; }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setCoords({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
    } catch { setLocErr('Không lấy được vị trí hiện tại.'); } finally { setLocating(false); }
  };

  const save = async () => {
    setTouched(true);
    if (!ok) return;
    setErr('');
    // PUT ghi đè toàn bộ → gửi ĐỦ field (thiếu lat/lng sẽ xoá toạ độ)
    const body = {
      recipientName: f.recipientName.trim(), recipientPhone: f.recipientPhone.replace(/\s/g, ''), addressLine: f.addressLine.trim(),
      ward: f.ward.trim() || null, district: f.district.trim() || null, city: f.city.trim(),
      latitude: coords?.latitude ?? null, longitude: coords?.longitude ?? null, isDefault: f.isDefault,
    };
    try {
      const saved = initial ? await update.mutateAsync({ id: initial.id, ...body }) : await create.mutateAsync(body);
      if (returnTo) navigation.navigate(returnTo, { selectAddressId: saved?.id }, { merge: true });
      else navigation.goBack();
    } catch (e) {
      const be = e?.response?.data?.errors;
      setErr((be && Object.values(be)[0]) || e?.response?.data?.message || 'Không lưu được địa chỉ.');
    }
  };

  return (
    <Screen>
      <AppBar title={initial ? 'Sửa địa chỉ' : 'Thêm địa chỉ'} onBack={() => navigation.goBack()} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, gap: 14, paddingBottom: 40 }}>
          <Field label="Người nhận *" value={f.recipientName} onChangeText={set('recipientName')} placeholder="Nguyễn Văn A" error={show('recipientName')} maxLength={100} />
          <Field label="Số điện thoại *" value={f.recipientPhone} onChangeText={set('recipientPhone')} placeholder="0901234567" keyboardType="phone-pad" error={show('recipientPhone')} maxLength={15} />
          <Field label="Số nhà, tên đường *" value={f.addressLine} onChangeText={set('addressLine')} placeholder="123 Lê Lợi" error={show('addressLine')} maxLength={255} />
          <Row style={{ gap: 10 }}>
            <View style={{ flex: 1 }}><Field label="Phường / Xã" value={f.ward} onChangeText={set('ward')} /></View>
            <View style={{ flex: 1 }}><Field label="Quận / Huyện" value={f.district} onChangeText={set('district')} /></View>
          </Row>
          <Field label="Tỉnh / Thành phố *" value={f.city} onChangeText={set('city')} placeholder="TP.HCM" error={show('city')} />

          <Row style={{ justifyContent: 'space-between' }}>
            <T v="label">Vị trí giao hàng{requireCoordinates ? ' *' : ''}</T>
            {GOONG_READY ? <Button small kind="outline" icon="pin" title="Định vị từ địa chỉ" onPress={locate} loading={locating} style={{ height: 40 }} /> : null}
          </Row>
          <MapPicker latitude={coords?.latitude} longitude={coords?.longitude} onChange={(lat, lng) => { setCoords({ latitude: lat, longitude: lng }); setLocErr(''); }} />
          {!GOONG_READY ? (
            <View style={{ gap: 8 }}>
              <T v="small" mute>Bản đồ chưa sẵn sàng trên bản app này. Tạm thời bạn có thể lấy toạ độ từ vị trí hiện tại của máy (nên đứng tại địa chỉ nhận hàng).</T>
              <Button small kind="outline" icon="pin" title="Dùng vị trí hiện tại" onPress={useGps} loading={locating} />
            </View>
          ) : null}
          <T v="small" mute>{coords ? `Đã ghim: ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}` : 'Chưa có vị trí — bấm định vị hoặc bấm lên bản đồ.'}</T>
          {locErr ? <T v="small" color={c.err}>{locErr}</T> : null}
          {show('coords') ? <T v="small" color={c.err}>{errors.coords}</T> : null}
          {!coords && !requireCoordinates ? <T v="small" color={c.goldtx}>Địa chỉ chưa có vị trí sẽ không dùng được khi thanh toán.</T> : null}

          {!initial?.isDefault ? (
            <Pressable onPress={() => set('isDefault')(!f.isDefault)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 }}>
              <View style={{ width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, borderColor: c.pri, backgroundColor: f.isDefault ? c.pri : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
                {f.isDefault ? <Icon name="check" size={16} color={c.onpri} /> : null}
              </View>
              <T>Đặt làm địa chỉ mặc định</T>
            </Pressable>
          ) : null}
          {err ? <T color={c.err}>{err}</T> : null}
          <Button title="Lưu địa chỉ" onPress={save} loading={create.isPending || update.isPending} />
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}
