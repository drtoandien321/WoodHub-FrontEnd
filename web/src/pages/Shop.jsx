import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts.js';
import ProductCard from '../components/ui/ProductCard.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';

/*
 * Filter nằm trên URL (?category=&sort=) — pattern quan trọng:
 * share link là ra đúng kết quả, back/forward hoạt động, F5 không mất filter.
 * useSearchParams đọc/ghi query string; React Query thấy params đổi → tự refetch.
 */
export default function Shop() {
  const { category } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const sort = searchParams.get('sort') ?? '';
  const params = { category: category || searchParams.get('category') || undefined, sort: sort || undefined };

  const { data, isLoading } = useProducts(params);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    value ? next.set(key, value) : next.delete(key);
    setSearchParams(next);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl">Cửa hàng</h1>
        <select value={sort} onChange={(e) => setParam('sort', e.target.value)} className="select select-bordered select-sm w-44">
          <option value="">Mặc định</option>
          <option value="price_asc">Giá tăng dần</option>
          <option value="price_desc">Giá giảm dần</option>
        </select>
      </div>

      {/* Filter danh mục dạng pill — click đổi URL */}
      <div className="flex flex-wrap gap-2">
        <Link to="/shop" className={`badge badge-lg ${!params.category ? 'badge-primary' : 'badge-outline'}`}>Tất cả</Link>
        {data?.categories?.map((c) => (
          <Link key={c.id} to={`/shop/${c.id}`} className={`badge badge-lg ${params.category === c.id ? 'badge-primary' : 'badge-outline'}`}>
            {c.name}
          </Link>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton aspect-[4/5] rounded-2xl" />)}
        </div>
      ) : data?.items?.length ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {data.items.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      ) : (
        <EmptyState title="Chưa có sản phẩm phù hợp" hint="Thử bỏ bớt bộ lọc hoặc xem danh mục khác." ctaLabel="Xem tất cả" ctaTo="/shop" />
      )}
    </div>
  );
}
