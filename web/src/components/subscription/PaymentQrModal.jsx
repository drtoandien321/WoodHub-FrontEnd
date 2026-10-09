import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useCreateSubscriptionPayment, usePayment } from '../../hooks/useSubscription.js';
import { formatVnd, formatDate } from '../../utils/format.js';
import { formatDay } from '../../utils/quoteSummary.js';
import { planHighlights, planValidity } from '../../utils/planFeatures.js';
import PlanFeatureList from './PlanFeatureList.jsx';
import { X } from '../suppliers/icons.jsx';

const COLLAPSED = 3; // số quyền lợi hiện khi chưa bấm "Xem tất cả"
const FOCUSABLE = 'a[href],button:not([disabled]),textarea,input,select,[tabindex]:not([tabindex="-1"])';

/*
 * PaymentQrModal — thanh toán VietQR/SePay cho gói TRẢ PHÍ (luồng mục 2B tài liệu BE):
 *  1. Mở modal → tạo payment (POST /payments/subscription) → nhận qrUrl.
 *  2. Hiện QR, POLL GET /payments/{id} mỗi 4s tới khi status khác "pending" (xem usePayment).
 *  3. "paid" → BE đã TỰ kích hoạt gói qua webhook SePay — FE chỉ invalidate mySubscription, KHÔNG gọi POST /subscriptions.
 *  4. "expired" → cho tạo mã mới (gọi lại bước 1).
 * Props: `plan` (object gói đầy đủ, cần id/displayName/price/featureLimits), `subscription` (gói đang dùng, để ước tính hạn mới).
 *
 * UI-001: modal render qua PORTAL vào document.body — không phụ thuộc tổ tiên có `transform`/`filter` (làm `fixed` bám sai
 * chỗ và bị phần tử khác đè). Truy cập: Esc đóng, khoá focus trong modal, trả focus khi đóng, aria-labelledby, khoá cuộn nền.
 * KHÔNG đụng tới logic tạo QR / số tiền / nội dung chuyển khoản (chỉ hiển thị những gì BE trả).
 */
