import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore.js';
import { useAddresses, formatAddressLine } from '../../hooks/useAddresses.js';
import { useCreateBulkQuote } from '../../hooks/useBulkQuotes.js';
import { apiErrorMessage } from '../../utils/apiError.js';
import { formatVnd } from '../../utils/format.js';
import ModalShell from '../admin/ModalShell.jsx';

const MAX_QTY = 100_000;
const NOTE_MAX = 2000;

/*
 * Nút + modal "Yêu cầu báo giá số lượng lớn" ở trang sản phẩm (BE-08 §2.1) — CHỈ khách doanh nghiệp.
 * Một yêu cầu gửi cho 1 NCC → ở đây gồm các biến thể của chính sản phẩm đang xem (cùng NCC). Địa chỉ bắt buộc có toạ độ.
 * Lỗi BUSINESS_PROFILE_REQUIRED → dẫn tới Hồ sơ doanh nghiệp (/profile#business).
 */
export default function BulkQuoteRequestButton({ product }) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  if (user?.role !== 'customer' || user.customerType !== 'business' || !product?.variants?.length) return null;

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn btn-outline gap-2">{t('bulkQuote.cta')}</button>
      <p className="-mt-1 text-xs text-base-content/70">{t('bulkQuote.ctaHint')}</p>
      {open && <RequestModal product={product} onClose={() => setOpen(false)} />}
    </>
  );
}

function RequestModal({ product, onClose }) {
  const { t } = useTranslation();
  const { data: addresses = [] } = useAddresses();
  const create = useCreateBulkQuote();
  const usable = addresses.filter((a) => a.hasCoordinates);
  const [qty, setQty] = useState(() => Object.fromEntries(product.variants.map((v, i) => [v.id, i === 0 ? '10' : ''])));
  const [addressId, setAddressId] = useState(() => (usable.find((a) => a.isDefault) ?? usable[0])?.id ?? '');
  const [vat, setVat] = useState(true);
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');
  const [needProfile, setNeedProfile] = useState(false);
  const [created, setCreated] = useState(null);
  const pickedAddress = addressId || (usable.find((a) => a.isDefault) ?? usable[0])?.id || '';

  const label = (v) => [v.sku, v.color, v.dimensions].filter(Boolean).join(' · ') || product.name;

  const submit = () => {
    setErr(''); setNeedProfile(false);
    const items = Object.entries(qty).map(([variantId, q]) => ({ variantId, quantity: Number(q) })).filter((x) => x.quantity > 0);
    if (!items.length) { setErr(t('bulkQuote.needOne')); return; }
    if (!pickedAddress) { setErr(t('bulkQuote.noAddress')); return; }
    create.mutate({ items, addressId: pickedAddress, vatInvoice: vat, note: note.trim() || undefined }, {
      onSuccess: setCreated,
      onError: (e) => {
        if (e?.response?.data?.errorCode === 'BUSINESS_PROFILE_REQUIRED') { setNeedProfile(true); return; }
        setErr(apiErrorMessage(e, t('bulkQuote.needOne')));
      },
    });
  };

  return (
    <ModalShell
      open
      onClose={onClose}
      title={t('bulkQuote.modalTitle')}
      maxWidth="max-w-xl"
      footer={created ? (
        <Link to={`/bulk-quotes/${created.id}`} className="btn btn-primary">{t('bulkQuote.viewRequest')}</Link>
      ) : (
        <>
          <button onClick={onClose} disabled={create.isPending} className="btn btn-ghost">{t('bulkQuote.cancel')}</button>
          <button onClick={submit} disabled={create.isPending} className="btn btn-primary">{create.isPending ? <span className="loading loading-spinner loading-sm" /> : t('bulkQuote.submit')}</button>
        </>
      )}
    >
      {created ? (
        <p className="py-6 text-center text-sm text-success">{t('bulkQuote.sent')}</p>
      ) : (
        <div className="flex flex-col gap-4 text-sm">
          <p className="font-medium">{product.name} <span className="font-normal text-base-content/70">· {product.supplierName}</span></p>
          <table className="table table-sm">
            <thead><tr className="text-base-content/70"><th>{t('bulkQuote.variant')}</th><th className="text-right">{t('bulkQuote.listPrice')}</th><th className="w-28">{t('bulkQuote.quantity')}</th></tr></thead>
            <tbody>
              {product.variants.map((v) => (
                <tr key={v.id}>
                  <td>{label(v)}</td>
                  <td className="text-right text-base-content/70">{formatVnd(v.price)}</td>
                  <td><input type="number" min="0" max={MAX_QTY} value={qty[v.id]} onChange={(e) => setQty((q) => ({ ...q, [v.id]: e.target.value }))} className="input input-bordered input-sm w-full" /></td>
                </tr>
              ))}
            </tbody>
          </table>

          <label className="flex flex-col gap-1.5">
            <span className="text-base-content/70">{t('bulkQuote.address')}</span>
            {usable.length ? (
              <select value={pickedAddress} onChange={(e) => setAddressId(e.target.value)} className="select select-bordered w-full">
                {usable.map((a) => <option key={a.id} value={a.id}>{a.recipientName} — {formatAddressLine(a)}</option>)}
              </select>
            ) : (
              <span className="text-warning">{t('bulkQuote.noAddress')} <Link to="/account/addresses" className="link">{t('bulkQuote.manageAddress')}</Link></span>
            )}
          </label>

          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" className="checkbox checkbox-primary checkbox-sm" checked={vat} onChange={(e) => setVat(e.target.checked)} />
            {t('bulkQuote.vat')}
          </label>

          <label className="flex flex-col gap-1.5">
            <span className="text-base-content/70">{t('bulkQuote.note')}</span>
            <textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX))} rows={3} placeholder={t('bulkQuote.notePlaceholder')} className="textarea textarea-bordered w-full" />
          </label>

          {needProfile && (
            <p className="rounded-lg bg-warning/10 p-3 text-warning">{t('bulkQuote.needProfile')} <Link to="/profile#business" className="link font-medium">{t('bulkQuote.goProfile')}</Link></p>
          )}
          {err && <p className="text-error">{err}</p>}
        </div>
      )}
    </ModalShell>
  );
}
