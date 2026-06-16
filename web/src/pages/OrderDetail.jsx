import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useOrder } from '../hooks/useProducts.js';
import { formatVnd } from '../utils/format.js';
import EmptyState from '../components/ui/EmptyState.jsx';

export default function OrderDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { data: order, isLoading, isError } = useOrder(id);

  if (isLoading) return <div className="skeleton h-64 rounded-2xl max-w-2xl mx-auto" />;
  if (isError || !order) return (
    <div className="max-w-2xl mx-auto">
      <EmptyState title={t('orders.notFound')} hint={t('orders.notFound')} ctaLabel={t('orders.backToShop')} ctaTo="/shop" />
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Link to="/orders" className="btn btn-circle btn-ghost btn-sm">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
        </Link>
        <h1 className="font-display text-2xl">{t('orders.detailTitle')}</h1>
        <span className="badge badge-primary">{t(`orders.status.${order.status}`)}</span>
      </div>

      <div className="bg-base-200 rounded-2xl p-6 flex flex-col gap-8">
        {/* Timeline */}
        <div>
          <h2 className="font-medium mb-4">{t('orders.timeline')}</h2>
          <ul className="steps steps-vertical lg:steps-horizontal w-full text-sm">
            {order.timeline.map((step) => (
              <li key={step.key} className={`step ${step.done ? 'step-primary' : ''}`}>
                {t(`orders.status.${step.key}`)}
              </li>
            ))}
          </ul>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="flex flex-col gap-2 text-sm">
            <h2 className="font-medium text-base mb-1">{t('orders.shippingInfo')}</h2>
            <p><span className="text-base-content/60">{t('checkout.fullName')}:</span> {order.shippingAddress?.fullName}</p>
            <p><span className="text-base-content/60">{t('checkout.phone')}:</span> {order.shippingAddress?.phone}</p>
            <p><span className="text-base-content/60">{t('checkout.address')}:</span> {order.shippingAddress?.address}, {order.shippingAddress?.city}</p>
          </div>

          <div className="flex flex-col gap-2 text-sm">
            <h2 className="font-medium text-base mb-1">{t('orders.paymentMethod')}</h2>
            <p>{t(`checkout.${order.paymentMethod}`)}</p>
          </div>
        </div>

        <div>
          <h2 className="font-medium text-base mb-3">{t('checkout.orderSummary')}</h2>
          <div className="flex flex-col gap-2">
            {order.items.map((i) => (
              <div key={i.productId} className="flex gap-3 text-sm">
                {i.image && <img src={i.image} alt={i.name} className="w-12 h-12 object-cover rounded-md" />}
                <div className="flex-1 min-w-0">
                  <span className="line-clamp-1">{i.name}</span>
                  <span className="text-base-content/60">×{i.qty}</span>
                </div>
                <span className="shrink-0">{formatVnd(i.price * i.qty)}</span>
              </div>
            ))}
          </div>
          
          <div className="divider my-3" />
          
          <div className="flex justify-between text-sm"><span>{t('checkout.subtotal')}</span><span>{formatVnd(order.subtotal || 0)}</span></div>
          <div className="flex justify-between text-sm"><span>{t('checkout.shippingFee')}</span><span>{(order.shippingFee || 0) === 0 ? t('checkout.freeShipping') : formatVnd(order.shippingFee)}</span></div>
          <div className="divider my-2" />
          <div className="flex justify-between font-semibold text-lg"><span>{t('checkout.total')}</span><span className="text-primary">{formatVnd(order.total)}</span></div>
        </div>
      </div>
    </div>
  );
}
