import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMyDesigns, useDeleteDesign } from '../../hooks/useCustomDesigns.js';
import RequestQuoteModal from '../quote/RequestQuoteModal.jsx';

const STATUS_LABEL = { draft: 'custom.studio.designs.statusDraft', completed: 'custom.studio.designs.statusCompleted' };

/*
 * "Thiết kế của tôi" — GET /custom/designs/my. Dùng lại ở cuối bước 6 (Custom Studio) VÀ ở trang
 * riêng /custom/designs — 1 nguồn hiển thị duy nhất, không lặp code.
 * FE-6: thiết kế đã 'completed' có thêm nút "Yêu cầu báo giá" → chọn workshop → POST /quotes.
 */
export default function MyDesignsList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading, isError, refetch } = useMyDesigns();
  const deleteDesign = useDeleteDesign();
  const [quotingDesign, setQuotingDesign] = useState(null);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton h-32 rounded-xl" />)}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl bg-error/10 p-4 text-center text-sm text-error">
        {t('custom.studio.designs.loadError')}
        <button onClick={() => refetch()} className="btn btn-ghost btn-xs ml-2">{t('custom.ai.retry')}</button>
      </div>
    );
  }

  const items = data?.content ?? [];
  if (!items.length) {
    return <p className="rounded-xl border border-dashed border-base-300 p-6 text-center text-sm text-base-content/55">{t('custom.studio.designs.empty')}</p>;
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.map((d) => (
          <div key={d.id} className="group relative overflow-hidden rounded-xl border border-base-300 bg-base-100">
            <div className="h-24 w-full bg-gradient-to-br from-[#e7dcc6] to-[#bfa988]">
              {d.thumbnailUrl && <img src={d.thumbnailUrl} alt={d.name} className="h-full w-full object-cover" />}
            </div>
            <div className="p-2.5">
              <p className="truncate text-sm font-medium">{d.name}</p>
              <span className={`mt-1 inline-block rounded-full px-2 py-0.5 text-[11px] ${d.status === 'completed' ? 'bg-success/15 text-success' : 'bg-base-300/60 text-base-content/60'}`}>
                {t(STATUS_LABEL[d.status] ?? d.status)}
              </span>
              {d.status === 'completed' && (
                <button onClick={() => setQuotingDesign(d)} className="btn btn-primary btn-xs mt-2 w-full">
                  {t('quote.requestCta')}
                </button>
              )}
            </div>
            <button
              onClick={() => deleteDesign.mutate(d.id)}
              aria-label={t('custom.studio.designs.delete')}
              title={t('custom.studio.designs.delete')}
              className="absolute right-1.5 top-1.5 grid h-7 w-7 place-items-center rounded-full bg-base-100/85 text-base-content/60 opacity-0 backdrop-blur-sm transition hover:text-error group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
            </button>
          </div>
        ))}
      </div>

      {quotingDesign && (
        <RequestQuoteModal
          design={quotingDesign}
          onClose={() => setQuotingDesign(null)}
          onSuccess={(quote) => navigate(`/quotes/${quote.id}`)}
        />
      )}
    </>
  );
}
