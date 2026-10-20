import PortalShell from './PortalShell.jsx';
import { usePortalBrand } from '../../hooks/useSupplierMe.js';
import { useAuthStore } from '../../stores/authStore.js';
import { Home, Package, Tool, Briefcase, Star, BarChart, Gear } from '../suppliers/icons.jsx';

/*
 * WorkshopPortalLayout — Portal Xưởng mộc. Nghiệp vụ: nhận đơn CUSTOM → báo giá → sản xuất.
 * KHÔNG có catalog/chi nhánh (khác manufacturer).
 */
const NAV = [
  { to: '/portal/workshop/dashboard', label: 'Tổng quan', icon: Home },
  { to: '/portal/workshop/orders', label: 'Đơn custom & Báo giá', icon: Package },
  { to: '/portal/workshop/production', label: 'Tiến độ sản xuất', icon: Tool },
  { to: '/portal/workshop/portfolio', label: 'Hồ sơ & Năng lực', icon: Briefcase },
  { to: '/portal/workshop/reviews', label: 'Đánh giá', icon: Star },
  { to: '/portal/workshop/reports', label: 'Báo cáo', icon: BarChart },
  { to: '/portal/workshop/settings', label: 'Cài đặt', icon: Gear },
];

export default function WorkshopPortalLayout() {
  // Tên thật từ /suppliers/me (không còn lấy cứng từ file mock)
  const userName = useAuthStore((st) => st.user?.name);
  const brand = usePortalBrand(userName);
  return (
    <PortalShell
      nav={NAV}
      title="Portal Xưởng mộc"
      brandName={brand.name}
      brandInitials={brand.initials}
      home="/portal/workshop/dashboard"
    />
  );
}
