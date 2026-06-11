import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import HeroNavbar from './HeroNavbar.jsx';
import HeroBadge from './HeroBadge.jsx';
import BottomLeftCard from './BottomLeftCard.jsx';
import BottomRightCorner from './BottomRightCorner.jsx';

/*
 * Hero — giữ nguyên layout/animation từ spec RIVR, đổi sang brand WoodHub.
 * Khối nền (gradient + ảnh 3D) bên trong KHÔNG đổi theo theme (luôn ấm/sáng), nên chữ/icon
 * đặt trên nó dùng token cố định `hero-ink` (định nghĩa ở index.css). Nền ngoài cùng
 * (`bg-base-100`) thì đổi theo theme — xem thêm BottomRightCorner.jsx.
 * - video DeFi → đặt qua HERO_VIDEO_URL (đang để trống → tự fallback sang ảnh/gradient gỗ).
 *   Khi team có video xưởng gỗ/sản phẩm: chỉ cần điền URL vào hằng số dưới.
 */
const HERO_VIDEO_URL = ''; // TODO: điền URL video .mp4 cảnh gỗ/xưởng của team
const HERO_IMAGE_URL = '/hero/living-room-3d.png'; // ảnh phối cảnh 3D phòng khách nội thất gỗ

export default function Hero() {
  const { t } = useTranslation();
  return (
    <div className="w-full h-screen flex items-center justify-center p-3 md:p-5 bg-base-100">
      <section className="relative w-full max-w-[1536px] h-full rounded-[1.5rem] md:rounded-[3rem] overflow-hidden shadow-none flex flex-col items-center bg-white/10 group">
        {/* Lớp nền: gradient vân gỗ làm nền dự phòng, ảnh 3D phủ lên trên */}
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_70%_20%,#e8d9bf_0%,#cdab7e_45%,#9a6f47_100%)]" />
        <img
          src={HERO_IMAGE_URL}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center z-0"
        />
        {/* Lớp phủ mờ phía trên — giữ chữ tiêu đề dễ đọc trên ảnh */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-ivory/85 via-ivory/35 to-transparent" />
        {HERO_VIDEO_URL && (
          <video
            autoPlay
            muted
            loop
            playsInline
            className="absolute inset-0 w-full h-full object-cover object-[65%] lg:object-center z-0"
            src={HERO_VIDEO_URL}
          />
        )}

        {/* Content layer */}
        <div className="relative z-10 w-full h-full flex flex-col items-center">
          <HeroNavbar />

          <div className="w-full flex flex-col items-center pt-8 px-6 text-center max-w-4xl">
            <HeroBadge />

            <motion.h1
              className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[80px] font-normal text-hero-ink mb-2 tracking-tight leading-[1.05]"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              {t('hero.title')}
            </motion.h1>

            <motion.p
              className="text-sm sm:text-base md:text-lg text-hero-ink opacity-80 leading-relaxed max-w-xl font-normal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {t('hero.subtitle')}
            </motion.p>
          </div>

          <BottomLeftCard />
          <BottomRightCorner />
        </div>
      </section>
    </div>
  );
}
