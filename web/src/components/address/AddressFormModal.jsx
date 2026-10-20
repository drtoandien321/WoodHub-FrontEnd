import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ModalShell from '../admin/ModalShell.jsx';
import StoreMapPicker from '../supplier/StoreMapPicker.jsx';
import { geocodeAddress } from '../../services/goong.js';
import { useLocationStore } from '../../stores/locationStore.js';
import { useCreateAddress, useUpdateAddress } from '../../hooks/useAddresses.js';

// SĐT VN: bắt đầu bằng 0, đủ 10 số — cùng quy tắc với Checkout.jsx
const PHONE_RE = /^0\d{9}$/;

/*
 * AddressFormModal — Thêm/Sửa 1 địa chỉ giao hàng (POST/PUT /api/addresses).
 *
 * Toạ độ (lat/lng) là phần QUAN TRỌNG NHẤT: BE dùng nó tính khoảng cách → phí ship ở checkout.
 * Có 3 cách lấy, khách chọn cách nào tiện:
 *  1. "Dùng vị trí hiện tại" — định vị trình duyệt (chính xác nhất nếu khách đang ở nhà).
 *  2. "Định vị từ địa chỉ" — Goong geocode từ chữ đã gõ (gần đúng, nên kéo ghim chỉnh lại).
 *  3. Bấm/kéo ghim trực tiếp trên bản đồ.
 * Lat/lng KHÔNG có ô gõ tay (tránh nhập sai số), chỉ đến từ 3 cách trên.
 *
 * BE cho lưu địa chỉ CHƯA có toạ độ (khách ghim sau) → modal cho lưu nhưng cảnh báo. Riêng khi
 * mở từ checkout (requireCoordinates=true) thì BẮT BUỘC ghim, vì không có toạ độ thì không đặt được hàng.
 *
 * Props: initial (UserAddressResponse khi sửa), onClose, onSaved(address) — trả địa chỉ BE vừa lưu
 * để nơi gọi (vd Checkout) chọn luôn địa chỉ đó. Nơi gọi nên render kèm `key` để form reset đúng.
 */
