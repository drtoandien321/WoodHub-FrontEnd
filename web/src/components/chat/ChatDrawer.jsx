import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useSupplierChatStore } from '../../stores/supplierChatStore.js';
import { useAuthStore } from '../../stores/authStore.js';
import ChatHeader from './ChatHeader.jsx';
import ChatProductCard from './ChatProductCard.jsx';
import ChatMessageBubble from './ChatMessageBubble.jsx';
import QuickReplies from './QuickReplies.jsx';
import ChatInput from './ChatInput.jsx';
import { MessageCircle } from '../suppliers/icons.jsx';

/*
 * ChatDrawer — khung chat với NHÀ CUNG CẤP, mount global (cạnh AI ChatWidget trong App.jsx).
 * Mở/đóng qua useSupplierChatStore (openFromProduct / openFromSupplier / close).
 *
 * - Desktop: drawer cố định bên phải (w-[420px], full height), trang sau vẫn thấy (không overlay đặc).
 * - Mobile: full-screen + backdrop mờ (đóng khi chạm nền).
 * - Chưa đăng nhập: hiện trạng thái yêu cầu đăng nhập, không crash, input bị khoá.
 */
export default function ChatDrawer() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    isOpen, context, conversations, typing, showProductCard,
    close, send, retry, toggleProductCard,
  } = useSupplierChatStore();

  const supplier = context?.supplier;
  const product = context?.product;
  const messages = (supplier && conversations[supplier.id]) || [];
  const hasUserMsg = messages.some((m) => m.sender === 'user');

  const scrollRef = useRef(null);
  // Auto-scroll xuống tin mới nhất mỗi khi có thêm tin / NCC đang nhập.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, typing, isOpen]);

  // ESC để đóng (accessibility).
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, close]);

  const goLogin = () => { close(); navigate('/login'); };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop chỉ trên mobile */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-[60] bg-black/30 sm:hidden"
            aria-hidden="true"
          />

          <motion.aside
            role="dialog"
            aria-label={t('chat.subtitle')}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.28, ease: 'easeOut' }}
            className="fixed inset-0 z-[61] flex flex-col bg-base-200 shadow-2xl sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[420px] sm:border-l sm:border-base-300"
          >
            <ChatHeader supplier={supplier} onClose={close} />

            {product && showProductCard && (
              <ChatProductCard product={product} onHide={toggleProductCard} onNavigate={close} />
            )}

            {/* Vùng tin nhắn (scroll) */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2">
              {/* Empty state / gợi ý khi chưa có tin của khách */}
              {!hasUserMsg && (
                <div className="mx-1 my-3 rounded-2xl border border-dashed border-base-300 bg-base-100/60 p-4 text-center text-sm text-base-content/60">
                  <p className="font-medium text-base-content/75">
                    {t('chat.emptyTitle', { name: supplier?.name || t('chat.supplierFallback') })}
                  </p>
                  <p className="mt-1">{product ? t('chat.emptyHintProduct') : t('chat.emptyHint')}</p>
                </div>
              )}

              <div className="flex flex-col gap-3 py-1">
                {messages.map((m) => (
                  <ChatMessageBubble key={m.id} message={m} onRetry={retry} />
                ))}

                {typing && (
                  <div className="flex items-center gap-1.5 px-1 text-xs text-base-content/50">
                    <span className="flex gap-1">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-base-content/40 [animation-delay:-200ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-base-content/40 [animation-delay:-100ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-base-content/40" />
                    </span>
                    {t('chat.typing')}
                  </div>
                )}
              </div>
            </div>

            {/* Khoá nhập khi chưa đăng nhập */}
            {user ? (
              <>
                <QuickReplies onPick={send} disabled={!supplier} />
                <ChatInput onSend={send} disabled={!supplier} autoFocus />
              </>
            ) : (
              <div className="border-t border-base-300 bg-base-100 p-4 text-center">
                <div className="mx-auto mb-2 grid h-10 w-10 place-items-center rounded-full bg-base-200 text-primary">
                  <MessageCircle width={20} height={20} />
                </div>
                <p className="text-sm text-base-content/70">{t('chat.loginRequired')}</p>
                <button onClick={goLogin} className="btn btn-primary btn-sm mt-3">{t('chat.login')}</button>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
