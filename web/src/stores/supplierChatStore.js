import { create } from 'zustand';
import { api, USE_MOCK } from '../api/client.js';
import { useAuthStore } from './authStore.js';
import { ensureConnected, onMessage, sendViaSocket } from '../services/chatSocket.js';
import { formatVnd } from '../utils/format.js';
import { productChatLink } from '../utils/chatProductLink.js';

/*
 * supplierChatStore — state cho khung CHAT VỚI NHÀ CUNG CẤP (khác AI chatbot ở chatStore.js).
 *
 * Mô hình dữ liệu (UI, KHÔNG đổi khi nối BE thật — ChatDrawer.jsx đọc y nguyên shape này):
 * - conversations: { [supplierId]: Message[] }  — lưu lịch sử theo từng nhà cung cấp.
 * - context: { supplier, product? }             — NCC đang chat + (nếu mở từ trang SP) product context.
 * - typing: NCC có đang "nhập" không (chỉ có ý nghĩa ở mock — BE thật không có sự kiện typing).
 * Message = { id, sender:'user'|'supplier', text, attachmentUrl?, at(ISO), status?:'sending'|'sent'|'seen'|'error' }
 *
 * ⚠️ 1 NCC CHỈ CÓ 1 HỘI THOẠI (UNIQUE customer_id+supplier_id ở BE, kiểu Shopee) — mở chat từ
 * sản phẩm khác nhau vẫn cùng 1 lịch sử. Để không lẫn lộn đang hỏi sản phẩm nào, mỗi lần
 * openFromProduct() với 1 sản phẩm MỚI (khác tin ngữ cảnh gần nhất) sẽ tự "gửi" 1 tin nhắn thẻ
 * sản phẩm (announceProduct*) — đánh dấu bằng attachmentUrl=/product/:id (xem chatProductLink.js),
 * ChatMessageBubble tự nhận diện để hiện thẻ thay vì bong bóng text. KHÔNG cần cột DB mới.
 *
 * ⚠️ CHẾ ĐỘ THẬT (VITE_USE_MOCK=false): `conversationIdBySupplier` map supplierId → conversationId
 * thật (UUID) của BE — cần để gọi getMessages/sendMessage/markAsRead. `openFromProduct` cần
 * product.supplierId là UUID BE nhận dạng được — ĐÃ ĐÚNG từ FE-4 (ProductDetail.jsx nối catalog
 * thật, `getProducts`/`getProduct` trong REAL_ENDPOINTS). Lưu ý: product THẬT không có field
 * `image`/`price` ở top-level (ProductResponse dùng `images[]`/`variants[].price`) — nơi gọi
 * `openFromProduct` phải tự chiếu 2 field này trước khi truyền vào (xem ProductDetail.jsx).
 */
let counter = 0;
const nextId = () => `scm_${Date.now()}_${counter++}`;

// Nội dung tin nhắn thẻ sản phẩm — dùng chung cho mock lẫn tin gửi thật.
const productContextText = (product) =>
  product.price != null ? `${product.name} · ${formatVnd(product.price)}` : product.name;

// Reply mock theo từ khoá — CHỈ dùng ở chế độ mock, để demo luồng hỏi/đáp khi chưa có BE.
const mockReply = (text) => {
  const q = (text || '').toLowerCase();
  if (q.includes('còn hàng') || q.includes('còn không')) return 'Dạ sản phẩm hiện còn hàng ạ. Bạn cần số lượng bao nhiêu để bên mình giữ hàng nhé?';
  if (q.includes('kích thước') || q.includes('size') || q.includes('tùy chỉnh') || q.includes('tuỳ chỉnh')) return 'Sản phẩm có thể tuỳ chỉnh kích thước theo yêu cầu ạ. Bạn cho mình thông số mong muốn (rộng × sâu × cao) nhé.';
  if (q.includes('giao hàng') || q.includes('ship') || q.includes('giao')) return 'Thời gian giao tại TP.HCM khoảng 2–4 ngày, tỉnh khác 3–7 ngày ạ. Bên mình hỗ trợ lắp đặt tận nơi nội thành.';
  if (q.includes('bảo hành')) return 'Sản phẩm được bảo hành 24 tháng lỗi kỹ thuật ạ.';
  if (q.includes('giá') || q.includes('bao nhiêu')) return 'Bạn nhắn giúp mình mã/tên sản phẩm và số lượng, mình báo giá tốt nhất kèm phí ship nhé ạ.';
  return 'Dạ WoodHub đã nhận tin của bạn, nhà cung cấp sẽ phản hồi ngay ạ. Bạn cứ mô tả nhu cầu để được tư vấn nhanh nhất nhé!';
};

