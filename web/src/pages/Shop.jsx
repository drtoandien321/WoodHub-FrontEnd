import { useParams, useSearchParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProducts } from '../hooks/useProducts.js';
import ProductCard from '../components/ui/ProductCard.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';

export default function Shop() {
  const { category } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation();

  const sort = searchParams.get('sort') ?? '';
  const material = searchParams.get('material') ?? '';
  const maxPrice = searchParams.get('maxPrice') ?? '';
  
  const params = { 
    category: category || searchParams.get('category') || undefined, 
    sort: sort || undefined,
    material: material || undefined,
    maxPrice: maxPrice || undefined
  };

  const { data, isLoading } = useProducts(params);

  const setParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    value ? next.set(key, value) : next.delete(key);
    setSearchParams(next);
  };

  // Debounce helper cho slider giá
  let timeoutId;
  const handlePriceChange = (e) => {
    const value = e.target.value;
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      setParam('maxPrice', value);
    }, 300);
  };

  const clearFilters = () => {
    setSearchParams({});
  };

  const hasFilters = material || maxPrice || sort;

  const materialsList = ['oak', 'walnut', 'ash', 'pine', 'rubber'];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="font-display text-3xl">{t('nav.shop')}</h1>
        <div className="flex items-center gap-2">
          <select value={sort} onChange={(e) => setParam('sort', e.target.value)} className="select select-bordered select-sm w-48">
            <option value="">{t('shop.sort.default')}</option>
            <option value="price_asc">{t('shop.sort.price_asc')}</option>
            <option value="price_desc">{t('shop.sort.price_desc')}</option>
          </select>
          {hasFilters && (
            <button onClick={clearFilters} className="btn btn-ghost btn-sm text-error">
              {t('shop.clearFilter')}
            </button>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-[240px_1fr] gap-8">
        <aside className="flex flex-col gap-6">
          {/* Filter danh mục */}
          <div>
            <h3 className="font-medium mb-3">{t('nav.shop')}</h3>
            <div className="flex flex-col gap-2">
              <Link to="/shop" className={`hover:text-primary transition-colors ${!params.category ? 'font-semibold text-primary' : ''}`}>{t('shop.all')}</Link>
              {data?.categories?.map((c) => (
                <Link key={c.id} to={`/shop/${c.id}`} className={`hover:text-primary transition-colors ${params.category === c.id ? 'font-semibold text-primary' : ''}`}>
                  {c.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="divider my-0"></div>

          {/* Filter vật liệu */}
          <div>
            <h3 className="font-medium mb-3">{t('shop.filterMaterial')}</h3>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors">
                <input type="radio" name="material" className="radio radio-xs radio-primary" checked={!material} onChange={() => setParam('material', '')} />
                <span className={!material ? 'font-medium' : ''}>{t('shop.all')}</span>
              </label>
              {materialsList.map(mat => (
                <label key={mat} className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors">
                  <input type="radio" name="material" className="radio radio-xs radio-primary" checked={material === mat} onChange={() => setParam('material', mat)} />
                  <span className={material === mat ? 'font-medium' : ''}>{t(`suppliers.materials.${mat}`)}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="divider my-0"></div>

          {/* Filter giá tối đa */}
          <div>
            <h3 className="font-medium mb-3">{t('shop.filterMaxPrice')}</h3>
            <input 
              type="range" 
              min="1000000" 
              max="20000000" 
              step="500000"
              defaultValue={maxPrice || 20000000}
              onChange={handlePriceChange}
              className="range range-primary range-sm" 
            />
            <div className="flex justify-between text-xs mt-2 text-base-content/60">
              <span>{t('shop.priceMin')}</span>
              <span>{t('shop.priceMax')}</span>
            </div>
          </div>
        </aside>

        <div>
          {isLoading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, i) => <div key={i} className="skeleton aspect-[4/5] rounded-2xl" />)}
            </div>
          ) : data?.items?.length ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {data.items.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <EmptyState title={t('shop.emptyTitle')} hint={t('shop.emptyHint')} ctaLabel={t('shop.clearFilter')} ctaTo="/shop" />
          )}
        </div>
      </div>
    </div>
  );
}
