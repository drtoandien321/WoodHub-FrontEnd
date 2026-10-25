import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../stores/authStore.js';

/*
 * Trang giới thiệu B2B — chưa có flow đặt hàng số lượng lớn thật (ngoài scope MVP).
 * Mục tiêu: cho khách doanh nghiệp hiểu giá trị + dẫn về /register để tạo tài khoản trước.
 *
 * CTA đổi theo người đang xem (lỗi QA 20/10: tài khoản doanh nghiệp đã đăng nhập vẫn bị mời "Đăng ký"):
 *   - khách vãng lai          → đăng ký tài khoản doanh nghiệp
 *   - customer business       → mua sắm + hồ sơ công ty
 *   - customer cá nhân        → tạo hồ sơ công ty ở /profile#business (BE tự nâng tài khoản lên business khi tạo)
 *   - supplier/admin          → không hiện CTA (trang chỉ để giới thiệu)
 */
function B2bCta({ className }) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return <Link to="/register?type=business" className={`btn btn-primary self-center ${className}`}>{t('b2b.ctaRegister')}</Link>;
  }
  if (user.role !== 'customer') return null;
  if (user.customerType === 'business') {
    return (
      <div className={`flex flex-wrap justify-center gap-3 ${className}`}>
        <Link to="/shop" className="btn btn-primary">{t('b2b.ctaShop')}</Link>
        <Link to="/profile#business" className="btn btn-outline">{t('b2b.ctaCompanyProfile')}</Link>
      </div>
    );
  }
  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <p className="text-sm text-base-content/70">{t('b2b.individualNote')}</p>
      <Link to="/profile#business" className="btn btn-primary">{t('b2b.ctaUpgrade')}</Link>
    </div>
  );
}
export default function B2b() {
  const { t } = useTranslation();
  const steps = t('b2b.steps', { returnObjects: true });

  return (
    <div className="flex flex-col gap-12">
      {/* Hero nhỏ */}
      <section className="card bg-base-200 border border-base-300 p-8 md:p-12 text-center gap-4">
        <h1 className="font-display text-3xl md:text-4xl">{t('b2b.heroTitle')}</h1>
        <p className="text-base-content/70 max-w-2xl mx-auto">{t('b2b.heroDesc')}</p>
        <B2bCta className="mt-2" />
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
        <B2bCta className="mt-1" />
      </section>
    </div>
  );
}
