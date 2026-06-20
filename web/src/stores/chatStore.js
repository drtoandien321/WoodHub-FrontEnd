import { create } from 'zustand';

/*
 * State cho AI chatbot (client-only):
 * - isOpen: panel chat đang mở hay không
 * - messages: lịch sử hội thoại { id, role: 'user'|'bot', textKey?, text?, products? }
 *   (giữ trong bộ nhớ → còn khi chuyển trang, mất khi F5 — đủ cho demo)
 * - position: toạ độ pixel của nút nổi khi đã kéo (null = vị trí mặc định góc dưới-phải)
 */
let counter = 0;
const nextId = () => `msg_${Date.now()}_${counter++}`;

export const useChatStore = create((set) => ({
  isOpen: false,
  messages: [],
  position: null,

  toggleOpen: () => set((s) => ({ isOpen: !s.isOpen })),
  close: () => set({ isOpen: false }),
  setPosition: (position) => set({ position }),

  // role='user': { text } ; role='bot': { textKey, products }
  addMessage: (msg) => set((s) => ({ messages: [...s.messages, { id: nextId(), ...msg }] })),
  resetMessages: () => set({ messages: [] }),
}));
