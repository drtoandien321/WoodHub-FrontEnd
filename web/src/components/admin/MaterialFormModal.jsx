import { useState } from 'react';
import ModalShell from './ModalShell.jsx';
import { useCreateMaterial, useUpdateMaterial } from '../../hooks/useAdminMaterials.js';

/*
 * MaterialFormModal — Thêm/Sửa vật liệu, gọi API THẬT (POST/PUT /materials).
 * Module đơn giản nhất — chỉ 1 field `name`, dùng làm khuôn mẫu chuẩn cho pattern CRUD.
 */
export default function MaterialFormModal({ open, onClose, initial = null }) {
  const isEdit = !!initial;
  const createMaterial = useCreateMaterial();
  const updateMaterial = useUpdateMaterial();

  const [name, setName] = useState(initial?.name ?? '');
  const [err, setErr] = useState('');

  if (!open) return null;

  const submit = async () => {
    if (!name.trim()) { setErr('Vui lòng nhập tên vật liệu'); return; }
    setErr('');
    try {
      if (isEdit) await updateMaterial.mutateAsync({ id: initial.id, name: name.trim() });
      else await createMaterial.mutateAsync({ name: name.trim() });
      onClose();
    } catch (e) {
      setErr(e?.response?.data?.message ?? 'Không lưu được vật liệu, vui lòng thử lại');
    }
  };

  const saving = createMaterial.isPending || updateMaterial.isPending;

  return (
    <ModalShell
      open={open}
      onClose={onClose}
      title={isEdit ? 'Sửa vật liệu' : 'Thêm vật liệu'}
      footer={
        <>
          <button onClick={onClose} className="btn btn-ghost" disabled={saving}>Hủy</button>
          <button onClick={submit} className="btn btn-primary" disabled={saving}>
            {saving ? <span className="loading loading-spinner loading-sm" /> : 'Lưu vật liệu'}
          </button>
        </>
      }
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-base-content/70">Tên vật liệu<span className="text-error"> *</span></span>
        <input value={name} onChange={(e) => setName(e.target.value)} className="input input-bordered w-full" placeholder="VD: Gỗ sồi" />
        {err && <span className="text-xs text-error">{err}</span>}
      </label>
    </ModalShell>
  );
}
