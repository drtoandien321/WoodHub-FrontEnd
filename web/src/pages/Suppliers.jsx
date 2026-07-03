import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePublicSuppliers } from '../hooks/usePublicSuppliers.js';
import SupplierCard from '../components/suppliers/SupplierCard.jsx';
import SupplierFilterBar from '../components/suppliers/SupplierFilterBar.jsx';
import SupplierListStats from '../components/suppliers/SupplierListStats.jsx';
import { Search, UserPlus } from '../components/suppliers/icons.jsx';

/*
 * Suppliers — trang browse công khai (guest xem được). Trước đây lọc theo rating/leadTime/
 * capability (không có ở BE thật) — giờ chỉ còn filter THẬT hỗ trợ được: loại supplier
 * (retailer/workshop, qua query param `type` của GET /suppliers/public) + tìm kiếm client-side
 * theo tên/mô tả (BE chưa có tham số `keyword`, xem client.js).
 *
 * size=100: BE phân trang mặc định 20 — lấy nhiều hơn để ô tìm kiếm client-side "cảm giác đủ",
 * chấp nhận trade-off này ở quy mô MVP (chưa cần infinite-scroll/server search).
 */
const TYPE_FILTERS = [
  { id: 'all', labelKey: 'suppliers.typeFilters.all' },
  { id: 'retailer', labelKey: 'suppliers.typeFilters.retailer' },
  { id: 'workshop', labelKey: 'suppliers.typeFilters.workshop' },
];

export default function Suppliers() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [favs, setFavs] = useState(() => new Set());
  const { data, isLoading } = usePublicSuppliers({ size: 100, ...(type !== 'all' && { type }) });

  const toggleFav = (id) =>
    setFavs((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const listStats = t('suppliers.listStats', { returnObjects: true });
  const filters = TYPE_FILTERS.map((f) => ({ id: f.id, label: t(f.labelKey) }));

  const visible = useMemo(() => {
    const items = data?.content ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((s) => [s.businessName, s.description].filter(Boolean).join(' ').toLowerCase().includes(q));
  }, [data, query]);

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

      {/* 4 stat card tổng quan — nội dung marketing tĩnh (i18n), không phải số liệu tính từ dữ liệu thật */}
      <SupplierListStats stats={listStats} />

      {/* Filter loại supplier — duy nhất filter BE hỗ trợ thật (param `type`) */}
      <SupplierFilterBar filters={filters} active={type} onChange={setType} />

      {/* Grid supplier */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-56 rounded-[22px]" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-base-300 bg-base-100 py-16 text-center">
          <p className="font-display text-xl">{t('suppliers.noResults')}</p>
          <p className="mt-1 text-base-content/60">{t('suppliers.noResultsHint')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {visible.map((s) => (
            <SupplierCard key={s.id} supplier={s} fav={favs.has(s.id)} onToggleFav={toggleFav} />
          ))}
        </div>
      )}
    </div>
  );
}
