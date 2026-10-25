import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAddresses, useDeleteAddress, useSetDefaultAddress, formatAddressLine } from '../hooks/useAddresses.js';
import AddressFormModal from '../components/address/AddressFormModal.jsx';
import { Plus, Trash } from '../components/suppliers/icons.jsx';

/*
 * Sổ địa chỉ giao hàng (/account/addresses) — xem/thêm/sửa/xoá/đặt mặc định.
 * Địa chỉ chưa có toạ độ (hasCoordinates=false) hiện cảnh báo + nút "Ghim vị trí" mở thẳng form
 * sửa, vì checkout chỉ nhận địa chỉ đã có toạ độ (BE cần lat/lng để tính phí ship theo khoảng cách).
 */
export default function MyAddresses() {
  const { t } = useTranslation();
  const { data: addresses = [], isLoading, isError, refetch } = useAddresses();
  const deleteAddress = useDeleteAddress();
  const setDefault = useSetDefaultAddress();

  // editing: null = đóng modal, 'new' = thêm mới, object = sửa địa chỉ đó
  const [editing, setEditing] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [actionErr, setActionErr] = useState('');

  const onActionError = () => setActionErr(t('address.actionFailed'));
  const handleDelete = (id) => {
    setActionErr('');
    deleteAddress.mutate(id, { onSuccess: () => setConfirmDeleteId(null), onError: onActionError });
  };
  const handleSetDefault = (id) => {
    setActionErr('');
    setDefault.mutate(id, { onError: onActionError });
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">{t('address.pageTitle')}</h1>
          <p className="mt-1 text-sm text-base-content/70">{t('address.pageHint')}</p>
        </div>
        <button onClick={() => setEditing('new')} className="btn btn-primary btn-sm gap-1.5">
          <Plus width={16} height={16} /> {t('address.add')}
        </button>
      </header>

      {actionErr && <div role="alert" className="alert alert-error py-2 text-sm">{actionErr}</div>}

      {isLoading ? (
        <div className="flex flex-col gap-3">{[0, 1].map((i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}</div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-base-300 bg-base-100 p-8 text-center">
          <p className="text-error">{t('address.loadError')}</p>
          <button onClick={() => refetch()} className="btn btn-outline btn-sm">{t('cart.retry')}</button>
        </div>
      ) : !addresses.length ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-base-300 bg-base-100 p-10 text-center">
          <span className="text-4xl" aria-hidden="true">📍</span>
          <p className="font-medium">{t('address.empty')}</p>
          <p className="text-sm text-base-content/70">{t('address.emptyHint')}</p>
          <button onClick={() => setEditing('new')} className="btn btn-primary btn-sm mt-1">{t('address.add')}</button>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {addresses.map((a) => {
            const busy = (deleteAddress.isPending && deleteAddress.variables === a.id) || (setDefault.isPending && setDefault.variables === a.id);
            return (
              <li
                key={a.id}
                className={`flex flex-col gap-3 rounded-2xl border bg-base-100 p-4 transition-opacity sm:flex-row sm:items-start sm:justify-between ${a.isDefault ? 'border-primary/50' : 'border-base-300'} ${busy ? 'opacity-60' : ''}`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{a.recipientName}</span>
                    <span className="text-sm text-base-content/50">|</span>
                    <span className="text-sm text-base-content/70">{a.recipientPhone}</span>
                    {a.isDefault && <span className="badge badge-primary badge-sm">{t('address.default')}</span>}
                  </div>
                  <p className="mt-1 text-sm text-base-content/75">{formatAddressLine(a)}</p>
                  {a.hasCoordinates ? (
                    <p className="mt-1 text-xs text-success">✓ {t('address.hasCoords')}</p>
                  ) : (
                    <p className="mt-1 text-xs text-warning">
                      ⚠ {t('address.missingCoords')}{' '}
                      <button onClick={() => setEditing(a)} className="link link-primary">{t('address.pinNow')}</button>
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {!a.isDefault && (
                    <button onClick={() => handleSetDefault(a.id)} disabled={busy} className="btn btn-ghost btn-xs">{t('address.setDefault')}</button>
                  )}
                  <button onClick={() => setEditing(a)} disabled={busy} className="btn btn-outline btn-xs">{t('address.edit')}</button>
                  {confirmDeleteId === a.id ? (
                    <>
                      <button onClick={() => handleDelete(a.id)} disabled={busy} className="btn btn-error btn-xs">{t('address.confirmDelete')}</button>
                      <button onClick={() => setConfirmDeleteId(null)} className="btn btn-ghost btn-xs">{t('address.cancel')}</button>
                    </>
                  ) : (
                    <button
                      onClick={() => setConfirmDeleteId(a.id)}
                      disabled={busy}
                      aria-label={`${t('address.delete')} ${a.recipientName}`}
                      className="btn btn-ghost btn-xs btn-circle text-base-content/70 hover:text-error"
                    >
                      <Trash width={14} height={14} />
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* key: đổi địa chỉ đang sửa thì form khởi tạo lại từ đầu (state lấy từ `initial` chỉ lúc mount) */}
      {editing && (
        <AddressFormModal
          key={editing === 'new' ? 'new' : editing.id}
          initial={editing === 'new' ? null : editing}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