export default function AddressFormModal({ initial = null, onClose, onSaved, requireCoordinates = false }) {
  const { t } = useTranslation();
  const isEdit = !!initial;
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const setSharedCoords = useLocationStore((s) => s.setCoords);

  const [form, setForm] = useState(() => ({
    recipientName: initial?.recipientName ?? '',
    recipientPhone: initial?.recipientPhone ?? '',
    addressLine: initial?.addressLine ?? '',
    ward: initial?.ward ?? '',
    district: initial?.district ?? '',
    city: initial?.city ?? '',
    isDefault: initial?.isDefault ?? false,
  }));
  const [coords, setCoords] = useState(() =>
    initial?.latitude != null && initial?.longitude != null ? { latitude: initial.latitude, longitude: initial.longitude } : null
  );
  const [touched, setTouched] = useState({});
  const [locating, setLocating] = useState(null); // 'gps' | 'geocode' | null
  const [locateErr, setLocateErr] = useState('');
  const [submitErr, setSubmitErr] = useState('');

  const set = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));
  const touch = (k) => () => setTouched((s) => ({ ...s, [k]: true }));

  // ===== VALIDATION (khớp @Valid của BE: bắt buộc + độ dài tối đa) =====
  const errors = {
    recipientName: form.recipientName.trim() ? '' : t('address.errName'),
    recipientPhone: PHONE_RE.test(form.recipientPhone.replace(/\s/g, '')) ? '' : t('address.errPhone'),
    addressLine: form.addressLine.trim() ? '' : t('address.errAddressLine'),
    city: form.city.trim() ? '' : t('address.errCity'),
    coords: requireCoordinates && !coords ? t('address.errCoordsRequired') : '',
  };
  const isValid = Object.values(errors).every((e) => !e);
  const showErr = (k) => touched[k] && errors[k];

  // Cách 1: định vị trình duyệt. Cập nhật luôn locationStore để các trang khác (gợi ý gần) dùng chung.
  const pickCurrentLocation = () => {
    if (!navigator.geolocation) { setLocateErr(t('address.gpsUnsupported')); return; }
    setLocating('gps');
    setLocateErr('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setCoords(next);
        setSharedCoords(next.latitude, next.longitude);
        setLocating(null);
      },
      (error) => {
        setLocateErr(error.code === error.PERMISSION_DENIED ? t('address.gpsDenied') : t('address.gpsFailed'));
        setLocating(null);
      },
      { timeout: 10_000, enableHighAccuracy: true }
    );
  };

  /*
   * Cách 2: geocode từ địa chỉ chữ. Ghép đủ các cấp đã gõ cho Goong tìm chính xác hơn. Kết quả
   * Phường/Quận/Tỉnh chỉ điền vào ô ĐANG TRỐNG — không ghi đè thứ khách đã tự gõ.
   */
  const locateFromAddress = async () => {
    const query = [form.addressLine, form.ward, form.district, form.city].map((s) => s.trim()).filter(Boolean).join(', ');
    if (!form.addressLine.trim()) { setLocateErr(t('address.errAddressFirst')); return; }
    setLocating('geocode');
    setLocateErr('');
    try {
      const result = await geocodeAddress(query);
      if (!result) { setLocateErr(t('address.geocodeNotFound')); return; }
      setCoords({ latitude: result.latitude, longitude: result.longitude });
      setForm((s) => ({
        ...s,
        ward: s.ward || result.ward,
        district: s.district || result.district,
        city: s.city || result.city,
      }));
    } catch {
      setLocateErr(t('address.geocodeFailed'));
    } finally {
      setLocating(null);
    }
  };

  const submit = async () => {
    setTouched({ recipientName: true, recipientPhone: true, addressLine: true, city: true, coords: true });
    if (!isValid) return;
    setSubmitErr('');
    // Gửi ĐỦ body (PUT ghi đè toàn bộ — thiếu lat/lng sẽ bị xoá toạ độ, xem hooks/useAddresses.js)
    const body = {
      recipientName: form.recipientName.trim(),
      recipientPhone: form.recipientPhone.replace(/\s/g, ''),
      addressLine: form.addressLine.trim(),
      ward: form.ward.trim() || null,
      district: form.district.trim() || null,
      city: form.city.trim(),
      latitude: coords?.latitude ?? null,
      longitude: coords?.longitude ?? null,
      isDefault: form.isDefault,
    };
    try {
      const saved = isEdit ? await updateAddress.mutateAsync({ id: initial.id, ...body }) : await createAddress.mutateAsync(body);
      onSaved?.(saved);
      onClose();
    } catch (err) {
      // 400 validation trả kèm errors: { field: message } — hiện message đầu tiên của BE cho rõ
      const beErrors = err?.response?.data?.errors;
      setSubmitErr((beErrors && Object.values(beErrors)[0]) || t('address.saveFailed'));
    }
  };

  const saving = createAddress.isPending || updateAddress.isPending;

  const field = (key, label, { placeholder, type = 'text', required = false } = {}) => (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm text-base-content/70">{label}{required && <span className="text-error"> *</span>}</span>
      <input
        type={type}
        value={form[key]}
        onChange={set(key)}
        onBlur={touch(key)}
        placeholder={placeholder}
        className={`input input-bordered w-full ${showErr(key) ? 'input-error' : ''}`}
        aria-invalid={Boolean(showErr(key))}
      />
      {showErr(key) && <span className="text-xs text-error">{errors[key]}</span>}
    </label>
  );

  return (
    <ModalShell
      open
      onClose={onClose}
      title={isEdit ? t('address.editTitle') : t('address.addTitle')}
      footer={
        <>
          <button onClick={onClose} className="btn btn-ghost" disabled={saving}>{t('address.cancel')}</button>
          <button onClick={submit} className="btn btn-primary" disabled={saving}>
            {saving ? <span className="loading loading-spinner loading-sm" /> : t('address.save')}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {field('recipientName', t('address.recipientName'), { required: true, placeholder: t('address.recipientNamePh') })}
          {field('recipientPhone', t('address.recipientPhone'), { required: true, type: 'tel', placeholder: '0901234567' })}
        </div>
        {field('addressLine', t('address.addressLine'), { required: true, placeholder: t('address.addressLinePh') })}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {field('ward', t('address.ward'))}
          {field('district', t('address.district'))}
          <div className="col-span-2 sm:col-span-1">{field('city', t('address.city'), { required: true, placeholder: 'TP.HCM' })}</div>
        </div>

        {/* Toạ độ giao hàng */}
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm text-base-content/70">
              {t('address.mapLabel')}{requireCoordinates && <span className="text-error"> *</span>}
            </span>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={pickCurrentLocation} disabled={!!locating} className="btn btn-outline btn-xs gap-1.5">
                {locating === 'gps' ? <span className="loading loading-spinner loading-xs" /> : '🎯'} {t('address.useCurrentLocation')}
              </button>
              <button type="button" onClick={locateFromAddress} disabled={!!locating} className="btn btn-outline btn-xs gap-1.5">
                {locating === 'geocode' ? <span className="loading loading-spinner loading-xs" /> : '📍'} {t('address.locateFromAddress')}
              </button>
            </div>
          </div>
          <StoreMapPicker
            latitude={coords?.latitude ?? null}
            longitude={coords?.longitude ?? null}
            onChange={(latitude, longitude) => { setCoords({ latitude, longitude }); setLocateErr(''); }}
          />
          <p className="text-xs text-base-content/50">
            {coords
              ? t('address.coordsPicked', { lat: coords.latitude.toFixed(5), lng: coords.longitude.toFixed(5) })
              : t('address.coordsHint')}
          </p>
          {locateErr && <p className="text-xs text-error">{locateErr}</p>}
          {showErr('coords') && <p className="text-xs text-error">{errors.coords}</p>}
          {!coords && !requireCoordinates && <p className="text-xs text-warning">{t('address.noCoordsWarning')}</p>}
        </div>

        {/* Địa chỉ đang là mặc định thì không cho bỏ (BE luôn giữ 1 mặc định) → ẩn ô này */}
        {!initial?.isDefault && (
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="checkbox checkbox-primary checkbox-sm"
              checked={form.isDefault}
              onChange={(e) => setForm((s) => ({ ...s, isDefault: e.target.checked }))}
            />
            {t('address.setAsDefault')}
          </label>
        )}

        {submitErr && <div role="alert" className="alert alert-error py-2 text-sm">{submitErr}</div>}
      </div>
    </ModalShell>
  );
}
