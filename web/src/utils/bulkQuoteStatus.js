import i18n from '../i18n/index.js';

/*
 * Trạng thái yêu cầu báo giá số lượng lớn (BE-08 §1):
 * pending (chờ NCC báo giá, hạn 7 ngày) → offered → accepted (đã thành đơn) | rejected (khách từ chối báo giá) |
 * declined (NCC từ chối) | cancelled (khách huỷ) | expired (quá 7 ngày chưa báo giá).
 * Nhãn lấy từ i18n bulkQuote.status.* (portal NCC dùng cùng bảng — tiếng Việt khi giao diện VI).
 */
const CLS = {
  pending: 'bg-warning/15 text-warning',
  offered: 'bg-info/15 text-info',
  accepted: 'bg-success/15 text-success',
  rejected: 'bg-error/15 text-error',
  declined: 'bg-error/15 text-error',
  cancelled: 'bg-base-300/60 text-base-content/60',
  expired: 'bg-base-300/60 text-base-content/60',
};

export const BULK_QUOTE_TABS = ['', 'pending', 'offered', 'accepted', 'rejected', 'declined', 'cancelled', 'expired'];

export const bulkQuoteMeta = (status) => ({
  label: i18n.t(`bulkQuote.status.${status}`, { defaultValue: status }),
  cls: CLS[status] ?? CLS.cancelled,
});

// % tiết kiệm so với giá niêm yết hiện tại (listPrice null = biến thể đã xoá → không so được)
export const savingPercent = (listPrice, unitPrice) =>
  listPrice > 0 && unitPrice != null ? Math.round(((listPrice - unitPrice) / listPrice) * 100) : null;
