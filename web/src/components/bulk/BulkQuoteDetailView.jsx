import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  useBulkQuote, useAcceptBulkQuote, useRejectBulkQuote, useCancelBulkQuote, useOfferBulkQuote, useDeclineBulkQuote,
} from '../../hooks/useBulkQuotes.js';
import { bulkQuoteMeta, savingPercent } from '../../utils/bulkQuoteStatus.js';
import { apiErrorMessage } from '../../utils/apiError.js';
import { formatVnd, formatDate } from '../../utils/format.js';
import OrderPaymentPanel from '../checkout/OrderPaymentPanel.jsx';

/*
 * Chi tiết 1 yêu cầu báo giá số lượng lớn (BE-08) — GET /bulk-quotes/{id}, dùng chung khách & NCC.
 *  - Khách: bảng so sánh giá niêm yết ↔ giá báo (% tiết kiệm); Chấp nhận (POST accept { offerId đang xem }) → 1 đơn
 *    chờ thanh toán + QR như checkout; Từ chối báo giá; Huỷ yêu cầu. 409 BULK_QUOTE_INVALID_STATE (NCC vừa báo giá lại)
 *    → tải lại để khách xem báo giá mới trước khi chấp nhận.
 *  - NCC: form báo giá (đơn giá cho MỌI dòng, ship, thời gian giao, số ngày hiệu lực, ghi chú) — gửi lại = thay báo
 *    giá cũ; Từ chối yêu cầu (lý do hiện cho khách). Giá là giá cuối cùng khách trả (BE không cộng thuế).
 */
