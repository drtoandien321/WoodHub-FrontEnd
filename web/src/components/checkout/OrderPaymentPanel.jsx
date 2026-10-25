import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { usePayment } from '../../hooks/useSubscription.js';
import { ORDERS_QUERY_KEY, useRepayOrder } from '../../hooks/useOrders.js';
import { apiErrorMessage } from '../../utils/apiError.js';
import { formatVnd, formatDate } from '../../utils/format.js';

/*
 * OrderPaymentPanel — khối QR chuyển khoản cho ĐƠN HÀNG (dùng ở Checkout sau khi đặt + OrderDetail khi
 * đơn còn pending_payment).
 *
 * Nhiều đơn trong 1 lần checkout dùng CHUNG 1 payment → chỉ cần 1 QR. Poll GET /payments/{id} mỗi 4s
 * (usePayment) tới khi hết "pending". Khi "paid": BE (webhook SePay) đã TỰ chuyển mọi đơn sang 'paid'
 * → FE chỉ invalidate cache đơn hàng để hiển thị trạng thái mới, KHÔNG gọi API cập nhật đơn nào.
 *
 * `fallback` = thông tin QR đã có sẵn (CheckoutResponse.payment hoặc các field payment* của OrderResponse)
 * để hiện QR ngay, không phải chờ lượt poll đầu.
 * Mã hết hạn: nút "Lấy mã QR mới" gọi POST /orders/{orderId}/payment (BE-03) — gia hạn CÙNG payment, txnRef giữ nguyên nên QR
 * cũ vẫn được ghi nhận. Cần `orderId` (bất kỳ đơn nào trong nhóm checkout). Trước đây chú thích ghi BE chưa có API (QA BUG-003).
 */
export default function OrderPaymentPanel({ paymentId, orderId, fallback = {}, onPaid }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const { data: payment, isError } = usePayment(paymentId);

  const status = payment?.status ?? fallback.status ?? 'pending';
  const qrUrl = payment?.qrUrl ?? fallback.qrUrl;
  const amount = payment?.amount ?? fallback.amount;
  const txnRef = payment?.txnRef ?? fallback.txnRef;
  const expiresAt = payment?.expiresAt ?? fallback.expiresAt;
  const repay = useRepayOrder();
  // Hết hạn: BE trả 'expired', hoặc vẫn 'pending' nhưng đã quá expiresAt (chưa tới lượt BE cập nhật)
  const qrExpired = status === 'expired' || (status === 'pending' && expiresAt && new Date(expiresAt) <= new Date());
  const handleRepay = () => {
    repay.mutate(orderId, {
      onError: (err) => {
        if (err?.response?.status === 409) {
          qc.invalidateQueries({ queryKey: ['payment', paymentId] });
          qc.invalidateQueries({ queryKey: ['order'] });
          qc.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
        }
      },
    });
  };

  useEffect(() => {
    if (status !== 'paid') return;
    qc.invalidateQueries({ queryKey: ORDERS_QUERY_KEY });
    qc.invalidateQueries({ queryKey: ['order'] });
    onPaid?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  if (status === 'paid') {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-success/40 bg-success/5 p-6 text-center" role="status">
        <div className="text-4xl" aria-hidden="true">✅</div>
        <p className="font-medium">{t('orderPayment.paid')}</p>
        <p className="text-sm text-base-content/70">{t('orderPayment.paidDesc')}</p>
      </div>
    );
  }

  // Chỉ 'failed' mới bỏ QR. 'expired' vẫn hiện QR bên dưới: BE nhận tiền trả muộn qua QR cũ (AUD-005) — bản cũ giấu QR
  // và bảo khách huỷ đơn đặt lại, trái chính sách BE.
  if (status === 'failed') {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-warning/40 bg-warning/5 p-6 text-center" role="alert">
        <p className="font-medium text-warning">{t('orderPayment.failed')}</p>
        <p className="text-sm text-base-content/70">{t('orderPayment.reorderHint')}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2 rounded-2xl border border-base-300 bg-base-100 p-6 text-center">
      {qrUrl ? (
        <img src={qrUrl} alt={t('payment.qrAlt')} className="h-56 w-56 rounded-xl border border-base-300 bg-white object-contain" />
      ) : (
        <div className="skeleton h-56 w-56 rounded-xl" />
      )}
      {amount != null && <p className="font-display text-2xl text-primary">{formatVnd(amount)}</p>}
      {txnRef && (
        <p className="text-xs text-base-content/70">
          {t('payment.transferContent')}: <span className="font-mono font-medium">{txnRef}</span>
        </p>
      )}
      <p className="text-xs text-base-content/70">{t('payment.scan')}</p>
      {qrExpired ? (
        <div className="flex flex-col items-center gap-2">
          <p className="rounded-lg bg-warning/10 px-3 py-2 text-xs text-base-content/70">{t('orderPayment.expiredStillValid')}</p>
          {orderId && (
            <button type="button" onClick={handleRepay} disabled={repay.isPending} className="btn btn-primary btn-sm">
              {repay.isPending ? <span className="loading loading-spinner loading-xs" /> : t('orderPayment.repay')}
            </button>
          )}
          {repay.isError && <p role="alert" className="text-xs text-error">{apiErrorMessage(repay.error, t('orderPayment.repayError'))}</p>}
        </div>
      ) : (
        expiresAt && <p className="text-xs text-base-content/70">{t('payment.qrExpiresAt', { time: formatDate(expiresAt) })}</p>
      )}
      {isError ? (
        <p className="text-xs text-error">{t('orderPayment.pollError')}</p>
      ) : (
        <p className="mt-1 flex items-center gap-2 text-sm text-base-content/70" role="status">
          <span className="loading loading-dots loading-xs text-primary" aria-hidden="true" />
          {t('payment.waiting')}
        </p>
      )}
    </div>
  );
}
