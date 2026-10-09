import { test, expect } from '@playwright/test';
import { featureValue, planRows, planExtras, planComparison, planHighlights, planValidity, addMonths, sortPlans } from '../../src/utils/planFeatures.js';

// Dữ liệu y hệt production (GET /api/subscription-plans, 2026-10-09)
const FREE = { id: 'f', name: 'free', displayName: 'Free', price: 0, sortOrder: 0, featureLimits: { ar_3d: 5, design: 5, export: 5, ai_chat: 20 }, displayFeatures: [] };
const PREMIUM = { id: 'p', name: 'B2C Premium AR/3D', displayName: 'B2C Premium AR/3D', price: 79000, sortOrder: 1, featureLimits: { ar_3d: 5, design: 5, export: 5, ai_chat: -1 }, displayFeatures: [] };
const CUSTOM = { id: 'c', name: 'Custom', displayName: 'Custom Design Premium / Verified', price: 299000, sortOrder: 2, featureLimits: { ar_3d: -1, design: -1, export: -1, ai_chat: -1 }, displayFeatures: [] };

test.describe('featureValue / planRows', () => {
  test('-1 = không giới hạn, n = giới hạn, 0/thiếu/rác = không có', () => {
    expect(featureValue(FREE, 'ai_chat')).toEqual({ kind: 'limit', count: 20 });
    expect(featureValue(PREMIUM, 'ai_chat')).toEqual({ kind: 'unlimited' });
    expect(featureValue({ featureLimits: { design: 0 } }, 'design')).toEqual({ kind: 'none' });
    expect(featureValue({ featureLimits: {} }, 'design')).toEqual({ kind: 'none' });
    expect(featureValue({ featureLimits: { design: 'abc' } }, 'design')).toEqual({ kind: 'none' });
    expect(featureValue({ featureLimits: { design: null } }, 'design')).toEqual({ kind: 'none' });
    expect(featureValue(null, 'design')).toEqual({ kind: 'none' });
    expect(featureValue({ featureLimits: { design: '5' } }, 'design')).toEqual({ kind: 'limit', count: 5 });
  });

  test('chỉ hiển thị tính năng BE thực thi: design + ai_chat (KHÔNG ar_3d / export)', () => {
    expect(planRows(CUSTOM).map((r) => r.key)).toEqual(['design', 'ai_chat']);
  });
});

test.describe('planExtras', () => {
  test('lọc chuỗi rỗng/không phải chuỗi, bỏ trùng, cắt khoảng trắng', () => {
    expect(planExtras({ displayFeatures: ['  A ', '', 'A', null, 5, 'B'] })).toEqual(['A', 'B']);
    expect(planExtras({ displayFeatures: undefined })).toEqual([]);
    expect(planExtras({})).toEqual([]);
  });
});

test.describe('planComparison', () => {
  test('thứ tự theo sortOrder rồi giá, kể cả khi API trả lộn xộn', () => {
    expect(sortPlans([CUSTOM, FREE, PREMIUM]).map((p) => p.id)).toEqual(['f', 'p', 'c']);
  });

  test('Free liệt kê đủ; gói sau chỉ liệt kê phần TỐT HƠN gói liền trước + ghi kế thừa', () => {
    const [free, premium, custom] = planComparison([CUSTOM, FREE, PREMIUM]);
    expect(free.inheritFrom).toBeNull();
    expect(free.rows).toEqual([{ key: 'design', kind: 'limit', count: 5 }, { key: 'ai_chat', kind: 'limit', count: 20 }]);

    expect(premium.inheritFrom.id).toBe('f');
    expect(premium.rows).toEqual([{ key: 'ai_chat', kind: 'unlimited' }]); // design 5 = 5 → không lặp lại

    expect(custom.inheritFrom.id).toBe('p');
    expect(custom.rows).toEqual([{ key: 'design', kind: 'unlimited' }]); // ai_chat vẫn không giới hạn → không lặp
  });

  test('gói cao hơn không có gì tốt hơn → vẫn có dòng kế thừa, danh sách rỗng', () => {
    const [, same] = planComparison([FREE, { ...FREE, id: 'x', sortOrder: 1, price: 1000 }]);
    expect(same.inheritFrom.id).toBe('f');
    expect(same.rows).toEqual([]);
  });

  test('dòng marketing của admin: gói sau không lặp lại dòng gói trước đã có', () => {
    const [a, b] = planComparison([{ ...FREE, displayFeatures: ['Hỗ trợ email'] }, { ...PREMIUM, displayFeatures: ['Hỗ trợ email', 'Hỗ trợ ưu tiên'] }]);
    expect(a.extras).toEqual(['Hỗ trợ email']);
    expect(b.extras).toEqual(['Hỗ trợ ưu tiên']);
  });

  test('danh sách gói rỗng/null an toàn', () => {
    expect(planComparison([])).toEqual([]);
    expect(planComparison(null)).toEqual([]);
    expect(planComparison(undefined)).toEqual([]);
  });
});

test.describe('planHighlights (modal)', () => {
  test('liệt kê quyền lợi CÓ THẬT của chính gói đó (không kế thừa); bỏ mục "none"', () => {
    expect(planHighlights(PREMIUM)).toEqual([
      { type: 'row', key: 'design', kind: 'limit', count: 5 },
      { type: 'row', key: 'ai_chat', kind: 'unlimited' },
    ]);
    expect(planHighlights({ featureLimits: { design: 0, ai_chat: 0 }, displayFeatures: ['X'] })).toEqual([{ type: 'text', text: 'X' }]);
  });
});

test.describe('addMonths / planValidity', () => {
  test('cộng tháng như Java plusMonths (31/1 + 1 tháng = 28/2, năm nhuận 29/2)', () => {
    expect(addMonths(new Date(2026, 0, 31), 1).getDate()).toBe(28);
    expect(addMonths(new Date(2028, 0, 31), 1).getDate()).toBe(29);
    expect(addMonths(new Date(2026, 10, 15), 1).getMonth()).toBe(11);
    expect(addMonths(new Date(2026, 11, 15), 1).getFullYear()).toBe(2027);
  });

  const now = new Date(2026, 9, 9, 12, 0, 0);

  test('chưa có gói / gói khác → 1 tháng kể từ bây giờ, không cộng dồn', () => {
    expect(planValidity(null, PREMIUM, now)).toEqual({ stacked: false, from: '2026-10-09', currentEnd: null, to: '2026-11-09' });
    const other = { status: 'active', plan: { id: 'f' }, endDate: null };
    expect(planValidity(other, PREMIUM, now).stacked).toBe(false);
  });

  test('đang dùng ĐÚNG gói và còn hạn → cộng dồn từ hạn hiện tại', () => {
    const sub = { status: 'active', plan: { id: 'p' }, endDate: new Date(2026, 9, 29, 12).toISOString() };
    expect(planValidity(sub, PREMIUM, now)).toEqual({ stacked: true, from: '2026-10-09', currentEnd: '2026-10-29', to: '2026-11-29' });
  });

  test('cùng gói nhưng đã hết hạn / không active → không cộng dồn', () => {
    expect(planValidity({ status: 'active', plan: { id: 'p' }, endDate: new Date(2026, 8, 1).toISOString() }, PREMIUM, now).stacked).toBe(false);
    expect(planValidity({ status: 'expired', plan: { id: 'p' }, endDate: new Date(2026, 11, 1).toISOString() }, PREMIUM, now).stacked).toBe(false);
  });
});
