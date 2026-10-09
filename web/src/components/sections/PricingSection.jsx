import { useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSubscriptionPlans, useMySubscription, useSubscribe } from '../../hooks/useSubscription.js';
import { useAuthStore } from '../../stores/authStore.js';
import { formatVnd } from '../../utils/format.js';
import { planComparison } from '../../utils/planFeatures.js';
import PaymentQrModal from '../subscription/PaymentQrModal.jsx';
import PlanFeatureList from '../subscription/PlanFeatureList.jsx';

const COLLAPSED = 4; // trên mobile chỉ hiện 4 dòng đầu, còn lại bấm "Xem thêm"

/*
 * PricingSection — "Bảng giá" dùng ở /pricing và /about. Dữ liệu từ GET /subscription-plans (công khai); quyền lợi được
 * DỰNG TỪ `featureLimits` (hạn mức BE thực sự thực thi) + dòng marketing `displayFeatures` của admin — xem utils/planFeatures.js.
 *
 * 2 luồng chọn gói KHÁC NHAU (mục 2 tài liệu BE):
 *  - price === 0 → POST /subscriptions ngay, không qua thanh toán.
 *  - price > 0   → mở PaymentQrModal (tạo payment + hiện QR + tự poll tới khi paid).
 *
 * "Gói đang dùng": user đăng nhập mà KHÔNG có gói active được coi là đang dùng gói Free — đúng với hạn mức thật
 * (BE rơi về hạn mức Free khi không có gói active, AUD-003).
 */
export default function PricingSection() {
  const { data: plans, isLoading, isError, refetch } = useSubscriptionPlans();
  const { token } = useAuthStore();
  const { data: mySub } = useMySubscription({ enabled: !!token });
  const subscribe = useSubscribe();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const [toast, setToast] = useState('');
  const [payingPlan, setPayingPlan] = useState(null); // plan đang mở modal QR
  const [expandedId, setExpandedId] = useState(null); // card đang mở rộng danh sách quyền lợi (mobile)

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const comparison = useMemo(() => planComparison(plans), [plans]);
  const freePlan = comparison.find((c) => Number(c.plan.price) === 0)?.plan;
  const hasPaidActive = mySub?.status === 'active' && Number(mySub.plan?.price) > 0;

  // undefined khi chưa biết (đang tải gói của user) — không đánh dấu nhầm
  let currentPlanId;
  if (!token) currentPlanId = null;
  else if (mySub === undefined) currentPlanId = undefined;
  else currentPlanId = mySub?.status === 'active' ? mySub.plan.id : (freePlan?.id ?? null);

  const handleSelect = (plan) => {
    if (!token) {
      navigate('/login', { state: { from: location } });
      return;
    }
    if (plan.id === currentPlanId) return;
    if (Number(plan.price) === 0) {
      // Chuyển từ gói trả phí về Free huỷ gói ngay, không hoàn thời gian còn lại → xác nhận trước
      if (hasPaidActive && !window.confirm(t('pricing.confirmDowngrade'))) return;
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
      {/* Tiêu đề nằm trên ảnh nền ở /about → đặt trên nền mờ để đủ tương phản cả sáng/tối */}
      <div className="mb-8 text-center">
        <div className="inline-block max-w-xl rounded-2xl bg-base-100/85 px-6 py-4 shadow-sm backdrop-blur-sm">
          <h2 className="font-display text-3xl">{t('pricing.title')}</h2>
          <p className="mt-1 text-sm text-base-content/75">{t('pricing.subtitle')}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid gap-5 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-80 rounded-3xl" />)}
        </div>
      ) : isError ? (
        <div className="mx-auto max-w-md rounded-2xl bg-base-100/90 p-6 text-center">
          <p className="text-sm text-error">{t('pricing.loadError')}</p>
          <button onClick={() => refetch()} className="btn btn-outline btn-sm mt-3">{t('pricing.retry')}</button>
        </div>
      ) : !comparison.length ? (
        <p className="mx-auto max-w-md rounded-2xl bg-base-100/90 p-6 text-center text-sm text-base-content/70">{t('pricing.noPlans')}</p>
      ) : (
        <div className="grid items-stretch gap-5 md:grid-cols-3">
          {comparison.map(({ plan, inheritFrom, rows, extras }) => {
            const isCurrent = plan.id === currentPlanId;
            const items = [...rows.map((r) => ({ type: 'row', ...r })), ...extras.map((text) => ({ type: 'text', text }))];
            const expanded = expandedId === plan.id;
            return (
              <div
                key={plan.id}
                className={`card relative flex h-full flex-col gap-4 rounded-3xl bg-base-100 p-6 ${isCurrent ? 'border-2 border-primary shadow-lg' : 'border border-base-300'}`}
              >
                {isCurrent && <span className="badge badge-primary absolute -top-3 right-6">{t('pricing.currentPlan')}</span>}
                <div>
                  <h3 className="font-display text-xl">{plan.displayName}</h3>
                  {plan.description && <p className="mt-1 text-sm text-base-content/70">{plan.description}</p>}
                </div>

                <div className="flex items-baseline gap-1">
                  {Number(plan.price) === 0 ? (
                    <span className="font-display text-3xl text-primary">{t('pricing.free')}</span>
                  ) : (
                    <>
                      <span className="font-display text-3xl text-primary">{formatVnd(plan.price)}</span>
                      <span className="text-sm text-base-content/60">{t('pricing.perMonth')}</span>
                    </>
                  )}
                </div>

                <div className="flex-1">
                  {inheritFrom && <p className="mb-2 text-sm font-medium text-base-content/80">{t('pricing.inheritFrom', { name: inheritFrom.displayName })}</p>}
                  <PlanFeatureList items={items} collapsedCount={COLLAPSED} expanded={expanded} collapseOnlyOnMobile />
                  {items.length > COLLAPSED && (
                    <button
                      type="button"
                      onClick={() => setExpandedId(expanded ? null : plan.id)}
                      className="mt-2 text-xs font-medium text-primary hover:underline md:hidden"
                      aria-expanded={expanded}
                    >
                      {expanded ? t('pricing.showLess') : t('pricing.showMore', { count: items.length - COLLAPSED })}
                    </button>
                  )}
                </div>

                <button
                  onClick={() => handleSelect(plan)}
                  disabled={isCurrent || subscribe.isPending}
                  className={`btn mt-2 ${isCurrent ? 'btn-outline disabled:border-primary/40! disabled:bg-primary/10! disabled:text-primary! disabled:opacity-100' : 'btn-primary'}`}
                >
                  {isCurrent ? t('pricing.inUse') : t('pricing.subscribe')}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {toast && (
        <div className="toast toast-center toast-bottom z-50">
          <div className="alert alert-info"><span>{toast}</span></div>
        </div>
      )}

      <PaymentQrModal open={!!payingPlan} plan={payingPlan} subscription={mySub ?? null} onClose={() => setPayingPlan(null)} />
    </section>
  );
}
