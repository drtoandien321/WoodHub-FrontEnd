import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/*
 * Placeholder Admin Dashboard — role 'admin' đã được wire vào auth/ProtectedRoute,
 * nhưng Admin Portal đầy đủ (quản lý user, supplier, sản phẩm toàn hệ thống...)
 * sẽ được làm ở đợt sau (Prompt 2/2).
 */
export default function AdminDashboard() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-3 px-4">
      <h1 className="font-display text-3xl text-primary">{t('admin.title')}</h1>
      <p className="text-base-content/70 max-w-md">{t('admin.comingSoon')}</p>
      <Link to="/" className="btn btn-primary btn-sm mt-2">{t('forbidden.backHome')}</Link>
    </div>
  );
}
