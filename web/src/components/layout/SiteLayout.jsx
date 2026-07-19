import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import Header from './Header.jsx';
import Footer from './Footer.jsx';

/*
 * Layout chung cho mọi trang trừ Landing — Outlet là chỗ render trang con (nested route).
 * FE-7: page transition NHẸ — key={pathname} làm motion.div remount mỗi lần đổi route trong
 * layout này, tự chạy lại initial→animate (fade + trượt lên nhẹ 6px, 0.25s). KHÔNG dùng
 * AnimatePresence/exit animation — tránh rủi ro layout-shift/z-index khi có nhiều Suspense
 * lồng nhau (mỗi trang lazy-load riêng), chỉ cần hiệu ứng "vào" là đủ cho yêu cầu "ngắn".
 */
export default function SiteLayout() {
  const location = useLocation();
  return (
    <div className="min-h-screen flex flex-col bg-base-100 overflow-x-clip">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-6">
        <motion.div key={location.pathname} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
          <Outlet />
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
