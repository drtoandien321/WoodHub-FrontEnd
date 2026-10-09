/*
 * quoteSummary — LOGIC HIỂN THỊ giá + thời gian dự kiến trên card "Yêu cầu báo giá của tôi" (hàm thuần, không phụ
 * thuộc React/i18n để test được). Dữ liệu lấy từ các field tổng hợp BE trả ở GET /quotes/my (xem QuoteRequestResponse).
 * LƯU Ý: giá BE trả là ĐƠN GIÁ / sản phẩm; tổng = đơn giá × số lượng.
 *
 * kind:
 *  - 'empty'  : chưa có báo giá → "Chưa có báo giá" (mờ)
 *  - 'offer'  : đang thương lượng → giá đề xuất gần nhất + bên đề xuất + số vòng (+ "~X ngày")
 *  - 'final'  : đã chốt → giá chốt nổi bật (+ "~X ngày · dự kiến dd/MM/yyyy")
 *  - 'dim'    : đã từ chối / hết hạn / đã hủy → giá cuối cùng, mờ + gạch ngang, ẩn thời gian
 */
const toNumber = (v) => (v === null || v === undefined || v === '' || Number.isNaN(Number(v)) ? null : Number(v));
const positiveInt = (v) => {
  const n = toNumber(v);
  return n !== null && n > 0 ? Math.round(n) : null;
};

export function quoteCardModel(q) {
  const quantity = positiveInt(q?.quantity) ?? 1;
  const latestPrice = toNumber(q?.latestOfferPrice);
  const total = (unit) => (unit !== null && quantity > 1 ? unit * quantity : null);
  const rounds = positiveInt(q?.negotiationRounds) ?? 0;

  switch (q?.status) {
    case 'negotiating':
      if (latestPrice === null) return { kind: 'empty' };
      return {
        kind: 'offer', price: latestPrice, total: total(latestPrice), quantity,
        by: q.latestOfferBy === 'customer' ? 'customer' : 'workshop', // nhãn tuỳ góc nhìn: xem component
        rounds, days: positiveInt(q.estimatedDays),
      };
    case 'accepted': {
      const final = toNumber(q.finalPrice) ?? latestPrice;
      if (final === null) return { kind: 'empty' };
      return {
        kind: 'final', price: final, total: toNumber(q.finalTotal) ?? total(final), quantity,
        days: positiveInt(q.estimatedDays), date: typeof q.estimatedCompletionDate === 'string' ? q.estimatedCompletionDate : null,
      };
    }
    case 'rejected':
    case 'expired':
    case 'cancelled':
      if (latestPrice === null) return { kind: 'empty' };
      return { kind: 'dim', price: latestPrice, total: total(latestPrice), quantity };
    case 'pending':
    default:
      return { kind: 'empty' };
  }
}

/** 'YYYY-MM-DD' → dd/MM/yyyy (vi) hoặc dd/MM/yyyy (en-GB). Dùng giờ địa phương để không lệch ngày do UTC. */
export function formatDay(isoDate, lang = 'vi') {
  if (typeof isoDate !== 'string' || !/^\d{4}-\d{2}-\d{2}/.test(isoDate)) return '';
  const [y, m, d] = isoDate.slice(0, 10).split('-').map(Number);
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    .format(new Date(y, m - 1, d));
}
