import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, CheckCheck, RefreshCw, ExternalLink } from '../suppliers/icons.jsx';
import { parseProductChatLink } from '../../utils/chatProductLink.js';

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
 * - attachmentUrl=/product/:id (xem chatProductLink.js) → hiện thẻ "đang hỏi về sản phẩm nào"
 *   thay vì bong bóng text thường, để lịch sử chat (1 hội thoại/NCC) không lẫn giữa các sản phẩm.
 */
export default function ChatMessageBubble({ message, onRetry, onNavigate, own }) {
  const { t } = useTranslation();
  // own: ép phía "của mình" (phải, nâu nhạt). Mặc định suy từ sender==='user' (khung chat khách).
  // Portal supplier truyền own={sender==='me'} để tái dùng cho phía nhà cung cấp.
  const isUser = own ?? message.sender === 'user';
  const productId = parseProductChatLink(message.attachmentUrl);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
    >
      {productId ? (
        <div
          className={`max-w-[80%] rounded-2xl border border-base-300 bg-base-100 px-3.5 py-2.5 text-sm ${
            isUser ? 'rounded-br-md' : 'rounded-bl-md'
          }`}
        >
          <p className="text-[11px] font-medium uppercase tracking-wide text-base-content/45">{t('chat.productContext')}</p>
          <p className="mt-0.5 font-medium leading-snug text-base-content">{message.text}</p>
          <Link
            to={`/product/${productId}`}
            onClick={onNavigate}
            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            {t('chat.viewProduct')} <ExternalLink width={12} height={12} />
          </Link>
        </div>
      ) : (
        <div
          className={`max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
            isUser
              ? 'rounded-br-md bg-primary/12 text-base-content'
              : 'rounded-bl-md border border-base-300 bg-base-100 text-base-content'
          }`}
        >
          {message.text}
        </div>
      )}
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
