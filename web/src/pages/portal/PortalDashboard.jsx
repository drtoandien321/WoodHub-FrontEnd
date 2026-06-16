import { useTranslation } from 'react-i18next';
import { useDashboardStats } from '../../hooks/useSupplier.js';
import { formatVnd, formatDate } from '../../utils/format.js';

const STATUS_BADGE = {
  processing: 'badge-info',
  packing: 'badge-warning',
  shipping: 'badge-primary',
  completed: 'badge-success',
};

export default function PortalDashboard() {
  const { t } = useTranslation();
  const { data, isLoading } = useDashboardStats();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}
        </div>
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  const { newOrders, monthlyRevenue, pendingQuotes, topProducts, recentOrders } = data;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl md:text-3xl">{t('portal.dashboard.title')}</h1>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-base-200 rounded-2xl p-5">
          <p className="text-sm text-base-content/60">{t('portal.dashboard.newOrders')}</p>
          <p className="text-2xl font-semibold mt-1">{newOrders}</p>
        </div>
        <div className="bg-base-200 rounded-2xl p-5">
          <p className="text-sm text-base-content/60">{t('portal.dashboard.monthlyRevenue')}</p>
          <p className="text-2xl font-semibold mt-1 text-primary">{formatVnd(monthlyRevenue)}</p>
        </div>
        <div className="bg-base-200 rounded-2xl p-5">
          <p className="text-sm text-base-content/60">{t('portal.dashboard.pendingQuotes')}</p>
          <p className="text-2xl font-semibold mt-1">{pendingQuotes}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Top sản phẩm bán chạy */}
        <div className="bg-base-200 rounded-2xl p-5">
          <h2 className="font-medium mb-4">{t('portal.dashboard.topProducts')}</h2>
          <div className="flex flex-col gap-3">
            {topProducts.map((p) => (
              <div key={p.id} className="flex items-center gap-3">
                <img src={p.image} alt={p.name} className="w-12 h-12 object-cover rounded-md shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm line-clamp-1">{p.name}</p>
                  <p className="text-xs text-base-content/60">{t('portal.dashboard.soldCount', { count: p.sold ?? 0 })}</p>
                </div>
                <span className="text-sm shrink-0">{formatVnd(p.price)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Đơn hàng gần đây */}
        <div className="bg-base-200 rounded-2xl p-5">
          <h2 className="font-medium mb-4">{t('portal.dashboard.recentOrders')}</h2>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-base-content/60">{t('portal.dashboard.noOrders')}</p>
          ) : (
            <div className="flex flex-col gap-3">
              {recentOrders.map((o) => (
                <div key={o.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-clamp-1">{o.customerName}</p>
                    <p className="text-xs text-base-content/60">{formatDate(o.createdAt)}</p>
                  </div>
                  <span className={`badge ${STATUS_BADGE[o.status] ?? 'badge-neutral'}`}>{t(`orders.status.${o.status}`)}</span>
                  <span className="text-sm shrink-0">{formatVnd(o.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
