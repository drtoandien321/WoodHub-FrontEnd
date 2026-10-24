import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../../hooks/useCart.js';
import { useAuthStore } from '../../stores/authStore.js';
import NotificationBell from '../notifications/NotificationBell.jsx';
import { useUiStore } from '../../stores/uiStore.js';
import { useLogout } from '../../hooks/useLogout.js';
import { redirectPathForRole } from '../../utils/auth.js';
import LanguageSwitcher from '../ui/LanguageSwitcher.jsx';
import { SunIcon, MoonIcon, CartIcon, UserIcon, ChevronDownIcon, MenuIcon } from '../ui/icons.jsx';

// "Giới thiệu" giờ là 1 trang gộp (Câu chuyện + Bảng giá + Liên hệ) → link thẳng /about, bỏ dropdown
const MENU = [
  { key: 'shop', to: '/shop' },
  { key: 'custom', to: '/custom' },
  { key: 'suppliers', to: '/suppliers' },
  { key: 'b2b', to: '/b2b' },
  { key: 'intro', to: '/about' },
];

export default function Header() {
  const { user } = useAuthStore();
  // Badge = tổng số lượng trong giỏ server (totalQuantity). useCart tự tắt khi chưa đăng nhập → 0.
  const { data: cart } = useCart();
  const itemCount = cart?.totalQuantity ?? 0;
  const logout = useLogout();
  const { theme, toggleTheme } = useUiStore();
  const { t } = useTranslation();
  const isDark = theme === 'woodhub-dark';

  /*
   * Menu thu gọn (☰) dưới xl. Trước đây menu ngang `hidden lg:flex` và không có menu thay thế → dưới 1024 px không điều
   * hướng được từ header; từ 1024 px menu tiếng Việt (≈ 660 px) + logo + cụm phải cần ≈ 1 190 px nên header tràn, nút
   * "Đăng nhập" bị cắt (QA BUG-002). Đóng khi đổi trang, bấm ra ngoài hoặc Esc.
   */
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { pathname } = useLocation();
  useEffect(() => setMenuOpen(false), [pathname]);
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onDown = (e) => { if (!menuRef.current?.contains(e.target)) setMenuOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [menuOpen]);

  const themeButton = (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? t('common.switchToLight') : t('common.switchToDark')}
      className="btn btn-ghost btn-sm btn-circle"
    >
      {isDark ? <SunIcon className="w-4 h-4" /> : <MoonIcon className="w-4 h-4" />}
    </button>
  );

  // Người mua = chưa đăng nhập (guest) hoặc role customer → mới có Giỏ hàng
  const isBuyer = !user || user.role === 'customer';

  // "Khu vực riêng" theo role — hiện trong dropdown tài khoản.
  // Supplier trỏ thẳng portal đúng subtype (workshop/nhà cung cấp) qua helper dùng chung với Login.
  const roleArea =
    user?.role === 'supplier' ? { to: redirectPathForRole('supplier', undefined, user.supplierType), label: t('nav.portal') }
    : user?.role === 'admin' ? { to: '/admin', label: t('nav.admin') }
    : { to: '/orders', label: t('nav.orders') };

  // whitespace-nowrap: chặn nhãn dài (vd "Thiết kế Custom") bị xuống 2 hàng
  const navClass = ({ isActive }) =>
    `px-2.5 2xl:px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${isActive ? 'bg-primary text-primary-content' : 'hover:bg-base-200'}`;

  return (
    <header className="sticky top-0 z-40 bg-base-100/80 backdrop-blur border-b border-base-300">
      {/* < sm: thu gọn khoảng cách + logo để logo, theme, VI|EN, giỏ, Đăng nhập vừa 375 px (QA BUG-002: nút Đăng nhập bị cắt). */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center gap-2 sm:gap-4">
        {/* THƯƠNG HIỆU — tách riêng bên trái, cỡ lớn hơn + tagline */}
        <Link to="/" className="flex flex-col leading-none shrink-0">
          <span className="font-display text-xl sm:text-2xl md:text-3xl text-primary tracking-tight">WOODHUB</span>
          <span className="text-[8px] sm:text-[10px] md:text-[11px] tracking-[0.2em] sm:tracking-[0.32em] text-base-content/45 mt-1">FURNITURE &amp; CRAFT</span>
        </Link>

        {/* MENU — chiếm khoảng giữa (flex-1) và căn giữa; KHÔNG absolute nữa để không đè lên cụm phải */}
        <nav className="hidden xl:flex flex-1 items-center justify-center gap-1">
          {MENU.map((item) => (
            <NavLink key={item.key} to={item.to} className={navClass}>{t(`nav.${item.key}`)}</NavLink>
          ))}
        </nav>

        {/* BÊN PHẢI: theme, ngôn ngữ, giỏ hàng (icon), tài khoản — dồn sát lề phải */}
        <div className="flex items-center gap-1 sm:gap-3 shrink-0 ml-auto">
          {/* < sm: theme + VI|EN nằm trong menu ☰ để header vừa 375 px */}
          <span className="hidden sm:inline-flex">{themeButton}</span>
          <span className="hidden sm:flex"><LanguageSwitcher /></span>

          {/* Chuông thông báo (BE-12) — mọi tài khoản đã đăng nhập */}
          {user && <NotificationBell />}

          {/* Giỏ hàng — chỉ còn ICON + badge số lượng (bỏ chữ "Giỏ hàng") */}
          {isBuyer && (
            <Link to="/cart" aria-label={t('nav.cart')} className="btn btn-ghost btn-sm btn-circle relative">
              <CartIcon className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="pointer-events-none absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-accent px-1 text-[11px] font-semibold leading-none text-accent-content tabular-nums">{itemCount > 99 ? '99+' : itemCount}</span>
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
                {/* Giới hạn độ dài: tên dài đẩy header tràn ở 1280 px (menu tiếng Việt hiện đủ từ xl) */}
                <span className="hidden sm:inline max-w-[9rem] truncate" title={user.name}>{t('nav.greeting', { name: user.name })}</span>
                <ChevronDownIcon className="w-4 h-4 text-base-content/50" />
              </div>
              <ul tabIndex={0} className="dropdown-content menu bg-base-100 rounded-box z-20 w-48 p-2 shadow border border-base-300 mt-2">
                <li><Link to={roleArea.to}>{roleArea.label}</Link></li>
                {user.role === 'customer' && <li><Link to="/custom/designs">{t('custom.studio.designs.title')}</Link></li>}
                {user.role === 'customer' && <li><Link to="/quotes">{t('nav.quotes')}</Link></li>}
                {user.role === 'customer' && <li><Link to="/custom-orders">{t('nav.customOrders')}</Link></li>}
                {user.role === 'customer' && user.customerType === 'business' && <li><Link to="/bulk-quotes">{t('nav.bulkQuotes')}</Link></li>}
                {user.role === 'customer' && <li><Link to="/account/subscription">{t('nav.subscription')}</Link></li>}
                {user.role === 'customer' && <li><Link to="/account/addresses">{t('nav.addresses')}</Link></li>}
                <li><Link to="/profile">{t('nav.profile')}</Link></li>
                <li><button onClick={logout}>{t('nav.logout')}</button></li>
              </ul>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm whitespace-nowrap px-3 sm:px-4">{t('nav.login')}</Link>
          )}

          <div ref={menuRef} className="relative xl:hidden">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label={t('common.toggleMenu')}
              aria-expanded={menuOpen}
              aria-controls="site-menu"
              className="btn btn-ghost btn-sm btn-circle"
            >
              <MenuIcon className="w-5 h-5" />
            </button>
            {menuOpen && (
              <div id="site-menu" className="absolute right-0 top-full z-50 mt-2 w-60 rounded-box border border-base-300 bg-base-100 p-2 shadow-lg">
                <nav className="flex flex-col">
                  {MENU.map((item) => (
                    <NavLink key={item.key} to={item.to} className={navClass}>{t(`nav.${item.key}`)}</NavLink>
                  ))}
                </nav>
                <div className="mt-2 flex items-center justify-between border-t border-base-300 px-2 pt-2 sm:hidden">
                  <LanguageSwitcher />
                  {themeButton}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
