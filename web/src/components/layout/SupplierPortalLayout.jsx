import PortalShell from './PortalShell.jsx';
import { MANUFACTURER } from '../../api/mock/manufacturerData.js';
import { Home, Store, Package, ShoppingBag, BarChart, Gear, Star, Briefcase } from '../suppliers/icons.jsx';

/*
 * SupplierPortalLayout — Portal Nhà cung cấp (manufacturer). Chỉ bán hàng sẵn + nhiều chi nhánh.
 * KHÔNG có mục custom/xưởng.
 */
const NAV = [
  { to: '/portal/supplier/dashboard', label: 'Tổng quan', icon: Home },
  { to: '/portal/supplier/branches', label: 'Chi nhánh', icon: Store },
  { to: '/portal/supplier/products', label: 'Sản phẩm', icon: Package },
  { to: '/portal/supplier/orders', label: 'Đơn hàng', icon: ShoppingBag },
  { to: '/portal/supplier/reviews', label: 'Đánh giá', icon: Star },
  { to: '/portal/supplier/profile', label: 'Hồ sơ & Năng lực', icon: Briefcase },
  { to: '/portal/supplier/reports', label: 'Báo cáo', icon: BarChart },
  { to: '/portal/supplier/settings', label: 'Cài đặt', icon: Gear },
];

export default function SupplierPortalLayout() {
  return (
    <PortalShell
      nav={NAV}
      brandName={MANUFACTURER.name}
      brandInitials={MANUFACTURER.initials}
      home="/portal/supplier/dashboard"
    />
  );
}
