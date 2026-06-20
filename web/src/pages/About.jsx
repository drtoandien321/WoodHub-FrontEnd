import { Fragment } from 'react';
import { useTranslation } from 'react-i18next';
import PricingSection from '../components/sections/PricingSection.jsx';
import ContactSection from '../components/sections/ContactSection.jsx';

/*
 * About — trang GỘP 3 chức năng vào 1: Câu chuyện thương hiệu + Giá trị cốt lõi +
 * Bảng giá + Liên hệ (theo yêu cầu "gộp menu Giới thiệu lại").
 * Bảng giá & Liên hệ tái dùng PricingSection / ContactSection (trang /pricing, /contact
 * cũng dùng đúng các section này nên không trùng lặp logic).
 */
export default function About() {
  const { t } = useTranslation();
  const paragraphs = t('about.paragraphs', { returnObjects: true });
  const values = t('about.values', { returnObjects: true });
  const timeline = t('about.timeline', { returnObjects: true });

  return (
    <div className="flex flex-col gap-16 md:gap-20 py-4">
      {/* 1. CÂU CHUYỆN THƯƠNG HIỆU — 2 cột: chữ trái, ảnh + timeline phải */}
      <section className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
        <div className="flex flex-col gap-4">
          <h1 className="font-display text-4xl md:text-5xl leading-[1.1]">{t('about.title')}</h1>
          <div className="w-16 h-px bg-primary/40" />
          {paragraphs.map((p, i) => (
            <p key={i} className="text-base-content/80 leading-relaxed">{p}</p>
          ))}
          <span className="font-display italic text-2xl text-primary/70 mt-1">WoodHub</span>
        </div>

        {/* Khối ảnh xưởng mộc thật + panel kính timeline đè lên */}
        <div className="relative border border-base-300 rounded-3xl min-h-[340px] md:min-h-[420px] p-6 flex items-end overflow-hidden">
          <img src="/about/about-1.png" alt="Xưởng mộc WoodHub" className="absolute inset-0 w-full h-full object-cover" />
          {/* Lớp tối nhẹ ở đáy giúp panel timeline nổi rõ trên ảnh */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/25 via-transparent to-transparent" />
          <div className="relative w-full rounded-2xl bg-base-100/80 backdrop-blur-md border border-white/40 p-5 flex items-center gap-2">
            {/* key dùng index vì year có thể trùng (vd 2 mốc cùng 06/2026).
                Vòng tròn hiển thị THÁNG (phần trước dấu "/"), bên dưới là đủ tháng/năm + nhãn. */}
            {timeline.map((m, i) => (
              <Fragment key={i}>
                {i > 0 && <div className="flex-1 border-t border-dashed border-base-content/30 mb-6" />}
                <div className="flex flex-col items-center text-center gap-1 flex-1">
                  <span className="w-11 h-11 rounded-full bg-primary/15 text-primary flex items-center justify-center font-display text-sm shrink-0">
                    {m.year.split('/')[0]}
                  </span>
                  <span className="font-medium text-sm">{m.year}</span>
                  <span className="text-xs text-base-content/60 leading-snug">{m.label}</span>
                </div>
              </Fragment>
            ))}
          </div>
        </div>
      </section>

      {/* 2. GIÁ TRỊ CỐT LÕI */}
      <section>
        <h2 className="font-display text-3xl text-center mb-8">{t('about.valuesTitle')}</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {values.map((v) => (
            <div key={v.title} className="card bg-base-200 border border-base-300 rounded-2xl p-6 gap-3">
              <span className="w-12 h-12 rounded-full bg-primary/15 text-primary flex items-center justify-center text-xl shrink-0">●</span>
              <h3 className="font-medium text-lg">{v.title}</h3>
              <p className="text-sm text-base-content/70">{v.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 3. BẢNG GIÁ — ảnh nền FULL chiều ngang màn hình (full-bleed):
          w-screen + ml-[calc(50%-50vw)] "phá" giới hạn max-w-7xl của SiteLayout để tràn 2 mép.
          Nội dung (thẻ giá) vẫn gói trong max-w-7xl để canh thẳng với các section khác. */}
      <section className="relative w-screen ml-[calc(50%-50vw)] overflow-hidden border-y border-base-300">
        <img src="/about/about-2.png" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-base-100/10" />
        <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-12 md:py-16">
          <PricingSection />
        </div>
      </section>

      {/* 4. LIÊN HỆ */}
      <ContactSection />
    </div>
  );
}
