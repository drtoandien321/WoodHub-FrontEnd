import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { usePortalChatStore } from '../../stores/portalChatStore.js';
import ChatMessageBubble from '../chat/ChatMessageBubble.jsx';
import ChatInput from '../chat/ChatInput.jsx';
import { X, ChevronLeft, MessageCircle } from '../suppliers/icons.jsx';

/*
 * PortalChatDrawer — hộp thư chat khách hàng phía NHÀ CUNG CẤP (trong Supplier Portal).
 * 1 pane: danh sách thread ↔ hội thoại (nút back). Desktop drawer phải 420px, mobile full-screen.
 * Reuse ChatMessageBubble (own={sender==='me'}) + ChatInput.
 */
export default function PortalChatDrawer() {
  const { t } = useTranslation();
  const {
    isOpen, activeThreadId, threads, messages, typing,
    close, selectThread, backToList, send,
  } = usePortalChatStore();

  const active = threads.find((th) => th.id === activeThreadId) || null;
  const list = (activeThreadId && messages[activeThreadId]) || [];

  const scrollRef = useRef(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [list.length, typing, activeThreadId, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, close]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={close} aria-hidden="true"
            className="fixed inset-0 z-[60] bg-black/30 sm:hidden"
          />
          <motion.aside
            role="dialog" aria-label={t('portal.chat.title')}
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.28, ease: 'easeOut' }}
            className="fixed inset-0 z-[61] flex flex-col bg-base-200 shadow-2xl sm:inset-y-0 sm:left-auto sm:right-0 sm:w-[420px] sm:border-l sm:border-base-300"
          >
            {/* Header */}
            <header className="flex items-center gap-2.5 border-b border-base-300 bg-base-100 px-3 py-2.5">
              {active ? (
                <>
                  <button onClick={backToList} aria-label={t('portal.chat.back')} className="btn btn-ghost btn-sm btn-circle">
                    <ChevronLeft width={18} height={18} />
                  </button>
                  <Avatar text={active.initials} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium leading-tight">{active.name}</p>
                    <p className="flex items-center gap-1.5 text-xs text-base-content/55">
                      <span className={`inline-block h-2 w-2 rounded-full ${active.online ? 'bg-success' : 'bg-base-content/30'}`} />
                      {active.online ? t('portal.chat.online') : t('portal.chat.offline')}
                    </p>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 items-center gap-2">
                  <MessageCircle width={18} height={18} className="text-primary" />
                  <p className="font-medium">{t('portal.chat.title')}</p>
                </div>
              )}
              <button onClick={close} aria-label={t('portal.chat.close')} className="btn btn-ghost btn-sm btn-circle">
                <X width={18} height={18} />
              </button>
            </header>

            {/* Body */}
            {active ? (
              <>
                <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-2">
                  <div className="flex flex-col gap-3 py-1">
                    {list.map((m) => (
                      <ChatMessageBubble key={m.id} message={m} own={m.sender === 'me'} />
                    ))}
                    {typing && (
                      <div className="flex items-center gap-1.5 px-1 text-xs text-base-content/50">
                        <span className="flex gap-1">
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-base-content/40 [animation-delay:-200ms]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-base-content/40 [animation-delay:-100ms]" />
                          <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-base-content/40" />
                        </span>
                        {t('portal.chat.typing')}
                      </div>
                    )}
                  </div>
                </div>
                <ChatInput onSend={send} autoFocus />
              </>
            ) : (
              <ul className="flex-1 overflow-y-auto p-2">
                {threads.map((th) => (
                  <li key={th.id}>
                    <button
                      onClick={() => selectThread(th.id)}
                      className="flex w-full items-center gap-3 rounded-2xl px-2.5 py-2.5 text-left transition-colors hover:bg-base-100"
                    >
                      <Avatar text={th.initials} online={th.online} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate font-medium">{th.name}</span>
                          <span className="shrink-0 text-[11px] text-base-content/45">{th.at}</span>
                        </div>
                        <p className="truncate text-sm text-base-content/55">{th.snippet}</p>
                      </div>
                      {th.unread > 0 && (
                        <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1.5 text-[11px] font-medium text-primary-content">
                          {th.unread}
                        </span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Avatar({ text, online }) {
  return (
    <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-secondary to-primary text-sm font-display text-primary-content">
      {text}
      {online && <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-base-100 bg-success" />}
    </span>
  );
}
