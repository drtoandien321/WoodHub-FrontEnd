import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Cùng khung với Forbidden (403). Bản cũ viết cứng câu sai chính tả "chưa được đóng" và không đổi theo ngôn ngữ.
export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
      <h1 className="font-display text-6xl text-primary">404</h1>
      <p className="text-base-content/70">{t('notFoundPage.message')}</p>
      <Link to="/" className="btn btn-primary btn-sm mt-2">{t('notFoundPage.backHome')}</Link>
    </div>
  );
}
