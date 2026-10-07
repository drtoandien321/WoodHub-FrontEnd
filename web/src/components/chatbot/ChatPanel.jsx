import { useState, useRef, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { useChatStore } from '../../stores/chatStore.js';
import { useAuthStore } from '../../stores/authStore.js';
import { useLocationStore } from '../../stores/locationStore.js';
import { useAiChatMessages, useCreateAiChatSession, useMyAiChatSessions, useSendAiChatMessage } from '../../hooks/useAiChat.js';
import { formatVnd, formatDate } from '../../utils/format.js';

/* Icon inline (không thêm thư viện) */
const SendIcon = (p) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 19V5M5 12l7-7 7 7" /></svg>
);
const CloseIcon = (p) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M18 6 6 18M6 6l12 12" /></svg>
);
const BotIcon = (p) => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="8" width="18" height="12" rx="3" /><path d="M12 8V4M8 3h8M8.5 13h.01M15.5 13h.01" /></svg>
);
const HistoryIcon = (p) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5M12 7v5l3 2" /></svg>
);
const BackIcon = (p) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M15 18l-6-6 6-6" /></svg>
);
const NewChatIcon = (p) => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 5v14M5 12h14" /></svg>
);

// Map mã lỗi HTTP của luồng AI chat → key i18n (429 hết lượt / 502 AI provider chưa nối / khác)
const chatErrorKey = (error) => {
  const status = error?.response?.status;
  if (status === 429) return 'chatbot.errors.quota';
  if (status === 502) return 'chatbot.errors.aiDown';
  if (!status && (error?.code === 'ECONNABORTED' || error?.code === 'ERR_NETWORK')) return 'chatbot.errors.timeout'; // không có response: quá thời gian / mất mạng
  if (status === 401 || status === 403) return 'chatbot.errors.auth';
  return 'chatbot.errors.generic';
};

/*
 * Thẻ sản phẩm gợi ý trong tin nhắn bot. BE đã migrate sang AgentResponse JSON (B.5 trong
 * admin-payment-ai-chat-fe.md): field do AI trả, thường là { id, name, price (số), category,
 * material|null, image_url, reasons[] } — passthrough nên field có thể THIẾU → đọc phòng thủ.
 * Vẫn giữ vài tên field cũ (image/primaryImageUrl/imageUrl, productId/title/priceFrom) để tương
 * thích tin nhắn cũ đã lưu trong lịch sử và mock.
 */
function ProductSuggestion({ product, onNavigate }) {
  const id = product.id ?? product.productId;
  const name = product.name ?? product.title ?? '';
  const price = product.price ?? product.priceFrom ?? product.priceFromVnd;
  const image = product.image_url ?? product.image ?? product.primaryImageUrl ?? product.imageUrl;
  const meta = [product.category, product.material].filter((v) => typeof v === 'string' && v).join(' · ');
  const reasons = Array.isArray(product.reasons) ? product.reasons.filter((r) => typeof r === 'string' && r) : [];
  if (!id) return null;

  return (
    <Link
      to={`/product/${id}`}
      onClick={onNavigate}
      className="flex items-start gap-3 p-2 rounded-xl border border-base-300 bg-base-100 hover:border-primary hover:shadow-sm transition-all"
    >
      {image && <img src={image} alt={name} loading="lazy" className="w-12 h-12 rounded-lg object-cover shrink-0" />}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug line-clamp-2">{name}</p>
        {meta && <p className="text-xs text-base-content/55 mt-0.5 truncate">{meta}</p>}
        {typeof price === 'number' && <p className="text-xs text-primary font-semibold mt-0.5">{formatVnd(price)}</p>}
        {reasons.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1.5">
            {reasons.map((r) => <span key={r} className="badge badge-ghost badge-sm h-auto py-0.5 text-[11px] font-normal whitespace-normal text-left">{r}</span>)}
          </div>
        )}
      </div>
    </Link>
  );
}

