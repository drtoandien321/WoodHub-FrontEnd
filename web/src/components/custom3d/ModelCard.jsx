import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/*
 * Card 1 mẫu 3D trong gallery (FE-3). CHỈ hiện poster tĩnh — KHÔNG render <model-viewer> ở đây
 * (yêu cầu "không load nhiều GLB cùng lúc trong gallery"/"chỉ load GLB khi mở viewer"). GLB thật
 * chỉ tải khi vào /custom/models/:slug hoặc bước 4 của Custom Studio.
 *
 * 2 chế độ (không lồng thẻ interactive vào nhau):
 *   - `to` (mặc định) → <Link> tới trang xem nhanh /custom/models/:slug.
 *   - `onClick` → <button> (dùng ở gallery để bấm thẳng vào Custom Studio, xem CustomModels.jsx).
 */
export default function ModelCard({ model, onClick }) {
  const { t } = useTranslation();
  const opt = model.editableOptions ?? {};
  const editable = (opt.colors?.length ?? 0) > 0 || (opt.materials?.length ?? 0) > 0 || !!opt.dimensions;
  const materialNames = (opt.materials ?? [])
    .slice(0, 2)
    .map((id) => t(`custom.materials.${id}`, { defaultValue: id }));

  const content = (
    <>
      <div className="relative h-40 w-full overflow-hidden bg-gradient-to-br from-[#e7dcc6] to-[#bfa988]">
        {model.posterUrl && (
          <img
            src={model.posterUrl}
            alt={model.name}
            loading="lazy"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        {model.productType && (
          <span className="absolute left-3 top-3 rounded-full bg-base-100/85 px-2.5 py-1 text-xs font-medium text-primary backdrop-blur-sm">
            {t(`custom.studio.productTypes.${model.productType}`, { defaultValue: model.productType })}
          </span>
        )}
        <span className="absolute right-3 top-3 rounded-full bg-primary/90 px-2.5 py-1 text-xs font-semibold text-primary-content">3D</span>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <h3 className="font-display text-lg leading-tight">{model.name}</h3>
        {materialNames.length > 0 && (
          <p className="text-xs text-base-content/55">{materialNames.join(', ')}{opt.materials.length > 2 ? '…' : ''}</p>
        )}
        <span className={`mt-auto inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${editable ? 'bg-success/15 text-success' : 'bg-base-300/60 text-base-content/50'}`}>
          {editable ? t('custom.studio.gallery.editable') : t('custom.studio.gallery.notEditable')}
        </span>
      </div>
    </>
  );

  const className = 'group flex w-full flex-col overflow-hidden rounded-2xl border border-base-300 bg-base-100 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-primary hover:shadow-[0_16px_40px_rgba(76,52,36,0.12)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary';

  if (onClick) {
    return <button type="button" onClick={onClick} className={className}>{content}</button>;
  }
  return <Link to={`/custom/models/${model.slug}`} className={className}>{content}</Link>;
}
