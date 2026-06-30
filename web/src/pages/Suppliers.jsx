import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useWorkshops } from '../hooks/useProducts.js';
import SupplierCard from '../components/suppliers/SupplierCard.jsx';
import SupplierFilterBar from '../components/suppliers/SupplierFilterBar.jsx';
import SupplierListStats from '../components/suppliers/SupplierListStats.jsx';
import { Search, UserPlus } from '../components/suppliers/icons.jsx';

/*
 * Vị từ lọc theo id chip. Tách khỏi JSX để dễ đọc/mở rộng + dễ thay bằng query BE sau này.
 * Các chip "định tính" (near/hcm — chưa có geo) trả true: chỉ là UI, không loại bỏ kết quả.
 */
const FILTER_PREDICATES = {
  all: () => true,
  near: () => true,
  hcm: () => true,
  topRated: (w) => w.rating >= 4.8,
  fast: (w) => w.leadTimeDays <= 14,
  chairs: (w) => w.capability.types.some((ty) => ty === 'chair' || ty === 'table'),
  cabinets: (w) => w.capability.types.includes('cabinet'),
  oak: (w) => w.capability.materials.includes('oak'),
};

export default function Suppliers() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data, isLoading } = useWorkshops();

  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [favs, setFavs] = useState(() => new Set());

  const filters = t('suppliers.filters', { returnObjects: true });
  const listStats = t('suppliers.listStats', { returnObjects: true });

  const toggleFav = (id) =>
    setFavs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  // Lọc theo search + chip. useMemo để chỉ tính lại khi data/query/filter đổi.
  const visible = useMemo(() => {
    const items = data?.items ?? [];
    const q = query.trim().toLowerCase();
    const predicate = FILTER_PREDICATES[activeFilter] ?? FILTER_PREDICATES.all;
    return items.filter((w) => {
      if (!predicate(w)) return false;
      if (!q) return true;
      const haystack = [w.name, w.district, ...w.specialties, ...w.materialsDisplay].join(' ').toLowerCase();
      return haystack.includes(q);
    });
  }, [data, query, activeFilter]);

  return (
    <div className="flex flex-col gap-8">
      {/* Hero: tiêu đề + search (trái) · CTA đăng ký (phải) */}
      <section className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          <h1 className="font-display text-3xl md:text-4xl">{t('suppliers.title')}</h1>
          <p className="mt-2 max-w-xl text-base-content/60">{t('suppliers.subtitle')}</p>

          <div className="relative mt-5 w-full max-w-xl">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('suppliers.searchPlaceholder')}
              className="input input-bordered h-12 w-full rounded-2xl border-base-300 bg-base-100 pr-12 shadow-sm focus:border-primary focus:outline-none"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-base-content/50">
              <Search width={20} height={20} />
            </span>
          </div>
        </div>

        <button
          onClick={() => navigate('/register')}
          className="btn btn-primary h-12 gap-2 self-start rounded-2xl max-lg:w-full lg:mt-2"
        >
          <UserPlus width={18} height={18} />
          {t('suppliers.registerCta')}
        </button>
      </section>

      {/* 4 stat card tổng quan */}
      <SupplierListStats stats={listStats} />

      {/* Filter chips */}
      <SupplierFilterBar filters={filters} active={activeFilter} onChange={setActiveFilter} />

      {/* Grid xưởng */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-96 rounded-[22px]" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-base-300 bg-base-100 py-16 text-center">
          <p className="font-display text-xl">{t('suppliers.noResults')}</p>
          <p className="mt-1 text-base-content/60">{t('suppliers.noResultsHint')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((w) => (
            <SupplierCard key={w.id} supplier={w} fav={favs.has(w.id)} onToggleFav={toggleFav} />
          ))}
        </div>
      )}
    </div>
  );
}
