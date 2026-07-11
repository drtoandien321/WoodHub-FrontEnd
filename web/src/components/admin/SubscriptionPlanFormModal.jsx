import { useState } from 'react';
import ModalShell from './ModalShell.jsx';
import { useCreateSubscriptionPlan, useUpdateSubscriptionPlan } from '../../hooks/useAdminSubscriptionPlans.js';
import { Plus, Trash } from '../suppliers/icons.jsx';

// Đúng 4 tính năng enum UsageFeature của BE (mục 6 tài liệu Subscription) — không tự thêm bớt
const FEATURES = [
  { key: 'ai_chat', label: 'Chat AI' },
  { key: 'design', label: 'Thiết kế 3D' },
  { key: 'export', label: 'Xuất file' },
  { key: 'ar_3d', label: 'AR / 3D' },
];

/*
 * SubscriptionPlanFormModal — Thêm/Sửa gói đăng ký (chỉ admin), gọi API THẬT
 * (POST/PUT /subscription-plans). featureLimits: -1 = không giới hạn (đúng quy ước BE, mục 8.6
 * tài liệu) — để admin gõ trực tiếp -1 thay vì giấu sau 1 checkbox, tránh sai lệch quy ước.
 */
export default function SubscriptionPlanFormModal({ open, onClose, initial = null }) {
  const isEdit = !!initial;
  const createPlan = useCreateSubscriptionPlan();
  const updatePlan = useUpdateSubscriptionPlan();

  const [name, setName] = useState(initial?.name ?? '');
  const [displayName, setDisplayName] = useState(initial?.displayName ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [price, setPrice] = useState(initial?.price ?? 0);
  const [sortOrder, setSortOrder] = useState(initial?.sortOrder ?? 0);
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [limits, setLimits] = useState(() => {
    const base = { ai_chat: 0, design: 0, export: 0, ar_3d: 0 };
    return { ...base, ...(initial?.featureLimits ?? {}) };
  });
  const [features, setFeatures] = useState(initial?.displayFeatures?.length ? initial.displayFeatures : ['']);
  const [err, setErr] = useState('');

  if (!open) return null;

  const setLimit = (key) => (e) => setLimits((s) => ({ ...s, [key]: Number(e.target.value) }));
  const setFeature = (i) => (e) => setFeatures((fs) => fs.map((f, idx) => (idx === i ? e.target.value : f)));
  const addFeature = () => setFeatures((fs) => [...fs, '']);
  const removeFeature = (i) => setFeatures((fs) => fs.filter((_, idx) => idx !== i));

  const submit = async () => {
    if (!name.trim() || !displayName.trim()) { setErr('Vui lòng nhập mã gói và tên hiển thị'); return; }
    setErr('');
    const body = {
      name: name.trim(),
      displayName: displayName.trim(),
      description: description.trim() || undefined,
      price: Number(price),
      featureLimits: limits,
      displayFeatures: features.map((f) => f.trim()).filter(Boolean),
      isActive,
      sortOrder: Number(sortOrder),
    };
    try {
      if (isEdit) await updatePlan.mutateAsync({ id: initial.id, ...body });
      else await createPlan.mutateAsync(body);
      onClose();
    } catch (e) {
      setErr(e?.response?.data?.message ?? 'Không lưu được gói, vui lòng thử lại');
    }
  };

  const saving = createPlan.isPending || updatePlan.isPending;

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={isEdit ? 'Sửa gói đăng ký' : 'Thêm gói đăng ký'}
      maxWidth="max-w-xl"
      footer={
        <>
          <button onClick={onClose} className="btn btn-ghost" disabled={saving}>Hủy</button>
          <button onClick={submit} className="btn btn-primary" disabled={saving}>
            {saving ? <span className="loading loading-spinner loading-sm" /> : 'Lưu gói'}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-base-content/70">Mã gói (name)<span className="text-error"> *</span></span>
            <input value={name} onChange={(e) => setName(e.target.value)} className="input input-bordered w-full" placeholder="vd: b2c_premium" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-base-content/70">Tên hiển thị<span className="text-error"> *</span></span>
            <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="input input-bordered w-full" placeholder="vd: B2C Premium AR/3D" />
          </label>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-base-content/70">Mô tả</span>
          <input value={description} onChange={(e) => setDescription(e.target.value)} className="input input-bordered w-full" placeholder="Tagline ngắn dưới tên gói" />
        </label>

        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-base-content/70">Giá / tháng (VND)<span className="text-error"> *</span></span>
            <input type="number" min={0} value={price} onChange={(e) => setPrice(e.target.value)} className="input input-bordered w-full" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-base-content/70">Thứ tự hiển thị</span>
            <input type="number" value={sortOrder} onChange={(e) => setSortOrder(e.target.value)} className="input input-bordered w-full" />
          </label>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="checkbox checkbox-sm" />
          <span className="text-sm">Đang bán (hiện trên trang Pricing)</span>
        </label>

        <div>
          <span className="text-sm text-base-content/70">Giới hạn tính năng (lượt/tháng — -1 = không giới hạn)</span>
          <div className="grid grid-cols-2 gap-3 mt-1.5">
            {FEATURES.map((f) => (
              <label key={f.key} className="flex flex-col gap-1.5">
                <span className="text-xs text-base-content/60">{f.label}</span>
                <input type="number" value={limits[f.key]} onChange={setLimit(f.key)} className="input input-bordered input-sm w-full" />
              </label>
            ))}
          </div>
        </div>

        <div>
          <span className="text-sm text-base-content/70">Bullet hiển thị</span>
          <div className="flex flex-col gap-2 mt-1.5">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                <input value={f} onChange={setFeature(i)} className="input input-bordered input-sm w-full" placeholder="vd: Chat AI không giới hạn" />
                <button type="button" onClick={() => removeFeature(i)} className="btn btn-ghost btn-xs btn-square text-error" aria-label="Xoá dòng">
                  <Trash width={14} height={14} />
                </button>
              </div>
            ))}
            <button type="button" onClick={addFeature} className="btn btn-outline btn-xs gap-1 w-fit">
              <Plus width={14} height={14} /> Thêm dòng
            </button>
          </div>
        </div>

        {err && <span className="text-xs text-error">{err}</span>}
      </div>
    </ModalShell>
  );
}
