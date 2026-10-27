import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Tailwind v4 dùng plugin Vite riêng (không cần tailwind.config.js + postcss như v3)
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  // sockjs-client (chat STOMP) là thư viện đời webpack/Node cũ, bên trong tham chiếu biến
  // `global` — Vite/ESM trình duyệt không có nên crash "global is not defined" ngay khi import.
  // Map global → globalThis (chuẩn ES2020, có ở mọi trình duyệt) để thư viện chạy được.
  // Phải khai ở CẢ 2 chỗ: `define` áp cho source lúc build, còn optimizeDeps.esbuildOptions.define
  // áp cho bước PRE-BUNDLE dependency của dev server (chính là file sockjs-client.js?v=... bị lỗi).
  define: { global: 'globalThis' },
  optimizeDeps: { esbuildOptions: { define: { global: 'globalThis' } } },
  // Mặc định Vite chỉ bind theo tên "localhost" — trên nhiều máy Windows, Node phân giải
  // "localhost" ưu tiên IPv6 (::1) nên http://127.0.0.1:5173 (IPv4) không kết nối được dù cùng
  // trỏ về máy này. host:true ép Vite lắng nghe mọi địa chỉ (0.0.0.0 + ::), bao gồm cả 127.0.0.1
  // — cần thiết vì Goong Maps giới hạn domain theo đúng chuỗi "127.0.0.1:5173", khác "localhost:5173".
  server: { host: true },
  // Bản build gọi REST qua "/api" (trên Vercel do vercel.json rewrite sang BE). `vite preview` giả lập đúng rewrite đó
  // để chạy thử bản build ở máy: chuyển /api sang origin của VITE_API_URL.
  preview: {
    proxy: {
      '/api': { target: new URL(loadEnv(mode, process.cwd(), '').VITE_API_URL || 'http://localhost:8081/api').origin, changeOrigin: true },
    },
  },
}));
