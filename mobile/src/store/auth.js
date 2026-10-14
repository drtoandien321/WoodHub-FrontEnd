import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

/*
 * Auth store — token lưu bằng expo-secure-store (Keystore Android), KHÔNG dùng AsyncStorage cho token.
 * hydrate() chạy 1 lần lúc mở app; trong lúc đó `ready = false` để màn splash chờ, tránh nháy sang màn đăng nhập.
 * Phiên chat AI gắn theo user (giống web): đổi tài khoản thì bỏ phiên cũ.
 */
const KEY = 'woodhub.auth';
const ONB_KEY = 'woodhub.onboarded';

export const useAuth = create((set, get) => ({
  ready: false,
  onboarded: true, // mặc định true tới khi đọc xong, tránh nháy onboarding
  token: null,
  refreshToken: null,
  user: null, // { id, name, email, role, customerType }

  hydrate: async () => {
    let saved = null;
    try {
      const raw = await SecureStore.getItemAsync(KEY);
      saved = raw ? JSON.parse(raw) : null;
    } catch { /* thiết bị lỗi keystore → coi như chưa đăng nhập */ }
    let onboarded = false;
    try { onboarded = (await AsyncStorage.getItem(ONB_KEY)) === '1'; } catch { /* bỏ qua */ }
    set({ ready: true, onboarded, ...(saved || {}) });
  },

  setAuth: async ({ token, refreshToken, user }) => {
    set({ token, refreshToken, user });
    try { await SecureStore.setItemAsync(KEY, JSON.stringify({ token, refreshToken, user })); } catch { /* bỏ qua */ }
  },

  logout: async () => {
    set({ token: null, refreshToken: null, user: null });
    try { await SecureStore.deleteItemAsync(KEY); } catch { /* bỏ qua */ }
  },

  finishOnboarding: async () => {
    set({ onboarded: true });
    try { await AsyncStorage.setItem(ONB_KEY, '1'); } catch { /* bỏ qua */ }
  },
}));
