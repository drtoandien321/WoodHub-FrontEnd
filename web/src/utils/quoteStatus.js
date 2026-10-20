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

export const CUSTOM_ORDER_STATUS = {
  pending: { label: 'Chờ xưởng xác nhận', cls: PASTEL.warning },
  confirmed: { label: 'Đã xác nhận', cls: PASTEL.info },
  in_production: { label: 'Đang sản xuất', cls: PASTEL.primary },
  completed: { label: 'Hoàn thành', cls: PASTEL.success },
  cancelled: { label: 'Đã hủy', cls: PASTEL.error },
};

const metaOf = (table, i18nPrefix) => (s) => {
  const base = table[s] ?? { label: s, cls: PASTEL.neutral };
  return { ...base, label: i18n.t(`${i18nPrefix}.${s}`, { defaultValue: base.label }) };
};
export const quoteMeta = metaOf(QUOTE_STATUS, 'quote.status');
export const offerMeta = metaOf(OFFER_STATUS, 'quote.offerStatus');
export const customOrderMeta = metaOf(CUSTOM_ORDER_STATUS, 'order.status');

// Bước kế tiếp hợp lệ cho workshop/admin (theo be-8-state-machine.md mục 3) — dùng dựng nút hành động
export const NEXT_ORDER_STATUS = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['in_production', 'cancelled'],
  in_production: ['completed', 'cancelled'],
};
