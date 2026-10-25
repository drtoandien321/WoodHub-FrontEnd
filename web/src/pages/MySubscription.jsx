import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  useMySubscription, useMyUsage, useMyPayments, useCancelSubscription, useCreditPacks, usableCount,
} from '../hooks/useSubscription.js';
import PaymentQrModal from '../components/subscription/PaymentQrModal.jsx';
import CreditPackPaymentModal from '../components/subscription/CreditPackPaymentModal.jsx';
import { formatVnd, formatDate } from '../utils/format.js';
import { apiErrorMessage } from '../utils/apiError.js';

// Enum UsageFeature hiển thị (nhãn ở i18n mySub.features.*). ar_3d đã bỏ: AR dùng Scene Viewer free, BE không còn trả trong /usage/me.
const SHOWN_FEATURES = new Set(['ai_chat', 'design', 'export', 'retexture']); // retexture: đổi chất liệu AI (BE-05)

// PaymentResponse chỉ có planName cho gói đăng ký → nhãn theo purpose cho các loại khác
const paymentLabel = (p, t) =>
  p.purpose === 'credit_pack' ? t('mySub.payCreditPack') : p.purpose === 'order' ? t('mySub.payOrder') : (p.planName ?? t('mySub.paySubscription'));

// Màu badge theo trạng thái payment; nhãn ở i18n mySub.paymentStatus.*
const PAYMENT_STATUS_CLS = { pending: 'badge-warning', paid: 'badge-success', failed: 'badge-error', expired: 'badge-ghost' };

/*
 * MySubscription (/account/subscription) — gói đang dùng + hạn mức tháng này + lịch sử thanh
 * toán, đúng mục 3+4 tài liệu Subscription. endDate === null nghĩa là gói VÔ THỜI HẠN (free) —
 * xem UserSubscriptionResponse; KHÔNG được hiểu nhầm thành "chưa có ngày hết hạn = lỗi dữ liệu".
 */
