import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { WS_URL } from '../api/client.js';
import { useAuthStore } from '../stores/authStore.js';

/*
 * chatSocket — quản lý DUY NHẤT 1 kết nối STOMP/SockJS dùng chung cho toàn app (1 người dùng chỉ
 * cần 1 kết nối, dù đang mở khung chat khách hàng hay hộp thư Portal — vì user chỉ có 1 role cố
 * định, không cùng lúc vừa customer vừa supplier). 2 store (supplierChatStore/portalChatStore)
 * import module này thay vì tự tạo Client riêng.
 *
 * Đúng theo config BE (WebSocketConfig.java):
 *  - Kết nối "/ws" (SockJS), JWT gửi ở header Authorization của frame STOMP CONNECT.
 *  - Nhận tin: subscribe "/user/queue/messages" (đẩy riêng cho từng người, không phải topic chung).
 *  - Gửi tin: SEND "/app/conversations/{conversationId}/send".
 *
 * ⚠️ CHỦ ĐÍCH KHÔNG optimistic-echo ở tầng gọi: BE luôn đẩy tin realtime tới CẢ HAI người trong
 * cuộc, KỂ CẢ người gửi (xem comment broadcastToParticipants ở ChatServiceImpl) — nên bên gọi
 * publish() chỉ cần "bắn đi rồi chờ" tin của chính mình quay lại qua onMessage(), không tự thêm
 * bubble tạm rồi phải xử lý de-dup khi tin thật về.
 */
let client = null;
const listeners = new Set();

const notify = (message) => listeners.forEach((cb) => cb(message));

/** Đăng ký callback nhận mọi tin nhắn đẩy về (kể cả tin của chính mình). Trả về hàm huỷ đăng ký. */
export function onMessage(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/** Đảm bảo đã kết nối (idempotent — gọi nhiều lần không tạo kết nối thừa). Cần đã đăng nhập. */
export function ensureConnected() {
  if (client?.active) return;
  const token = useAuthStore.getState().token;
  if (!token) return;

  client = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    connectHeaders: { Authorization: `Bearer ${token}` },
    reconnectDelay: 4000,
    onConnect: () => {
      client.subscribe('/user/queue/messages', (frame) => {
        try {
          notify(JSON.parse(frame.body));
        } catch {
          // bỏ qua frame không parse được — không nên xảy ra với payload JSON từ BE
        }
      });
    },
  });
  client.activate();
}

export function disconnect() {
  client?.deactivate();
  client = null;
}

export function isConnected() {
  return !!client?.connected;
}

/**
 * Gửi tin qua STOMP. Trả về true nếu đã publish (không đảm bảo BE đã lưu — tin thật quay về
 * qua onMessage), false nếu socket chưa sẵn sàng → bên gọi tự fallback sang REST (api.sendMessage).
 */
export function sendViaSocket(conversationId, payload) {
  if (!client?.connected) return false;
  client.publish({
    destination: `/app/conversations/${conversationId}/send`,
    body: JSON.stringify(payload),
  });
  return true;
}
