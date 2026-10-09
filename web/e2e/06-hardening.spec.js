import { test, expect } from '@playwright/test';
import { API, IDS, USERS, authHeader, get, post } from './helpers.js';

// Nhóm 3 — độ bền khi đồng thời + bảo mật kênh WebSocket.

test.describe('Hạn mức & đồng thời', () => {
  test('AUD-008: 12 request consume cùng lúc, hạn mức 5 → đúng 5 thành công, 7 bị 429', async ({ request }) => {
    // Khách B chưa dùng `export` trong tháng (seed mới) — hạn mức Free = 5
    const results = await Promise.all(Array.from({ length: 12 }, () => post(request, USERS.customerB, '/usage/export/consume')));
    const statuses = results.map((r) => r.status());
    const ok = statuses.filter((s) => s === 200).length;
    const limited = statuses.filter((s) => s === 429).length;
    expect({ ok, limited, other: statuses.filter((s) => s !== 200 && s !== 429) }, `status: ${statuses.join(',')}`)
      .toEqual({ ok: 5, limited: 7, other: [] });
    const usage = (await (await get(request, USERS.customerB, '/usage/me')).json()).find((u) => u.feature === 'export');
    expect(usage.used).toBe(5);
  });
});

test.describe('Báo giá & đồng thời', () => {
  test('AUD-010: 3 lần chấp nhận cùng lúc 1 offer → đúng 1 thành công (201), còn lại 409, không bao giờ 500 (lặp 5 vòng)', async ({ request }) => {
    for (let round = 1; round <= 5; round++) {
      const q = await (await post(request, USERS.customerA, '/quotes', {
        workshopId: IDS.workshopSupplier, customDesignId: IDS.designA, quantity: 1, note: '[E2E] race accept',
      })).json();
      await post(request, USERS.workshop, `/quotes/${q.id}/offers`, { price: 7_000_000, leadTimeDays: 9 });
      const offer = (await (await get(request, USERS.customerA, `/quotes/${q.id}`)).json()).offers[0];
      const results = await Promise.all(
        Array.from({ length: 3 }, () => post(request, USERS.customerA, `/quotes/${q.id}/offers/${offer.id}/accept`)),
      );
      const statuses = results.map((r) => r.status()).sort();
      expect(statuses, `vòng ${round}: ${statuses.join(',')}`).toEqual([201, 409, 409]);
    }
  });
});

// ---- STOMP thô qua WebSocket gốc của Node (SockJS có endpoint /ws/websocket) ----
function stompSession(token) {
  const url = API.replace(/^http/, 'ws').replace(/\/api$/, '') + '/ws/websocket';
  const frames = [];
  const ws = new WebSocket(url);
  const waiters = [];
  ws.onmessage = (e) => {
    const text = String(e.data);
    if (text === 'h' || text === '\n') return;
    frames.push(text);
    waiters.splice(0).forEach((w) => w());
  };
  const send = (cmd, headers, body = '') =>
    ws.send(`${cmd}\n${Object.entries(headers).map(([k, v]) => `${k}:${v}`).join('\n')}\n\n${body}\u0000`);
  const waitFor = async (pred, ms = 4000) => {
    const end = Date.now() + ms;
    for (;;) {
      const hit = frames.find(pred);
      if (hit) return hit;
      if (Date.now() > end) return null;
      await new Promise((r) => { waiters.push(r); setTimeout(r, 200); });
    }
  };
  const open = new Promise((res, rej) => { ws.onopen = res; ws.onerror = () => rej(new Error('ws error')); });
  return { ws, frames, send, waitFor, open, token };
}

test.describe('WebSocket/STOMP', () => {
  test('AUD-017: user đã đăng nhập KHÔNG được subscribe kênh chung /topic/**', async ({ request }) => {
    const token = (await authHeader(request, USERS.customerA)).Authorization.replace('Bearer ', '');
    const s = stompSession(token);
    await s.open;
    s.send('CONNECT', { 'accept-version': '1.2', 'heart-beat': '0,0', Authorization: `Bearer ${token}` });
    expect(await s.waitFor((f) => f.startsWith('CONNECTED'))).not.toBeNull();
    s.send('SUBSCRIBE', { id: 'sub-bad', destination: '/topic/e2e-anything' });
    const bad = await s.waitFor((f) => f.startsWith('ERROR'));
    s.ws.close();
    expect(bad, 'phải bị từ chối bằng frame ERROR').not.toBeNull();
  });

  test('subscribe kênh riêng /user/queue/messages vẫn được phép (chat không hỏng)', async ({ request }) => {
    const token = (await authHeader(request, USERS.customerA)).Authorization.replace('Bearer ', '');
    const s = stompSession(token);
    await s.open;
    s.send('CONNECT', { 'accept-version': '1.2', 'heart-beat': '0,0', Authorization: `Bearer ${token}` });
    expect(await s.waitFor((f) => f.startsWith('CONNECTED'))).not.toBeNull();
    s.send('SUBSCRIBE', { id: 'sub-ok', destination: '/user/queue/messages' });
    // Subscribe hợp lệ thì broker im lặng; bị từ chối thì có frame ERROR ngay.
    const err = await s.waitFor((f) => f.startsWith('ERROR'), 1500);
    s.ws.close();
    expect(err, `không được có ERROR: ${err?.slice(0, 80)}`).toBeNull();
  });

  test('CONNECT không token bị từ chối', async () => {
    const s = stompSession(null);
    await s.open;
    s.send('CONNECT', { 'accept-version': '1.2', 'heart-beat': '0,0' });
    const f = await s.waitFor((x) => x.startsWith('ERROR') || x.startsWith('CONNECTED'));
    s.ws.close();
    expect(f?.startsWith('ERROR'), `nhận: ${f?.slice(0, 60)}`).toBe(true);
  });
});

