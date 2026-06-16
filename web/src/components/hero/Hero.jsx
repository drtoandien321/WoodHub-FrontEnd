import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import HeroNavbar from './HeroNavbar.jsx';
import HeroBadge from './HeroBadge.jsx';
import BottomLeftCard from './BottomLeftCard.jsx';
import BottomRightCorner from './BottomRightCorner.jsx';

/*
 * Hero — section tĩnh, normal flow (đã BỎ hiệu ứng sticky scroll).
 *
 * Trước đây hero bọc trong scrollContainer cao 200vh + 1 lớp sticky để tạo
 * hiệu ứng chữ fade khi cuộn. Cách đó để lại 1 vùng trống dài giữa hero và
 * section kế tiếp. Theo yêu cầu, hero giờ chỉ là 1 khối cao ~88vh nằm trong
 * luồng bình thường → cuộn xuống là gặp ngay section "3 luồng chính",
 * khoảng cách do padding của section đó quyết định (hài hòa, không hụt).
 *
 * Card ảnh + 2 card góc vẫn giữ animation "xuất hiện" riêng (initial/animate),
 * không liên quan tới scroll nên không bị ảnh hưởng.
 */

const HERO_VIDEO_URL = ''; // TODO: điền URL video .mp4 cảnh gỗ/xưởng của team
const HERO_IMAGE_URL = '/hero/living-room-3d.png';

export default function Hero() {
  const { t } = useTranslation();

  return (
    <div className="w-full flex items-center justify-center p-3 md:p-5 bg-base-100">
      {/* h-[88vh]: chừa 1 dải nhỏ cuối màn hình để người dùng biết còn nội dung phía dưới */}
      <section className="relative w-full max-w-[1536px] h-[88vh] min-h-[600px] rounded-[1.5rem] md:rounded-[3rem] overflow-hidden flex flex-col items-center bg-white/10">

        {/* Lớp nền: gradient vân gỗ dự phòng */}
        <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_70%_20%,#e8d9bf_0%,#cdab7e_45%,#9a6f47_100%)]" />
        {/* Ảnh phối cảnh 3D */}
        <img
          src={HERO_IMAGE_URL}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center z-0"
        />
        {/* Lớp phủ mờ phía trên — giữ chữ dễ đọc */}
        <div className="absolute inset-0 z-0 bg-gradient-to-b from-ivory/85 via-ivory/35 to-transparent" />
        {HERO_VIDEO_URL && (
          <video
            autoPlay muted loop playsInline
            className="absolute inset-0 w-full h-full object-cover object-[65%] lg:object-center z-0"
            src={HERO_VIDEO_URL}
          />
        )}

        {/* Content layer */}
        <div className="relative z-10 w-full h-full flex flex-col items-center">
          <HeroNavbar />

          <div className="w-full flex flex-col items-center pt-6 sm:pt-8 px-4 sm:px-6 text-center max-w-5xl">
            <HeroBadge />

            <motion.h1
              className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-[80px] font-normal text-hero-ink mb-2 tracking-tight leading-[1.05] w-full"
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

          {/* 2 card góc */}
          <BottomLeftCard />
          <BottomRightCorner />
        </div>

      </section>
    </div>
  );
}
