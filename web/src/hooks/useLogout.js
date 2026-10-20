import { api } from '../api/client.js';
import { useAuthStore } from '../stores/authStore.js';
import { disconnect as disconnectChatSocket } from '../services/chatSocket.js';

/*
 * useLogout — gom "đăng xuất" về 1 chỗ duy nhất, dùng thay cho gọi thẳng authStore.logout().
 * Trước đây các nút Đăng xuất (Header, HeroNavbar, PortalLayout, PortalShell) chỉ xoá state
 * local — không báo cho BE nên refresh token cũ vẫn còn hiệu lực. Giờ gọi POST /auth/logout
 * để BE thu hồi token, RỒI mới xoá state local.
 *
 * try/catch nuốt lỗi có chủ đích (không phải nuốt lỗi ẩu): đăng xuất phải LUÔN thành công ở
 * phía người dùng dù request BE có lỗi mạng hay token đã hết hạn sẵn — không thể để user bị
 * kẹt "không đăng xuất được" chỉ vì BE tạm thời không phản hồi.
 */
export function useLogout() {
  const refreshToken = useAuthStore((s) => s.refreshToken);
  const clearAuth = useAuthStore((s) => s.logout);

  return async () => {
    try {
      await api.logout({ refreshToken });
    } catch {
      // best-effort — vẫn xoá state local ở finally-like bên dưới
    }
    disconnectChatSocket();
    clearAuth();
    /*
     * Tải lại trang về trang chủ thay vì navigate() trong SPA (lỗi QA 20/10):
     *  - navigate() của React Router chạy theo transition (trang chủ lại là lazy route) nên ProtectedRoute kịp
     *    render trước với location cũ → đẩy sang /login?from=/portal/... → customer đăng nhập kế tiếp bị đưa vào
     *    portal → 403.
     *  - Tải lại cũng xoá sạch state trong RAM của tài khoản cũ (chat NCC, cache, socket) — không sót gì.
     * Đánh đổi: 1 lần tải lại trang khi đăng xuất (chấp nhận được, nhiều sàn TMĐT cũng làm vậy).
     */
    window.location.replace('/');
  };
}
