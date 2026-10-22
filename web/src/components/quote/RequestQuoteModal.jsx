import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePublicSuppliers } from '../../hooks/usePublicSuppliers.js';
import { useCreateQuote } from '../../hooks/useQuotes.js';
import { apiErrorMessage } from '../../utils/apiError.js';
import { useAddresses, formatAddressLine } from '../../hooks/useAddresses.js';

const OTHER = '__other__'; // giá trị option "Nhập địa chỉ khác"
const MIN_LOCATION = 10;  // chặn chuỗi rác kiểu "qu" (lỗi QA 20/10 — xưởng không biết giao/khảo sát ở đâu)

/*
 * RequestQuoteModal — FE-6 bước 1/2: chọn 1 workshop + kích thước/vật liệu (lấy tự động từ
 * design.configuration, không hỏi lại) + số lượng/ghi chú/địa điểm → POST /quotes.
 * Danh sách workshop lấy từ GET /suppliers/public?type=workshop (ĐÃ THẬT — xem client.js).
 *
 * Địa điểm: chọn từ SỔ ĐỊA CHỈ (mặc định chọn địa chỉ mặc định) → gửi chuỗi địa chỉ đầy đủ vào `location`
 * (BE hiện chỉ nhận text — đề xuất addressId ở docx BE, BE-02). Vẫn cho "Nhập địa chỉ khác" nhưng tối thiểu
 * MIN_LOCATION ký tự. Trước đây ô nhập tự do, không bắt buộc → báo giá có địa điểm "qu".
 */
export default function RequestQuoteModal({ design, onClose, onSuccess }) {
  const { t } = useTranslation();
  const { data: workshopsPage, isLoading: workshopsLoading } = usePublicSuppliers({ type: 'workshop', size: 50 });
  const createQuote = useCreateQuote();

  const [workshopId, setWorkshopId] = useState('');
  // Chuỗi để ô số lượng xoá trắng được khi gõ; đổi sang số lúc gửi (input có min=1 + required chặn rỗng/0)
  const [quantity, setQuantity] = useState('1');
  const { data: addresses = [], isLoading: addressesLoading } = useAddresses();
  const [addressChoice, setAddressChoice] = useState(''); // id địa chỉ trong sổ | OTHER
  const [customLocation, setCustomLocation] = useState('');
  const [locationError, setLocationError] = useState('');

  // Sổ địa chỉ tải xong → chọn sẵn địa chỉ mặc định (không có thì địa chỉ đầu tiên; sổ trống → nhập tay)
  useEffect(() => {
    if (addressChoice || addressesLoading) return;
    const def = addresses.find((a) => a.isDefault) ?? addresses[0];
    setAddressChoice(def ? def.id : OTHER);
  }, [addresses, addressesLoading, addressChoice]);
  const [note, setNote] = useState('');

  const workshops = workshopsPage?.content ?? [];

  const handleSubmit = (e) => {
    e.preventDefault();
    const picked = addresses.find((a) => a.id === addressChoice);
    const location = picked ? formatAddressLine(picked) : customLocation.trim();
    if (location.length < MIN_LOCATION) {
      setLocationError(t('quote.locationTooShort', { min: MIN_LOCATION }));
      return;
    }
    setLocationError('');
    createQuote.mutate(
      { workshopId, customDesignId: design.id, quantity: Number(quantity), location, note: note || undefined },
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
            <input type="number" min={1} required value={quantity} onChange={(e) => setQuantity(e.target.value.replace(/\D/g, ''))} className="input input-bordered w-full rounded-xl" />
          </label>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="quote-location" className="text-sm text-base-content/70">{t('quote.location')} <span className="text-error">*</span></label>
            {addressesLoading ? (
              <div className="skeleton h-12 w-full rounded-xl" />
            ) : (
              <select id="quote-location" value={addressChoice} onChange={(e) => { setAddressChoice(e.target.value); setLocationError(''); }} className="select select-bordered w-full rounded-xl">
                {addresses.map((a) => (
                  <option key={a.id} value={a.id}>{a.recipientName} · {formatAddressLine(a)}</option>
                ))}
                <option value={OTHER}>{t('quote.locationOther')}</option>
              </select>
            )}
            {addressChoice === OTHER && (
              <input value={customLocation} onChange={(e) => { setCustomLocation(e.target.value); setLocationError(''); }} placeholder={t('quote.locationPlaceholder')} className="input input-bordered w-full rounded-xl" />
            )}
            {!addressesLoading && !addresses.length && (
              <Link to="/account/addresses" className="text-xs text-primary hover:underline">{t('quote.addAddress')}</Link>
            )}
            {locationError && <p className="text-xs text-error" role="alert">{locationError}</p>}
          </div>

          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-base-content/70">{t('quote.note')}</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder={t('quote.notePlaceholder')} className="textarea textarea-bordered w-full rounded-xl" />
          </label>

          {createQuote.isError && <p className="text-sm text-error" role="alert">{apiErrorMessage(createQuote.error, t('order.genericError'))}</p>}

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
