import { useState } from 'react';
import { BRANCHES } from '../../api/mock/manufacturerData.js';
import { X } from '../suppliers/icons.jsx';

/*
 * ProductFormModal — modal Thêm/Sửa sản phẩm (UI mock, không gọi API thật).
 * Chia 4 section, có preview ảnh, validate cơ bản (tên VI + giá bắt buộc).
 * onClose() đóng; onSave(data) tuỳ ý (mặc định chỉ đóng).
 */
const MATERIALS = ['Gỗ sồi', 'Gỗ tần bì', 'Gỗ óc chó', 'MDF'];
const CATEGORIES = ['Bàn ăn', 'Bàn trà', 'Ghế', 'Kệ sách', 'Tủ quần áo', 'Sofa'];
const STATUSES = [
  { v: 'active', l: 'Đang bán' }, { v: 'low', l: 'Sắp hết hàng' },
  { v: 'out', l: 'Hết hàng' }, { v: 'hidden', l: 'Đang ẩn' },
];

export default function ProductFormModal({ open, onClose, initial = null, onSave }) {
  const [f, setF] = useState(() => ({
    nameVi: initial?.nameVi ?? '', nameEn: initial?.nameEn ?? '', category: initial?.category ?? CATEGORIES[0],
    price: initial?.price ?? '', salePrice: '', material: initial?.material ?? MATERIALS[0], color: initial?.color ?? '',
    size: initial?.size ?? '', stock: initial?.stock ?? '', branch: initial?.branch ?? BRANCHES[0].name,
    status: initial?.status ?? 'active', image: initial?.image ?? '', descVi: initial?.description ?? '', descEn: '',
  }));
  const [err, setErr] = useState({});

  if (!open) return null;
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  const submit = () => {
    const e = {};
    if (!f.nameVi.trim()) e.nameVi = 'Vui lòng nhập tên sản phẩm';
    if (!String(f.price).trim() || Number(f.price) <= 0) e.price = 'Giá phải lớn hơn 0';
    setErr(e);
    if (Object.keys(e).length) return;
    onSave?.(f);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-base-100 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog" aria-modal="true" aria-label={initial ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}
      >
        <header className="flex items-center justify-between border-b border-base-300 px-5 py-4">
          <h2 className="font-display text-xl">{initial ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle" aria-label="Đóng"><X width={18} height={18} /></button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <Section title="Thông tin cơ bản">
            <Field label="Tên sản phẩm (Tiếng Việt)" required error={err.nameVi}>
              <input value={f.nameVi} onChange={set('nameVi')} className="input input-bordered w-full" placeholder="Bàn ăn gỗ sồi Scandi" />
            </Field>
            <Field label="Tên sản phẩm (Tiếng Anh)">
              <input value={f.nameEn} onChange={set('nameEn')} className="input input-bordered w-full" placeholder="Scandi Oak Dining Table" />
            </Field>
            <Field label="Danh mục">
              <select value={f.category} onChange={set('category')} className="select select-bordered w-full">{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
            </Field>
            <Field label="Chất liệu">
              <select value={f.material} onChange={set('material')} className="select select-bordered w-full">{MATERIALS.map((m) => <option key={m}>{m}</option>)}</select>
            </Field>
            <Field label="Màu sắc"><input value={f.color} onChange={set('color')} className="input input-bordered w-full" placeholder="Tự nhiên (Natural Oak)" /></Field>
            <Field label="Kích thước"><input value={f.size} onChange={set('size')} className="input input-bordered w-full" placeholder="Dài 160 × Rộng 90 × Cao 75 cm" /></Field>
          </Section>

          <Section title="Giá & tồn kho">
            <Field label="Giá (VNĐ)" required error={err.price}>
              <input type="number" value={f.price} onChange={set('price')} className="input input-bordered w-full" placeholder="5900000" />
            </Field>
            <Field label="Giá khuyến mãi (VNĐ)"><input type="number" value={f.salePrice} onChange={set('salePrice')} className="input input-bordered w-full" placeholder="—" /></Field>
            <Field label="Tồn kho"><input type="number" value={f.stock} onChange={set('stock')} className="input input-bordered w-full" placeholder="54" /></Field>
            <Field label="Chi nhánh bán">
              <select value={f.branch} onChange={set('branch')} className="select select-bordered w-full">{BRANCHES.map((b) => <option key={b.id}>{b.name}</option>)}</select>
            </Field>
            <Field label="Trạng thái hiển thị">
              <select value={f.status} onChange={set('status')} className="select select-bordered w-full">{STATUSES.map((s) => <option key={s.v} value={s.v}>{s.l}</option>)}</select>
            </Field>
          </Section>

          <Section title="Hình ảnh">
            <Field label="Ảnh sản phẩm (URL)">
              <input value={f.image} onChange={set('image')} className="input input-bordered w-full" placeholder="https://… hoặc /mockdataimage/…" />
            </Field>
            <div className="flex items-center justify-center">
              {f.image
                ? <img src={f.image} alt="Xem trước" className="h-24 w-32 rounded-xl border border-base-300 object-cover" />
                : <div className="grid h-24 w-32 place-items-center rounded-xl border border-dashed border-base-300 text-xs text-base-content/40">Xem trước ảnh</div>}
            </div>
          </Section>

          <Section title="Mô tả">
            <Field label="Mô tả (Tiếng Việt)" full><textarea value={f.descVi} onChange={set('descVi')} rows={3} className="textarea textarea-bordered w-full" /></Field>
            <Field label="Mô tả (Tiếng Anh)" full><textarea value={f.descEn} onChange={set('descEn')} rows={3} className="textarea textarea-bordered w-full" /></Field>
          </Section>
        </div>

        <footer className="flex justify-end gap-3 border-t border-base-300 px-5 py-4">
          <button onClick={onClose} className="btn btn-ghost">Hủy</button>
          <button onClick={submit} className="btn btn-primary">Lưu sản phẩm</button>
        </footer>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <fieldset className="mb-5">
      <legend className="mb-3 text-sm font-semibold text-base-content/80">{title}</legend>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}

function Field({ label, required, error, full, children }) {
  return (
    <label className={`flex flex-col gap-1.5 ${full ? 'sm:col-span-2' : ''}`}>
      <span className="text-sm text-base-content/70">{label}{required && <span className="text-error"> *</span>}</span>
      {children}
      {error && <span className="text-xs text-error">{error}</span>}
    </label>
  );
}
