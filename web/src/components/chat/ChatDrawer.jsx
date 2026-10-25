import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useSupplierChatStore } from '../../stores/supplierChatStore.js';
import { useChatStore } from '../../stores/chatStore.js';
import { useAuthStore } from '../../stores/authStore.js';
import ChatHeader, { initials } from './ChatHeader.jsx';
import ChatProductCard from './ChatProductCard.jsx';
import ChatMessageBubble from './ChatMessageBubble.jsx';
import QuickReplies from './QuickReplies.jsx';
import ChatInput from './ChatInput.jsx';
import { MessageCircle, X } from '../suppliers/icons.jsx';

// Các trang xác thực — không hiện khung/bong bóng chat (cùng danh sách ẩn với nút AI ở ChatWidget)
const AUTH_PATHS = ['/login', '/register', '/verify-otp', '/forgot-password', '/reset-password', '/change-password'];

/*
 * MinimizedChatBubble — khung chat NCC khi THU NHỎ: bong bóng nổi góc phải, ngay TRÊN nút AI chatbot.
 * Cố tình khác nút AI (tròn, màu primary, icon chat): đây là ô bo góc vuông, nền gradient gỗ, chữ viết
 * tắt tên NCC + chấm "đang chat" → khách phân biệt được "chat với người bán" và "trợ lý AI".
 * Bấm = mở lại đúng cuộc trò chuyện; nút × nhỏ = đóng hẳn. Badge đỏ = số tin NCC gửi lúc đang thu nhỏ.
 */
function MinimizedChatBubble({ supplier, unread, onRestore, onClose }) {
  const { t } = useTranslation();
  const name = supplier?.name || t('chat.supplierFallback');
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.6, y: 12 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.6, y: 12 }}
      transition={{ type: 'spring', stiffness: 380, damping: 26 }}
      // bottom = 24 (lề) + 56 (nút AI) + 12 (khoảng cách) → không đè nút AI ở vị trí mặc định
      className="group fixed bottom-[92px] right-6 z-[70]"
    >
      <button
        type="button"
        onClick={onRestore}
        aria-label={t('chat.restore', { name })}
        title={t('chat.restore', { name })}
        className="relative grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-secondary to-primary font-display text-base text-primary-content shadow-xl ring-2 ring-base-100 transition-transform hover:scale-105 active:scale-95"
      >
        {initials(name)}
        {/* Chấm xanh = đang có cuộc trò chuyện mở */}
        <span className="absolute -bottom-0.5 -left-0.5 h-3.5 w-3.5 rounded-full border-2 border-base-100 bg-success" aria-hidden="true" />
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-error px-1 text-[11px] font-semibold text-error-content tabular-nums">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {/* Nút đóng hẳn — chỉ hiện khi rê chuột (desktop) / luôn hiện mờ trên mobile */}
      <button
        type="button"
        onClick={onClose}
        aria-label={t('chat.close')}
        className="absolute -left-2 -top-2 grid h-6 w-6 place-items-center rounded-full border border-base-300 bg-base-100 text-base-content/70 shadow transition-opacity hover:text-error sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
      >
        <X width={12} height={12} />
      </button>
    </motion.div>
  );
}

/*
 * ChatDrawer — khung chat với NHÀ CUNG CẤP, mount global (cạnh AI ChatWidget trong App.jsx).
 * Mở/đóng qua useSupplierChatStore (openFromProduct / openFromSupplier / minimize / restore / close).
 *
 * - Desktop: CỬA SỔ NỔI góc phải dưới (380px × tối đa 600px, kiểu Messenger) — trước đây là drawer cao
 *   full màn hình 420px, che mất nửa trang sản phẩm. Thu nhỏ (—) → bong bóng MinimizedChatBubble.
 * - Mobile: full-screen + backdrop mờ (chạm nền = thu nhỏ, không mất cuộc trò chuyện).
 * - ESC = thu nhỏ. Bấm link sản phẩm trong chat = thu nhỏ để khách xem trang rồi quay lại chat.
 * - Chưa đăng nhập: hiện trạng thái yêu cầu đăng nhập, không crash, input bị khoá.
 */
