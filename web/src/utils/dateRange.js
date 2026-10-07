/*
 * Chuyển ngày chọn từ <input type="date"> ('YYYY-MM-DD') sang ISO-8601 UTC (hậu tố 'Z') để gửi BE.
 * Tại sao 'Z' mà không phải '+07:00': dấu '+' trong query string bị hiểu là dấu cách → BE trả 400.
 * Ngày được hiểu theo GIỜ LOCAL của trình duyệt (VN = +07:00), rồi mới đổi sang UTC:
 *   '2026-10-01' (đầu ngày) → 2026-09-30T17:00:00.000Z ; (cuối ngày) → 2026-10-01T16:59:59.999Z
 */
const parseLocal = (ymd) => {
  const [y, m, d] = ymd.split('-').map(Number);
  return { y, m: m - 1, d };
};

export const startOfDayIso = (ymd) => {
  if (!ymd) return undefined;
  const { y, m, d } = parseLocal(ymd);
  return new Date(y, m, d, 0, 0, 0, 0).toISOString();
};

export const endOfDayIso = (ymd) => {
  if (!ymd) return undefined;
  const { y, m, d } = parseLocal(ymd);
  return new Date(y, m, d, 23, 59, 59, 999).toISOString();
};

// 'YYYY-MM-DD' theo giờ local (không dùng toISOString vì sẽ lệch ngày do UTC)
export const toYmd = (date) => {
  const p = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}`;
};
