import { test, expect } from '@playwright/test';
import { IDS, USERS, get, post } from './helpers.js';

// Phase 4 — danh sách báo giá phải trả giá + thời gian dự kiến (không cần gọi chi tiết từng báo giá).
const listMy = async (request) => {
  const res = await get(request, USERS.customerA, '/quotes/my', { size: 100 });
  expect(res.status()).toBe(200);
  return (await res.json()).content;
};
const row = (rows, id) => rows.find((q) => q.id === id);
const ymd = (d) => d.toISOString().slice(0, 10);

test.describe('Danh sách báo giá: giá + thời gian dự kiến', () => {
  test('pending: chưa có báo giá → các field giá/thời gian rỗng, 0 vòng', async ({ request }) => {
    const q = row(await listMy(request), IDS.quotePending);
    expect(q.status).toBe('pending');
    expect(q.latestOfferPrice).toBeNull();
    expect(q.latestOfferBy).toBeNull();
    expect(q.finalPrice).toBeNull();
    expect(q.estimatedDays).toBeNull();
    expect(q.negotiationRounds).toBe(0);
  });

  test('negotiating: giá + bên đề xuất của vòng mới nhất, số vòng, số ngày', async ({ request }) => {
    const q = row(await listMy(request), IDS.quoteNegotiating);
    expect(q.status).toBe('negotiating');
    expect(Number(q.latestOfferPrice)).toBe(11_000_000);
    expect(q.latestOfferBy).toBe('workshop');
    expect(q.negotiationRounds).toBe(3);
    expect(q.estimatedDays).toBe(10);
    expect(q.finalPrice).toBeNull(); // chưa chốt
    expect(q.estimatedCompletionDate).toBeNull();
  });

  test('accepted: giá chốt + tổng (× số lượng) + ngày hoàn thành dự kiến', async ({ request }) => {
    const q = row(await listMy(request), IDS.quoteAccepted);
    expect(q.status).toBe('accepted');
    expect(Number(q.finalPrice)).toBe(9_500_000);
    expect(Number(q.finalTotal)).toBe(19_000_000); // quantity = 2
    expect(q.estimatedDays).toBe(12);
    // Đơn seed tạo "bây giờ" ⇒ hoàn thành ≈ hôm nay + 12 ngày (giờ VN; cho lệch ±1 ngày quanh nửa đêm)
    expect(q.estimatedCompletionDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const diff = (new Date(q.estimatedCompletionDate) - new Date(ymd(new Date()))) / 86_400_000;
    expect(diff).toBeGreaterThanOrEqual(11);
    expect(diff).toBeLessThanOrEqual(13);
  });

  test('rejected: giữ lại giá của offer cuối, không có giá chốt', async ({ request }) => {
    const q = row(await listMy(request), IDS.quoteRejected);
    expect(q.status).toBe('rejected');
    expect(Number(q.latestOfferPrice)).toBe(15_000_000);
    expect(q.finalPrice).toBeNull();
    expect(q.estimatedCompletionDate).toBeNull();
  });

  test('khách trả giá lại → latestOfferBy = customer, số vòng tăng, thời gian theo offer mới nhất', async ({ request }) => {
    const created = await (await post(request, USERS.customerA, '/quotes', {
      workshopId: IDS.workshopSupplier, customDesignId: IDS.designA, quantity: 3, note: '[E2E] summary',
    })).json();
    await post(request, USERS.workshop, `/quotes/${created.id}/offers`, { price: 10_000_000, leadTimeDays: 14 });
    await post(request, USERS.customerA, `/quotes/${created.id}/offers`, { price: 9_000_000, leadTimeDays: 12 });
    const q = row(await listMy(request), created.id);
    expect(q.status).toBe('negotiating');
    expect(Number(q.latestOfferPrice)).toBe(9_000_000);
    expect(q.latestOfferBy).toBe('customer');
    expect(q.negotiationRounds).toBe(2);
    expect(q.estimatedDays).toBe(12);
  });

  test('xưởng cũng thấy các field tổng hợp ở /incoming', async ({ request }) => {
    const res = await get(request, USERS.workshop, '/quotes/incoming', { size: 100 });
    const q = row((await res.json()).content, IDS.quoteAccepted);
    expect(Number(q.finalPrice)).toBe(9_500_000);
    expect(q.negotiationRounds).toBe(1);
  });

  test('chi tiết vẫn trả đủ offers + field tổng hợp; field cũ không đổi', async ({ request }) => {
    const q = await (await get(request, USERS.customerA, `/quotes/${IDS.quoteNegotiating}`)).json();
    expect(q.offers.length).toBe(3);
    expect(q.negotiationRounds).toBe(3);
    expect(Number(q.latestOfferPrice)).toBe(11_000_000);
    for (const key of ['id', 'workshopName', 'quantity', 'status', 'createdAt', 'updatedAt']) expect(q, key).toHaveProperty(key);
  });

  test('phân quyền không đổi: khách B không thấy báo giá của A trong danh sách', async ({ request }) => {
    const res = await get(request, USERS.customerB, '/quotes/my', { size: 100 });
    const ids = (await res.json()).content.map((x) => x.id);
    expect(ids).not.toContain(IDS.quoteAccepted);
  });
});
