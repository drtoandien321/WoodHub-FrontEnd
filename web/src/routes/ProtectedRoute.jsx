import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore.js';

/*
 * Protected Route — "cổng" kiểm tra đăng nhập phía FE.
 * Lưu ý: đây chỉ là UX, KHÔNG phải bảo mật. Bảo mật thật nằm ở BE
 * (BE phải verify JWT ở mọi endpoint nhạy cảm). FE chặn trước để
 * user không thấy trang trống/lỗi rồi mới bị đá ra.
 */
export default function ProtectedRoute({ role }) {
  const { token, user } = useAuthStore();
  const location = useLocation();

  if (!token) {
    // state.from: lưu trang user định vào, login xong quay lại đúng chỗ
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (role && user?.role !== role) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
