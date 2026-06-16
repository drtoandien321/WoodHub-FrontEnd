import { useTranslation } from 'react-i18next';
import { useSupplierOrders, useUpdateSupplierOrderStatus } from '../../hooks/useSupplier.js';
import { formatVnd, formatDate } from '../../utils/format.js';

const STATUS_SEQUENCE = ['processing', 'packing', 'shipping', 'completed'];
const STATUS_BADGE = {
  processing: 'badge-info',
  packing: 'badge-warning',
  shipping: 'badge-primary',
  completed: 'badge-success',
};

export default function PortalOrders() {
  const { t } = useTranslation();
  const { data, isLoading } = useSupplierOrders();
  const updateStatus = useUpdateSupplierOrderStatus();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {[...Array(3)].map((_, i) => <div key={i} className="skeleton h-40 rounded-2xl" />)}
      </div>
    );
  }

  const orders = data?.items ?? [];

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-display text-2xl md:text-3xl">{t('portal.orders.title')}</h1>

      {orders.length === 0 ? (
        <p className="text-sm text-base-content/60">{t('portal.orders.empty')}</p>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((o) => {
            // Trạng thái kế tiếp trong quy trình — null nếu đơn đã hoàn tất
            const nextStatus = STATUS_SEQUENCE[STATUS_SEQUENCE.indexOf(o.status) + 1];

            return (
              <div key={o.id} className="bg-base-200 rounded-2xl p-5 flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">{o.id}</p>
                    <p className="text-sm text-base-content/60">
                      {t('portal.orders.customer')}: {o.customerName} · {formatDate(o.createdAt)}
                    </p>
                  </div>
                  <span className={`badge ${STATUS_BADGE[o.status] ?? 'badge-neutral'}`}>{t(`orders.status.${o.status}`)}</span>
                </div>

                <div className="flex flex-col gap-2">
                  {o.items.map((i) => (
                    <div key={i.productId} className="flex gap-3 text-sm">
                      {i.image && <img src={i.image} alt={i.name} className="w-10 h-10 object-cover rounded-md" />}
                      <div className="flex-1 min-w-0">
                        <span className="line-clamp-1">{i.name}</span>
                        <span className="text-base-content/60">×{i.qty}</span>
                      </div>
                      <span className="shrink-0">{formatVnd(i.price * i.qty)}</span>
                    </div>
                  ))}
                </div>

                <ul className="steps steps-vertical lg:steps-horizontal w-full text-sm">
                  {o.timeline.map((step) => (
                    <li key={step.key} className={`step ${step.done ? 'step-primary' : ''}`}>
                      {t(`orders.status.${step.key}`)}
                    </li>
                  ))}
                </ul>

                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold text-primary">{formatVnd(o.total)}</span>
                  {nextStatus ? (
                    <button
                      onClick={() => updateStatus.mutate({ id: o.id, status: nextStatus })}
                      disabled={updateStatus.isPending}
                      className="btn btn-primary btn-sm"
                    >
                      {t('portal.orders.updateStatus', { status: t(`orders.status.${nextStatus}`) })}
                    </button>
                  ) : (
                    <span className="text-success text-sm">{t('portal.orders.completed')}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
