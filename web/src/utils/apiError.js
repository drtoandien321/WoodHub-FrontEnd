import i18n from '../i18n/index.js';

/*
 * apiErrorMessage — chọn câu báo lỗi hiển thị cho người dùng từ lỗi axios.
 *
 * Vấn đề (QA 20/10): BE chỉ trả `message` tiếng Việt (vd "Không tìm thấy mã khuyến mãi") → khách để giao diện
 * English vẫn thấy tiếng Việt. Thứ tự ưu tiên:
 *   1) `errorCode` ổn định từ BE (đề xuất BE-13, chưa có) → dịch qua key i18n `apiErrors.<CODE>`.
 *   2) Giao diện đang tiếng Việt → dùng nguyên `message` của BE (cụ thể nhất, vd nêu đúng mã coupon nào sai).
 *   3) Còn lại → `fallback` (câu đã dịch theo ngữ cảnh do nơi gọi truyền vào).
 * Lỗi validate của Spring ({ errors: { field: msg } }) được coi như `message` (lấy lỗi đầu tiên).
 */
export function apiErrorMessage(err, fallback) {
  const data = err?.response?.data;
  const code = data?.errorCode;
  if (code && i18n.exists(`apiErrors.${code}`)) return i18n.t(`apiErrors.${code}`);

  const beMessage = data?.message || (data?.errors && Object.values(data.errors)[0]);
  if (beMessage && (i18n.resolvedLanguage ?? i18n.language ?? '').startsWith('vi')) return beMessage;
  return fallback;
}