export default function PaymentQrModal({ open, plan, subscription = null, onClose }) {
  const { t, i18n } = useTranslation();
  const [paymentId, setPaymentId] = useState(null);
  const [showAll, setShowAll] = useState(false);
  const createPayment = useCreateSubscriptionPayment();
  const { data: payment } = usePayment(paymentId);
  const qc = useQueryClient();
  const titleId = useId();
  const dialogRef = useRef(null);
  const planId = plan?.id;
  // onClose đổi identity mỗi lần cha render — giữ trong ref để effect khoá focus/Esc KHÔNG chạy lại (sẽ làm nhảy focus)
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Tạo payment mới mỗi khi modal mở cho 1 gói (hoặc khi bấm "Tạo mã mới")
  const startPayment = () => {
    setPaymentId(null);
    createPayment.reset();
    createPayment.mutate(planId, { onSuccess: (res) => setPaymentId(res.id) });
  };

  useEffect(() => {
    if (open && planId) { setShowAll(false); startPayment(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, planId]);

  useEffect(() => {
    if (payment?.status === 'paid') {
      qc.invalidateQueries({ queryKey: ['mySubscription'] });
      qc.invalidateQueries({ queryKey: ['mySubscriptionHistory'] });
      qc.invalidateQueries({ queryKey: ['myUsage'] });
    }
  }, [payment?.status, qc]);

  // Truy cập: Esc, bẫy Tab, trả focus, khoá cuộn nền
  useEffect(() => {
    if (!open) return undefined;
    const previouslyFocused = document.activeElement;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); onCloseRef.current(); return; }
      if (e.key !== 'Tab' || !dialogRef.current) return;
      const nodes = [...dialogRef.current.querySelectorAll(FOCUSABLE)].filter((n) => n.offsetParent !== null);
      if (!nodes.length) { e.preventDefault(); return; }
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && (document.activeElement === first || document.activeElement === dialogRef.current)) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
    };
  }, [open]);

  const highlights = useMemo(() => (plan ? planHighlights(plan) : []), [plan]);
  const validity = useMemo(() => (plan ? planValidity(subscription, plan) : null), [plan, subscription]);

  if (!open || !plan) return null;

  const lang = i18n.language;
  const status = payment?.status;

  let body;
  if (status === 'paid') {
    body = (
      <div className="flex flex-col items-center gap-2 text-center" role="status">
        <div className="text-4xl" aria-hidden="true">✅</div>
        <p className="font-medium">{t('payment.success')}</p>
        <p className="text-sm text-base-content/60">{t('payment.successDesc', { plan: plan.displayName })}</p>
        <button onClick={onClose} className="btn btn-primary mt-2 w-full">{t('payment.close')}</button>
      </div>
    );
  } else if (status === 'expired' || status === 'failed') {
    body = (
      <div className="flex flex-col items-center gap-3 text-center" role="alert">
        <p className={status === 'expired' ? 'text-warning' : 'text-error'}>{t(status === 'expired' ? 'payment.expired' : 'payment.failed')}</p>
        <button onClick={startPayment} className="btn btn-primary w-full" disabled={createPayment.isPending}>
          {createPayment.isPending ? <span className="loading loading-spinner loading-sm" /> : t('payment.newCode')}
        </button>
      </div>
    );
  } else if (createPayment.isError) {
    body = (
      <div className="flex flex-col items-center gap-3 text-center" role="alert">
        <p className="text-error">{createPayment.error?.response?.data?.message || t('payment.createError')}</p>
        <button onClick={startPayment} className="btn btn-primary w-full">{t('payment.retry')}</button>
      </div>
    );
  } else if (payment) {
    body = (
      <div className="flex flex-col items-center gap-2 text-center">
        <img src={payment.qrUrl} alt={t('payment.qrAlt')} className="h-52 w-52 rounded-xl border border-base-300 bg-white object-contain sm:h-56 sm:w-56" />
        <p className="font-display text-2xl text-primary">{formatVnd(payment.amount)}</p>
        <p className="text-xs text-base-content/60">{t('payment.transferContent')}: <span className="font-mono font-medium">{payment.txnRef}</span></p>
        <p className="text-xs text-base-content/60">{t('payment.scan')}</p>
        <p className="text-xs text-base-content/45">{t('payment.qrExpiresAt', { time: formatDate(payment.expiresAt) })}</p>
        <p className="mt-1 flex items-center gap-2 text-sm text-base-content/70" role="status">
          <span className="loading loading-dots loading-xs text-primary" aria-hidden="true" />
          {t('payment.waiting')}
        </p>
      </div>
    );
  } else {
    body = (
      <p className="flex items-center justify-center gap-2 py-8 text-sm text-base-content/60" role="status">
        <span className="loading loading-spinner loading-md text-primary" aria-hidden="true" />
        {t('payment.creating')}
      </p>
    );
  }

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onClick={onClose}>
      <div
        ref={dialogRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-3xl bg-base-100 shadow-2xl outline-none sm:max-w-md sm:rounded-3xl"
      >
        <header className="flex shrink-0 items-center justify-between border-b border-base-300 px-5 py-4">
          <h2 id={titleId} className="font-display text-lg">{t('payment.title', { plan: plan.displayName })}</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle" aria-label={t('payment.close')}><X width={18} height={18} /></button>
        </header>

        <div className="flex flex-col gap-4 overflow-y-auto px-5 py-5">
          {/* Bạn sẽ nhận được — chỉ quyền lợi có thật (xem utils/planFeatures.js) */}
          <section aria-label={t('payment.receiveTitle')} className="rounded-2xl bg-base-200/60 p-4">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-sm font-semibold">{t('payment.receiveTitle')}</h3>
              <p className="text-sm"><span className="font-semibold text-primary">{formatVnd(plan.price)}</span> <span className="text-base-content/55">{t('payment.perMonth')}</span></p>
            </div>
            {highlights.length > 0 && (
              <>
                <PlanFeatureList items={highlights} collapsedCount={COLLAPSED} expanded={showAll} className="mt-3" />
                {highlights.length > COLLAPSED && (
                  <button type="button" onClick={() => setShowAll((v) => !v)} className="mt-2 text-xs font-medium text-primary hover:underline" aria-expanded={showAll}>
                    {showAll ? t('payment.collapse') : t('payment.viewAll', { count: highlights.length })}
                  </button>
                )}
              </>
            )}
            {/* Ẩn sau khi đã thanh toán: lúc đó gói vừa được kích hoạt nên "sẽ cộng dồn" sẽ sai nghĩa */}
            {validity && status !== 'paid' && (
              <p className="mt-3 text-xs text-base-content/60">
                {validity.stacked
                  ? t('payment.validityStacked', { current: formatDay(validity.currentEnd, lang), to: formatDay(validity.to, lang) })
                  : t('payment.validity', { from: formatDay(validity.from, lang), to: formatDay(validity.to, lang) })}
              </p>
            )}
          </section>

          {body}
        </div>
      </div>
    </div>,
    document.body,
  );
}
