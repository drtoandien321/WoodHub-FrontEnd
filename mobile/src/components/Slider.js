import { View, Text, StyleSheet } from 'react-native';
import RNSlider from '@react-native-community/slider';
import { COLORS } from '../theme/colors.js';

/*
 * Bọc @react-native-community/slider (component slider chuẩn được Expo hỗ trợ)
 * thay vì tự viết bằng PanResponder — gesture tự viết rất dễ xung đột với ScrollView.
 * step=1 vì kích thước tính theo cm nguyên.
 */
export default function Slider({ label, value, min, max, onChange }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{value} cm</Text>
      </View>
      <RNSlider
        minimumValue={min}
        maximumValue={max}
        step={1}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={COLORS.walnut}
        maximumTrackTintColor={COLORS.ivoryDark}
        thumbTintColor={COLORS.walnut}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 2 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 13, color: COLORS.text },
  value: { fontSize: 13, color: COLORS.walnut, fontVariant: ['tabular-nums'] },
});
