import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client.js';

/*
 * Hooks cho mảng gói đăng ký (subscription): Pricing (công khai) + "Gói của tôi" + thanh toán
 * QR (SePay) + hạn mức dùng (usage). Đọc kỹ docs Subscription — Tài liệu cho Frontend trước khi
 * sửa: Free và trả phí đi 2 luồng KHÁC NHAU (subscribe() chỉ dành cho gói price=0).
 */
const invalidateSubscription = (qc) => {
  qc.invalidateQueries({ queryKey: ['mySubscription'] });
  qc.invalidateQueries({ queryKey: ['mySubscriptionHistory'] });
  qc.invalidateQueries({ queryKey: ['myUsage'] });
};

// GET /subscription-plans — công khai, không cần đăng nhập (trang Pricing ai cũng xem được)
export const useSubscriptionPlans = () =>
  useQuery({ queryKey: ['subscriptionPlans'], queryFn: api.getSubscriptionPlans, staleTime: 5 * 60_000 });

/*
 * GET /subscriptions/me — 404 nghĩa là "chưa có gói active" (KHÔNG phải lỗi thật, xem mục 3 tài
 * liệu BE) nên tự bắt ở đây và trả về null, để UI chỉ cần check data == null thay vì phân biệt
 * isError/404 mỗi nơi gọi.
 */
export const useMySubscription = (options = {}) =>
  useQuery({
    queryKey: ['mySubscription'],
    queryFn: async () => {
      try {
        return await api.getMySubscription();
      } catch (err) {
        if (err?.response?.status === 404) return null;
        throw err;
      }
    },
    ...options,
  });

export const useMySubscriptionHistory = (options = {}) =>
  useQuery({ queryKey: ['mySubscriptionHistory'], queryFn: api.getMySubscriptionHistory, ...options });

// POST /subscriptions — CHỈ dùng cho gói FREE (price === 0). Gọi cho gói trả phí → BE trả 400.
export const useSubscribe = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.subscribe, onSuccess: () => invalidateSubscription(qc) });
};

export const useCancelSubscription = () => {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.cancelMySubscription, onSuccess: () => invalidateSubscription(qc) });
};

// ===== Thanh toán QR (SePay) — chỉ gói trả phí =====
export const useCreateSubscriptionPayment = () =>
  useMutation({ mutationFn: api.createSubscriptionPayment });

/*
 * usePayment — POLL trạng thái thanh toán mỗi 4s (đúng khoảng "3-5s" tài liệu yêu cầu) khi "pending",
 * thưa hơn khi "expired" (vẫn có thể trả muộn), dừng khi paid/failed. Khi chuyển "paid", component gọi
 * qc.invalidateQueries(['mySubscription']) riêng (BE tự kích hoạt gói qua webhook, FE chỉ cần
 * lấy lại gói mới) — không làm ở đây để hook này không phụ thuộc side-effect ngoài phạm vi của nó.
 */
export const usePayment = (id) =>
  useQuery({
    queryKey: ['payment', id],
    queryFn: () => api.getPayment(id),
    enabled: !!id,
    /*
     * pending → 4s. expired vẫn poll (15s): chính sách BE AUD-005 — QR hết giờ chỉ là đồng hồ giao diện, khách quét
     * lại QR cũ thì webhook vẫn ghi nhận paid (trả muộn) → màn hình phải tự chuyển sang "đã thanh toán". paid/failed → dừng.
     */
    refetchInterval: (query) => {
      const s = query.state.data?.status;
      return s === 'pending' ? 4000 : s === 'expired' ? 15000 : false;
    },
  });

export const useMyPayments = () => useQuery({ queryKey: ['myPayments'], queryFn: api.getMyPayments });

// GET /usage/me — hạn mức dùng mọi tính năng trong THÁNG NÀY (+ purchasedRemaining: lượt đã mua, không reset)
export const useMyUsage = (options = {}) =>
  useQuery({ queryKey: ['myUsage'], queryFn: api.getMyUsage, ...options });

/*
 * Tổng lượt CÒN DÙNG ĐƯỢC của 1 dòng usage. BE trừ hạn mức tháng trước, hết mới trừ ví lượt đã mua,
 * cả 2 cạn mới 429 → FE chỉ coi là "hết lượt" khi CẢ HAI = 0. Trả Infinity nếu không giới hạn.
 */
export const usableCount = (u) => (u?.unlimited ? Infinity : (u?.remaining ?? 0) + (u?.purchasedRemaining ?? 0));

// ===== Credit pack — mua thêm lượt design =====
export const useCreditPacks = (options = {}) =>
  useQuery({ queryKey: ['creditPacks'], queryFn: api.getCreditPacks, staleTime: 5 * 60_000, ...options });
export const useCreateCreditPackPayment = () => useMutation({ mutationFn: api.createCreditPackPayment });
