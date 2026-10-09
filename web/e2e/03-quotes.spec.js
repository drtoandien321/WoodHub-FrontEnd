import { test, expect } from '@playwright/test';
import { IDS, USERS, get, post } from './helpers.js';

async function newQuote(request, extra = {}) {
  const res = await post(request, USERS.customerA, '/quotes', {
    workshopId: IDS.workshopSupplier, customDesignId: IDS.designA, quantity: 3, location: 'TP.HCM', note: '[E2E] test', ...extra,
  });
  expect(res.status(), await res.text()).toBe(201);
  return res.json();
}

test.describe('Báo giá & thương lượng', () => {
  test('luồng đầy đủ: gửi → xưởng ra giá → khách trả giá → xưởng chốt → tạo đơn', async ({ request }) => {
    const q = await newQuote(request);
    expect(q.status).toBe('pending');

    // xưởng ra giá + thời gian
    let res = await post(request, USERS.workshop, `/quotes/${q.id}/offers`, { price: 10_000_000, leadTimeDays: 14, note: '[E2E]' });
    expect(res.status(), await res.text()).toBeLessThan(300);
    expect((await (await get(request, USERS.customerA, `/quotes/${q.id}`)).json()).status).toBe('negotiating');

    // khách trả giá thấp hơn (offer của xưởng thành superseded)
    res = await post(request, USERS.customerA, `/quotes/${q.id}/offers`, { price: 9_000_000, leadTimeDays: 14 });
    expect(res.status()).toBeLessThan(300);
    const detail = await (await get(request, USERS.customerA, `/quotes/${q.id}`)).json();
    expect(detail.offers.map((o) => o.status)).toEqual(['superseded', 'pending']);
    const customerOffer = detail.offers[1];
    expect(customerOffer.offeredBy).toBe('customer');

    // xưởng chấp nhận offer của khách → tạo đơn với đúng giá + thời gian
    res = await post(request, USERS.workshop, `/quotes/${q.id}/offers/${customerOffer.id}/accept`);
    expect(res.status(), await res.text()).toBeLessThan(300);
    const order = await res.json();
    expect(Number(order.unitPrice)).toBe(9_000_000);
    expect(order.leadTimeDays).toBe(14);
    expect((await (await get(request, USERS.customerA, `/quotes/${q.id}`)).json()).status).toBe('accepted');
  });

  test('bên ra giá không được tự chấp nhận offer của chính mình', async ({ request }) => {
    const q = await newQuote(request);
    await post(request, USERS.workshop, `/quotes/${q.id}/offers`, { price: 8_000_000, leadTimeDays: 7 });
    const offer = (await (await get(request, USERS.workshop, `/quotes/${q.id}`)).json()).offers[0];
    const res = await post(request, USERS.workshop, `/quotes/${q.id}/offers/${offer.id}/accept`);
    expect(res.status()).toBe(403);
  });

  test('khách từ chối offer → báo giá chuyển rejected (kết thúc)', async ({ request }) => {
    const q = await newQuote(request);
    await post(request, USERS.workshop, `/quotes/${q.id}/offers`, { price: 20_000_000, leadTimeDays: 30 });
    const offer = (await (await get(request, USERS.customerA, `/quotes/${q.id}`)).json()).offers[0];
    const res = await post(request, USERS.customerA, `/quotes/${q.id}/offers/${offer.id}/reject`);
    expect(res.status()).toBeLessThan(300);
    expect((await res.json()).status).toBe('rejected');
  });

  test('báo giá đã kết thúc không ra giá thêm được (409)', async ({ request }) => {
    const res = await post(request, USERS.workshop, `/quotes/${IDS.quoteRejected}/offers`, { price: 1_000_000, leadTimeDays: 5 });
    expect(res.status()).toBe(409);
  });

  test('khách huỷ báo giá chờ phản hồi; huỷ lần 2 → 409', async ({ request }) => {
    const q = await newQuote(request);
    let res = await post(request, USERS.customerA, `/quotes/${q.id}/cancel`);
    expect(res.status()).toBeLessThan(300);
    res = await post(request, USERS.customerA, `/quotes/${q.id}/cancel`);
    expect(res.status()).toBe(409);
  });

  test('khách không tạo báo giá bằng thiết kế của người khác', async ({ request }) => {
    const res = await post(request, USERS.customerB, '/quotes', { workshopId: IDS.workshopSupplier, customDesignId: IDS.designA, quantity: 1 });
    expect(res.status()).toBe(403);
  });

  test('AUD-020: giá offer phải > 0 và thời gian dự kiến phải > 0', async ({ request }) => {
    const q = await newQuote(request);
    const zeroPrice = await post(request, USERS.workshop, `/quotes/${q.id}/offers`, { price: 0, leadTimeDays: 5 });
    expect(zeroPrice.status(), 'price = 0').toBe(400);
    const zeroDays = await post(request, USERS.workshop, `/quotes/${q.id}/offers`, { price: 1_000_000, leadTimeDays: 0 });
    expect(zeroDays.status(), 'leadTimeDays = 0').toBe(400);
  });

  test('AUD-009: báo giá quá hạn phải hiện expired trong danh sách', async ({ request }) => {
    const past = new Date(Date.now() - 3_600_000).toISOString();
    const q = await newQuote(request, { expiresAt: past });
    // ra giá trên báo giá quá hạn → bị chặn
    const res = await post(request, USERS.workshop, `/quotes/${q.id}/offers`, { price: 5_000_000, leadTimeDays: 7 });
    expect(res.status()).toBe(409);
    const list = await (await get(request, USERS.customerA, '/quotes/my', { size: 100 })).json();
    const row = list.content.find((x) => x.id === q.id);
    expect(row.status, 'danh sách phải hiện trạng thái thật').toBe('expired');
  });
});
