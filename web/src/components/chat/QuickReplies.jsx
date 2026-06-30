import { useTranslation } from 'react-i18next';

// Các câu hỏi nhanh — bấm là gửi luôn. Key i18n để đổi VI/EN.
const KEYS = ['stock', 'custom', 'shipping', 'warranty'];

export default function QuickReplies({ onPick, disabled }) {
  const { t } = useTranslation();
  return (
    <div className="flex gap-2 overflow-x-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {KEYS.map((k) => {
        const label = t(`chat.quick.${k}`);
        return (
          <button
            key={k}
            type="button"
            disabled={disabled}
            onClick={() => onPick(label)}
            className="shrink-0 rounded-full border border-base-300 bg-base-100 px-3 py-1.5 text-xs text-base-content/80 transition-colors hover:border-primary hover:text-primary disabled:opacity-50"
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
