import { create } from 'zustand';

/*
 * supplierChatStore — state cho khung CHAT VỚI NHÀ CUNG CẤP (khác AI chatbot ở chatStore.js).
 *
 * ⚠️ MOCK-FIRST: đây là bản giả lập client-only để dựng UI/UX (kiểu Shopee). Khi BE có
 * WebSocket/STOMP thật, chỉ cần thay phần `send`/`receive` bằng socket — UI (ChatDrawer + components)
 * KHÔNG phải sửa vì chỉ đọc state từ store này.
 *
 * Mô hình dữ liệu:
 * - conversations: { [supplierId]: Message[] }  — lưu lịch sử theo từng nhà cung cấp (đổi NCC vẫn giữ).
 * - context: { supplier, product? }             — NCC đang chat + (nếu mở từ trang SP) product context.
 * - typing: NCC có đang "nhập" không (hiển thị typing indicator).
 *
 * Message = { id, sender:'user'|'supplier', text, at(ISO), status?:'sending'|'sent'|'seen'|'error' }
 */
let counter = 0;
const nextId = () => `scm_${Date.now()}_${counter++}`;

// Reply mock theo từ khoá — chỉ để demo luồng hỏi/đáp, KHÔNG phải AI thật.
const mockReply = (text) => {
  const q = (text || '').toLowerCase();
  if (q.includes('còn hàng') || q.includes('còn không')) return 'Dạ sản phẩm hiện còn hàng ạ. Bạn cần số lượng bao nhiêu để bên mình giữ hàng nhé?';
  if (q.includes('kích thước') || q.includes('size') || q.includes('tùy chỉnh') || q.includes('tuỳ chỉnh')) return 'Sản phẩm có thể tuỳ chỉnh kích thước theo yêu cầu ạ. Bạn cho mình thông số mong muốn (rộng × sâu × cao) nhé.';
  if (q.includes('giao hàng') || q.includes('ship') || q.includes('giao')) return 'Thời gian giao tại TP.HCM khoảng 2–4 ngày, tỉnh khác 3–7 ngày ạ. Bên mình hỗ trợ lắp đặt tận nơi nội thành.';
  if (q.includes('bảo hành')) return 'Sản phẩm được bảo hành 24 tháng lỗi kỹ thuật ạ.';
  if (q.includes('giá') || q.includes('bao nhiêu')) return 'Bạn nhắn giúp mình mã/tên sản phẩm và số lượng, mình báo giá tốt nhất kèm phí ship nhé ạ.';
  return 'Dạ WoodHub đã nhận tin của bạn, nhà cung cấp sẽ phản hồi ngay ạ. Bạn cứ mô tả nhu cầu để được tư vấn nhanh nhất nhé!';
};

export const useSupplierChatStore = create((set, get) => ({
  isOpen: false,
  context: null,            // { supplier:{id,name}, product?:{id,name,image,price,supplierName} }
  showProductCard: true,    // người dùng có thể ẩn product card (nút pin/close)
  conversations: {},
  typing: false,

  // Mở chat từ TRANG SẢN PHẨM — tự gắn product context + suy ra supplier từ product.
  openFromProduct: (product) => {
    if (!product) return;
    const supplier = { id: product.supplierId, name: product.supplierName };
    set((s) => ({
      isOpen: true,
      showProductCard: true,
      context: {
        supplier,
        product: {
          id: product.id,
          name: product.name,
          image: product.image,
          price: product.price,
          supplierName: product.supplierName,
        },
      },
      // Seed lời chào của NCC nếu chưa có hội thoại nào với supplier này
      conversations: s.conversations[supplier.id]
        ? s.conversations
        : { ...s.conversations, [supplier.id]: [welcome(supplier.name)] },
    }));
  },

  // Mở chat từ TRANG HỒ SƠ NCC (không kèm product) — dùng ở Phase sau.
  openFromSupplier: (supplier) => {
    if (!supplier?.id) return;
    set((s) => ({
      isOpen: true,
      showProductCard: false,
      context: { supplier: { id: supplier.id, name: supplier.name } },
      conversations: s.conversations[supplier.id]
        ? s.conversations
        : { ...s.conversations, [supplier.id]: [welcome(supplier.name)] },
    }));
  },

  close: () => set({ isOpen: false }),
  toggleProductCard: () => set((s) => ({ showProductCard: !s.showProductCard })),

  // Gửi tin: thêm bubble user (status 'sending' → 'sent'), rồi NCC "đang nhập" → auto-reply.
  send: (text) => {
    const body = (text || '').trim();
    const supplierId = get().context?.supplier?.id;
    if (!body || !supplierId) return;

    const msg = { id: nextId(), sender: 'user', text: body, at: new Date().toISOString(), status: 'sending' };
    set((s) => ({ conversations: pushMsg(s.conversations, supplierId, msg) }));

    // Giả lập đã gửi tới server
    setTimeout(() => {
      set((s) => ({ conversations: patchMsg(s.conversations, supplierId, msg.id, { status: 'sent' }), typing: true }));
    }, 350);

    // Giả lập NCC trả lời
    setTimeout(() => {
      const reply = { id: nextId(), sender: 'supplier', text: mockReply(body), at: new Date().toISOString() };
      set((s) => ({
        typing: false,
        conversations: patchMsg(
          // đánh dấu tin user đã 'seen' khi NCC trả lời
          pushMsg(s.conversations, supplierId, reply),
          supplierId,
          msg.id,
          { status: 'seen' }
        ),
      }));
    }, 1500);
  },

  // Gửi lại tin bị lỗi (UI gọi khi status==='error')
  retry: (messageId) => {
    const supplierId = get().context?.supplier?.id;
    if (!supplierId) return;
    set((s) => ({ conversations: patchMsg(s.conversations, supplierId, messageId, { status: 'sent' }) }));
  },
}));

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

const patchMsg = (conversations, supplierId, id, patch) => ({
  ...conversations,
  [supplierId]: (conversations[supplierId] ?? []).map((m) => (m.id === id ? { ...m, ...patch } : m)),
});
