import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useCreateSubscriptionPayment, usePayment } from '../../hooks/useSubscription.js';
import { formatVnd, formatDate } from '../../utils/format.js';
import { X } from '../suppliers/icons.jsx';

/*
 * PaymentQrModal — thanh toán VietQR/SePay cho gói TRẢ PHÍ (đúng luồng mục 2B tài liệu BE):
 *  1. Mở modal → tạo payment (POST /payments/subscription) → nhận qrUrl.
 *  2. Hiện ảnh QR, POLL GET /payments/{id} mỗi 4s (xem hooks/useSubscription.js usePayment) tới
 *     khi status khác "pending".
 *  3. "paid" → BE đã TỰ kích hoạt gói qua webhook SePay — FE chỉ cần invalidate mySubscription
 *     để lấy lại gói mới, KHÔNG tự gọi POST /subscriptions (sẽ 400, đó là luồng của gói free).
 *  4. "expired" → QR hết hạn, cho tạo lại (gọi lại bước 1).
 */
export default function PaymentQrModal({ open, planId, planName, onClose }) {
  const [paymentId, setPaymentId] = useState(null);
  const createPayment = useCreateSubscriptionPayment();
  const { data: payment } = usePayment(paymentId);
  const qc = useQueryClient();

  // Tạo payment mới mỗi khi modal mở cho 1 planId (hoặc khi bấm "Tạo lại QR" sau khi hết hạn)
  const startPayment = () => {
    setPaymentId(null);
    createPayment.mutate(planId, { onSuccess: (res) => setPaymentId(res.id) });
  };

  useEffect(() => {
    if (open && planId) startPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, planId]);

  useEffect(() => {
    if (payment?.status === 'paid') {
      qc.invalidateQueries({ queryKey: ['mySubscription'] });
      qc.invalidateQueries({ queryKey: ['mySubscriptionHistory'] });
      qc.invalidateQueries({ queryKey: ['myUsage'] });
    }
  }, [payment?.status, qc]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="flex w-full max-w-sm flex-col overflow-hidden rounded-3xl bg-base-100 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog" aria-modal="true" aria-label="Thanh toán gói đăng ký"
      >
        <header className="flex items-center justify-between border-b border-base-300 px-5 py-4">
          <h2 className="font-display text-lg">Thanh toán — {planName}</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle" aria-label="Đóng"><X width={18} height={18} /></button>
        </header>

        <div className="flex flex-col items-center gap-3 px-5 py-6 text-center">
          {payment?.status === 'paid' ? (
            <>
              <div className="text-4xl">✅</div>
              <p className="font-medium">Thanh toán thành công!</p>
              <p className="text-sm text-base-content/60">Gói {planName} đã được kích hoạt cho tài khoản của bạn.</p>
              <button onClick={onClose} className="btn btn-primary mt-2 w-full">Đóng</button>
            </>
          ) : payment?.status === 'expired' ? (
            <>
              <p className="text-warning">Mã QR đã hết hạn.</p>
              <button onClick={startPayment} className="btn btn-primary w-full" disabled={createPayment.isPending}>
                {createPayment.isPending ? <span className="loading loading-spinner loading-sm" /> : 'Tạo lại mã QR'}
              </button>
            </>
          ) : payment?.status === 'failed' ? (
            <>
              <p className="text-error">Thanh toán thất bại, vui lòng thử lại.</p>
              <button onClick={startPayment} className="btn btn-primary w-full" disabled={createPayment.isPending}>
                {createPayment.isPending ? <span className="loading loading-spinner loading-sm" /> : 'Thử lại'}
              </button>
            </>
          ) : payment ? (
            <>
              <img src={payment.qrUrl} alt="Mã QR thanh toán" className="h-56 w-56 rounded-xl border border-base-300 object-contain" />
              <p className="font-display text-2xl text-primary">{formatVnd(payment.amount)}</p>
              <p className="text-xs text-base-content/50">Nội dung chuyển khoản: <span className="font-mono">{payment.txnRef}</span></p>
              <p className="text-xs text-base-content/50">Quét mã bằng app ngân hàng để chuyển khoản — trang tự cập nhật khi nhận được thanh toán.</p>
              <p className="text-xs text-base-content/40">QR hết hạn lúc {formatDate(payment.expiresAt)}</p>
              <span className="loading loading-dots loading-sm text-primary" />
            </>
          ) : (
            <span className="loading loading-spinner loading-lg text-primary my-10" />
          )}
        </div>
      </div>
    </div>
  );
}
