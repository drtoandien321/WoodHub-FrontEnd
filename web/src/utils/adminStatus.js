/*
 * adminStatus — bảng tra trạng thái cho Portal Quản trị (supplier). Cùng quy ước với
 * utils/supplierStatus.js (label + cls pastel cho StatusBadge) nhưng tách riêng vì khác domain
 * (đây là SupplierStatus thật của BE: pending|active|suspended — không phải trạng thái sản phẩm).
 */
const PASTEL = {
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  error: 'bg-error/15 text-error',
  neutral: 'bg-base-300/60 text-base-content/60',
};

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
