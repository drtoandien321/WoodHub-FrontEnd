import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LogoBadge from './LogoBadge.jsx';
import { Heart, Mail, Phone } from './icons.jsx';

/*
 * Card 1 supplier trong grid /suppliers.
 * ⚠️ SupplierPublicResponse (BE thật) CHỈ có: id, businessName, type, description,
 * contactEmail, contactPhone, createdAt — KHÔNG có ảnh/rating/specialties/giá/chi nhánh.
 * Card này đã bỏ hết phần trước đây dựa vào field không tồn tại (cover, rating, reviewCount,
 * ordersDisplay, leadTimeLabel, responseTime, specialties, materialsDisplay, priceFrom, verified,
 * topRated) — giữ layout ngắn gọn, đúng dữ liệu thật. Ảnh dùng LogoBadge (initials) thay cover thật.
 * onToggleFav/fav: trạng thái "yêu thích" chỉ ở client, chưa có API lưu lại.
 */
export default function SupplierCard({ supplier, fav = false, onToggleFav }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <article className="supplier-card group flex flex-col gap-3 rounded-[22px] border border-base-300 bg-base-100 p-4 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(76,52,36,0.12)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <LogoBadge name={supplier.businessName} className="h-14 w-14 shrink-0 rounded-2xl text-lg" />
          <div className="min-w-0">
            <h3 className="truncate font-display text-lg leading-tight">{supplier.businessName}</h3>
            <span className="mt-1 inline-block rounded-full bg-base-200 px-2.5 py-0.5 text-xs font-medium text-base-content/70">
              {t(`suppliers.typeFilters.${supplier.type}`)}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => onToggleFav?.(supplier.id)}
          aria-label={t('suppliers.saveSupplier')}
          aria-pressed={fav}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-primary transition-colors hover:bg-base-200"
        >
          <Heart width={18} height={18} filled={fav} />
        </button>
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

      <div className="mt-1 grid grid-cols-2 gap-2">
        <Link to={`/suppliers/${supplier.id}`} className="btn btn-outline btn-sm border-base-300 hover:border-primary hover:bg-primary/10">
          {t('suppliers.viewProfile')}
        </Link>
        <button
          onClick={() => navigate(`/custom/configure/table?supplierId=${supplier.id}`)}
          className="btn btn-primary btn-sm"
        >
          {t('suppliers.cta')}
        </button>
      </div>
    </article>
  );
}
