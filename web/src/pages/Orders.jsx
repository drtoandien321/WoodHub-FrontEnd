import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useOrders, pageInfoOf, orderStatusBadge } from '../hooks/useOrders.js';
import { formatVnd, formatDate } from '../utils/format.js';
import EmptyState from '../components/ui/EmptyState.jsx';

const PAGE_SIZE = 10;
// Tab lọc: '' = tất cả; các trạng thái khách hay quan tâm nhất
const FILTERS = ['', 'pending_payment', 'paid', 'shipping', 'completed', 'cancelled'];

/*
 * Đơn hàng của tôi — GET /api/orders (Page<OrderResponse>, mới nhất trước). Mỗi lần checkout có thể
 * sinh nhiều đơn (1 đơn / nhà cung cấp) nên mỗi thẻ hiện rõ tên nhà cung cấp + mã đơn dễ đọc.
 */
export default function Orders() {
  const { t } = useTranslation();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const { data, isLoading, isError, refetch } = useOrders({ status: status || undefined, page, size: PAGE_SIZE });

  const orders = data?.content ?? [];
  const pageInfo = pageInfoOf(data);

  const changeFilter = (s) => { setStatus(s); setPage(0); };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <h1 className="font-display text-3xl">{t('orders.title')}</h1>

      <div role="tablist" className="flex flex-wrap gap-2">
        {FILTERS.map((s) => (
          <button
            key={s || 'all'}
            role="tab"
            aria-selected={status === s}
            onClick={() => changeFilter(s)}
            className={`btn btn-sm rounded-full ${status === s ? 'btn-primary' : 'btn-ghost border border-base-300'}`}
          >
            {s ? t(`orders.status.${s}`) : t('orders.all')}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-28 w-full rounded-2xl" />)}</div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-error">{t('orders.loadError')}</p>
          <button onClick={() => refetch()} className="btn btn-outline btn-sm">{t('cart.retry')}</button>
        </div>
      ) : !orders.length ? (
        <EmptyState title={t('orders.empty')} hint={t('orders.emptyHint')} ctaLabel={t('orders.backToShop')} ctaTo="/shop" />
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {orders.map((o) => (
              <li key={o.id}>
                <Link
                  to={`/orders/${o.id}`}
                  className="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-5 transition-colors hover:border-primary/50 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-sm font-medium">{o.orderCode}</span>
                      <span className={`badge badge-sm ${orderStatusBadge(o.status)}`}>{t(`orders.status.${o.status}`)}</span>
                    </div>
                    <p className="mt-1 text-sm font-medium">{o.supplierName}</p>
                    <p className="mt-0.5 text-xs text-base-content/60">
                      {t('orders.date', { date: formatDate(o.placedAt ?? o.createdAt) })} · {t('orders.itemsCount', { count: o.items?.length ?? 0 })}
                    </p>
                    {o.status === 'pending_payment' && o.paymentStatus === 'pending' && (
                      <p className="mt-1 text-xs text-warning">{t('orders.awaitingPayment')}</p>
                    )}
                  </div>
                  <div className="flex flex-col sm:items-end">
                    <span className="text-xs text-base-content/60">{t('checkout.orderTotal')}</span>
                    <span className="text-lg font-semibold text-primary">{formatVnd(o.totalAmount)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>

          {pageInfo.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 text-sm">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={pageInfo.number === 0} className="btn btn-sm">«</button>
              <span>{t('orders.pageOf', { page: pageInfo.number + 1, total: pageInfo.totalPages })}</span>
              <button onClick={() => setPage((p) => p + 1)} disabled={pageInfo.number >= pageInfo.totalPages - 1} className="btn btn-sm">»</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
