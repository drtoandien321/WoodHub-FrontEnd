import { useState } from 'react';
import ModalShell from './ModalShell.jsx';
import { useCreateMaterial, useUpdateMaterial } from '../../hooks/useAdminMaterials.js';
import { apiErrorMessage } from '../../utils/apiError.js';

const PROMPT_MAX = 500;

/*
 * MaterialFormModal — Thêm/Sửa vật liệu, gọi API THẬT (POST/PUT /materials).
 * retexturePrompt (BE-05): mô tả tiếng Anh cho AI "Áp dụng chất liệu" (vân gỗ / màu / độ bóng). Chỉ vật liệu CÓ prompt
 * mới hiện trong picker Áp dụng chất liệu của Custom Studio. PUT gửi "" để xoá prompt (không gửi = giữ nguyên).
 */
export default function MaterialFormModal({ open, onClose, initial = null }) {
  const isEdit = !!initial;
  const createMaterial = useCreateMaterial();
  const updateMaterial = useUpdateMaterial();

  const [name, setName] = useState(initial?.name ?? '');
  const [prompt, setPrompt] = useState(initial?.retexturePrompt ?? '');
  const [err, setErr] = useState('');

  if (!open) return null;

  const submit = async () => {
    if (!name.trim()) { setErr('Vui lòng nhập tên vật liệu'); return; }
    setErr('');
    const body = { name: name.trim(), retexturePrompt: prompt.trim() };
    try {
      if (isEdit) await updateMaterial.mutateAsync({ id: initial.id, ...body });
      else await createMaterial.mutateAsync({ ...body, retexturePrompt: body.retexturePrompt || undefined });
      onClose();
    } catch (e) {
      setErr(apiErrorMessage(e, 'Không lưu được vật liệu, vui lòng thử lại'));
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
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-base-content/70">Tên vật liệu<span className="text-error"> *</span></span>
          <input value={name} onChange={(e) => setName(e.target.value)} className="input input-bordered w-full" placeholder="VD: Gỗ sồi" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-base-content/70">Mô tả cho AI đổi chất liệu (tiếng Anh, tuỳ chọn)</span>
          <textarea value={prompt} onChange={(e) => setPrompt(e.target.value.slice(0, PROMPT_MAX))} rows={2} className="textarea textarea-bordered w-full" placeholder="VD: dark walnut wood, rich brown grain, satin finish" />
          <span className="text-xs text-base-content/70">Có mô tả thì khách mới chọn được vật liệu này ở "Áp dụng chất liệu" (Custom Studio). Để trống = không dùng cho AI. {prompt.length}/{PROMPT_MAX}</span>
        </label>
        {err && <span className="text-xs text-error">{err}</span>}
      </div>
    </ModalShell>
  );
}
