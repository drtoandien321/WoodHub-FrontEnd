import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMyBulkQuotes, useSupplierBulkQuotes } from '../../hooks/useBulkQuotes.js';
import { bulkQuoteMeta, BULK_QUOTE_TABS } from '../../utils/bulkQuoteStatus.js';
import { formatVnd, formatDate } from '../../utils/format.js';
import Pagination from '../ui/Pagination.jsx';

const PAGE_SIZE = 20;

/*
 * Danh sách yêu cầu báo giá số lượng lớn (BE-08) — dùng chung:
 *  - role="customer": GET /bulk-quotes (yêu cầu của tôi) → link /bulk-quotes/:id
 *  - role="supplier": GET /supplier/bulk-quotes (gửi tới tôi), mặc định tab "Chờ báo giá" → link /portal/supplier/bulk-quotes/:id
 */
export default function BulkQuoteList({ role }) {
  const { t } = useTranslation();
  const isSupplier = role === 'supplier';
  const [status, setStatus] = useState(isSupplier ? 'pending' : '');
  const [page, setPage] = useState(0);
  const params = { status: status || undefined, page, size: PAGE_SIZE };
  const mine = useMyBulkQuotes(params, { enabled: !isSupplier });
  const incoming = useSupplierBulkQuotes(params, { enabled: isSupplier });
  const q = isSupplier ? incoming : mine;
  const items = q.data?.content ?? [];
  const pageInfo = q.data?.page ?? { number: 0, totalPages: 1, totalElements: 0 };
  const base = isSupplier ? '/portal/supplier/bulk-quotes' : '/bulk-quotes';

  return (
    <div className="flex flex-col gap-5">
      <header>
        <h1 className="font-display text-3xl">{isSupplier ? 'Báo giá số lượng lớn' : t('bulkQuote.myTitle')}</h1>
        <p className="mt-1 text-base-content/60">{isSupplier ? 'Khách doanh nghiệp gửi yêu cầu giá sỉ — báo giá trong 7 ngày, quá hạn yêu cầu tự hết hạn.' : t('bulkQuote.mySubtitle')}</p>
      </header>

      <div className="overflow-x-auto">
        <div className="inline-flex gap-1 rounded-2xl border border-base-300 bg-base-100 p-1">
          {BULK_QUOTE_TABS.map((s) => (
            <button key={s || 'all'} onClick={() => { setStatus(s); setPage(0); }} className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm ${status === s ? 'bg-primary text-primary-content' : 'text-base-content/70 hover:bg-base-200'}`}>
              {s ? bulkQuoteMeta(s).label : t('bulkQuote.all')}
            </button>
          ))}
        </div>
      </div>

      {q.isLoading ? (
        <div className="flex flex-col gap-2">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
      ) : q.isError ? (
        <p className="text-center text-error">{isSupplier ? 'Không tải được danh sách.' : t('notifications.loadError')} <button onClick={() => q.refetch()} className="link">↻</button></p>
      ) : !items.length ? (
        <div className="rounded-2xl border border-dashed border-base-300 bg-base-100 py-12 text-center">
          <p className="text-base-content/60">{isSupplier ? 'Không có yêu cầu nào.' : t('bulkQuote.empty')}</p>
          {!isSupplier && <p className="mt-1 text-xs text-base-content/45">{t('bulkQuote.emptyHint')}</p>}
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((b) => {
            const meta = bulkQuoteMeta(b.status);
            const other = isSupplier ? (b.customer?.companyName || b.customer?.name) : (b.supplier?.companyName || b.supplier?.name);
            const qtySum = (b.items ?? []).reduce((s, i) => s + i.quantity, 0);
            return (
              <li key={b.id}>
                <Link to={`${base}/${b.id}`} className="flex flex-col gap-2 rounded-2xl border border-base-300 bg-base-100 p-4 transition-colors hover:border-primary/50 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{other}</span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.cls}`}>{meta.label}</span>
                      {b.vatRequested && <span className="rounded-full bg-base-200 px-2 py-0.5 text-xs">VAT</span>}
                    </div>
                    <p className="mt-1 truncate text-sm text-base-content/70">{(b.items ?? []).map((i) => `${i.productName} × ${i.quantity}`).join(', ')}</p>
                    <p className="text-xs text-base-content/50">{formatDate(b.createdAt)} · {t('bulkQuote.items', { count: qtySum })}</p>
                  </div>
                  {b.offer && <span className="shrink-0 text-lg font-semibold text-primary">{formatVnd(b.offer.totalAmount)}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      <Pagination pageInfo={pageInfo} onChange={setPage} />
    </div>
  );
}
