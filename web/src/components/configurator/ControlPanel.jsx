import { useTranslation } from 'react-i18next';
import { useConfiguratorStore } from '../../stores/configuratorStore.js';
import { WOOD_MATERIALS, FINISH_COLORS, PRODUCT_TYPE_DEFAULTS } from '../../api/mock/customData.js';
import { formatVnd } from '../../utils/format.js';

// Map tên field dimension sang key i18n (custom.dimensionWidth/Height/Depth)
const DIMENSION_LABEL_KEYS = { width: 'custom.dimensionWidth', height: 'custom.dimensionHeight', depth: 'custom.dimensionDepth' };

/*
 * Panel điều khiển — đọc/ghi trực tiếp configuratorStore.
 * Mỗi control là 1 selector riêng → chỉ phần liên quan re-render khi giá trị đổi.
 */
export default function ControlPanel({ onSave, saving }) {
  const { t } = useTranslation();
  const { productType, dimensions, materialId, finishId, setDimension, setMaterial, setFinish, estimatePrice, estimateDays } =
    useConfiguratorStore();
  const limits = (PRODUCT_TYPE_DEFAULTS[productType] ?? PRODUCT_TYPE_DEFAULTS.table).limits;

  return (
    <div className="flex flex-col gap-6">
      {/* 1. Kích thước */}
      <section>
        <h3 className="font-medium mb-3">{t('custom.dimensions')}</h3>
        <div className="flex flex-col gap-3">
          {Object.entries(dimensions).map(([key, value]) => (
            <label key={key} className="flex flex-col gap-1">
              <div className="flex justify-between text-sm">
                <span>{t(DIMENSION_LABEL_KEYS[key])}</span>
                <span className="font-mono">{value} cm</span>
              </div>
              <input
                type="range"
                min={limits[key][0]}
                max={limits[key][1]}
                value={value}
                onChange={(e) => setDimension(key, Number(e.target.value))}
                className="range range-primary range-sm"
              />
            </label>
          ))}
        </div>
      </section>

      {/* 2. Chất liệu gỗ */}
      <section>
        <h3 className="font-medium mb-3">{t('custom.material')}</h3>
        <div className="grid grid-cols-2 gap-2">
          {WOOD_MATERIALS.map((mat) => (
            <button
              key={mat.id}
              onClick={() => setMaterial(mat.id)}
              className={`flex items-center gap-2 p-2 rounded-xl border text-left text-sm transition-colors ${
                materialId === mat.id ? 'border-primary bg-primary/10' : 'border-base-300 hover:border-primary/50'
              }`}
            >
              <span className="w-6 h-6 rounded-md border border-black/10 shrink-0" style={{ background: mat.hexColor }} />
              {t(`custom.materials.${mat.id}`)}
            </button>
          ))}
        </div>
      </section>

      {/* 3. Màu hoàn thiện */}
      <section>
        <h3 className="font-medium mb-3">{t('custom.finish')}</h3>
        <div className="flex flex-wrap gap-2">
          {FINISH_COLORS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFinish(f.id)}
              title={t(`custom.finishes.${f.id}`)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs transition-colors ${
                finishId === f.id ? 'border-primary bg-primary/10' : 'border-base-300 hover:border-primary/50'
              }`}
            >
              <span className="w-4 h-4 rounded-full border border-black/10" style={{ background: f.tint }} />
              {t(`custom.finishes.${f.id}`)}
            </button>
          ))}
        </div>
      </section>

      {/* Giá & thời gian ước tính — FE tính để hiển thị real-time; số liệu chốt do BE tính khi lưu */}
      <section className="bg-base-200 rounded-2xl p-4 flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-base-content/70">{t('custom.estimatedPrice')}</span>
          <span className="text-xl font-semibold text-primary">{formatVnd(estimatePrice())}</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-base-content/70">{t('custom.estimatedTime')}</span>
          <span className="text-sm font-medium">{t('custom.estimatedTimeUnit', { days: estimateDays() })}</span>
        </div>
        <p className="text-xs text-base-content/50 mt-1">{t('custom.estimatedPriceNote')}</p>
      </section>

      <button onClick={onSave} disabled={saving} className="btn btn-primary">
        {saving ? <span className="loading loading-spinner loading-sm" /> : t('custom.saveDesign')}
      </button>
    </div>
  );
}
