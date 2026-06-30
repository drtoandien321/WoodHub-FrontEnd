import { useTranslation } from 'react-i18next';
import { MoreVertical, X } from '../suppliers/icons.jsx';

// Lấy initials từ tên NCC: "Nội thất Gia Phát" → "GP" (2 từ cuối).
const initials = (name = '') => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'NCC';
  return parts.slice(-2).map((w) => w[0]).join('').toUpperCase();
};

export default function ChatHeader({ supplier, onClose }) {
  const { t } = useTranslation();
  const name = supplier?.name || t('chat.supplierFallback');

  return (
    <header className="flex items-center gap-3 border-b border-base-300 bg-base-100 px-3 py-2.5">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-secondary to-primary font-display text-sm text-primary-content">
        {initials(name)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium leading-tight">{name}</p>
        <p className="flex items-center gap-1.5 text-xs text-base-content/55">
          <span className="inline-block h-2 w-2 rounded-full bg-success" />
          {t('chat.online')} · {t('chat.subtitle')}
        </p>
      </div>
      <button type="button" aria-label={t('chat.more')} className="btn btn-ghost btn-sm btn-circle text-base-content/50">
        <MoreVertical width={18} height={18} />
      </button>
      <button type="button" onClick={onClose} aria-label={t('chat.close')} className="btn btn-ghost btn-sm btn-circle">
        <X width={18} height={18} />
      </button>
    </header>
  );
}
