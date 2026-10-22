import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore.js';

/*
 * /settings/notifications — link "tắt email" trong email thông báo của BE (BE-14 §3). FE không có 1 trang cài đặt chung
 * cho mọi vai trò → chuyển tới đúng chỗ đặt NotificationSettingsCard:
 *  NCC → /portal/supplier/settings?tab=notifications · xưởng → /portal/workshop/settings?tab=notifications ·
 *  khách → /profile#notifications. (Route nằm trong ProtectedRoute: chưa đăng nhập thì đăng nhập xong quay lại đây.)
 */
export default function NotificationSettingsRedirect() {
  const user = useAuthStore((s) => s.user);
  if (user?.role === 'supplier') {
    const base = user.supplierType === 'workshop' ? '/portal/workshop' : '/portal/supplier';
    return <Navigate to={`${base}/settings?tab=notifications`} replace />;
  }
  if (user?.role === 'admin') return <Navigate to="/admin" replace />;
  return <Navigate to="/profile#notifications" replace />;
}
