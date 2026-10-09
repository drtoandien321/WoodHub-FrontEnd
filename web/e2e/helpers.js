import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/*
 * Helper dùng chung cho các spec E2E (API).
 * Đọc cấu hình từ e2e/.env.e2e (đã gitignore): API local + khoá webhook TEST (không phải khoá SePay thật).
 * Dữ liệu người dùng/báo giá/payment lấy từ backend/sql/e2e/seed.sql (id cố định, có dấu [E2E]).
 */
const here = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const env = {};
  const file = path.join(here, '.env.e2e');
  if (!fs.existsSync(file)) throw new Error('Thiếu web/e2e/.env.e2e — xem docs/e2e-report.md');
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = /^([A-Z0-9_]+)=(.*)$/.exec(line.trim());
    if (m) env[m[1]] = m[2];
  }
  return env;
}

export const ENV = loadEnv();
export const API = ENV.E2E_API_URL;
export const PASSWORD = 'E2E-Test-Pass1!';

// Cùng id với seed.sql
export const IDS = {
  workshopSupplier: 'e2e00000-0000-4000-8000-000000000011',
  designA: 'e2e00000-0000-4000-8000-000000000021',
  quotePending: 'e2e00000-0000-4000-8000-000000000031',
  quoteNegotiating: 'e2e00000-0000-4000-8000-000000000032',
  quoteAccepted: 'e2e00000-0000-4000-8000-000000000033',
  quoteRejected: 'e2e00000-0000-4000-8000-000000000034',
  paymentBUnder: 'e2e00000-0000-4000-8000-000000000071',
};

export const USERS = {
  customerA: 'e2e+customer-a@test.woodhub.local',
  customerB: 'e2e+customer-b@test.woodhub.local',
  workshop: 'e2e+workshop@test.woodhub.local',
  admin: 'e2e+admin@test.woodhub.local',
  paid: 'e2e+paid@test.woodhub.local',
  expired: 'e2e+expired@test.woodhub.local',
};

const tokenCache = {};

// Đăng nhập (cache token trong 1 lần chạy) → trả header Authorization
export async function authHeader(request, email) {
  if (!tokenCache[email]) {
    const res = await request.post(`${API}/auth/login`, { data: { email, password: PASSWORD } });
    if (!res.ok()) throw new Error(`Login ${email} thất bại: ${res.status()} ${await res.text()}`);
    tokenCache[email] = (await res.json()).token;
  }
  return { Authorization: `Bearer ${tokenCache[email]}` };
}

export async function get(request, email, url, params) {
  return request.get(`${API}${url}`, { headers: await authHeader(request, email), params });
}

export async function post(request, email, url, data) {
  return request.post(`${API}${url}`, { headers: await authHeader(request, email), data });
}

// Giả lập SePay gọi webhook (server-to-server). KHÔNG chuyển tiền thật.
export function sepayWebhook(request, { ref, amount, referenceCode, key = ENV.E2E_WEBHOOK_KEY, transferType = 'in', content }) {
  return request.post(`${API}/payments/webhook/sepay`, {
    headers: key === null ? {} : { Authorization: `Apikey ${key}` },
    data: {
      transferType,
      content: content ?? `FT E2E chuyen khoan ${ref}`,
      transferAmount: amount,
      referenceCode: referenceCode ?? `E2E-${Date.now()}-${Math.floor(Math.random() * 1e6)}`,
    },
  });
}

// Lấy id gói theo tên (API công khai)
export async function planId(request, name) {
  const plans = await (await request.get(`${API}/subscription-plans`)).json();
  const plan = plans.find((p) => p.name === name);
  if (!plan) throw new Error(`Không thấy gói ${name}`);
  return plan.id;
}

export const PREMIUM = 'B2C Premium AR/3D';
