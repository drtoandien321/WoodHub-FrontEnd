import { test, expect } from '@playwright/test';
import { quoteCardModel, formatDay } from '../../src/utils/quoteSummary.js';
import { formatVnd } from '../../src/utils/format.js';

// Unit test logic hiển thị card báo giá (hàm thuần — không cần BE/trình duyệt).
const base = { quantity: 2, negotiationRounds: 0 };

test.describe('quoteCardModel', () => {
  test('pending, chưa có offer → empty', () => {
    expect(quoteCardModel({ ...base, status: 'pending' }).kind).toBe('empty');
  });

  test('pending nhưng BE (cũ) không trả field giá → vẫn an toàn (empty)', () => {
    expect(quoteCardModel({ status: 'pending' }).kind).toBe('empty');
    expect(quoteCardModel(undefined).kind).toBe('empty');
    expect(quoteCardModel(null).kind).toBe('empty');
  });

  test('negotiating: giá mới nhất, bên đề xuất, số vòng, số ngày, tổng × số lượng', () => {
    const m = quoteCardModel({ ...base, status: 'negotiating', latestOfferPrice: '11000000', latestOfferBy: 'workshop', negotiationRounds: 3, estimatedDays: 10 });
    expect(m).toMatchObject({ kind: 'offer', price: 11_000_000, total: 22_000_000, by: 'workshop', rounds: 3, days: 10 });
  });

  test('negotiating: khách đề xuất; không có số ngày → days = null; số lượng 1 → không có dòng tổng', () => {
    const m = quoteCardModel({ status: 'negotiating', quantity: 1, latestOfferPrice: 9_000_000, latestOfferBy: 'customer', negotiationRounds: 2, estimatedDays: null });
    expect(m).toMatchObject({ kind: 'offer', by: 'customer', days: null, total: null });
  });

  test('negotiating nhưng thiếu giá → empty (không hiện "0 ₫")', () => {
    expect(quoteCardModel({ ...base, status: 'negotiating', latestOfferPrice: null }).kind).toBe('empty');
  });

  test('accepted: giá chốt + tổng + ngày + ngày hoàn thành', () => {
    const m = quoteCardModel({ ...base, status: 'accepted', finalPrice: 9_500_000, finalTotal: 19_000_000, estimatedDays: 12, estimatedCompletionDate: '2026-10-21' });
    expect(m).toMatchObject({ kind: 'final', price: 9_500_000, total: 19_000_000, days: 12, date: '2026-10-21' });
  });

  test('accepted thiếu finalPrice → dùng giá offer cuối; thiếu cả hai → empty', () => {
    expect(quoteCardModel({ ...base, status: 'accepted', latestOfferPrice: 8_000_000 })).toMatchObject({ kind: 'final', price: 8_000_000, total: 16_000_000 });
    expect(quoteCardModel({ ...base, status: 'accepted' }).kind).toBe('empty');
  });

  test('rejected / expired / cancelled: giá cuối cùng, mờ, KHÔNG có thời gian', () => {
    for (const status of ['rejected', 'expired', 'cancelled']) {
      const m = quoteCardModel({ ...base, status, latestOfferPrice: 15_000_000, estimatedDays: 20, estimatedCompletionDate: '2026-10-30' });
      expect(m, status).toMatchObject({ kind: 'dim', price: 15_000_000 });
      expect(m, status).not.toHaveProperty('days');
    }
  });

  test('rejected / cancelled chưa từng có offer → empty', () => {
    expect(quoteCardModel({ ...base, status: 'cancelled' }).kind).toBe('empty');
  });

  test('giá trị rác (NaN, chuỗi rỗng, số ngày <= 0) được xử lý an toàn', () => {
    expect(quoteCardModel({ ...base, status: 'negotiating', latestOfferPrice: 'abc' }).kind).toBe('empty');
    expect(quoteCardModel({ ...base, status: 'negotiating', latestOfferPrice: 5_000_000, estimatedDays: 0 }).days).toBeNull();
    expect(quoteCardModel({ status: 'negotiating', quantity: -3, latestOfferPrice: 5_000_000 }).total).toBeNull();
  });
});

test.describe('định dạng', () => {
  test('formatDay theo locale VI/EN (dd/MM/yyyy), không lệch ngày do múi giờ', () => {
    expect(formatDay('2026-10-21', 'vi')).toBe('21/10/2026');
    expect(formatDay('2026-10-21', 'en')).toBe('21/10/2026');
    expect(formatDay('2026-01-05T17:30:00Z', 'vi')).toBe('05/01/2026');
    expect(formatDay(null)).toBe('');
    expect(formatDay('không phải ngày')).toBe('');
  });

  test('formatVnd dùng Intl vi-VN, đơn vị ₫, không phần thập phân', () => {
    const s = formatVnd(11_000_000).replace(/\s/g, ' ');
    expect(s).toBe('11.000.000 ₫');
  });
});
