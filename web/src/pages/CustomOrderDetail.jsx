import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  useCustomOrderDetail, useUpdateCustomOrderStatus, useCreateCustomOrderPayment, useSetCustomOrderAddress,
} from '../hooks/useQuotes.js';
import DesignSnapshotCard from '../components/quotes/DesignSnapshotCard.jsx';
import { useAddresses, formatAddressLine } from '../hooks/useAddresses.js';
import { useAuthStore } from '../stores/authStore.js';
import { customOrderMeta, NEXT_ORDER_STATUS, CUSTOMER_PAY_STATUSES, ADDRESS_EDITABLE_STATUSES } from '../utils/quoteStatus.js';
import { apiErrorMessage } from '../utils/apiError.js';
import StatusBadge from '../components/supplier/StatusBadge.jsx';
import OrderPaymentPanel from '../components/checkout/OrderPaymentPanel.jsx';
import { formatVnd, formatDate } from '../utils/format.js';
import { formatDay } from '../utils/quoteSummary.js';

// Trạng thái mà tiền khách đã trả có thể mất nếu xưởng huỷ → hỏi lại trước khi huỷ
const PAID_STATUSES = new Set(['deposit_paid', 'in_production', 'awaiting_final_payment']);

/*
 * Chi tiết 1 đơn custom — DÙNG CHUNG customer/workshop, GET /custom-orders/:id trả đủ history[] + payments[].
 *
 * Luồng BE-01 (docs BE custom-order-payment-fe.md): chấp nhận báo giá → awaiting_deposit (khách cọc 30%) → hệ thống
 * tự sang deposit_paid → xưởng "Bắt đầu sản xuất" → "Hoàn thiện" (awaiting_final_payment) → khách chọn địa chỉ + trả
 * phần còn lại & ship → hệ thống tự sang paid → xưởng giao → khách "Đã nhận hàng".
 * Trước đây FE còn luồng cũ pending → confirmed → completed: đơn mới (awaiting_deposit) không có nút nào, khách không
 * có cách trả cọc → đơn kẹt.
 *
 * Nút đổi trạng thái chỉ hiện đúng bước + đúng vai (NEXT_ORDER_STATUS) — sai vai/sai bước BE vẫn tự 403/409.
 */
