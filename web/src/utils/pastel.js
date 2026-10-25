/*
 * Màu badge pastel dùng chung cho mọi bảng trạng thái (đơn, báo giá, sản phẩm, NCC…). Class TĨNH để Tailwind
 * không purge. Trước đây 3 file utils/*Status.js mỗi file tự khai báo 1 bản giống hệt.
 */
export const PASTEL = {
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  error: 'bg-error/15 text-error',
  info: 'bg-info/15 text-info',
  primary: 'bg-primary/15 text-primary',
  neutral: 'bg-base-300/60 text-base-content/70',
};
