import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'motion/react';
import App from './App.jsx';
import './i18n/index.js';
import './index.css';

/*
 * QueryClient: bộ não của React Query — quản lý cache mọi "server state".
 * staleTime 60s: dữ liệu coi là "tươi" trong 60s, không refetch thừa khi đổi trang.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, retry: 1 },
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/*
     * MotionConfig reducedMotion="user": Framer Motion animate bằng JS (transform/opacity qua
     * WAAPI), KHÔNG phải CSS transition/animation nên rule @media (prefers-reduced-motion) ở
     * index.css KHÔNG chặn được — đây là cơ chế CHÍNH THỐNG để mọi <motion.*> trong app tự tắt/
     * rút gọn animation khi user bật cờ này ở hệ điều hành (mục I.8 + FE-7 "tôn trọng prefers-
     * reduced-motion" — 1 chỗ áp dụng toàn app, không phải tự kiểm tra ở từng component).
     */}
    <MotionConfig reducedMotion="user">
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </MotionConfig>
  </React.StrictMode>
);
