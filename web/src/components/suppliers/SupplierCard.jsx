import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LogoBadge from './LogoBadge.jsx';
import { Mail, Phone } from './icons.jsx';

/*
 * Card 1 supplier trong grid /suppliers.
 * ⚠️ SupplierPublicResponse (BE thật) CHỈ có: id, businessName, type, description,
 * contactEmail, contactPhone, createdAt — KHÔNG có ảnh/rating/specialties/giá/chi nhánh.
 * Card này đã bỏ hết phần trước đây dựa vào field không tồn tại (cover, rating, reviewCount,
 * ordersDisplay, leadTimeLabel, responseTime, specialties, materialsDisplay, priceFrom, verified,
 * topRated) — giữ layout ngắn gọn, đúng dữ liệu thật. Ảnh: logoUrl (BE-10), chưa có thì LogoBadge hiện chữ viết tắt.
 * Đã gỡ nút ♥ "yêu thích": chỉ lưu state client (mất khi F5), BE chưa có API → nút không có tác dụng thật (QA BUG-009).
 */
export default function SupplierCard({ supplier }) {
  const { t } = useTranslation();

  return (
    <article className="supplier-card group flex flex-col gap-3 rounded-[22px] border border-base-300 bg-base-100 p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(76,52,36,0.12)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <LogoBadge name={supplier.businessName} src={supplier.logoUrl} className="h-14 w-14 shrink-0 rounded-2xl text-lg" />
          <div className="min-w-0">
            <h2 className="truncate font-display text-lg leading-tight">{supplier.businessName}</h2>
            <span className="mt-1 inline-block rounded-full bg-base-200 px-2.5 py-0.5 text-xs font-medium text-base-content/70">
              {t(`suppliers.typeFilters.${supplier.type}`)}
            </span>
          </div>
        </div>
      </div>

      {supplier.description && (
        <p className="line-clamp-2 text-sm text-base-content/70">{supplier.description}</p>
      )}

      {(supplier.contactEmail || supplier.contactPhone) && (
        <div className="flex flex-col gap-1 text-xs text-base-content/55">
          {supplier.contactPhone && <span className="flex items-center gap-1.5"><Phone width={13} height={13} /> {supplier.contactPhone}</span>}
          {supplier.contactEmail && <span className="flex items-center gap-1.5 truncate"><Mail width={13} height={13} /> {supplier.contactEmail}</span>}
        </div>
      )}

      <div className="mt-1">
        <Link to={`/suppliers/${supplier.id}`} className="btn btn-outline btn-sm w-full border-base-300 hover:border-primary hover:bg-primary/10">
          {t('suppliers.viewProfile')}
        </Link>
      </div>
    </article>
  );
}
