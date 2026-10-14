import React, { useRef, useState } from 'react';
import { View, PanResponder } from 'react-native';
import { useTheme } from '../theme/theme.js';

/*
 * Slider tự viết bằng PanResponder (không thêm thư viện). Chạm hoặc kéo đều đổi giá trị; vùng chạm cao 48dp.
 */
export default function Slider({ value, min, max, step = 1, onChange }) {
  const { c } = useTheme();
  const [w, setW] = useState(1);
  const start = useRef(0);
  const ref = useRef({ min, max, step, w, onChange });
  ref.current = { min, max, step, w, onChange };

  const setFromX = (x) => {
    const r = ref.current;
    const t = Math.max(0, Math.min(1, x / r.w));
    const v = Math.round((r.min + t * (r.max - r.min)) / r.step) * r.step;
    r.onChange(Math.max(r.min, Math.min(r.max, v)));
  };
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false, // giữ cử chỉ, không nhường cho ScrollView cha
    onPanResponderGrant: (e) => { start.current = e.nativeEvent.locationX; setFromX(start.current); },
    onPanResponderMove: (_, g) => setFromX(start.current + g.dx),
  })).current;

  const t = max > min ? (value - min) / (max - min) : 0;
  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width || 1)} {...pan.panHandlers} style={{ height: 48, justifyContent: 'center' }}>
      <View style={{ height: 6, borderRadius: 3, backgroundColor: c.surf2 }}>
        <View style={{ width: `${t * 100}%`, height: 6, borderRadius: 3, backgroundColor: c.pri }} />
      </View>
      <View pointerEvents="none" style={{ position: 'absolute', left: `${t * 100}%`, marginLeft: -13, width: 26, height: 26, borderRadius: 13, backgroundColor: c.surf, borderWidth: 3, borderColor: c.pri }} />
    </View>
  );
}
