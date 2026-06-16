import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/*
 * Trang giới thiệu B2B — chưa có flow đặt hàng số lượng lớn thật (ngoài scope MVP).
 * Mục tiêu: cho khách doanh nghiệp hiểu giá trị + dẫn về /register để tạo tài khoản trước.
 */
export default function B2b() {
  const { t } = useTranslation();
  const steps = t('b2b.steps', { returnObjects: true });

  return (
    <div className="flex flex-col gap-12">
      {/* Hero nhỏ */}
      <section className="card bg-base-200 border border-base-300 p-8 md:p-12 text-center gap-4">
        <h1 className="font-display text-3xl md:text-4xl">{t('b2b.heroTitle')}</h1>
        <p className="text-base-content/70 max-w-2xl mx-auto">{t('b2b.heroDesc')}</p>
        <Link to="/register?type=business" className="btn btn-primary self-center mt-2">{t('b2b.ctaRegister')}</Link>
      </section>

      {/* 3 bước hoạt động */}
      <section>
        <h2 className="font-display text-2xl text-center mb-8">{t('b2b.stepsTitle')}</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {steps.map((s) => (
            <div key={s.step} className="card bg-base-100 border border-base-300 p-6 gap-3">
              <span className="w-10 h-10 rounded-full bg-primary text-primary-content flex items-center justify-center font-display text-lg">
                {s.step}
              </span>
              <h3 className="font-medium text-lg">{s.title}</h3>
              <p className="text-sm text-base-content/70">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA cuối trang */}
      <section className="card bg-base-200 border border-base-300 p-8 text-center gap-3">
        <h2 className="font-display text-2xl">{t('b2b.ctaTitle')}</h2>
        <p className="text-base-content/70">{t('b2b.ctaDesc')}</p>
        <Link to="/register?type=business" className="btn btn-primary self-center mt-1">{t('b2b.ctaRegister')}</Link>
      </section>
    </div>
  );
}
