import { test, expect } from '@playwright/test';
import { USERS, PREMIUM, get, post, planId, sepayWebhook } from './helpers.js';

// Webhook SePay — giả lập bằng request tới BE LOCAL (không có tiền thật). Chạy tuần tự (dùng chung user B / paid).
// workers=1 nên các test chạy theo thứ tự khai báo; KHÔNG dùng mode 'serial' để 1 test lỗi không làm bỏ qua các test sau.
test.describe.configure({ mode: 'default' });

const payments = async (request, email) => (await (await get(request, email, '/payments/me')).json());
const byRef = (list, ref) => list.find((p) => p.txnRef === ref);
const history = async (request, email) => (await (await get(request, email, '/subscriptions/me/history')).json());

test.describe('Webhook thanh toán', () => {
  test('sai API key → 401, không đổi trạng thái', async ({ request }) => {
    const res = await sepayWebhook(request, { ref: 'SUBE2EUNDER0001', amount: 79000, key: 'sai-key' });
    expect(res.status()).toBe(401);
    expect(byRef(await payments(request, USERS.customerB), 'SUBE2EUNDER0001').status).toBe('pending');
  });

  test('thiếu header Authorization → 401', async ({ request }) => {
    const res = await sepayWebhook(request, { ref: 'SUBE2EUNDER0001', amount: 79000, key: null });
    expect(res.status()).toBe(401);
  });

  test('giao dịch tiền RA (transferType=out) bị bỏ qua', async ({ request }) => {
    const res = await sepayWebhook(request, { ref: 'SUBE2EUNDER0001', amount: 79000, transferType: 'out' });
    expect(res.status()).toBe(200);
    expect(byRef(await payments(request, USERS.customerB), 'SUBE2EUNDER0001').status).toBe('pending');
  });

  test('nội dung chuyển khoản sai mã → bỏ qua, không kích hoạt', async ({ request }) => {
    const res = await sepayWebhook(request, { ref: 'x', content: 'chuyen tien linh tinh', amount: 79000 });
    expect(res.status()).toBe(200);
    expect(byRef(await payments(request, USERS.customerB), 'SUBE2EUNDER0001').status).toBe('pending');
  });

  test('mã không tồn tại → bỏ qua (200), không lỗi', async ({ request }) => {
    const res = await sepayWebhook(request, { ref: 'SUBZZZZZZZZZZZZ', amount: 79000 });
    expect(res.status()).toBe(200);
  });

  test('chuyển THIẾU tiền → vẫn pending, gói không kích hoạt', async ({ request }) => {
    const before = (await history(request, USERS.customerB)).length;
    const res = await sepayWebhook(request, { ref: 'SUBE2EUNDER0001', amount: 50000 });
    expect(res.status()).toBe(200);
    expect(byRef(await payments(request, USERS.customerB), 'SUBE2EUNDER0001').status).toBe('pending');
    expect((await history(request, USERS.customerB)).length).toBe(before);
  });

  test('chuyển ĐỦ tiền → paid + gói Premium được kích hoạt', async ({ request }) => {
    const res = await sepayWebhook(request, { ref: 'SUBE2EUNDER0001', amount: 79000 });
    expect(res.status()).toBe(200);
    const p = byRef(await payments(request, USERS.customerB), 'SUBE2EUNDER0001');
    expect(p.status).toBe('paid');
    const sub = await (await get(request, USERS.customerB, '/subscriptions/me')).json();
    expect(sub.status).toBe('active');
    expect(sub.plan.name).toBe(PREMIUM);
  });

  test('chuyển DƯ tiền → vẫn paid', async ({ request }) => {
    const res = await sepayWebhook(request, { ref: 'SUBE2EOVERPAY01', amount: 100000 });
    expect(res.status()).toBe(200);
    expect(byRef(await payments(request, USERS.customerB), 'SUBE2EOVERPAY01').status).toBe('paid');
  });

  test('webhook gửi TRÙNG tuần tự → chỉ kích hoạt 1 lần', async ({ request }) => {
    const before = (await history(request, USERS.customerB)).length;
    const code = 'E2E-DUP-REF-1';
    const a = await sepayWebhook(request, { ref: 'SUBE2EDUPLICA01', amount: 79000, referenceCode: code });
    const b = await sepayWebhook(request, { ref: 'SUBE2EDUPLICA01', amount: 79000, referenceCode: code });
    expect(a.status()).toBe(200);
    expect(b.status()).toBe(200);
    expect((await history(request, USERS.customerB)).length).toBe(before + 1);
  });

  test('AUD-005 (chính sách B): payment đã EXPIRED nhưng tiền đã vào → vẫn paid + kích hoạt, ghi nhận trả muộn', async ({ request }) => {
    const before = (await history(request, USERS.customerB)).length;
    expect(byRef(await payments(request, USERS.customerB), 'SUBE2EEXPIRED01').status).toBe('expired');
    await sepayWebhook(request, { ref: 'SUBE2EEXPIRED01', amount: 79000 });
    const p = byRef(await payments(request, USERS.customerB), 'SUBE2EEXPIRED01');
    expect(p.status, 'tiền đã vào thì phải ghi nhận').toBe('paid');
    expect((await history(request, USERS.customerB)).length).toBe(before + 1);
    // trả muộn nhận ra bằng paid_at > expires_at (admin thấy trong trang Admin Payments)
    const detail = await (await get(request, USERS.admin, `/admin/payments/${p.id}`)).json();
    expect(new Date(detail.paidAt) > new Date(detail.expiresAt)).toBe(true);
  });

  test('AUD-004b: mua lại gói khi còn hạn phải CỘNG DỒN thời gian, không mất ngày đã trả', async ({ request }) => {
    const before = await (await get(request, USERS.paid, '/subscriptions/me')).json();
    const oldEnd = new Date(before.endDate).getTime();
    await sepayWebhook(request, { ref: 'SUBE2ERENEW0001', amount: 79000 });
    const after = await (await get(request, USERS.paid, '/subscriptions/me')).json();
    const newEnd = new Date(after.endDate).getTime();
    const extraDays = (newEnd - oldEnd) / 86_400_000;
    expect(extraDays, `endDate cũ ${before.endDate} → mới ${after.endDate}`).toBeGreaterThanOrEqual(27);
  });

  test('AUD-004: 5 webhook cùng lúc cho 1 giao dịch → không lỗi 5xx, kích hoạt đúng 1 lần', async ({ request }) => {
    const before = (await history(request, USERS.paid)).length;
    const code = 'E2E-RACE-REF-1';
    const results = await Promise.all(
      Array.from({ length: 5 }, () => sepayWebhook(request, { ref: 'SUBE2ERACE00001', amount: 79000, referenceCode: code })),
    );
    const statuses = results.map((r) => r.status());
    expect(statuses.every((s) => s === 200), `status: ${statuses.join(',')}`).toBe(true);
    expect((await history(request, USERS.paid)).length).toBe(before + 1);
  });

  test('tạo payment mới qua API rồi thanh toán → modal sẽ thấy paid khi poll', async ({ request }) => {
    const id = await planId(request, PREMIUM);
    const created = await (await post(request, USERS.customerA, '/payments/subscription', { planId: id })).json();
    expect((await (await get(request, USERS.customerA, `/payments/${created.id}`)).json()).status).toBe('pending');
    await sepayWebhook(request, { ref: created.txnRef, amount: 79000 });
    expect((await (await get(request, USERS.customerA, `/payments/${created.id}`)).json()).status).toBe('paid');
    const sub = await (await get(request, USERS.customerA, '/subscriptions/me')).json();
    expect(sub.plan.name).toBe(PREMIUM);
  });
});
