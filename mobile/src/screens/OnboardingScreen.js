import React, { useRef, useState } from 'react';
import { View, FlatList, useWindowDimensions, Pressable } from 'react-native';
import { Screen, T, Button } from '../components/ui.js';
import Icon from '../components/Icon.js';
import { useTheme } from '../theme/theme.js';
import { useAuth } from '../store/auth.js';

const SLIDES = [
  { icon: 'cube', t: 'Xem đồ nội thất bằng 3D', b: 'Xoay, phóng to từng chi tiết vân gỗ trước khi quyết định.' },
  { icon: 'ar', t: 'Đặt thử vào phòng bằng AR', b: 'Đặt bàn, tủ, kệ vào đúng căn phòng của bạn với kích thước thật.' },
  { icon: 'quote', t: 'Tự thiết kế, nhận báo giá từ xưởng mộc', b: 'Chọn mẫu hoặc chụp ảnh để AI dựng 3D, rồi gửi cho xưởng gần bạn.' },
];

export default function OnboardingScreen({ navigation }) {
  const { c } = useTheme();
  const { width } = useWindowDimensions();
  const finish = useAuth((s) => s.finishOnboarding);
  const [i, setI] = useState(0);
  const list = useRef(null);

  const done = async () => { await finish(); navigation.navigate('Login'); };
  const next = () => {
    if (i < SLIDES.length - 1) { list.current?.scrollToIndex({ index: i + 1 }); setI(i + 1); } else done();
  };

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 12 }}>
        <Pressable onPress={done} style={{ height: 48, paddingHorizontal: 12, justifyContent: 'center' }}><T v="semi" mute>Bỏ qua</T></Pressable>
      </View>
      <FlatList
        ref={list} data={SLIDES} horizontal pagingEnabled showsHorizontalScrollIndicator={false} keyExtractor={(s) => s.t}
        onMomentumScrollEnd={(e) => setI(Math.round(e.nativeEvent.contentOffset.x / width))}
        renderItem={({ item }) => (
          <View style={{ width, paddingHorizontal: 20 }}>
            <View style={{ height: 330, borderRadius: 28, backgroundColor: c.hero, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              <View style={{ position: 'absolute', width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(248,244,236,0.08)' }} />
              <View style={{ width: 150, height: 150, borderRadius: 44, backgroundColor: 'rgba(248,244,236,0.14)', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={item.icon} size={84} color="#E2BE48" strokeWidth={1.4} />
              </View>
            </View>
            <View style={{ alignItems: 'center', marginTop: 28, gap: 10 }}>
              <T v="h1" style={{ textAlign: 'center' }}>{item.t}</T>
              <T mute style={{ textAlign: 'center', paddingHorizontal: 8, fontSize: 16, lineHeight: 25 }}>{item.b}</T>
            </View>
          </View>
        )}
      />
      <View style={{ flexDirection: 'row', gap: 6, justifyContent: 'center', marginVertical: 16 }}>
        {SLIDES.map((s, k) => <View key={s.t} style={{ height: 8, width: k === i ? 24 : 8, borderRadius: 4, backgroundColor: k === i ? c.pri : c.line2 }} />)}
      </View>
      <View style={{ paddingHorizontal: 20, paddingBottom: 16 }}>
        <Button title={i === SLIDES.length - 1 ? 'Bắt đầu' : 'Tiếp tục'} onPress={next} />
      </View>
    </Screen>
  );
}
