import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Tailwind v4 dùng plugin Vite riêng (không cần tailwind.config.js + postcss như v3)
export default defineConfig({
  plugins: [react(), tailwindcss()],
});
