import i18n from '../i18n/index.js';
import { formatVnd } from './format.js';

/*
 * notificationLink — bấm 1 thông báo thì đi đâu (docs BE notifications-fe.md §1.6, map sang route THẬT của FE).
 *  - order:        NCC → /portal/supplier/orders (portal chưa có trang chi tiết đơn) · khách → /orders/:id
 *  - custom_order: /custom-orders/:id (trang chi tiết dùng chung khách + xưởng)
 *  - quote:        /quotes/:id (dùng chung)
 *  - review:       NCC/xưởng → trang Đánh giá của portal · khách → trang SP / NCC được đánh giá
 */
export function notificationLink(n, user) {
  const portal = user?.role === 'supplier' ? (user.supplierType === 'workshop' ? '/portal/workshop' : '/portal/supplier') : null;
  switch (n?.targetType) {
    case 'order':
      return portal ? `${portal}/orders` : `/orders/${n.targetId}`;
    case 'custom_order':
      return `/custom-orders/${n.targetId}`;
    case 'quote':
      return `/quotes/${n.targetId}`;
    case 'review':
      if (portal) return `${portal}/reviews`;
      return n.params?.reviewTargetType === 'product' ? `/product/${n.params.reviewTargetId}` : `/suppliers/${n.params?.reviewTargetId}`;
    default:
      return portal ?? '/';
  }
}

/*
 * Câu hiển thị: dịch theo type + params (tiền / trạng thái đã format); chưa có bản dịch → `title` tiếng Việt của BE.
 * Giao diện VI cũng dùng bản dịch FE để thống nhất giọng văn; params thiếu thì i18next để trống chỗ đó.
 */
export function notificationText(n) {
  const p = { ...(n.params ?? {}) };
  for (const k of ['totalAmount', 'amount', 'price']) if (typeof p[k] === 'number') p[k] = formatVnd(p[k]);
  if (p.status) p.status = i18n.t(`orders.status.${p.status}`, { defaultValue: i18n.t(`order.status.${p.status}`, { defaultValue: p.status }) });
  if (p.paymentType) p.paymentType = i18n.t(`notifications.paymentType.${p.paymentType}`, { defaultValue: p.paymentType });
  const key = `notifications.types.${n.type}`;
  return i18n.exists(key) ? i18n.t(key, p) : n.title;
}
