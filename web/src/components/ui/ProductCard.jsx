import { Link } from 'react-router-dom';
import { formatVnd } from '../../utils/format.js';

export default function ProductCard({ product }) {
  return (
    <Link to={`/product/${product.id}`} className="card bg-base-100 border border-base-300 hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden">
      <figure className="aspect-[4/3] bg-base-200">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover" loading="lazy" />
      </figure>
      <div className="card-body p-4 gap-1">
        <h3 className="font-medium leading-snug">{product.name}</h3>
        <p className="text-xs text-base-content/60">{product.supplierName}</p>
        <div className="flex items-center justify-between mt-1">
          <span className="text-primary font-semibold">{formatVnd(product.price)}</span>
          <span className="text-xs text-base-content/60">★ {product.rating}</span>
        </div>
        {product.hasModel3d && <span className="badge badge-outline badge-sm mt-1">Xem AR/3D</span>}
      </div>
    </Link>
  );
}
