import { useState } from 'react';
import { useCreateStore, useUpdateStore } from '../../hooks/useStores.js';
import { X } from '../suppliers/icons.jsx';

/*
 * StoreFormModal — modal Thêm/Sửa CHI NHÁNH (Store), gọi API THẬT.
 * Field khớp đúng CreateStoreRequest/UpdateStoreRequest của BE: address (bắt buộc),
 * ward/district/city/phone (tuỳ chọn), latitude/longitude (tuỳ chọn, chưa có UI chọn bản đồ
 * ở bản này nên bỏ qua — BE cho phép null). KHÔNG có field name/status/manager/rating... vì
 * Store thật không có các field đó (khác mock cũ ở manufacturerData.js).
 */
export default function StoreFormModal({ open, onClose, initial = null }) {
  const isEdit = !!initial;
  const createStore = useCreateStore();
  const updateStore = useUpdateStore();

  const [form, setForm] = useState(() => ({
    address: initial?.address ?? '', ward: initial?.ward ?? '', district: initial?.district ?? '',
    city: initial?.city ?? '', phone: initial?.phone ?? '',
  }));
  const [err, setErr] = useState('');

  if (!open) return null;
  const set = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const submit = async () => {
    if (!form.address.trim()) { setErr('Vui lòng nhập địa chỉ'); return; }
    setErr('');
    const body = {
      address: form.address, ward: form.ward || undefined, district: form.district || undefined,
      city: form.city || undefined, phone: form.phone || undefined,
    };
    if (isEdit) await updateStore.mutateAsync({ id: initial.id, ...body });
    else await createStore.mutateAsync(body);
    onClose();
  };

  const saving = createStore.isPending || updateStore.isPending;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-base-100 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog" aria-modal="true" aria-label={isEdit ? 'Sửa chi nhánh' : 'Thêm chi nhánh'}
      >
        <header className="flex items-center justify-between border-b border-base-300 px-5 py-4">
          <h2 className="font-display text-xl">{isEdit ? 'Sửa chi nhánh' : 'Thêm chi nhánh'}</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle" aria-label="Đóng"><X width={18} height={18} /></button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-base-content/70">Địa chỉ<span className="text-error"> *</span></span>
              <input value={form.address} onChange={set('address')} className="input input-bordered w-full" placeholder="Số nhà, tên đường…" />
              {err && <span className="text-xs text-error">{err}</span>}
            </label>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm text-base-content/70">Phường/Xã</span>
                <input value={form.ward} onChange={set('ward')} className="input input-bordered w-full" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm text-base-content/70">Quận/Huyện</span>
                <input value={form.district} onChange={set('district')} className="input input-bordered w-full" />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5">
                <span className="text-sm text-base-content/70">Tỉnh/Thành</span>
                <input value={form.city} onChange={set('city')} className="input input-bordered w-full" />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-sm text-base-content/70">Số điện thoại</span>
                <input value={form.phone} onChange={set('phone')} className="input input-bordered w-full" />
              </label>
            </div>
          </div>
        </div>

        <footer className="flex justify-end gap-3 border-t border-base-300 px-5 py-4">
          <button onClick={onClose} className="btn btn-ghost" disabled={saving}>Hủy</button>
          <button onClick={submit} className="btn btn-primary" disabled={saving}>
            {saving ? <span className="loading loading-spinner loading-sm" /> : 'Lưu chi nhánh'}
          </button>
        </footer>
      </div>
    </div>
  );
}
