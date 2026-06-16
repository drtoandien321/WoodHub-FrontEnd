import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowUpRight, ChevronRight } from './HeroNavbar.jsx';

/*
 * Faux-cutout corner — "signature" của layout này.
 * Cách hoạt động: khối góc phải-dưới có nền TRÙNG MÀU trang (--color-base-100) đè lên section,
 * tạo cảm giác section bị "khoét". 2 SVG mask là 2 góc lõm cong nối khối này với
 * viền ngoài — fill của SVG dùng var(--color-base-100) để tự đổi theo theme sáng/tối.
 *
 * Phương án C (màu chữ):
 * - bg-base-100 giữ nguyên → hiệu ứng khoét đúng ở cả 2 theme
 * - Chữ/icon dùng text-base-content (tự đổi theo theme) thay vì text-hero-ink cố định
 *   → dark theme đọc được, light theme vẫn đẹp
 */
export default function BottomRightCorner() {
  const { t } = useTranslation();
  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.4 }}
      className="absolute bottom-0 right-0 p-2 pt-4 pl-5 sm:p-4 sm:pt-6 sm:pl-10 md:p-6 md:pt-8 md:pl-14 bg-base-100 rounded-tl-[1.5rem] sm:rounded-tl-[2rem] md:rounded-tl-[3.5rem] flex items-center gap-2 sm:gap-4 md:gap-6"
    >
      {/* Mask góc trên */}
      <div className="absolute -top-[1.5rem] sm:-top-[2rem] md:-top-[3.5rem] right-0 w-[1.5rem] sm:w-[2rem] md:w-[3.5rem] h-[1.5rem] sm:h-[2rem] md:h-[3.5rem] pointer-events-none">
        <svg width="100%" height="100%" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M56 56V0C56 30.9279 30.9279 56 0 56H56Z" fill="var(--color-base-100)" />
        </svg>
      </div>
      {/* Mask góc trái */}
      <div className="absolute bottom-0 -left-[1.5rem] sm:-left-[2rem] md:-left-[3.5rem] w-[1.5rem] sm:w-[2rem] md:w-[3.5rem] h-[1.5rem] sm:h-[2rem] md:h-[3.5rem] pointer-events-none">
        <svg width="100%" height="100%" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M56 56H0C30.9279 56 56 30.9279 56 0V56Z" fill="var(--color-base-100)" />
        </svg>
      </div>

      {/* Icon circle — dùng base-content để đổi theo theme */}
      <div className="bg-base-content/10 w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 rounded-full flex items-center justify-center border border-base-content/15 shrink-0">
        <ArrowUpRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-base-content/80" />
      </div>

      {/* Text — dùng base-content thay vì hero-ink cố định (Phương án C) */}
      <div className="flex flex-col">
        <span className="text-[13px] sm:text-[16px] md:text-[20px] font-normal text-base-content/95 leading-tight">{t('hero.exploreCollection')}</span>
        <Link to="/shop" className="flex items-center gap-1 text-base-content/60 cursor-pointer hover:text-base-content/80 transition-colors">
          <span className="text-[11px] sm:text-[12px] md:text-[15px] font-normal">{t('hero.viewShop')}</span>
          <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
        </Link>
      </div>
    </motion.div>
  );
}
