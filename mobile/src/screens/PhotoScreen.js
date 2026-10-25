import React, { useState } from 'react';
import { View, Image, Pressable, ScrollView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import * as ImagePicker from 'expo-image-picker';
import { Screen, AppBar, T, Button, Card, Row, useToast, BottomSheet } from '../components/ui.js';
import Icon from '../components/Icon.js';
import { useTheme } from '../theme/theme.js';
import { useStudio } from '../store/studio.js';
import { api, errMsg } from '../api/client.js';

/* Chụp / chọn 1 ảnh đồ vật → gửi BE (Meshy) dựng 3D. Ảnh càng rõ, nền đơn giản thì kết quả càng tốt. */
export default function PhotoScreen({ navigation }) {
  const { c } = useTheme();
  const toast = useToast();
  const { photo, setPhoto, removeBg, setRemoveBg, setTaskId } = useStudio();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [denied, setDenied] = useState(false);
  /*
   * Lượt thiết kế còn dùng được = hạn mức tháng còn lại + lượt đã mua/được tặng (giống web usableCount): BE chỉ trả 429
   * khi CẢ HAI cạn. Hiện trước khi bấm để khách biết lần dựng này tốn 1 lượt; hết lượt → dẫn sang Gói dịch vụ.
   */
  const usage = useQuery({ queryKey: ['usage'], queryFn: api.getMyUsage });
  const du = (usage.data || []).find((u) => u.feature === 'design');
  const left = du ? (du.unlimited ? Infinity : (du.remaining ?? 0) + (du.purchasedRemaining ?? 0)) : null;

  const pick = async (fromCamera) => {
    const perm = fromCamera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { setDenied(true); return; }
    const opts = { mediaTypes: ['images'], quality: 0.85, allowsEditing: false };
    const res = fromCamera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (!res.canceled && res.assets?.[0]) {
      const a = res.assets[0];
      if (a.fileSize && a.fileSize > 10 * 1024 * 1024) { toast('Ảnh quá lớn (tối đa 10MB)'); return; }
      setPhoto({ uri: a.uri, name: a.fileName || 'photo.jpg', type: a.mimeType || 'image/jpeg' });
      setErr('');
    }
  };

  const start = async () => {
    setBusy(true); setErr('');
    try {
      const res = await api.generate3D({ ...photo, removeBackground: removeBg });
      setTaskId(res.taskId);
      navigation.navigate('Building');
    } catch (e) { setErr(errMsg(e)); } finally { setBusy(false); }
  };

  return (
    <Screen>
      <AppBar title="Từ ảnh của bạn" onBack={() => navigation.goBack()} />
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <View style={{ aspectRatio: 1, borderRadius: 24, borderWidth: 2, borderStyle: 'dashed', borderColor: c.line2, backgroundColor: c.surf, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {photo ? <Image source={{ uri: photo.uri }} style={{ width: '100%', height: '100%' }} resizeMode="contain" /> : (
            <View style={{ alignItems: 'center', gap: 8, padding: 24 }}>
              <Icon name="image" size={48} color={c.mute} />
              <T mute style={{ textAlign: 'center' }}>Chọn một tấm ảnh rõ nét của món đồ, nền đơn giản.</T>
            </View>
          )}
        </View>
        <Row style={{ gap: 10 }}>
          <Button title="Chụp ảnh" icon="camera" kind="outline" style={{ flex: 1 }} onPress={() => pick(true)} />
          <Button title="Thư viện" icon="image" kind="outline" style={{ flex: 1 }} onPress={() => pick(false)} />
        </Row>
        <Pressable onPress={() => setRemoveBg(!removeBg)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 }}>
          <View style={{ width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, borderColor: c.pri, backgroundColor: removeBg ? c.pri : 'transparent', alignItems: 'center', justifyContent: 'center' }}>
            {removeBg ? <Icon name="check" size={16} color={c.onpri} /> : null}
          </View>
          <View style={{ flex: 1 }}><T v="semi">Tự động xoá nền</T><T v="small" mute>Giúp AI tập trung vào món đồ.</T></View>
        </Pressable>
        <Card style={{ gap: 6 }}>
          <Row style={{ gap: 8 }}><Icon name="info" size={18} color={c.pri} /><T v="semi">Mẹo để có kết quả đẹp</T></Row>
          <T v="small" mute>• Chụp thẳng, đủ sáng, thấy toàn bộ món đồ{'\n'}• Một món đồ trong ảnh, ít vật khác{'\n'}• Việc dựng 3D mất khoảng 1–3 phút và tính vào lượt thiết kế</T>
        </Card>
        {err ? <T color={c.err}>{err}</T> : null}
        {left != null ? (
          <Row style={{ justifyContent: 'space-between' }}>
            <T v="small" mute>{left === Infinity ? 'Lượt thiết kế: không giới hạn' : `Còn ${left} lượt thiết kế · lần dựng này dùng 1 lượt`}</T>
            {left !== Infinity && left <= 1 ? <Pressable onPress={() => navigation.navigate('Plans')} style={{ height: 44, justifyContent: 'center' }}><T v="semi" color={c.pri}>Mua thêm</T></Pressable> : null}
          </Row>
        ) : null}
        <Button title={left === 0 ? 'Hết lượt thiết kế' : 'Tạo mô hình 3D'} icon="sparkle" onPress={start} disabled={!photo || left === 0} loading={busy} />
      </ScrollView>

      <BottomSheet visible={denied} onClose={() => setDenied(false)} title="Cần quyền truy cập"
        footer={<Button title="Đã hiểu" onPress={() => setDenied(false)} />}>
        <T mute>WoodHub cần quyền camera hoặc thư viện ảnh để chọn ảnh. Bạn có thể bật lại trong Cài đặt → Ứng dụng → WoodHub → Quyền.</T>
      </BottomSheet>
    </Screen>
  );
}
