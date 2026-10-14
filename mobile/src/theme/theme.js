import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/*
 * Theme — token màu LẤY NGUYÊN từ thiết kế Claude Design (biến CSS --bg, --surf, --pri…), cùng bộ với web WoodHub.
 * Sáng: ivory #F4EFE6 + walnut #5B4232 · Tối: nâu #201A14 + oak #C89B6E. Gold chỉ dùng cho giá chốt và điểm nhấn AR.
 */
export const light = {
  bg: '#F4EFE6', surf: '#FBF8F2', surf2: '#ECE4D7', ink: '#2B2119', mute: '#6B5D4F',
  line: '#E2D7C6', line2: '#CDBDA7', pri: '#5B4232', onpri: '#F8F4EC', oak: '#B08968',
  gold: '#C9A227', goldtx: '#8C6F10', forest: '#3F5E4E', err: '#A8473D',
  ph1: '#EAE0D1', ph2: '#E3D7C5', scrim: 'rgba(32,26,20,0.48)', v1: '#F7F2EA', v2: '#DCC6AA', hero: '#5B4232',
  bpBg: '#F7E5C8', bpTx: '#84540F', bnBg: '#DEE5EE', bnTx: '#3B5473', bcBg: '#DBE7DF', bcTx: '#2D4A3C', brBg: '#F3DCD6', brTx: '#963A2E',
  shadow: '#46291A',
};
export const dark = {
  bg: '#201A14', surf: '#2A221B', surf2: '#362C23', ink: '#F4EFE6', mute: '#B9AA99',
  line: '#3F3329', line2: '#5C4B3C', pri: '#C89B6E', onpri: '#201A14', oak: '#C89B6E',
  gold: '#D4AF37', goldtx: '#E2BE48', forest: '#86B49B', err: '#E38E80',
  ph1: '#2D251E', ph2: '#342B23', scrim: 'rgba(0,0,0,0.6)', v1: '#2C241D', v2: '#4C3B2C', hero: '#3A2E24',
  bpBg: '#3C2E1B', bpTx: '#E8B86A', bnBg: '#2B323D', bnTx: '#A3B8D6', bcBg: '#233129', bcTx: '#93BFA6', brBg: '#3B2522', brTx: '#E8958A',
  shadow: '#000000',
};

// Tên font khớp với @expo-google-fonts đã nạp ở App.js
export const fonts = {
  regular: 'BeVietnamPro_400Regular',
  medium: 'BeVietnamPro_500Medium',
  semi: 'BeVietnamPro_600SemiBold',
  bold: 'BeVietnamPro_700Bold',
  display: 'Lora_600SemiBold',
  displayMed: 'Lora_500Medium',
  displayBold: 'Lora_700Bold',
};

const THEME_KEY = 'woodhub.theme';
const ThemeContext = createContext({ c: light, isDark: false, setDark: () => {} });

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((v) => { if (v === 'dark') setIsDark(true); }).catch(() => {});
  }, []);
  const setDark = (v) => {
    setIsDark(v);
    AsyncStorage.setItem(THEME_KEY, v ? 'dark' : 'light').catch(() => {});
  };
  const value = useMemo(() => ({ c: isDark ? dark : light, isDark, setDark }), [isDark]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
