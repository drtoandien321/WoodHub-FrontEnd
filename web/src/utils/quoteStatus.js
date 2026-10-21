/*
 * quoteStatus — bảng tra trạng thái cho Quote/Offer/CustomOrder (BE-8, FE-6).
 * Khác WORKSHOP_ORDER_STATUS/WORKSHOP_STEPS ở supplierStatus.js — đó là mô hình 5 bước
 * TỰ NGHĨ (ephemeral, không khớp BE thật); đây là ĐÚNG enum thật BE trả (xem
 * backend/docs/be-8-state-machine.md), dùng cho toàn bộ luồng Quote & Order thật.
 *
 * `label` trong các bảng dưới chỉ là fallback tiếng Việt; *Meta() lấy nhãn từ i18n (quote.status.*,
 * quote.offerStatus.*, order.status.*) tại thời điểm gọi → đổi ngôn ngữ là badge đổi theo (lỗi QA 20/10:
 * UI English nhưng badge vẫn "Đã chốt", "Chờ phản hồi").
 */
import i18n from '../i18n/index.js';

const PASTEL = {
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  error: 'bg-error/15 text-error',
  info: 'bg-info/15 text-info',
  primary: 'bg-primary/15 text-primary',
  neutral: 'bg-base-300/60 text-base-content/60',
};

export const QUOTE_STATUS = {
  pending: { label: 'Chờ phản hồi', cls: PASTEL.warning },
  negotiating: { label: 'Đang thương lượng', cls: PASTEL.info },
  accepted: { label: 'Đã chốt', cls: PASTEL.success },
  rejected: { label: 'Đã từ chối', cls: PASTEL.error },
  expired: { label: 'Đã hết hạn', cls: PASTEL.neutral },
  cancelled: { label: 'Đã hủy', cls: PASTEL.neutral },
};

export const OFFER_STATUS = {
  pending: { label: 'Chờ phản hồi', cls: PASTEL.warning },
  accepted: { label: 'Đã chấp nhận', cls: PASTEL.success },
  rejected: { label: 'Đã từ chối', cls: PASTEL.error },
  superseded: { label: 'Đã bị thay thế', cls: PASTEL.neutral },
};

/*
 * Trạng thái đơn custom theo BE-01 (docs BE custom-order-payment-fe.md): đặt cọc 30% → sản xuất → hoàn thiện →
 * khách trả phần còn lại + ship → giao → khách xác nhận. deposit_paid / paid do HỆ THỐNG tự chuyển khi nhận tiền.
 * pending / confirmed chỉ còn ở dữ liệu cũ (BE đã chuyển sang awaiting_deposit) — giữ nhãn để lịch sử vẫn đọc được.
 */
export const CUSTOM_ORDER_STATUS = {
  awaiting_deposit: { label: 'Chờ đặt cọc', cls: PASTEL.warning },
  deposit_paid: { label: 'Đã đặt cọc', cls: PASTEL.info },
  in_production: { label: 'Đang sản xuất', cls: PASTEL.primary },
  awaiting_final_payment: { label: 'Chờ thanh toán phần còn lại', cls: PASTEL.warning },
  paid: { label: 'Đã thanh toán đủ', cls: PASTEL.info },
  shipping: { label: 'Đang giao', cls: PASTEL.primary },
  delivered: { label: 'Đã giao', cls: PASTEL.success },
  completed: { label: 'Hoàn thành', cls: PASTEL.success },
  cancelled: { label: 'Đã hủy', cls: PASTEL.error },
  pending: { label: 'Chờ xưởng xác nhận', cls: PASTEL.warning },
  confirmed: { label: 'Đã xác nhận', cls: PASTEL.info },
};
// Thứ tự tab lọc ở trang danh sách đơn custom (khách + xưởng)
export const CUSTOM_ORDER_TABS = ['', 'awaiting_deposit', 'deposit_paid', 'in_production', 'awaiting_final_payment', 'paid', 'shipping', 'delivered', 'completed', 'cancelled'];

const metaOf = (table, i18nPrefix) => (s) => {
  const base = table[s] ?? { label: s, cls: PASTEL.neutral };
  return { ...base, label: i18n.t(`${i18nPrefix}.${s}`, { defaultValue: base.label }) };
};
export const quoteMeta = metaOf(QUOTE_STATUS, 'quote.status');
export const offerMeta = metaOf(OFFER_STATUS, 'quote.offerStatus');
export const customOrderMeta = metaOf(CUSTOM_ORDER_STATUS, 'order.status');

/*
 * Bước kế tiếp hợp lệ THEO VAI (bảng §2 custom-order-payment-fe.md) — dùng dựng nút hành động.
 * Không có nút sang deposit_paid / paid: 2 trạng thái đó chỉ hệ thống chuyển khi nhận tiền (PATCH → 409).
 * Xưởng huỷ khi khách đã trả tiền (deposit_paid trở đi) → phải hoàn tiền thủ công, UI cảnh báo trước khi huỷ.
 */
export const NEXT_ORDER_STATUS = {
  workshop: {
    awaiting_deposit: ['cancelled'],
    deposit_paid: ['in_production', 'cancelled'],
    in_production: ['awaiting_final_payment', 'cancelled'],
    awaiting_final_payment: ['cancelled'],
    paid: ['shipping'],
    shipping: ['delivered'],
  },
  customer: {
    awaiting_deposit: ['cancelled'],
    delivered: ['completed'],
  },
};
// Bước mà KHÁCH phải trả tiền (POST /custom-orders/{id}/payment)
export const CUSTOMER_PAY_STATUSES = new Set(['awaiting_deposit', 'awaiting_final_payment']);
// Khách được chọn / đổi địa chỉ giao (PUT /custom-orders/{id}/address) — từ paid trở đi BE trả 409
export const ADDRESS_EDITABLE_STATUSES = new Set(['awaiting_deposit', 'deposit_paid', 'in_production', 'awaiting_final_payment']);
