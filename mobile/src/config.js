import Constants from 'expo-constants';

/*
 * Cấu hình app. API mặc định là BE production trên Render (HTTPS). Đổi bằng biến EXPO_PUBLIC_API_URL
 * (khi dev với BE local: dùng IP LAN của máy + http, và chỉ cho bản dev — Android chặn HTTP thường ở bản release).
 */
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  Constants.expoConfig?.extra?.apiUrl ||
  'https://woodhub-be.onrender.com/api';

// Chat AI + Meshy trên Render free có thể "ngủ": cho phép chờ lâu hơn
export const TIMEOUT_MS = 60_000;
export const AI_CHAT_TIMEOUT_MS = 150_000;
