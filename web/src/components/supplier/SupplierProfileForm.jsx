import { useEffect, useState } from 'react';
import { useSupplierMe, useUpdateSupplierMe } from '../../hooks/useSupplierMe.js';

const EMPTY = { businessName: '', taxCode: '', contactEmail: '', contactPhone: '', description: '' };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// SupplierResponse → giá trị form (null → '' để input luôn controlled)
const toForm = (d) => Object.fromEntries(Object.keys(EMPTY).map((k) => [k, d?.[k] ?? '']));

/*
 * Form hồ sơ doanh nghiệp/xưởng — dùng chung cho Cài đặt của NCC (retailer) và xưởng (workshop).
 * Chỉ gồm các field BE thật sự lưu (UpdateSupplierProfileRequest). Bản mock cũ có thêm địa chỉ trụ sở,
 * logo, ảnh bìa, người liên hệ… nhưng BE chưa có cột → bỏ, tránh để khách nhập rồi mất.
 *
 * PUT /suppliers/me GHI ĐÈ toàn bộ: field nào không gửi BE sẽ set null → luôn gửi đủ, kể cả
 * legalDocumentUrl (form không cho sửa nhưng vẫn phải gửi lại giá trị cũ).
 */
export default function SupplierProfileForm({ nameLabel = 'Tên doanh nghiệp', descriptionLabel = 'Mô tả ngắn' }) {
  const { data, isLoading, isError } = useSupplierMe();
  const update = useUpdateSupplierMe();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState('');
  const [savedAt, setSavedAt] = useState(null);

  // Nạp dữ liệu thật khi tải xong (và sau mỗi lần lưu — cache đã được cập nhật)
  useEffect(() => { if (data) setForm(toForm(data)); }, [data]);

  const set = (key) => (e) => { setForm((f) => ({ ...f, [key]: e.target.value })); setSavedAt(null); };
  const dirty = data && JSON.stringify(form) !== JSON.stringify(toForm(data));

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    if (!form.businessName.trim()) return setError(`${nameLabel} không được để trống.`);
    if (form.contactEmail.trim() && !EMAIL_RE.test(form.contactEmail.trim())) return setError('Email liên hệ không hợp lệ.');
    update.mutate(
      { ...form, businessName: form.businessName.trim(), legalDocumentUrl: data?.legalDocumentUrl ?? null },
      {
        onSuccess: () => setSavedAt(Date.now()),
        // 409 = mã số thuế đã có NCC khác dùng; 400 = lỗi validate BE → hiện đúng message BE trả
        onError: (err) => setError(err?.response?.data?.message || 'Không lưu được hồ sơ. Vui lòng thử lại.'),
      }
    );
  };

  if (isLoading) return <div className="skeleton h-72 rounded-2xl" />;
  if (isError) return <p className="rounded-2xl bg-error/10 p-4 text-sm text-error">Không tải được hồ sơ. Vui lòng tải lại trang.</p>;

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
      <h2 className="mb-4 font-display text-lg">Thông tin hiển thị</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label={`${nameLabel} *`}><input value={form.businessName} onChange={set('businessName')} maxLength={255} className="input input-bordered w-full" /></Field>
        <Field label="Mã số thuế"><input value={form.taxCode} onChange={set('taxCode')} maxLength={20} className="input input-bordered w-full" /></Field>
        <Field label="Email liên hệ"><input type="email" value={form.contactEmail} onChange={set('contactEmail')} maxLength={255} className="input input-bordered w-full" /></Field>
        <Field label="Số điện thoại liên hệ"><input type="tel" value={form.contactPhone} onChange={set('contactPhone')} maxLength={20} className="input input-bordered w-full" /></Field>
        <Field label={descriptionLabel} full><textarea value={form.description} onChange={set('description')} rows={4} className="textarea textarea-bordered w-full" /></Field>
      </div>

      {error && <p className="mt-3 text-sm text-error" role="alert">{error}</p>}
      {savedAt && !dirty && <p className="mt-3 text-sm text-success">Đã lưu hồ sơ.</p>}

      <div className="mt-5 flex justify-end gap-3">
        <button type="button" onClick={() => { setForm(toForm(data)); setError(''); }} disabled={!dirty || update.isPending} className="btn btn-ghost">Hủy</button>
        <button type="submit" disabled={!dirty || update.isPending} className="btn btn-primary">
          {update.isPending ? <span className="loading loading-spinner loading-sm" /> : 'Lưu thay đổi'}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children, full }) {
  return (
    <label className={`flex flex-col gap-1.5 ${full ? 'sm:col-span-2' : ''}`}>
      <span className="text-sm text-base-content/70">{label}</span>{children}
    </label>
  );
}
