import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useOrder, useCancelOrder, ORDER_STATUS_FLOW, orderStatusBadge } from '../hooks/useOrders.js';
import { formatVnd, formatDate } from '../utils/format.js';
import EmptyState from '../components/ui/EmptyState.jsx';
import OrderPaymentPanel from '../components/checkout/OrderPaymentPanel.jsx';
import { apiErrorMessage } from '../utils/apiError.js';
import OrderDeadlineNote from '../components/orders/OrderDeadlineNote.jsx';

/*
 * Chi tiết đơn — GET /api/orders/{id} (OrderResponse). Đơn còn 'pending_payment' thì hiện lại QR để
 * khách thanh toán tiếp (QR dùng chung cho mọi đơn cùng lần checkout — thanh toán 1 lần là đủ cả nhóm)
 * và cho HỦY (POST /orders/{id}/cancel — BE chỉ cho hủy ở trạng thái này, sai → 409).
 * Các bước sau 'paid' do nhà cung cấp/admin cập nhật, khách chỉ xem tiến trình.
 */
export default function OrderDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { data: order, isLoading, isError } = useOrder(id);
  const cancelOrder = useCancelOrder();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelErr, setCancelErr] = useState('');

  if (isLoading) return <div className="skeleton mx-auto h-64 max-w-3xl rounded-2xl" />;
  if (isError || !order)
    return (
      <div className="mx-auto max-w-2xl">
        <EmptyState title={t('orders.notFound')} hint={t('orders.notFoundHint')} ctaLabel={t('orders.backToOrders')} ctaTo="/orders" />
      </div>
    );

  const isClosed = order.status === 'cancelled' || order.status === 'refunded';
  const stepIndex = ORDER_STATUS_FLOW.indexOf(order.status);
  const canCancel = order.status === 'pending_payment';

  const handleCancel = () => {
    setCancelErr('');
    cancelOrder.mutate(order.id, {
      onSuccess: () => setConfirmCancel(false),
      onError: (err) => { setConfirmCancel(false); setCancelErr(apiErrorMessage(err, t('orders.cancelFailed'))); },
    });
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link to="/orders" className="btn btn-circle btn-ghost btn-sm" aria-label={t('orders.backToOrders')}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </Link>
        <h1 className="font-display text-2xl">{t('orders.detailTitle')}</h1>
        <span className="font-mono text-sm text-base-content/70">{order.orderCode}</span>
        <span className={`badge ${orderStatusBadge(order.status)}`}>{t(`orders.status.${order.status}`)}</span>
      </div>

      {/* Hạn NCC xác nhận 24h / thông báo hoàn tiền 48h khi đơn đã trả tiền bị huỷ */}
      <OrderDeadlineNote order={order} />

      {/* Hoá đơn VAT (BE-08 §4.2): companyInfo là ảnh chụp lúc đặt; NCC xuất bên ngoài rồi nhập số hoá đơn */}
      {order.vat && (
        <section className="rounded-2xl border border-base-300 bg-base-100 p-4 text-sm">
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-medium">{t('orders.vat.title')}</h2>
            <span className={`badge badge-sm ${order.vat.issued ? 'badge-success' : 'badge-warning'}`}>{t(order.vat.issued ? 'orders.vat.issued' : 'orders.vat.pending')}</span>
          </div>
          <p className="text-base-content/70">{order.vat.companyInfo?.companyName} · {t('orders.vat.taxCode')} {order.vat.companyInfo?.taxCode}</p>
          {order.vat.companyInfo?.companyAddress && <p className="text-xs text-base-content/55">{order.vat.companyInfo.companyAddress}</p>}
          {order.vat.issued && (
            <p className="mt-2">
              {t('orders.vat.number')} <span className="font-mono font-medium">{order.vat.invoiceNumber}</span>
              {order.vat.issuedAt && <span className="text-base-content/55"> · {formatDate(order.vat.issuedAt)}</span>}
              {order.vat.invoiceUrl && <> · <a href={order.vat.invoiceUrl} target="_blank" rel="noreferrer" className="link link-primary">{t('orders.vat.download')}</a></>}
            </p>
          )}
        </section>
      )}

      {/* Tiến trình — đơn hủy/hoàn tiền thì thay bằng thông báo (không nằm trên luồng chính) */}
      {isClosed ? (
        <div role="status" className="alert">{t(`orders.closed.${order.status}`)}</div>
      ) : (
        <ul className="steps steps-vertical w-full rounded-2xl border border-base-300 bg-base-100 p-4 text-xs sm:steps-horizontal">
          {ORDER_STATUS_FLOW.map((s, i) => (
            <li key={s} className={`step ${i <= stepIndex ? 'step-primary' : ''}`}>{t(`orders.status.${s}`)}</li>
          ))}
        </ul>
      )}

      <div className={`grid items-start gap-6 ${canCancel ? 'md:grid-cols-[1fr_320px]' : ''}`}>
        <div className="flex flex-col gap-5 rounded-2xl border border-base-300 bg-base-100 p-6">
          <div className="grid gap-6 text-sm md:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <h2 className="mb-1 text-base font-medium">{t('orders.shippingInfo')}</h2>
              <p>{order.recipientName} · {order.recipientPhone}</p>
              <p className="text-base-content/70">{[order.shippingAddress, order.ward, order.district, order.city].filter(Boolean).join(', ')}</p>
              {order.distanceKm != null && <p className="text-xs text-base-content/55">{t('orders.distance', { km: order.distanceKm })}</p>}
            </div>
            <div className="flex flex-col gap-1.5">
              <h2 className="mb-1 text-base font-medium">{t('orders.supplierInfo')}</h2>
              <p className="font-medium">{order.supplierName}</p>
              {order.storeAddress && <p className="text-base-content/70">{t('orders.shipFromBranch', { store: [order.storeAddress, order.storeCity].filter(Boolean).join(', ') })}</p>}
              {order.storePhone && <p className="text-base-content/70">{order.storePhone}</p>}
            </div>
          </div>

          {order.note && (
            <p className="rounded-xl bg-base-200/60 px-4 py-2 text-sm"><span className="text-base-content/60">{t('checkout.note')}:</span> {order.note}</p>
          )}

          <div>
            <h2 className="mb-3 text-base font-medium">{t('checkout.orderSummary')}</h2>
            <ul className="flex flex-col gap-2">
              {order.items.map((i) => (
                <li key={i.id} className="flex gap-3 text-sm">
                  <div className="min-w-0 flex-1">
                    <span className="line-clamp-1">{i.productName}</span>
                    <span className="text-xs text-base-content/55">
                      {[i.color, i.dimensions].filter(Boolean).join(' · ')}{(i.color || i.dimensions) ? ' · ' : ''}{formatVnd(i.unitPrice)} × {i.quantity}
                    </span>
                  </div>
                  <span className="shrink-0">{formatVnd(i.lineTotal)}</span>
                </li>
              ))}
            </ul>

            <div className="divider my-3" />
            <dl className="flex flex-col gap-1 text-sm">
              <div className="flex justify-between"><dt>{t('checkout.subtotal')}</dt><dd>{formatVnd(order.subtotal)}</dd></div>
              {order.productDiscount > 0 && <div className="flex justify-between text-success"><dt>{t('checkout.productDiscount')}</dt><dd>−{formatVnd(order.productDiscount)}</dd></div>}
              <div className="flex justify-between"><dt>{t('checkout.shippingFee')}</dt><dd>{order.shippingFee === 0 ? t('checkout.freeShipping') : formatVnd(order.shippingFee)}</dd></div>
              {order.shippingDiscount > 0 && <div className="flex justify-between text-success"><dt>{t('checkout.shippingDiscount')}</dt><dd>−{formatVnd(order.shippingDiscount)}</dd></div>}
            </dl>
            <div className="divider my-2" />
            <div className="flex justify-between text-lg font-semibold"><span>{t('checkout.orderTotal')}</span><span className="text-primary">{formatVnd(order.totalAmount)}</span></div>
            <p className="mt-2 text-xs text-base-content/50">{t('orders.placedAt', { date: formatDate(order.placedAt ?? order.createdAt) })}</p>
          </div>
        </div>

        {canCancel && (
          <aside className="flex flex-col gap-3 md:sticky md:top-24">
            <p className="text-sm text-base-content/70">{t('orders.payHint')}</p>
            {order.paymentId && (
              <OrderPaymentPanel
                paymentId={order.paymentId}
                orderId={order.id}
                fallback={{ status: order.paymentStatus, qrUrl: order.paymentQrUrl, txnRef: order.paymentTxnRef, expiresAt: order.paymentExpiresAt }}
              />
            )}
            {confirmCancel ? (
              <div className="flex flex-col gap-2 rounded-xl border border-error/40 bg-error/5 p-3 text-sm">
                <p>{t('orders.cancelConfirm')}</p>
                <div className="flex gap-2">
                  <button onClick={handleCancel} disabled={cancelOrder.isPending} className="btn btn-error btn-sm flex-1">
                    {cancelOrder.isPending ? <span className="loading loading-spinner loading-xs" /> : t('orders.cancelYes')}
                  </button>
                  <button onClick={() => setConfirmCancel(false)} className="btn btn-ghost btn-sm flex-1">{t('orders.cancelNo')}</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setConfirmCancel(true)} className="btn btn-outline btn-error btn-sm">{t('orders.cancel')}</button>
            )}
            {cancelErr && <p role="alert" className="text-xs text-error">{cancelErr}</p>}
          </aside>
        )}
      </div>
    </div>
  );
}
