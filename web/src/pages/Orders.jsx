import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useOrders } from '../hooks/useProducts.js';
import { formatVnd, formatDate } from '../utils/format.js';
import EmptyState from '../components/ui/EmptyState.jsx';

export default function Orders() {
  const { t } = useTranslation();
  const { data, isLoading } = useOrders();

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto flex flex-col gap-4">
        <h1 className="font-display text-3xl">{t('orders.title')}</h1>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="skeleton h-32 w-full rounded-2xl"></div>
        ))}
      </div>
    );
  }

  const orders = data?.items || [];

  if (orders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="font-display text-3xl mb-8">{t('orders.title')}</h1>
        <EmptyState
          title={t('orders.empty')}
          hint={t('orders.empty')}
          ctaLabel={t('orders.backToShop')}
          ctaTo="/shop"
        />
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'processing': return 'badge-info';
      case 'packing': return 'badge-warning';
      case 'shipping': return 'badge-primary';
      case 'completed': return 'badge-success';
      default: return 'badge-neutral';
    }
  };

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6">
      <h1 className="font-display text-3xl">{t('orders.title')}</h1>
      
      <div className="flex flex-col gap-4">
        {orders.map((order) => (
          <Link
            key={order.id}
            to={`/orders/${order.id}`}
            className="flex flex-col sm:flex-row gap-4 bg-base-200 rounded-2xl p-5 hover:bg-base-300 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-medium">{t('orders.id', { id: order.id })}</span>
                <span className={`badge ${getStatusColor(order.status)}`}>
                  {t(`orders.status.${order.status}`)}
                </span>
              </div>
              <p className="text-sm text-base-content/70">
                {t('orders.date', { date: formatDate(order.createdAt) })}
              </p>
              <p className="text-sm text-base-content/70 mt-1">
                {t('orders.itemsCount', { count: order.items.length })}
              </p>
            </div>
            
            <div className="flex flex-col sm:items-end justify-center">
              <span className="text-sm text-base-content/70">{t('orders.total', { total: '' })}</span>
              <span className="font-semibold text-lg text-primary">{formatVnd(order.total)}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
