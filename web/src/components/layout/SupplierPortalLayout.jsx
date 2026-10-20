import PortalShell from './PortalShell.jsx';
import { usePortalBrand } from '../../hooks/useSupplierMe.js';
import { useAuthStore } from '../../stores/authStore.js';
import { Home, Store, Package, ShoppingBag, BarChart, Gear, Star, Briefcase, Tag } from '../suppliers/icons.jsx';

/*
 * SupplierPortalLayout — Portal Nhà cung cấp (manufacturer). Chỉ bán hàng sẵn + nhiều chi nhánh.
 * KHÔNG có mục custom/xưởng.
 */
const NAV = [
  { to: '/portal/supplier/dashboard', label: 'Tổng quan', icon: Home },
  { to: '/portal/supplier/branches', label: 'Chi nhánh', icon: Store },
  { to: '/portal/supplier/products', label: 'Sản phẩm', icon: Package },
  { to: '/portal/supplier/orders', label: 'Đơn hàng', icon: ShoppingBag },
  { to: '/portal/supplier/promotions', label: 'Khuyến mãi', icon: Tag },
  { to: '/portal/supplier/reviews', label: 'Đánh giá', icon: Star },
  { to: '/portal/supplier/profile', label: 'Hồ sơ & Năng lực', icon: Briefcase },
  { to: '/portal/supplier/reports', label: 'Báo cáo', icon: BarChart },
  { to: '/portal/supplier/settings', label: 'Cài đặt', icon: Gear },
];

export default function SupplierPortalLayout() {
  // Tên thật từ /suppliers/me (không còn lấy cứng từ file mock)
  const userName = useAuthStore((st) => st.user?.name);
  const brand = usePortalBrand(userName);
  return (
    <PortalShell
      nav={NAV}
      brandName={brand.name}
      brandInitials={brand.initials}
      home="/portal/supplier/dashboard"
    />
  );
}
