import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useModels3d } from '../../hooks/useModels3d.js';
import { useCustomStudioStore } from '../../stores/customStudioStore.js';

const QUICK_PICK_SIZE = 8; // Lưới nhanh ở đây — thư viện đầy đủ (tìm kiếm/lọc) ở /custom/models (FE-3)

/*
 * Bước 1 — Chọn nguồn: upload ảnh CỦA NGƯỜI DÙNG, hoặc chọn 1 mẫu có sẵn từ thư viện.
 * Thư viện đầy đủ (tìm kiếm/lọc/lazy-load GLB) là phạm vi FE-3 — ở đây chỉ 1 lưới chọn nhanh
 * đủ dùng cho luồng wizard, KHÔNG lặp lại UI gallery đầy đủ.
 */
export default function Step1Source() {
  const { t } = useTranslation();
  const { data, isLoading, isError } = useModels3d({ size: QUICK_PICK_SIZE });
  const chooseUpload = useCustomStudioStore((s) => s.chooseUpload);
  const chooseTemplate = useCustomStudioStore((s) => s.chooseTemplate);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h2 className="font-display text-2xl">{t('custom.studio.step1.title')}</h2>
        <p className="mt-1 text-sm text-base-content/60">{t('custom.studio.step1.subtitle')}</p>
      </div>

      {/* Ô upload */}
      <div>
        <button
          onClick={chooseUpload}
          className="group flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-base-300 bg-base-200/40 p-8 text-center transition-colors hover:border-primary hover:bg-primary/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
        >
          <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary transition-transform group-hover:scale-110">
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
          </span>
          <p className="font-display text-lg">{t('custom.studio.step1.uploadTitle')}</p>
          <p className="max-w-md text-xs text-base-content/55">{t('custom.studio.step1.uploadTip')}</p>
        </button>
      </div>

      {/* Chọn mẫu có sẵn */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-medium">{t('custom.studio.step1.templateTitle')}</h3>
          <Link to="/custom/models" className="text-sm font-medium text-primary hover:underline">{t('custom.ai.browseGallery')}</Link>
        </div>
        {isError ? (
          <p className="rounded-xl bg-error/10 p-4 text-sm text-error">{t('custom.studio.step1.templateError')}</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {isLoading
              ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-32 rounded-xl" />)
              : data?.content?.length
                ? data.content.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => chooseTemplate(m)}
                      className="group relative h-32 overflow-hidden rounded-xl border border-base-300 bg-gradient-to-br from-[#e7dcc6] to-[#bfa988] transition hover:border-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
                    >
                      {m.posterUrl && (
                        <img src={m.posterUrl} alt={m.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                      )}
                      <span className="absolute inset-x-0 bottom-0 truncate bg-black/45 px-2 py-1 text-left text-xs text-white">{m.name}</span>
                    </button>
                  ))
                : (
                  <p className="col-span-full rounded-xl border border-dashed border-base-300 p-6 text-center text-sm text-base-content/55">
                    {t('custom.studio.step1.templateEmpty')}
                  </p>
                )}
          </div>
        )}
      </div>
    </div>
  );
}
