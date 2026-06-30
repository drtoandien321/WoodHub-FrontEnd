import { useTranslation } from 'react-i18next';
import { usePortalChatStore } from '../../stores/portalChatStore.js';
import { MessageCircle } from '../suppliers/icons.jsx';

/*
 * PortalChatButton — nút "Chat với khách hàng" trên topbar Supplier Portal.
 * Badge số tin chưa đọc. Bấm → mở PortalChatDrawer.
 */
export default function PortalChatButton() {
  const { t } = useTranslation();
  const open = usePortalChatStore((s) => s.open);
  const unread = usePortalChatStore((s) => s.threads.reduce((n, th) => n + (th.unread || 0), 0));

  return (
    <button
      type="button"
      onClick={open}
      aria-label={t('portal.chat.openLabel')}
      className="btn btn-ghost btn-sm gap-2"
    >
      <span className="relative">
        <MessageCircle width={18} height={18} />
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-error px-1 text-[10px] font-medium leading-none text-error-content">
            {unread}
          </span>
        )}
      </span>
      <span className="hidden md:inline">{t('portal.chat.openLabel')}</span>
    </button>
  );
}
