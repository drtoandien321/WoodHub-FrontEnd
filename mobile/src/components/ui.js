import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  View, Text, Pressable, TextInput, ActivityIndicator, Animated, Modal, ScrollView, Image, StyleSheet, Platform, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';
import { useTheme, fonts } from '../theme/theme.js';
import Icon from './Icon.js';

/*
 * Bộ thành phần giao diện dùng chung — bám đúng thiết kế (bo góc lớn, vùng chạm ≥ 48dp, bottom sheet, badge pastel).
 * Mọi màu lấy từ useTheme().c nên sáng/tối đổi ngay.
 */

// ---------- Text ----------
const TEXT = {
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 23 },
  small: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 20 },
  label: { fontFamily: fonts.semi, fontSize: 14 },
  semi: { fontFamily: fonts.semi, fontSize: 15 },
  h1: { fontFamily: fonts.display, fontSize: 28, lineHeight: 35 },
  h2: { fontFamily: fonts.display, fontSize: 22, lineHeight: 28 },
  h3: { fontFamily: fonts.display, fontSize: 18, lineHeight: 24 },
  price: { fontFamily: fonts.displayBold, fontSize: 20 },
  mono: { fontFamily: Platform.select({ ios: 'Menlo', default: 'monospace' }), fontSize: 13 },
};
export function T({ v = 'body', color, mute, style, children, ...rest }) {
  const { c } = useTheme();
  return <Text {...rest} style={[TEXT[v], { color: color || (mute ? c.mute : c.ink) }, style]}>{children}</Text>;
}

