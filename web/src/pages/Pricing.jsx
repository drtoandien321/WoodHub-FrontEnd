import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePlans } from '../hooks/useProducts.js';
import { useAuthStore } from '../stores/authStore.js';
import { formatVnd } from '../utils/format.js';

// Thứ tự nhóm hiển thị cố định — đúng 3 nhóm theo spec B.1
const GROUP_ORDER = ['b2c', 'supplier', 'custom'];

export default function Pricing() {
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
    <div className="flex flex-col gap-8">
      <div className="text-center">
        <h1 className="font-display text-3xl">{t('pricing.title')}</h1>
        <p className="text-sm text-base-content/60 mt-1">{t('pricing.subtitle')}</p>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-3 gap-5">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-80 rounded-2xl" />)}
        </div>
      ) : (
        <div className="grid md:grid-cols-3 gap-5">
          {groups.map(({ key, title, desc, plan }) => (
            <div key={key} className="card bg-base-100 border border-base-300 p-6 gap-4 flex flex-col">
              <div>
                <h2 className="font-display text-xl">{plan?.name ?? title}</h2>
                <p className="text-sm text-base-content/60 mt-1">{desc}</p>
              </div>

              <div className="flex items-baseline gap-1">
                <span className="font-display text-3xl text-primary">{formatVnd(plan?.pricePerMonth ?? 0)}</span>
                <span className="text-sm text-base-content/60">{t('pricing.perMonth')}</span>
              </div>

              <ul className="flex flex-col gap-2 flex-1">
                {plan?.features?.map((f) => (
                  <li key={f} className="text-sm flex items-start gap-2">
                    <span className="text-success mt-0.5">✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button onClick={handleSubscribe} className="btn btn-primary mt-2">{t('pricing.subscribe')}</button>
            </div>
          ))}
        </div>
      )}

      {toast && (
        <div className="toast toast-center toast-bottom z-50">
          <div className="alert alert-info">
            <span>{toast}</span>
          </div>
        </div>
      )}
    </div>
  );
}
