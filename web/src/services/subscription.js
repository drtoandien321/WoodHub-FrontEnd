import { api } from '../api/client.js';

/*
 * ensureFreeSubscription — đúng mục 8.1 tài liệu Subscription: "Không có gói active = bị chặn
 * mọi tính năng (limit mặc định = 0 → 429)". Nên ngay sau khi customer đăng nhập, tự kiểm tra
 * GET /subscriptions/me — nếu 404 (chưa có gói nào) thì tự đăng ký gói Free (price === 0) giùm,
 * để tài khoản mới không bị chặn tính năng ngay từ đầu.
 *
 * Fire-and-forget (gọi trong Login/VerifyOtp/GoogleAuthButton, KHÔNG await/chặn navigate() sau
 * login) — giống requestLocationOnce() ở services/geolocation.js: lỗi ở bước này (mất mạng, BE
 * lỗi tạm...) không được phép làm hỏng luồng đăng nhập chính.
 */
export async function ensureFreeSubscription() {
  try {
    await api.getMySubscription();
    return; // đã có gói active rồi, không cần làm gì
  } catch (err) {
    if (err?.response?.status !== 404) return; // lỗi khác 404 (mạng, 500...) — bỏ qua, không phải việc của hàm này
  }
  try {
    const plans = await api.getSubscriptionPlans();
    const free = plans.find((p) => p.price === 0);
    if (free) await api.subscribe(free.id);
  } catch {
    // im lặng bỏ qua — trang "Gói của tôi"/Pricing vẫn cho đăng ký thủ công nếu bước tự động này lỡ lỗi
  }
}
