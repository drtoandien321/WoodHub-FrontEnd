import { test, expect } from '@playwright/test';
import { API, USERS, PREMIUM, get, post, planId } from './helpers.js';

test.describe('Gói đăng ký & hạn mức', () => {
  test('tạo payment cho gói trả phí: pending, QR đúng số tiền + nội dung, hạn ~15 phút', async ({ request }) => {
    const id = await planId(request, PREMIUM);
    const res = await post(request, USERS.customerA, '/payments/subscription', { planId: id });
    expect(res.status(), await res.text()).toBe(201);
    const p = await res.json();
    expect(p.status).toBe('pending');
    expect(Number(p.amount)).toBe(79000);
    expect(p.qrUrl).toContain('amount=79000');
    expect(p.qrUrl).toContain(`des=${p.txnRef}`);
    expect(p.txnRef).toMatch(/^SUB[A-Z0-9]{12}$/);
    const minutes = (new Date(p.expiresAt) - Date.now()) / 60000;
    expect(minutes).toBeGreaterThan(13);
    expect(minutes).toBeLessThanOrEqual(16);
  });

  test('gói Free không đi qua thanh toán (400)', async ({ request }) => {
    const id = await planId(request, 'free');
    const res = await post(request, USERS.customerA, '/payments/subscription', { planId: id });
    expect(res.status()).toBe(400);
  });

  test('đăng ký thẳng gói trả phí qua /subscriptions bị chặn (400)', async ({ request }) => {
    const id = await planId(request, PREMIUM);
    const res = await post(request, USERS.customerA, '/subscriptions', { planId: id });
    expect(res.status()).toBe(400);
  });

  test('gói Free không gia hạn được (400)', async ({ request }) => {
    const res = await post(request, USERS.customerA, '/subscriptions/me/renew');
    expect(res.status()).toBe(400);
  });

  test('AUD-002: gia hạn gói TRẢ PHÍ phải cần thanh toán, không được miễn phí', async ({ request }) => {
    const before = await (await get(request, USERS.paid, '/subscriptions/me')).json();
    const res = await post(request, USERS.paid, '/subscriptions/me/renew');
    const after = await (await get(request, USERS.paid, '/subscriptions/me')).json();
    // Đúng thiết kế: endpoint từ chối (4xx) hoặc không đổi endDate khi chưa có tiền.
    expect(res.status() >= 400 || after.endDate === before.endDate, `renew trả ${res.status()}, endDate ${before.endDate} → ${after.endDate}`).toBe(true);
  });

  test('hạn mức Free: hiển thị đúng theo gói', async ({ request }) => {
    const res = await get(request, USERS.customerA, '/usage/me');
    expect(res.status()).toBe(200);
    const usage = Object.fromEntries((await res.json()).map((u) => [u.feature, u]));
    expect(usage.ai_chat.limit).toBe(20);
    expect(usage.design.limit).toBe(5);
  });

  test('AUD-003: gói trả phí hết hạn phải rơi về Free (không khoá mọi tính năng)', async ({ request }) => {
    const res = await post(request, USERS.expired, '/usage/ai_chat/consume');
    expect(res.status(), 'user hết hạn gói phải còn quyền Free').toBe(200);
  });

  test('hạn mức bị chặn đúng khi hết lượt (429) — dùng admin đặt custom_limit = 0', async ({ request }) => {
    // admin đặt hạn mức design = 0 cho khách A ⇒ consume phải 429
    const uid = 'e2e00000-0000-4000-8000-000000000001';
    const { authHeader } = await import('./helpers.js');
    const put = await request.put(`${API}/usage/users/${uid}/design/limit`, { headers: await authHeader(request, USERS.admin), data: { customLimit: 0 } });
    expect(put.status(), await put.text()).toBeLessThan(300);
    const res = await post(request, USERS.customerA, '/usage/design/consume');
    expect(res.status()).toBe(429);
    // trả lại về mặc định theo gói (-1 = vô hạn không phải mặc định; đặt lại 5 như gói Free)
    const reset = await request.put(`${API}/usage/users/${uid}/design/limit`, { headers: await authHeader(request, USERS.admin), data: { customLimit: 5 } });
    expect(reset.status()).toBeLessThan(300);
  });
});
