import { useEffect, useState } from 'react';
import { useMyCapability, useSaveMyCapability } from '../../hooks/useSupplierPortal.js';
import { useCategoryTree, useMaterials } from '../../hooks/useCatalog.js';
import { apiErrorMessage } from '../../utils/apiError.js';
import { formatDate } from '../../utils/format.js';

/*
 * CapabilitySettingsCard — "Năng lực gia công" của XƯỞNG (BE-10 §3): loại sản phẩm làm được, kích thước tối đa,
 * vật liệu, số năm kinh nghiệm. Hiện công khai ở hồ sơ xưởng và (sau này) dùng để ghép xưởng theo thiết kế.
 *
 * PUT ghi đè toàn bộ → form luôn gửi đủ. Loại sản phẩm gợi ý theo tên danh mục cấp 1 (BE khuyên dùng cùng bộ giá trị
 * "Bàn", "Tủ"… để ghép xưởng), vẫn cho thêm loại tự do. Ô số để trống = không khai báo (null).
 */
const MAX_TYPES = 30;
const MAX_MATERIALS = 50;
const numOrNull = (v) => (v === '' || v == null ? null : Number(v));

const toForm = (c) => ({
  productTypes: c?.productTypes ?? [],
  maxLengthCm: c?.maxLengthCm ?? '', maxWidthCm: c?.maxWidthCm ?? '', maxHeightCm: c?.maxHeightCm ?? '',
  materialIds: (c?.materials ?? []).map((m) => m.id),
  experienceYears: c?.experienceYears ?? '',
});

export default function CapabilitySettingsCard() {
  const { data, isLoading, isError } = useMyCapability();
  const { data: tree } = useCategoryTree();
  const { data: materialsData } = useMaterials();
  const save = useSaveMyCapability();
  const [form, setForm] = useState(toForm(null));
  const [custom, setCustom] = useState('');
  const [error, setError] = useState('');
  const [savedAt, setSavedAt] = useState(null);

  useEffect(() => { if (data) setForm(toForm(data)); }, [data]);

  const materials = materialsData?.content ?? materialsData ?? [];
  const suggestions = [...new Set([...(tree ?? []).map((c) => c.name), ...form.productTypes])];
  const toggleType = (name) => setForm((f) => ({
    ...f, productTypes: f.productTypes.includes(name) ? f.productTypes.filter((x) => x !== name) : [...f.productTypes, name].slice(0, MAX_TYPES),
  }));
  const addCustom = () => {
    const name = custom.trim().slice(0, 100);
    if (name && !form.productTypes.includes(name)) toggleType(name);
    setCustom('');
  };
  const toggleMaterial = (id) => setForm((f) => ({
    ...f, materialIds: f.materialIds.includes(id) ? f.materialIds.filter((x) => x !== id) : [...f.materialIds, id].slice(0, MAX_MATERIALS),
  }));
  const setNum = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    setError('');
    const dims = ['maxLengthCm', 'maxWidthCm', 'maxHeightCm'].map((k) => numOrNull(form[k]));
    if (dims.some((d) => d != null && !(d >= 1 && d <= 10000))) { setError('Kích thước tối đa phải từ 1 đến 10.000 cm.'); return; }
    const years = numOrNull(form.experienceYears);
    if (years != null && !(years >= 0 && years <= 100)) { setError('Số năm kinh nghiệm từ 0 đến 100.'); return; }
    save.mutate(
      { productTypes: form.productTypes, maxLengthCm: dims[0], maxWidthCm: dims[1], maxHeightCm: dims[2], materialIds: form.materialIds, experienceYears: years },
      { onSuccess: () => setSavedAt(Date.now()), onError: (err) => setError(apiErrorMessage(err, 'Không lưu được năng lực gia công.')) }
    );
  };

  if (isLoading) return <div className="skeleton h-64 rounded-2xl" />;
  if (isError) return <p className="rounded-2xl bg-error/10 p-4 text-sm text-error">Không tải được năng lực gia công.</p>;

  return (
    <form onSubmit={submit} className="flex flex-col gap-5 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
      <div>
        <h2 className="font-display text-lg">Năng lực gia công</h2>
        <p className="text-xs text-base-content/70">Hiện trên hồ sơ công khai của xưởng để khách biết bạn nhận làm gì.{data?.updatedAt ? ` Cập nhật ${formatDate(data.updatedAt)}.` : ''}</p>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm text-base-content/70">Loại sản phẩm nhận làm ({form.productTypes.length}/{MAX_TYPES})</legend>
        <div className="flex flex-wrap gap-1.5">
          {suggestions.map((name) => (
            <button key={name} type="button" onClick={() => toggleType(name)} className={`btn btn-xs ${form.productTypes.includes(name) ? 'btn-primary' : 'btn-outline'}`}>{name}</button>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={custom} onChange={(e) => setCustom(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustom(); } }} placeholder="Thêm loại khác, VD: Cầu thang gỗ" className="input input-bordered input-sm flex-1" />
          <button type="button" onClick={addCustom} disabled={!custom.trim()} className="btn btn-outline btn-sm">Thêm</button>
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-sm text-base-content/70">Kích thước tối đa làm được (cm, để trống nếu không giới hạn)</legend>
        <div className="grid grid-cols-3 gap-3">
          {[['maxLengthCm', 'Dài'], ['maxWidthCm', 'Rộng'], ['maxHeightCm', 'Cao']].map(([k, l]) => (
            <label key={k} className="flex flex-col gap-1">
              <span className="text-xs text-base-content/70">{l}</span>
              <input type="number" min="1" max="10000" value={form[k]} onChange={setNum(k)} className="input input-bordered input-sm w-full" />
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm text-base-content/70">Vật liệu làm được ({form.materialIds.length})</legend>
        <div className="flex flex-wrap gap-1.5">
          {materials.map((m) => (
            <button key={m.id} type="button" onClick={() => toggleMaterial(m.id)} className={`btn btn-xs ${form.materialIds.includes(m.id) ? 'btn-primary' : 'btn-outline'}`}>{m.name}</button>
          ))}
        </div>
      </fieldset>

      <label className="flex max-w-xs flex-col gap-1.5">
        <span className="text-sm text-base-content/70">Số năm kinh nghiệm</span>
        <input type="number" min="0" max="100" value={form.experienceYears} onChange={setNum('experienceYears')} className="input input-bordered w-full" />
      </label>

      {error && <p className="text-sm text-error" role="alert">{error}</p>}
      {savedAt && !save.isPending && <p className="text-sm text-success">Đã lưu năng lực gia công.</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => { setForm(toForm(data)); setError(''); }} disabled={save.isPending} className="btn btn-ghost">Hủy</button>
        <button type="submit" disabled={save.isPending} className="btn btn-primary">{save.isPending ? <span className="loading loading-spinner loading-sm" /> : 'Lưu năng lực'}</button>
      </div>
    </form>
  );
}
