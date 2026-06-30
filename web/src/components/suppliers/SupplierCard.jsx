import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatVnd } from '../../utils/format.js';
import SafeImage from './SafeImage.jsx';
import Stars from './Stars.jsx';
import { MapPin, Heart, CheckCircle, Award } from './icons.jsx';

/*
 * Card 1 xưởng trong grid /suppliers.
 * - onToggleFav/fav: trạng thái "yêu thích" do trang cha quản (UI-only, chưa gắn BE).
 * - Đặt thiết kế custom → /custom/configure/table?supplierId=<id> (route custom hiện có).
 */
export default function SupplierCard({ supplier, fav = false, onToggleFav }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <article className="supplier-card group flex flex-col overflow-hidden rounded-[22px] border border-base-300 bg-base-100 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(76,52,36,0.12)]">
      {/* Thumbnail + badges + heart */}
      <div className="relative h-40 w-full overflow-hidden">
        <SafeImage src={supplier.cover} alt={supplier.name} className="h-full w-full transition-transform duration-300 group-hover:scale-[1.04]" />
        <div className="absolute left-3 top-3 flex gap-1.5">
          {supplier.topRated && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-xs font-medium text-primary-content shadow">
              <Award width={13} height={13} /> {t('suppliers.topRated')}
            </span>
          )}
          {supplier.verified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-success backdrop-blur-sm">
              <CheckCircle width={13} height={13} /> {t('suppliers.verified')}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => onToggleFav?.(supplier.id)}
          aria-label={t('suppliers.saveSupplier')}
          aria-pressed={fav}
          className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-base-100/80 text-primary shadow backdrop-blur-sm transition-colors hover:bg-base-100"
        >
          <Heart width={18} height={18} filled={fav} />
        </button>
      </div>

      {/* Nội dung */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="font-display text-lg leading-tight">{supplier.name}</h3>
            <p className="mt-1 flex items-center gap-1 text-sm text-base-content/60">
              <MapPin width={14} height={14} /> {supplier.district}
            </p>
          </div>
          <span className="flex shrink-0 items-center gap-1 text-sm font-medium">
            <Stars value={supplier.rating} size={13} />
            <span>{supplier.rating}</span>
            <span className="text-base-content/50">({supplier.reviewCount})</span>
          </span>
        </div>

        {/* 3 chỉ số sản xuất */}
        <div className="grid grid-cols-3 gap-2 rounded-xl bg-base-200/60 p-2.5 text-center">
          <Metric label={t('suppliers.completedLabel')} value={supplier.ordersDisplay} />
          <Metric label={t('suppliers.leadTimeLabel')} value={supplier.leadTimeLabel} />
          <Metric label={t('suppliers.responseLabel')} value={supplier.responseTime} />
        </div>

        <dl className="space-y-1 text-sm">
          <InfoRow label={t('suppliers.specialtiesLabel')} value={supplier.specialties.join(', ')} />
          <InfoRow label={t('suppliers.materialsLabel')} value={supplier.materialsDisplay.join(', ')} />
        </dl>

        <div className="mt-auto flex items-end justify-between pt-1">
          <span className="text-xs text-base-content/55">{t('suppliers.priceFromLabel')}</span>
          <span className="text-lg font-semibold text-primary">{formatVnd(supplier.priceFrom)}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <Link to={`/suppliers/${supplier.slug}`} className="btn btn-outline btn-sm border-base-300 hover:border-primary hover:bg-primary/10">
            {t('suppliers.viewProfile')}
          </Link>
          <button
            onClick={() => navigate(`/custom/configure/table?supplierId=${supplier.id}`)}
            className="btn btn-primary btn-sm"
          >
            {t('suppliers.cta')}
          </button>
        </div>
      </div>
    </article>
  );
}

function Metric({ label, value }) {
  return (
    <div className="min-w-0">
      <p className="truncate text-sm font-semibold text-base-content">{value}</p>
      <p className="truncate text-[11px] text-base-content/55">{label}</p>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex gap-1.5">
      <dt className="shrink-0 text-base-content/55">{label}:</dt>
      <dd className="min-w-0 truncate text-base-content/80">{value}</dd>
    </div>
  );
}
