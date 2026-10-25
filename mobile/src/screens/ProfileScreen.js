import React from 'react';
import { View, ScrollView, Pressable, Switch } from 'react-native';
import Constants from 'expo-constants';
import { Screen, T, Card, Row, Button } from '../components/ui.js';
import Icon from '../components/Icon.js';
import { useTheme, fonts } from '../theme/theme.js';
import { useAuth } from '../store/auth.js';
import { api } from '../api/client.js';

function Item({ icon, title, hint, onPress, right }) {
  const { c } = useTheme();
  return (
    <Pressable onPress={onPress} style={{ minHeight: 60, flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 8 }}>
      <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: c.surf2, alignItems: 'center', justifyContent: 'center' }}><Icon name={icon} size={22} color={c.pri} /></View>
      <View style={{ flex: 1 }}><T v="semi">{title}</T>{hint ? <T v="small" mute>{hint}</T> : null}</View>
      {right ?? <Icon name="chev" size={20} color={c.mute} />}
    </Pressable>
  );
}

export default function ProfileScreen({ navigation }) {
  const { c, isDark, setDark } = useTheme();
  const { user, refreshToken, logout } = useAuth();
  const initial = (user?.name || user?.email || '?').trim()[0]?.toUpperCase();

  const out = async () => {
    try { await api.logout(refreshToken); } catch { /* vẫn đăng xuất cục bộ */ }
    await logout();
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16, paddingBottom: 40 }}>
        <Row style={{ gap: 16 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: c.pri, alignItems: 'center', justifyContent: 'center' }}>
            <T style={{ fontFamily: fonts.display, fontSize: 30 }} color={c.onpri}>{initial}</T>
          </View>
          <View style={{ flex: 1 }}><T v="h2" numberOfLines={1}>{user?.name || 'Khách hàng'}</T><T mute numberOfLines={1}>{user?.email}</T></View>
        </Row>
        <Card pad={8}>
          <Item icon="user" title="Hồ sơ của tôi" hint="Thông tin cá nhân, mật khẩu, hồ sơ doanh nghiệp" onPress={() => navigation.navigate('Account')} />
          {user?.customerType === 'business' ? <Item icon="quote" title="Báo giá số lượng lớn" hint="Yêu cầu giá sỉ gửi nhà cung cấp" onPress={() => navigation.navigate('BulkQuotes')} /> : null}
        </Card>
        <Card pad={8}>
          <Item icon="package" title="Đơn hàng của tôi" hint="Theo dõi, thanh toán, huỷ đơn" onPress={() => navigation.navigate('Orders')} />
          <Item icon="cart" title="Giỏ hàng" hint="Sản phẩm bạn đã chọn" onPress={() => navigation.navigate('Cart')} />
          <Item icon="pin" title="Sổ địa chỉ" hint="Địa chỉ nhận hàng có ghim vị trí" onPress={() => navigation.navigate('Addresses')} />
        </Card>
        <Card pad={8}>
          <Item icon="sparkle" title="Trợ lý AI" hint="Tư vấn chọn nội thất" onPress={() => navigation.navigate('Chat')} />
          <Item icon="pin" title="Xưởng gần bạn" hint="Tìm xưởng mộc theo vị trí" onPress={() => navigation.navigate('Workshops')} />
          <Item icon="card" title="Gói dịch vụ" hint="Hạn mức & thanh toán" onPress={() => navigation.navigate('Plans')} />
        </Card>
        <Card pad={8}>
          <Item icon="moon" title="Giao diện tối" onPress={() => setDark(!isDark)}
            right={<Switch value={isDark} onValueChange={setDark} trackColor={{ true: c.pri, false: c.line2 }} thumbColor="#fff" />} />
        </Card>
        <Button title="Đăng xuất" kind="danger" icon="logout" onPress={out} />
        <T v="small" mute style={{ textAlign: 'center' }}>WoodHub {Constants.expoConfig?.version ? `v${Constants.expoConfig.version}` : ''}</T>
      </ScrollView>
    </Screen>
  );
}
