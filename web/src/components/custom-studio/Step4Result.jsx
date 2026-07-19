import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ModelViewer from '../custom3d/ModelViewer.jsx';

/*
 * Bước 4 — Kết quả: poster hiện trước (model-viewer tự giữ poster tới khi bắn sự kiện 'load',
 * KHÔNG cần tự quản lý state đó ở đây), viewer có reset/orbit/zoom/fullscreen (showControls trên
 * ModelViewer dùng chung — xem components/custom3d/ModelViewer.jsx), báo lỗi rõ nếu model hỏng.
 */
export default function Step4Result({ model, onNext, onBack }) {
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
            key={model.slug}
            src={model.modelGlbUrl}
            poster={model.posterUrl}
            alt={model.name}
            iosSrc={model.modelUsdzUrl}
            showControls
            onError={() => setLoadError(true)}
          />
        )}
      </div>

      <div className="mt-1 flex justify-between">
        <button onClick={onBack} className="btn btn-ghost">{t('custom.studio.back')}</button>
        <button onClick={onNext} disabled={loadError} className="btn btn-primary">{t('custom.studio.step4.cta')}</button>
      </div>
    </div>
  );
}
