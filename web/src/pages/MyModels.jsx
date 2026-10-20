import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMyModels, useRenameModel } from '../hooks/useModels3d.js';

/*
 * "Model 3D của tôi" — GET /custom/models/my (model AI tự lưu khi gen xong, tên mặc định "Model AI").
 * Đổi tên = PUT /custom/models/:id { name } (chỉ đổi tên). Bấm "Xem 3D / AR" mở trình xem /custom/models/:slug.
 */
export default function MyModels() {
  const { t } = useTranslation();
  const { data, isLoading, isError, refetch } = useMyModels({ size: 40 });
  const rename = useRenameModel();
  const [editing, setEditing] = useState(null); // { id, name }
  const items = data?.content ?? [];

  const submit = (e) => {
    e.preventDefault();
    const name = editing.name.trim();
    if (!name) return;
    rename.mutate({ id: editing.id, name: name.slice(0, 255) }, { onSuccess: () => setEditing(null) });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link to="/custom/designs" className="text-sm text-base-content/55 hover:text-primary">← {t('custom.studio.designs.title')}</Link>
        <h1 className="mt-1 font-display text-3xl">{t('custom.studio.myModels.title')}</h1>
      </div>

      {isLoading && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-64 rounded-3xl" />)}</div>}
      {isError && (
        <div className="rounded-2xl border border-dashed border-base-300 p-8 text-center">
          <p className="text-error">{t('custom.studio.myModels.loadError')}</p>
          <button onClick={() => refetch()} className="btn btn-outline btn-sm mt-3 border-base-300">{t('shop.retry')}</button>
        </div>
      )}
      {!isLoading && !isError && items.length === 0 && (
        <div className="rounded-2xl border border-dashed border-base-300 p-10 text-center text-base-content/60">
          <p>{t('custom.studio.myModels.empty')}</p>
          <Link to="/custom/studio" className="btn btn-primary btn-sm mt-3">{t('custom.studio.title')}</Link>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((m) => (
          <div key={m.id} className="flex flex-col overflow-hidden rounded-3xl border border-base-300 bg-base-100 shadow-sm">
            <div className="h-44 w-full bg-gradient-to-br from-[#e7dcc6] to-[#bfa988]">
              {m.posterUrl && <img src={m.posterUrl} alt={m.name} loading="lazy" className="h-full w-full object-cover" />}
            </div>
            <div className="flex flex-1 flex-col gap-3 p-4">
              {editing?.id === m.id ? (
                <form onSubmit={submit} className="flex flex-col gap-2">
                  <input autoFocus maxLength={255} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="input input-bordered input-sm w-full rounded-lg" />
                  {rename.isError && <p className="text-xs text-error">{t('custom.studio.myModels.renameError')}</p>}
                  <div className="flex gap-2">
                    <button type="submit" disabled={rename.isPending || !editing.name.trim()} className="btn btn-primary btn-sm">{t('custom.studio.myModels.save')}</button>
                    <button type="button" onClick={() => setEditing(null)} className="btn btn-ghost btn-sm">{t('custom.studio.myModels.cancel')}</button>
                  </div>
                </form>
              ) : (
                <div className="min-w-0">
                  <p className="truncate font-display text-lg">{m.name}</p>
                  {/* Ngày tạo giúp phân biệt các model còn mang tên mặc định trùng nhau */}
                  {m.createdAt && <p className="text-xs text-base-content/50">{t('custom.studio.myModels.createdAt', { date: new Date(m.createdAt).toLocaleString('vi-VN') })}</p>}
                </div>
              )}
              <div className="mt-auto flex gap-2">
                <Link to={`/custom/models/${m.slug}`} className="btn btn-outline btn-sm flex-1 border-base-300">{t('custom.studio.myModels.view')}</Link>
                {editing?.id !== m.id && (
                  <button onClick={() => { rename.reset(); setEditing({ id: m.id, name: m.name }); }} className="btn btn-ghost btn-sm">{t('custom.studio.myModels.rename')}</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
