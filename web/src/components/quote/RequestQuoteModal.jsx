import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { usePublicSuppliers } from '../../hooks/usePublicSuppliers.js';
import { useCreateQuote } from '../../hooks/useQuotes.js';
import { ai3dErrorKey } from '../../utils/ai3dErrors.js';

/*
 * RequestQuoteModal — FE-6 bước 1/2: chọn 1 workshop + kích thước/vật liệu (lấy tự động từ
 * design.configuration, không hỏi lại) + số lượng/ghi chú/địa điểm → POST /quotes.
 * Danh sách workshop lấy từ GET /suppliers/public?type=workshop (ĐÃ THẬT — xem client.js).
 */
export default function RequestQuoteModal({ design, onClose, onSuccess }) {
  const { t } = useTranslation();
  const { data: workshopsPage, isLoading: workshopsLoading } = usePublicSuppliers({ type: 'workshop', size: 50 });
  const createQuote = useCreateQuote();

  const [workshopId, setWorkshopId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [location, setLocation] = useState('');
  const [note, setNote] = useState('');

  const workshops = workshopsPage?.content ?? [];

  const handleSubmit = (e) => {
    e.preventDefault();
    createQuote.mutate(
      { workshopId, customDesignId: design.id, quantity, location: location || undefined, note: note || undefined },
      { onSuccess: (quote) => onSuccess(quote) }
    );
  };

  return (
    <div className="modal modal-open" role="dialog" aria-modal="true">
      <div className="modal-box max-w-md rounded-3xl">
        <button onClick={onClose} aria-label={t('rooms.close')} className="btn btn-ghost btn-sm btn-circle absolute right-3 top-3">✕</button>
        <h3 className="font-display text-xl">{t('quote.requestTitle')}</h3>
        <p className="mt-1 text-sm text-base-content/60">{t('quote.requestSubtitle', { name: design.name })}</p>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-base-content/70">{t('quote.chooseWorkshop')} <span className="text-error">*</span></span>
            {workshopsLoading ? (
              <div className="skeleton h-12 w-full rounded-xl" />
            ) : workshops.length ? (
              <select required value={workshopId} onChange={(e) => setWorkshopId(e.target.value)} className="select select-bordered w-full rounded-xl">
                <option value="" disabled>{t('quote.selectPlaceholder')}</option>
                {workshops.map((w) => <option key={w.id} value={w.id}>{w.businessName}</option>)}
              </select>
            ) : (
              <p className="text-sm text-base-content/50">{t('quote.noWorkshops')}</p>
            )}
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-base-content/70">{t('quote.quantity')} <span className="text-error">*</span></span>
            <input type="number" min={1} required value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="input input-bordered w-full rounded-xl" />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-base-content/70">{t('quote.location')}</span>
            <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder={t('quote.locationPlaceholder')} className="input input-bordered w-full rounded-xl" />
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-base-content/70">{t('quote.note')}</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder={t('quote.notePlaceholder')} className="textarea textarea-bordered w-full rounded-xl" />
          </label>

          {createQuote.isError && <p className="text-sm text-error" role="alert">{t(ai3dErrorKey(createQuote.error))}</p>}

          <div className="mt-1 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="btn btn-ghost">{t('rooms.close')}</button>
            <button type="submit" disabled={!workshopId || createQuote.isPending} className="btn btn-primary">
              {createQuote.isPending ? <span className="loading loading-spinner loading-sm" /> : t('quote.send')}
            </button>
          </div>
        </form>
      </div>
      <div className="modal-backdrop bg-black/40" onClick={onClose} />
    </div>
  );
}
