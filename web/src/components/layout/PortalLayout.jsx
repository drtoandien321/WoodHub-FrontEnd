import { Link, NavLink, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore.js';
import { MenuIcon } from '../ui/icons.jsx';

const NAV_ITEMS = [
  { to: '/portal', key: 'dashboard', end: true },
  { to: '/portal/store', key: 'store' },
  { to: '/portal/products', key: 'products' },
  { to: '/portal/orders', key: 'orders' },
];

/*
 * PortalLayout — khung riêng cho Supplier Portal (sidebar + topbar),
 * dùng daisyUI "drawer": desktop hiện sidebar cố định (lg:drawer-open),
 * mobile sidebar trượt ra từ checkbox toggle (#portal-drawer).
 */
export default function PortalLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();

  const linkClass = ({ isActive }) =>
    `block px-3 py-2 rounded-lg text-sm transition-colors ${isActive ? 'bg-primary text-primary-content' : 'hover:bg-base-200'}`;

  return (
    <div className="drawer lg:drawer-open">
      <input id="portal-drawer" type="checkbox" className="drawer-toggle" />

      <div className="drawer-content flex flex-col min-h-screen">
        {/* Topbar */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-base-300 bg-base-100">
          <div className="flex items-center gap-3">
            <label htmlFor="portal-drawer" className="btn btn-ghost btn-sm btn-circle lg:hidden">
              <MenuIcon className="w-5 h-5" />
            </label>
            <span className="font-display text-lg text-primary">{t('nav.portal')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm hidden sm:inline text-base-content/70">{user?.name}</span>
            <Link to="/" className="btn btn-ghost btn-sm">{t('forbidden.backHome')}</Link>
            <button onClick={logout} className="btn btn-outline btn-sm">{t('nav.logout')}</button>
          </div>
        </div>

        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          <Outlet />
        </main>
      </div>

      {/* Sidebar */}
      <div className="drawer-side z-30">
        <label htmlFor="portal-drawer" aria-label="close sidebar" className="drawer-overlay"></label>
        <ul className="menu p-4 w-64 min-h-full bg-base-100 border-r border-base-300 gap-1">
          <li className="mb-2 px-3">
            <span className="font-display text-xl text-primary">WoodHub</span>
          </li>
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to} end={item.end} className={linkClass}>
                {t(`portal.nav.${item.key}`)}
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
