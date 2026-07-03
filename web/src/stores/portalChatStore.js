import { create } from 'zustand';
import { api, USE_MOCK } from '../api/client.js';
import { useAuthStore } from './authStore.js';
import { ensureConnected, onMessage, sendViaSocket } from '../services/chatSocket.js';

/*
 * portalChatStore — HỘP THƯ chat phía NHÀ CUNG CẤP (supplier ↔ nhiều khách hàng).
 * Đây là phía đối diện của supplierChatStore (khách ↔ 1 NCC) — cùng dùng chung 1 kết nối
 * STOMP (services/chatSocket.js), khác conversationId nên không đụng nhau.
 *
 * Message.sender: 'me' = nhà cung cấp (mình) | 'customer' = khách. (render qua ChatMessageBubble own=…)
 * Thread: { id(=conversationId ở chế độ thật), name, initials, snippet, unread, online, at }
 *
 * ⚠️ CHẾ ĐỘ THẬT: `id` của thread CHÍNH LÀ conversationId thật (khác mock dùng id giả 'th_1').
 * BE không trả sẵn nội dung tin nhắn cuối trong ConversationResponse (chỉ có lastMessageAt) nên
 * `snippet` để rỗng cho tới khi thread được mở lần đầu (khi đó lấy từ tin nhắn cuối vừa tải) —
 * đây là giới hạn đã biết, không phải bug, tránh phải gọi N+1 API chỉ để lấy preview.
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

// Reply mock từ khách — CHỈ dùng ở chế độ mock (demo luồng hai chiều khi chưa có BE).
const mockCustomerReply = (text) => {
  const q = (text || '').toLowerCase();
  if (q.includes('còn hàng') || q.includes('còn')) return 'Vậy mình đặt 1 bộ nhé, shop giữ hàng giúp mình.';
  if (q.includes('giao') || q.includes('ngày')) return 'Ok ạ, vậy mình chốt đơn nha shop.';
  if (q.includes('giá') || q.includes('bao nhiêu')) return 'Giá ok với mình, cảm ơn shop!';
  return 'Dạ mình rõ rồi, cảm ơn shop nhiều ạ!';
};

// BE ChatMessageResponse → UI Message (own='me' khi senderId là chính nhà cung cấp đang đăng nhập)
const toUiMessage = (m, myUserId) => ({
  id: m.id,
  sender: m.senderId === myUserId ? 'me' : 'customer',
  text: m.content ?? '',
  at: m.createdAt,
  status: 'sent',
});

const toThread = (c) => ({
  id: c.id,
  customerId: c.customerId, // nội bộ — không phải field UI, dùng để tra presence khi mở thread
  name: c.customerName,
  initials: initialsOf(c.customerName),
  snippet: '',
  unread: c.unreadCount ?? 0,
  online: false,
  at: c.lastMessageAt,
});

export const usePortalChatStore = create((set, get) => ({
  isOpen: false,
  activeThreadId: null,
  threads: USE_MOCK ? seedThreads : [],
  messages: USE_MOCK ? seedMessages : {},
  typing: false,
  loadedThreadIds: new Set(), // CHỈ dùng ở chế độ thật — tránh gọi lại getMessages mỗi lần mở lại thread cũ

  open: () => {
    set({ isOpen: true });
    if (USE_MOCK) return;
    ensureConnected();
    ensureSubscribed(get, set);
    api.getConversations({ role: 'supplier' }).then((page) => {
      set({ threads: (page.content ?? []).map(toThread) });
    });
  },
  close: () => set({ isOpen: false }),

  // Chọn 1 thread → mở hội thoại + đánh dấu đã đọc (unread=0). Thật: tải lịch sử lần đầu + presence.
  selectThread: (id) => {
    set((s) => ({ activeThreadId: id, threads: s.threads.map((t) => (t.id === id ? { ...t, unread: 0 } : t)) }));
    if (USE_MOCK) return;

    api.markAsRead(id).catch(() => {});
    if (get().loadedThreadIds.has(id)) return;

    api.getMessages({ conversationId: id }).then((page) => {
      const myUserId = useAuthStore.getState().user?.id;
      const items = [...(page.content ?? [])].reverse().map((m) => toUiMessage(m, myUserId)); // BE trả mới nhất trước → đảo lại
      const lastText = items.at(-1)?.text ?? '';
      set((s) => ({
        messages: { ...s.messages, [id]: items },
        threads: s.threads.map((t) => (t.id === id ? { ...t, snippet: lastText } : t)),
        loadedThreadIds: new Set(s.loadedThreadIds).add(id),
      }));
    });

    const thread = get().threads.find((t) => t.id === id);
    if (thread?.customerId) {
      api.getPresence(thread.customerId).then((p) => {
        set((s) => ({ threads: s.threads.map((t) => (t.id === id ? { ...t, online: p.online } : t)) }));
      }).catch(() => {});
    }
  },
  backToList: () => set({ activeThreadId: null }),

  // Tổng số tin chưa đọc → badge trên nút.
  totalUnread: () => get().threads.reduce((n, t) => n + (t.unread || 0), 0),

  // NCC gửi tin cho khách.
  send: (text) => {
    const body = (text || '').trim();
    const id = get().activeThreadId;
    if (!body || !id) return;

    if (!USE_MOCK) {
      const sentViaSocket = sendViaSocket(id, { content: body });
      if (!sentViaSocket) {
        api.sendMessage({ conversationId: id, content: body }).then((m) => {
          const myUserId = useAuthStore.getState().user?.id;
          set((s) => ({ messages: pushMsgDedup(s.messages, id, toUiMessage(m, myUserId)) }));
        });
      }
      return;
    }

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

// Đăng ký DUY NHẤT 1 lần nhận tin từ chatSocket — ở chế độ thật, thread.id === conversationId
// nên định tuyến trực tiếp, không cần bảng tra như supplierChatStore.
let subscribed = false;
function ensureSubscribed(get, set) {
  if (subscribed) return;
  subscribed = true;
  onMessage((m) => {
    const threads = get().threads;
    if (!threads.some((t) => t.id === m.conversationId)) return; // hội thoại chưa có trong danh sách (vd mới tạo) — bỏ qua, chờ mở lại hộp thư
    const myUserId = useAuthStore.getState().user?.id;
    const uiMsg = toUiMessage(m, myUserId);
    set((s) => ({
      messages: pushMsgDedup(s.messages, m.conversationId, uiMsg),
      threads: s.threads.map((t) => (t.id === m.conversationId ? { ...t, snippet: uiMsg.text, at: uiMsg.at } : t)),
    }));
  });
}

// Giống push thường nhưng bỏ qua nếu id đã có sẵn — tránh trùng khi socket đẩy lại tin đã tải qua getMessages.
const pushMsgDedup = (messages, threadId, msg) => {
  const list = messages[threadId] ?? [];
  if (list.some((m) => m.id === msg.id)) return messages;
  return { ...messages, [threadId]: [...list, msg] };
};
