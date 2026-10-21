import { useState } from 'react';
import ModalShell from '../admin/ModalShell.jsx';
import { useCreatePromotion, useUpdatePromotion } from '../../hooks/usePromotions.js';
import { useMyProducts } from '../../hooks/useMyProducts.js';
import { useProducts } from '../../hooks/useProducts.js';

const DISCOUNT_TYPES = {
  product: [['percentage', 'Giảm theo %'], ['fixed_amount', 'Giảm số tiền cố định']],
  shipping: [['free_shipping', 'Miễn phí ship'], ['fixed_amount', 'Giảm số tiền cố định'], ['percentage', 'Giảm theo %']],
};

// ISO (BE) ↔ giá trị ô <input type="datetime-local"> (giờ địa phương, không có múi giờ)
const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const toIso = (local) => (local ? new Date(local).toISOString() : null);
// Ô số để trống → null (BE hiểu là "không giới hạn/không áp dụng"), không gửi 0
const numOrNull = (v) => (v === '' || v == null ? null : Number(v));

/*
 * ProductPicker — chọn sản phẩm áp khuyến mãi.
 *  - supplier: danh sách sản phẩm CỦA MÌNH (GET /products/mine) — BE chặn chọn SP của người khác.
 *  - admin: tìm trong catalog công khai (GET /products?keyword=) — KM toàn sàn áp được mọi SP.
 * Lưu theo productId; tên chỉ để hiển thị (PromotionResponse chỉ trả productIds nên khi sửa, SP chưa
 * có trong danh sách đang tải sẽ hiện dạng "SP #xxxx").
 *
 * "Chọn tất cả": BE bắt buộc liệt kê productIds (không có kiểu "áp mọi SP") → nút này tick toàn bộ SP đang hiện trong
 * danh sách (đang tìm thì chỉ các kết quả tìm). SP đăng SAU khi tạo mã sẽ không tự được áp — phải sửa mã để thêm.
 * Trước đây admin chỉ tải 20 SP/lần nên không thể chọn hết; giờ tải tối đa PICKER_LIMIT.
 */
const PICKER_LIMIT = 500;
const CHIP_PREVIEW = 8;