// ---------- Button ----------
export function Button({ title, onPress, kind = 'pri', icon, loading, disabled, style, small }) {
  const { c } = useTheme();
  const k = {
    pri: { bg: c.pri, fg: c.onpri, bd: c.pri },
    gold: { bg: c.gold, fg: '#2B2119', bd: c.gold },
    outline: { bg: 'transparent', fg: c.ink, bd: c.line2 },
    ghost: { bg: 'transparent', fg: c.pri, bd: 'transparent' },
    danger: { bg: 'transparent', fg: c.err, bd: c.err },
    soft: { bg: c.surf2, fg: c.ink, bd: c.surf2 },
  }[kind];
  const off = disabled || loading;
  return (
    <Pressable
      onPress={off ? undefined : onPress}
      accessibilityRole="button"
      style={({ pressed }) => [{
        height: small ? 44 : 52, borderRadius: 16, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        backgroundColor: k.bg, borderWidth: kind === 'ghost' ? 0 : 1.5, borderColor: k.bd, opacity: off ? 0.45 : pressed ? 0.85 : 1,
      }, style]}
    >
      {loading ? <ActivityIndicator color={k.fg} /> : (
        <>
          {icon ? <Icon name={icon} size={22} color={k.fg} /> : null}
          <Text style={{ fontFamily: fonts.semi, fontSize: small ? 14 : 16, color: k.fg }}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

export function IconBtn({ name, onPress, color, size = 24, style, label, bg }) {
  const { c } = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityLabel={label} accessibilityRole="button" hitSlop={4}
      style={({ pressed }) => [{ width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: bg || 'transparent', opacity: pressed ? 0.6 : 1 }, style]}>
      <Icon name={name} size={size} color={color || c.ink} />
    </Pressable>
  );
}

// ---------- Chip / Badge ----------
export function Chip({ label, selected, onPress, icon, style }) {
  const { c } = useTheme();
  return (
    <Pressable onPress={onPress} style={[{
      height: 40, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: selected ? c.pri : c.surf, borderColor: selected ? c.pri : c.line,
    }, style]}>
      {icon ? <Icon name={icon} size={16} color={selected ? c.onpri : c.ink} /> : null}
      <Text style={{ fontFamily: fonts.semi, fontSize: 14, color: selected ? c.onpri : c.ink }}>{label}</Text>
    </Pressable>
  );
}

// kind: pending | neg | closed | rej | muted
export function Badge({ kind = 'muted', label, style }) {
  const { c } = useTheme();
  const m = {
    pending: [c.bpBg, c.bpTx], neg: [c.bnBg, c.bnTx], closed: [c.bcBg, c.bcTx], rej: [c.brBg, c.brTx], muted: [c.surf2, c.mute],
  }[kind] || [c.surf2, c.mute];
  return (
    <View style={[{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 6, height: 24, paddingHorizontal: 10, borderRadius: 12, backgroundColor: m[0] }, style]}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: m[1] }} />
      <Text style={{ fontFamily: fonts.semi, fontSize: 12, color: m[1] }}>{label}</Text>
    </View>
  );
}

export function Tag3D({ label = '3D', ar }) {
  const { c } = useTheme();
  return (
    <View style={{ height: 22, paddingHorizontal: 8, borderRadius: 11, backgroundColor: ar ? c.gold : c.pri, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Icon name={ar ? 'ar' : 'cube'} size={13} color={ar ? '#2B2119' : c.onpri} />
      <Text style={{ fontFamily: fonts.bold, fontSize: 11, color: ar ? '#2B2119' : c.onpri }}>{label}</Text>
    </View>
  );
}

// ---------- Card / Input ----------
export function Card({ children, style, onPress, pad = 14 }) {
  const { c } = useTheme();
  const base = [{
    backgroundColor: c.surf, borderRadius: 22, padding: pad, borderWidth: 1, borderColor: c.line,
    shadowColor: c.shadow, shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 1,
  }, style];
  return onPress ? <Pressable onPress={onPress} style={({ pressed }) => [...base, { opacity: pressed ? 0.9 : 1 }]}>{children}</Pressable> : <View style={base}>{children}</View>;
}

export function Field({ label, error, right, ...props }) {
  const { c } = useTheme();
  return (
    <View style={{ gap: 6 }}>
      {label ? <T v="label">{label}</T> : null}
      <View>
        <TextInput
          placeholderTextColor={c.mute}
          {...props}
          style={[{
            height: props.multiline ? undefined : 52, minHeight: props.multiline ? 92 : undefined, borderWidth: 1.5, borderColor: error ? c.err : c.line, borderRadius: 14,
            backgroundColor: c.surf, paddingHorizontal: 16, paddingRight: right ? 52 : 16, paddingTop: props.multiline ? 12 : 0, fontFamily: fonts.regular, fontSize: 16, color: c.ink,
            textAlignVertical: props.multiline ? 'top' : 'center',
          }, props.style]}
        />
        {right ? <View style={{ position: 'absolute', right: 6, top: 2 }}>{right}</View> : null}
      </View>
      {error ? <T v="small" color={c.err}>{error}</T> : null}
    </View>
  );
}

// ---------- Layout ----------
export function Screen({ children, edges = ['top'], style, bg }) {
  const { c } = useTheme();
  return <SafeAreaView edges={edges} style={[{ flex: 1, backgroundColor: bg || c.bg }, style]}>{children}</SafeAreaView>;
}

export function AppBar({ title, onBack, right, transparent }) {
  const { c } = useTheme();
  return (
    <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, backgroundColor: transparent ? 'transparent' : c.bg }}>
      {onBack ? <IconBtn name="back" onPress={onBack} label="Quay lại" /> : <View style={{ width: 12 }} />}
      <Text numberOfLines={1} style={{ flex: 1, fontFamily: fonts.display, fontSize: 20, color: c.ink }}>{title}</Text>
      {right}
    </View>
  );
}

// ---------- Skeleton / states ----------
export function Skeleton({ w, h = 16, r = 10, style }) {
  const { c } = useTheme();
  const a = useRef(new Animated.Value(0.5)).current;
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(a, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(a, { toValue: 0.5, duration: 700, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, [a]);
  return <Animated.View style={[{ width: w, height: h, borderRadius: r, backgroundColor: c.surf2, opacity: a }, style]} />;
}

export function EmptyState({ icon = 'cube', title, hint, action, onAction }) {
  const { c } = useTheme();
  return (
    <View style={{ alignItems: 'center', padding: 32, gap: 10 }}>
      <View style={{ width: 88, height: 88, borderRadius: 28, backgroundColor: c.surf2, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icon} size={40} color={c.pri} />
      </View>
      <T v="h3" style={{ textAlign: 'center' }}>{title}</T>
      {hint ? <T v="small" mute style={{ textAlign: 'center' }}>{hint}</T> : null}
      {action ? <Button title={action} onPress={onAction} style={{ marginTop: 8, alignSelf: 'stretch' }} /> : null}
    </View>
  );
}

export function ErrorState({ title = 'Không tải được dữ liệu', hint, onRetry, offline }) {
  return (
    <EmptyState icon={offline ? 'wifioff' : 'alert'} title={offline ? 'Bạn đang ngoại tuyến' : title}
      hint={hint || (offline ? 'Kiểm tra kết nối mạng rồi thử lại.' : 'Vui lòng thử lại sau ít phút.')} action="Thử lại" onAction={onRetry} />
  );
}

// ---------- Placeholder / ảnh ----------
export function Photo({ uri, label, style, radius = 16 }) {
  const { c } = useTheme();
  if (uri) return <Image source={{ uri }} style={[{ borderRadius: radius, backgroundColor: c.ph1 }, style]} resizeMode="cover" />;
  return (
    <View style={[{ borderRadius: radius, backgroundColor: c.ph1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }, style]}>
      <Icon name="image" size={28} color={c.mute} />
      {label ? <Text numberOfLines={1} style={{ marginTop: 4, paddingHorizontal: 6, fontFamily: TEXT.mono.fontFamily, fontSize: 11, color: c.mute }}>{label}</Text> : null}
    </View>
  );
}

// ---------- Stepper ----------
export function Stepper({ value, onChange, min = 1, max = 20, step = 1, fmt }) {
  const { c } = useTheme();
  const box = { width: 48, height: 48, borderRadius: 14, borderWidth: 1.5, borderColor: c.line2, alignItems: 'center', justifyContent: 'center' };
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      <Pressable style={box} onPress={() => onChange(Math.max(min, value - step))} accessibilityLabel="Giảm"><Icon name="minus" size={20} color={c.ink} /></Pressable>
      <Text style={{ minWidth: 40, textAlign: 'center', fontFamily: fonts.displayBold, fontSize: 22, color: c.ink }}>{fmt ? fmt(value) : value}</Text>
      <Pressable style={box} onPress={() => onChange(Math.min(max, value + step))} accessibilityLabel="Tăng"><Icon name="plus" size={20} color={c.ink} /></Pressable>
    </View>
  );
}

// ---------- Ring tiến độ ----------
export function Ring({ pct = 0, size = 168, stroke = 12, children }) {
  const { c } = useTheme();
  const r = (size - stroke) / 2;
  const len = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={c.surf2} strokeWidth={stroke} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={c.gold} strokeWidth={stroke} fill="none" strokeLinecap="round"
          strokeDasharray={`${len} ${len}`} strokeDashoffset={len * (1 - Math.min(100, pct) / 100)} />
      </Svg>
      {children}
    </View>
  );
}

export function ProgressBar({ pct, color, height = 8 }) {
  const { c } = useTheme();
  return (
    <View style={{ height, borderRadius: height / 2, backgroundColor: c.surf2, overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(0, Math.min(100, pct))}%`, height: '100%', backgroundColor: color || c.pri, borderRadius: height / 2 }} />
    </View>
  );
}

// ---------- Bottom sheet ----------
export function BottomSheet({ visible, onClose, title, children, footer, maxHeight = '90%' }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, justifyContent: 'flex-end' }}>
        <Pressable onPress={onClose} style={[StyleSheet.absoluteFill, { backgroundColor: c.scrim }]} />
        <View style={{ backgroundColor: c.surf, borderTopLeftRadius: 28, borderTopRightRadius: 28, maxHeight, paddingBottom: Math.max(insets.bottom, 12) + 8 }}>
          <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: c.line2, alignSelf: 'center', marginTop: 10 }} />
          {title ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: 20, paddingRight: 8 }}>
              <T v="h2">{title}</T>
              <IconBtn name="close" onPress={onClose} label="Đóng" />
            </View>
          ) : null}
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingTop: title ? 4 : 16, gap: 14 }} showsVerticalScrollIndicator={false}>
            {children}
          </ScrollView>
          {footer ? <View style={{ paddingHorizontal: 20, paddingTop: 14 }}>{footer}</View> : null}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ---------- Toast ----------
const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);
export function ToastProvider({ children }) {
  const { c } = useTheme();
  const insets = useSafeAreaInsets();
  const [msg, setMsg] = useState(null);
  const t = useRef(null);
  const show = useCallback((m) => {
    clearTimeout(t.current);
    setMsg(m);
    t.current = setTimeout(() => setMsg(null), 2600);
  }, []);
  return (
    <ToastCtx.Provider value={show}>
      {children}
      {msg ? (
        <View pointerEvents="none" style={{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 96, zIndex: 100 }}>
          <View style={{ backgroundColor: c.ink, borderRadius: 14, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Icon name="check" size={20} color={c.bg} />
            <Text style={{ flex: 1, fontFamily: fonts.medium, fontSize: 15, color: c.bg }}>{msg}</Text>
          </View>
        </View>
      ) : null}
    </ToastCtx.Provider>
  );
}

// ---------- Tab ngang (Báo giá / lọc) ----------
export function HTabs({ tabs, value, onChange }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
      {tabs.map((t, i) => <Chip key={t} label={t} selected={i === value} onPress={() => onChange(i)} />)}
    </ScrollView>
  );
}

export function Row({ children, style }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>{children}</View>;
}
