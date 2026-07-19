import { useTranslation } from 'react-i18next';
import { WOOD_MATERIALS } from '../../api/mock/customData.js';
import ModelViewer from '../custom3d/ModelViewer.jsx';

const DIM_LABELS = { width: 'dimensionWidth', height: 'dimensionHeight', depth: 'dimensionDepth' };

/*
 * Bước 5 — Chỉnh sửa: CHỈ render control cho key nào THỰC SỰ có trong model.editableOptions
 * (đúng yêu cầu "không cho chỉnh thuộc tính backend không hỗ trợ"). Model không có editableOptions
 * nào (vd décor) → hiện thông báo "không hỗ trợ chỉnh sửa", vẫn cho qua bước 6 với cấu hình rỗng.
 */
export default function Step5Edit({ model, configuration, onChange, onNext, onBack }) {
  const { t } = useTranslation();
  const opt = model?.editableOptions ?? {};
  const hasColors = Array.isArray(opt.colors) && opt.colors.length > 0;
  const hasMaterials = Array.isArray(opt.materials) && opt.materials.length > 0;
  const hasDimensions = !!opt.dimensions;
  const nothingEditable = !hasColors && !hasMaterials && !hasDimensions;

  const tintColor = configuration.color ?? (WOOD_MATERIALS.find((m) => m.id === configuration.material)?.hexColor ?? null);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-2xl">{t('custom.studio.step5.title')}</h2>
        <p className="mt-1 text-sm text-base-content/60">{t('custom.studio.step5.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="h-[46vh] min-h-[300px] overflow-hidden rounded-3xl border border-base-300 bg-gradient-to-b from-[#efe7d8] to-[#e0d3bc]">
          {model && <ModelViewer key={model.slug} src={model.modelGlbUrl} poster={model.posterUrl} alt={model.name} color={tintColor} showControls />}
        </div>

        <aside className="flex flex-col gap-5 rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm">
          {nothingEditable && (
            <p className="rounded-xl bg-base-200/60 p-3 text-sm text-base-content/60">{t('custom.studio.step5.notEditable')}</p>
          )}

          {hasMaterials && (
            <section>
              <h3 className="mb-2 font-medium">{t('custom.ai.materialTitle')}</h3>
              <div className="flex flex-wrap gap-2">
                {opt.materials.map((materialId) => {
                  const mat = WOOD_MATERIALS.find((m) => m.id === materialId);
                  const active = configuration.material === materialId;
                  return (
                    <button
                      key={materialId}
                      onClick={() => onChange({ material: materialId, color: null })}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${active ? 'border-primary bg-primary/10 text-primary' : 'border-base-300 hover:border-primary/50'}`}
                    >
                      {mat && <span className="h-4 w-4 rounded-full border border-black/10" style={{ background: mat.hexColor }} />}
                      {t(`custom.materials.${materialId}`, { defaultValue: materialId })}
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {hasColors && (
            <section>
              <h3 className="mb-2 font-medium">{t('custom.studio.step5.colorTitle')}</h3>
              <div className="flex flex-wrap gap-2">
                {opt.colors.map((hex) => (
                  <button
                    key={hex}
                    onClick={() => onChange({ color: hex, material: null })}
                    aria-label={hex}
                    className={`h-8 w-8 rounded-full border-2 transition ${configuration.color === hex ? 'border-primary' : 'border-base-300'}`}
                    style={{ background: hex }}
                  />
                ))}
              </div>
            </section>
          )}

          {hasDimensions && configuration.dimensions && (
            <section className="flex flex-col gap-3">
              <h3 className="font-medium">{t('custom.dimensions')}</h3>
              {(['width', 'height', 'depth']).map((axis) => {
                const range = opt.dimensions[axis];
                if (!range) return null;
                const [min, max] = range;
                return (
                  <div key={axis}>
                    <div className="mb-1 flex items-center justify-between text-xs text-base-content/60">
                      <span>{t(`custom.${DIM_LABELS[axis]}`)}</span>
                      <span className="font-mono">{configuration.dimensions[axis]} cm</span>
                    </div>
                    <input
                      type="range" min={min} max={max} value={configuration.dimensions[axis]}
                      onChange={(e) => onChange({ dimensions: { ...configuration.dimensions, [axis]: Number(e.target.value) } })}
                      className="range range-primary range-sm"
                    />
                  </div>
                );
              })}
            </section>
          )}
        </aside>
      </div>

      <div className="flex justify-between">
        <button onClick={onBack} className="btn btn-ghost">{t('custom.studio.back')}</button>
        <button onClick={onNext} className="btn btn-primary">{t('custom.studio.step5.cta')}</button>
      </div>
    </div>
  );
}
