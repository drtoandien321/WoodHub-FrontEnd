import { defineConfig } from '@playwright/test';

/*
 * Playwright — E2E cho WoodHub.
 *  - Hiện tại: test API của BE chạy LOCAL (cổng 8082, xem e2e/helpers.js) — không cần trình duyệt.
 *  - workers = 1 + không fullyParallel: các spec chia sẻ cùng dữ liệu seed [E2E] trên DB nên phải chạy tuần tự.
 *  - Test UI (Phase 4/5) sẽ thêm project dùng trình duyệt sau khi bạn đồng ý tải Chromium.
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: /.*\.spec\.js/,
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: 'test-results/e2e.json' }]],
});
