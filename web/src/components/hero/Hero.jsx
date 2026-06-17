import { motion } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import HeroNavbar, { ArrowUpRight } from './HeroNavbar.jsx';
import HeroBadge from './HeroBadge.jsx';
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
  const navigate = useNavigate();

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
        {/* Lớp phủ NHẸ chỉ ở mép trái: đậm ~nửa trái rồi trong suốt hẳn từ ~50% trở đi
            → nội thất bên phải thấy rõ nét, chữ canh trái vẫn đủ tương phản.
            Dùng stop tường minh thay vì from/via/to để kiểm soát điểm tan biến (ivory = #f4efe6). */}
        <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,rgba(244,239,230,0.85)_0%,rgba(244,239,230,0.35)_26%,rgba(244,239,230,0)_50%)]" />
        {HERO_VIDEO_URL && (
          <video
            autoPlay muted loop playsInline
            className="absolute inset-0 w-full h-full object-cover object-[65%] lg:object-center z-0"
            src={HERO_VIDEO_URL}
          />
        )}

        {/* Content layer — bố cục canh TRÁI, nội dung căn giữa theo chiều dọc */}
        <div className="relative z-10 w-full h-full flex flex-col">
          <HeroNavbar />

          <div className="flex-1 flex items-center">
            <div className="w-full max-w-lg px-5 sm:px-8 md:px-12 lg:px-16 text-left">
              <HeroBadge />

              <motion.h1
                className="font-display text-3xl sm:text-4xl md:text-5xl lg:text-[52px] font-normal text-hero-ink mb-4 tracking-tight leading-[1.08] max-w-[13ch]"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                {t('hero.title')}
              </motion.h1>

              {/* Frosted patch: chỉ làm mờ vùng NGAY SAU đoạn mô tả (localized blur bên trái,
                  giống hình mẫu) thay vì phủ mờ cả ảnh. */}
              <motion.p
                className="text-sm md:text-[15px] text-hero-ink/80 leading-relaxed max-w-sm font-normal rounded-2xl bg-ivory/25 backdrop-blur-[3px] px-4 py-3 -ml-1"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
              >
                {t('hero.subtitle')}
              </motion.p>

              {/* Nút CTA chính — chuyển từ card góc trái cũ lên đây (theo ảnh mẫu) */}
              <motion.button
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.55 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate('/custom')}
                className="group mt-6 inline-flex items-center gap-3 rounded-full bg-hero-ink pl-6 pr-2 py-2 text-ivory cursor-pointer"
              >
                <span className="text-sm md:text-base font-normal">{t('hero.designNow')}</span>
                <span className="flex items-center justify-center w-8 h-8 rounded-full bg-ivory/20 transition-transform group-hover:rotate-12">
                  <ArrowUpRight className="w-4 h-4" />
                </span>
              </motion.button>
            </div>
          </div>

          {/* Góc khoét "Khám phá bộ sưu tập" — giữ nguyên theo yêu cầu */}
          <BottomRightCorner />
        </div>

      </section>
    </div>
  );
}
