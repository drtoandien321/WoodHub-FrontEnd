import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import MyDesignsList from '../components/custom-studio/MyDesignsList.jsx';

// Trang riêng "Thiết kế của tôi" — cùng dùng MyDesignsList với bước 6 của Custom Studio (1 nguồn hiển thị).
export default function CustomDesigns() {
  const { t } = useTranslation();
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to="/custom" className="text-sm text-base-content/55 hover:text-primary">← {t('nav.custom')}</Link>
          <h1 className="mt-1 font-display text-3xl">{t('custom.studio.designs.title')}</h1>
        </div>
        <Link to="/custom/studio" className="btn btn-primary btn-sm">{t('custom.studio.step6.newDesign')}</Link>
      </div>
      <MyDesignsList />
    </div>
  );
}