export default function BulkQuoteDetailView({ role }) {
  const { id } = useParams();
  const { t } = useTranslation();
  const isSupplier = role === 'supplier';
  const { data: q, isLoading, isError, refetch } = useBulkQuote(id);
  const [checkout, setCheckout] = useState(null); // CheckoutResponse sau khi chấp nhận

  if (isLoading) return <div className="skeleton h-64 max-w-4xl rounded-2xl" />;
  if (isError || !q) {
    return (
      <div className="rounded-2xl border border-dashed border-base-300 bg-base-100 py-20 text-center">
        <p className="font-display text-xl">{isSupplier ? 'Không tìm thấy yêu cầu' : t('orders.notFound')}</p>
        <button onClick={() => refetch()} className="btn btn-outline btn-sm mt-3">↻</button>
      </div>
    );
  }

  const meta = bulkQuoteMeta(q.status);
  const offer = q.offer;
  const priceOf = (itemId) => offer?.items?.find((x) => x.quoteItemId === itemId);
  const base = isSupplier ? '/portal/supplier/bulk-quotes' : '/bulk-quotes';
  const other = isSupplier ? q.customer : q.supplier;

  return (
    <div className="flex max-w-4xl flex-col gap-6">
      <div>
        <Link to={base} className="text-sm text-base-content/55 hover:text-primary">← {isSupplier ? 'Báo giá số lượng lớn' : t('bulkQuote.back')}</Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl">{other?.companyName || other?.name}</h1>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.cls}`}>{meta.label}</span>
          {q.vatRequested && <span className="rounded-full bg-base-200 px-2.5 py-0.5 text-xs">{t('bulkQuote.vatRequested')}</span>}
        </div>
        <p className="mt-1 text-sm text-base-content/55">
          {formatDate(q.createdAt)}
          {q.status === 'pending' && q.expiresAt && ` · ${t('bulkQuote.expiresAt', { time: formatDate(q.expiresAt) })}`}
        </p>
      </div>

      {q.orderId && (
        <p className="rounded-xl border border-success/40 bg-success/10 p-3 text-sm">
          {t('bulkQuote.orderCreated')} <Link to={isSupplier ? '/portal/supplier/orders' : `/orders/${q.orderId}`} className="link font-medium">{t('bulkQuote.viewOrder')}</Link>
        </p>
      )}
      {q.status === 'declined' && (
        <p className="rounded-xl border border-error/30 bg-error/5 p-3 text-sm">{t('bulkQuote.declined')} {q.declineReason && t('bulkQuote.declineReason', { reason: q.declineReason })}</p>
      )}

      {/* Sản phẩm + so sánh giá */}
      <section className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead>
              <tr className="text-base-content/55">
                <th>{t('bulkQuote.variant')}</th><th className="text-right">{t('bulkQuote.quantity')}</th>
                <th className="text-right">{t('bulkQuote.listPrice')}</th>
                {offer && <><th className="text-right">{t('bulkQuote.unitPrice')}</th><th className="text-right">{t('bulkQuote.lineTotal')}</th></>}
              </tr>
            </thead>
            <tbody>
              {q.items.map((it) => {
                const p = priceOf(it.id);
                const pct = savingPercent(it.listPrice, p?.unitPrice);
                return (
                  <tr key={it.id}>
                    <td>
                      {it.productId ? <Link to={`/product/${it.productId}`} className="font-medium hover:text-primary">{it.productName}</Link> : <span className="font-medium">{it.productName}</span>}
                      <span className="block text-xs text-base-content/50">{[it.variantSku, it.color, it.dimensions].filter(Boolean).join(' · ')}</span>
                    </td>
                    <td className="text-right">{it.quantity}</td>
                    <td className="text-right text-base-content/60">{it.listPrice != null ? formatVnd(it.listPrice) : '—'}</td>
                    {offer && (
                      <>
                        <td className="text-right font-medium">{p ? formatVnd(p.unitPrice) : '—'}{pct > 0 && <span className="block text-xs text-success">{t('bulkQuote.saving', { pct })}</span>}</td>
                        <td className="text-right">{p ? formatVnd(p.lineTotal) : '—'}</td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="mt-3 grid gap-2 border-t border-base-200 pt-3 text-sm sm:grid-cols-2">
          <p><span className="text-base-content/55">{t('bulkQuote.address')}:</span> {q.recipientName} ({q.recipientPhone}), {[q.shippingAddress, q.ward, q.district, q.city].filter(Boolean).join(', ')}</p>
          {q.note && <p><span className="text-base-content/55">{t('bulkQuote.yourNote')}:</span> {q.note}</p>}
        </div>
      </section>

      {/* Báo giá hiện hành */}
      {offer ? (
        <section className="rounded-2xl border border-primary/30 bg-primary/5 p-5">
          <h2 className="mb-2 font-display text-lg">{t('bulkQuote.offerTitle')}</h2>
          <dl className="flex flex-col gap-1 text-sm">
            <div className="flex justify-between"><dt>{t('bulkQuote.subtotal')}</dt><dd>{formatVnd(offer.subtotal)}</dd></div>
            <div className="flex justify-between"><dt>{t('bulkQuote.shippingFee')}</dt><dd>{Number(offer.shippingFee) === 0 ? t('bulkQuote.free') : formatVnd(offer.shippingFee)}</dd></div>
            <div className="mt-1 flex justify-between border-t border-base-300 pt-2 font-semibold"><dt>{t('bulkQuote.total')}</dt><dd className="text-primary">{formatVnd(offer.totalAmount)}</dd></div>
          </dl>
          <p className="mt-2 text-xs text-base-content/60">
            {t('bulkQuote.leadTime', { days: offer.leadTimeDays })} · {offer.expired ? <span className="text-error">{t('bulkQuote.offerExpired')}</span> : t('bulkQuote.validUntil', { time: formatDate(offer.validUntil) })}
            {q.offerCount > 1 && ` · ${t('bulkQuote.reoffered', { count: q.offerCount - 1 })}`}
          </p>
          {offer.note && <p className="mt-2 text-sm"><span className="text-base-content/55">{t('bulkQuote.supplierNote')}:</span> {offer.note}</p>}
        </section>
      ) : !isSupplier && ['pending'].includes(q.status) && (
        <p className="rounded-2xl border border-dashed border-base-300 bg-base-100 p-6 text-center text-sm text-base-content/60">{t('bulkQuote.noOffer')}</p>
      )}

      {!isSupplier && !checkout && <CustomerActions quote={q} onAccepted={setCheckout} onConflict={refetch} />}
      {!isSupplier && checkout && (
        <section className="flex flex-col gap-3 sm:max-w-sm">
          <h2 className="font-display text-lg">{t('bulkQuote.payTitle')}</h2>
          <OrderPaymentPanel paymentId={checkout.payment.id} fallback={checkout.payment} onPaid={refetch} />
          <Link to={`/orders/${checkout.orders?.[0]?.id}`} className="btn btn-outline btn-sm">{t('bulkQuote.viewOrder')}</Link>
        </section>
      )}
      {isSupplier && ['pending', 'offered'].includes(q.status) && <SupplierActions quote={q} />}
    </div>
  );
}

function CustomerActions({ quote: q, onAccepted, onConflict }) {
  const { t } = useTranslation();
  const accept = useAcceptBulkQuote();
  const reject = useRejectBulkQuote();
  const cancel = useCancelBulkQuote();
  const [err, setErr] = useState('');
  const onError = (e) => {
    // NCC vừa gửi báo giá mới / yêu cầu đã kết thúc → tải lại để khách xem lại
    if (e?.response?.data?.errorCode === 'BULK_QUOTE_INVALID_STATE') { onConflict(); setErr(t('bulkQuote.changed')); return; }
    setErr(apiErrorMessage(e, t('order.genericError')));
  };
  const canAccept = q.status === 'offered' && q.offer && !q.offer.expired;

  if (!['pending', 'offered'].includes(q.status)) return null;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {canAccept && (
          <button onClick={() => { setErr(''); accept.mutate({ id: q.id, offerId: q.offer.id }, { onSuccess: onAccepted, onError }); }} disabled={accept.isPending} className="btn btn-primary">
            {accept.isPending ? <span className="loading loading-spinner loading-sm" /> : t('bulkQuote.accept')}
          </button>
        )}
        {q.status === 'offered' && (
          <button onClick={() => window.confirm(t('bulkQuote.confirmReject')) && reject.mutate(q.id, { onError })} disabled={reject.isPending} className="btn btn-outline btn-error">{t('bulkQuote.reject')}</button>
        )}
        <button onClick={() => window.confirm(t('bulkQuote.confirmCancel')) && cancel.mutate(q.id, { onError })} disabled={cancel.isPending} className="btn btn-ghost">{t('bulkQuote.cancelRequest')}</button>
      </div>
      {err && <p className="text-sm text-error">{err}</p>}
    </div>
  );
}

// Form báo giá của NCC — portal dùng tiếng Việt cố định như các trang portal khác
function SupplierActions({ quote: q }) {
  const offerMut = useOfferBulkQuote();
  const decline = useDeclineBulkQuote();
  const [prices, setPrices] = useState(() => Object.fromEntries(q.items.map((it) => {
    const cur = q.offer?.items?.find((x) => x.quoteItemId === it.id)?.unitPrice;
    return [it.id, String(cur ?? it.listPrice ?? '')];
  })));
  const [shippingFee, setShippingFee] = useState(String(q.offer?.shippingFee ?? 0));
  const [leadTimeDays, setLeadTimeDays] = useState(String(q.offer?.leadTimeDays ?? 7));
  const [validDays, setValidDays] = useState('7');
  const [note, setNote] = useState(q.offer?.note ?? '');
  const [declineReason, setDeclineReason] = useState('');
  const [err, setErr] = useState('');
  const [saved, setSaved] = useState(false);

  const subtotal = q.items.reduce((s, it) => s + (Number(prices[it.id]) || 0) * it.quantity, 0);

  const send = () => {
    setErr(''); setSaved(false);
    if (q.items.some((it) => !(Number(prices[it.id]) >= 1))) { setErr('Nhập đơn giá (≥ 1 ₫) cho mọi dòng.'); return; }
    const lt = Number(leadTimeDays); const vd = Number(validDays); const ship = Number(shippingFee);
    if (!(lt >= 1 && lt <= 365)) { setErr('Thời gian giao từ 1 đến 365 ngày.'); return; }
    if (!(vd >= 1 && vd <= 30)) { setErr('Hiệu lực báo giá từ 1 đến 30 ngày.'); return; }
    if (!(ship >= 0)) { setErr('Phí ship không được âm.'); return; }
    offerMut.mutate(
      { id: q.id, items: q.items.map((it) => ({ quoteItemId: it.id, unitPrice: Number(prices[it.id]) })), shippingFee: ship, leadTimeDays: lt, validDays: vd, note: note.trim() || undefined },
      { onSuccess: () => setSaved(true), onError: (e) => setErr(apiErrorMessage(e, 'Gửi báo giá chưa được.')) }
    );
  };
  const doDecline = () => {
    if (!window.confirm('Từ chối yêu cầu báo giá này? Khách sẽ thấy lý do bạn ghi.')) return;
    decline.mutate({ id: q.id, reason: declineReason.trim() || undefined }, { onError: (e) => setErr(apiErrorMessage(e, 'Từ chối chưa được.')) });
  };

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
      <h2 className="font-display text-lg">{q.offer ? 'Báo giá lại' : 'Gửi báo giá'}</h2>
      {q.offer && <p className="text-xs text-base-content/55">Báo giá mới sẽ THAY báo giá hiện tại. Khách đang xem báo giá cũ sẽ được yêu cầu xem lại.</p>}
      <div className="overflow-x-auto">
        <table className="table table-sm">
          <thead><tr className="text-base-content/55"><th>Sản phẩm</th><th className="text-right">SL</th><th className="text-right">Niêm yết</th><th className="w-36">Đơn giá báo (₫)</th></tr></thead>
          <tbody>
            {q.items.map((it) => (
              <tr key={it.id}>
                <td>{it.productName}<span className="block text-xs text-base-content/50">{[it.variantSku, it.color, it.dimensions].filter(Boolean).join(' · ')}</span></td>
                <td className="text-right">{it.quantity}</td>
                <td className="text-right text-base-content/60">{it.listPrice != null ? formatVnd(it.listPrice) : '—'}</td>
                <td><input type="number" min="1" value={prices[it.id]} onChange={(e) => setPrices((p) => ({ ...p, [it.id]: e.target.value }))} className="input input-bordered input-sm w-full" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="flex flex-col gap-1 text-sm"><span className="text-base-content/70">Phí ship (₫, 0 = miễn phí)</span><input type="number" min="0" value={shippingFee} onChange={(e) => setShippingFee(e.target.value)} className="input input-bordered input-sm" /></label>
        <label className="flex flex-col gap-1 text-sm"><span className="text-base-content/70">Thời gian giao (ngày)</span><input type="number" min="1" max="365" value={leadTimeDays} onChange={(e) => setLeadTimeDays(e.target.value)} className="input input-bordered input-sm" /></label>
        <label className="flex flex-col gap-1 text-sm"><span className="text-base-content/70">Hiệu lực báo giá (ngày)</span><input type="number" min="1" max="30" value={validDays} onChange={(e) => setValidDays(e.target.value)} className="input input-bordered input-sm" /></label>
      </div>
      <label className="flex flex-col gap-1 text-sm">
        <span className="text-base-content/70">Ghi chú cho khách</span>
        <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder="VD: Giá đã gồm VAT, giao làm 2 đợt" className="textarea textarea-bordered" />
        <span className="text-xs text-base-content/45">Giá bạn nhập là giá cuối cùng khách trả — hệ thống không cộng thêm thuế. Nếu đã gồm VAT, hãy ghi rõ.</span>
      </label>
      <p className="text-sm">Tổng báo giá: <b className="text-primary">{formatVnd(subtotal + (Number(shippingFee) || 0))}</b> <span className="text-base-content/50">(tiền hàng {formatVnd(subtotal)})</span></p>
      {err && <p className="text-sm text-error">{err}</p>}
      {saved && <p className="text-sm text-success">Đã gửi báo giá cho khách.</p>}
      <div className="flex flex-wrap items-end gap-2">
        <button onClick={send} disabled={offerMut.isPending} className="btn btn-primary">{offerMut.isPending ? <span className="loading loading-spinner loading-sm" /> : q.offer ? 'Gửi báo giá mới' : 'Gửi báo giá'}</button>
        <input value={declineReason} onChange={(e) => setDeclineReason(e.target.value)} placeholder="Lý do từ chối (tuỳ chọn)" className="input input-bordered input-sm ml-auto" />
        <button onClick={doDecline} disabled={decline.isPending} className="btn btn-outline btn-error btn-sm">Từ chối yêu cầu</button>
      </div>
    </section>
  );
}
