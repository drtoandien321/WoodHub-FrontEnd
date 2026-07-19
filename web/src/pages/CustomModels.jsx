import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useModels3d } from '../hooks/useModels3d.js';
import { AI_PRODUCT_TYPES } from '../api/mock/customData.js';
import { useCustomStudioStore } from '../stores/customStudioStore.js';
import ModelCard from '../components/custom3d/ModelCard.jsx';

const PAGE_SIZE = 12;

/*
 * Thư viện mẫu 3D (FE-3) — GET /api/custom/models. Chỉ hiển thị POSTER tĩnh trong lưới (không
 * bao giờ mount <model-viewer> ở đây) — GLB thật chỉ tải khi vào trang chi tiết/viewer.
 *
 * BE (api-guide-fe.md mục 1.1) CHỈ hỗ trợ query keyword/productType/page/size/sort — "Phong
 * cách", "Material", "Đề xuất" theo yêu cầu KHÔNG có tham số lọc tương ứng ở BE (editableOptions/
 * metadata là JSONB tự do, không lọc được ở tầng DB qua endpoint này). Hiện các chip đó ở dạng
 * "sắp ra mắt" thay vì giả lập lọc sai (đúng nguyên tắc chung mục I.4: không âm thầm hiển thị
 * filter chưa có backend thật). "Mới nhất" dùng được thật vì chỉ là `sort=createdAt,desc`.
 */
