import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCartStore } from '../../stores/cartStore.js';
import { useAuthStore } from '../../stores/authStore.js';
import { useUiStore } from '../../stores/uiStore.js';
import LanguageSwitcher from '../ui/LanguageSwitcher.jsx';
import { SunIcon, MoonIcon } from '../ui/icons.jsx';

export default function Header() {
  const itemCount = useCartStore((s) => s.items.reduce((n, i) => n + i.qty, 0));
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useUiStore();
  const { t } = useTranslation();
  const isDark = theme === 'woodhub-dark';

  const navClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary text-primary-content' : 'hover:bg-base-200'}`;

  return (
    <header className="sticky top-0 z-40 bg-base-100/80 backdrop-blur border-b border-base-300">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="font-display text-2xl text-primary tracking-tight">WoodHub</Link>

        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/shop" className={navClass}>{t('nav.shop')}</NavLink>
          <NavLink to="/custom" className={navClass}>{t('nav.custom')}</NavLink>
          <NavLink to="/suppliers" className={navClass}>{t('nav.suppliers')}</NavLink>
          <NavLink to="/b2b" className={navClass}>{t('nav.b2b')}</NavLink>

          {/* Dropdown gom các trang giới thiệu — tránh navbar quá dài */}
          <div className="dropdown dropdown-end">
            <div tabIndex={0} role="button" className="px-3 py-2 rounded-lg text-sm hover:bg-base-200 cursor-pointer">
              {t('nav.intro')}
            </div>
            <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-20 w-44 p-2 shadow border border-base-300">
              <li><Link to="/about">{t('nav.about')}</Link></li>
              <li><Link to="/pricing">{t('nav.pricing')}</Link></li>
              <li><Link to="/contact">{t('nav.contact')}</Link></li>
            </ul>
          </div>
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? t('common.switchToLight') : t('common.switchToDark')}
            className="btn btn-ghost btn-sm btn-circle"
          >
            {isDark ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
          </button>
          <LanguageSwitcher />

          <Link to="/cart" className="btn btn-ghost btn-sm relative">
            {t('nav.cart')}
            {itemCount > 0 && (
              <span className="badge badge-accent badge-sm absolute -top-1 -right-1">{itemCount}</span>
            )}
          </Link>
          {user ? (
            <div className="flex items-center gap-2">
              <span className="text-sm hidden sm:inline">{t('nav.greeting', { name: user.name })}</span>
              <button onClick={logout} className="btn btn-outline btn-sm">{t('nav.logout')}</button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">{t('nav.login')}</Link>
          )}
        </div>
      </div>
    </header>
  );
}