function ProductPicker({ scope, value, onChange }) {
  const [keyword, setKeyword] = useState('');
  const [showAllChips, setShowAllChips] = useState(false);
  const mine = useMyProducts({ size: PICKER_LIMIT }, { enabled: scope === 'supplier' });
  const catalog = useProducts({ keyword: keyword.trim() || undefined, size: PICKER_LIMIT }, { enabled: scope === 'admin' });
  const source = scope === 'supplier' ? mine : catalog;
  const all = source.data?.content ?? [];
  const list = scope === 'supplier' && keyword.trim()
    ? all.filter((p) => p.name?.toLowerCase().includes(keyword.trim().toLowerCase()))
    : all;
  const nameOf = (id) => all.find((p) => p.id === id)?.name ?? `SP #${String(id).slice(0, 6)}`;
  const toggle = (id) => onChange(value.includes(id) ? value.filter((x) => x !== id) : [...value, id]);

  const listIds = list.map((p) => p.id);
  const allListSelected = listIds.length > 0 && listIds.every((id) => value.includes(id));
  // Gộp (không thay thế) → chọn tất cả kết quả tìm "bàn" rồi tìm "ghế" chọn tiếp vẫn giữ các bàn đã chọn
  const selectAll = () => onChange([...new Set([...value, ...listIds])]);
  const clearList = () => onChange(value.filter((id) => !listIds.includes(id)));
  const chips = showAllChips ? value : value.slice(0, CHIP_PREVIEW);

  return (
    <div className="flex flex-col gap-2">
      {value.length > 0 && (
        <ul className="flex flex-wrap gap-1.5">
          {chips.map((id) => (
            <li key={id} className="flex items-center gap-1 rounded-full bg-primary/10 py-0.5 pl-2.5 pr-1 text-xs">
              <span className="max-w-[160px] truncate">{nameOf(id)}</span>
              <button type="button" onClick={() => toggle(id)} className="btn btn-ghost btn-xs btn-circle" aria-label={`Bỏ ${nameOf(id)}`}>×</button>
            </li>
          ))}
          {value.length > CHIP_PREVIEW && (
            <li>
              <button type="button" onClick={() => setShowAllChips((x) => !x)} className="btn btn-ghost btn-xs">
                {showAllChips ? 'Thu gọn' : `+${value.length - CHIP_PREVIEW} sản phẩm khác`}
              </button>
            </li>
          )}
        </ul>
      )}
      <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Tìm sản phẩm theo tên…" className="input input-bordered input-sm w-full" />
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <span className="text-base-content/60">Đã chọn <b className="text-base-content">{value.length}</b> sản phẩm</span>
        <span className="flex gap-1">
          <button type="button" onClick={selectAll} disabled={!listIds.length || allListSelected} className="btn btn-outline btn-primary btn-xs">
            {keyword.trim() ? `Chọn tất cả kết quả (${listIds.length})` : `Chọn tất cả (${listIds.length})`}
          </button>
          {value.length > 0 && (
            <button type="button" onClick={keyword.trim() ? clearList : () => onChange([])} className="btn btn-ghost btn-xs">
              {keyword.trim() ? 'Bỏ chọn kết quả' : 'Bỏ chọn tất cả'}
            </button>
          )}
        </span>
      </div>
      <div className="max-h-44 overflow-y-auto rounded-xl border border-base-300">
        {source.isLoading ? (
          <p className="p-3 text-center text-xs text-base-content/50">Đang tải…</p>
        ) : !list.length ? (
          <p className="p-3 text-center text-xs text-base-content/50">Không có sản phẩm phù hợp.</p>
        ) : (
          list.map((p) => (
            <label key={p.id} className="flex cursor-pointer items-center gap-2 border-b border-base-200 px-3 py-2 text-sm last:border-b-0 hover:bg-base-200/50">
              <input type="checkbox" className="checkbox checkbox-primary checkbox-xs" checked={value.includes(p.id)} onChange={() => toggle(p.id)} />
              <span className="min-w-0 flex-1 truncate">{p.name}</span>
              {scope === 'admin' && p.supplierName && <span className="shrink-0 text-xs text-base-content/45">{p.supplierName}</span>}
            </label>
          ))
        )}
      </div>
    </div>
  );
}

/*
 * PromotionFormModal — Thêm/Sửa khuyến mãi (POST/PUT /api/promotions).
 * Ràng buộc giống BE để báo lỗi sớm: free_shipping chỉ cho type=shipping; % trong (0,100];
 * số tiền > 0; type=product phải chọn sản phẩm. Supplier chỉ tạo được type=product (ẩn ô chọn loại).
 * Lỗi BE (400 errors theo field, 409 trùng mã) vẫn hiển thị nếu lọt qua kiểm tra FE.
 */
