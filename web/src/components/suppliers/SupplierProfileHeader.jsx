import { useTranslation } from 'react-i18next';
import SafeImage from './SafeImage.jsx';
import LogoBadge from './LogoBadge.jsx';
import Stars from './Stars.jsx';
import { MessageCircle, Send } from './icons.jsx';

/*
 * Header hồ sơ supplier: banner (gradient — BE không có field ảnh cover) + logo đè lên,
 * tên + loại + mô tả, và 2 CTA. Đã bỏ badge "verified" + dải stats (rating/đơn hoàn thành/
 * thời gian sản xuất/phản hồi/kinh nghiệm) — KHÔNG field nào trong số này tồn tại ở
 * SupplierPublicResponse. reviewSummary (average/count) là dữ liệu THẬT duy nhất còn giữ được,
 * lấy riêng qua /api/reviews/summary — chỉ hiện khi count > 0.
 */
export default function SupplierProfileHeader({ supplier, reviewSummary, onOrderCustom, onContact }) {
  const { t } = useTranslation();

  return (
    <section className="overflow-hidden rounded-3xl border border-base-300 bg-base-100 shadow-sm">
      <SafeImage alt={supplier.businessName} className="h-32 w-full md:h-40" />

      <div className="px-5 pb-5 md:px-7 md:pb-7">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <LogoBadge
              name={supplier.businessName}
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
              {supplier.description && <p className="mt-2 max-w-2xl text-sm text-base-content/75">{supplier.description}</p>}
            </div>
          </div>

          <div className="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col">
            <button onClick={onOrderCustom} className="btn btn-primary gap-2">
              <Send width={16} height={16} /> {t('suppliers.orderCustom')}
            </button>
            <button onClick={onContact} className="btn btn-outline gap-2 border-base-300 hover:border-primary hover:bg-primary/10">
              <MessageCircle width={16} height={16} /> {t('suppliers.contactConsult')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
