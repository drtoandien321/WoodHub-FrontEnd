import { useState } from 'react';
import { useCategories, useMaterials } from '../../hooks/useCatalog.js';
import {
  useCreateProduct, useUpdateProduct, useUpdateProductStatus,
  useCreateVariant, useUpdateVariant, useDeleteVariant,
  useUploadProductImage, useSetPrimaryImage, useDeleteProductImage,
} from '../../hooks/useMyProducts.js';
import { X, Plus, Minus, Trash, Star } from '../suppliers/icons.jsx';

/*
 * ProductFormModal — modal Thêm/Sửa sản phẩm, gọi API THẬT.
 *
 * Luồng TẠO MỚI (không có `initial`):
 *   1. POST /products kèm luôn `variants[]` trong 1 request (BE hỗ trợ nested — xem
 *      CreateProductRequest) → có productId thật.
 *   2. Upload ảnh đã chọn TUẦN TỰ (không song song — tránh BE tự tính sortOrder bị đụng độ,
 *      đúng khuyến nghị trong spec). Ảnh đầu tiên tự động thành primary (BE tự lo).
 *
 * Luồng SỬA (`initial` có id thật):
 *   - Thông tin cơ bản: PUT /products/{id} (KHÔNG có field status/variants trong DTO này).
 *   - Trạng thái: PATCH /products/{id}/status riêng nếu đổi.
 *   - Variant: diff theo id — có id thật → PUT, chưa có id (mới thêm ở form) → POST, bị xoá khỏi
 *     danh sách → DELETE. Ảnh: thao tác NGAY (set primary / xoá) vì productId đã có sẵn, không
 *     cần đợi submit.
 */
