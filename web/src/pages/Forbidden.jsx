import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Forbidden() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
      <h1 className="font-display text-6xl text-primary">403</h1>
      <p className="text-base-content/70">{t('forbidden.message')}</p>
      <Link to="/" className="btn btn-primary btn-sm mt-2">{t('forbidden.backHome')}</Link>
    </div>
  );
}
