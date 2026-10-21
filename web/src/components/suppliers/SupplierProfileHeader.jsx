import { useTranslation } from 'react-i18next';
import SafeImage from './SafeImage.jsx';
import LogoBadge from './LogoBadge.jsx';
import Stars from './Stars.jsx';
import { MessageCircle } from './icons.jsx';

/*
 * Header hồ sơ supplier: ảnh bìa coverUrl (BE-10, chưa có → gradient) + logo logoUrl đè lên,
 * tên + loại + mô tả, và CTA liên hệ. Đã bỏ badge "verified" + dải stats (rating/đơn hoàn thành/
 * thời gian sản xuất/phản hồi/kinh nghiệm) — KHÔNG field nào trong số này tồn tại ở
 * SupplierPublicResponse. reviewSummary (average/count) là dữ liệu THẬT duy nhất còn giữ được,
 * lấy riêng qua /api/reviews/summary — chỉ hiện khi count > 0.
 */
export default function SupplierProfileHeader({ supplier, reviewSummary, onContact }) {
  const { t } = useTranslation();

  return (
    <section className="overflow-hidden rounded-3xl border border-base-300 bg-base-100 shadow-sm">
      <SafeImage src={supplier.coverUrl} alt={supplier.businessName} className="h-32 w-full md:h-40" />

      <div className="px-5 pb-5 md:px-7 md:pb-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <LogoBadge
              name={supplier.businessName}
              src={supplier.logoUrl}
              className="-mt-10 h-24 w-24 shrink-0 rounded-2xl border-4 border-base-100 text-2xl shadow-md md:-mt-12 md:h-28 md:w-28"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl md:text-3xl">{supplier.businessName}</h1>
                <span className="rounded-full bg-base-200 px-2.5 py-1 text-xs font-medium text-base-content/70">
                  {t(`suppliers.typeFilters.${supplier.type}`)}
                </span>
              </div>
              {reviewSummary?.count > 0 && (
                <p className="mt-1.5 flex items-center gap-1.5 text-sm">
                  <Stars value={reviewSummary.average} size={14} />
                  <span className="font-medium">{reviewSummary.average.toFixed(1)}</span>
                  <span className="text-base-content/50">{t('suppliers.reviewsCount', { count: reviewSummary.count })}</span>
                </p>
              )}
              {supplier.hqAddress && <p className="mt-1 text-sm text-base-content/55">{supplier.hqAddress}</p>}
              {supplier.description && <p className="mt-2 max-w-2xl text-sm text-base-content/75">{supplier.description}</p>}
              <CapabilitySummary capability={supplier.capability} />
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col">
            <button onClick={onContact} className="btn btn-primary gap-2">
              <MessageCircle width={16} height={16} /> {t('suppliers.contactConsult')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

/*
 * Năng lực gia công của XƯỞNG (BE-10 §3, chỉ có ở GET /suppliers/{id}/public; retailer = null). Chưa khai báo → ẩn.
 */
function CapabilitySummary({ capability }) {
  const { t } = useTranslation();
  if (!capability || (!capability.productTypes?.length && !capability.materials?.length && capability.experienceYears == null)) return null;
  const dims = [['L', capability.maxLengthCm], ['W', capability.maxWidthCm], ['H', capability.maxHeightCm]].filter(([, v]) => v != null);
  return (
    <div className="mt-3 flex flex-col gap-1.5 text-xs text-base-content/70">
      {capability.productTypes?.length > 0 && (
        <p className="flex flex-wrap items-center gap-1"><span className="text-base-content/50">{t('suppliers.capability.types')}:</span>
          {capability.productTypes.map((x) => <span key={x} className="rounded-full bg-base-200 px-2 py-0.5">{x}</span>)}
        </p>
      )}
      {capability.materials?.length > 0 && <p><span className="text-base-content/50">{t('suppliers.capability.materials')}:</span> {capability.materials.map((m) => m.name).join(', ')}</p>}
      <p className="flex flex-wrap gap-x-4">
        {dims.length > 0 && <span><span className="text-base-content/50">{t('suppliers.capability.maxSize')}:</span> {dims.map(([k, v]) => k + ' ' + v).join(' × ')} cm</span>}
        {capability.experienceYears != null && <span><span className="text-base-content/50">{t('suppliers.capability.experience')}:</span> {t('suppliers.capability.years', { count: capability.experienceYears })}</span>}
      </p>
    </div>
  );
}
