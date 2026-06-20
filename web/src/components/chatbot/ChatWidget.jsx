import { useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useChatStore } from '../../stores/chatStore.js';
import ChatPanel from './ChatPanel.jsx';

// Ẩn chatbot ở các trang xác thực (đăng nhập/đăng ký/OTP)
const HIDDEN_PATHS = ['/login', '/register', '/verify-otp'];
const BTN = 56; // kích thước nút nổi (px)

const ChatBubbleIcon = (p) => (
  <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}>
    <path d="M21 11.5a8.5 8.5 0 0 1-12.2 7.7L3 21l1.8-5.8A8.5 8.5 0 1 1 21 11.5Z" />
    <path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01" />
  </svg>
);

export default function ChatWidget() {
  const { pathname } = useLocation();
  const { t } = useTranslation();
  const isOpen = useChatStore((s) => s.isOpen);
  const toggleOpen = useChatStore((s) => s.toggleOpen);
  const position = useChatStore((s) => s.position);
  const setPosition = useChatStore((s) => s.setPosition);

  // ref giữ trạng thái kéo để phân biệt "kéo" với "click"
  const drag = useRef({ active: false, moved: false, startX: 0, startY: 0, offsetX: 0, offsetY: 0 });

  if (HIDDEN_PATHS.includes(pathname)) return null;

  const onPointerDown = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    drag.current = {
      active: true, moved: false,
      startX: e.clientX, startY: e.clientY,
      offsetX: e.clientX - rect.left, offsetY: e.clientY - rect.top,
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d.active) return;
    if (Math.abs(e.clientX - d.startX) > 4 || Math.abs(e.clientY - d.startY) > 4) d.moved = true;
    // Kẹp trong viewport để nút không bị kéo ra ngoài màn hình
    const x = Math.max(8, Math.min(window.innerWidth - BTN - 8, e.clientX - d.offsetX));
    const y = Math.max(8, Math.min(window.innerHeight - BTN - 8, e.clientY - d.offsetY));
    setPosition({ x, y });
  };

  const onPointerUp = () => {
    const d = drag.current;
    d.active = false;
    if (!d.moved) toggleOpen(); // chỉ là click (không kéo) → mở/đóng panel
  };

  // Vị trí nút: mặc định góc dưới-phải; nếu đã kéo thì dùng toạ độ pixel
  const style = position ? { left: position.x, top: position.y } : { right: 24, bottom: 24 };

  return (
    <>
      {isOpen && <ChatPanel />}

      {/* Nút nổi — ẩn khi panel đang mở để khỏi chồng lên panel */}
      {!isOpen && (
        <button
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          aria-label={t('chatbot.launcherLabel')}
          style={style}
          className="fixed z-[70] w-14 h-14 rounded-full bg-primary text-primary-content shadow-xl
                     flex items-center justify-center hover:brightness-95 active:scale-95
                     transition-transform touch-none cursor-grab active:cursor-grabbing"
        >
          <ChatBubbleIcon />
        </button>
      )}
    </>
  );
}
