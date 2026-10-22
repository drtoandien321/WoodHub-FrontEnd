import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useModel3d } from '../hooks/useModels3d.js';
import { normalizeOptions } from '../utils/modelOptions.js';
import { useCustomStudioStore } from '../stores/customStudioStore.js';
import ModelViewer from '../components/custom3d/ModelViewer.jsx';

/*
 * Xem nhanh 1 mẫu 3D — trang CÔNG KHAI (không cần đăng nhập), dùng để duyệt/preview trước khi
 * cam kết. Đổi màu ở đây chỉ là xem trước tạm thời (local state, KHÔNG lưu) — muốn chỉnh sửa
 * thật (material/kích thước theo editableOptions) + lưu thiết kế thì qua Custom Studio (FE-2),
 * cần đăng nhập vì tính vào hạn mức `design`.
 */
export default function CustomModelViewer() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: model, isLoading, isError } = useModel3d(slug);
  const chooseTemplate = useCustomStudioStore((s) => s.chooseTemplate);

  const [color, setColor] = useState(null); // null = giữ texture gốc (Mặc định)

  const customizeThis = () => { chooseTemplate(model); navigate('/custom/studio', { state: { keep: true } }); };

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
          <ModelViewer src={model.modelGlbUrl} poster={model.posterUrl} alt={model.name} color={color} iosSrc={model.modelUsdzUrl} showControls />
        </div>

        {/* Panel tuỳ chỉnh */}
        <aside className="flex flex-col gap-5 rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <div>
            {model.productType && <span className="text-xs font-medium text-base-content/50">{model.productType}</span>}
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
              {/* Màu xem trước lấy từ editableOptions của CHÍNH mẫu (trước đây là danh sách mock cố định cho mọi mẫu) */}
              {normalizeOptions(model).colors.filter((c) => c.hex).map((c) => {
                const name = t(`custom.colors.${c.value}`, { defaultValue: c.label });
                return (
                  <button
                    key={c.value}
                    onClick={() => setColor(c.hex)}
                    title={name}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors ${color === c.hex ? 'border-primary bg-primary/10 text-primary' : 'border-base-300 hover:border-primary/50'}`}
                  >
                    <span className="h-4 w-4 rounded-full border border-black/10" style={{ background: c.hex }} />
                    {name}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Gợi ý AR */}
          <div className="flex items-start gap-2 rounded-2xl bg-base-200/60 p-3 text-xs text-base-content/70">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-primary">
              <path d="M21 8 12 3 3 8v8l9 5 9-5z" /><path d="m3 8 9 5 9-5M12 13v8" />
            </svg>
            {t('custom.ai.arHint')}
          </div>

          {/* CTA — mở Custom Studio để chỉnh sửa thật + lưu (cần đăng nhập) */}
          <button onClick={customizeThis} className="btn btn-primary">{t('custom.ai.customizeThis')}</button>
        </aside>
      </div>
    </div>
  );
}
