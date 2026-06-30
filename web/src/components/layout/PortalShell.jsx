import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore.js';
import PortalChatButton from '../portal/PortalChatButton.jsx';
import PortalChatDrawer from '../portal/PortalChatDrawer.jsx';
import { MenuIcon } from '../ui/icons.jsx';
import { LogOut, Bell, X } from '../suppliers/icons.jsx';

/*
 * PortalShell — khung dùng chung cho Portal Nhà cung cấp & Xưởng mộc.
 * - Sidebar CỐ ĐỊNH: desktop dùng <aside sticky top-0 h-screen> + tự cuộn riêng (fix lỗi cuộn mất).
 * - Mobile: sidebar dạng overlay trượt ra (state open), KHÔNG dùng daisyUI drawer để chủ động chiều cao.
 * - Logo trỏ về `home` (Dashboard của portal) — supplier khu biệt trong portal, không về Landing.
 *
 * Props: nav [{to,label,icon}], brandName, home (path dashboard).
 */
export default function PortalShell({ nav, brandName, brandInitials, home, title = 'Portal Nhà cung cấp' }) {
  const { logout } = useAuthStore();
  const [open, setOpen] = useState(false);

  const linkClass = ({ isActive }) =>
    `flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors ${
      isActive ? 'bg-primary text-primary-content shadow-sm' : 'text-base-content/75 hover:bg-base-200'
    }`;

  const SidebarContent = ({ onNavigate }) => (
    <div className="flex h-full flex-col p-4">
      <Link to={home} onClick={onNavigate} className="mb-6 flex flex-col px-2 leading-none">
        <span className="font-display text-2xl tracking-tight text-primary">WOODHUB</span>
        <span className="mt-1 text-[10px] tracking-[0.3em] text-base-content/45">FURNITURE &amp; CRAFT</span>
      </Link>
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
        {nav.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} onClick={onNavigate} className={linkClass}>
            <item.icon width={18} height={18} /> {item.label}
          </NavLink>
        ))}
      </nav>
      <button onClick={logout} className="mt-2 flex items-center gap-3 rounded-xl border-t border-base-200 px-3.5 py-3 text-sm text-base-content/70 transition-colors hover:bg-base-200">
        <LogOut width={18} height={18} /> Đăng xuất
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-base-200/40">
      {/* Sidebar desktop — FIXED (không cuộn theo trang dù ancestor nào). Nội dung chừa lề lg:pl-72. */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 border-r border-base-300 bg-base-100 lg:block">
        <SidebarContent />
      </aside>

      {/* Sidebar mobile — overlay */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 border-r border-base-300 bg-base-100 shadow-xl">
            <button onClick={() => setOpen(false)} aria-label="Đóng menu" className="btn btn-ghost btn-sm btn-circle absolute right-2 top-2 z-10"><X width={18} height={18} /></button>
            <SidebarContent onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      {/* Main column — chừa lề trái cho sidebar fixed trên desktop */}
      <div className="flex min-h-screen min-w-0 flex-col lg:pl-72">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b border-base-300 bg-base-100/90 px-4 backdrop-blur md:px-6">
          <div className="flex items-center gap-3">
            <button onClick={() => setOpen(true)} className="btn btn-ghost btn-sm btn-circle lg:hidden" aria-label="Mở menu">
              <MenuIcon className="h-5 w-5" />
            </button>
            <span className="font-display text-lg text-primary">{title}</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <PortalChatButton />
            <button type="button" aria-label="Thông báo" className="btn btn-ghost btn-sm btn-circle relative">
              <Bell width={18} height={18} />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-error" />
            </button>
            <div className="flex items-center gap-2 rounded-full border border-base-300 py-1 pl-3 pr-1.5">
              <span className="hidden text-sm font-medium sm:inline">{brandName}</span>
              <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-secondary to-primary text-xs font-display text-primary-content">{brandInitials}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-[1400px]">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Chat với khách hàng */}
      <PortalChatDrawer />
    </div>
  );
}
