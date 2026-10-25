import { useEffect, useState } from 'react';
import { useSupplierMe } from '../../hooks/useSupplierMe.js';
import { usePatchSupplierMe } from '../../hooks/useSupplierPortal.js';
import { apiErrorMessage } from '../../utils/apiError.js';
import ImageUploadField from './ImageUploadField.jsx';

const EMPTY = { businessName: '', taxCode: '', contactEmail: '', contactPhone: '', contactName: '', hqAddress: '', description: '' };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// SupplierResponse → giá trị form (null → '' để input luôn controlled)
const toForm = (d) => Object.fromEntries(Object.keys(EMPTY).map((k) => [k, d?.[k] ?? '']));

/*
 * Form hồ sơ doanh nghiệp/xưởng — dùng chung cho Cài đặt của NCC (retailer) và xưởng (workshop).
 *
 * Dùng PATCH /suppliers/me (BE-10): CHỈ gửi field đã sửa. Quy ước BE: không gửi = giữ, "" = xoá → so sánh với
 * dữ liệu gốc để lấy đúng các field đổi (xoá trắng 1 ô sẽ gửi "" để BE xoá). Trước đây dùng PUT ghi đè toàn bộ
 * nên phải gửi lại cả legalDocumentUrl, và không có logo / ảnh bìa / trụ sở / người liên hệ.
 *
 * Logo + ảnh bìa: tải lên là LƯU NGAY (PATCH chỉ field ảnh) — không bắt bấm "Lưu thay đổi" để tránh tải ảnh xong
 * quên lưu. Các ô chữ vẫn lưu bằng nút.
 */
export default function SupplierProfileForm({ nameLabel = 'Tên doanh nghiệp', descriptionLabel = 'Mô tả ngắn' }) {
  const { data, isLoading, isError } = useSupplierMe();
  const patch = usePatchSupplierMe();
  const patchImage = usePatchSupplierMe();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [imageError, setImageError] = useState('');
  const [savedAt, setSavedAt] = useState(null);

  // Nạp dữ liệu thật khi tải xong (và sau mỗi lần lưu — cache đã được cập nhật)
  useEffect(() => { if (data) setForm(toForm(data)); }, [data]);

  const set = (key) => (e) => { setForm((f) => ({ ...f, [key]: e.target.value })); setSavedAt(null); };
  const original = toForm(data);
  const changed = Object.fromEntries(Object.entries(form).filter(([k, v]) => v.trim() !== original[k].trim()).map(([k, v]) => [k, v.trim()]));
  const dirty = !!data && Object.keys(changed).length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!form.businessName.trim()) return setError(`${nameLabel} không được để trống.`);
    if (form.contactEmail.trim() && !EMAIL_RE.test(form.contactEmail.trim())) return setError('Email liên hệ không hợp lệ.');
    patch.mutate(changed, {
      onSuccess: () => setSavedAt(Date.now()),
      // 409 TAX_CODE_EXISTS = MST đã có NCC khác dùng; 400 = lỗi validate BE
      onError: (err) => setError(apiErrorMessage(err, 'Không lưu được hồ sơ. Vui lòng thử lại.')),
    });
  };

  const saveImage = (key) => (url) => {
    setImageError('');
    patchImage.mutate({ [key]: url }, { onError: (err) => setImageError(apiErrorMessage(err, 'Không lưu được ảnh.')) });
  };

  if (isLoading) return <div className="skeleton h-72 rounded-2xl" />;
  if (isError) return <p className="rounded-2xl bg-error/10 p-4 text-sm text-error">Không tải được hồ sơ. Vui lòng tải lại trang.</p>;

  return (
    <>
      <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
        <h2 className="mb-1 font-display text-lg">Hình ảnh thương hiệu</h2>
        <p className="mb-4 text-xs text-base-content/70">Hiện ở trang công khai của bạn và danh sách nhà cung cấp. Tải lên là lưu ngay.</p>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-[auto_1fr]">
          <ImageUploadField label="Logo" purpose="logo" value={data?.logoUrl ?? ''} onChange={saveImage('logoUrl')} disabled={patchImage.isPending} hint="Ảnh vuông, nên ≥ 256×256px." />
          <ImageUploadField label="Ảnh bìa" purpose="cover" shape="wide" value={data?.coverUrl ?? ''} onChange={saveImage('coverUrl')} disabled={patchImage.isPending} hint="Tỉ lệ khoảng 3:1, nên ≥ 1200×400px." />
        </div>
        {imageError && <p className="mt-3 text-sm text-error" role="alert">{imageError}</p>}
      </section>

      <form onSubmit={handleSubmit} className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
        <h2 className="mb-4 font-display text-lg">Thông tin hiển thị</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label={`${nameLabel} *`}><input value={form.businessName} onChange={set('businessName')} maxLength={255} className="input input-bordered w-full" /></Field>
          <Field label="Mã số thuế"><input value={form.taxCode} onChange={set('taxCode')} maxLength={20} className="input input-bordered w-full" /></Field>
          <Field label="Email liên hệ"><input type="email" value={form.contactEmail} onChange={set('contactEmail')} maxLength={255} className="input input-bordered w-full" /></Field>
          <Field label="Số điện thoại liên hệ"><input type="tel" value={form.contactPhone} onChange={set('contactPhone')} maxLength={20} className="input input-bordered w-full" /></Field>
          <Field label="Người liên hệ" hint="Chỉ bạn và quản trị viên thấy, không hiện công khai.">
            <input value={form.contactName} onChange={set('contactName')} maxLength={255} className="input input-bordered w-full" />
          </Field>
          <Field label="Địa chỉ trụ sở" hint="Địa chỉ dạng chữ để khách biết. Phí ship vẫn tính theo chi nhánh.">
            <input value={form.hqAddress} onChange={set('hqAddress')} maxLength={500} className="input input-bordered w-full" />
          </Field>
          <Field label={descriptionLabel} full><textarea value={form.description} onChange={set('description')} rows={4} className="textarea textarea-bordered w-full" /></Field>
        </div>

        {error && <p className="mt-3 text-sm text-error" role="alert">{error}</p>}
        {savedAt && !dirty && <p className="mt-3 text-sm text-success">Đã lưu hồ sơ.</p>}

        <div className="mt-5 flex justify-end gap-3">
          <button type="button" onClick={() => { setForm(toForm(data)); setError(''); }} disabled={!dirty || patch.isPending} className="btn btn-ghost">Hủy</button>
          <button type="submit" disabled={!dirty || patch.isPending} className="btn btn-primary">
            {patch.isPending ? <span className="loading loading-spinner loading-sm" /> : 'Lưu thay đổi'}
          </button>
        </div>
      </form>
    </>
  );
}

function Field({ label, children, full, hint }) {
  return (
    <label className={`flex flex-col gap-1.5 ${full ? 'sm:col-span-2' : ''}`}>
      <span className="text-sm text-base-content/70">{label}</span>{children}
      {hint && <span className="text-xs text-base-content/70">{hint}</span>}
    </label>
  );
}
