import { useTranslation } from 'react-i18next';
import SafeImage from './SafeImage.jsx';
import LogoBadge from './LogoBadge.jsx';
import { MapPin, CheckCircle, Star, Calendar, Clock, MessageCircle, Award, Send } from './icons.jsx';

/*
 * Header hồ sơ xưởng: banner + logo đè lên, thông tin chính, dải stats và 2 CTA.
 * Hành động đẩy lên trang cha qua onOrderCustom/onContact để tách logic khỏi UI.
 */
export default function SupplierProfileHeader({ supplier, onOrderCustom, onContact }) {
  const { t } = useTranslation();

  const stats = [
    { icon: Star, value: supplier.rating, label: t('suppliers.reviewsCount', { count: supplier.reviewCount }) },
    { icon: Calendar, value: supplier.ordersDisplay, label: t('suppliers.headerStats.ordersDone') },
    { icon: Clock, value: `${supplier.leadTimeLabel} ${t('suppliers.headerStats.perOrder')}`, label: t('suppliers.headerStats.production') },
    { icon: MessageCircle, value: `~${supplier.responseTime}`, label: t('suppliers.headerStats.response') },
    { icon: Award, value: supplier.experience, label: t('suppliers.headerStats.experience') },
  ];

  return (
    <section className="overflow-hidden rounded-3xl border border-base-300 bg-base-100 shadow-sm">
      {/* Banner */}
      <SafeImage src={supplier.cover} alt={supplier.name} className="h-44 w-full md:h-56" />

      <div className="px-5 pb-5 md:px-7 md:pb-7">
        {/* Hàng thông tin chính: logo + tên + CTA */}
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <LogoBadge name={supplier.name} className="-mt-12 h-24 w-24 shrink-0 rounded-2xl border-4 border-base-100 text-2xl shadow-md md:-mt-16 md:h-28 md:w-28" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="font-display text-2xl md:text-3xl">{supplier.name}</h1>
                {supplier.verified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-success/15 px-2.5 py-1 text-xs font-medium text-success">
                    <CheckCircle width={13} height={13} /> {t('suppliers.verified')}
                  </span>
                )}
              </div>
              <p className="mt-1 flex items-center gap-1 text-sm text-base-content/60">
                <MapPin width={14} height={14} /> {supplier.district}
              </p>
              <p className="mt-2 max-w-2xl text-sm text-base-content/75">{supplier.description}</p>
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

        {/* Dải stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {stats.map((s) => (
            <div key={s.label} className="flex items-center gap-2.5 rounded-2xl bg-base-200/60 p-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                <s.icon width={18} height={18} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-base font-semibold leading-tight">{s.value}</p>
                <p className="truncate text-xs text-base-content/55">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
