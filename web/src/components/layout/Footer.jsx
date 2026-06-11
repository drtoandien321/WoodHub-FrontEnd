import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-base-300 bg-base-200">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div className="col-span-2 md:col-span-1 flex flex-col gap-2">
          <span className="font-display text-lg text-primary">WoodHub</span>
          <p className="text-base-content/60">{t('footer.tagline')}</p>
        </div>

        <div className="flex flex-col gap-2">
          <span className="font-medium text-base-content/80">{t('footer.explore')}</span>
          <Link to="/shop" className="link link-hover text-base-content/60">{t('nav.shop')}</Link>
          <Link to="/custom" className="link link-hover text-base-content/60">{t('nav.custom')}</Link>
          <Link to="/suppliers" className="link link-hover text-base-content/60">{t('nav.suppliers')}</Link>
          <Link to="/b2b" className="link link-hover text-base-content/60">{t('nav.b2b')}</Link>
        </div>

        <div className="flex flex-col gap-2">
          <span className="font-medium text-base-content/80">{t('footer.company')}</span>
          <Link to="/about" className="link link-hover text-base-content/60">{t('nav.about')}</Link>
          <Link to="/pricing" className="link link-hover text-base-content/60">{t('nav.pricing')}</Link>
          <Link to="/contact" className="link link-hover text-base-content/60">{t('nav.contact')}</Link>
        </div>

        <div className="flex flex-col gap-2 justify-end text-base-content/60">
          <span>{t('footer.copyright')}</span>
        </div>
      </div>
    </footer>
  );
}
