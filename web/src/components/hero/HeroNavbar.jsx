import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore.js';
import { useLogout } from '../../hooks/useLogout.js';
import { redirectPathForRole } from '../../utils/auth.js';
import ShopMegaMenu from './ShopMegaMenu.jsx';

// Icon inline (chevron) thay vì cài lucide-react — đỡ 1 dependency
export const ArrowUpRight = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17 17 7M7 7h10v10" /></svg>
);
export const ChevronRight = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
);

const MENU = [
  { key: 'shop', to: '/shop', mega: true }, // mega: hover mở mega menu "Cửa hàng"
  { key: 'rooms', to: '/rooms' },
  { key: 'custom', to: '/custom', hasDropdown: true },
  { key: 'suppliers', to: '/suppliers' },
  { key: 'b2b', to: '/b2b', hasDropdown: true },
  { key: 'intro', to: '/about' },
];

export default function HeroNavbar() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const logout = useLogout();
  // "Khu vực riêng" theo role — GIỐNG HỆT logic ở Header.jsx (dùng ở mọi trang khác). Trang chủ
  // dùng navbar riêng (HeroNavbar) nên trước đây KHÔNG có link này — bug đã báo: đăng nhập
  // supplier/admin xong về trang chủ thì không bấm quay lại portal được, chỉ có link /profile.
  const roleArea =
    user?.role === 'supplier' ? { to: redirectPathForRole('supplier', undefined, user.supplierType), label: t('nav.portal') }
    : user?.role === 'admin' ? { to: '/admin', label: t('nav.admin') }
    : { to: '/orders', label: t('nav.orders') };
  // Mega menu "Cửa hàng": mở khi hover item shop, đóng khi rời <nav> (panel là CON
  // của nav nên rê chuột trong panel không kích hoạt mouseleave).
  const [shopOpen, setShopOpen] = useState(false);

  return (
    <nav
      onMouseLeave={() => setShopOpen(false)}
      className="flex items-center justify-between gap-4 py-3 px-5 sm:px-6 md:px-8 mx-3 sm:mx-5 md:mx-6 mt-3 sm:mt-4 rounded-full bg-ivory/80 backdrop-blur-md border border-white/50 shadow-[0_4px_24px_rgba(74,53,34,0.06)] relative z-10"
    >
      {/* Logo — desktop: flex-1 để nav menu căn giữa */}
      <div className="flex-1 hidden md:block">
        <Link to="/" className="font-display tracking-tighter text-2xl text-hero-ink/95">WoodHub</Link>
      </div>

      {/* Menu items — chỉ hiển thị trên desktop */}
      <ul className="hidden md:flex items-center gap-6 lg:gap-8 text-[rgb(58,44,31)] font-normal text-sm">
        {MENU.map((item) => (
          <li
            key={item.key}
            onMouseEnter={() => setShopOpen(!!item.mega)}
            // relative: neo panel mega menu vào ĐÚNG nút "Cửa hàng" → Cột 1 luôn đứng yên,
            // các cột sâu hơn chỉ mọc sang phải (không bị dịch ngang khi đổi số cột).
            // LƯU Ý: KHÔNG đặt opacity ở đây — opacity của <li> sẽ áp lên cả panel con
            // (làm panel mờ xuyên thấu). Hiệu ứng hover mờ chuyển xuống <Link> nhãn.
            className={`cursor-pointer flex items-center gap-1 group whitespace-nowrap ${item.mega ? 'relative' : ''}`}
          >
            <Link to={item.to} className="flex items-center gap-1 hover:opacity-70 transition-opacity">
              {t(`nav.${item.key}`)}
              {item.mega
                ? <ChevronRight className={`w-4 h-4 transition-transform ${shopOpen ? 'rotate-90' : ''}`} />
                : item.hasDropdown && <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />}
            </Link>

            {/* Panel mega menu — absolute ngay dưới "Cửa hàng". pt-2 tạo "cầu" trong suốt
                để chuột đi từ nút xuống panel không bị hở. z-50 để nổi trên nội dung hero. */}
            {item.mega && shopOpen && (
              <div className="absolute left-0 top-full pt-2 z-50">
                <ShopMegaMenu onNavigate={() => setShopOpen(false)} />
              </div>
            )}
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
          // Dropdown giống Header.jsx — bấm lời chào để xổ ra Portal/Đơn hàng/Gói của tôi/Hồ sơ/Đăng xuất
          <div className="dropdown dropdown-end">
            <div
              tabIndex={0}
              role="button"
              className="text-sm text-hero-ink/90 hover:opacity-70 transition-opacity cursor-pointer"
            >
              {t('nav.greeting', { name: user.name })}
            </div>
            <ul tabIndex={0} className="dropdown-content menu bg-base-100 text-base-content rounded-box z-20 w-48 p-2 shadow border border-base-300 mt-2">
              <li><Link to={roleArea.to}>{roleArea.label}</Link></li>
              {user.role === 'customer' && <li><Link to="/account/subscription">{t('nav.subscription')}</Link></li>}
              <li><Link to="/profile">{t('nav.profile')}</Link></li>
              <li><button onClick={logout}>{t('nav.logout')}</button></li>
            </ul>
          </div>
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
