/*
 * orderStatus — luật chuyển trạng thái ĐƠN HÀNG B2C cho portal supplier/admin.
 * Bản sao của bảng trong woodhub-be/docs/promotions-admin-fe.md (BE vẫn là nơi kiểm tra thật, sai → 409).
 * FE giữ 1 bản để CHỈ hiện những nút được phép bấm — người dùng không phải thử rồi mới biết bị chặn.
 * Nếu BE đổi luật, sửa ở đây (1 chỗ duy nhất).
 *
 * pending_payment → paid KHÔNG có ở đây: do webhook SePay tự chuyển, không cập nhật tay.
 */
export const ORDER_TRANSITIONS = {
  pending_payment: ['cancelled'],
  paid: ['confirmed', 'cancelled', 'refunded'],
  confirmed: ['processing', 'cancelled', 'refunded'],
  processing: ['shipping', 'cancelled', 'refunded'],
  shipping: ['delivered', 'refunded'],
  delivered: ['completed', 'refunded'],
  completed: ['refunded'],
  cancelled: [],
  refunded: [],
};

// Nhãn trạng thái (portal dùng tiếng Việt cố định, giống các trang portal khác)
export const ORDER_STATUS_LABEL = {
  pending_payment: 'Chờ thanh toán',
  paid: 'Đã thanh toán',
  confirmed: 'Đã xác nhận',
  processing: 'Đang chuẩn bị',
  shipping: 'Đang giao',
  delivered: 'Đã giao',
  completed: 'Hoàn tất',
  cancelled: 'Đã hủy',
  refunded: 'Đã hoàn tiền',
};

// Màu badge pastel theo trạng thái (class TĨNH để Tailwind không purge) — dùng chung trang đơn + dashboard
export const ORDER_STATUS_BADGE = {
  pending_payment: 'bg-warning/15 text-warning', paid: 'bg-info/15 text-info', confirmed: 'bg-info/15 text-info',
  processing: 'bg-primary/15 text-primary', shipping: 'bg-primary/15 text-primary', delivered: 'bg-success/15 text-success',
  completed: 'bg-success/15 text-success', cancelled: 'bg-base-300/60 text-base-content/70', refunded: 'bg-error/15 text-error',
};

// Nhãn NÚT hành động theo trạng thái đích (động từ, để người bấm hiểu việc mình sắp làm)
export const ORDER_ACTION_LABEL = {
  confirmed: 'Xác nhận đơn',
  processing: 'Bắt đầu chuẩn bị',
  shipping: 'Giao cho vận chuyển',
  delivered: 'Đã giao tới khách',
  completed: 'Hoàn tất đơn',
  cancelled: 'Hủy đơn',
  refunded: 'Hoàn tiền',
};

// Trạng thái "đi tiếp" theo luồng chính = nút chính; hủy/hoàn tiền = nút phụ (màu cảnh báo)
const NEGATIVE = new Set(['cancelled', 'refunded']);
export const nextActions = (status) => {
  const all = ORDER_TRANSITIONS[status] ?? [];
  return { forward: all.filter((s) => !NEGATIVE.has(s)), negative: all.filter((s) => NEGATIVE.has(s)) };
};
