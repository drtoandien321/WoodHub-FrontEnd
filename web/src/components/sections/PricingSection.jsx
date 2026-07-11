import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSubscriptionPlans, useMySubscription, useSubscribe } from '../../hooks/useSubscription.js';
import { useAuthStore } from '../../stores/authStore.js';
import { formatVnd } from '../../utils/format.js';
import PaymentQrModal from '../subscription/PaymentQrModal.jsx';

/*
 * PricingSection — phần "Bảng giá" dùng lại ở cả /pricing lẫn /about. Đọc trực tiếp
 * SubscriptionPlanController.java (GET /subscription-plans, công khai) — KHÔNG còn nhóm cứng
 * b2c/supplier/custom như bản cũ, giờ là danh sách gói PHẲNG do admin quản lý (mục 6 tài liệu BE).
 *
 * 2 luồng chọn gói KHÁC NHAU (mục 2 tài liệu BE — Free vs trả phí đi 2 đường riêng):
 *  - price === 0  → POST /subscriptions ngay, không qua thanh toán.
 *  - price > 0    → mở PaymentQrModal (tạo payment + hiện QR + tự poll tới khi paid).
 */
export default function PricingSection() {
  const { data: plans, isLoading } = useSubscriptionPlans();
  const { token } = useAuthStore();
  const { data: mySub } = useMySubscription({ enabled: !!token });
  const subscribe = useSubscribe();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [toast, setToast] = useState('');
  const [payingPlan, setPayingPlan] = useState(null); // { id, displayName } | null khi đang mở QR

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // Gói đang active hiện tại của user (null nếu chưa login hoặc chưa có gói) — để highlight + disable nút
  const currentPlanId = mySub?.status === 'active' ? mySub.plan.id : null;

  const handleSelect = (plan) => {
    if (!token) {
      navigate('/login', { state: { from: location } });
      return;
    }
    if (plan.id === currentPlanId) return;
    if (plan.price === 0) {
      subscribe.mutate(plan.id, {
        onSuccess: () => showToast(t('pricing.switchedTo', { name: plan.displayName })),
        onError: (err) => showToast(err?.response?.data?.message || t('pricing.genericError')),
      });
      return;
    }
    setPayingPlan(plan);
  };

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
          {plans?.map((plan) => {
            const isCurrent = plan.id === currentPlanId;
            return (
              <div
                key={plan.id}
                className={`card bg-base-100 p-6 gap-4 flex flex-col relative rounded-3xl ${isCurrent ? 'border-2 border-primary shadow-lg' : 'border border-base-300'}`}
              >
                {isCurrent && (
                  <span className="badge badge-primary absolute -top-3 right-6">{t('pricing.currentPlan')}</span>
                )}
                <div>
                  <h3 className="font-display text-xl">{plan.displayName}</h3>
                  <p className="text-sm text-base-content/60 mt-1">{plan.description}</p>
                </div>

                <div className="flex items-baseline gap-1">
                  {plan.price === 0 ? (
                    <span className="font-display text-3xl text-primary">{t('pricing.free')}</span>
                  ) : (
                    <>
                      <span className="font-display text-3xl text-primary">{formatVnd(plan.price)}</span>
                      <span className="text-sm text-base-content/60">{t('pricing.perMonth')}</span>
                    </>
                  )}
                </div>

                <ul className="flex flex-col gap-2 flex-1">
                  {plan.displayFeatures?.map((f) => (
                    <li key={f} className="text-sm flex items-start gap-2">
                      <span className="text-success mt-0.5">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelect(plan)}
                  disabled={isCurrent || subscribe.isPending}
                  className="btn btn-primary mt-2 disabled:opacity-70"
                >
                  {isCurrent ? t('pricing.currentPlan') : t('pricing.subscribe')}
                </button>
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

      <PaymentQrModal
        open={!!payingPlan}
        planId={payingPlan?.id}
        planName={payingPlan?.displayName}
        onClose={() => setPayingPlan(null)}
      />
    </section>
  );
}
