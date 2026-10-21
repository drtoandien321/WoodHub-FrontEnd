import { useEffect, useState } from 'react';

/*
 * orderDeadline — hạn NCC xác nhận đơn (24h) và hạn hoàn tiền (48h) theo docs BE no-inventory-order-confirm-fe.md.
 *
 * Sàn không quản lý tồn kho: khách thanh toán xong (status 'paid') NCC phải xác nhận còn hàng trước `confirmDeadline`,
 * hết hàng thì huỷ → admin chuyển khoản hoàn tiền trước `refundDeadline` rồi ghi nhận (`refund`).
 * Hàm thuần (nhận `now`) để dùng chung trang khách + portal NCC/admin và dễ kiểm tra.
 */
const HOUR = 3_600_000;
export const CONFIRM_SOON_MS = 6 * HOUR; // còn ≤ 6 giờ → tô vàng (gợi ý của BE)

// → null (không ở bước chờ xác nhận) | { deadline: Date, remainingMs, level: 'ok' | 'soon' | 'overdue' }
export function confirmInfo(order, now = Date.now()) {
  if (order?.status !== 'paid' || !order.confirmDeadline) return null;
  const deadline = new Date(order.confirmDeadline);
  const remainingMs = deadline.getTime() - now;
  const level = order.confirmOverdue || remainingMs <= 0 ? 'overdue' : remainingMs <= CONFIRM_SOON_MS ? 'soon' : 'ok';
  return { deadline, remainingMs, level };
}

/*
 * → null (không cần hoàn: chưa huỷ, hoặc huỷ khi chưa trả tiền) | { done: false, deadline?, overdue } | { done: true, refund }
 * `paidAt` vẫn giữ sau khi huỷ → phân biệt đơn đã trả tiền (cần hoàn) với đơn huỷ lúc chưa thanh toán.
 */
export function refundInfo(order, now = Date.now()) {
  if (!['cancelled', 'refunded'].includes(order?.status) || !order.paidAt) return null;
  if (order.refund) return { done: true, refund: order.refund };
  const deadline = order.refundDeadline ? new Date(order.refundDeadline) : null;
  return { done: false, deadline, overdue: !!order.refundOverdue || (deadline ? deadline.getTime() < now : false) };
}

// "5 giờ 20 phút" / "3 phút" — dùng cho đếm ngược ở portal (chỉ tiếng Việt như các trang portal khác)
export function formatRemaining(ms) {
  const totalMin = Math.max(0, Math.round(Math.abs(ms) / 60_000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h ? `${h} giờ ${m} phút` : `${m} phút`;
}

// Đồng hồ cập nhật mỗi phút để đếm ngược tự chạy mà không phải tải lại trang
export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
