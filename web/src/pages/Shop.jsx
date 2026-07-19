import { useState, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useProducts } from '../hooks/useProducts.js';
import { useCategoryTree, useMaterials, useRooms, useStyles } from '../hooks/useCatalog.js';
import ProductCard from '../components/ui/ProductCard.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { formatVnd } from '../utils/format.js';

const PRICE_MIN = 1000000;
const PRICE_MAX = 20000000;
const PAGE_SIZE = 12;

// Nhóm filter dạng checkbox đơn giản (available/has3d/customizable) — đều là param thật của BE-7
const BOOLEAN_FILTERS = [
  { key: 'available', labelKey: 'shop.filterAvailable' },
  { key: 'has3d', labelKey: 'shop.filterHas3d' },
  { key: 'customizable', labelKey: 'shop.filterCustomizable' },
];

export default function Shop() {
  const { category: categoryFromPath } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const categoryId = categoryFromPath || searchParams.get('categoryId') || '';
  const materialId = searchParams.get('materialId') ?? '';
  const room = searchParams.get('room') ?? '';
  const style = searchParams.get('style') ?? '';
  const sort = searchParams.get('sort') ?? '';
  const maxPrice = searchParams.get('maxPrice') ?? '';
  const page = Number(searchParams.get('page') ?? 0);
  const activeBooleans = BOOLEAN_FILTERS.filter((f) => searchParams.get(f.key) === 'true');

  const params = {
    categoryId: categoryId || undefined,
    materialId: materialId || undefined,
    room: room || undefined,
    style: style || undefined,
    sort: sort || undefined,
    maxPrice: maxPrice || undefined,
    available: searchParams.get('available') === 'true' || undefined,
    has3d: searchParams.get('has3d') === 'true' || undefined,
    customizable: searchParams.get('customizable') === 'true' || undefined,
    page,
    size: PAGE_SIZE,
  };

  const { data, isLoading, isError, refetch } = useProducts(params);
  const { data: categoryTree } = useCategoryTree();
  const { data: materials } = useMaterials();
  const { data: rooms } = useRooms();
  const { data: styles } = useStyles();

  const setParam = (key, value, { resetPage = true } = {}) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value); else next.delete(key);
    if (resetPage) next.delete('page');
    setSearchParams(next);
  };

  const toggleBoolean = (key) => setParam(key, searchParams.get(key) === 'true' ? null : 'true');

  // Giá hiển thị (cập nhật tức thì khi kéo) tách khỏi giá lọc thật (debounce 300ms)
  const [priceDisplay, setPriceDisplay] = useState(Number(maxPrice) || PRICE_MAX);
  const priceTimeout = useRef();
  const handlePriceChange = (e) => {
    const value = Number(e.target.value);
    setPriceDisplay(value);
    clearTimeout(priceTimeout.current);
    priceTimeout.current = setTimeout(() => setParam('maxPrice', value < PRICE_MAX ? value : null), 300);
  };

  // Xóa hết filter: navigate('/shop') bỏ luôn danh mục nằm ở path /shop/:category
  const clearFilters = () => {
    setPriceDisplay(PRICE_MAX);
    navigate('/shop');
    setMobileOpen(false);
  };

  const filterCount =
    (categoryId ? 1 : 0) + (materialId ? 1 : 0) + (room ? 1 : 0) + (style ? 1 : 0) +
    (maxPrice ? 1 : 0) + activeBooleans.length;
  const hasFilters = filterCount > 0 || sort;

  const items = data?.content ?? [];
  const pageInfo = data?.page ?? { number: 0, totalPages: 1, totalElements: items.length };

  // Danh mục: chọn 1 node trong cây (top-level hoặc con) — điều hướng qua path /shop/:categoryId
  // để giữ nguyên quy ước cũ (category nằm ở path, các filter khác ở query).
  const goCategory = (id) => {
    setMobileOpen(false);
    navigate(id ? `/shop/${id}` : '/shop');
  };

  const FilterContent = () => (
    <div className="flex flex-col gap-6">
      {/* Danh mục */}
      <div>
        <h3 className="font-medium mb-3">{t('shop.filterCategory')}</h3>
        <div className="flex flex-col gap-1.5">
          <button onClick={() => goCategory('')} className={`text-left hover:text-primary transition-colors ${!categoryId ? 'font-semibold text-primary' : ''}`}>
            {t('shop.all')}
          </button>
          {(categoryTree ?? []).map((c) => (
            <div key={c.id}>
              <button onClick={() => goCategory(c.id)} className={`text-left hover:text-primary transition-colors ${categoryId === c.id ? 'font-semibold text-primary' : ''}`}>
                {c.name}
              </button>
              {c.children?.length > 0 && (
                <div className="ml-3 mt-1 flex flex-col gap-1 border-l border-base-300 pl-3">
                  {c.children.map((child) => (
                    <button key={child.id} onClick={() => goCategory(child.id)} className={`text-left text-sm hover:text-primary transition-colors ${categoryId === child.id ? 'font-semibold text-primary' : 'text-base-content/70'}`}>
                      {child.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="divider my-0" />

      {/* Vật liệu */}
      <div>
        <h3 className="font-medium mb-3">{t('shop.filterMaterial')}</h3>
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors">
            <input type="radio" name="materialId" className="radio radio-xs radio-primary" checked={!materialId} onChange={() => setParam('materialId', null)} />
            <span className={!materialId ? 'font-medium' : ''}>{t('shop.all')}</span>
          </label>
          {(materials ?? []).map((mat) => (
            <label key={mat.id} className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors">
              <input type="radio" name="materialId" className="radio radio-xs radio-primary" checked={materialId === mat.id} onChange={() => setParam('materialId', mat.id)} />
              <span className={materialId === mat.id ? 'font-medium' : ''}>{mat.name}</span>
            </label>
          ))}
        </div>
      </div>

      <div className="divider my-0" />

      {/* Giá tối đa */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium">{t('shop.filterMaxPrice')}</h3>
          <span className="text-sm font-semibold text-primary">
            {priceDisplay >= PRICE_MAX ? t('shop.priceMax') : formatVnd(priceDisplay)}
          </span>
        </div>
        <input type="range" min={PRICE_MIN} max={PRICE_MAX} step="500000" value={priceDisplay} onChange={handlePriceChange} className="range range-primary range-sm" />
        <div className="flex justify-between text-xs mt-2 text-base-content/60">
          <span>{t('shop.priceMin')}</span>
          <span>{t('shop.priceMax')}</span>
        </div>
      </div>

      {/* Phòng — chỉ hiện khi có dữ liệu (BE thật chưa seed thì tự ẩn, không hiện ô trống) */}
      {rooms?.length > 0 && (
        <>
          <div className="divider my-0" />
          <div>
            <h3 className="font-medium mb-3">{t('shop.filterRoom')}</h3>
            <div className="flex flex-wrap gap-2">
              {rooms.map((r) => (
                <button
                  key={r.id}
                  onClick={() => setParam('room', room === r.slug ? null : r.slug)}
                  className={`rounded-full border px-3 py-1 text-sm transition-colors ${room === r.slug ? 'border-primary bg-primary/10 text-primary' : 'border-base-300 hover:border-primary/50'}`}
                >
                  {r.name}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Phong cách */}
      {styles?.length > 0 && (
        <>
          <div className="divider my-0" />
          <div>
            <h3 className="font-medium mb-3">{t('shop.filterStyle')}</h3>
            <div className="flex flex-wrap gap-2">
              {styles.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setParam('style', style === s.slug ? null : s.slug)}
                  className={`rounded-full border px-3 py-1 text-sm transition-colors ${style === s.slug ? 'border-primary bg-primary/10 text-primary' : 'border-base-300 hover:border-primary/50'}`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="divider my-0" />

      {/* Còn hàng / có 3D / có thể custom */}
      <div className="flex flex-col gap-2.5">
        {BOOLEAN_FILTERS.map((f) => (
          <label key={f.key} className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" className="checkbox checkbox-sm checkbox-primary" checked={searchParams.get(f.key) === 'true'} onChange={() => toggleBoolean(f.key)} />
            <span className="text-sm">{t(f.labelKey)}</span>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="font-display text-3xl">{t('nav.shop')}</h1>
        <div className="flex items-center gap-2">
          {/* Bộ lọc — mobile drawer trigger */}
          <button onClick={() => setMobileOpen(true)} className="btn btn-outline btn-sm border-base-300 lg:hidden">
            {t('shop.filtersButton')}{filterCount > 0 && <span className="badge badge-primary badge-sm">{filterCount}</span>}
          </button>
          {/* Desktop: thu gọn/mở sidebar */}
          <button onClick={() => setCollapsed((c) => !c)} className="btn btn-ghost btn-sm hidden lg:inline-flex">
            {collapsed ? t('shop.expandFilters') : t('shop.collapseFilters')}
          </button>
          <select value={sort} onChange={(e) => setParam('sort', e.target.value || null)} className="select select-bordered select-sm w-44">
            <option value="">{t('shop.sort.default')}</option>
            <option value="name,asc">{t('shop.sort.name_asc')}</option>
            <option value="name,desc">{t('shop.sort.name_desc')}</option>
            <option value="createdAt,desc">{t('shop.sort.newest')}</option>
          </select>
          {/* Sắp xếp theo giá đang lỗi 500 ở BE (sort=priceFrom,*) — hiện "sắp ra mắt" thay vì âm thầm gọi API lỗi */}
          <span title={t('shop.priceSortComingSoonHint')} className="hidden cursor-not-allowed rounded-full border border-dashed border-base-300 px-3 py-1.5 text-xs text-base-content/35 sm:inline">
            {t('shop.sort.price')} · {t('shop.priceSortComingSoon')}
          </span>
          {hasFilters && (
            <button onClick={clearFilters} className="btn btn-ghost btn-sm text-error">
              {t('shop.clearFilter')} ({filterCount})
            </button>
          )}
        </div>
      </div>

      <div className={`grid gap-8 ${collapsed ? 'lg:grid-cols-1' : 'lg:grid-cols-[240px_1fr]'}`}>
        {!collapsed && (
          <aside className="hidden lg:block">
            <FilterContent />
          </aside>
        )}

        <div>
          {isError ? (
            <div className="rounded-2xl bg-error/10 p-6 text-center">
              <p className="text-sm text-error">{t('shop.loadError')}</p>
              <button onClick={() => refetch()} className="btn btn-outline btn-sm mt-3 border-base-300">{t('shop.retry')}</button>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton aspect-[4/5] rounded-2xl" />)}
            </div>
          ) : items.length ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {items.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
              {pageInfo.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-center gap-3">
                  <button onClick={() => setParam('page', String(page - 1), { resetPage: false })} disabled={page <= 0} className="btn btn-outline btn-sm border-base-300">
                    {t('shop.prevPage')}
                  </button>
                  <span className="text-sm text-base-content/55">{page + 1} / {pageInfo.totalPages}</span>
                  <button onClick={() => setParam('page', String(page + 1), { resetPage: false })} disabled={page + 1 >= pageInfo.totalPages} className="btn btn-outline btn-sm border-base-300">
                    {t('shop.nextPage')}
                  </button>
                </div>
              )}
            </>
          ) : (
            <EmptyState title={t('shop.emptyTitle')} hint={t('shop.emptyHint')} ctaLabel={t('shop.clearFilter')} ctaTo="/shop" />
          )}
        </div>
      </div>

      {/* Bộ lọc — mobile drawer (FE-7: transition trượt vào từ trái, cùng pattern ChatDrawer.jsx) */}
      <AnimatePresence>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} aria-hidden="true"
            />
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              role="dialog" aria-modal="true" aria-label={t('shop.filtersButton')}
              className="absolute inset-y-0 left-0 w-[85%] max-w-sm overflow-y-auto bg-base-100 p-5 shadow-xl"
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-xl">{t('shop.filtersButton')}</h2>
                <button onClick={() => setMobileOpen(false)} aria-label={t('shop.close')} className="btn btn-ghost btn-sm btn-circle">✕</button>
              </div>
              <FilterContent />
              <button onClick={() => setMobileOpen(false)} className="btn btn-primary mt-6 w-full">{t('shop.applyFilters')}</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