export default function ChatPanel() {
  const { t } = useTranslation();
  const isOpen = useChatStore((s) => s.isOpen);
  const close = useChatStore((s) => s.close);
  const sessionId = useChatStore((s) => s.sessionId);
  const setSessionId = useChatStore((s) => s.setSessionId);
  const sessionOwnerId = useChatStore((s) => s.sessionOwnerId);
  const queryClient = useQueryClient();
  const resetSession = useChatStore((s) => s.resetSession);
  const user = useAuthStore((s) => s.user);
  const coords = useLocationStore((s) => s.coords);

  const { data: history, isLoading: historyLoading, isError: historyError, refetch: refetchHistory } = useAiChatMessages(sessionId);
  const createSession = useCreateAiChatSession();
  const sendMessage = useSendAiChatMessage();
  const [view, setView] = useState('chat'); // 'chat' | 'history' — màn hình danh sách các phiên cũ
  const sessionsQuery = useMyAiChatSessions(isOpen && view === 'history');

  const [input, setInput] = useState('');
  const [slow, setSlow] = useState(false); // chờ AI quá lâu (cold start) → hiện lời nhắn trấn an
  const [pendingText, setPendingText] = useState(null); // tin nhắn user vừa gửi — hiện optimistic trong lúc chờ assistant trả lời
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  // Đổi tài khoản / đăng xuất → bỏ phiên của người trước + xoá cache lịch sử chat, tránh lộ/dùng nhầm phiên.
  // Phiên cũ không có sessionOwnerId (lưu trước bản sửa này) cũng bị coi là không thuộc user hiện tại.
  useEffect(() => {
    if (sessionId && sessionOwnerId !== (user?.id ?? null)) {
      resetSession();
      sendMessage.reset();
      setPendingText(null);
      setInput('');
      setView('chat');
      queryClient.removeQueries({ queryKey: ['aiChatMessages'] });
      queryClient.removeQueries({ queryKey: ['aiChatSessions'] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, sessionId, sessionOwnerId]);

  // Đã đăng nhập mà chưa có session → tự tạo 1 phiên (lazy, giống mở tab chat lần đầu).
  // ⚠️ Component giờ LUÔN mount (FE-7: AnimatePresence cần vậy để có exit animation) — PHẢI
  // gate thêm `isOpen`, nếu không session sẽ bị tạo ngay lúc app load cho mọi user đã đăng nhập,
  // kể cả khi họ chưa từng mở khung chat.
  useEffect(() => {
    if (isOpen && user && !sessionId && !createSession.isPending) {
      createSession.mutate(undefined, { onSuccess: (s) => setSessionId(s.id, user.id) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user, sessionId]);

  // ESC để đóng (giống ChatDrawer.jsx — nhất quán accessibility giữa các panel chat)
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, close]);

  // Tự cuộn xuống cuối khi có tin nhắn mới / đang chờ trả lời
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [history, pendingText, sendMessage.isPending]);

  // Cold start: AI trên Render free có thể ngủ → sau ~8s vẫn chưa trả lời thì báo người dùng đợi
  useEffect(() => {
    if (!sendMessage.isPending) { setSlow(false); return; }
    const id = setTimeout(() => setSlow(true), 8000);
    return () => clearTimeout(id);
  }, [sendMessage.isPending]);

  // Auto-resize ô nhập theo nội dung
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    }
  }, [input]);

  // pendingText giữ nguyên khi lỗi (KHÔNG xoá ở onSettled) — để còn hiện bong bóng "đang gửi" VÀ
  // cho nút "Thử lại" gửi lại ĐÚNG nội dung vừa lỗi, thay vì chỉ xoá thông báo lỗi rồi bắt gõ lại.
  const sendText = (text) => {
    if (!text || sendMessage.isPending || !sessionId) return;
    setPendingText(text);
    sendMessage.mutate(
      { sessionId, content: text, lat: coords?.latitude, lng: coords?.longitude },
      { onSuccess: () => setPendingText(null) }
    );
  };

  const send = () => {
    const text = input.trim();
    if (!text) return;
    setInput('');
    sendText(text);
  };

  const retry = () => sendText(pendingText);

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  // Dọn mọi trạng thái của cuộc trò chuyện đang mở (lỗi gửi, tin chờ, ô nhập) — dùng khi đổi/tạo phiên.
  // Trước đây "Cuộc trò chuyện mới" không reset sendMessage nên thông báo lỗi cũ còn dính sang phiên mới.
  const clearConversationState = () => {
    sendMessage.reset();
    setInput('');
    setPendingText(null);
    setView('chat');
  };

  const newConversation = () => {
    resetSession();
    clearConversationState();
  };

  // Mở lại 1 phiên cũ: chỉ cần trỏ sessionId — lịch sử tự tải qua useAiChatMessages
  const openSession = (id) => {
    if (id !== sessionId) {
      setSessionId(id, user.id);
      clearConversationState();
    } else {
      setView('chat');
    }
  };

  const messages = history ?? [];
  // Sau lỗi (timeout/502) BE có thể đã lưu tin → refetch đưa tin vào lịch sử; ẩn bong bóng chờ để không bị lặp
  const lastMsg = messages[messages.length - 1];
  const pendingAlreadySaved = !!pendingText && lastMsg?.role === 'user' && lastMsg.content === pendingText;
  const showHistory = view === 'history' && !!user;
  // Phiên chưa có tin nhắn thì chưa có tiêu đề (BE tự đặt từ tin đầu) → ẩn khỏi danh sách cho đỡ rối, trừ phiên đang mở
  const savedSessions = (sessionsQuery.data ?? []).filter((s) => s.title || s.id === sessionId);
  const busy = sendMessage.isPending || createSession.isPending;

  return (
    <AnimatePresence>
      {isOpen && (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.98 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      role="dialog"
      aria-label={t('chatbot.title')}
      className="fixed z-[70] flex flex-col bg-base-100 border border-base-300 shadow-2xl
                    inset-x-3 bottom-3 rounded-2xl
                    sm:inset-x-auto sm:right-5 sm:bottom-24 sm:w-[22rem] md:w-[24rem]
                    h-[70vh] max-h-[560px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 bg-primary text-primary-content shrink-0">
        <span className="w-8 h-8 rounded-full bg-primary-content/15 flex items-center justify-center"><BotIcon /></span>
        <div className="min-w-0 flex-1">
          <p className="font-medium leading-tight">{t('chatbot.title')}</p>
          <p className="text-xs opacity-80 leading-tight">{t('chatbot.subtitle')}</p>
        </div>
        {user && (
          <button onClick={() => setView((v) => (v === 'history' ? 'chat' : 'history'))} aria-label={t(showHistory ? 'chatbot.backToChat' : 'chatbot.history')} title={t(showHistory ? 'chatbot.backToChat' : 'chatbot.history')} className="p-1.5 rounded-lg hover:bg-primary-content/15 transition-colors">
            {showHistory ? <BackIcon /> : <HistoryIcon />}
          </button>
        )}
        {user && (
          <button onClick={newConversation} aria-label={t('chatbot.newConversation')} title={t('chatbot.newConversation')} className="p-1.5 rounded-lg hover:bg-primary-content/15 transition-colors">
            <NewChatIcon />
          </button>
        )}
        <button onClick={close} aria-label={t('chatbot.close')} className="p-1.5 rounded-lg hover:bg-primary-content/15 transition-colors">
          <CloseIcon />
        </button>
      </div>

      {/* Danh sách các cuộc trò chuyện cũ (GET /ai-chat/sessions) */}
      {showHistory && (
        <div className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-2">
          <p className="text-xs font-medium text-base-content/55">{t('chatbot.historyTitle')}</p>
          {sessionsQuery.isLoading && <p className="text-sm text-base-content/50 py-6 text-center">{t('chatbot.loading')}</p>}
          {sessionsQuery.isError && (
            <div className="flex flex-col gap-1.5 rounded-2xl bg-error/10 px-3 py-2 text-sm text-error">
              <span>{t('chatbot.errors.sessions')}</span>
              <button onClick={() => sessionsQuery.refetch()} className="self-start text-xs font-medium underline">{t('chatbot.retry')}</button>
            </div>
          )}
          {sessionsQuery.isSuccess && !savedSessions.length && (
            <p className="text-sm text-base-content/50 py-6 text-center">{t('chatbot.historyEmpty')}</p>
          )}
          {savedSessions.map((s) => (
            <button
              key={s.id}
              onClick={() => openSession(s.id)}
              className={`text-left rounded-xl border px-3 py-2 transition-colors hover:border-primary ${s.id === sessionId ? 'border-primary bg-primary/5' : 'border-base-300 bg-base-100'}`}
            >
              <p className="text-sm font-medium line-clamp-2">{s.title || t('chatbot.untitled')}</p>
              <p className="text-xs text-base-content/50 mt-0.5">{formatDate(s.updatedAt ?? s.createdAt)}</p>
            </button>
          ))}
        </div>
      )}

      {/* Khu vực tin nhắn (ẩn bằng class khi đang xem danh sách — giữ nguyên vị trí cuộn của cuộc trò chuyện) */}
      <div ref={scrollRef} className={`flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3 ${showHistory ? 'hidden' : ''}`}>
        {historyError && (
          <div className="self-start max-w-[90%] flex flex-col gap-1.5 rounded-2xl rounded-bl-sm bg-error/10 px-3 py-2 text-sm text-error">
            <span>{t('chatbot.errors.history')}</span>
            <button onClick={() => refetchHistory()} className="self-start text-xs font-medium underline">{t('chatbot.retry')}</button>
          </div>
        )}

        {/* Lời chào — hiện khi lịch sử đã tải xong và rỗng (KHÔNG phải tin nhắn thật, chỉ trang trí) */}
        {!historyLoading && !historyError && messages.length === 0 && (
          <div className="self-start max-w-[90%] bg-base-200 text-base-content rounded-2xl rounded-bl-sm px-3 py-2 text-sm">
            {t('chatbot.replies.greeting')}
          </div>
        )}

        {messages.map((m) =>
          m.role === 'user' ? (
            <div key={m.id} className="self-end max-w-[85%] bg-primary text-primary-content rounded-2xl rounded-br-sm px-3 py-2 text-sm whitespace-pre-wrap break-words">
              {m.content}
            </div>
          ) : (
            <div key={m.id} className="self-start max-w-[90%] flex flex-col gap-2">
              <div className="bg-base-200 text-base-content rounded-2xl rounded-bl-sm px-3 py-2 text-sm whitespace-pre-wrap break-words">
                {m.content}
              </div>
              {m.suggestedProducts?.length > 0 && (
                <div className="flex flex-col gap-2">
                  {m.suggestedProducts.map((p, i) => <ProductSuggestion key={p.id ?? p.productId ?? i} product={p} onNavigate={close} />)}
                </div>
              )}
            </div>
          )
        )}

        {/* Tin nhắn user vừa gửi — hiện ngay (optimistic), chưa có trong lịch sử tới khi server trả lời xong */}
        {pendingText && !pendingAlreadySaved && (
          <div className="self-end max-w-[85%] bg-primary text-primary-content rounded-2xl rounded-br-sm px-3 py-2 text-sm whitespace-pre-wrap break-words opacity-80">
            {pendingText}
          </div>
        )}

        {sendMessage.isPending && (
          <div className="self-start bg-base-200 rounded-2xl rounded-bl-sm px-3 py-2.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-base-content/40 animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-base-content/40 animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-base-content/40 animate-bounce" />
          </div>
        )}

        {sendMessage.isPending && slow && (
          <p className="self-start max-w-[90%] text-xs text-base-content/55">{t('chatbot.coldStart')}</p>
        )}

        {sendMessage.isError && (
          <div className="self-start max-w-[90%] flex flex-col gap-1.5 rounded-2xl rounded-bl-sm bg-error/10 px-3 py-2 text-sm text-error">
            <span>{t(chatErrorKey(sendMessage.error))}</span>
            <button onClick={retry} className="self-start text-xs font-medium underline">{t('chatbot.retry')}</button>
          </div>
        )}
      </div>

      {/* Ô nhập — khoá lại nếu chưa đăng nhập (AI chat bắt buộc đăng nhập, xem docs/subscription-fe.md) */}
      {user ? (
        <div className="border-t border-base-300 p-2.5 shrink-0">
          <div className="flex items-end gap-2 bg-base-200 rounded-2xl px-3 py-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              placeholder={t('chatbot.placeholder')}
              className="flex-1 bg-transparent outline-none resize-none text-sm leading-relaxed max-h-[120px] placeholder:text-base-content/40"
            />
            <button
              onClick={send}
              disabled={!input.trim() || busy || !sessionId}
              aria-label={t('chatbot.send')}
              className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center bg-primary text-primary-content disabled:opacity-40 hover:brightness-95 transition"
            >
              <SendIcon />
            </button>
          </div>
        </div>
      ) : (
        <div className="border-t border-base-300 bg-base-100 p-4 text-center shrink-0">
          <p className="text-sm text-base-content/70">{t('chatbot.loginRequired')}</p>
          <Link to="/login" onClick={close} className="btn btn-primary btn-sm mt-3">{t('chatbot.login')}</Link>
        </div>
      )}
    </motion.div>
      )}
    </AnimatePresence>
  );
}
