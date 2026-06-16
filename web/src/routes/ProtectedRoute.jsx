import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore.js';

/*
 * Protected Route — "cổng" kiểm tra đăng nhập + (tùy chọn) đúng role phía FE.
 * Lưu ý: đây chỉ là UX, KHÔNG phải bảo mật. Bảo mật thật nằm ở BE
 * (BE phải verify JWT ở mọi endpoint nhạy cảm). FE chặn trước để
 * user không thấy trang trống/lỗi rồi mới bị đá ra.
 *
 * allow: mảng role được phép, ví dụ allow={['supplier']}.
 * Không truyền allow → chỉ cần đăng nhập (không phân biệt role) — giữ nguyên hành vi cũ
 * cho /checkout, /orders, /custom/match.
 */
export default function ProtectedRoute({ allow }) {
  const { token, user } = useAuthStore();
  const location = useLocation();

  if (!token) {
    // state.from: lưu trang user định vào, login xong quay lại đúng chỗ
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (allow && !allow.includes(user?.role)) {
    return <Navigate to="/403" replace />;
  }
  return <Outlet />;
}
