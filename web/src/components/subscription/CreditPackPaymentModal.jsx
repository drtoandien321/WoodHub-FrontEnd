import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import ModalShell from '../admin/ModalShell.jsx';
import { useCreateCreditPackPayment, usePayment } from '../../hooks/useSubscription.js';
import { formatVnd, formatDate } from '../../utils/format.js';

/*
 * CreditPackPaymentModal — mua gói lượt thiết kế (credit pack) bằng VietQR/SePay:
 *  1. Mở modal → POST /payments/credit-pack { packId } → nhận QR.
 *  2. Poll GET /payments/{id} (usePayment, 4s/lần) tới khi hết "pending".
 *  3. "paid" → BE đã TỰ cộng lượt vào ví → chỉ invalidate myUsage (purchasedRemaining tăng) + lịch sử thanh toán.
 *  4. "expired"/"failed" → cho tạo mã mới.
 * Khác PaymentQrModal (gói đăng ký): không có phần "quyền lợi gói/hiệu lực", lượt mua dùng đến hết, không theo tháng.
 */
export default function CreditPackPaymentModal({ pack, onClose }) {
  const qc = useQueryClient();
  const createPayment = useCreateCreditPackPayment();
  const [paymentId, setPaymentId] = useState(null);
  const { data: payment } = usePayment(paymentId);

  const start = () => {
    setPaymentId(null);
    createPayment.reset();
    createPayment.mutate(pack.id, { onSuccess: (res) => setPaymentId(res.id) });
  };

  /*
   * Tạo payment ngay khi mở modal (mỗi lần mở = 1 mã mới).
   * startedRef: React StrictMode (dev) chạy effect 2 lần lúc mount → không chặn thì tạo 2 payment
   * (1 cái thành giao dịch "Đang chờ" rác ở BE). Ref được giữ qua lần mount lại của StrictMode nên chặn được.
   */
  const startedRef = useRef(null);
  useEffect(() => {
    if (startedRef.current === pack.id) return;
    startedRef.current = pack.id;
    start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pack.id]);

  useEffect(() => {
    if (payment?.status !== 'paid') return;
    qc.invalidateQueries({ queryKey: ['myUsage'] });
    qc.invalidateQueries({ queryKey: ['myPayments'] });
  }, [payment?.status, qc]);

  const status = payment?.status;
  let body;
  if (status === 'paid') {
    body = (
      <div className="flex flex-col items-center gap-2 text-center" role="status">
        <div className="text-4xl" aria-hidden="true">✅</div>
        <p className="font-medium">Đã cộng {pack.credits} lượt thiết kế!</p>
        <p className="text-sm text-base-content/70">Lượt đã mua không hết hạn theo tháng — dùng sau khi hết hạn mức của gói.</p>
      </div>
    );
  } else if (status === 'expired' || status === 'failed') {
    body = (
      <div className="flex flex-col items-center gap-3 text-center" role="alert">
        <p className={status === 'expired' ? 'text-warning' : 'text-error'}>{status === 'expired' ? 'Mã QR đã hết hạn.' : 'Thanh toán thất bại.'}</p>
        <button onClick={start} disabled={createPayment.isPending} className="btn btn-primary btn-sm">Tạo mã mới</button>
      </div>
    );
  } else if (createPayment.isError) {
    body = (
      <div className="flex flex-col items-center gap-3 text-center" role="alert">
        <p className="text-error">{createPayment.error?.response?.data?.message || 'Không tạo được mã thanh toán.'}</p>
        <button onClick={start} className="btn btn-primary btn-sm">Thử lại</button>
      </div>
    );
  } else if (payment ?? createPayment.data) {
    const p = payment ?? createPayment.data;
    body = (
      <div className="flex flex-col items-center gap-2 text-center">
        <img src={p.qrUrl} alt="Mã QR thanh toán" className="h-52 w-52 rounded-xl border border-base-300 bg-white object-contain" />
        <p className="font-display text-2xl text-primary">{formatVnd(p.amount)}</p>
        <p className="text-xs text-base-content/70">Nội dung chuyển khoản: <span className="font-mono font-medium">{p.txnRef}</span></p>
        <p className="text-xs text-base-content/70">QR hết hạn lúc {formatDate(p.expiresAt)}</p>
        <p className="mt-1 flex items-center gap-2 text-sm text-base-content/70" role="status">
          <span className="loading loading-dots loading-xs text-primary" aria-hidden="true" /> Đang chờ thanh toán…
        </p>
      </div>
    );
  } else {
    body = <p className="flex items-center justify-center gap-2 py-8 text-sm text-base-content/70"><span className="loading loading-spinner loading-md text-primary" /> Đang tạo mã QR…</p>;
  }

  return (
    <ModalShell
      open
      onClose={onClose}
      title={`Mua ${pack.displayName}`}
      maxWidth="max-w-md"
      footer={<button onClick={onClose} className="btn btn-ghost">{status === 'paid' ? 'Xong' : 'Đóng'}</button>}
    >
      <div className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between rounded-xl bg-base-200/60 px-4 py-3 text-sm">
          <span>+{pack.credits} lượt thiết kế 3D</span>
          <span className="font-semibold text-primary">{formatVnd(pack.price)}</span>
        </div>
        {body}
      </div>
    </ModalShell>
  );
}
