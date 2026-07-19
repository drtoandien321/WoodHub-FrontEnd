import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMyCustomOrders } from '../hooks/useQuotes.js';
import { customOrderMeta } from '../utils/quoteStatus.js';
import StatusBadge from '../components/supplier/StatusBadge.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { formatVnd } from '../utils/format.js';

const TABS = ['', 'pending', 'confirmed', 'in_production', 'completed', 'cancelled'];

// "Đơn custom của tôi" — GET /custom-orders/my (customer).
export default function MyCustomOrders() {
  const { t } = useTranslation();
  const [status, setStatus] = useState('');
  const { data, isLoading, isError, refetch } = useMyCustomOrders(status ? { status } : undefined);
  const items = data?.content ?? [];

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      <div>
        <h1 className="font-display text-3xl">{t('order.myOrdersTitle')}</h1>
        <p className="mt-1 text-sm text-base-content/60">{t('order.myOrdersSubtitle')}</p>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-flex gap-1 rounded-2xl border border-base-300 bg-base-100 p-1 shadow-sm">
          {TABS.map((v) => (
            <button key={v} onClick={() => setStatus(v)} className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm transition-colors ${status === v ? 'bg-primary text-primary-content' : 'text-base-content/70 hover:bg-base-200'}`}>
              {v ? t(`order.status.${v}`) : t('shop.all')}
            </button>
          ))}
        </div>
      </div>

      {isError ? (
        <div className="rounded-2xl bg-error/10 p-6 text-center">
          <p className="text-sm text-error">{t('order.loadError')}</p>
          <button onClick={() => refetch()} className="btn btn-outline btn-sm mt-3 border-base-300">{t('shop.retry')}</button>
        </div>
      ) : isLoading ? (
        <div className="flex flex-col gap-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
      ) : items.length ? (
        <div className="flex flex-col gap-3">
          {items.map((o) => (
            <Link key={o.id} to={`/custom-orders/${o.id}`} className="flex items-center gap-4 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm transition hover:border-primary">
              {o.designSnapshot?.thumbnailUrl && <img src={o.designSnapshot.thumbnailUrl} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-mono text-xs text-base-content/50">{o.orderNumber}</p>
                  <StatusBadge meta={customOrderMeta(o.status)} />
                </div>
                <p className="mt-0.5 font-medium">{o.workshopName}</p>
              </div>
              <p className="shrink-0 font-semibold text-primary">{formatVnd(o.totalAmount)}</p>
            </Link>
          ))}
        </div>
      ) : (
        <EmptyState title={t('order.emptyTitle')} hint={t('order.emptyHint')} ctaLabel={t('quote.myQuotesTitle')} ctaTo="/quotes" />
      )}
    </div>
  );
}
