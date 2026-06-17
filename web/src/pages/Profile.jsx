import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore.js';

/*
 * Profile — trang "Thông tin cá nhân" mở từ dropdown tài khoản trên Header.
 * MVP: hiển thị thông tin tài khoản đang đăng nhập (lấy từ authStore).
 * Sau này có thể nối API GET /users/me và cho chỉnh sửa (PUT /users/:id).
 */
export default function Profile() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);

  // ProtectedRoute đã chặn khách chưa đăng nhập; phòng hờ trả null nếu chưa có user
  if (!user) return null;

  const rows = [
    [t('profile.name'), user.name],
    [t('profile.email'), user.email],
    [t('profile.role'), t(`auth.roles.${user.role}`)],
  ];

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <h1 className="font-display text-3xl mb-6">{t('profile.title')}</h1>
      <div className="card bg-base-200 border border-base-300 divide-y divide-base-300">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-4 px-5 py-4">
            <span className="text-base-content/60 text-sm">{label}</span>
            <span className="font-medium text-sm text-right">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
