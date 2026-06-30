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
export default function ControlPanel({ onSave, onFindWorkshop, saving }) {
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
              className={`relative flex items-center gap-2 p-2.5 rounded-xl border text-left text-sm transition-colors ${
                materialId === mat.id ? 'border-primary border-2 bg-primary/10' : 'border-base-300 hover:border-primary/50'
              }`}
            >
              <span className="w-6 h-6 rounded-md border border-black/10 shrink-0" style={{ background: mat.hexColor }} />
              {t(`custom.materials.${mat.id}`)}
              {/* Icon check nhỏ cho option đang chọn */}
              {materialId === mat.id && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary text-primary-content flex items-center justify-center">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6 9 17l-5-5" />
                  </svg>
                </span>
              )}
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
      <section className="bg-base-200 rounded-2xl p-4 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm text-base-content/70">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <path d="M6 3h12l4 6-10 12L2 9z" /><path d="M11 3 8 9l4 12 4-12-3-6" /><path d="M2 9h20" />
            </svg>
            {t('custom.estimatedPrice')}
          </span>
          <span className="text-xl font-semibold text-primary">{formatVnd(estimatePrice())}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-sm text-base-content/70">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" />
            </svg>
            {t('custom.estimatedTime')}
          </span>
          <span className="text-sm font-medium">{t('custom.estimatedTimeUnit', { days: estimateDays() })}</span>
        </div>
        <p className="text-xs text-base-content/50">{t('custom.estimatedPriceNote')}</p>
      </section>

      {/* CTA chính: gửi thiết kế đi ghép xưởng để yêu cầu báo giá (luồng cũ — cần đăng nhập) */}
      <button onClick={onFindWorkshop} disabled={saving} className="btn btn-primary gap-2">
        {saving ? (
          <span className="loading loading-spinner loading-sm" />
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" />
            </svg>
            {t('custom.requestQuote')}
          </>
        )}
      </button>
      {/* CTA phụ: lưu thiết kế + thêm vào giỏ (không bắt đăng nhập) */}
      <button onClick={onSave} disabled={saving} className="btn btn-outline border-primary/40 text-primary hover:bg-primary/10 hover:border-primary gap-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
        </svg>
        {t('custom.saveDesignShort')}
      </button>
    </div>
  );
}