export default function CustomOrderDetail() {
  const { id } = useParams();
  const { t, i18n } = useTranslation();
  const me = useAuthStore((s) => s.user);
  const { data: order, isLoading, isError, refetch } = useCustomOrderDetail(id);
  const updateStatus = useUpdateCustomOrderStatus();
  const [note, setNote] = useState('');
  const [payment, setPayment] = useState(null); // PaymentResponse đang hiện QR

  if (isLoading) return <div className="skeleton h-64 max-w-3xl rounded-3xl" />;
  if (isError || !order) {
    return (
      <div className="rounded-3xl border border-dashed border-base-300 bg-base-100 py-20 text-center">
        <p className="font-display text-2xl">{t('order.notFound')}</p>
        <button onClick={() => refetch()} className="btn btn-outline btn-sm mt-3 border-base-300">{t('shop.retry')}</button>
      </div>
    );
  }

  const myRole = me?.id === order.customerId ? 'customer' : 'workshop';
  const otherPartyName = myRole === 'customer' ? order.workshopName : order.customerName;
  const actions = NEXT_ORDER_STATUS[myRole]?.[order.status] ?? [];
  const paidAmount = Number(order.paidAmount ?? 0);

  const changeStatus = (s) => {
    if (s === 'cancelled') {
      // Xưởng huỷ khi khách đã trả tiền → cần hoàn tiền thủ công; khách huỷ lúc vừa mở QR cọc → có thể đã chuyển khoản
      const msg = myRole === 'workshop' && paidAmount > 0 && PAID_STATUSES.has(order.status)
        ? t('order.workshop.refundWarning', { amount: formatVnd(paidAmount) })
        : myRole === 'customer' && payment ? t('order.pay.cancelWarning') : null;
      if (msg && !window.confirm(msg)) return;
    }
    updateStatus.mutate({ id, status: s, note: note || undefined }, { onSuccess: () => { setNote(''); setPayment(null); } });
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <Link to={myRole === 'customer' ? '/custom-orders' : '/portal/workshop/production'} className="text-sm text-base-content/70 hover:text-primary">← {t(myRole === 'customer' ? 'order.myOrdersTitle' : 'order.backToProduction')}</Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl">{otherPartyName}</h1>
          <StatusBadge meta={customOrderMeta(order.status)} />
        </div>
        <p className="mt-1 font-mono text-sm text-base-content/70">{order.orderNumber}</p>
      </div>

      <DesignSnapshotCard snapshot={order.designSnapshot} quantity={order.quantity} viewerRole={myRole} />

      <div className="rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <div className="grid flex-1 grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div><p className="text-base-content/70">{t('quote.price')}</p><p className="font-medium">{formatVnd(order.unitPrice)}</p></div>
            <div><p className="text-base-content/70">{t('order.total')}</p><p className="font-semibold text-primary">{formatVnd(order.totalAmount)}</p></div>
            <div><p className="text-base-content/70">{t('quote.leadTimeDays')}</p><p className="font-medium">{order.leadTimeDays}</p></div>
            {/* Ngày dự kiến tính từ lúc đặt cọc (BE BUG-017): chưa cọc → chỉ nói "sau N ngày kể từ khi đặt cọc" */}
            {order.estimatedCompletionDate ? (
              <div><p className="text-base-content/70">{t('order.eta.label')}</p><p className="font-medium">{formatDay(order.estimatedCompletionDate, i18n.language)}</p></div>
            ) : order.status === 'awaiting_deposit' && order.leadTimeDays ? (
              <div className="col-span-2"><p className="text-base-content/70">{t('order.eta.label')}</p><p className="font-medium">{t('order.eta.afterDeposit', { days: order.leadTimeDays })}</p></div>
            ) : null}
            {order.location && <div><p className="text-base-content/70">{t('quote.location')}</p><p className="font-medium">{order.location}</p></div>}
          </div>
        </div>
        {order.note && <p className="mt-3 rounded-xl bg-base-200/60 p-3 text-sm text-base-content/70">{order.note}</p>}
      </div>

      <MoneySummary order={order} />

      <AddressBlock order={order} isCustomer={myRole === 'customer'} />

      {/* Khách: trả cọc / phần còn lại */}
      {myRole === 'customer' && CUSTOMER_PAY_STATUSES.has(order.status) && (
        <PayBlock order={order} payment={payment} onPayment={setPayment} onPaid={() => { setPayment(null); refetch(); }} />
      )}
      {/* Xưởng: biết đang chờ khách trả tiền (không có nút — hệ thống tự chuyển khi tiền về) */}
      {myRole === 'workshop' && CUSTOMER_PAY_STATUSES.has(order.status) && (
        <p className="rounded-2xl border border-info/30 bg-info/5 p-4 text-sm text-base-content/75">
          {t(order.status === 'awaiting_deposit' ? 'order.workshop.waitingDeposit' : 'order.workshop.waitingFinal')}
        </p>
      )}

      {/* Đổi trạng thái */}
      {actions.length > 0 && (
        <div className="flex flex-col gap-3 rounded-3xl border border-base-300 bg-base-100 p-5">
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder={t('order.notePlaceholder')} className="textarea textarea-bordered rounded-xl" />
          {updateStatus.isError && <p className="text-sm text-error">{apiErrorMessage(updateStatus.error, t('order.genericError'))}</p>}
          <div className="flex flex-wrap gap-2">
            {actions.map((s) => (
              <button
                key={s}
                onClick={() => changeStatus(s)}
                disabled={updateStatus.isPending}
                className={`btn btn-sm ${s === 'cancelled' ? 'btn-outline btn-error' : 'btn-primary'}`}
              >
                {t(`order.action.${s}`)}
              </button>
            ))}
          </div>
        </div>
      )}

      {order.payments?.length > 0 && (
        <div>
          <h2 className="mb-3 font-display text-xl">{t('order.payments.title')}</h2>
          <ul className="flex flex-col gap-2">
            {order.payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-base-300 bg-base-100 p-3 text-sm">
                <span>{t(`order.payments.${p.purpose}`, { defaultValue: p.purpose })}{p.paidAt && <span className="text-base-content/70"> · {new Date(p.paidAt).toLocaleString('vi-VN')}</span>}</span>
                <span className={`font-medium ${p.status === 'paid' ? 'text-success' : 'text-base-content/70'}`}>{formatVnd(p.amount)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Lịch sử trạng thái */}
      <div>
        <h2 className="mb-3 font-display text-xl">{t('order.historyTitle')}</h2>
        <ol className="flex flex-col gap-2">
          {[...(order.history ?? [])].reverse().map((h) => (
            <li key={h.id} className="flex items-start gap-3 rounded-xl border border-base-300 bg-base-100 p-3 text-sm">
              <StatusBadge meta={customOrderMeta(h.toStatus)} />
              <div className="min-w-0 flex-1">
                <p className="text-base-content/70">{new Date(h.createdAt).toLocaleString('vi-VN')} · {t(`order.role.${h.changedByRole}`, { defaultValue: h.changedByRole })}</p>
                {h.note && <p className="mt-0.5">{h.note}</p>}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

// Khối tiền: tổng · cọc · ship · đã trả · còn lại. Đơn cũ trước BE-01 không có depositAmount → ẩn dòng cọc.
function MoneySummary({ order }) {
  const { t } = useTranslation();
  if (order.paidAmount == null && order.depositAmount == null) return null; // đơn rất cũ, BE chưa trả các field này
  const shipKnown = order.shippingFee != null;
  const row = (label, value, cls = '') => (
    <div className={`flex justify-between gap-3 ${cls}`}><dt className="text-base-content/70">{label}</dt><dd>{value}</dd></div>
  );
  return (
    <section className="rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm">
      <h2 className="mb-3 font-display text-xl">{t('order.money.title')}</h2>
      <dl className="flex flex-col gap-1.5 text-sm">
        {row(t('order.money.total'), formatVnd(order.totalAmount))}
        {Number(order.depositAmount) > 0 && row(t('order.money.deposit'), formatVnd(order.depositAmount))}
        {row(t('order.money.shippingFee'), shipKnown ? formatVnd(order.shippingFee) : t('order.money.shippingPending'))}
        {row(t('order.money.paid'), formatVnd(order.paidAmount ?? 0), 'text-success')}
        <div className="mt-1 flex justify-between gap-3 border-t border-base-200 pt-2 font-semibold">
          <dt>{t(shipKnown ? 'order.money.remaining' : 'order.money.remainingNoShip')}</dt>
          <dd className="text-primary">{formatVnd(order.remainingAmount ?? 0)}</dd>
        </div>
      </dl>
      {/* Đơn huỷ khi đã có tiền (OBS-08 §5.3): đã hoàn → hiện số tiền + mã GD; chưa hoàn → báo đang chờ admin hoàn */}
      {order.refundedAt ? (
        <p className="mt-3 rounded-xl border border-success/30 bg-success/5 p-3 text-sm">
          {t('order.refund.done', { amount: formatVnd(order.refundAmount), date: formatDate(order.refundedAt), reference: order.refundReference })}
        </p>
      ) : order.needsRefund ? (
        <p className="mt-3 rounded-xl border border-warning/30 bg-warning/5 p-3 text-sm">{t('order.refund.pending', { amount: formatVnd(order.paidAmount) })}</p>
      ) : null}
    </section>
  );
}

/*
 * Địa chỉ giao: khách chọn từ sổ địa chỉ (bắt buộc đã ghim toạ độ để BE tính ship từ xưởng). Đổi được tới trước khi
 * thanh toán đủ (ADDRESS_EDITABLE_STATUSES). Xưởng chỉ xem.
 */
function AddressBlock({ order, isCustomer }) {
  const { t } = useTranslation();
  const editable = isCustomer && ADDRESS_EDITABLE_STATUSES.has(order.status);
  // Sổ địa chỉ chỉ cần khi khách được chọn/đổi địa chỉ; xưởng / đơn đã khoá không tải (QA BUG-022)
  const { data: addresses = [], isLoading } = useAddresses({ enabled: editable });
  const setAddress = useSetCustomOrderAddress();
  const [editing, setEditing] = useState(false);
  const [picked, setPicked] = useState(order.addressId ?? '');

  if (!order.shippingAddress && !editable) return null;

  const save = () => setAddress.mutate({ id: order.id, addressId: picked }, { onSuccess: () => setEditing(false) });

  return (
    <section className="rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h2 className="font-display text-xl">{t('order.address.title')}</h2>
        {editable && !editing && (
          <button type="button" onClick={() => setEditing(true)} className="btn btn-ghost btn-xs">
            {t(order.addressId ? 'order.address.change' : 'order.address.choose')}
          </button>
        )}
      </div>
      {!editing && <p className="text-sm text-base-content/75">{order.shippingAddress || t('order.address.none')}</p>}
      {isCustomer && !editable && order.shippingAddress && <p className="mt-1 text-xs text-base-content/70">{t('order.address.locked')}</p>}

      {editing && (
        <div className="flex flex-col gap-2">
          {isLoading ? <div className="skeleton h-14 rounded-xl" /> : !addresses.length ? (
            <p className="text-sm text-base-content/70">{t('order.address.empty')} <Link to="/profile" className="link link-primary">{t('order.address.manage')}</Link></p>
          ) : (
            addresses.map((a) => (
              <label key={a.id} className={`flex gap-3 rounded-xl border p-3 text-sm ${!a.hasCoordinates ? 'border-dashed border-base-300 opacity-70' : picked === a.id ? 'cursor-pointer border-primary bg-primary/5' : 'cursor-pointer border-base-300'}`}>
                <input type="radio" name="co-address" className="radio radio-primary radio-sm mt-0.5" checked={picked === a.id} disabled={!a.hasCoordinates} onChange={() => setPicked(a.id)} />
                <span className="min-w-0 flex-1">
                  <span className="font-medium">{a.recipientName}</span> <span className="text-base-content/70">{a.recipientPhone}</span>
                  <span className="block text-base-content/70">{formatAddressLine(a)}</span>
                  {!a.hasCoordinates && <span className="block text-xs text-warning">{t('order.address.needPin')}</span>}
                </span>
              </label>
            ))
          )}
          {setAddress.isError && <p className="text-sm text-error">{apiErrorMessage(setAddress.error, t('order.genericError'))}</p>}
          <div className="flex gap-2">
            <button type="button" onClick={save} disabled={!picked || setAddress.isPending} className="btn btn-primary btn-sm">
              {setAddress.isPending ? <span className="loading loading-spinner loading-xs" /> : t('order.address.save')}
            </button>
            <button type="button" onClick={() => setEditing(false)} className="btn btn-ghost btn-sm">{t('order.address.cancel')}</button>
          </div>
        </div>
      )}
    </section>
  );
}

/*
 * Khách trả cọc / phần còn lại: POST /custom-orders/{id}/payment → QR (OrderPaymentPanel poll tới khi paid).
 * Gọi lại an toàn — BE trả lại QR còn hạn hoặc gia hạn cùng payment. Khoản cuối cần có địa chỉ (để tính ship).
 */
function PayBlock({ order, payment, onPayment, onPaid }) {
  const { t } = useTranslation();
  const createPayment = useCreateCustomOrderPayment();
  const isFinal = order.status === 'awaiting_final_payment';
  const amount = isFinal ? order.remainingAmount : order.depositAmount;
  const needAddress = isFinal && !order.addressId;

  return (
    <section className="flex flex-col gap-3 rounded-3xl border-2 border-primary/30 bg-primary/5 p-5">
      <p className="text-sm text-base-content/75">{t(isFinal ? 'order.pay.finalHint' : 'order.pay.depositHint')}</p>
      {needAddress && <p className="text-sm text-warning">{t('order.pay.needAddress')}</p>}
      {!payment ? (
        <button
          type="button"
          onClick={() => createPayment.mutate(order.id, { onSuccess: onPayment })}
          disabled={needAddress || createPayment.isPending}
          className="btn btn-primary self-start"
        >
          {createPayment.isPending ? <span className="loading loading-spinner loading-sm" /> : t(isFinal ? 'order.pay.final' : 'order.pay.deposit', { amount: formatVnd(amount ?? 0) })}
        </button>
      ) : (
        <div className="flex flex-col gap-2 sm:max-w-sm">
          <OrderPaymentPanel paymentId={payment.id} fallback={payment} onPaid={onPaid} />
          <button type="button" onClick={() => onPayment(null)} className="btn btn-ghost btn-xs self-center">{t('order.pay.close')}</button>
        </div>
      )}
      {createPayment.isError && <p className="text-sm text-error">{apiErrorMessage(createPayment.error, t('order.genericError'))}</p>}
    </section>
  );
}
