import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatVnd } from '../../utils/format.js';
import { useReviewSummary } from '../../hooks/useReviews.js';
import { Star } from '../suppliers/icons.jsx';

/*
 * Dòng "★ 4.5 (12)" dưới tên sản phẩm.
 * - Nếu BE đã gộp sẵn averageRating/reviewCount vào ProductSummaryResponse (đề xuất gửi BE) → dùng luôn,
 *   KHÔNG gọi thêm API.
 * - Chưa có → tạm gọi GET /reviews/summary cho từng thẻ (cache 5 phút qua useReviewSummary). Đánh đổi: thêm
 *   1 request/thẻ (N+1) — chấp nhận tạm ở MVP vì trang chỉ ~20 thẻ và endpoint rất nhẹ; BE thêm field là tự hết.
 * Chưa có đánh giá → hiện "Chưa có đánh giá" mờ để thẻ cao đều nhau.
 */
function RatingLine({ product }) {
  const { t } = useTranslation();
  const hasBeFields = product.reviewCount != null;
  const { data } = useReviewSummary('product', hasBeFields ? null : product.id);
  const count = hasBeFields ? product.reviewCount : data?.count;
  const average = hasBeFields ? product.averageRating : data?.average;

  if (count == null) return <span className="h-4" aria-hidden="true" />; // đang tải → giữ chỗ, không nhảy layout
  if (!count) return <span className="text-xs text-base-content/40">{t('reviews.none')}</span>;
  return (
    <span className="flex items-center gap-1 text-xs text-base-content/70" aria-label={t('reviews.cardAria', { avg: average.toFixed(1), count })}>
      <Star width={13} height={13} className="text-accent" filled />
      <span className="font-medium">{average.toFixed(1)}</span>
      <span className="text-base-content/50">({t('reviews.count', { count })})</span>
    </span>
  );
}

/*
 * Card sản phẩm — dùng chung Shop/Landing/RelatedProducts. Khớp ProductSummaryResponse thật
 * (FE-4): { id,supplierId,supplierName,categoryId,categoryName,materialName,name,status,
 * priceFrom,primaryImageUrl,createdAt, has3d, customizable }. has3d / customizable (admin gắn mẫu 3D cho SP) → badge góc ảnh.
 */
export default function ProductCard({ product }) {
  const { t } = useTranslation();
  return (
    <Link to={`/product/${product.id}`} className="card bg-base-100 border border-base-300 hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden">
      <figure className="relative aspect-[4/3] bg-base-200">
        {(product.has3d || product.customizable) && (
          <span className="absolute left-2 top-2 z-10 flex gap-1">
            {product.has3d && <span className="badge badge-sm border-0 bg-base-100/90 font-medium shadow-sm">3D</span>}
            {product.customizable && <span className="badge badge-sm border-0 bg-primary/90 font-medium text-primary-content shadow-sm">{t('product.customizableBadge')}</span>}
          </span>
        )}
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
        <RatingLine product={product} />
        <span className="text-primary font-semibold mt-1">{formatVnd(product.priceFrom)}</span>
      </div>
    </Link>
  );
}
