import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatVnd } from '../../utils/format.js';

export default function ProductCard({ product }) {
  const { t } = useTranslation();
  const outOfStock = product.status === 'out_of_stock' || product.stock === 0;

  return (
    <Link to={`/product/${product.id}`} className="card bg-base-100 border border-base-300 hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden">
      <figure className="aspect-[4/3] bg-base-200 relative">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
        {outOfStock && (
          <span className="badge badge-error badge-sm absolute top-2 left-2 text-error-content">{t('product.outOfStock')}</span>
        )}
      </figure>
      <div className="card-body p-4 gap-1">
        <h3 className="font-medium leading-snug line-clamp-2">{product.name}</h3>
        <p className="text-xs text-base-content/60">{product.supplierName}</p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-primary font-semibold">{formatVnd(product.price)}</span>
          {product.rating > 0 && <span className="text-xs text-base-content/60">★ {product.rating}</span>}
        </div>
        {product.hasModel3d && <span className="badge badge-outline badge-sm mt-1">{t('product.viewAr')}</span>}
      </div>
    </Link>
  );
}
