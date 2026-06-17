import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePlans } from '../../hooks/useProducts.js';
import { useAuthStore } from '../../stores/authStore.js';
import { formatVnd } from '../../utils/format.js';

// Thứ tự nhóm hiển thị cố định — đúng 3 nhóm theo spec B.1
const GROUP_ORDER = ['b2c', 'supplier', 'custom'];
const POPULAR_GROUP = 'custom'; // gói gắn nhãn "Phổ biến"

/*
 * PricingSection — phần "Bảng giá" tách riêng để DÙNG LẠI ở cả trang /pricing
 * lẫn trang gộp /about. Mọi logic (usePlans, đăng ký) giữ nguyên như trang cũ.
 */
export default function PricingSection() {
  const { data, isLoading } = usePlans();
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [toast, setToast] = useState('');

  const groupLabels = t('pricing.groups', { returnObjects: true });

  const handleSubscribe = () => {
    if (!token) {
      navigate('/login', { state: { from: location } });
      return;
    }
    setToast(t('pricing.toastMessage'));
    setTimeout(() => setToast(''), 3000);
  };

  const groups = GROUP_ORDER.map((g) => ({
    key: g,
    ...groupLabels[g],
    plan: data?.items?.find((p) => p.group === g),
  }));

  return (
    <section>
      <div className="text-center mb-8">
        <h2 className="font-display text-3xl">{t('pricing.title')}</h2>
        <p className="text-sm text-base-content/60 mt-1 max-w-xl mx-auto">{t('pricing.subtitle')}</p>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-80 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-5 items-stretch">
          {groups.map(({ key, title, desc, features, plan }) => {
            const popular = key === POPULAR_GROUP;
            return (
              <div
                key={key}
                className={`card bg-base-100 p-6 gap-4 flex flex-col relative rounded-3xl ${popular ? 'border-2 border-primary shadow-lg' : 'border border-base-300'}`}
              >
                {popular && (
                  <span className="badge badge-primary absolute -top-3 right-6">{t('pricing.popular')}</span>
                )}
                <div>
                  <h3 className="font-display text-xl">{plan?.name ?? title}</h3>
                  <p className="text-sm text-base-content/60 mt-1">{desc}</p>
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="font-display text-3xl text-primary">{formatVnd(plan?.pricePerMonth ?? 0)}</span>
                  <span className="text-sm text-base-content/60">{t('pricing.perMonth')}</span>
                </div>

                <ul className="flex flex-col gap-2 flex-1">
                  {features?.map((f) => (
                    <li key={f} className="text-sm flex items-start gap-2">
                      <span className="text-success mt-0.5">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button onClick={handleSubscribe} className="btn btn-primary mt-2">{t('pricing.subscribe')}</button>
              </div>
            );
          })}
        </div>
      )}

      {toast && (
        <div className="toast toast-center toast-bottom z-50">
          <div className="alert alert-info">
            <span>{toast}</span>
          </div>
        </div>
      )}
    </section>
  );
}
