import { useState } from 'react';
import { useCreateStore, useUpdateStore } from '../../hooks/useStores.js';
import { geocodeAddress } from '../../services/goong.js';
import StoreMapPicker from './StoreMapPicker.jsx';
import { X } from '../suppliers/icons.jsx';

/*
 * StoreFormModal — modal Thêm/Sửa CHI NHÁNH (Store), gọi API THẬT.
 * Field khớp đúng CreateStoreRequest/UpdateStoreRequest của BE: address (bắt buộc),
 * ward/district/city/phone (tuỳ chọn), latitude/longitude (BE cho phép null, nhưng FE tự đặt
 * quy tắc bắt buộc khi TẠO MỚI — xem docs/API_CONTRACT.md mục 0 lý do đầy đủ).
 *
 * Luồng đặt toạ độ (đúng 3 bước đã chốt):
 *  1. Supplier gõ address/ward/district/city → bấm "Định vị từ địa chỉ" → geocode → map pan tới
 *     + ghim tự đặt.
 *  2. Supplier kéo ghim tinh chỉnh (địa chỉ chữ chỉ ra vị trí gần đúng, có thể lệch vài số nhà).
 *  3. Submit kèm latitude/longitude đọc từ ghim — 2 field này KHÔNG có input cho supplier gõ tay
 *     (tránh nhập sai số → lệch khoảng cách hiển thị cho khách sau này).
 */
export default function StoreFormModal({ open, onClose, initial = null }) {
  const isEdit = !!initial;
  const createStore = useCreateStore();
  const updateStore = useUpdateStore();

  const [form, setForm] = useState(() => ({
    address: initial?.address ?? '', ward: initial?.ward ?? '', district: initial?.district ?? '',
    city: initial?.city ?? '', phone: initial?.phone ?? '',
  }));
  const [latitude, setLatitude] = useState(initial?.latitude ?? null);
  const [longitude, setLongitude] = useState(initial?.longitude ?? null);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeErr, setGeocodeErr] = useState('');
  const [err, setErr] = useState('');

  if (!open) return null;
  const set = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const handleLocate = async () => {
    const parts = [form.address, form.ward, form.district, form.city].filter((s) => s.trim());
    if (!parts.length) { setGeocodeErr('Vui lòng nhập ít nhất địa chỉ trước khi định vị'); return; }
    setGeocoding(true);
    setGeocodeErr('');
    try {
      const result = await geocodeAddress(parts.join(', '));
      if (!result) {
        setGeocodeErr('Không tìm thấy vị trí, vui lòng kiểm tra lại địa chỉ hoặc chọn thủ công trên bản đồ');
        return;
      }
      setLatitude(result.latitude);
      setLongitude(result.longitude);
    } catch {
      setGeocodeErr('Không thể kết nối dịch vụ bản đồ, vui lòng thử lại hoặc chọn thủ công trên bản đồ');
    } finally {
      setGeocoding(false);
    }
  };

  const submit = async () => {
    if (!form.address.trim()) { setErr('Vui lòng nhập địa chỉ'); return; }
    // Data-quality gate của FE (không phải BE ép buộc) — CHỈ áp dụng lúc TẠO MỚI. Sửa chi nhánh
    // cũ chưa có toạ độ thì không chặn, để supplier còn lưu được các thay đổi khác của họ.
    if (!isEdit && (latitude == null || longitude == null)) {
      setErr('Vui lòng chọn vị trí chi nhánh trên bản đồ trước khi lưu');
      return;
    }
    setErr('');
    const body = {
      address: form.address, ward: form.ward || undefined, district: form.district || undefined,
      city: form.city || undefined, phone: form.phone || undefined,
      latitude: latitude ?? undefined, longitude: longitude ?? undefined,
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

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-base-content/70">Vị trí trên bản đồ<span className="text-error"> *</span></span>
                <button type="button" onClick={handleLocate} disabled={geocoding} className="btn btn-outline btn-xs gap-1.5">
                  {geocoding ? <span className="loading loading-spinner loading-xs" /> : '📍'} Định vị từ địa chỉ
                </button>
              </div>
              <StoreMapPicker latitude={latitude} longitude={longitude} onChange={(lat, lng) => { setLatitude(lat); setLongitude(lng); setGeocodeErr(''); }} />
              <p className="text-xs text-base-content/45">
                {latitude != null && longitude != null
                  ? `Vị trí đã chọn: ${latitude.toFixed(5)}, ${longitude.toFixed(5)} — có thể kéo ghim để tinh chỉnh hoặc bấm thẳng lên bản đồ.`
                  : 'Bấm "Định vị từ địa chỉ" rồi kéo ghim để tinh chỉnh, hoặc bấm trực tiếp lên bản đồ để đặt vị trí thủ công.'}
              </p>
              {geocodeErr && <p className="text-xs text-error">{geocodeErr}</p>}
              {isEdit && (latitude == null || longitude == null) && (
                <p className="text-xs text-warning">Chi nhánh này chưa có vị trí — bổ sung để xuất hiện trong gợi ý gần khách hàng.</p>
              )}
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
