import PortalShell from './PortalShell.jsx';
import { Users, Briefcase, Layers, Tree, CreditCard, Wallet, BarChart, ShoppingBag, Tag, Truck, Bolt } from '../suppliers/icons.jsx';

/*
 * AdminPortalLayout — Portal Quản trị viên. Tái dùng nguyên PortalShell (giống
 * SupplierPortalLayout/WorkshopPortalLayout) — chỉ đổi nav/brand, không có chat với khách hàng
 * (showChat={false}, xem ghi chú trong PortalShell.jsx).
 */
const NAV = [
  { to: '/admin/dashboard', label: 'Tổng quan', icon: BarChart },
  { to: '/admin/users', label: 'Người dùng', icon: Users },
  { to: '/admin/suppliers', label: 'Nhà cung cấp', icon: Briefcase },
  { to: '/admin/categories', label: 'Danh mục', icon: Layers },
  { to: '/admin/materials', label: 'Vật liệu', icon: Tree },
  { to: '/admin/subscription-plans', label: 'Gói đăng ký', icon: CreditCard },
  { to: '/admin/credit-packs', label: 'Gói lượt thiết kế', icon: Bolt },
  { to: '/admin/orders', label: 'Đơn hàng', icon: ShoppingBag },
  { to: '/admin/promotions', label: 'Khuyến mãi', icon: Tag },
  { to: '/admin/shipping-config', label: 'Phí vận chuyển', icon: Truck },
  { to: '/admin/payments', label: 'Thanh toán', icon: Wallet },
];

export default function AdminPortalLayout() {
  return (
    <PortalShell
      nav={NAV}
      brandName="Quản trị viên"
      brandInitials="AD"
      home="/admin/dashboard"
      title="Portal Quản trị"
      showChat={false}
    />
  );
}
