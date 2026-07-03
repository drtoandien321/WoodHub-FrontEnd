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
      refreshToken: null, // dùng cho POST /auth/refresh khi access token hết hạn (xem api/client.js)
      // user: { id, name, email, role: 'customer'|'supplier'|'admin', customerType?: 'individual'|'business',
      //         mustChangePassword?: boolean — true = tài khoản do admin tạo (vd supplier), phải đổi mật khẩu
      //         trước khi dùng Portal (xem routes/ProtectedRoute.jsx + pages/ChangePasswordRequired.jsx) }
      user: null,
      setAuth: ({ token, refreshToken, user }) => set({ token, refreshToken, user }),
      // Gọi sau khi đổi mật khẩu bắt buộc thành công — bỏ cờ để ProtectedRoute cho vào Portal
      clearMustChangePassword: () =>
        set((s) => ({ user: s.user ? { ...s.user, mustChangePassword: false } : s.user })),
      // Cập nhật 1 phần user (vd sau khi sửa fullName/phone ở Profile) — không đụng token/refreshToken
      patchUser: (patch) => set((s) => ({ user: s.user ? { ...s.user, ...patch } : s.user })),
      logout: () => set({ token: null, refreshToken: null, user: null }),
    }),
    { name: 'woodhub-auth' }
  )
);
