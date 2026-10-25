import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNotificationSettings, useUpdateNotificationSettings } from '../../hooks/useSupplierPortal.js';
import { useAuthStore } from '../../stores/authStore.js';

/*
 * NotificationSettingsCard — bật/tắt EMAIL theo từng loại thông báo (BE-14 §2). Thông báo trong app (chuông) luôn bật.
 *
 * BE luôn trả đủ mọi loại (18) cho mọi tài khoản → FE lọc theo vai trò (bảng "Hiện cho" ở docs BE §2.3) để NCC không
 * thấy công tắc dành cho khách và ngược lại. Mỗi công tắc lưu ngay (PUT chỉ gửi loại vừa đổi).
 */
const AUDIENCE = {
  ORDER_PAID: ['retailer'],
  QUOTE_NEW: ['workshop'],
  QUOTE_OFFER_ACCEPTED: ['workshop', 'customer'],
  CUSTOM_ORDER_DEPOSIT_PAID: ['workshop'],
  CUSTOM_ORDER_FINAL_PAID: ['workshop'],
  CUSTOM_ORDER_PAYMENT_REQUESTED: ['customer'],
  ORDER_STATUS_CHANGED: ['customer'],
  QUOTE_OFFER: ['workshop', 'customer'],
  QUOTE_OFFER_REJECTED: ['workshop', 'customer'],
  CUSTOM_ORDER_STATUS_CHANGED: ['workshop', 'customer'],
  REVIEW_NEW: ['retailer', 'workshop'],
  REVIEW_REPLIED: ['customer'],
  BULK_QUOTE_NEW: ['retailer'],
  BULK_QUOTE_ACCEPTED: ['retailer'],
  BULK_QUOTE_OFFERED: ['business'],
  ORDER_VAT_ISSUED: ['business'],
  BULK_QUOTE_REJECTED: ['retailer', 'business'],
  ORDER_REFUNDED: ['customer'],
  CUSTOM_ORDER_REFUNDED: ['customer'],
  ADMIN_REFUND_REQUIRED: ['admin'], // card này không dùng cho admin → không hiện cho NCC / khách
};

// Vai trò "hiển thị" của tài khoản: NCC bán lẻ | xưởng | khách (khách doanh nghiệp thấy thêm loại business)
const audiencesOf = (user) => {
  if (user?.role === 'supplier') return [user.supplierType === 'workshop' ? 'workshop' : 'retailer'];
  if (user?.role === 'customer') return user.customerType === 'business' ? ['customer', 'business'] : ['customer'];
  return [];
};

export default function NotificationSettingsCard() {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const { data, isLoading, isError, refetch } = useNotificationSettings();
  const update = useUpdateNotificationSettings();
  const mine = audiencesOf(user);
  // Loại BE mới thêm mà FE chưa biết → vẫn hiện (không giấu mất công tắc), nhãn = mã loại
  const items = (data?.email ?? []).filter((s) => !AUDIENCE[s.type] || AUDIENCE[s.type].some((a) => mine.includes(a)));
  const busyType = update.isPending ? Object.keys(update.variables ?? {})[0] : null;

  // Link /profile#notifications (từ email, qua /settings/notifications): React Router không tự cuộn tới hash
  useEffect(() => {
    if (!isLoading && window.location.hash === '#notifications') {
      document.getElementById('notifications')?.scrollIntoView({ block: 'start' });
    }
  }, [isLoading]);

  return (
    <section id="notifications" className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
      <h2 className="mb-1 font-display text-lg">{t('notifSettings.title')}</h2>
      <p className="mb-4 text-xs text-base-content/70">{t('notifSettings.subtitle')}</p>
      {isLoading ? (
        <div className="flex flex-col gap-2">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-12 rounded-xl" />)}</div>
      ) : isError ? (
        <p className="text-sm text-error">{t('notifSettings.loadError')} <button type="button" onClick={() => refetch()} className="link">{t('notifSettings.retry')}</button></p>
      ) : (
        <ul className="flex flex-col divide-y divide-base-200">
          {items.map((s) => (
            <li key={s.type} className="flex items-center justify-between gap-4 py-3">
              <span className="min-w-0 text-sm">
                <span className="block font-medium">{t(`notifSettings.types.${s.type}.label`, { defaultValue: s.type })}</span>
                <span className="block text-xs text-base-content/70">
                  {t(`notifSettings.types.${s.type}.desc`, { defaultValue: '' })}
                  {s.type === 'ORDER_PAID' && <span className="text-warning"> {t('notifSettings.orderPaidTip')}</span>}
                </span>
              </span>
              <input
                type="checkbox"
                className="toggle toggle-primary toggle-sm shrink-0"
                checked={s.enabled}
                disabled={busyType === s.type}
                onChange={(e) => update.mutate({ [s.type]: e.target.checked })}
                aria-label={t(`notifSettings.types.${s.type}.label`, { defaultValue: s.type })}
              />
            </li>
          ))}
        </ul>
      )}
      {update.isError && <p className="mt-2 text-sm text-error">{t('notifSettings.saveError')}</p>}
    </section>
  );
}
