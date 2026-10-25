import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore.js';
import {
  useUnreadNotificationCount, useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, useNotificationRealtime,
} from '../../hooks/useNotifications.js';
import { notificationLink, notificationText } from '../../utils/notificationLink.js';
import { formatDate } from '../../utils/format.js';

const PREVIEW_PARAMS = { page: 0, size: 8 };

const BellIcon = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
    <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" /><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);

/*
 * NotificationBell — chuông thông báo (BE-12): badge = số chưa đọc, bấm mở danh sách 8 thông báo mới nhất.
 * Bấm 1 thông báo → đánh dấu đã đọc (POST /notifications/:id/read) rồi đi tới đúng trang (utils/notificationLink).
 * Realtime qua socket chat dùng chung (useNotificationRealtime) — có thông báo mới thì badge + danh sách tự cập nhật.
 *
 * Props: buttonClassName (kiểu nút theo nơi đặt: header site / portal / SideRail), align: 'right' | 'left-of'
 * (SideRail ở mép phải màn hình → panel mở sang trái nút).
 */
export default function NotificationBell({ buttonClassName = 'btn btn-ghost btn-sm btn-circle', align = 'right' }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useNotificationRealtime();
  const { data: unreadData } = useUnreadNotificationCount();
  const { data, isLoading, isError, refetch } = useNotifications(PREVIEW_PARAMS, { enabled: open });
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const unread = unreadData?.unread ?? 0;
  const items = data?.content ?? [];

  // Bấm ra ngoài / Esc → đóng
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [open]);

  const openItem = (n) => {
    if (!n.read) markRead.mutate(n.id);
    setOpen(false);
    navigate(notificationLink(n, user));
  };

  const panelPos = align === 'left-of' ? 'right-full top-0 mr-3' : 'right-0 top-full mt-2';

  return (
    <div ref={ref} className="relative">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-label={t('notifications.title')} aria-expanded={open} title={t('notifications.title')} className={`${buttonClassName} relative`}>
        <BellIcon className="h-5 w-5" />
        {unread > 0 && (
          <span className="pointer-events-none absolute -right-1 -top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-error px-1 text-[11px] font-semibold leading-none text-error-content tabular-nums">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className={`absolute z-50 w-80 max-w-[calc(100vw-2rem)] rounded-2xl border border-base-300 bg-base-100 shadow-xl ${panelPos}`} role="dialog" aria-label={t('notifications.title')}>
          <div className="flex items-center justify-between gap-2 border-b border-base-200 px-4 py-3">
            <p className="text-sm font-medium text-base-content">{t('notifications.title')}</p>
            {unread > 0 && (
              <button type="button" onClick={() => markAll.mutate()} disabled={markAll.isPending} className="text-xs text-primary hover:underline">
                {t('notifications.markAll')}
              </button>
            )}
          </div>
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex flex-col gap-2 p-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-12 rounded-xl" />)}</div>
            ) : isError ? (
              <p className="p-4 text-center text-sm text-error">{t('notifications.loadError')} <button type="button" onClick={() => refetch()} className="link">↻</button></p>
            ) : !items.length ? (
              <p className="py-8 text-center text-sm text-base-content/70">{t('notifications.empty')}</p>
            ) : (
              <ul>
                {items.map((n) => (
                  <li key={n.id}>
                    <button type="button" onClick={() => openItem(n)} className={`flex w-full gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-base-200 ${n.read ? 'text-base-content/70' : 'text-base-content'}`}>
                      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-transparent' : 'bg-primary'}`} aria-hidden="true" />
                      <span className="min-w-0 flex-1">
                        <span className={`block leading-snug ${n.read ? '' : 'font-medium'}`}>{notificationText(n)}</span>
                        <span className="mt-0.5 block text-xs text-base-content/70">{formatDate(n.createdAt)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button type="button" onClick={() => { setOpen(false); navigate('/notifications'); }} className="block w-full border-t border-base-200 px-4 py-2.5 text-center text-xs text-primary hover:bg-base-200">
            {t('notifications.viewAll')}
          </button>
        </div>
      )}
    </div>
  );
}
