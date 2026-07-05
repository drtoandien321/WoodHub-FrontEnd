import { useState, useMemo } from 'react';
import ModalShell from './ModalShell.jsx';
import { useCreateCategory, useUpdateCategory } from '../../hooks/useAdminCategories.js';

/*
 * CategoryFormModal — Thêm/Sửa danh mục, gọi API THẬT (POST/PUT /categories).
 *
 * Làm phẳng cây (`tree`, lấy từ GET /categories/tree — BE đã dựng sẵn) thành list có thụt lề
 * theo cấp, để đổ vào <select> chọn "Danh mục cha". Khi SỬA, loại bỏ chính danh mục đang sửa
 * + TOÀN BỘ nhánh con của nó khỏi danh sách lựa chọn — tự chọn chính mình/con mình làm cha sẽ
 * tạo vòng lặp. BE vẫn tự validate lại (400) nếu lọt qua, đây chỉ là chặn sớm cho UX tốt hơn.
 */
const flattenTree = (nodes, excludeId, depth = 0, acc = []) => {
  for (const node of nodes) {
    if (node.id === excludeId) continue; // bỏ cả nhánh này, không đệ quy xuống con của nó
    acc.push({ id: node.id, label: `${'—'.repeat(depth)} ${node.name}`.trim(), depth });
    if (node.children?.length) flattenTree(node.children, excludeId, depth + 1, acc);
  }
  return acc;
};

export default function CategoryFormModal({ open, onClose, initial = null, tree = [] }) {
  const isEdit = !!initial;
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();

  const [form, setForm] = useState(() => ({
    name: initial?.name ?? '', slug: initial?.slug ?? '', parentId: initial?.parentId ?? '',
  }));
  const [err, setErr] = useState('');

  const parentOptions = useMemo(() => flattenTree(tree, initial?.id ?? null), [tree, initial?.id]);

  if (!open) return null;
  const set = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  const submit = async () => {
    if (!form.name.trim()) { setErr('Vui lòng nhập tên danh mục'); return; }
    setErr('');
    const body = { name: form.name.trim(), slug: form.slug.trim() || undefined, parentId: form.parentId || undefined };
    try {
      if (isEdit) await updateCategory.mutateAsync({ id: initial.id, ...body });
      else await createCategory.mutateAsync(body);
      onClose();
    } catch (e) {
      setErr(e?.response?.data?.message ?? 'Không lưu được danh mục, vui lòng thử lại');
    }
  };

  const saving = createCategory.isPending || updateCategory.isPending;

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={isEdit ? 'Sửa danh mục' : 'Thêm danh mục'}
      footer={
        <>
          <button onClick={onClose} className="btn btn-ghost" disabled={saving}>Hủy</button>
          <button onClick={submit} className="btn btn-primary" disabled={saving}>
            {saving ? <span className="loading loading-spinner loading-sm" /> : 'Lưu danh mục'}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-base-content/70">Tên danh mục<span className="text-error"> *</span></span>
          <input value={form.name} onChange={set('name')} className="input input-bordered w-full" placeholder="VD: Bàn ăn" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-base-content/70">Slug</span>
          <input value={form.slug} onChange={set('slug')} className="input input-bordered w-full" placeholder="Để trống sẽ tự sinh từ tên" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-base-content/70">Danh mục cha</span>
          <select value={form.parentId} onChange={set('parentId')} className="select select-bordered w-full">
            <option value="">— Danh mục gốc —</option>
            {parentOptions.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </label>
        {err && <p className="text-xs text-error">{err}</p>}
      </div>
    </ModalShell>
  );
}
