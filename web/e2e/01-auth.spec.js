import { test, expect } from '@playwright/test';
import { API, PASSWORD, USERS, get } from './helpers.js';

test.describe('Auth', () => {
  test('đăng nhập đúng trả token + role', async ({ request }) => {
    const res = await request.post(`${API}/auth/login`, { data: { email: USERS.customerA, password: PASSWORD } });
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.token).toBeTruthy();
    expect(body.role).toBe('customer');
  });

  test('sai mật khẩu bị từ chối (4xx, không lộ token)', async ({ request }) => {
    const res = await request.post(`${API}/auth/login`, { data: { email: USERS.customerA, password: 'sai-mat-khau' } });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
    expect((await res.text()).includes('token')).toBe(false);
  });

  test('email không tồn tại không cho đăng nhập', async ({ request }) => {
    const res = await request.post(`${API}/auth/login`, { data: { email: 'e2e+khong-ton-tai@test.woodhub.local', password: PASSWORD } });
    expect(res.status()).toBeGreaterThanOrEqual(400);
    expect(res.status()).toBeLessThan(500);
  });

  test('endpoint cần đăng nhập, không có token → 401 (AUD-015: hiện trả 403)', async ({ request }) => {
    const res = await request.get(`${API}/quotes/my`);
    expect(res.status()).toBe(401);
  });

  test('token rác không được chấp nhận', async ({ request }) => {
    const res = await request.get(`${API}/quotes/my`, { headers: { Authorization: 'Bearer abc.def.ghi' } });
    expect([401, 403]).toContain(res.status());
  });

  test('GET /users/me trả đúng người đang đăng nhập', async ({ request }) => {
    const res = await get(request, USERS.customerA, '/users/me');
    expect(res.status()).toBe(200);
    expect((await res.json()).email).toBe(USERS.customerA);
  });
});