export default function ProductFormModal({ open, onClose, initial = null }) {
  const isEdit = !!initial;
  const { data: categories } = useCategories();
  const { data: materials } = useMaterials();

  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const updateStatus = useUpdateProductStatus();
  const createVariant = useCreateVariant();
  const updateVariant = useUpdateVariant(initial?.id);
  const deleteVariant = useDeleteVariant(initial?.id);
  const uploadImage = useUploadProductImage();
  const setPrimaryImage = useSetPrimaryImage(initial?.id);
  const deleteImage = useDeleteProductImage(initial?.id);

  const [form, setForm] = useState(() => ({
    name: initial?.name ?? '', description: initial?.description ?? '',
    categoryId: initial?.categoryId ?? '', materialId: initial?.materialId ?? '',
    status: initial?.status ?? 'draft',
  }));
  // Mỗi dòng: { id: null|uuid thật, sku, color, dimensions, price }. id=null nghĩa là dòng mới thêm ở form.
  const [variants, setVariants] = useState(() =>
    initial?.variants?.length ? initial.variants.map((v) => ({ ...v })) : [{ id: null, sku: '', color: '', dimensions: '', price: '' }]
  );
  const [removedVariantIds, setRemovedVariantIds] = useState([]);
  // Tạo mới: file chờ upload sau khi có productId. Sửa: ảnh thật, thao tác ngay.
  const [stagedFiles, setStagedFiles] = useState([]); // File[]
  const [images, setImages] = useState(initial?.images ?? []);
  const [err, setErr] = useState({});
  const [uploading, setUploading] = useState(false);

  if (!open) return null;
  const set = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const setVariant = (i, key) => (e) =>
    setVariants((list) => list.map((v, idx) => (idx === i ? { ...v, [key]: e.target.value } : v)));
  const addVariantRow = () => setVariants((list) => [...list, { id: null, sku: '', color: '', dimensions: '', price: '' }]);
  const removeVariantRow = (i) =>
    setVariants((list) => {
      const row = list[i];
      if (row.id) setRemovedVariantIds((ids) => [...ids, row.id]);
      return list.filter((_, idx) => idx !== i);
    });

  const handleStageFiles = (e) => setStagedFiles((prev) => [...prev, ...Array.from(e.target.files ?? [])]);
  const removeStagedFile = (i) => setStagedFiles((prev) => prev.filter((_, idx) => idx !== i));

  // Upload TUẦN TỰ (không Promise.all/forEach) — tránh nhiều request cùng lúc khiến BE tự tính
  // sortOrder bị đụng độ (2 ảnh cùng "chèn cuối" tại cùng thời điểm), đúng khuyến nghị của spec.
  const handleUploadNow = async (files) => {
    if (!initial?.id || !files.length) return;
    setUploading(true);
    try {
      for (const file of files) {
        // eslint-disable-next-line no-await-in-loop -- cố ý tuần tự
        const img = await uploadImage.mutateAsync({ productId: initial.id, file });
        setImages((prev) => [...prev, img]);
      }
    } finally {
      setUploading(false);
    }
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Vui lòng nhập tên sản phẩm';
    if (!form.categoryId) e.categoryId = 'Vui lòng chọn danh mục';
    if (!variants.length || variants.some((v) => !String(v.price).trim() || Number(v.price) < 0)) {
      e.variants = 'Mỗi biến thể cần có giá hợp lệ (≥ 0)';
    }
    setErr(e);
    return Object.keys(e).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    const body = {
      name: form.name, description: form.description, categoryId: form.categoryId,
      materialId: form.materialId || undefined,
    };

    if (isEdit) {
      await updateProduct.mutateAsync({ id: initial.id, ...body });
      if (form.status !== initial.status) await updateStatus.mutateAsync({ id: initial.id, status: form.status });
      // Diff variant: xoá → cập nhật → thêm mới
      for (const id of removedVariantIds) await deleteVariant.mutateAsync(id);
      for (const v of variants) {
        const payload = { sku: v.sku, color: v.color, dimensions: v.dimensions, price: Number(v.price) };
        if (v.id) await updateVariant.mutateAsync({ variantId: v.id, ...payload });
        else await createVariant.mutateAsync({ productId: initial.id, ...payload });
      }
      onClose();
      return;
    }

    // Tạo mới: gửi kèm variants trong cùng request, rồi upload ảnh tuần tự
    const created = await createProduct.mutateAsync({
      ...body,
      status: form.status,
      variants: variants.map((v) => ({ sku: v.sku, color: v.color, dimensions: v.dimensions, price: Number(v.price) })),
    });
    setUploading(true);
    try {
      for (const file of stagedFiles) {
        // eslint-disable-next-line no-await-in-loop -- cố ý tuần tự, tránh đụng độ sortOrder ở BE
        await uploadImage.mutateAsync({ productId: created.id, file });
      }
    } finally {
      setUploading(false);
    }
    onClose();
  };

  const saving = createProduct.isPending || updateProduct.isPending || uploading;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl bg-base-100 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog" aria-modal="true" aria-label={isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}
      >
        <header className="flex items-center justify-between border-b border-base-300 px-5 py-4">
          <h2 className="font-display text-xl">{isEdit ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle" aria-label="Đóng"><X width={18} height={18} /></button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <Section title="Thông tin cơ bản">
            <Field label="Tên sản phẩm" required error={err.name} full>
              <input value={form.name} onChange={set('name')} className="input input-bordered w-full" placeholder="Bàn ăn gỗ sồi Scandi" />
            </Field>
            <Field label="Danh mục" required error={err.categoryId}>
              <select value={form.categoryId} onChange={set('categoryId')} className="select select-bordered w-full">
                <option value="">— Chọn danh mục —</option>
                {(categories ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Chất liệu">
              <select value={form.materialId} onChange={set('materialId')} className="select select-bordered w-full">
                <option value="">— Không chọn —</option>
                {(materials ?? []).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </Field>
            <Field label="Trạng thái hiển thị">
              <select value={form.status} onChange={set('status')} className="select select-bordered w-full">
                <option value="draft">Nháp</option>
                <option value="active">Đang bán</option>
                <option value="hidden">Đang ẩn</option>
              </select>
            </Field>
          </Section>

          <fieldset className="mb-5">
            <legend className="mb-3 flex w-full items-center justify-between text-sm font-semibold text-base-content/80">
              Biến thể (kích thước / màu / giá)
              <button type="button" onClick={addVariantRow} className="btn btn-ghost btn-xs gap-1 text-primary"><Plus width={14} height={14} /> Thêm dòng</button>
            </legend>
            <div className="flex flex-col gap-2">
              {variants.map((v, i) => (
                <div key={v.id ?? `new-${i}`} className="grid grid-cols-[1fr_1fr_1fr_1fr_auto] items-end gap-2">
                  <input value={v.sku} onChange={setVariant(i, 'sku')} placeholder="SKU (VD: BAN-SOI-120)" className="input input-bordered input-sm w-full" />
                  <input value={v.color} onChange={setVariant(i, 'color')} placeholder="Màu" className="input input-bordered input-sm w-full" />
                  <input value={v.dimensions} onChange={setVariant(i, 'dimensions')} placeholder="Kích thước (VD: 120x60x75)" className="input input-bordered input-sm w-full" />
                  <input type="number" value={v.price} onChange={setVariant(i, 'price')} placeholder="Giá (VNĐ)" className="input input-bordered input-sm w-full" />
                  <button type="button" onClick={() => removeVariantRow(i)} disabled={variants.length === 1} className="btn btn-ghost btn-sm btn-square text-error disabled:opacity-30" aria-label="Xoá dòng">
                    <Minus width={14} height={14} />
                  </button>
                </div>
              ))}
            </div>
            {err.variants && <p className="mt-2 text-xs text-error">{err.variants}</p>}
          </fieldset>

          <fieldset className="mb-5">
            <legend className="mb-3 text-sm font-semibold text-base-content/80">Hình ảnh</legend>

            {/* Sửa sản phẩm: ảnh thật, thao tác ngay */}
            {isEdit && (
              <div className="mb-3 grid grid-cols-3 gap-3 sm:grid-cols-4">
                {images.map((img) => (
                  <div key={img.id} className="group relative aspect-square overflow-hidden rounded-xl border border-base-300">
                    <img src={img.url} alt="" className="h-full w-full object-cover" />
                    {img.primary && <span className="absolute left-1.5 top-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-medium text-primary-content">Chính</span>}
                    <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                      {!img.primary && (
                        <button type="button" onClick={() => setPrimaryImage.mutate(img.id, { onSuccess: () => setImages((prev) => prev.map((i) => ({ ...i, primary: i.id === img.id }))) })} className="btn btn-circle btn-xs" aria-label="Đặt làm ảnh chính">
                          <Star width={13} height={13} />
                        </button>
                      )}
                      <button type="button" onClick={() => deleteImage.mutate(img.id, { onSuccess: () => setImages((prev) => prev.filter((i) => i.id !== img.id)) })} className="btn btn-circle btn-xs btn-error" aria-label="Xoá ảnh">
                        <Trash width={13} height={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tạo mới: chờ upload sau khi lưu / Sửa: upload thêm ngay */}
            <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
              {!isEdit && stagedFiles.map((file, i) => (
                <div key={i} className="group relative aspect-square overflow-hidden rounded-xl border border-base-300">
                  <img src={URL.createObjectURL(file)} alt="" className="h-full w-full object-cover" />
                  <button type="button" onClick={() => removeStagedFile(i)} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100" aria-label="Bỏ ảnh">
                    <X width={13} height={13} />
                  </button>
                </div>
              ))}
              <label className="grid aspect-square cursor-pointer place-items-center rounded-xl border border-dashed border-base-300 text-xs text-base-content/50 hover:border-primary hover:text-primary">
                + Thêm ảnh
                <input
                  type="file" accept="image/jpeg,image/png,image/webp,image/gif" multiple hidden
                  onChange={isEdit ? (e) => handleUploadNow(Array.from(e.target.files ?? [])) : handleStageFiles}
                />
              </label>
            </div>
            <p className="mt-2 text-xs text-base-content/45">JPEG/PNG/WEBP/GIF, tối đa 5MB mỗi ảnh. Ảnh đầu tiên tự động làm ảnh đại diện.</p>
          </fieldset>

          <fieldset>
            <legend className="mb-3 text-sm font-semibold text-base-content/80">Mô tả</legend>
            <textarea value={form.description} onChange={set('description')} rows={3} className="textarea textarea-bordered w-full" placeholder="Mô tả sản phẩm…" />
          </fieldset>
        </div>

        <footer className="flex justify-end gap-3 border-t border-base-300 px-5 py-4">
          <button onClick={onClose} className="btn btn-ghost" disabled={saving}>Hủy</button>
          <button onClick={submit} className="btn btn-primary" disabled={saving}>
            {saving ? <span className="loading loading-spinner loading-sm" /> : 'Lưu sản phẩm'}
          </button>
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
