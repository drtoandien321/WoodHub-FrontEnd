import { test, expect } from '@playwright/test';
import { API, IDS, USERS, get } from './helpers.js';

// Phân quyền: user A không được thấy dữ liệu của user B và ngược lại.
test.describe('Phân quyền', () => {
  test('khách B KHÔNG xem được báo giá của khách A', async ({ request }) => {
    const res = await get(request, USERS.customerB, `/quotes/${IDS.quoteNegotiating}`);
    expect([403, 404]).toContain(res.status());
  });

  test('khách A xem được báo giá của chính mình, kèm các vòng offer', async ({ request }) => {
    const res = await get(request, USERS.customerA, `/quotes/${IDS.quoteNegotiating}`);
    expect(res.status()).toBe(200);
    const q = await res.json();
    expect(q.status).toBe('negotiating');
    expect(q.offers.length).toBe(3);
  });

  test('danh sách báo giá của khách B không chứa báo giá của A', async ({ request }) => {
    const res = await get(request, USERS.customerB, '/quotes/my');
    expect(res.status()).toBe(200);
    const ids = (await res.json()).content.map((q) => q.id);
    expect(ids).not.toContain(IDS.quoteNegotiating);
  });

  test('khách hàng không gọi được /quotes/incoming (chỉ xưởng)', async ({ request }) => {
    const res = await get(request, USERS.customerA, '/quotes/incoming');
    expect(res.status()).toBe(403);
  });

  test('xưởng thấy đủ báo giá gửi tới mình', async ({ request }) => {
    const res = await get(request, USERS.workshop, '/quotes/incoming', { size: 50 });
    expect(res.status()).toBe(200);
    const ids = (await res.json()).content.map((q) => q.id);
    for (const id of [IDS.quotePending, IDS.quoteNegotiating, IDS.quoteAccepted, IDS.quoteRejected]) expect(ids).toContain(id);
  });

  test('khách A không xem được giao dịch của khách B', async ({ request }) => {
    const res = await get(request, USERS.customerA, `/payments/${IDS.paymentBUnder}`);
    expect(res.status()).toBe(403);
  });

  test('khách B xem được giao dịch của chính mình', async ({ request }) => {
    const res = await get(request, USERS.customerB, `/payments/${IDS.paymentBUnder}`);
    expect(res.status()).toBe(200);
    expect((await res.json()).status).toBe('pending');
  });

  test('khách hàng không vào được API admin thanh toán', async ({ request }) => {
    for (const url of ['/admin/payments', '/admin/payments/stats']) {
      const res = await get(request, USERS.customerA, url);
      expect(res.status(), url).toBe(403);
    }
  });

  test('admin xem được danh sách + thống kê thanh toán', async ({ request }) => {
    const list = await get(request, USERS.admin, '/admin/payments', { q: 'SUBE2E', size: 50 });
    expect(list.status()).toBe(200);
    expect((await list.json()).content.length).toBeGreaterThan(0);
    const stats = await get(request, USERS.admin, '/admin/payments/stats');
    expect(stats.status()).toBe(200);
  });

  test('khách hàng không xem được danh sách gói đăng ký của người khác (admin-only)', async ({ request }) => {
    const res = await get(request, USERS.customerA, '/subscriptions');
    expect(res.status()).toBe(403);
  });

  test('khách hàng không xem được hạn mức của user khác (admin-only)', async ({ request }) => {
    const res = await get(request, USERS.customerA, '/usage/users/e2e00000-0000-4000-8000-000000000002');
    expect(res.status()).toBe(403);
  });

  test('API công khai không cần đăng nhập: danh sách gói', async ({ request }) => {
    const res = await request.get(`${API}/subscription-plans`);
    expect(res.status()).toBe(200);
    expect((await res.json()).length).toBeGreaterThanOrEqual(3);
  });
});