// BE ChatMessageResponse { id, conversationId, senderId, senderName, content, attachmentUrl, createdAt }
// → UI Message { id, sender:'user'|'supplier', text, at, status:'sent' }
const toUiMessage = (m, myUserId) => ({
  id: m.id,
  sender: m.senderId === myUserId ? 'user' : 'supplier',
  text: m.content ?? '',
  attachmentUrl: m.attachmentUrl,
  at: m.createdAt,
  status: 'sent',
});

export const useSupplierChatStore = create((set, get) => ({
  isOpen: false,
  context: null,            // { supplier:{id,name}, product?:{id,name,image,price,supplierName} }
  showProductCard: true,    // người dùng có thể ẩn product card (nút pin/close)
  conversations: {},
  conversationIdBySupplier: {}, // CHỈ dùng ở chế độ thật
  typing: false,

  // Mở chat từ TRANG SẢN PHẨM — tự gắn product context + suy ra supplier từ product.
  openFromProduct: (product) => {
    if (!product) return;
    const supplier = { id: product.supplierId, name: product.supplierName };
    set(() => ({
      isOpen: true,
      showProductCard: true,
      context: { supplier, product: { id: product.id, name: product.name, image: product.image, price: product.price, supplierName: product.supplierName } },
    }));

    if (USE_MOCK) {
      set((s) => {
        const base = s.conversations[supplier.id] ?? [welcome(supplier.name)];
        const last = base[base.length - 1];
        // Tin ngữ cảnh gần nhất đã đúng sản phẩm này rồi → khỏi gửi thẻ trùng lặp.
        if (last?.attachmentUrl === productChatLink(product.id)) return { conversations: { ...s.conversations, [supplier.id]: base } };
        const productMsg = {
          id: nextId(), sender: 'user', text: productContextText(product),
          attachmentUrl: productChatLink(product.id), at: new Date().toISOString(), status: 'sent',
        };
        return { conversations: { ...s.conversations, [supplier.id]: [...base, productMsg] } };
      });
      return;
    }

    loadRealConversation(get, set, supplier, product.id).then(() => announceProduct(get, set, supplier, product));
  },

  // Mở chat từ TRANG HỒ SƠ NCC (không kèm product).
  openFromSupplier: (supplier) => {
    if (!supplier?.id) return;
    set({ isOpen: true, showProductCard: false, context: { supplier: { id: supplier.id, name: supplier.name } } });
    if (USE_MOCK) {
      set((s) => ({
        conversations: s.conversations[supplier.id] ? s.conversations : { ...s.conversations, [supplier.id]: [welcome(supplier.name)] },
      }));
      return;
    }
    loadRealConversation(get, set, supplier, null);
  },

  close: () => set({ isOpen: false }),
  toggleProductCard: () => set((s) => ({ showProductCard: !s.showProductCard })),

  // Gửi tin. Mock: giả lập bubble 'sending'→'sent' + NCC tự trả lời. Thật: publish qua STOMP
  // (không optimistic — tin thật quay về qua onMessage, kể cả của chính mình) hoặc fallback REST.
  send: (text) => {
    const body = (text || '').trim();
    const supplierId = get().context?.supplier?.id;
    if (!body || !supplierId) return;

    if (!USE_MOCK) {
      const conversationId = get().conversationIdBySupplier[supplierId];
      if (!conversationId) return; // hội thoại chưa tạo xong (đang loadRealConversation) — bỏ qua, tránh gửi lạc
      const sentViaSocket = sendViaSocket(conversationId, { content: body });
      if (!sentViaSocket) {
        api.sendMessage({ conversationId, content: body }).then((m) => {
          const myUserId = useAuthStore.getState().user?.id;
          set((s) => ({ conversations: pushMsgDedup(s.conversations, supplierId, toUiMessage(m, myUserId)) }));
        });
      }
      return;
    }

    const msg = { id: nextId(), sender: 'user', text: body, at: new Date().toISOString(), status: 'sending' };
    set((s) => ({ conversations: pushMsg(s.conversations, supplierId, msg) }));

    setTimeout(() => {
      set((s) => ({ conversations: patchMsg(s.conversations, supplierId, msg.id, { status: 'sent' }), typing: true }));
    }, 350);

    setTimeout(() => {
      const reply = { id: nextId(), sender: 'supplier', text: mockReply(body), at: new Date().toISOString() };
      set((s) => ({
        typing: false,
        conversations: patchMsg(pushMsg(s.conversations, supplierId, reply), supplierId, msg.id, { status: 'seen' }),
      }));
    }, 1500);
  },

  // Gửi lại tin bị lỗi (UI gọi khi status==='error') — chỉ có ý nghĩa ở mock (chế độ thật không tự set 'error').
  retry: (messageId) => {
    const supplierId = get().context?.supplier?.id;
    if (!supplierId) return;
    set((s) => ({ conversations: patchMsg(s.conversations, supplierId, messageId, { status: 'sent' }) }));
  },
}));

