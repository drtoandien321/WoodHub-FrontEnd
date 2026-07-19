import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCustomOrderDetail, useUpdateCustomOrderStatus } from '../hooks/useQuotes.js';
import { useAuthStore } from '../stores/authStore.js';
import { customOrderMeta, NEXT_ORDER_STATUS } from '../utils/quoteStatus.js';
import { ai3dErrorKey } from '../utils/ai3dErrors.js';
import StatusBadge from '../components/supplier/StatusBadge.jsx';
import { formatVnd } from '../utils/format.js';

const STATUS_ACTION_LABEL = { confirmed: 'order.actionConfirm', in_production: 'order.actionStart', completed: 'order.actionComplete', cancelled: 'order.actionCancel' };

/*
 * Chi tiết 1 đơn custom (BE-8, FE-6) — DÙNG CHUNG customer/workshop, GET /custom-orders/:id trả
 * đủ history[]. Nút đổi trạng thái chỉ hiện đúng bước hợp lệ + đúng vai (NEXT_ORDER_STATUS +
 * be-8-state-machine.md mục 3) — sai vai/sai bước thì BE tự 403/409, nút ẩn sẵn để UX rõ ràng.
 */
export default function CustomOrderDetail() {
  const { id } = useParams();
  const { t } = useTranslation();
  const me = useAuthStore((s) => s.user);
  const { data: order, isLoading, isError, refetch } = useCustomOrderDetail(id);
  const updateStatus = useUpdateCustomOrderStatus();
  const [note, setNote] = useState('');

  if (isLoading) return <div className="skeleton h-64 max-w-3xl rounded-3xl" />;
  if (isError || !order) {
    return (
      <div className="rounded-3xl border border-dashed border-base-300 bg-base-100 py-20 text-center">
        <p className="font-display text-2xl">{t('order.notFound')}</p>
        <button onClick={() => refetch()} className="btn btn-outline btn-sm mt-3 border-base-300">{t('shop.retry')}</button>
      </div>
    );
  }

  const myRole = me?.id === order.customerId ? 'customer' : 'workshop';
  const otherPartyName = myRole === 'customer' ? order.workshopName : order.customerName;
  const nextStatuses = NEXT_ORDER_STATUS[order.status] ?? [];
  // Customer chỉ được cancel khi còn 'pending'; workshop/admin làm mọi bước còn lại (BE tự chặn nếu sai)
  const visibleActions = nextStatuses.filter((s) => myRole !== 'customer' || (s === 'cancelled' && order.status === 'pending'));

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <Link to={myRole === 'customer' ? '/custom-orders' : '/portal/workshop/production'} className="text-sm text-base-content/55 hover:text-primary">← {t('order.myOrdersTitle')}</Link>
        <div className="mt-1 flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl">{otherPartyName}</h1>
          <StatusBadge meta={customOrderMeta(order.status)} />
        </div>
        <p className="mt-1 font-mono text-sm text-base-content/50">{order.orderNumber}</p>
      </div>

      <div className="rounded-3xl border border-base-300 bg-base-100 p-5 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          {order.designSnapshot?.thumbnailUrl && <img src={order.designSnapshot.thumbnailUrl} alt="" className="h-24 w-24 shrink-0 rounded-2xl object-cover" />}
          <div className="grid flex-1 grid-cols-2 gap-3 text-sm sm:grid-cols-3">
            <div><p className="text-base-content/50">{t('quote.quantity')}</p><p className="font-medium">{order.quantity}</p></div>
            <div><p className="text-base-content/50">{t('quote.price')}</p><p className="font-medium">{formatVnd(order.unitPrice)}</p></div>
            <div><p className="text-base-content/50">{t('order.total')}</p><p className="font-semibold text-primary">{formatVnd(order.totalAmount)}</p></div>
            <div><p className="text-base-content/50">{t('quote.leadTimeDays')}</p><p className="font-medium">{order.leadTimeDays}</p></div>
            {order.location && <div><p className="text-base-content/50">{t('quote.location')}</p><p className="font-medium">{order.location}</p></div>}
          </div>
        </div>
        {order.note && <p className="mt-3 rounded-xl bg-base-200/60 p-3 text-sm text-base-content/70">{order.note}</p>}
      </div>

      {/* Đổi trạng thái */}
      {visibleActions.length > 0 && (
        <div className="flex flex-col gap-3 rounded-3xl border border-base-300 bg-base-100 p-5">
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={2} placeholder={t('order.notePlaceholder')} className="textarea textarea-bordered rounded-xl" />
          {updateStatus.isError && <p className="text-sm text-error">{t(ai3dErrorKey(updateStatus.error))}</p>}
          <div className="flex flex-wrap gap-2">
            {visibleActions.map((s) => (
              <button
                key={s}
                onClick={() => updateStatus.mutate({ id, status: s, note: note || undefined }, { onSuccess: () => setNote('') })}
                disabled={updateStatus.isPending}
                className={`btn btn-sm ${s === 'cancelled' ? 'btn-outline btn-error' : 'btn-primary'}`}
              >
                {t(STATUS_ACTION_LABEL[s])}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lịch sử trạng thái */}
      <div>
        <h2 className="mb-3 font-display text-xl">{t('order.historyTitle')}</h2>
        <ol className="flex flex-col gap-2">
          {[...(order.history ?? [])].reverse().map((h) => (
            <li key={h.id} className="flex items-start gap-3 rounded-xl border border-base-300 bg-base-100 p-3 text-sm">
              <StatusBadge meta={customOrderMeta(h.toStatus)} />
              <div className="min-w-0 flex-1">
                <p className="text-base-content/60">{new Date(h.createdAt).toLocaleString('vi-VN')} · {t(`order.role.${h.changedByRole}`)}</p>
                {h.note && <p className="mt-0.5">{h.note}</p>}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
