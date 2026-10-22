import { useTranslation } from 'react-i18next';
import { normalizeOptions, hexOfColor, scaleOf, MATERIAL_TINT } from '../../utils/modelOptions.js';
import ModelViewer from '../custom3d/ModelViewer.jsx';
import AiMaterialPanel from './AiMaterialPanel.jsx';

const DIM_LABELS = { width: 'dimensionWidth', height: 'dimensionHeight', depth: 'dimensionDepth' };

/*
 * Bước 5 — Chỉnh sửa: CHỈ render control cho key nào THỰC SỰ có trong model.editableOptions
 * (đúng yêu cầu "không cho chỉnh thuộc tính backend không hỗ trợ"). Model không có editableOptions
 * nào (vd décor) → hiện thông báo "không hỗ trợ chỉnh sửa", vẫn cho qua bước 6 với cấu hình rỗng.
 * Trên cùng: "Áp dụng chất liệu" bằng AI (BE-05) — đổi sang model biến thể thật, xem AiMaterialPanel.
 */
export default function Step5Edit({ model, configuration, onChange, onNext, onBack, onModelChange }) {
  const { t } = useTranslation();
  const opt = normalizeOptions(model);
  const hasColors = opt.colors.length > 0;
  const hasMaterials = opt.materials.length > 1; // 1 lựa chọn duy nhất (vd 'wood') thì không cần hiện
  const hasDimensions = !!opt.dimensions;
  const nothingEditable = !hasColors && !hasMaterials && !hasDimensions;

  const tintColor = hexOfColor(model, configuration.color) ?? (MATERIAL_TINT[configuration.material] ?? null);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-2xl">{t('custom.studio.step5.title')}</h2>
        <p className="mt-1 text-sm text-base-content/60">{t('custom.studio.step5.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
        <div className="h-[46vh] min-h-[300px] overflow-hidden rounded-3xl border border-base-300 bg-gradient-to-b from-[#efe7d8] to-[#e0d3bc]">
          {model && <ModelViewer key={model.slug} src={model.modelGlbUrl} poster={model.posterUrl} alt={model.name} color={tintColor} scaleXYZ={scaleOf(model, configuration)} showControls />}
        </div>

        <aside className="flex flex-col gap-5 rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm">
          {onModelChange && <AiMaterialPanel model={model} onModelChange={onModelChange} />}

          {nothingEditable && (
            <p className="rounded-xl bg-base-200/60 p-3 text-sm text-base-content/60">{t('custom.studio.step5.notEditable')}</p>
          )}

          {hasMaterials && (
            <section>
              <h3 className="mb-2 font-medium">{t('custom.ai.materialTitle')}</h3>
              <div className="flex flex-wrap gap-2">
                {opt.materials.map((materialId) => {
                  const tint = MATERIAL_TINT[materialId];
                  const active = configuration.material === materialId;
                  return (
                    <button
                      key={materialId}
                      onClick={() => onChange({ material: materialId })}
                      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${active ? 'border-primary bg-primary/10 text-primary' : 'border-base-300 hover:border-primary/50'}`}
                    >
                      {tint && <span className="h-4 w-4 rounded-full border border-black/10" style={{ background: tint }} />}
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
                {/* normalizeOptions trả mỗi màu là { value, hex, label } — value để lưu/so sánh, hex để vẽ ô màu */}
                {opt.colors.map((c) => {
                  const name = t(`custom.colors.${c.value}`, { defaultValue: c.label });
                  return (
                    <button
                      key={c.value}
                      onClick={() => onChange({ color: c.value, material: null })}
                      aria-label={name}
                      title={name}
                      className={`h-8 w-8 rounded-full border-2 transition ${configuration.color === c.value ? 'border-primary ring-2 ring-primary/30' : 'border-base-300'}`}
                      // hex null = màu gốc của mô hình (không nhuộm) → ô kẻ chéo thay vì ô màu
                      style={{ background: c.hex ?? 'repeating-linear-gradient(45deg, #f3ede3 0 4px, #d6c8b2 4px 8px)' }}
                    />
                  );
                })}
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

      {/* pr-20: chừa chỗ cho cụm nút nổi góc phải (bong bóng chat NCC + trợ lý AI ~80px) — trước đây đè lên nút chính */}
      <div className="flex justify-between gap-3 pr-20">
        <button onClick={onBack} className="btn btn-ghost">{t('custom.studio.back')}</button>
        <button onClick={onNext} className="btn btn-primary">{t('custom.studio.step5.cta')}</button>
      </div>
    </div>
  );
}
