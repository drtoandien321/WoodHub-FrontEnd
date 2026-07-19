import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuoteDetail, useCreateOffer, useAcceptOffer, useRejectOffer, useCancelQuote } from '../hooks/useQuotes.js';
import { useAuthStore } from '../stores/authStore.js';
import { quoteMeta, offerMeta } from '../utils/quoteStatus.js';
import { ai3dErrorKey } from '../utils/ai3dErrors.js';
import StatusBadge from '../components/supplier/StatusBadge.jsx';
import { formatVnd } from '../utils/format.js';

const TERMINAL = new Set(['accepted', 'rejected', 'expired', 'cancelled']);

/*
 * Chi tiết 1 yêu cầu báo giá (BE-8, FE-6) — DÙNG CHUNG cho cả 2 vai (customer xem "của tôi",
 * workshop xem "đơn đến"): GET /quotes/:id trả đủ dữ liệu, quyền xem đã được BE chặn theo vai.
 * myRole suy từ so sánh user.id với quote.customerId (đơn giản, đúng cho customer; workshop suy
 * loại trừ — xem ghi chú actorRole() ở mockAdapter.js cho giới hạn của cách này trong mock).
 */
export default function QuoteDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const me = useAuthStore((s) => s.user);
  const { data: quote, isLoading, isError, refetch } = useQuoteDetail(id);
  const createOffer = useCreateOffer();
  const acceptOffer = useAcceptOffer();
  const rejectOffer = useRejectOffer();
  const cancelQuote = useCancelQuote();

  const [price, setPrice] = useState('');
  const [leadTimeDays, setLeadTimeDays] = useState('');
  const [note, setNote] = useState('');

  if (isLoading) return <div className="skeleton h-64 max-w-3xl rounded-3xl" />;
  if (isError || !quote) {
    return (
      <div className="rounded-3xl border border-dashed border-base-300 bg-base-100 py-20 text-center">
        <p className="font-display text-2xl">{t('quote.notFound')}</p>
        <button onClick={() => refetch()} className="btn btn-outline btn-sm mt-3 border-base-300">{t('shop.retry')}</button>
      </div>
    );
  }

  const myRole = me?.id === quote.customerId ? 'customer' : 'workshop';
  const otherPartyName = myRole === 'customer' ? quote.workshopName : quote.customerName;
  const isTerminal = TERMINAL.has(quote.status);
  const offers = quote.offers ?? [];
  const latestOffer = offers[offers.length - 1];
  const canRespond = latestOffer?.status === 'pending' && latestOffer.offeredBy !== myRole;
  const canCounter = !isTerminal;
  const canCancel = myRole === 'customer' && !isTerminal;

  const submitOffer = (e) => {
    e.preventDefault();
    createOffer.mutate({ quoteId: id, price: Number(price), leadTimeDays: Number(leadTimeDays), note: note || undefined }, {
      onSuccess: () => { setPrice(''); setLeadTimeDays(''); setNote(''); },
    });
  };

  const handleAccept = () => {
    acceptOffer.mutate({ quoteId: id, offerId: latestOffer.id }, {
      onSuccess: (order) => navigate(`/custom-orders/${order.id}`),
    });
  };

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <Link to={myRole === 'customer' ? '/quotes' : '/portal/workshop/orders'} className="text-sm text-base-content/55 hover:text-primary">← {t('quote.myQuotesTitle')}</Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl">{otherPartyName}</h1>
          <StatusBadge meta={quoteMeta(quote.status)} />
        </div>
      </div>

      {/* Thông tin yêu cầu */}
      <div className="rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          {quote.designSnapshot?.thumbnailUrl && (
            <img src={quote.designSnapshot.thumbnailUrl} alt="" className="h-24 w-24 shrink-0 rounded-2xl object-cover" />
          )}
          <div className="grid flex-1 grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div><p className="text-base-content/50">{t('quote.quantity')}</p><p className="font-medium">{quote.quantity}</p></div>
            {quote.location && <div><p className="text-base-content/50">{t('quote.location')}</p><p className="font-medium">{quote.location}</p></div>}
            {quote.designSnapshot?.configuration?.material && (
              <div><p className="text-base-content/50">{t('product.material')}</p><p className="font-medium">{quote.designSnapshot.configuration.material}</p></div>
            )}
          </div>
        </div>
        {quote.note && <p className="mt-3 rounded-xl bg-base-200/60 p-3 text-sm text-base-content/70">{quote.note}</p>}
      </div>

      {quote.status === 'accepted' && (
        <div className="rounded-2xl bg-success/10 p-4 text-sm text-success-content">
          {t('quote.orderCreatedHint')} <Link to="/custom-orders" className="font-medium underline">{t('quote.viewOrders')}</Link>
        </div>
      )}

      {/* Lịch sử offer */}
      <div>
        <h2 className="mb-3 font-display text-xl">{t('quote.offersTitle')}</h2>
        {offers.length === 0 ? (
          <p className="text-sm text-base-content/55">{t('quote.noOffers')}</p>
        ) : (
          <ol className="flex flex-col gap-3">
            {offers.map((o) => (
              <li key={o.id} className="rounded-2xl border border-base-300 bg-base-100 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium">{o.offeredBy === 'workshop' ? t('quote.offeredByWorkshop') : t('quote.offeredByCustomer')}</span>
                  <StatusBadge meta={offerMeta(o.status)} />
                </div>
                <p className="mt-1 text-2xl font-semibold text-primary">{formatVnd(o.price)}</p>
                <p className="text-sm text-base-content/60">{t('quote.leadTime', { days: o.leadTimeDays })}</p>
                {o.note && <p className="mt-1 text-sm text-base-content/70">{o.note}</p>}
              </li>
            ))}
          </ol>
        )}

        {canRespond && (
          <div className="mt-3 flex gap-2">
            <button onClick={() => rejectOffer.mutate({ quoteId: id, offerId: latestOffer.id })} disabled={rejectOffer.isPending} className="btn btn-outline btn-sm border-base-300">
              {t('quote.reject')}
            </button>
            <button onClick={handleAccept} disabled={acceptOffer.isPending} className="btn btn-primary btn-sm">
              {acceptOffer.isPending ? <span className="loading loading-spinner loading-xs" /> : t('quote.accept')}
            </button>
          </div>
        )}
        {(acceptOffer.isError || rejectOffer.isError) && (
          <p className="mt-2 text-sm text-error">{t(ai3dErrorKey(acceptOffer.error || rejectOffer.error))}</p>
        )}
      </div>

      {/* Ra giá / counter-offer */}
      {canCounter && (
        <form onSubmit={submitOffer} className="flex flex-col gap-3 rounded-3xl border border-base-300 bg-base-100 p-5">
          <h2 className="font-display text-lg">{offers.length ? t('quote.counterOfferTitle') : t('quote.firstOfferTitle')}</h2>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-base-content/70">{t('quote.price')} <span className="text-error">*</span></span>
              <input type="number" min={1} required value={price} onChange={(e) => setPrice(e.target.value)} className="input input-bordered rounded-xl" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-base-content/70">{t('quote.leadTimeDays')} <span className="text-error">*</span></span>
              <input type="number" min={1} required value={leadTimeDays} onChange={(e) => setLeadTimeDays(e.target.value)} className="input input-bordered rounded-xl" />
            </label>
          </div>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder={t('quote.notePlaceholder')} className="textarea textarea-bordered rounded-xl" />
          {createOffer.isError && <p className="text-sm text-error">{t(ai3dErrorKey(createOffer.error))}</p>}
          <button type="submit" disabled={createOffer.isPending} className="btn btn-primary self-start">
            {createOffer.isPending ? <span className="loading loading-spinner loading-sm" /> : t('quote.send')}
          </button>
        </form>
      )}

      {canCancel && (
        <button onClick={() => cancelQuote.mutate(id)} disabled={cancelQuote.isPending} className="btn btn-ghost btn-sm self-start text-error">
          {t('quote.cancelRequest')}
        </button>
      )}
    </div>
  );
}
