import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/*
 * Auth store (client state) — Zustand thay vì Redux: ít boilerplate, đủ cho đồ án.
 * persist: lưu vào localStorage để F5 không mất phiên.
 * ⚠️ Trade-off bảo mật: token trong localStorage có rủi ro XSS.
 *    Production nên đổi sang httpOnly cookie (BE set cookie, FE không đọc được token).
 *    MVP chấp nhận localStorage để demo nhanh — đã ghi chú trong API_CONTRACT.md.
 */
export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null, // { id, name, email, role: 'customer' | 'supplier' | 'admin' }
      setAuth: ({ token, user }) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    { name: 'woodhub-auth' }
  )
);
