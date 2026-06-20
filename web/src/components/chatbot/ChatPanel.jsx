import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useChatStore } from '../../stores/chatStore.js';
import { getAdvisorReply } from '../../services/chatbot/advisor.js';
import { formatVnd } from '../../utils/format.js';

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

// Thẻ sản phẩm hiển thị trong tin nhắn của bot — bấm vào đi tới trang chi tiết
function ProductSuggestion({ product, onNavigate }) {
  return (
    <Link
      to={`/product/${product.id}`}
      onClick={onNavigate}
      className="flex items-center gap-3 p-2 rounded-xl border border-base-300 bg-base-100 hover:border-primary hover:shadow-sm transition-all"
    >
      <img src={product.image} alt={product.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium leading-snug line-clamp-2">{product.name}</p>
        <p className="text-xs text-primary font-semibold mt-0.5">{formatVnd(product.price)}</p>
      </div>
    </Link>
  );
}

export default function ChatPanel() {
  const { t } = useTranslation();
  const close = useChatStore((s) => s.close);
  const messages = useChatStore((s) => s.messages);
  const addMessage = useChatStore((s) => s.addMessage);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef(null);
  const textareaRef = useRef(null);

  // Lời chào lần đầu mở (nếu chưa có tin nhắn nào).
  // Đọc state mới nhất qua getState() để tránh thêm 2 lần khi React StrictMode chạy effect đôi
  // (biến `messages` trong closure vẫn là [] ở cả 2 lần chạy → sẽ bị nhân đôi nếu dựa vào nó).
  useEffect(() => {
    if (useChatStore.getState().messages.length === 0) {
      addMessage({ role: 'bot', textKey: 'chatbot.replies.greeting', products: [] });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tự cuộn xuống cuối khi có tin nhắn mới / đang soạn
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  // Auto-resize ô nhập theo nội dung
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = Math.min(el.scrollHeight, 120) + 'px';
    }
  }, [input]);

  const send = () => {
    const text = input.trim();
    if (!text || typing) return;
    addMessage({ role: 'user', text });
    setInput('');
    setTyping(true);
    // Giả lập độ trễ "đang soạn" cho tự nhiên rồi mới trả lời
    const reply = getAdvisorReply(text);
    setTimeout(() => {
      addMessage({ role: 'bot', textKey: reply.textKey, products: reply.products });
      setTyping(false);
    }, 600);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="fixed z-[70] flex flex-col bg-base-100 border border-base-300 shadow-2xl
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
        <button onClick={close} aria-label={t('chatbot.close')} className="p-1.5 rounded-lg hover:bg-primary-content/15 transition-colors">
          <CloseIcon />
        </button>
      </div>

      {/* Khu vực tin nhắn */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3 flex flex-col gap-3">
        {messages.map((m) =>
          m.role === 'user' ? (
            <div key={m.id} className="self-end max-w-[85%] bg-primary text-primary-content rounded-2xl rounded-br-sm px-3 py-2 text-sm whitespace-pre-wrap break-words">
              {m.text}
            </div>
          ) : (
            <div key={m.id} className="self-start max-w-[90%] flex flex-col gap-2">
              <div className="bg-base-200 text-base-content rounded-2xl rounded-bl-sm px-3 py-2 text-sm">
                {m.textKey ? t(m.textKey) : m.text}
              </div>
              {m.products?.length > 0 && (
                <div className="flex flex-col gap-2">
                  {m.products.map((p) => <ProductSuggestion key={p.id} product={p} onNavigate={close} />)}
                </div>
              )}
            </div>
          )
        )}

        {typing && (
          <div className="self-start bg-base-200 rounded-2xl rounded-bl-sm px-3 py-2.5 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-base-content/40 animate-bounce [animation-delay:-0.3s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-base-content/40 animate-bounce [animation-delay:-0.15s]" />
            <span className="w-1.5 h-1.5 rounded-full bg-base-content/40 animate-bounce" />
          </div>
        )}
      </div>

      {/* Ô nhập */}
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
            disabled={!input.trim() || typing}
            aria-label={t('chatbot.send')}
            className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center bg-primary text-primary-content disabled:opacity-40 hover:brightness-95 transition"
          >
            <SendIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
