import axios from 'axios';
import { API_URL, TIMEOUT_MS, AI_CHAT_TIMEOUT_MS } from '../config.js';
import { useAuth } from '../store/auth.js';

/*
 * API client mobile — CÙNG CONTRACT với web (woodhub/docs/API_CONTRACT.md), gọi BE thật.
 * Interceptor: gắn JWT; khi 401/403 thử refresh token 1 lần rồi gửi lại (BE hiện trả 403 cho token hết hạn
 * ở bản cũ và 401 ở bản mới — xử lý cả hai, y như web).
 */
export const http = axios.create({ baseURL: API_URL, timeout: TIMEOUT_MS });

http.interceptors.request.use((config) => {
  const token = useAuth.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing = null;
http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const req = error.config;
    const status = error.response?.status;
    const isAuthUrl = req?.url?.startsWith('/auth/');
    if (!req || (status !== 401 && status !== 403) || req._retry || isAuthUrl) {
      if (status === 401 && !isAuthUrl) useAuth.getState().logout();
      return Promise.reject(error);
    }
    req._retry = true;
    const { refreshToken } = useAuth.getState();
    if (!refreshToken) {
      if (status === 401) useAuth.getState().logout();
      return Promise.reject(error);
    }
    try {
      refreshing ??= http.post('/auth/refresh', { refreshToken }).finally(() => { refreshing = null; });
      const { data } = await refreshing;
      await useAuth.getState().setAuth(toAuth(data));
      req.headers.Authorization = `Bearer ${data.token}`;
      return http(req);
    } catch (e) {
      await useAuth.getState().logout();
      return Promise.reject(e);
    }
  },
);

// AuthResponse phẳng của BE → { token, refreshToken, user }
export const toAuth = (d) => ({
  token: d.token,
  refreshToken: d.refreshToken,
  user: { id: d.userId, name: d.fullName, email: d.email, role: d.role, customerType: d.customerType },
});

// Spring Page (phẳng hoặc lồng `page`) → { items, totalPages, number }
export const pageOf = (data) => ({
  items: data?.content ?? (Array.isArray(data) ? data : []),
  totalPages: data?.totalPages ?? data?.page?.totalPages ?? 1,
  number: data?.number ?? data?.page?.number ?? 0,
});

// Lỗi → thông điệp tiếng Việt cho người dùng
export function errMsg(e, fallback = 'Có lỗi xảy ra, vui lòng thử lại.') {
  const s = e?.response?.status;
  const m = e?.response?.data?.message;
  if (!e?.response) return e?.code === 'ECONNABORTED' ? 'Máy chủ phản hồi quá lâu, vui lòng thử lại.' : 'Không có kết nối mạng.';
  if (s === 429) return m || 'Bạn đã dùng hết lượt trong tháng này.';
  if (s === 502) return 'Dịch vụ AI đang bận, vui lòng thử lại.';
  return m || fallback;
}

const d = (p) => p.then((r) => r.data);

export const api = {
  // ----- Auth -----
  login: (b) => d(http.post('/auth/login', b)).then(toAuth),
  register: (b) => d(http.post('/auth/register', { email: b.email, password: b.password, fullName: b.name, customerType: 'individual' })),
  verifyOtp: (b) => d(http.post('/auth/verify-otp', { email: b.email, code: b.code })).then(toAuth),
  resendOtp: (b) => d(http.post('/auth/resend-otp', { email: b.email })),
  forgotPassword: (b) => d(http.post('/auth/forgot-password', { email: b.email })),
  resetPassword: (b) => d(http.post('/auth/reset-password', { email: b.email, code: b.code, newPassword: b.newPassword })),
  logout: (refreshToken) => d(http.post('/auth/logout', { refreshToken })),
  getMe: () => d(http.get('/users/me')),

  // ----- Sản phẩm / mô hình 3D -----
  getProducts: (params) => d(http.get('/products', { params })),
  getProduct: (id) => d(http.get(`/products/${id}`)),
  getCategories: () => d(http.get('/categories')),
  getMaterials: () => d(http.get('/materials')),
  getModels3d: (params) => d(http.get('/custom/models', { params })),
  getModel3d: (slug) => d(http.get(`/custom/models/${slug}`)),
  // Model AI của tôi (tự lưu khi gen xong) + đổi tên ("Lưu mô hình" = đặt tên, chỉ chủ sở hữu)
  getMyModels: (params) => d(http.get('/custom/models/my', { params })),
  renameModel: ({ id, name }) => d(http.put(`/custom/models/${id}`, { name })),

  // ----- Thiết kế / AI dựng 3D -----
  getMyDesigns: (params) => d(http.get('/custom/designs/my', { params })),
  getDesign: (id) => d(http.get(`/custom/designs/${id}`)),
  createDesign: (b) => d(http.post('/custom/designs', b)),
  updateDesign: ({ id, ...b }) => d(http.put(`/custom/designs/${id}`, b)),
  deleteDesign: (id) => d(http.delete(`/custom/designs/${id}`)),
  generate3D: ({ uri, name, type, removeBackground }) => {
    const form = new FormData();
    form.append('image', { uri, name: name || 'photo.jpg', type: type || 'image/jpeg' });
    if (removeBackground != null) form.append('removeBackground', String(removeBackground));
    return d(http.post('/custom/ai/generate', form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 120_000 }));
  },
  getGenTask: (id) => d(http.get(`/custom/ai/tasks/${id}`)),
  retryGenTask: (id) => d(http.post(`/custom/ai/tasks/${id}/retry`)),
  cancelGenTask: (id) => d(http.post(`/custom/ai/tasks/${id}/cancel`)),

  // ----- Báo giá -----
  getMyQuotes: (params) => d(http.get('/quotes/my', { params })),
  getQuote: (id) => d(http.get(`/quotes/${id}`)),
  createQuote: (b) => d(http.post('/quotes', b)),
  cancelQuote: (id) => d(http.post(`/quotes/${id}/cancel`)),
  createOffer: ({ quoteId, ...b }) => d(http.post(`/quotes/${quoteId}/offers`, b)),
  acceptOffer: ({ quoteId, offerId }) => d(http.post(`/quotes/${quoteId}/offers/${offerId}/accept`)),
  rejectOffer: ({ quoteId, offerId }) => d(http.post(`/quotes/${quoteId}/offers/${offerId}/reject`)),

  // ----- Xưởng -----
  getPublicSuppliers: (params) => d(http.get('/suppliers/public', { params })),
  getNearestWorkshops: ({ lat, lng, limit = 8 }) => d(http.get('/stores/nearby/workshops', { params: { lat, lng, limit } })),

  // ----- Gói / thanh toán -----
  getPlans: () => d(http.get('/subscription-plans')),
  getMySubscription: () => d(http.get('/subscriptions/me')).catch((e) => (e?.response?.status === 404 ? null : Promise.reject(e))),
  subscribe: (planId) => d(http.post('/subscriptions', { planId })),
  getMyUsage: () => d(http.get('/usage/me')),
  createPayment: (planId) => d(http.post('/payments/subscription', { planId })),
  getPayment: (id) => d(http.get(`/payments/${id}`)),

  // ----- Trợ lý AI -----
  createAiSession: (b) => d(http.post('/ai-chat/sessions', b ?? {})),
  getAiSessions: () => d(http.get('/ai-chat/sessions')),
  getAiMessages: (id) => d(http.get(`/ai-chat/sessions/${id}/messages`)),
  sendAiMessage: ({ sessionId, ...b }) => d(http.post(`/ai-chat/sessions/${sessionId}/messages`, b, { timeout: AI_CHAT_TIMEOUT_MS })),
};
