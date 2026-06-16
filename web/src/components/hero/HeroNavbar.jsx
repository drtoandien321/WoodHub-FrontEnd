import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Icon inline (chevron) thay vì cài lucide-react — đỡ 1 dependency
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
  const { t } = useTranslation();
  return (
    <nav className="flex items-center justify-between py-6 px-4 sm:px-6 md:px-10 w-full relative z-10">
      {/* Logo — desktop: flex-1 để nav menu căn giữa */}
      <div className="flex-1 hidden md:block">
        <Link to="/" className="font-display tracking-tighter text-2xl text-hero-ink/95">WoodHub</Link>
      </div>

      {/* Menu items — chỉ hiển thị trên desktop */}
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

      {/* Mobile: chỉ hiển thị logo ở giữa */}
      <div className="md:hidden flex-1 flex justify-center">
        <span className="font-display tracking-tighter text-xl text-hero-ink/95">WoodHub</span>
      </div>

      {/* Spacer bên phải để giữ cân đối với logo bên trái trên desktop */}
      <div className="flex-1 hidden md:block" />
    </nav>
  );
}
