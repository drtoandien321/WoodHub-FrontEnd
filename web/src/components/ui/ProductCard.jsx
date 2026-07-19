import { Link } from 'react-router-dom';
import { formatVnd } from '../../utils/format.js';

/*
 * Card sản phẩm — dùng chung Shop/Landing/RelatedProducts. Khớp ProductSummaryResponse thật
 * (FE-4): { id,supplierId,supplierName,categoryId,categoryName,materialName,name,status,
 * priceFrom,primaryImageUrl,createdAt }. KHÔNG có stock/rating/has3d ở tầng danh sách (đó là dữ
 * liệu tồn kho/AI 3D riêng, BE chưa gộp vào response này) — không tự bịa hiển thị cho các field đó.
 */
export default function ProductCard({ product }) {
  return (
    <Link to={`/product/${product.id}`} className="card bg-base-100 border border-base-300 hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden">
      <figure className="aspect-[4/3] bg-base-200">
        {product.primaryImageUrl && (
          <img
            src={product.primaryImageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
            loading="lazy"
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
          />
        )}
      </figure>
      <div className="card-body p-4 gap-1">
        <h3 className="font-medium leading-snug line-clamp-2">{product.name}</h3>
        <p className="text-xs text-base-content/60">{product.supplierName}</p>
        {product.materialName && <p className="text-xs text-base-content/50">{product.materialName}</p>}
        <span className="text-primary font-semibold mt-1">{formatVnd(product.priceFrom)}</span>
      </div>
    </Link>
  );
}
