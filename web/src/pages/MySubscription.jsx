import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useMySubscription, useMyUsage, useMyPayments, useRenewSubscription, useCancelSubscription,
} from '../hooks/useSubscription.js';
import { formatVnd, formatDate } from '../utils/format.js';

// Nhãn hiển thị cho enum UsageFeature (BE: design | ai_chat | export | ar_3d) — chỉ dùng ở trang này
const FEATURE_LABELS = { ai_chat: 'Chat AI', design: 'Thiết kế 3D', export: 'Xuất file', ar_3d: 'AR / 3D' };

const PAYMENT_STATUS_META = {
  pending: { label: 'Đang chờ', cls: 'badge-warning' },
  paid: { label: 'Đã thanh toán', cls: 'badge-success' },
  failed: { label: 'Thất bại', cls: 'badge-error' },
  expired: { label: 'Hết hạn', cls: 'badge-ghost' },
};

/*
 * MySubscription (/account/subscription) — gói đang dùng + hạn mức tháng này + lịch sử thanh
 * toán, đúng mục 3+4 tài liệu Subscription. endDate === null nghĩa là gói VÔ THỜI HẠN (free) —
 * xem UserSubscriptionResponse; KHÔNG được hiểu nhầm thành "chưa có ngày hết hạn = lỗi dữ liệu".
 */
export default function MySubscription() {
  const { data: mySub, isLoading } = useMySubscription();
  const { data: usage, isLoading: usageLoading } = useMyUsage();
  const { data: payments } = useMyPayments();
  const renew = useRenewSubscription();
  const cancel = useCancelSubscription();
  const [confirmingCancel, setConfirmingCancel] = useState(false);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleRenew = () => {
    renew.mutate(undefined, {
      onSuccess: () => showToast('Đã gia hạn thêm 1 tháng.'),
      onError: (err) => showToast(err?.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.'),
    });
  };

  const handleCancel = () => {
    cancel.mutate(undefined, {
      onSuccess: () => { setConfirmingCancel(false); showToast('Đã hủy gói.'); },
      onError: (err) => { setConfirmingCancel(false); showToast(err?.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.'); },
    });
  };

  return (
    <div className="flex flex-col gap-6 max-w-2xl mx-auto">
      <h1 className="font-display text-3xl">Gói của tôi</h1>

      {/* ===== Gói đang dùng ===== */}
      {isLoading ? (
        <div className="skeleton h-40 rounded-2xl" />
      ) : !mySub ? (
        <div className="rounded-2xl border border-base-300 bg-base-100 p-6 text-center">
          <p className="text-base-content/60 mb-3">Bạn chưa có gói nào đang dùng.</p>
          <Link to="/pricing" className="btn btn-primary btn-sm">Chọn gói</Link>
        </div>
      ) : (
        <div className="rounded-2xl border border-base-300 bg-base-100 p-6 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-xl">{mySub.plan.displayName}</h2>
              <p className="text-sm text-base-content/60 mt-1">
                {mySub.plan.price === 0 ? 'Miễn phí' : `${formatVnd(mySub.plan.price)} / tháng`}
              </p>
            </div>
            <span className="badge badge-primary">Đang dùng</span>
          </div>

          <p className="text-sm text-base-content/70">
            {mySub.endDate ? `Còn hạn tới ${formatDate(mySub.endDate)}` : 'Không giới hạn thời gian'}
          </p>

          {mySub.plan.price > 0 && (
            <div className="flex gap-2 mt-2">
              <button onClick={handleRenew} disabled={renew.isPending} className="btn btn-outline btn-sm">
                {renew.isPending ? <span className="loading loading-spinner loading-xs" /> : 'Gia hạn +1 tháng'}
              </button>
              {confirmingCancel ? (
                <>
                  <button onClick={handleCancel} disabled={cancel.isPending} className="btn btn-error btn-sm">
                    {cancel.isPending ? <span className="loading loading-spinner loading-xs" /> : 'Xác nhận hủy'}
                  </button>
                  <button onClick={() => setConfirmingCancel(false)} className="btn btn-ghost btn-sm">Thôi</button>
                </>
              ) : (
                <button onClick={() => setConfirmingCancel(true)} className="btn btn-ghost btn-sm text-error">Hủy gói</button>
              )}
            </div>
          )}

          <Link to="/pricing" className="text-sm link link-primary mt-1">Xem/đổi gói khác</Link>
        </div>
      )}

      {/* ===== Hạn mức dùng tháng này ===== */}
      <div className="rounded-2xl border border-base-300 bg-base-100 p-6">
        <h2 className="font-display text-lg mb-3">Hạn mức tháng này</h2>
        {usageLoading ? (
          <div className="flex flex-col gap-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-8 rounded-lg" />)}</div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {usage?.map((u) => (
              <div key={u.feature} className="flex items-center justify-between text-sm">
                <span>{FEATURE_LABELS[u.feature] ?? u.feature}</span>
                <span className={u.remaining === 0 ? 'text-error font-medium' : 'text-base-content/70'}>
                  {u.unlimited ? 'Không giới hạn' : `${u.used}/${u.limit} (còn ${u.remaining})`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== Lịch sử thanh toán ===== */}
      {payments?.length > 0 && (
        <div className="rounded-2xl border border-base-300 bg-base-100 p-6">
          <h2 className="font-display text-lg mb-3">Lịch sử thanh toán</h2>
          <div className="flex flex-col gap-2">
            {payments.map((p) => {
              const meta = PAYMENT_STATUS_META[p.status] ?? { label: p.status, cls: 'badge-ghost' };
              return (
                <div key={p.id} className="flex items-center justify-between text-sm border-b border-base-200 last:border-0 pb-2 last:pb-0">
                  <div>
                    <p className="font-medium">{p.planName}</p>
                    <p className="text-xs text-base-content/50">{formatDate(p.createdAt)}</p>
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
    </div>
  );
}