// ---- Chế độ THẬT: tạo/lấy hội thoại + tải lịch sử + subscribe socket ----
function loadRealConversation(get, set, supplier, productId) {
  ensureConnected();
  ensureSubscribed(get, set);

  return api.startConversation({ supplierId: supplier.id, productId: productId ?? undefined }).then(async (conv) => {
    set((s) => ({ conversationIdBySupplier: { ...s.conversationIdBySupplier, [supplier.id]: conv.id } }));
    const myUserId = useAuthStore.getState().user?.id;
    const page = await api.getMessages({ conversationId: conv.id });
    const items = [...(page.content ?? [])].reverse().map((m) => toUiMessage(m, myUserId)); // BE trả mới nhất trước → đảo lại
    set((s) => ({ conversations: { ...s.conversations, [supplier.id]: items } }));
    api.markAsRead(conv.id).catch(() => {});
  });
}

// Gửi 1 tin nhắn thẻ sản phẩm (announce) khi mở chat từ sản phẩm — bỏ qua nếu tin ngữ cảnh gần
// nhất trong lịch sử đã tải về đúng là sản phẩm này rồi (tránh spam khi bấm lại nhiều lần).
function announceProduct(get, set, supplier, product) {
  const conversationId = get().conversationIdBySupplier[supplier.id];
  if (!conversationId) return;
  const list = get().conversations[supplier.id] ?? [];
  const last = list[list.length - 1];
  const attachmentUrl = productChatLink(product.id);
  if (last?.attachmentUrl === attachmentUrl) return;

  const content = productContextText(product);
  const sentViaSocket = sendViaSocket(conversationId, { content, attachmentUrl });
  if (!sentViaSocket) {
    api.sendMessage({ conversationId, content, attachmentUrl }).then((m) => {
      const myUserId = useAuthStore.getState().user?.id;
      set((s) => ({ conversations: pushMsgDedup(s.conversations, supplier.id, toUiMessage(m, myUserId)) }));
    });
  }
}

// Đăng ký DUY NHẤT 1 lần nhận tin từ chatSocket, định tuyến theo conversationId đã biết.
let subscribed = false;
function ensureSubscribed(get, set) {
  if (subscribed) return;
  subscribed = true;
  onMessage((m) => {
    const bySupplier = get().conversationIdBySupplier;
    const supplierId = Object.keys(bySupplier).find((sid) => bySupplier[sid] === m.conversationId);
    if (!supplierId) return; // tin của hội thoại chưa mở ở khung chat này (vd hộp thư Portal xử lý riêng)
    const myUserId = useAuthStore.getState().user?.id;
    set((s) => ({ conversations: pushMsgDedup(s.conversations, supplierId, toUiMessage(m, myUserId)) }));
  });
}

// ---- helpers thuần (không phụ thuộc store) ----
const welcome = (name) => ({
  id: nextId(),
  sender: 'supplier',
  text: `Chào bạn 👋 ${name || 'Nhà cung cấp'} có thể tư vấn sản phẩm, vật liệu và thiết kế theo yêu cầu. Bạn cần hỗ trợ gì ạ?`,
  at: new Date().toISOString(),
});

const pushMsg = (conversations, supplierId, msg) => ({
  ...conversations,
  [supplierId]: [...(conversations[supplierId] ?? []), msg],
});

// Giống pushMsg nhưng bỏ qua nếu id đã có sẵn — tránh trùng khi socket đẩy lại tin đã tải qua getMessages.
const pushMsgDedup = (conversations, supplierId, msg) => {
  const list = conversations[supplierId] ?? [];
  if (list.some((m) => m.id === msg.id)) return conversations;
  return { ...conversations, [supplierId]: [...list, msg] };
};

const patchMsg = (conversations, supplierId, id, patch) => ({
  ...conversations,
  [supplierId]: (conversations[supplierId] ?? []).map((m) => (m.id === id ? { ...m, ...patch } : m)),
});
