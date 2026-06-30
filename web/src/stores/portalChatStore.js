import { create } from 'zustand';

/*
 * portalChatStore — HỘP THƯ chat phía NHÀ CUNG CẤP (supplier ↔ nhiều khách hàng).
 * Đây là phía đối diện của supplierChatStore (khách ↔ 1 NCC). MOCK-FIRST: khi có BE/WebSocket,
 * thay phần seed + send/reply bằng socket, UI (PortalChat*) không phải đổi.
 *
 * Message.sender: 'me' = nhà cung cấp (mình) | 'customer' = khách. (render qua ChatMessageBubble own=…)
 * Thread: { id, name, initials, snippet, unread, online, at }
 */
let counter = 0;
const nextId = () => `pcm_${Date.now()}_${counter++}`;
const initialsOf = (name = '') =>
  name.trim().split(/\s+/).filter(Boolean).slice(-2).map((w) => w[0]).join('').toUpperCase() || 'KH';

const seedThreads = [
  { id: 'th_1', name: 'Nhà Xinh', snippet: 'Bàn ăn còn hàng không shop?', unread: 2, online: true, at: '10:24' },
  { id: 'th_2', name: 'Anh Minh Tuấn', snippet: 'Cho mình hỏi thời gian giao…', unread: 0, online: true, at: '09:50' },
  { id: 'th_3', name: 'Tủ Bếp Xanh', snippet: 'Cảm ơn shop nhé!', unread: 0, online: false, at: 'Hôm qua' },
].map((t) => ({ ...t, initials: initialsOf(t.name) }));

const seedMessages = {
  th_1: [
    { id: nextId(), sender: 'customer', text: 'Chào shop, bàn ăn gỗ sồi Scandi còn hàng không ạ?', at: '2026-06-30T10:20:00+07:00' },
    { id: nextId(), sender: 'customer', text: 'Mình cần giao về Quận 7 trước cuối tuần được không?', at: '2026-06-30T10:24:00+07:00' },
  ],
  th_2: [
    { id: nextId(), sender: 'customer', text: 'Cho mình hỏi thời gian giao hàng tủ quần áo nhé.', at: '2026-06-30T09:48:00+07:00' },
    { id: nextId(), sender: 'me', text: 'Dạ tủ quần áo giao nội thành 2–3 ngày anh nhé.', at: '2026-06-30T09:50:00+07:00', status: 'seen' },
  ],
  th_3: [
    { id: nextId(), sender: 'me', text: 'Đơn của bạn đã giao thành công, cảm ơn bạn ạ!', at: '2026-06-29T16:10:00+07:00', status: 'seen' },
    { id: nextId(), sender: 'customer', text: 'Cảm ơn shop nhé!', at: '2026-06-29T16:30:00+07:00' },
  ],
};

// Reply mock từ khách (demo luồng hai chiều).
const mockCustomerReply = (text) => {
  const q = (text || '').toLowerCase();
  if (q.includes('còn hàng') || q.includes('còn')) return 'Vậy mình đặt 1 bộ nhé, shop giữ hàng giúp mình.';
  if (q.includes('giao') || q.includes('ngày')) return 'Ok ạ, vậy mình chốt đơn nha shop.';
  if (q.includes('giá') || q.includes('bao nhiêu')) return 'Giá ok với mình, cảm ơn shop!';
  return 'Dạ mình rõ rồi, cảm ơn shop nhiều ạ!';
};

export const usePortalChatStore = create((set, get) => ({
  isOpen: false,
  activeThreadId: null,
  threads: seedThreads,
  messages: seedMessages,
  typing: false,

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),

  // Chọn 1 thread → mở hội thoại + đánh dấu đã đọc (unread=0).
  selectThread: (id) =>
    set((s) => ({
      activeThreadId: id,
      threads: s.threads.map((t) => (t.id === id ? { ...t, unread: 0 } : t)),
    })),
  backToList: () => set({ activeThreadId: null }),

  // Tổng số tin chưa đọc → badge trên nút.
  totalUnread: () => get().threads.reduce((n, t) => n + (t.unread || 0), 0),

  // NCC gửi tin cho khách → cập nhật snippet + giả lập khách trả lời.
  send: (text) => {
    const body = (text || '').trim();
    const id = get().activeThreadId;
    if (!body || !id) return;

    const msg = { id: nextId(), sender: 'me', text: body, at: new Date().toISOString(), status: 'sending' };
    set((s) => ({
      messages: { ...s.messages, [id]: [...(s.messages[id] ?? []), msg] },
      threads: s.threads.map((t) => (t.id === id ? { ...t, snippet: body, at: 'Vừa xong' } : t)),
    }));

    setTimeout(() => {
      set((s) => ({
        typing: true,
        messages: { ...s.messages, [id]: s.messages[id].map((m) => (m.id === msg.id ? { ...m, status: 'sent' } : m)) },
      }));
    }, 300);

    setTimeout(() => {
      const reply = { id: nextId(), sender: 'customer', text: mockCustomerReply(body), at: new Date().toISOString() };
      set((s) => ({
        typing: false,
        messages: {
          ...s.messages,
          [id]: [...s.messages[id].map((m) => (m.id === msg.id ? { ...m, status: 'seen' } : m)), reply],
        },
        threads: s.threads.map((t) => (t.id === id ? { ...t, snippet: reply.text, at: 'Vừa xong' } : t)),
      }));
    }, 1600);
  },
}));
