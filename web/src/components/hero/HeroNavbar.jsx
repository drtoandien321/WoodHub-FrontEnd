import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore.js';

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
  { key: 'intro', to: '/about' },
];

export default function HeroNavbar() {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  return (
    <nav className="flex items-center justify-between gap-4 py-3 px-5 sm:px-6 md:px-8 mx-3 sm:mx-5 md:mx-6 mt-3 sm:mt-4 rounded-full bg-ivory/80 backdrop-blur-md border border-white/50 shadow-[0_4px_24px_rgba(74,53,34,0.06)] relative z-10">
      {/* Logo — desktop: flex-1 để nav menu căn giữa */}
      <div className="flex-1 hidden md:block">
        <Link to="/" className="font-display tracking-tighter text-2xl text-hero-ink/95">WoodHub</Link>
      </div>

      {/* Menu items — chỉ hiển thị trên desktop */}
      <ul className="hidden md:flex items-center gap-6 lg:gap-8 text-[rgb(58,44,31)] font-normal text-sm">
        {MENU.map((item) => (
          <li key={item.key} className="cursor-pointer hover:opacity-70 transition-opacity flex items-center gap-1 group whitespace-nowrap">
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

      {/* Bên phải: Sign In / Sign Up (khách) hoặc lời chào + đăng xuất (đã đăng nhập) */}
      <div className="flex-1 hidden md:flex items-center justify-end gap-3">
        {user ? (
          <>
            <Link to="/profile" className="text-sm text-hero-ink/90 hover:opacity-70 transition-opacity">
              {t('nav.greeting', { name: user.name })}
            </Link>
            <button
              type="button"
              onClick={logout}
              className="rounded-full border border-hero-ink/25 px-5 py-2 text-sm text-hero-ink/90 hover:bg-white/40 transition-colors cursor-pointer"
            >
              {t('nav.logout')}
            </button>
          </>
        ) : (
          <>
            <Link
              to="/login"
              className="rounded-full border border-hero-ink/25 px-5 py-2 text-sm text-hero-ink/90 hover:bg-white/40 transition-colors"
            >
              {t('nav.login')}
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-hero-ink px-5 py-2 text-sm text-ivory hover:bg-hero-ink/90 transition-colors"
            >
              {t('nav.register')}
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
