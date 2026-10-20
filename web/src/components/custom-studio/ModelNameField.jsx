import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRenameModel } from '../../hooks/useModels3d.js';
import { apiErrorMessage } from '../../utils/apiError.js';

/*
 * Đặt tên cho model AI vừa dựng (bước 4). BE luôn lưu tên mặc định "Model AI (Meshy)" → trang "Model 3D của tôi"
 * toàn tên trùng (lỗi QA 20/10). Gợi ý sẵn tên (từ mô tả hoặc loại sản phẩm) để khách chỉ cần bấm Lưu.
 * PUT /custom/models/{id} { name } — useRenameModel tự làm mới danh sách ['myModels'].
 */
export default function ModelNameField({ model, suggestedName, onRenamed }) {
  const { t } = useTranslation();
  const rename = useRenameModel();
  const [name, setName] = useState(suggestedName || model.name || '');
  const [done, setDone] = useState(false);

  const submit = (e) => {
    e.preventDefault();
    const value = name.trim().slice(0, 255);
    if (!value) return;
    rename.mutate(
      { id: model.id, name: value },
      { onSuccess: () => { setDone(true); onRenamed?.(value); } }
    );
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 rounded-2xl border border-base-300 bg-base-100 p-4 sm:mr-20 sm:flex-row sm:items-end">
      <label className="flex flex-1 flex-col gap-1.5">
        <span className="text-sm font-medium">{t('custom.studio.step4.nameLabel')}</span>
        <input
          value={name}
          maxLength={255}
          onChange={(e) => { setName(e.target.value); setDone(false); }}
          className="input input-bordered input-sm w-full"
        />
        {rename.isError && <span className="text-xs text-error" role="alert">{apiErrorMessage(rename.error, t('custom.studio.myModels.renameError'))}</span>}
        {done && <span className="text-xs text-success">{t('custom.studio.step4.nameSaved')}</span>}
      </label>
      <button type="submit" disabled={rename.isPending || !name.trim() || done} className="btn btn-outline btn-sm">
        {rename.isPending ? <span className="loading loading-spinner loading-xs" /> : t('custom.studio.step4.nameSave')}
      </button>
    </form>
  );
}
