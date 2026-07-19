import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/*
 * State cho AI chatbot — UI-only (isOpen/position không persist, không cần giữ khi F5).
 * `sessionId` PERSIST: phiên chat AI (GET/POST /api/ai-chat/sessions) sống ở BE, mất session id
 * ở FE là mất luôn đường nối tới lịch sử — persist để F5/đóng-mở lại panel vẫn về đúng phiên cũ.
 * Lịch sử tin nhắn không lưu ở đây nữa (trước đây `messages` giữ trong store) — giờ lấy qua
 * React Query (hooks/useAiChat.js), store chỉ giữ CON TRỎ sessionId.
 */
export const useChatStore = create(
  persist(
    (set) => ({
      isOpen: false,
      position: null, // toạ độ pixel của nút nổi khi đã kéo (null = vị trí mặc định góc dưới-phải)
      sessionId: null,

      toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),
      close: () => set({ isOpen: false }),
      setPosition: (position) => set({ position }),
      setSessionId: (sessionId) => set({ sessionId }),
      // "Cuộc trò chuyện mới" — bỏ session cũ, panel tự tạo session mới ở lần gửi kế tiếp
      resetSession: () => set({ sessionId: null }),
    }),
    { name: 'woodhub-chatbot', partialize: (s) => ({ sessionId: s.sessionId, position: s.position }) }
  )
);
