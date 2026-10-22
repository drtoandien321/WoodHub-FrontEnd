import { PASTEL } from './pastel.js';
/*
 * adminStatus — bảng tra trạng thái cho Portal Quản trị (supplier). Cùng quy ước với
 * utils/supplierStatus.js (label + cls pastel cho StatusBadge) nhưng tách riêng vì khác domain
 * (đây là SupplierStatus thật của BE: pending|active|suspended — không phải trạng thái sản phẩm).
 */

export const SUPPLIER_ADMIN_STATUS = {
  pending: { label: 'Chờ duyệt', cls: PASTEL.warning },
  active: { label: 'Đang hoạt động', cls: PASTEL.success },
  suspended: { label: 'Đã khoá', cls: PASTEL.error },
};

export const SUPPLIER_TYPE_LABEL = {
  retailer: 'Nhà cung cấp (retailer)',
  workshop: 'Xưởng mộc (workshop)',
};

export const supplierAdminMeta = (s) => SUPPLIER_ADMIN_STATUS[s] ?? { label: s, cls: PASTEL.neutral };

// Nhãn vai trò + loại khách hàng — dùng chung các trang admin (Người dùng, Chi tiết, Tổng quan)
export const ROLE_LABEL = { customer: 'Khách hàng', supplier: 'Nhà cung cấp', admin: 'Quản trị viên' };
export const CUSTOMER_TYPE_LABEL = { individual: 'Cá nhân', business: 'Doanh nghiệp' };
