import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Icon inline (mũi tên/chevron) thay vì cài lucide-react — đỡ 1 dependency cho 2 icon
export const ArrowUpRight = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7M7 7h10v10" /></svg>
);
export const ChevronRight = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
);

const MENU = [
  { key: 'shop', to: '/shop' },
  { key: 'custom', to: '/custom', hasDropdown: true },
  { key: 'suppliers', to: '/suppliers' },
  { key: 'b2b', to: '/b2b', hasDropdown: true },
];

export default function HeroNavbar() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <nav className="flex items-center justify-between py-6 px-6 md:px-10 w-full relative z-10">
      <div className="flex-1 hidden md:block">
        <Link to="/" className="font-display tracking-tighter text-2xl text-hero-ink/95">WoodHub</Link>
      </div>

      <ul className="hidden md:flex items-center gap-8 text-[rgb(58,44,31)] font-normal text-sm">
        {MENU.map((item) => (
          <li key={item.key} className="cursor-pointer hover:opacity-70 transition-opacity flex items-center gap-1 group">
            <Link to={item.to} className="flex items-center gap-1">
              {t(`nav.${item.key}`)}
              {item.hasDropdown && <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />}
            </Link>
          </li>
        ))}
      </ul>

      <div className="md:hidden">
        <span className="font-display tracking-tighter text-xl text-hero-ink/95">WoodHub</span>
      </div>

      <div className="flex-1 flex justify-end">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate('/shop')}
          className="flex items-center bg-hero-ink/85 text-white rounded-full pl-2 pr-4 md:pr-6 py-1.5 md:py-2 gap-2 md:gap-3 hover:bg-hero-ink transition-colors group cursor-pointer"
        >
          <div className="bg-white/20 p-1 md:p-1.5 rounded-full flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <span className="text-xs md:text-sm font-normal">{t('nav.exploreNow')}</span>
        </motion.button>
      </div>
    </nav>
  );
}
