import { Outlet, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import Header from './Header.jsx';
import Footer from './Footer.jsx';

/*
 * Layout chung cho mọi trang trừ Landing — Outlet là chỗ render trang con (nested route).
 * FE-7: page transition NHẸ — key={pathname} làm motion.div remount mỗi lần đổi route trong
 * layout này, tự chạy lại initial→animate (CHỈ fade, 0.25s). KHÔNG dùng
 * AnimatePresence/exit animation — tránh rủi ro layout-shift/z-index khi có nhiều Suspense
 * lồng nhau (mỗi trang lazy-load riêng), chỉ cần hiệu ứng "vào" là đủ cho yêu cầu "ngắn".
 *
 * ⚠️ KHÔNG animate x/y/scale ở đây (UI-001): Framer Motion để lại `transform` trên wrapper, mà phần tử
 * `position: fixed` nằm trong tổ tiên có `transform` sẽ bám theo tổ tiên đó thay vì khung nhìn và bị nhốt trong
 * stacking context riêng ⇒ MỌI modal/drawer `fixed` trong trang bị lệch vị trí và bị phần tử khác đè lên.
 * Chỉ dùng opacity (không tạo containing block).
 */
export default function SiteLayout() {
  const location = useLocation();
  return (
    <div className="min-h-screen flex flex-col bg-base-100 overflow-x-clip">
      <Header />
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-6">
        <motion.div key={location.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
          <Outlet />
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