export default function CustomModels() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const chooseTemplate = useCustomStudioStore((s) => s.chooseTemplate);

  const keywordParam = searchParams.get('keyword') ?? '';
  const productType = searchParams.get('productType') ?? '';
  const sort = searchParams.get('sort') ?? '';
  const page = Number(searchParams.get('page') ?? 0);

  const [keywordInput, setKeywordInput] = useState(keywordParam);
  const debounceRef = useRef();

  const setParam = (key, value, { resetPage = true } = {}) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    if (resetPage) next.delete('page');
    setSearchParams(next);
  };

  // Debounce 400ms cho ô tìm kiếm — tránh gọi API mỗi lần gõ phím
  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (keywordInput !== keywordParam) setParam('keyword', keywordInput || null);
    }, 400);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keywordInput]);

  const params = {
    keyword: keywordParam || undefined,
    productType: productType || undefined,
    sort: sort || undefined,
    page,
    size: PAGE_SIZE,
  };
  const { data, isLoading, isError, refetch } = useModels3d(params);

  const items = data?.content ?? [];
  const pageInfo = data?.page ?? { number: 0, totalPages: 1, totalElements: items.length };
  const hasFilters = !!(keywordParam || productType || sort);

  const clearFilters = () => { setKeywordInput(''); setSearchParams({}); };

  // Bấm 1 mẫu trong thư viện → mở luôn Custom Studio ở bước 4 (kết quả) với mẫu này, thay vì
  // trang xem nhanh /custom/models/:slug (đó là lối vào KHÔNG cần đăng nhập, xem CustomModelViewer.jsx)
  const pickTemplate = (model) => {
    chooseTemplate(model);
    navigate('/custom/studio');
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <Link to="/custom" className="text-sm text-base-content/55 hover:text-primary">← {t('nav.custom')}</Link>
        <h1 className="mt-1 font-display text-3xl md:text-4xl">{t('custom.ai.galleryTitle')}</h1>
        <p className="mt-2 max-w-2xl text-base-content/65">{t('custom.ai.gallerySubtitle')}</p>
      </div>

      {/* CTA sang wizard — luồng upload ảnh giờ nằm trọn ở Custom Studio (FE-2), gallery chỉ để duyệt/chọn */}
      <Link
        to="/custom/studio"
        className="flex flex-col items-start justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-5 sm:flex-row sm:items-center"
      >
        <div>
          <p className="font-display text-lg">{t('custom.ai.uploadTitle')}</p>
          <p className="text-sm text-base-content/60">{t('custom.ai.uploadDesc')}</p>
        </div>
        <span className="btn btn-primary btn-sm shrink-0">{t('custom.studio.title')}</span>
      </Link>

      {/* Tìm kiếm + lọc */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-base-content/40">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
            placeholder={t('custom.studio.gallery.searchPlaceholder')}
            className="input input-bordered w-full rounded-xl pl-10"
            aria-label={t('custom.studio.gallery.searchPlaceholder')}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setParam('productType', null)}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${!productType ? 'border-primary bg-primary/10 text-primary' : 'border-base-300 hover:border-primary/50'}`}
          >
            {t('custom.studio.gallery.allTypes')}
          </button>
          {AI_PRODUCT_TYPES.map((pt) => (
            <button
              key={pt.id}
              onClick={() => setParam('productType', productType === pt.id ? null : pt.id)}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${productType === pt.id ? 'border-primary bg-primary/10 text-primary' : 'border-base-300 hover:border-primary/50'}`}
            >
              {pt.emoji} {t(`custom.studio.productTypes.${pt.id}`)}
            </button>
          ))}

          <span className="mx-1 h-5 w-px bg-base-300" aria-hidden="true" />

          <button
            onClick={() => setParam('sort', sort === 'createdAt,desc' ? null : 'createdAt,desc')}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${sort === 'createdAt,desc' ? 'border-primary bg-primary/10 text-primary' : 'border-base-300 hover:border-primary/50'}`}
          >
            {t('custom.studio.gallery.newest')}
          </button>

          {/* Chưa có tham số lọc thật ở BE cho style/material/đề xuất — hiện để biết hướng, không giả lập lọc sai */}
          {['style', 'material', 'featured'].map((key) => (
            <span
              key={key}
              title={t('custom.studio.gallery.comingSoonHint')}
              className="cursor-not-allowed rounded-full border border-dashed border-base-300 px-3 py-1.5 text-sm text-base-content/35"
            >
              {t(`custom.studio.gallery.${key}`)} · {t('custom.studio.gallery.comingSoon')}
            </span>
          ))}

          {hasFilters && (
            <button onClick={clearFilters} className="ml-auto rounded-full px-3 py-1.5 text-sm text-error hover:underline">
              {t('custom.studio.gallery.clearFilters')}
            </button>
          )}
        </div>
      </div>

      {/* Kết quả */}
      {isError ? (
        <div className="rounded-2xl bg-error/10 p-6 text-center">
          <p className="text-sm text-error">{t('custom.studio.step1.templateError')}</p>
          <button onClick={() => refetch()} className="btn btn-outline btn-sm mt-3 border-base-300">{t('custom.ai.retry')}</button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton h-56 rounded-2xl" />)
              : items.map((m) => <ModelCard key={m.id} model={m} onClick={() => pickTemplate(m)} />)}
          </div>

          {!isLoading && items.length === 0 && (
            <div className="rounded-2xl border border-dashed border-base-300 p-10 text-center">
              <p className="text-base-content/60">{hasFilters ? t('custom.studio.gallery.noResults') : t('custom.studio.step1.templateEmpty')}</p>
              {hasFilters && <button onClick={clearFilters} className="btn btn-ghost btn-sm mt-3">{t('custom.studio.gallery.clearFilters')}</button>}
            </div>
          )}

          {!isLoading && pageInfo.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setParam('page', String(page - 1), { resetPage: false })}
                disabled={page <= 0}
                className="btn btn-outline btn-sm border-base-300"
              >
                {t('custom.studio.gallery.prevPage')}
              </button>
              <span className="text-sm text-base-content/55">{page + 1} / {pageInfo.totalPages}</span>
              <button
                onClick={() => setParam('page', String(page + 1), { resetPage: false })}
                disabled={page + 1 >= pageInfo.totalPages}
                className="btn btn-outline btn-sm border-base-300"
              >
                {t('custom.studio.gallery.nextPage')}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
