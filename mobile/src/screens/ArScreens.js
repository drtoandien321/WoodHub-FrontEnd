import React, { useState } from 'react';
import { View, Linking, Platform } from 'react-native';
import { Screen, T, Button, AppBar, Card, Row } from '../components/ui.js';
import Icon from '../components/Icon.js';
import { useTheme } from '../theme/theme.js';
import { useStudio } from '../store/studio.js';
import { openAR } from '../utils/ar.js';

/*
 * AR đặt đồ vào phòng dùng Scene Viewer của Google (ARCore) — Google lo camera, quét sàn, đặt/xoay/phóng, chụp ảnh.
 * App chỉ giải thích quyền, rồi mở Scene Viewer với file GLB của mô hình. Điều kiện: Android có ARCore + Google app.
 */
export function ArPermScreen({ navigation }) {
  const { c } = useTheme();
  const { model, productName } = useStudio();
  const [busy, setBusy] = useState(false);

  const go = async () => {
    setBusy(true);
    const res = await openAR({ glbUrl: model?.modelGlbUrl, title: productName || model?.name });
    setBusy(false);
    if (res === 'launched') navigation.goBack();
    else navigation.replace('ArUnsupported');
  };

  return (
    <Screen>
      <AppBar title="" onBack={() => navigation.goBack()} />
      <View style={{ flex: 1, paddingHorizontal: 24, paddingBottom: 24 }}>
        <View style={{ height: 220, borderRadius: 28, backgroundColor: c.hero, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="ar" size={88} color="#E2BE48" strokeWidth={1.3} />
        </View>
        <T v="h1" style={{ marginTop: 24 }}>Đặt thử vào phòng của bạn</T>
        <T mute style={{ marginTop: 6 }}>WoodHub dùng camera để nhìn thấy sàn nhà và đặt đồ nội thất đúng kích thước thật.</T>
        <View style={{ gap: 12, marginTop: 18 }}>
          {[['camera', 'Cần cho phép dùng camera'], ['pin', 'Đứng ở nơi đủ sáng, thấy rõ sàn nhà'], ['rotate', 'Di chuyển điện thoại chậm để quét sàn']].map(([ic, tx]) => (
            <Row key={tx} style={{ gap: 12 }}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: c.surf2, alignItems: 'center', justifyContent: 'center' }}><Icon name={ic} size={20} color={c.pri} /></View>
              <T style={{ flex: 1 }}>{tx}</T>
            </Row>
          ))}
        </View>
        <View style={{ flex: 1 }} />
        <T v="small" mute style={{ marginBottom: 10 }}>Lưu ý: AR hiển thị mô hình gốc. Màu và kích thước bạn chỉnh trong ứng dụng chưa áp dụng trong AR.</T>
        <Button title="Mở camera AR" kind="gold" icon="camera" onPress={go} loading={busy} />
        <Button title="Để sau" kind="ghost" onPress={() => navigation.goBack()} />
      </View>
    </Screen>
  );
}

export function ArUnsupportedScreen({ navigation }) {
  const { c } = useTheme();
  const store = () => Linking.openURL(Platform.OS === 'android' ? 'market://details?id=com.google.ar.core' : 'https://apps.apple.com');
  return (
    <Screen>
      <AppBar title="" onBack={() => navigation.goBack()} />
      <View style={{ flex: 1, paddingHorizontal: 24, paddingBottom: 24, alignItems: 'center' }}>
        <View style={{ width: 120, height: 120, borderRadius: 36, backgroundColor: c.surf2, alignItems: 'center', justifyContent: 'center', marginTop: 40 }}>
          <Icon name="alert" size={56} color={c.pri} />
        </View>
        <T v="h1" style={{ marginTop: 24, textAlign: 'center' }}>Thiết bị chưa hỗ trợ AR</T>
        <T mute style={{ marginTop: 8, textAlign: 'center' }}>Không mở được AR. Máy cần hỗ trợ ARCore và đã cài "Dịch vụ Google Play cho AR" cùng ứng dụng Google.</T>
        <Card style={{ alignSelf: 'stretch', marginTop: 24 }}>
          <T v="semi">Bạn vẫn có thể:</T>
          <T mute style={{ marginTop: 6 }}>• Xem và xoay mô hình 3D, đổi màu, chất liệu, kích thước{'\n'}• Lưu thiết kế và gửi yêu cầu báo giá cho xưởng</T>
        </Card>
        <View style={{ flex: 1 }} />
        <Button title="Cài / cập nhật dịch vụ AR" kind="outline" onPress={store} style={{ alignSelf: 'stretch' }} />
        <Button title="Quay lại xem 3D" onPress={() => navigation.goBack()} style={{ alignSelf: 'stretch', marginTop: 10 }} />
      </View>
    </Screen>
  );
}