export default function MySubscription() {
  const { t } = useTranslation();
  const { data: mySub, isLoading } = useMySubscription();
  const { data: usage, isLoading: usageLoading } = useMyUsage();
  const { data: payments } = useMyPayments();
  const { data: creditPacks = [] } = useCreditPacks();
  const [buyingPack, setBuyingPack] = useState(null); // CreditPackResponse đang mua
  const cancel = useCancelSubscription();
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [renewing, setRenewing] = useState(false); // mở modal thanh toán để gia hạn
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleCancel = () => {
    cancel.mutate(undefined, {
      onSuccess: () => { setConfirmingCancel(false); showToast(t('mySub.cancelled')); },
      onError: (err) => { setConfirmingCancel(false); showToast(apiErrorMessage(err, t('mySub.genericError'))); },
    });
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <h1 className="font-display text-3xl">{t('mySub.title')}</h1>

      {/* ===== Gói đang dùng ===== */}
      {isLoading ? (
        <div className="skeleton h-40 rounded-2xl" />
      ) : !mySub ? (
        <div className="rounded-2xl border border-base-300 bg-base-100 p-6 text-center">
          <p className="text-base-content/70 mb-3">{t('mySub.noPlan')}</p>
          <Link to="/pricing" className="btn btn-primary btn-sm">{t('mySub.choosePlan')}</Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-base-300 bg-base-100 p-6 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-xl">{mySub.plan.displayName}</h2>
              <p className="text-sm text-base-content/70 mt-1">
                {mySub.plan.price === 0 ? t('mySub.free') : t('mySub.perMonth', { price: formatVnd(mySub.plan.price) })}
              </p>
            </div>
            <span className="badge badge-primary">{t('mySub.active')}</span>
          </div>

          <p className="text-sm text-base-content/70">
            {mySub.endDate ? t('mySub.validUntil', { date: formatDate(mySub.endDate) }) : t('mySub.noExpiry')}
          </p>

          {mySub.plan.price > 0 && (
            <div className="flex gap-2 mt-2">
              {/* Gia hạn = thanh toán lại ĐÚNG gói đang dùng (BE không còn tự cộng hạn — AUD-002); webhook cộng dồn +1 tháng */}
              <button onClick={() => setRenewing(true)} className="btn btn-outline btn-sm">{t('mySub.renew')}</button>
              {confirmingCancel ? (
                <>
                  <button onClick={handleCancel} disabled={cancel.isPending} className="btn btn-error btn-sm">
                    {cancel.isPending ? <span className="loading loading-spinner loading-xs" /> : t('mySub.confirmCancel')}
                  </button>
                  <button onClick={() => setConfirmingCancel(false)} className="btn btn-ghost btn-sm">{t('mySub.keep')}</button>
                </>
              ) : (
                <button onClick={() => setConfirmingCancel(true)} className="btn btn-ghost btn-sm text-error">{t('mySub.cancelPlan')}</button>
              )}
            </div>
          )}

          <Link to="/pricing" className="text-sm link link-primary mt-1">{t('mySub.changePlan')}</Link>
        </div>
      )}

      {/* ===== Hạn mức dùng tháng này ===== */}
      <div className="rounded-2xl border border-base-300 bg-base-100 p-6">
        <h2 className="font-display text-lg mb-3">{t('mySub.usageTitle')}</h2>
        {usageLoading ? (
          <div className="flex flex-col gap-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-8 rounded-lg" />)}</div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {usage?.filter((u) => SHOWN_FEATURES.has(u.feature)).map((u) => {
              // Hết lượt THẬT chỉ khi cả hạn mức tháng lẫn ví lượt đã mua đều = 0 (BE trừ tháng trước, rồi tới ví)
              const exhausted = usableCount(u) === 0;
              return (
                <div key={u.feature} className="flex flex-wrap items-center justify-between gap-x-3 text-sm">
                  <span>{t(`mySub.features.${u.feature}`)}</span>
                  <span className={exhausted ? 'text-error font-medium' : 'text-base-content/70'}>
                    {u.unlimited ? t('mySub.unlimited') : t('mySub.usageLine', { used: u.used, limit: u.limit, remaining: u.remaining })}
                    {u.purchasedRemaining != null && u.purchasedRemaining > 0 && (
                      <span className="ml-1 text-success">· {t('mySub.purchased', { count: u.purchasedRemaining })}</span>
                    )}
                  </span>
                </div>
              );
            })}
            <p className="mt-1 text-xs text-base-content/70">{t('mySub.usageNote')}</p>
          </div>
        )}
      </div>

      {/* ===== Mua thêm lượt thiết kế (credit pack) ===== */}
      {creditPacks.length > 0 && (
        <div className="rounded-2xl border border-base-300 bg-base-100 p-6">
          <h2 className="font-display text-lg">{t('mySub.buyCreditsTitle')}</h2>
          <p className="mt-1 mb-4 text-sm text-base-content/70">{t('mySub.buyCreditsDesc')}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {creditPacks.map((pack) => (
              <div key={pack.id} className="flex flex-col gap-2 rounded-xl border border-base-300 p-4">
                <p className="font-medium">{pack.displayName}</p>
                <p className="text-sm text-base-content/70">
                  {t('mySub.packLine', { credits: pack.credits, unit: formatVnd(Math.round(pack.price / pack.credits)) })}
                </p>
                <div className="mt-auto flex items-center justify-between gap-2">
                  <span className="font-semibold text-primary">{formatVnd(pack.price)}</span>
                  <button onClick={() => setBuyingPack(pack)} className="btn btn-primary btn-sm">{t('mySub.buy')}</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== Lịch sử thanh toán ===== */}
      {payments?.length > 0 && (
        <div className="rounded-2xl border border-base-300 bg-base-100 p-6">
          <h2 className="font-display text-lg mb-3">{t('mySub.historyTitle')}</h2>
          <div className="flex flex-col gap-2">
            {payments.map((p) => {
              const meta = { label: t(`mySub.paymentStatus.${p.status}`, { defaultValue: p.status }), cls: PAYMENT_STATUS_CLS[p.status] ?? 'badge-ghost' };
              return (
                <div key={p.id} className="flex items-center justify-between text-sm border-b border-base-200 last:border-0 pb-2 last:pb-0">
                  <div>
                    <p className="font-medium">{paymentLabel(p, t)}</p>
                    <p className="text-xs text-base-content/70">{formatDate(p.createdAt)}</p>
                  </div>
                  <div className="text-right">
                    <p>{formatVnd(p.amount)}</p>
                    <span className={`badge badge-sm ${meta.cls}`}>{meta.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {toast && (
        <div className="toast toast-center toast-bottom z-50">
          <div className="alert alert-info"><span>{toast}</span></div>
        </div>
      )}

      <PaymentQrModal
        open={renewing}
        plan={mySub?.plan}
        subscription={mySub}
        onClose={() => setRenewing(false)}
      />
      {buyingPack && <CreditPackPaymentModal key={buyingPack.id} pack={buyingPack} onClose={() => setBuyingPack(null)} />}
    </div>
  );
}
