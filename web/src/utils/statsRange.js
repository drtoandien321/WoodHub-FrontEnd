/*
 * statsRange — đổi lựa chọn kỳ báo cáo ("30 ngày qua", "Tháng này"...) thành { from, to, granularity } cho API BE-09.
 *
 * BE nhận ISO CÓ MÚI GIỜ và tính kỳ [from, to) (gồm from, không gồm to), ngày gom theo giờ Việt Nam. Nên mốc
 * luôn là 00:00 giờ VN (`...T00:00:00+07:00`), tính theo NGÀY VN chứ không theo múi giờ máy người dùng.
 * `to` = 00:00 ngày mai → kỳ gồm trọn hôm nay.
 * (axios tự URL-encode dấu "+" trong params, không cần làm tay.)
 */
export const RANGE_OPTIONS = [
  ['7d', '7 ngày qua'], ['30d', '30 ngày qua'], ['thisMonth', 'Tháng này'],
  ['lastMonth', 'Tháng trước'], ['90d', '90 ngày qua'], ['365d', '12 tháng qua'],
];

const DAY = 86_400_000;

// Ngày hôm nay theo giờ VN dưới dạng mốc UTC 00:00 (chỉ dùng phần năm-tháng-ngày để cộng trừ ngày cho dễ)
const todayVn = (now) => {
  const [y, m, d] = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(now).split('-').map(Number);
  return Date.UTC(y, m - 1, d);
};
const toVnIso = (utcMidnight) => `${new Date(utcMidnight).toISOString().slice(0, 10)}T00:00:00+07:00`;

export function statsRange(key, now = new Date()) {
  const today = todayVn(now);
  const tomorrow = today + DAY;
  const t = new Date(today);
  let from = tomorrow - 30 * DAY;
  let to = tomorrow;
  if (key === '7d') from = tomorrow - 7 * DAY;
  else if (key === '90d') from = tomorrow - 90 * DAY;
  else if (key === '365d') from = tomorrow - 365 * DAY;
  else if (key === 'thisMonth') from = Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 1);
  else if (key === 'lastMonth') {
    from = Date.UTC(t.getUTCFullYear(), t.getUTCMonth() - 1, 1);
    to = Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), 1);
  }
  // Gợi ý của BE: ≤ 31 ngày theo ngày, ≤ 6 tháng theo tuần, còn lại theo tháng
  const days = (to - from) / DAY;
  const granularity = days <= 31 ? 'day' : days <= 183 ? 'week' : 'month';
  return { from: toVnIso(from), to: toVnIso(to), granularity };
}
