import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ModelViewer from '../custom3d/ModelViewer.jsx';
import { apiErrorMessage } from '../../utils/apiError.js';

/*
 * Bước 4 — Kết quả: poster hiện trước (model-viewer tự giữ poster tới khi bắn sự kiện 'load',
 * KHÔNG cần tự quản lý state đó ở đây), viewer có reset/orbit/zoom/fullscreen (showControls trên
 * ModelViewer dùng chung — xem components/custom3d/ModelViewer.jsx), báo lỗi rõ nếu model hỏng.
 */
export default function Step4Result({ model, onNext, onBack, canRefine, refined, onRefine, refinePending, refineError }) {
  const { t } = useTranslation();
  const [loadError, setLoadError] = useState(false);

  if (!model) return null;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-2xl">{t('custom.studio.step4.title')}</h2>
        <p className="mt-1 text-sm text-base-content/60">{t('custom.studio.step4.subtitle')}</p>
      </div>

      <div className="relative h-[50vh] min-h-[320px] overflow-hidden rounded-3xl border border-base-300 bg-gradient-to-b from-[#efe7d8] to-[#e0d3bc]">
        {loadError ? (
          <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
            <p className="font-medium text-error">{t('custom.studio.step4.loadError')}</p>
            <button onClick={() => setLoadError(false)} className="btn btn-outline btn-sm border-base-300">{t('custom.ai.retry')}</button>
          </div>
        ) : (
          <ModelViewer
            key={`${model.slug}:${model.modelGlbUrl}`} // refine giữ slug nhưng đổi file GLB → remount viewer
            src={model.modelGlbUrl}
            poster={model.posterUrl}
            alt={model.name}
            iosSrc={model.modelUsdzUrl}
            showControls
            onError={() => setLoadError(true)}
          />
        )}
      </div>

      {/* Text-to-3D: bản preview chỉ có hình khối → mời nâng cấp texture (refine, KHÔNG trừ thêm lượt — BE 1c) */}
      {canRefine && (
        <div className="flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 sm:mr-20 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-medium">{t('custom.studio.step4.refineTitle')}</p>
            <p className="text-xs text-base-content/60">{t('custom.studio.step4.refineDesc')}</p>
            {refineError && <p className="mt-1 text-xs text-error" role="alert">{apiErrorMessage(refineError, t('custom.ai.errors.generic'))}</p>}
          </div>
          <button onClick={onRefine} disabled={refinePending} className="btn btn-primary btn-sm shrink-0">
            {refinePending ? <span className="loading loading-spinner loading-xs" /> : t('custom.studio.step4.refineCta')}
          </button>
        </div>
      )}
      {refined && <p className="text-xs text-success">{t('custom.studio.step4.refinedNote')}</p>}

      {/* pr-20: chừa chỗ cho cụm nút nổi góc phải (bong bóng chat NCC + trợ lý AI ~80px) — trước đây đè lên nút chính */}
      <div className="mt-1 flex justify-between gap-3 pr-20">
        <button onClick={onBack} className="btn btn-ghost">{t('custom.studio.back')}</button>
        <button onClick={onNext} disabled={loadError} className="btn btn-primary">{t('custom.studio.step4.cta')}</button>
      </div>
    </div>
  );
}
