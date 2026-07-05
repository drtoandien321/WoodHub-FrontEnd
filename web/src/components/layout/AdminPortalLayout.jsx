import PortalShell from './PortalShell.jsx';
import { Users, Briefcase, Layers, Tree } from '../suppliers/icons.jsx';

/*
 * AdminPortalLayout — Portal Quản trị viên. Tái dùng nguyên PortalShell (giống
 * SupplierPortalLayout/WorkshopPortalLayout) — chỉ đổi nav/brand, không có chat với khách hàng
 * (showChat={false}, xem ghi chú trong PortalShell.jsx).
 */
const NAV = [
  { to: '/admin/users', label: 'Người dùng', icon: Users },
  { to: '/admin/suppliers', label: 'Nhà cung cấp', icon: Briefcase },
  { to: '/admin/categories', label: 'Danh mục', icon: Layers },
  { to: '/admin/materials', label: 'Vật liệu', icon: Tree },
];

export default function AdminPortalLayout() {
  return (
    <PortalShell
      nav={NAV}
      brandName="Quản trị viên"
      brandInitials="AD"
      home="/admin/users"
      title="Portal Quản trị"
      showChat={false}
    />
  );
}