export default function ChatDrawer() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthStore();
  const {
    isOpen, minimized, unread, context, conversations, typing, showProductCard,
    close, minimize, restore, send, retry, toggleProductCard,
  } = useSupplierChatStore();
  // Panel AI chatbot đang mở → ẩn tạm bong bóng NCC (cùng góc phải dưới, tránh đè lên panel AI)
  const aiPanelOpen = useChatStore((s) => s.isOpen);

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

  // ESC = thu nhỏ (accessibility) — nhẹ tay hơn đóng hẳn, khách không mất cuộc trò chuyện đang dở.
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') minimize(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, minimize]);

  // Đăng nhập từ khung chat: THU NHỎ (không đóng) + nhớ trang hiện tại → login xong quay lại đúng
  // trang sản phẩm và bấm bong bóng là chat tiếp được. Bản cũ close() + navigate('/login') nên về trang chủ.
  const goLogin = () => { minimize(); navigate('/login', { state: { from: location } }); };

  // Trang đăng nhập/đăng ký/OTP: KHÔNG render khung chat (bản cũ để khung chat nổi đè lên form đăng nhập
  // khi khách bị chuyển sang /login từ nút "Thêm vào giỏ"). State vẫn giữ, rời trang là hiện lại.
  if (AUTH_PATHS.some((p) => location.pathname.startsWith(p))) return null;

  return (
    <>
    {/* 2 AnimatePresence riêng: bong bóng và cửa sổ chat có hiệu ứng vào/ra độc lập */}
    <AnimatePresence>
      {minimized && !isOpen && !aiPanelOpen && supplier && (
        <MinimizedChatBubble key="bubble" supplier={supplier} unread={unread} onRestore={restore} onClose={close} />
      )}
    </AnimatePresence>
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop chỉ trên mobile — chạm nền = thu nhỏ */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={minimize}
            className="fixed inset-0 z-[60] bg-black/30 sm:hidden"
            aria-hidden="true"
          />

          <motion.aside
            key="panel"
            role="dialog"
            aria-label={t('chat.subtitle')}
            // Mobile trượt từ dưới lên; desktop "bật" ra từ góc phải dưới (origin-bottom-right)
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: 'tween', duration: 0.22, ease: 'easeOut' }}
            className="fixed inset-0 z-[61] flex origin-bottom-right flex-col overflow-hidden bg-base-200 shadow-2xl
                       sm:inset-auto sm:bottom-6 sm:right-6 sm:h-[min(600px,calc(100dvh-3rem))] sm:w-[380px]
                       sm:rounded-2xl sm:border sm:border-base-300"
          >
            <ChatHeader supplier={supplier} onClose={close} onMinimize={minimize} />

            {product && showProductCard && (
              <ChatProductCard product={product} onHide={toggleProductCard} onNavigate={minimize} />
            )}

            {/* Vùng tin nhắn (scroll) */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2">
              {/* Empty state / gợi ý khi chưa có tin của khách */}
              {!hasUserMsg && (
                <div className="mx-1 my-3 rounded-2xl border border-dashed border-base-300 bg-base-100/60 p-4 text-center text-sm text-base-content/70">
                  <p className="font-medium text-base-content/75">
                    {t('chat.emptyTitle', { name: supplier?.name || t('chat.supplierFallback') })}
                  </p>
                  <p className="mt-1">{product ? t('chat.emptyHintProduct') : t('chat.emptyHint')}</p>
                </div>
              )}

              <div className="flex flex-col gap-3 py-1">
                {messages.map((m) => (
                  <ChatMessageBubble key={m.id} message={m} onRetry={retry} onNavigate={minimize} />
                ))}

                {typing && (
                  <div className="flex items-center gap-1.5 px-1 text-xs text-base-content/70">
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
    </>
  );
}
