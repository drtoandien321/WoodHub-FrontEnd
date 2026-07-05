import { useState } from 'react';
import ModalShell from './ModalShell.jsx';
import { useCreateSupplier } from '../../hooks/useAdminSuppliers.js';

/*
 * SupplierFormModal — Admin tạo tài khoản NHÀ CUNG CẤP mới (POST /suppliers).
 * CHỈ tạo mới — sửa/duyệt/khoá dùng PUT /suppliers/{id}/status riêng ở trang chi tiết,
 * vì đó là 2 hành động khác hẳn nhau (tạo tài khoản mới vs. đổi trạng thái tài khoản có sẵn).
 *
 * `type` (retailer/workshop) là lựa chọn BẮT BUỘC, rõ ràng (radio) kèm mô tả ngắn — theo đúng
 * yêu cầu: retailer = doanh nghiệp nội thất có nhiều chi nhánh; workshop = xưởng sản xuất,
 * 1 địa chỉ, chỉ nhận đơn custom.
 */
const EMPTY = {
  email: '', password: '', fullName: '', phone: '', businessName: '', type: 'retailer',
  taxCode: '', legalDocumentUrl: '', contactEmail: '', contactPhone: '', description: '', commissionRate: '0',
};

export default function SupplierFormModal({ open, onClose }) {
  const createSupplier = useCreateSupplier();
  const [form, setForm] = useState(EMPTY);
  const [err, setErr] = useState('');
  const [successEmail, setSuccessEmail] = useState('');

  if (!open) return null;
  const set = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const handleClose = () => {
    setForm(EMPTY);
    setSuccessEmail('');
    setErr('');
    onClose();
  };

  const submit = async () => {
    if (!form.email.trim() || !form.password.trim() || !form.fullName.trim() || !form.businessName.trim()) {
      setErr('Vui lòng điền đủ Email, Mật khẩu, Họ tên, Tên doanh nghiệp');
      return;
    }
    setErr('');
    try {
      const created = await createSupplier.mutateAsync({
        email: form.email.trim(), password: form.password, fullName: form.fullName.trim(),
        phone: form.phone || undefined, businessName: form.businessName.trim(), type: form.type,
        taxCode: form.taxCode || undefined, legalDocumentUrl: form.legalDocumentUrl || undefined,
        contactEmail: form.contactEmail || undefined, contactPhone: form.contactPhone || undefined,
        description: form.description || undefined, commissionRate: form.commissionRate ? Number(form.commissionRate) : undefined,
      });
      setSuccessEmail(created ? form.email.trim() : '');
    } catch (e) {
      setErr(e?.response?.data?.message ?? 'Không tạo được nhà cung cấp, vui lòng thử lại');
    }
  };

  const saving = createSupplier.isPending;

  return (
    <ModalShell
      open={open}
      onClose={handleClose}
      title="Tạo nhà cung cấp"
      maxWidth="max-w-2xl"
      footer={
        successEmail ? (
          <button onClick={handleClose} className="btn btn-primary">Đóng</button>
        ) : (
          <>
            <button onClick={handleClose} className="btn btn-ghost" disabled={saving}>Hủy</button>
            <button onClick={submit} className="btn btn-primary" disabled={saving}>
              {saving ? <span className="loading loading-spinner loading-sm" /> : 'Tạo nhà cung cấp'}
            </button>
          </>
        )
      }
    >
      {successEmail ? (
        <div className="rounded-2xl border border-success/30 bg-success/10 p-4 text-sm text-success">
          Đã tạo nhà cung cấp thành công. Email chứa tài khoản và mật khẩu tạm đã được gửi tới <strong>{successEmail}</strong>.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <fieldset className="rounded-xl border border-base-300 p-3">
            <legend className="px-1 text-sm font-semibold text-base-content/80">Loại nhà cung cấp <span className="text-error">*</span></legend>
            <div className="mt-1 grid grid-cols-1 gap-2 sm:grid-cols-2">
              <label className={`flex cursor-pointer flex-col gap-1 rounded-xl border p-3 text-sm transition-colors ${form.type === 'retailer' ? 'border-primary bg-primary/5' : 'border-base-300'}`}>
                <span className="flex items-center gap-2 font-medium">
                  <input type="radio" name="type" value="retailer" checked={form.type === 'retailer'} onChange={set('type')} className="radio radio-sm radio-primary" />
                  Retailer
                </span>
                <span className="text-xs text-base-content/60">Doanh nghiệp nội thất, có thể có nhiều chi nhánh, bán sản phẩm sẵn (catalog).</span>
              </label>
              <label className={`flex cursor-pointer flex-col gap-1 rounded-xl border p-3 text-sm transition-colors ${form.type === 'workshop' ? 'border-primary bg-primary/5' : 'border-base-300'}`}>
                <span className="flex items-center gap-2 font-medium">
                  <input type="radio" name="type" value="workshop" checked={form.type === 'workshop'} onChange={set('type')} className="radio radio-sm radio-primary" />
                  Workshop
                </span>
                <span className="text-xs text-base-content/60">Xưởng sản xuất, thường 1 địa chỉ, chỉ nhận đơn đặt làm theo yêu cầu (custom).</span>
              </label>
            </div>
          </fieldset>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-base-content/70">Email đăng nhập<span className="text-error"> *</span></span>
              <input type="email" value={form.email} onChange={set('email')} className="input input-bordered w-full" placeholder="supplier@example.com" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-base-content/70">Mật khẩu tạm<span className="text-error"> *</span></span>
              <input type="text" value={form.password} onChange={set('password')} className="input input-bordered w-full" placeholder="Tối thiểu 6 ký tự" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-base-content/70">Họ tên người đại diện<span className="text-error"> *</span></span>
              <input value={form.fullName} onChange={set('fullName')} className="input input-bordered w-full" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-base-content/70">Số điện thoại</span>
              <input value={form.phone} onChange={set('phone')} className="input input-bordered w-full" />
            </label>
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-sm text-base-content/70">Tên doanh nghiệp<span className="text-error"> *</span></span>
              <input value={form.businessName} onChange={set('businessName')} className="input input-bordered w-full" placeholder="VD: Nội thất Gia Phát" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-base-content/70">Mã số thuế</span>
              <input value={form.taxCode} onChange={set('taxCode')} className="input input-bordered w-full" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-base-content/70">Hoa hồng (%)</span>
              <input type="number" min="0" max="100" value={form.commissionRate} onChange={set('commissionRate')} className="input input-bordered w-full" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-base-content/70">Email liên hệ (hiển thị công khai)</span>
              <input type="email" value={form.contactEmail} onChange={set('contactEmail')} className="input input-bordered w-full" />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-base-content/70">SĐT liên hệ (hiển thị công khai)</span>
              <input value={form.contactPhone} onChange={set('contactPhone')} className="input input-bordered w-full" />
            </label>
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-sm text-base-content/70">Link giấy phép kinh doanh</span>
              <input value={form.legalDocumentUrl} onChange={set('legalDocumentUrl')} className="input input-bordered w-full" placeholder="https://..." />
            </label>
            <label className="flex flex-col gap-1.5 sm:col-span-2">
              <span className="text-sm text-base-content/70">Mô tả</span>
              <textarea value={form.description} onChange={set('description')} rows={2} className="textarea textarea-bordered w-full" />
            </label>
          </div>
          {err && <p className="text-xs text-error">{err}</p>}
        </div>
      )}
    </ModalShell>
  );
}