export default function PromotionFormModal({ scope, initial = null, onClose }) {
  const isEdit = !!initial;
  const createPromotion = useCreatePromotion();
  const updatePromotion = useUpdatePromotion();

  const [form, setForm] = useState(() => ({
    code: initial?.code ?? '',
    name: initial?.name ?? '',
    description: initial?.description ?? '',
    type: initial?.type ?? 'product',
    discountType: initial?.discountType ?? 'percentage',
    discountValue: initial?.discountValue ?? '',
    maxDiscountAmount: initial?.maxDiscountAmount ?? '',
    minOrderAmount: initial?.minOrderAmount ?? '',
    startsAt: toLocalInput(initial?.startsAt),
    endsAt: toLocalInput(initial?.endsAt),
    isActive: initial?.isActive ?? true,
    usageLimit: initial?.usageLimit ?? '',
    usageLimitPerUser: initial?.usageLimitPerUser ?? '',
    productIds: initial?.productIds ?? [],
  }));
  const [errors, setErrors] = useState({});
  const [submitErr, setSubmitErr] = useState('');

  const set = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  // Đổi loại KM → đưa kiểu giảm về giá trị hợp lệ đầu tiên của loại đó (vd product không có free_shipping)
  const setType = (type) =>
    setForm((s) => ({ ...s, type, discountType: DISCOUNT_TYPES[type].some(([v]) => v === s.discountType) ? s.discountType : DISCOUNT_TYPES[type][0][0] }));

  const validate = () => {
    const e = {};
    if (!form.code.trim()) e.code = 'Nhập mã khuyến mãi';
    else if (!/^[A-Za-z0-9_-]{2,50}$/.test(form.code.trim())) e.code = 'Mã 2–50 ký tự, chỉ gồm chữ, số, - và _';
    if (!form.name.trim()) e.name = 'Nhập tên khuyến mãi';
    const v = numOrNull(form.discountValue);
    if (form.discountType === 'percentage' && !(v > 0 && v <= 100)) e.discountValue = 'Phần trăm phải lớn hơn 0 và tối đa 100';
    if (form.discountType === 'fixed_amount' && !(v > 0)) e.discountValue = 'Số tiền giảm phải lớn hơn 0';
    if (form.type === 'product' && !form.productIds.length) e.productIds = 'Chọn ít nhất 1 sản phẩm';
    if (form.startsAt && form.endsAt && new Date(form.endsAt) <= new Date(form.startsAt)) e.endsAt = 'Ngày kết thúc phải sau ngày bắt đầu';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const submit = async () => {
    if (!validate()) return;
    setSubmitErr('');
    const body = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      description: form.description.trim() || null,
      type: scope === 'supplier' ? 'product' : form.type,
      discountType: form.discountType,
      discountValue: form.discountType === 'free_shipping' ? null : numOrNull(form.discountValue),
      maxDiscountAmount: form.discountType === 'percentage' ? numOrNull(form.maxDiscountAmount) : null,
      minOrderAmount: numOrNull(form.minOrderAmount),
      startsAt: toIso(form.startsAt),
      endsAt: toIso(form.endsAt),
      isActive: form.isActive,
      usageLimit: numOrNull(form.usageLimit),
      usageLimitPerUser: numOrNull(form.usageLimitPerUser),
      productIds: form.type === 'product' || scope === 'supplier' ? form.productIds : [],
    };
    try {
      if (isEdit) await updatePromotion.mutateAsync({ id: initial.id, ...body });
      else await createPromotion.mutateAsync(body);
      onClose();
    } catch (err) {
      const data = err?.response?.data;
      if (data?.errors) setErrors(data.errors);
      setSubmitErr(data?.message || 'Lưu khuyến mãi thất bại, vui lòng thử lại.');
    }
  };

  const saving = createPromotion.isPending || updatePromotion.isPending;
  const err = (k) => errors[k] && <span className="text-xs text-error">{errors[k]}</span>;
  const label = (text, required) => <span className="text-sm text-base-content/70">{text}{required && <span className="text-error"> *</span>}</span>;

  return (
    <ModalShell
      open
      onClose={onClose}
      title={isEdit ? 'Sửa khuyến mãi' : 'Thêm khuyến mãi'}
      maxWidth="max-w-2xl"
      footer={
        <>
          <button onClick={onClose} className="btn btn-ghost" disabled={saving}>Hủy</button>
          <button onClick={submit} className="btn btn-primary" disabled={saving}>
            {saving ? <span className="loading loading-spinner loading-sm" /> : 'Lưu khuyến mãi'}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            {label('Mã', true)}
            <input value={form.code} onChange={set('code')} className={`input input-bordered w-full font-mono uppercase ${errors.code ? 'input-error' : ''}`} placeholder="SALE10" />
            {err('code')}
          </label>
          <label className="flex flex-col gap-1.5">
            {label('Tên hiển thị', true)}
            <input value={form.name} onChange={set('name')} className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`} placeholder="Giảm 10% ghế gỗ" />
            {err('name')}
          </label>
        </div>
        <label className="flex flex-col gap-1.5">
          {label('Mô tả')}
          <textarea value={form.description} onChange={set('description')} rows={2} className="textarea textarea-bordered w-full" />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Supplier chỉ có KM sản phẩm → không hiện ô chọn loại */}
          {scope === 'admin' && (
            <label className="flex flex-col gap-1.5">
              {label('Loại khuyến mãi', true)}
              <select value={form.type} onChange={(e) => setType(e.target.value)} className="select select-bordered w-full">
                <option value="product">Giảm tiền hàng (sản phẩm)</option>
                <option value="shipping">Giảm phí vận chuyển</option>
              </select>
            </label>
          )}
          <label className="flex flex-col gap-1.5">
            {label('Kiểu giảm', true)}
            <select value={form.discountType} onChange={set('discountType')} className="select select-bordered w-full">
              {DISCOUNT_TYPES[scope === 'supplier' ? 'product' : form.type].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          {form.discountType !== 'free_shipping' && (
            <label className="flex flex-col gap-1.5">
              {label(form.discountType === 'percentage' ? 'Phần trăm giảm (%)' : 'Số tiền giảm (đ)', true)}
              <input type="number" min="0" value={form.discountValue} onChange={set('discountValue')} className={`input input-bordered w-full ${errors.discountValue ? 'input-error' : ''}`} />
              {err('discountValue')}
            </label>
          )}
          {form.discountType === 'percentage' && (
            <label className="flex flex-col gap-1.5">
              {label('Giảm tối đa (đ)')}
              <input type="number" min="0" value={form.maxDiscountAmount} onChange={set('maxDiscountAmount')} className="input input-bordered w-full" placeholder="Để trống = không giới hạn" />
            </label>
          )}
          <label className="flex flex-col gap-1.5">
            {label('Đơn tối thiểu (đ)')}
            <input type="number" min="0" value={form.minOrderAmount} onChange={set('minOrderAmount')} className="input input-bordered w-full" placeholder="Tính theo tiền hàng của đơn" />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            {label('Bắt đầu')}
            <input type="datetime-local" value={form.startsAt} onChange={set('startsAt')} className="input input-bordered w-full" />
          </label>
          <label className="flex flex-col gap-1.5">
            {label('Kết thúc')}
            <input type="datetime-local" value={form.endsAt} onChange={set('endsAt')} className={`input input-bordered w-full ${errors.endsAt ? 'input-error' : ''}`} />
            {err('endsAt')}
          </label>
          <label className="flex flex-col gap-1.5">
            {label('Tổng lượt dùng')}
            <input type="number" min="1" value={form.usageLimit} onChange={set('usageLimit')} className="input input-bordered w-full" placeholder="Để trống = không giới hạn" />
          </label>
          <label className="flex flex-col gap-1.5">
            {label('Lượt / khách')}
            <input type="number" min="1" value={form.usageLimitPerUser} onChange={set('usageLimitPerUser')} className="input input-bordered w-full" placeholder="Để trống = không giới hạn" />
          </label>
        </div>

        {(scope === 'supplier' || form.type === 'product') && (
          <div className="flex flex-col gap-1.5">
            {label(scope === 'supplier' ? 'Sản phẩm của bạn được áp mã' : 'Sản phẩm được áp mã', true)}
            <ProductPicker
              scope={scope}
              value={form.productIds}
              onChange={(productIds) => {
                setForm((s) => ({ ...s, productIds }));
                // Lỗi cũ: chọn SP rồi vẫn kẹt dòng "Chọn ít nhất 1 sản phẩm" tới khi bấm Lưu lại
                if (productIds.length) setErrors(({ productIds: _drop, ...rest }) => rest);
              }}
            />
            {err('productIds')}
          </div>
        )}

        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" className="toggle toggle-primary toggle-sm" checked={form.isActive} onChange={set('isActive')} />
          Đang bật (khách dùng được mã)
        </label>

        {submitErr && <div role="alert" className="alert alert-error py-2 text-sm">{submitErr}</div>}
      </div>
    </ModalShell>
  );
}
