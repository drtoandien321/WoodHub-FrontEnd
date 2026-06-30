import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useModel3d } from '../hooks/useModels3d.js';
import { WOOD_MATERIALS } from '../api/mock/customData.js';
import ModelViewer from '../components/custom3d/ModelViewer.jsx';

export default function CustomModelViewer() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const { data: model, isLoading, isError } = useModel3d(slug);

  const [color, setColor] = useState(null); // null = giữ texture gốc (Mặc định)
  const [scale, setScale] = useState(1);
  const [toast, setToast] = useState(false);

  // Gửi yêu cầu báo giá — Phase 0 chỉ hiện toast demo; nối luồng saveDesign/ghép xưởng ở Phase 2
  const requestQuote = () => { setToast(true); setTimeout(() => setToast(false), 3000); };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        <div className="skeleton h-[60vh] rounded-3xl" />
        <div className="skeleton h-96 rounded-3xl" />
      </div>
    );
  }

  if (isError || !model) {
    return (
      <div className="rounded-3xl border border-dashed border-base-300 bg-base-100 py-20 text-center">
        <p className="font-display text-2xl">{t('custom.ai.notFound')}</p>
        <Link to="/custom/models" className="btn btn-primary mt-5">{t('custom.ai.notFoundBack')}</Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Link to="/custom/models" className="text-sm text-base-content/55 hover:text-primary">{t('custom.ai.backToGallery')}</Link>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
        {/* Khung 3D/AR */}
        <div className="relative h-[58vh] min-h-[360px] overflow-hidden rounded-3xl border border-base-300 bg-gradient-to-b from-[#efe7d8] to-[#e0d3bc]">
          <ModelViewer src={model.glbUrl} poster={model.poster} alt={model.name} color={color} scale={scale} iosSrc={model.usdzUrl} />
        </div>

        {/* Panel tuỳ chỉnh */}
        <aside className="flex flex-col gap-5 rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <div>
            <span className="text-xs font-medium text-base-content/50">{model.category}</span>
            <h1 className="font-display text-2xl">{model.name}</h1>
          </div>

          {/* Vật liệu & màu */}
          <section>
            <h2 className="mb-2 font-medium">{t('custom.ai.materialTitle')}</h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setColor(null)}
                className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${color === null ? 'border-primary bg-primary/10 text-primary' : 'border-base-300 hover:border-primary/50'}`}
              >
                {t('custom.ai.materialDefault')}
              </button>
              {WOOD_MATERIALS.map((mat) => (
                <button
                  key={mat.id}
                  onClick={() => setColor(mat.hexColor)}
                  title={t(`custom.materials.${mat.id}`)}
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${color === mat.hexColor ? 'border-primary bg-primary/10 text-primary' : 'border-base-300 hover:border-primary/50'}`}
                >
                  <span className="h-4 w-4 rounded-full border border-black/10" style={{ background: mat.hexColor }} />
                  {t(`custom.materials.${mat.id}`)}
                </button>
              ))}
            </div>
          </section>

          {/* Tỉ lệ tổng thể */}
          <section>
            <div className="mb-1 flex items-center justify-between">
              <h2 className="font-medium">{t('custom.ai.scaleTitle')}</h2>
              <span className="font-mono text-sm">{Math.round(scale * 100)}%</span>
            </div>
            <input
              type="range" min="0.6" max="1.4" step="0.05" value={scale}
              onChange={(e) => setScale(Number(e.target.value))}
              className="range range-primary range-sm"
            />
            <p className="mt-1 text-xs text-base-content/50">{t('custom.ai.scaleNote')}</p>
          </section>

          {/* Gợi ý AR */}
          <div className="flex items-start gap-2 rounded-2xl bg-base-200/60 p-3 text-xs text-base-content/70">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-primary">
              <path d="M21 8 12 3 3 8v8l9 5 9-5z" /><path d="m3 8 9 5 9-5M12 13v8" />
            </svg>
            {t('custom.ai.arHint')}
          </div>

          {/* CTA */}
          <div className="flex flex-col gap-2">
            <button onClick={requestQuote} className="btn btn-primary">{t('custom.ai.requestQuote')}</button>
            <Link to="/suppliers" className="btn btn-outline border-base-300 hover:border-primary hover:bg-primary/10">{t('custom.ai.saveDesign')}</Link>
          </div>
        </aside>
      </div>

      {toast && (
        <div className="toast toast-top toast-center z-50">
          <div className="alert alert-success shadow-lg"><span>{t('custom.ai.quoteSent')}</span></div>
        </div>
      )}
    </div>
  );
}
