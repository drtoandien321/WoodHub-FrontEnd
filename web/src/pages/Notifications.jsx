import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../api/client.js';
import { useAuthStore } from '../stores/authStore.js';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead } from '../hooks/useNotifications.js';
import { notificationLink, notificationText } from '../utils/notificationLink.js';
import { formatDate } from '../utils/format.js';

const PAGE_SIZE = 20;

/*
 * /notifications — danh sách đầy đủ (lọc Chưa đọc / Tất cả, xem thêm).
 * /notifications/:id — link trong EMAIL thông báo (BE-14 §3): đánh dấu đã đọc rồi chuyển tới đúng trang. BE không có
 * GET 1 thông báo theo id → POST /read trả về chính thông báo đó (có targetType/targetId) để tính link.
 * Dùng chung 1 component vì cùng nguồn dữ liệu; route nằm trong ProtectedRoute (email mở khi chưa đăng nhập →
 * đăng nhập xong quay lại đúng link).
 */
export default function Notifications() {
  const { id } = useParams();
  return id ? <OpenNotification id={id} /> : <NotificationList />;
}

function OpenNotification({ id }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [failed, setFailed] = useState(false);
  const started = useRef(false); // StrictMode chạy effect 2 lần → chỉ gọi API 1 lần

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    api.markNotificationRead(id)
      .then((n) => (n ? navigate(notificationLink(n, user), { replace: true }) : setFailed(true)))
      .catch(() => setFailed(true));
  }, [id, navigate, user]);

  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-20 text-center">
      {failed ? (
        <>
          <p className="text-base-content/70">{t('notifications.notFound')}</p>
          <div className="flex gap-2">
            <Link to="/notifications" className="btn btn-primary btn-sm">{t('notifications.viewAll')}</Link>
            <Link to="/" className="btn btn-ghost btn-sm">{t('notifications.backHome')}</Link>
          </div>
        </>
      ) : (
        <><span className="loading loading-spinner loading-md text-primary" /><p className="text-sm text-base-content/70">{t('notifications.opening')}</p></>
      )}
    </div>
  );
}

function NotificationList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [size, setSize] = useState(PAGE_SIZE);
  const { data, isLoading, isError, refetch } = useNotifications({ unread: unreadOnly || undefined, page: 0, size });
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();
  const items = data?.content ?? [];
  const total = data?.page?.totalElements ?? items.length;

  const open = (n) => {
    if (!n.read) markRead.mutate(n.id);
    navigate(notificationLink(n, user));
  };

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-3xl">{t('notifications.pageTitle')}</h1>
        <button type="button" onClick={() => markAll.mutate()} disabled={markAll.isPending} className="btn btn-ghost btn-sm">{t('notifications.markAll')}</button>
      </header>
      <div className="inline-flex w-fit gap-1 rounded-2xl border border-base-300 bg-base-100 p-1">
        {[[false, t('notifications.all')], [true, t('notifications.unreadOnly')]].map(([v, l]) => (
          <button key={String(v)} type="button" onClick={() => { setUnreadOnly(v); setSize(PAGE_SIZE); }} className={`rounded-xl px-4 py-1.5 text-sm ${unreadOnly === v ? 'bg-primary text-primary-content' : 'text-base-content/70 hover:bg-base-200'}`}>{l}</button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-2">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-16 rounded-2xl" />)}</div>
      ) : isError ? (
        <p className="text-center text-error">{t('notifications.loadError')} <button type="button" onClick={() => refetch()} className="link">↻</button></p>
      ) : !items.length ? (
        <p className="rounded-2xl border border-dashed border-base-300 bg-base-100 py-12 text-center text-base-content/70">{t('notifications.empty')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((n) => (
            <li key={n.id}>
              <button type="button" onClick={() => open(n)} className={`flex w-full gap-3 rounded-2xl border bg-base-100 p-4 text-left transition-colors hover:border-primary/50 ${n.read ? 'border-base-300 text-base-content/70' : 'border-primary/30'}`}>
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-transparent' : 'bg-primary'}`} aria-hidden="true" />
                <span className="min-w-0 flex-1">
                  <span className={`block text-sm ${n.read ? '' : 'font-medium'}`}>{notificationText(n)}</span>
                  <span className="mt-0.5 block text-xs text-base-content/70">{formatDate(n.createdAt)}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {items.length < total && (
        <button type="button" onClick={() => setSize((s) => s + PAGE_SIZE)} className="btn btn-ghost btn-sm self-center">{t('notifications.loadMore')}</button>
      )}
    </div>
  );
}
