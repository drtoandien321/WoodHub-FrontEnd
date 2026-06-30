/*
 * supplierStatus — bảng tra trạng thái cho Portal Nhà cung cấp (đơn hàng / sản phẩm / chi nhánh).
 * Trả { label, cls } để StatusBadge render đồng nhất. Dùng pastel (token/15) cho nhẹ nhàng,
 * KHÔNG chỉ dựa vào màu — luôn có label chữ (yêu cầu accessibility).
 */
const PASTEL = {
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  error: 'bg-error/15 text-error',
  info: 'bg-info/15 text-info',
  primary: 'bg-primary/15 text-primary',
  neutral: 'bg-base-300/60 text-base-content/60',
};

export const ORDER_STATUS = {
  processing: { label: 'Đang xử lý', cls: PASTEL.info },
  packing: { label: 'Đang đóng gói', cls: PASTEL.warning },
  shipping: { label: 'Đang giao hàng', cls: PASTEL.success },
  completed: { label: 'Hoàn thành', cls: PASTEL.success },
  cancelled: { label: 'Đã hủy', cls: PASTEL.error },
};
// Thứ tự stepper tiến độ đơn (custom/xưởng KHÔNG dùng ở đây)
export const ORDER_STEPS = [
  { key: 'processing', label: 'Đang xử lý' },
  { key: 'packing', label: 'Đang đóng gói' },
  { key: 'shipping', label: 'Đang giao hàng' },
  { key: 'completed', label: 'Hoàn tất' },
];

export const PRODUCT_STATUS = {
  active: { label: 'Đang bán', cls: PASTEL.success },
  low: { label: 'Sắp hết hàng', cls: PASTEL.warning },
  out: { label: 'Hết hàng', cls: PASTEL.error },
  hidden: { label: 'Đang ẩn', cls: PASTEL.neutral },
};

export const BRANCH_STATUS = {
  active: { label: 'Hoạt động', cls: PASTEL.success },
  paused: { label: 'Tạm ngưng', cls: PASTEL.warning },
};

// ===== XƯỞNG MỘC (custom) =====
export const WORKSHOP_ORDER_STATUS = {
  quote_pending: { label: 'Chờ báo giá', cls: PASTEL.warning },
  quoted: { label: 'Đã báo giá', cls: PASTEL.info },
  producing: { label: 'Đang sản xuất', cls: PASTEL.primary },
  completed: { label: 'Hoàn thành', cls: PASTEL.success },
  cancelled: { label: 'Đã hủy', cls: PASTEL.error },
};
// Quy trình sản xuất custom 5 bước (chỉ dùng cho xưởng mộc, KHÔNG dùng ở portal nhà cung cấp)
export const WORKSHOP_STEPS = [
  { key: 'received', label: 'Tiếp nhận' },
  { key: 'designing', label: 'Thiết kế' },
  { key: 'producing', label: 'Sản xuất' },
  { key: 'finishing', label: 'Hoàn thiện' },
  { key: 'delivering', label: 'Giao hàng' },
];

export const orderMeta = (s) => ORDER_STATUS[s] ?? { label: s, cls: PASTEL.neutral };
export const productMeta = (s) => PRODUCT_STATUS[s] ?? { label: s, cls: PASTEL.neutral };
export const branchMeta = (s) => BRANCH_STATUS[s] ?? { label: s, cls: PASTEL.neutral };
export const workshopOrderMeta = (s) => WORKSHOP_ORDER_STATUS[s] ?? { label: s, cls: PASTEL.neutral };
