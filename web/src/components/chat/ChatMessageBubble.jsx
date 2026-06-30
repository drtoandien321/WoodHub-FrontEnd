import { motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Check, CheckCheck, RefreshCw } from '../suppliers/icons.jsx';

// Giờ hiển thị HH:mm theo locale VN (tin nhắn lưu ISO).
const fmtTime = (iso) => {
  try {
    return new Date(iso).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
};

/*
 * ChatMessageBubble — 1 bong bóng tin nhắn.
 * - user: phải, nền nâu nhạt (primary/10). supplier: trái, nền trắng.
 * - status (chỉ tin user): sending / sent / seen / error(nhấn gửi lại).
 */
export default function ChatMessageBubble({ message, onRetry }) {
  const { t } = useTranslation();
  const isUser = message.sender === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
    >
      <div
        className={`max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
          isUser
            ? 'rounded-br-md bg-primary/12 text-base-content'
            : 'rounded-bl-md border border-base-300 bg-base-100 text-base-content'
        }`}
      >
        {message.text}
      </div>
      <div className="mt-1 flex items-center gap-1 px-1 text-[11px] text-base-content/45">
        <span>{fmtTime(message.at)}</span>
        {isUser && message.status === 'sending' && <span>· {t('chat.status.sending')}</span>}
        {isUser && message.status === 'sent' && <Check width={13} height={13} />}
        {isUser && message.status === 'seen' && <CheckCheck width={13} height={13} className="text-info" />}
        {isUser && message.status === 'error' && (
          <button
            type="button"
            onClick={() => onRetry?.(message.id)}
            className="inline-flex items-center gap-0.5 text-error hover:underline"
          >
            <RefreshCw width={12} height={12} /> {t('chat.status.error')}
          </button>
        )}
      </div>
    </motion.div>
  );
}
