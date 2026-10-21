import i18n from '../i18n/index.js';
import { formatVnd } from './format.js';

/*
 * apiErrorMessage — chọn câu báo lỗi hiển thị cho người dùng từ lỗi axios.
 *
 * Vấn đề (QA 20/10): BE chỉ trả `message` tiếng Việt (vd "Không tìm thấy mã khuyến mãi") → khách để giao diện
 * English vẫn thấy tiếng Việt. Thứ tự ưu tiên:
 *   1) `errorCode` ổn định từ BE (BE-13 — mọi lỗi đều có) → dịch qua key i18n `apiErrors.<CODE>` (kèm `params`), nếu FE có bản dịch.
 *   2) Giao diện đang tiếng Việt → dùng nguyên `message` của BE (cụ thể nhất, vd nêu đúng mã coupon nào sai).
 *   3) Còn lại → `fallback` (câu đã dịch theo ngữ cảnh do nơi gọi truyền vào).
 * Lỗi validate của Spring ({ errors: { field: msg } }) được coi như `message` (lấy lỗi đầu tiên).
 */
/*
 * Dịch 1 mã lỗi BE (errorCode / reasonCode) kèm params (BE-13). Tham số tên kết thúc bằng "Amount" là tiền → định
 * dạng VND trước khi chèn vào câu (vd COUPON_MIN_ORDER_NOT_MET { minOrderAmount, missingAmount }).
 * Trả null nếu chưa có bản dịch cho mã đó.
 */
export function translateErrorCode(code, params = {}) {
  if (!code || !i18n.exists(`apiErrors.${code}`)) return null;
  const formatted = Object.fromEntries(
    Object.entries(params ?? {}).map(([k, v]) => [k, /Amount$/.test(k) && typeof v === 'number' ? formatVnd(v) : v])
  );
  return i18n.t(`apiErrors.${code}`, formatted);
}

export function apiErrorMessage(err, fallback) {
  const data = err?.response?.data;
  const translated = translateErrorCode(data?.errorCode, data?.params);
  if (translated) return translated;

  const beMessage = data?.message || (data?.errors && Object.values(data.errors)[0]);
  if (beMessage && (i18n.resolvedLanguage ?? i18n.language ?? '').startsWith('vi')) return beMessage;
  return fallback;
}
