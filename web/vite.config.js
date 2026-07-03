import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Tailwind v4 dùng plugin Vite riêng (không cần tailwind.config.js + postcss như v3)
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // sockjs-client (chat STOMP) là thư viện đời webpack/Node cũ, bên trong tham chiếu biến
  // `global` — Vite/ESM trình duyệt không có nên crash "global is not defined" ngay khi import.
  // Map global → globalThis (chuẩn ES2020, có ở mọi trình duyệt) để thư viện chạy được.
  // Phải khai ở CẢ 2 chỗ: `define` áp cho source lúc build, còn optimizeDeps.esbuildOptions.define
  // áp cho bước PRE-BUNDLE dependency của dev server (chính là file sockjs-client.js?v=... bị lỗi).
  define: { global: 'globalThis' },
  optimizeDeps: { esbuildOptions: { define: { global: 'globalThis' } } },
});
