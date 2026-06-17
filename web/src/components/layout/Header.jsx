import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCartStore } from '../../stores/cartStore.js';
import { useAuthStore } from '../../stores/authStore.js';
import { useUiStore } from '../../stores/uiStore.js';
import LanguageSwitcher from '../ui/LanguageSwitcher.jsx';
import { SunIcon, MoonIcon, CartIcon, UserIcon, ChevronDownIcon } from '../ui/icons.jsx';

// "Giới thiệu" giờ là 1 trang gộp (Câu chuyện + Bảng giá + Liên hệ) → link thẳng /about, bỏ dropdown
const MENU = [
  { key: 'shop', to: '/shop' },
  { key: 'custom', to: '/custom' },
  { key: 'suppliers', to: '/suppliers' },
  { key: 'b2b', to: '/b2b' },
  { key: 'intro', to: '/about' },
];

export default function Header() {
  const itemCount = useCartStore((s) => s.items.reduce((n, i) => n + i.qty, 0));
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useUiStore();
  const { t } = useTranslation();
  const isDark = theme === 'woodhub-dark';

  // Người mua = chưa đăng nhập (guest) hoặc role customer → mới có Giỏ hàng
  const isBuyer = !user || user.role === 'customer';

  // "Khu vực riêng" theo role — hiện trong dropdown tài khoản
  const roleArea =
    user?.role === 'supplier' ? { to: '/portal', label: t('nav.portal') }
    : user?.role === 'admin' ? { to: '/admin', label: t('nav.admin') }
    : { to: '/orders', label: t('nav.orders') };

  // whitespace-nowrap: chặn nhãn dài (vd "Thiết kế Custom") bị xuống 2 hàng
  const navClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${isActive ? 'bg-primary text-primary-content' : 'hover:bg-base-200'}`;

  return (
    <header className="sticky top-0 z-40 bg-base-100/80 backdrop-blur border-b border-base-300">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center gap-4">
        {/* THƯƠNG HIỆU — tách riêng bên trái, cỡ lớn hơn + tagline */}
        <Link to="/" className="flex flex-col leading-none shrink-0">
          <span className="font-display text-2xl md:text-3xl text-primary tracking-tight">WOODHUB</span>
          <span className="text-[10px] md:text-[11px] tracking-[0.32em] text-base-content/45 mt-1">FURNITURE &amp; CRAFT</span>
        </Link>

        {/* MENU — chiếm khoảng giữa (flex-1) và căn giữa; KHÔNG absolute nữa để không đè lên cụm phải */}
        <nav className="hidden lg:flex flex-1 items-center justify-center gap-1">
          {MENU.map((item) => (
            <NavLink key={item.key} to={item.to} className={navClass}>{t(`nav.${item.key}`)}</NavLink>
          ))}
        </nav>

        {/* BÊN PHẢI: theme, ngôn ngữ, giỏ hàng (icon), tài khoản — dồn sát lề phải */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0 ml-auto">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={isDark ? t('common.switchToLight') : t('common.switchToDark')}
            className="btn btn-ghost btn-sm btn-circle"
          >
            {isDark ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
          </button>
          <LanguageSwitcher />

          {/* Giỏ hàng — chỉ còn ICON + badge số lượng (bỏ chữ "Giỏ hàng") */}
          {isBuyer && (
            <Link to="/cart" aria-label={t('nav.cart')} className="btn btn-ghost btn-sm btn-circle relative">
              <CartIcon className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="badge badge-accent badge-xs absolute -top-0.5 -right-0.5">{itemCount}</span>
              )}
            </Link>
          )}

          {user ? (
            // Pill tài khoản: icon người + "Chào, {tên}" → bấm xổ menu Đơn hàng / Thông tin cá nhân / Đăng xuất
            <div className="dropdown dropdown-end">
              <div
                tabIndex={0}
                role="button"
                className="flex items-center gap-2 rounded-full border border-base-300 pl-2 pr-3 py-1.5 text-sm hover:bg-base-200 transition-colors cursor-pointer whitespace-nowrap"
              >
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-base-200 text-base-content/70">
                  <UserIcon className="w-4 h-4" />
                </span>
                <span className="hidden sm:inline">{t('nav.greeting', { name: user.name })}</span>
                <ChevronDownIcon className="w-4 h-4 text-base-content/50" />
              </div>
              <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-20 w-48 p-2 shadow border border-base-300 mt-2">
                <li><Link to={roleArea.to}>{roleArea.label}</Link></li>
                <li><Link to="/profile">{t('nav.profile')}</Link></li>
                <li><button onClick={logout}>{t('nav.logout')}</button></li>
              </ul>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm whitespace-nowrap">{t('nav.login')}</Link>
          )}
        </div>
      </div>
    </header>
  );
}
