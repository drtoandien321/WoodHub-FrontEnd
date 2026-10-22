import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useIncomingQuotes } from '../../hooks/useQuotes.js';
import { quoteMeta } from '../../utils/quoteStatus.js';
import StatusBadge from '../../components/supplier/StatusBadge.jsx';
import { readDesignSnapshot } from '../../utils/designSnapshot.js';

const TABS = ['', 'pending', 'negotiating', 'accepted', 'rejected', 'expired', 'cancelled'];

/*
 * Yêu cầu báo giá gửi tới xưởng — GET /quotes/incoming (BE-8, FE-6). Bấm vào → chi tiết chung
 * /quotes/:id (component QuoteDetail.jsx tự nhận diện vai workshop, cho ra giá/chấp nhận/từ chối).
 * ⚠️ Thay thế hoàn toàn trang cũ (dữ liệu tĩnh W_ORDERS + nút "Gửi báo giá" không làm gì cả) —
 * đúng yêu cầu FE-6 #7 "không dùng toast giả để mô phỏng đã gửi báo giá".
 */
export default function WorkshopOrders() {
  const { t } = useTranslation();
  const [status, setStatus] = useState('');
  const { data, isLoading, isError, refetch } = useIncomingQuotes(status ? { status } : undefined);
  const items = data?.content ?? [];

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl">{t('quote.incomingTitle')}</h1>
        <p className="mt-1 text-base-content/60">{t('quote.incomingSubtitle')}</p>
      </header>

      <div className="overflow-x-auto">
        <div className="inline-flex gap-1 rounded-2xl border border-base-300 bg-base-100 p-1 shadow-sm">
          {TABS.map((v) => (
            <button key={v} onClick={() => setStatus(v)} className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm transition-colors ${status === v ? 'bg-primary text-primary-content' : 'text-base-content/70 hover:bg-base-200'}`}>
              {v ? t(`quote.status.${v}`) : t('shop.all')}
            </button>
          ))}
        </div>
      </div>

      {isError ? (
        <div className="rounded-2xl bg-error/10 p-6 text-center">
          <p className="text-sm text-error">{t('quote.loadError')}</p>
          <button onClick={() => refetch()} className="btn btn-outline btn-sm mt-3 border-base-300">{t('shop.retry')}</button>
        </div>
      ) : isLoading ? (
        <div className="flex flex-col gap-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
      ) : items.length ? (
        <div className="flex flex-col gap-3">
          {items.map((q) => (
            <Link key={q.id} to={`/quotes/${q.id}`} className="flex items-center gap-4 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm transition hover:border-primary md:p-5">
              {readDesignSnapshot(q.designSnapshot).posterUrl && <img src={readDesignSnapshot(q.designSnapshot).posterUrl} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" />}
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{q.customerName}</p>
                  <StatusBadge meta={quoteMeta(q.status)} />
                </div>
                <p className="mt-0.5 text-sm text-base-content/60">{t('quote.quantity')}: {q.quantity}{q.location ? ` · ${q.location}` : ''}</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <p className="py-10 text-center text-base-content/50">{t('quote.emptyIncoming')}</p>
      )}
    </div>
  );
}
