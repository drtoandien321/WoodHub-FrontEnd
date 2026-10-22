import axios from 'axios';
import { useAuthStore } from '../stores/authStore.js';
import { mockAdapter } from './mock/mockAdapter.js';
import { isUserLocked, markAccountLocked } from '../utils/accountLock.js';

/*
 * ===== API CLIENT — ĐIỂM CHUYỂN GIAO DUY NHẤT GIỮA FE VÀ BE =====
 *
 * Khi BE sẵn sàng: chỉ cần đặt VITE_USE_MOCK=false + VITE_API_URL trong .env
 * → toàn bộ FE chuyển sang gọi API thật, KHÔNG sửa code page/component nào.
 *
 * Contract đầy đủ (method, path, request/response shape) xem docs/API_CONTRACT.md.
 */
export const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'; // mặc định mock để FE chạy độc lập
export const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8081/api';
// URL endpoint STOMP/SockJS — bỏ hậu tố "/api" của BASE_URL vì "/ws" nằm ở gốc BE, không phải dưới /api
export const WS_URL = BASE_URL.replace(/\/api\/?$/, '') + '/ws';

/*
 * REAL_ENDPOINTS: các endpoint ĐI QUA hàm call() (products, orders, custom, supplier...) đã có BE thật.
 * Khi BE làm xong endpoint nào, thêm đúng mockKey của nó vào set này — không phải sửa page/component.
 * LƯU Ý: nhóm Auth (login/register/verify-otp/resend-otp/google/forgot-password/...) được xử lý
 * TƯỜNG MINH ở dưới (mỗi hàm tự kiểm tra USE_MOCK), KHÔNG đi qua call() nên không liệt kê ở đây.
 */
const REAL_ENDPOINTS = new Set([
  'getMe', 'updateUser', // Module User — GET/PUT /api/users/me, /api/users/{id} (đã xác nhận BE thật)
  'getBusinessProfile', 'createBusinessProfile', 'updateBusinessProfile', // BusinessProfileController
  // Module Supplier (browse công khai) — đã xác nhận BE thật (curl local, sau khi pull 2 endpoint mới)
  'getPublicSuppliers', 'getSupplierPublicProfile', 'getSupplierStores', 'getSupplierPortfolio',
  'getReviews', 'getReviewSummary',
  // Viết/sửa/xoá đánh giá (POST/PUT/DELETE /reviews) — cần đăng nhập, mỗi user 1 đánh giá / đối tượng
  'createReview', 'updateReview', 'deleteReview',
  // Module Category/Material — đã xác nhận BE thật (curl local)
  'getCategories', 'getCategoryTree', 'getMaterials',
  /*
   * Module Product — catalog công khai (FE-4, curl trực tiếp BE deploy 2026-07-19 xác nhận):
   * GET /products (danh sách, có data thật — 25 SP), GET /products/{id} (chi tiết, có variants[]/
   * images[]) đều hoạt động đúng Page<ProductSummaryResponse>/ProductResponse thật. ĐÃ cập nhật
   * ProductDetail.jsx/ProductInfo.jsx/ProductCard.jsx/Shop.jsx theo đúng shape mới (xem FE-4).
   * ✅ 2026-07-20: BE đã fix + curl xác nhận lại — sort theo giá giờ dùng field `price` (KHÔNG
   * phải `priceFrom` như suy đoán ban đầu — Product entity có cột @Formula tên `price`, DTO chỉ
   * ĐỔI TÊN thành `priceFrom` lúc serialize): `sort=price,asc` / `sort=price,desc` chạy đúng thật
   * (đã curl thấy giá tăng/giảm dần chính xác) → Shop.jsx đã bật lại tuỳ chọn sắp theo giá.
   * ⚠️ GET /products/featured vẫn 400 Bad Request (nghi bị khớp nhầm vào /products/{id} với
   * id="featured") nên KHÔNG dùng — Landing.jsx lấy "sản phẩm nổi bật" bằng chính getProducts()
   * này (sort=createdAt,desc, size=4), cùng nguồn dữ liệu thật với Shop.jsx.
   * 'getProduct' giờ TRÙNG hành vi với 'getMyProductDetail' (cùng GET /products/{id}) — vẫn giữ
   * 2 tên hàm riêng vì 2 trang dùng khác mục đích (công khai vs portal tự quản lý), không phải vì
   * shape khác nhau nữa.
   */
  'getProducts', 'getProduct',
  // Module Room/Style (BE-7) — GET công khai, curl xác nhận hoạt động (mảng rỗng vì chưa seed, không phải lỗi)
  'getRooms', 'getRoomBySlug', 'getRoomScenes', 'getRoomSceneDetail', 'getStyles',
  // Module AI Chat — đã curl xác nhận session/history hoạt động thật; sendMessage cũng REAL dù
  // hiện trả 502 (AI provider phía BE chưa nối) — đó là trạng thái thật cần UI xử lý, không phải lý do để mock.
  'createAiChatSession', 'getMyAiChatSessions', 'getAiChatMessages', 'sendAiChatMessage',
  // Module Product (Portal Nhà cung cấp tự quản lý — /portal/supplier/products)
  'createProduct', 'getMyProducts', 'getMyProductDetail', 'updateProduct', 'updateProductStatus', 'deleteProduct',
  'createVariant', 'getVariants', 'updateVariant', 'deleteVariant',
  'uploadProductImage', 'getProductImages', 'setPrimaryImage', 'updateProductImage', 'deleteProductImage',
  // Module Store + Store Inventory (Portal Nhà cung cấp tự quản lý chi nhánh) — đã xác nhận BE thật (curl local)
  'createStore', 'getMyStores', 'updateStore', 'deleteStore',
  'getStoreInventory', 'addStock', 'adjustStock', 'deleteStock', 'getVariantInventory',
  // Module Chat (REST — lịch sử/khởi tạo hội thoại; tin realtime qua STOMP, xem services/chatSocket.js)
  'startConversation', 'getConversations', 'getMessages', 'sendMessage', 'markAsRead', 'getPresence',
  // Module Admin — Category CRUD (Portal Quản trị /admin/categories)
  'createCategory', 'updateCategory', 'deleteCategory',
  // Module Admin — Material CRUD (Portal Quản trị /admin/materials)
  'createMaterial', 'updateMaterial', 'deleteMaterial',
  // Module Admin — Supplier quản trị (Portal Quản trị /admin/suppliers)
  'getAdminSuppliers', 'getAdminSupplierDetail', 'createSupplier', 'updateSupplierStatus',
  // Module Admin — User quản trị (Portal Quản trị /admin/users)
  'getAdminUsers', 'getAdminUserDetail', 'deleteUser',
  // BE-11 khoá tài khoản + kiểm duyệt đánh giá · hoàn tiền (no-inventory §5.1) · BE-06 liên hệ · BE-14 payout NCC
  'setUserStatus', 'getAdminReviews', 'moderateReview', 'deleteAdminReview',
  'getPendingRefunds', 'confirmRefund', 'getAdminContacts', 'updateContactStatus', 'getAdminSupplierPayout',
  // Module Admin — quản lý thanh toán (Portal Quản trị /admin/payments) — API chỉ đọc
  'getAdminPayments', 'getAdminPayment', 'getAdminPaymentStats',
  // Module Admin — Dashboard tổng quan (Portal Quản trị /admin/dashboard) — API chỉ đọc
  'getAdminDashboardSummary', 'getAdminDashboardTimeseries', 'getAdminDashboardTop',
  // GA4 traffic (commit 9ed1b6e) — 503 khi BE chưa cấu hình GA (FE ẩn khối)
  'getAdminDashboardTraffic',
  // Gói lượt thiết kế mua thêm (credit pack) — khách mua + admin quản lý (commit 40ece30)
  'getCreditPacks', 'createCreditPackPayment',
  'getAdminCreditPacks', 'createCreditPack', 'updateCreditPack', 'deleteCreditPack',
  // Module GPS/Vị trí — hồ sơ supplier tự thân (biết type để gate UI)
  'getSupplierMe',
  // BE-09 thống kê NCC / xưởng (SupplierStatsController)
  'getSupplierStatsSummary', 'getSupplierStatsTimeseries', 'getSupplierStatsTopProducts',
  // Hồ sơ + portfolio của chính supplier (SupplierController PUT /me, SupplierPortfolioController)
  // BE-10 hồ sơ (PATCH, ảnh) · BE-12 §2 trả lời đánh giá · BE-14 tài khoản nhận tiền + cài đặt email thông báo
  'patchSupplierMe', 'uploadSupplierImage', 'getSupplierReviewsPortal', 'replyReview', 'deleteReviewReply',
  // BE-12 thông báo (chuông)
  'getNotifications', 'getUnreadNotificationCount', 'markNotificationRead', 'markAllNotificationsRead',
  'getMyPayout', 'saveMyPayout', 'getMyCapability', 'saveMyCapability', 'getNotificationSettings', 'updateNotificationSettings',
  'updateSupplierMe', 'getMyPortfolio', 'addPortfolioItem', 'updatePortfolioItem', 'deletePortfolioItem',
  // Module GPS/Vị trí — 3 API gợi ý gần (Pha 3 Checkout + Pha 4 Custom order)
  'getNearbyStoresBySupplier', 'getNearestWorkshops', 'getWorkshopsWithinRadius',
  // Module Subscription — gói đăng ký (trang Pricing + "Gói của tôi")
  'getSubscriptionPlans', 'subscribe', 'getMySubscription', 'getMySubscriptionHistory',
  'cancelMySubscription',
  'createSubscriptionPayment', 'getPayment', 'getMyPayments',
  'getMyUsage',
  // Module Admin — quản lý gói đăng ký (Portal Quản trị /admin/subscription-plans)
  'getAllSubscriptionPlans', 'createSubscriptionPlan', 'updateSubscriptionPlan', 'deleteSubscriptionPlan',
  /*
   * ✅ 2026-07-20: BE fix xong lỗi gốc chặn cả domain này (GET /api/custom/models 500 do
   * lower(bytea) — đã cast tường minh sang string trong JPQL) — curl xác nhận LIST + DETAIL đều
   * chạy đúng thật (có data thật: 1 template seed + ≥2 model AI đã sinh thành công qua Meshy thật,
   * shape khớp 100% những gì FE đã code). Bật thật CẢ NHÓM AI 3D + CustomDesign + Quote/Order —
   * xem chi tiết từng hàm ở nơi định nghĩa (đã cập nhật comment, không còn "CHƯA thêm vào set này").
   */
  'getModels3d', 'getModel3d', 'getMyModels', 'renameModel', 'getGenTask', 'retryGenTask', 'cancelGenTask', 'getMyGenTasks',
  // Text-to-3D + nâng cấp texture (BE commit 40ece30, docs/custom-model-3d-fe.md mục 1b/1c)
  'generate3DFromText', 'refineGenTask',
  'createDesign', 'getDesignDetail', 'updateDesign', 'deleteDesign', 'getMyDesigns',
  'createQuote', 'getMyQuotes', 'getIncomingQuotes', 'getQuoteDetail', 'cancelQuote',
  'createOffer', 'acceptOffer', 'rejectOffer',
  'getMyCustomOrders', 'getIncomingCustomOrders', 'getCustomOrderDetail', 'updateCustomOrderStatus',
  'createCustomOrderPayment', 'setCustomOrderAddress', // BE-01 đặt cọc / thanh toán / địa chỉ đơn custom
  // Module Cart — giỏ hàng lưu ở server (docs/cart-address-fe.md của BE, commit 40ece30)
  'getCart', 'addCartItem', 'updateCartItem', 'removeCartItem', 'clearCart',
  // Module Sổ địa chỉ giao hàng (cùng doc cart-address-fe.md)
  'getAddresses', 'createAddress', 'updateAddress', 'deleteAddress', 'setDefaultAddress',
  // Module Order + Checkout (docs/order-checkout-fe.md) + tra cứu coupon (promotions-admin-fe.md)
  'checkout', 'getOrders', 'getOrder', 'cancelOrder', 'getAvailableVouchers', 'submitContact',
  // BE-07 xem trước · BE-08 báo giá số lượng lớn + VAT
  'previewOrder', 'markVatIssued',
  'createBulkQuote', 'getMyBulkQuotes', 'getBulkQuote', 'acceptBulkQuote', 'rejectBulkQuote', 'cancelBulkQuote',
  'getSupplierBulkQuotes', 'offerBulkQuote', 'declineBulkQuote',
  // Xử lý đơn (supplier/admin) + CRUD khuyến mãi + cấu hình ship (docs/promotions-admin-fe.md)
  'getSupplierOrders', 'updateSupplierOrderStatus', 'getAdminOrders', 'updateAdminOrderStatus',
  'getPromotions', 'getPromotion', 'createPromotion', 'updatePromotion', 'deletePromotion',
  'getShippingConfig', 'updateShippingConfig',
]);

/*
 * Lớp chuyển đổi shape: BE trả phẳng AuthResponse
 *   { token, refreshToken, tokenType, userId, email, fullName, role, customerType, supplierType, mustChangePassword }
 * còn toàn bộ FE (authStore, các page) dùng { token, refreshToken, user: { id, name, email, role, ... } }.
 * Gom về đúng 1 chỗ này để không phải sửa UI khi shape BE khác mock.
 * (Trước đây hàm này chỉ lấy 4 field — bỏ mất refreshToken/customerType/mustChangePassword nên
 * không thể làm refresh-token flow hay bắt supplier đổi mật khẩu lần đầu. Đã bổ sung đủ.)
 * supplierType (BE-0): 'retailer' | 'workshop' | null (customer/admin/supplier-chưa-có-hồ-sơ).
 * redirectPathForRole (utils/auth.js) dùng field này để tách 2 portal — THIẾU field này thì mọi
 * supplier (kể cả workshop) đều rơi vào nhánh else và bị đẩy nhầm sang portal retailer.
 */
const toAuthResult = (data) => ({
  token: data.token,
  refreshToken: data.refreshToken,
  user: {
    id: data.userId,
    name: data.fullName,
    email: data.email,
    role: data.role,
    customerType: data.customerType,
    supplierType: data.supplierType ?? null,
    mustChangePassword: data.mustChangePassword ?? false,
  },
});

// timeout dài (60s) vì Render free-tier "ngủ" khi không có request — lần gọi đầu sau khi ngủ
// có thể mất 30-60s để container khởi động lại. 10s cũ quá ngắn, khiến request bị coi là lỗi
// kết nối dù BE chỉ đang khởi động (không phải bug — user vẫn phải đợi, chỉ là không báo lỗi sai).
// Gửi tin AI: BE phải đánh thức thêm service Python AI (cũng Render free) nên có thể > 60s lúc cold start
const AI_CHAT_TIMEOUT_MS = 150_000;

export const http = axios.create({ baseURL: BASE_URL, timeout: 60_000 });

/*
 * Interceptor = "middleware" của axios: chạy trước mỗi request.
 * Ở đây dùng để tự đính JWT vào header Authorization — viết 1 lần, mọi request đều có,
 * thay vì lặp lại ở từng chỗ gọi API.
 */
/*
 * Refresh access token — dùng chung cho 2 chỗ: (1) chủ động trước request khi token sắp hết hạn, (2) dự phòng khi
 * request bị 401. refreshRequest gom mọi lời gọi cùng lúc thành 1 lần /auth/refresh duy nhất (không cấp thừa
 * refresh token khi nhiều request song song cùng cần refresh).
 */
let refreshRequest = null;
function refreshAccessToken() {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) return Promise.reject(new Error('NO_REFRESH_TOKEN'));
  refreshRequest ??= http.post('/auth/refresh', { refreshToken })
    .then(({ data }) => {
      const result = toAuthResult(data);
      useAuthStore.getState().setAuth(result);
      return result.token;
    })
    .finally(() => { refreshRequest = null; });
  return refreshRequest;
}

// Thời điểm hết hạn (ms) đọc từ claim `exp` của JWT; token không phải JWT (mock) / hỏng → null
function tokenExpiresAt(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}
// Refresh sớm hơn hạn một chút: bù lệch đồng hồ máy khách + thời gian request đi tới BE (Render có thể chậm)
const EXPIRY_SKEW_MS = 30_000;

/*
 * Request interceptor: đính JWT vào header. Token sắp/đã hết hạn (access token sống 15 phút) → refresh TRƯỚC rồi
 * mới gửi. Trước đây gửi luôn token hết hạn → mọi request đầu tiên sau 15 phút đều 401 (2 dòng đỏ trong console
 * ở Checkout: /cart + /addresses) rồi mới refresh và gửi lại → chậm thêm 1 vòng request. Refresh chủ động lỗi thì
 * vẫn gửi request với token cũ, để response interceptor bên dưới xử lý 401 như trước (dự phòng).
 */
http.interceptors.request.use(async (config) => {
  let { token } = useAuthStore.getState();
  const isAuthEndpoint = config.url?.startsWith('/auth/');
  const expiresAt = token && !isAuthEndpoint ? tokenExpiresAt(token) : null;
  if (expiresAt && expiresAt - Date.now() < EXPIRY_SKEW_MS && useAuthStore.getState().refreshToken) {
    try {
      token = await refreshAccessToken();
    } catch {
      // bỏ qua — response interceptor sẽ thử lại / đăng xuất khi BE trả 401
    }
  }
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/*
 * 401 (token hết hạn) → thử refresh 1 lần rồi gửi lại đúng request cũ, thay vì logout ngay.
 * Lý do dùng cách "lazy" này (bắt lỗi mới refresh) thay vì tự đặt hẹn giờ 15 phút:
 * request có thể fail bất cứ lúc nào (không đúng mốc 15 phút), và nếu user không thao tác gì
 * thì hẹn giờ sẽ refresh thừa — bắt đúng lúc cần mới refresh sẽ chính xác và tiết kiệm hơn.
 *
 * originalRequest._retry: cờ đánh dấu "đã thử refresh cho request này rồi" để KHÔNG retry vô hạn
 * nếu refresh xong mà request vẫn 401 (token thật sự không hợp lệ).
 * (Từ 21/10 request interceptor đã refresh chủ động khi token sắp hết hạn — nhánh 401 này còn lại làm dự phòng,
 * vd đồng hồ máy khách lệch nhiều hoặc BE thu hồi token sớm.)
 *
 * CHỈ bắt 401. Trước đây bắt cả 403 vì BE từng trả 403 cho token hết hạn — BE đã sửa (dd9c087 AUD-015 +
 * 08c7b61): token hết hạn/sai/malformed bị coi là chưa đăng nhập → AuthenticationEntryPoint trả 401; endpoint
 * permitAll (vd /products/mine) cũng tự trả 401 ở service. 403 giờ chỉ còn nghĩa "đủ token nhưng thiếu quyền"
 * → không refresh (refresh cũng không giúp gì), trả lỗi thẳng cho màn hình xử lý.
 */
/*
 * Tài khoản bị admin khoá (BE-11): token còn hạn vẫn bị chặn ở MỌI API → 403 errorCode USER_LOCKED, refresh token
 * cũng bị thu hồi. Không đăng xuất thì user kẹt ở trang lỗi liên tục → xoá phiên, lưu lý do, tải lại về /login
 * (tải lại thay vì navigate: cùng lý do useLogout — xoá sạch cache/chat/socket của tài khoản).
 * Bỏ qua khi đang ở /login: lỗi khoá lúc đăng nhập do chính trang Login hiển thị (có params.reason).
 */
function handleUserLocked(error) {
  if (!isUserLocked(error) || window.location.pathname === '/login') return;
  markAccountLocked(error.response.data?.params?.reason);
  useAuthStore.getState().logout();
  window.location.replace('/login');
}

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    const isAuthEndpoint = originalRequest?.url?.startsWith('/auth/');
    const status = error.response?.status;
    handleUserLocked(error);
    if (status !== 401 || originalRequest._retry || isAuthEndpoint) {
      if (status === 401) useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    if (!useAuthStore.getState().refreshToken) {
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    try {
      const newToken = await refreshAccessToken();
      originalRequest.headers.Authorization = `Bearer ${newToken}`;
      return http(originalRequest);
    } catch (refreshError) {
      useAuthStore.getState().logout();
      return Promise.reject(refreshError);
    }
  }
);

/*
 * api: object mà toàn bộ app gọi. Mỗi hàm map 1-1 với 1 endpoint của BE.
 * USE_MOCK=true → trả dữ liệu giả (có delay giả lập mạng); false → gọi BE thật.
 */
async function call(realCall, mockKey, ...args) {
  // Dùng mock nếu bật cờ mock, HOẶC endpoint này chưa có BE thật (xem REAL_ENDPOINTS)
  if (USE_MOCK || !REAL_ENDPOINTS.has(mockKey)) return mockAdapter[mockKey](...args);
  const res = await realCall(...args);
  return res.data;
}

export const api = {
  // ===== AUTH (đã gắn BE thật — Spring Boot /api/auth) =====
  /*
   * POST /auth/register
   * BE nhận { email, password, fullName, phone, customerType?, companyName?, taxCode?, companyAddress? }.
   * customerType bỏ trống = 'individual'. 3 field companyName/taxCode/companyAddress chỉ áp dụng
   * khi customerType='business' (BE validate ở service, không bắt buộc ở DTO).
   * LUÔN tạo role = customer, gửi OTP về email. register KHÔNG trả token — chỉ { message },
   * phải qua verifyOtp mới có token.
   */
  register: async (body) => {
    if (USE_MOCK) return mockAdapter.register(body);
    const res = await http.post('/auth/register', {
      email: body.email,
      password: body.password,
      fullName: body.name,
      phone: body.phone,
      customerType: body.customerType,
      companyName: body.companyName,
      taxCode: body.taxCode,
      companyAddress: body.companyAddress,
    });
    return res.data; // { message }
  },
  /*
   * POST /auth/verify-otp  body: { email, code(6 số) }
   * Xác thực email thành công → BE trả { token, userId, email, fullName, role } → đổi về { token, user }.
   */
  verifyOtp: async (body) => {
    if (USE_MOCK) return mockAdapter.verifyOtp(body);
    const res = await http.post('/auth/verify-otp', { email: body.email, code: body.code });
    return toAuthResult(res.data);
  },
  // POST /auth/resend-otp  body: { email } → { message } (BE giới hạn gửi lại mỗi 60s)
  resendOtp: async (body) => {
    if (USE_MOCK) return mockAdapter.resendOtp(body);
    const res = await http.post('/auth/resend-otp', { email: body.email });
    return res.data;
  },
  /*
   * POST /auth/login  body: { email, password }
   * Trả { token, userId, email, fullName, role } → đổi về { token, user }.
   * BE chặn nếu email chưa xác thực (403) — FE bắt lỗi này để chuyển sang màn nhập OTP.
   */
  login: async (body) => {
    if (USE_MOCK) return mockAdapter.login(body);
    const res = await http.post('/auth/login', { email: body.email, password: body.password });
    return toAuthResult(res.data);
  },
  /*
   * POST /auth/google  body: { idToken } (ID token lấy từ Google Identity Services)
   * BE verify token, tạo/liên kết tài khoản → trả { token, userId, email, fullName, role }.
   */
  loginWithGoogle: async (body) => {
    if (USE_MOCK) return mockAdapter.loginWithGoogle(body);
    const res = await http.post('/auth/google', { idToken: body.idToken });
    return toAuthResult(res.data);
  },
  // POST /auth/forgot-password  body: { email } → { message } (gửi OTP đặt lại mật khẩu về email)
  forgotPassword: async (body) => {
    if (USE_MOCK) return mockAdapter.forgotPassword(body);
    const res = await http.post('/auth/forgot-password', { email: body.email });
    return res.data;
  },
  // POST /auth/reset-password  body: { email, code, newPassword } → { message }
  resetPassword: async (body) => {
    if (USE_MOCK) return mockAdapter.resetPassword(body);
    const res = await http.post('/auth/reset-password', { email: body.email, code: body.code, newPassword: body.newPassword });
    return res.data;
  },
  /*
   * POST /auth/logout  body: { refreshToken } → { message } (BE thu hồi refresh token).
   * Cố ý KHÔNG throw nếu lỗi ở nơi gọi (xem hooks/useLogout.js) — logout ở FE luôn phải
   * thành công (xoá state local) dù request BE có lỗi mạng hay không.
   */
  logout: async (body) => {
    if (USE_MOCK) return mockAdapter.logout(body);
    const res = await http.post('/auth/logout', { refreshToken: body.refreshToken });
    return res.data;
  },
  /*
   * PUT /api/users/{id}/password  body: { currentPassword, newPassword } → 204 No Content.
   * Thuộc Module User (không phải Auth) nhưng cần ngay ở đây để làm luồng "đổi mật khẩu bắt
   * buộc" khi mustChangePassword=true (tài khoản supplier do admin tạo) — xem ChangePasswordRequired.jsx.
   */
  changePassword: async ({ id, ...body }) => {
    if (USE_MOCK) return mockAdapter.changePassword({ id, ...body });
    await http.put(`/users/${id}/password`, { currentPassword: body.currentPassword, newPassword: body.newPassword });
    return { message: 'ok' };
  },

  // ===== USER (thông tin tài khoản đang đăng nhập — pages/Profile.jsx) =====
  // GET /api/users/me → UserResponse { id, email, fullName, phone, role, customerType, createdAt, updatedAt }
  getMe: () => call(() => http.get('/users/me'), 'getMe'),
  /*
   * Hồ sơ doanh nghiệp (thông tin xuất VAT) — /api/users/me/business-profile.
   * GET: 404 khi chưa có hồ sơ (khách cá nhân). POST tạo mới VÀ BE tự nâng customerType → business;
   * 409 nếu đã có. PUT ghi đè cả 3 field. Body: { companyName*, taxCode* (≤20), companyAddress* }.
   */
  getBusinessProfile: () => call(() => http.get('/users/me/business-profile'), 'getBusinessProfile'),
  createBusinessProfile: (body) => call(() => http.post('/users/me/business-profile', body), 'createBusinessProfile', body),
  updateBusinessProfile: (body) => call(() => http.put('/users/me/business-profile', body), 'updateBusinessProfile', body),
  // PUT /api/users/{id}  body: { fullName, phone } (BE chỉ nhận đúng 2 field này, KHÔNG đổi được email)
  // Dùng chung cho cả tự sửa hồ sơ (Profile.jsx) LẪN admin sửa hộ user khác (Portal Quản trị) — cùng 1 endpoint.
  updateUser: ({ id, ...body }) =>
    call(() => http.put(`/users/${id}`, { fullName: body.fullName, phone: body.phone }), 'updateUser', { id, ...body }),

  /*
   * ===== USER (quản trị — Portal Quản trị /admin/users) — CHỈ ADMIN =====
   * GET /users KHÔNG có filter/search (chỉ Pageable) — cố tình KHÔNG thêm ô tìm kiếm tự do ở UI,
   * tránh filter client-side trên 1 trang gây hiểu nhầm kết quả.
   */
  // GET /users?page=&size= → Page<UserResponse> — chỉ admin
  getAdminUsers: (params) => call(() => http.get('/users', { params }), 'getAdminUsers', params),
  // GET /users/{id} → UserResponse — chính chủ hoặc admin
  getAdminUserDetail: (id) => call(() => http.get(`/users/${id}`), 'getAdminUserDetail', id),
  // DELETE /users/{id} — chỉ admin. XOÁ CỨNG (hard delete), BE không có cơ chế khoá/mở khoá user thường
  // (đã ghi nhận ở Pha 0A — "API khóa user — chờ BE bổ sung", ngoài phạm vi module này).
  deleteUser: (id) => call(() => http.delete(`/users/${id}`), 'deleteUser', id),
  /*
   * PUT /users/:id/status { status: 'locked'|'active', reason? ≤ 500 } → UserResponse (+ status, lockedReason, lockedAt).
   * Khoá có hiệu lực NGAY (request kế tiếp của user → 403 USER_LOCKED, thu hồi mọi refresh token). 409 CANNOT_LOCK_ADMIN.
   */
  setUserStatus: ({ id, status, reason }) => call(() => http.put('/users/' + id + '/status', { status, reason }), 'setUserStatus', { id, status, reason }),
  /*
   * GET /admin/reviews?targetType=&rating=&hidden=&page=&size= → Page { id, targetType, targetId, targetName, rating, comment,
   * anonymous, author: { id, fullName, email } (admin luôn thấy người viết thật), hidden, hiddenReason, hiddenAt, createdAt }
   */
  getAdminReviews: (params) => call(() => http.get('/admin/reviews', { params }), 'getAdminReviews', params),
  // PATCH /admin/reviews/:id { hidden, reason? } — ẩn thì không hiện công khai + không tính điểm TB; hiện lại được
  moderateReview: ({ id, hidden, reason }) => call(() => http.patch('/admin/reviews/' + id, { hidden, reason }), 'moderateReview', { id, hidden, reason }),
  // DELETE /admin/reviews/:id → 204 (xoá vĩnh viễn — nên ưu tiên Ẩn)
  deleteAdminReview: (id) => call(() => http.delete('/admin/reviews/' + id), 'deleteAdminReview', id),
  // GET /admin/orders/refunds/pending?page=&size= → Page<OrderResponse> đã trả tiền + bị huỷ + chưa hoàn (huỷ sớm nhất trước)
  getPendingRefunds: (params) => call(() => http.get('/admin/orders/refunds/pending', { params }), 'getPendingRefunds', params),
  /*
   * POST /admin/orders/:id/refund { reference* ≤ 100 (mã GD ngân hàng), amount? (bỏ trống = toàn bộ), note? } → OrderResponse (+ refund)
   * 400 REFUND_AMOUNT_INVALID · 409 ORDER_NOT_REFUNDABLE / ORDER_ALREADY_REFUNDED
   */
  confirmRefund: ({ id, ...body }) => call(() => http.post('/admin/orders/' + id + '/refund', body), 'confirmRefund', { id, ...body }),
  // GET /admin/contacts?status=new|handled|spam&keyword=&page=&size= → Page<ContactResponse>
  getAdminContacts: (params) => call(() => http.get('/admin/contacts', { params }), 'getAdminContacts', params),
  // PATCH /admin/contacts/:id { status: new|handled|spam } → ContactResponse
  updateContactStatus: ({ id, status }) => call(() => http.patch('/admin/contacts/' + id, { status }), 'updateContactStatus', { id, status }),
  // GET /admin/suppliers/:id/payout → như /suppliers/me/payout nhưng accountNumber ĐẦY ĐỦ (mỗi lần xem BE ghi nhật ký)
  getAdminSupplierPayout: (id) => call(() => http.get('/admin/suppliers/' + id + '/payout'), 'getAdminSupplierPayout', id),

  /*
   * ===== PRODUCTS (B2C catalog công khai — /shop, /product/:id) — FE-4 =====
   * GET /products?keyword=&categoryId=&materialId=&minPrice=&maxPrice=&room=&style=&available=&
   * has3d=&customizable=&sort=&page=&size= → Page<ProductSummaryResponse>
   * { id,supplierId,supplierName,categoryId,categoryName,materialName,name,status,priceFrom,
   *   primaryImageUrl,createdAt }. room/style luôn rỗng tới khi BE-7 seed dữ liệu (xem FE-5).
   * sort hỗ trợ 'name,asc|desc' và 'createdAt,asc|desc' — 'priceFrom,*' đang lỗi 500 ở BE (đã báo).
   */
  getProducts: (params) => call(() => http.get('/products', { params }), 'getProducts', params),
  // GET /products/:id → ProductResponse { ...ProductSummaryResponse trừ priceFrom/primaryImageUrl,
  // + description,materialId,updatedAt, variants:[{id,sku,color,dimensions,price,...}], images:[{id,url,primary,sortOrder,...}] }
  getProduct: (id) => call(() => http.get(`/products/${id}`), 'getProduct', id),

  // ===== CATEGORY / MATERIAL (bảng tham chiếu — GET công khai; tạo/sửa/xoá chỉ admin, xem Portal Quản trị) =====
  // GET /categories → CategoryResponse[] { id, parentId, parentName, name, slug, createdAt } (danh sách phẳng)
  getCategories: () => call(() => http.get('/categories'), 'getCategories'),
  // GET /categories/tree → CategoryTreeResponse[] { id, name, slug, createdAt, children[] } (đã dựng cây — BE tự build, FE không cần buildTree)
  getCategoryTree: () => call(() => http.get('/categories/tree'), 'getCategoryTree'),
  // POST /categories  body: { name*, slug?, parentId? } → CategoryResponse, 201 — chỉ admin
  createCategory: (body) => call(() => http.post('/categories', body), 'createCategory', body),
  // PUT /categories/{id}  body: giống POST — chỉ admin
  updateCategory: ({ id, ...body }) => call(() => http.put(`/categories/${id}`, body), 'updateCategory', { id, ...body }),
  // DELETE /categories/{id} — chỉ admin. Có thể 409/500 nếu danh mục đang có sản phẩm gắn vào (xem TestCase.md)
  deleteCategory: (id) => call(() => http.delete(`/categories/${id}`), 'deleteCategory', id),
  // GET /materials → MaterialResponse[] { id, name, createdAt } — BE không phân trang
  getMaterials: () => call(() => http.get('/materials'), 'getMaterials'),
  // POST /materials  body: { name* (max100) } → MaterialResponse, 201 — chỉ admin. 409 nếu tên trùng
  createMaterial: (body) => call(() => http.post('/materials', body), 'createMaterial', body),
  // PUT /materials/{id}  body: { name* } — chỉ admin. 404/409
  updateMaterial: ({ id, ...body }) => call(() => http.put(`/materials/${id}`, body), 'updateMaterial', { id, ...body }),
  // DELETE /materials/{id} — chỉ admin. AN TOÀN khi đang có sản phẩm dùng (BE tự SET NULL, không lỗi)
  deleteMaterial: (id) => call(() => http.delete(`/materials/${id}`), 'deleteMaterial', id),

  /*
   * ===== ROOM / STYLE (BE-7, mục 3.2 api-guide-fe.md) — bảng tham chiếu công khai, KHÔNG phân trang.
   * Dùng cho filter "Phòng"/"Phong cách" ở Shop (FE-4) và trang Shop by Room (FE-5).
   * ⚠️ Curl xác nhận (2026-07-19): 2 endpoint chạy đúng nhưng CHƯA có dữ liệu (BE chưa seed
   * rooms/scenes — đúng như docs/be-0-to-be-8-summary.md BE-7 đã ghi chú) → mảng rỗng, KHÔNG
   * phải lỗi FE. Sidebar Shop tự ẩn nhóm filter này khi danh sách rỗng thay vì hiện ô trống.
   */
  // GET /rooms → RoomResponse[] { id, name, slug, sortOrder }
  getRooms: () => call(() => http.get('/rooms'), 'getRooms'),
  // GET /rooms/:slug → RoomResponse — chi tiết 1 phòng (dùng cho breadcrumb/tiêu đề trang scene)
  getRoomBySlug: (slug) => call(() => http.get(`/rooms/${slug}`), 'getRoomBySlug', slug),
  // GET /rooms/:slug/scenes → RoomSceneSummaryResponse[] { id,name,slug,backgroundImageUrl,sortOrder }
  getRoomScenes: (slug) => call(() => http.get(`/rooms/${slug}/scenes`), 'getRoomScenes', slug),
  /*
   * GET /room-scenes/:id → RoomSceneResponse (CHỈ scene đã publish; hotspot chỉ gồm SP đang bán):
   * { id, room:{id,name,slug,sortOrder}, name, slug, backgroundImageUrl,
   *   items: [{ id, xPercent, yPercent, displayOrder, product: ProductSummaryResponse }] }
   * Hotspot toạ độ % (0..100) — đặt bằng CSS left/top, KHÔNG hardcode toạ độ ở FE (FE-5).
   */
  getRoomSceneDetail: (id) => call(() => http.get(`/room-scenes/${id}`), 'getRoomSceneDetail', id),
  // GET /styles → StyleResponse[] { id, name, slug, sortOrder }
  getStyles: () => call(() => http.get('/styles'), 'getStyles'),

  /*
   * ===== PRODUCT (Portal Nhà cung cấp tự quản lý sản phẩm — /portal/supplier/products) =====
   * 1 sản phẩm có NHIỀU variant (mỗi variant 1 giá riêng) + NHIỀU ảnh riêng — khác hẳn mock cũ
   * (1 SP = 1 giá/1 ảnh). Luồng tạo: POST /products (kèm variants ngay trong request) → lấy id
   * → upload ảnh tuần tự (xem uploadProductImage) → (tuỳ chọn) PATCH status='active'.
   */
  // POST /products  body: CreateProductRequest { name, description, categoryId, materialId?, status?, variants?[] }
  createProduct: (body) => call(() => http.post('/products', body), 'createProduct', body),
  // GET /products/mine?status=&page=&size= → Page<ProductSummaryResponse> (mọi trạng thái, chỉ SP của tôi)
  getMyProducts: (params) => call(() => http.get('/products/mine', { params }), 'getMyProducts', params),
  // GET /products/{id} → ProductResponse (kèm variants[] + images[]) — xem ghi chú ở REAL_ENDPOINTS
  getMyProductDetail: (id) => call(() => http.get(`/products/${id}`), 'getMyProductDetail', id),
  // PUT /products/{id}  body: UpdateProductRequest { name, description, categoryId, materialId? }
  updateProduct: ({ id, ...body }) => call(() => http.put(`/products/${id}`, body), 'updateProduct', { id, ...body }),
  // PATCH /products/{id}/status  body: { status: 'draft'|'active'|'hidden' }
  updateProductStatus: ({ id, status }) => call(() => http.patch(`/products/${id}/status`, { status }), 'updateProductStatus', { id, status }),
  // DELETE /products/{id} — xoá kèm variants + ảnh
  deleteProduct: (id) => call(() => http.delete(`/products/${id}`), 'deleteProduct', id),

  // ===== PRODUCT VARIANT =====
  // POST /products/{productId}/variants  body: { sku?, color?, dimensions?, price }
  createVariant: ({ productId, ...body }) => call(() => http.post(`/products/${productId}/variants`, body), 'createVariant', { productId, ...body }),
  getVariants: (productId) => call(() => http.get(`/products/${productId}/variants`), 'getVariants', productId),
  updateVariant: ({ variantId, ...body }) => call(() => http.put(`/variants/${variantId}`, body), 'updateVariant', { variantId, ...body }),
  deleteVariant: (variantId) => call(() => http.delete(`/variants/${variantId}`), 'deleteVariant', variantId),

  /*
   * ===== PRODUCT IMAGE =====
   * uploadProductImage KHÔNG đi qua call() vì cần multipart/form-data (FormData), khác hẳn
   * JSON body của các hàm khác — xử lý tường minh giống nhóm Auth.
   * 3 nguyên lý bất biến (BE tự đảm bảo, FE không tự tính lại):
   *  a) set 1 ảnh primary → BE tự gỡ primary ảnh cũ (chỉ cần PATCH đúng 1 lần).
   *  b) ảnh đầu tiên tự động thành primary dù không gửi `primary=true`.
   *  c) sortOrder bỏ trống → BE tự đẩy xuống cuối (max hiện tại + 1).
   */
  uploadProductImage: async ({ productId, file, primary, sortOrder }) => {
    if (USE_MOCK) return mockAdapter.uploadProductImage({ productId, file, primary, sortOrder });
    const form = new FormData();
    form.append('file', file);
    if (primary != null) form.append('primary', String(primary));
    if (sortOrder != null) form.append('sortOrder', String(sortOrder));
    const res = await http.post(`/products/${productId}/images/upload`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  // GET /products/{productId}/images → ProductImageResponse[] đã sắp sẵn (primary trước, rồi sortOrder) — KHÔNG cần sort lại ở FE
  getProductImages: (productId) => call(() => http.get(`/products/${productId}/images`), 'getProductImages', productId),
  // PATCH /images/{imageId}/primary — không có body
  setPrimaryImage: (imageId) => call(() => http.patch(`/images/${imageId}/primary`), 'setPrimaryImage', imageId),
  // PUT /images/{imageId}  body: { url, sortOrder } — url bắt buộc, KHÔNG đổi được primary qua đây (dùng setPrimaryImage)
  updateProductImage: ({ imageId, ...body }) => call(() => http.put(`/images/${imageId}`, body), 'updateProductImage', { imageId, ...body }),
  deleteProductImage: (imageId) => call(() => http.delete(`/images/${imageId}`), 'deleteProductImage', imageId),

  /*
   * ===== STORE (Portal Nhà cung cấp tự quản lý CHI NHÁNH — /portal/supplier/branches) =====
   * 1 nhà cung cấp có thể có NHIỀU chi nhánh (Store). `supplierType` do BE tự gán theo supplier
   * đang đăng nhập — KHÔNG gửi lên khi tạo/sửa (không có field này trong CreateStoreRequest).
   */
  // POST /stores  body: CreateStoreRequest { address, ward?, district?, city?, latitude?, longitude?, phone? }
  createStore: (body) => call(() => http.post('/stores', body), 'createStore', body),
  // GET /stores → StoreResponse[] (chỉ chi nhánh của supplier đang đăng nhập)
  getMyStores: () => call(() => http.get('/stores'), 'getMyStores'),
  // PUT /stores/{id}  body: UpdateStoreRequest (cùng shape CreateStoreRequest)
  updateStore: ({ id, ...body }) => call(() => http.put(`/stores/${id}`, body), 'updateStore', { id, ...body }),
  // DELETE /stores/{id}
  deleteStore: (id) => call(() => http.delete(`/stores/${id}`), 'deleteStore', id),

  /*
   * ===== STORE INVENTORY (tồn kho theo cặp CHI NHÁNH × BIẾN THỂ — không có id riêng, khoá kép) =====
   * addStock chỉ dùng để thêm 1 biến thể MỚI vào kho chi nhánh (BE trả 409 nếu biến thể đã có
   * trong kho đó). Muốn đổi số lượng của biến thể đã có → LUÔN dùng adjustStock theo delta
   * (dương = nhập kho, âm = xuất kho); BE tự chặn xuống âm, FE không tự trừ/kiểm tra lại.
   */
  // GET /stores/{storeId}/inventory → StoreInventoryResponse[]
  getStoreInventory: (storeId) => call(() => http.get(`/stores/${storeId}/inventory`), 'getStoreInventory', storeId),
  // POST /stores/{storeId}/inventory/{variantId}  body: { stockQuantity } — 409 nếu biến thể đã có trong kho chi nhánh này
  addStock: ({ storeId, variantId, stockQuantity }) =>
    call(() => http.post(`/stores/${storeId}/inventory/${variantId}`, { stockQuantity }), 'addStock', { storeId, variantId, stockQuantity }),
  // PATCH /stores/{storeId}/inventory/{variantId}  body: { delta } — 404 nếu biến thể chưa có trong kho (phải addStock trước)
  adjustStock: ({ storeId, variantId, delta }) =>
    call(() => http.patch(`/stores/${storeId}/inventory/${variantId}`, { delta }), 'adjustStock', { storeId, variantId, delta }),
  // DELETE /stores/{storeId}/inventory/{variantId}
  deleteStock: ({ storeId, variantId }) =>
    call(() => http.delete(`/stores/${storeId}/inventory/${variantId}`), 'deleteStock', { storeId, variantId }),
  // GET /variants/{variantId}/inventory → VariantInventoryResponse { variantId, totalStock, stores: StoreInventoryResponse[] } (tổng hợp mọi chi nhánh)
  getVariantInventory: (variantId) => call(() => http.get(`/variants/${variantId}/inventory`), 'getVariantInventory', variantId),

  /*
   * ===== CHAT (hội thoại khách hàng ↔ nhà cung cấp) =====
   * Các hàm dưới đây là REST thuần — dùng để KHỞI TẠO hội thoại + tải LỊCH SỬ tin nhắn.
   * Tin nhắn REALTIME (gửi/nhận khi đang mở chat) đi qua STOMP/WebSocket riêng
   * (xem services/chatSocket.js), KHÔNG qua đây — sendMessage() ở đây chỉ là fallback REST
   * khi socket chưa kết nối được (mất mạng WS, trình duyệt chặn...).
   */
  // POST /conversations  body: StartConversationRequest { supplierId, productId? } → ConversationResponse
  // Idempotent theo cặp (customer, supplier) — gọi lại nhiều lần trả về ĐÚNG 1 hội thoại đã có, không tạo trùng.
  startConversation: (body) => call(() => http.post('/conversations', body), 'startConversation', body),
  // GET /conversations?role=customer|supplier&page=&size= → Page<ConversationResponse>
  getConversations: (params) => call(() => http.get('/conversations', { params }), 'getConversations', params),
  // GET /conversations/{conversationId}/messages?page=&size= → Page<ChatMessageResponse> (MỚI NHẤT TRƯỚC — FE tự đảo khi hiển thị)
  getMessages: ({ conversationId, ...params }) =>
    call(() => http.get(`/conversations/${conversationId}/messages`, { params }), 'getMessages', { conversationId, ...params }),
  // POST /conversations/{conversationId}/messages  body: SendMessageRequest { content?, attachmentUrl? } → ChatMessageResponse
  sendMessage: ({ conversationId, ...body }) =>
    call(() => http.post(`/conversations/${conversationId}/messages`, body), 'sendMessage', { conversationId, ...body }),
  // POST /conversations/{conversationId}/read — 204, không body — đánh dấu đã đọc tới hiện tại
  markAsRead: (conversationId) => call(() => http.post(`/conversations/${conversationId}/read`), 'markAsRead', conversationId),
  // GET /users/{id}/presence → PresenceResponse { userId, online, lastSeenAt } — id ở đây LUÔN là USER id
  // (phía supplier phải dùng conversation.supplierUserId, KHÔNG phải supplierId — 2 id khác nhau).
  getPresence: (userId) => call(() => http.get(`/users/${userId}/presence`), 'getPresence', userId),

  /*
   * ===== CART — giỏ hàng server-side (/api/cart, cần đăng nhập) =====
   * Mỗi user đúng 1 giỏ. MỌI endpoint đều trả về TOÀN BỘ CartResponse
   * { id, items: CartItemResponse[], totalItems, totalQuantity, subtotal, updatedAt }
   * → hook chỉ cần ghi đè cache bằng response, không phải gọi lại GET (xem hooks/useCart.js).
   */
  // GET /cart — tự tạo giỏ rỗng nếu chưa có
  getCart: () => call(() => http.get('/cart'), 'getCart'),
  // POST /cart/items  body: { variantId, quantity 1..999 } — biến thể đã có trong giỏ thì CỘNG DỒN. 404 không có biến thể, 409 SP ngừng bán
  addCartItem: (body) => call(() => http.post('/cart/items', body), 'addCartItem', body),
  // PUT /cart/items/:itemId  body: { quantity } — GHI ĐÈ. itemId là id DÒNG giỏ (CartItemResponse.id), KHÔNG phải variantId
  updateCartItem: ({ itemId, quantity }) =>
    call(() => http.put(`/cart/items/${itemId}`, { quantity }), 'updateCartItem', { itemId, quantity }),
  // DELETE /cart/items/:itemId — xoá 1 dòng
  removeCartItem: (itemId) => call(() => http.delete(`/cart/items/${itemId}`), 'removeCartItem', itemId),
  // DELETE /cart — xoá sạch giỏ
  clearCart: () => call(() => http.delete('/cart'), 'clearCart'),

  /*
   * ===== ADDRESSES — sổ địa chỉ giao hàng (/api/addresses, cần đăng nhập) =====
   * Body tạo/sửa: { recipientName*, recipientPhone*, addressLine*, ward?, district?, city*,
   * latitude?, longitude?, isDefault? }. Response UserAddressResponse có thêm `hasCoordinates`
   * (true khi đủ lat+lng) — checkout BẮT BUỘC địa chỉ có toạ độ để BE tính phí ship.
   * BE tự giữ bất biến "tối đa 1 địa chỉ mặc định" (địa chỉ đầu tiên tự thành mặc định, xoá
   * mặc định thì tự đề bạt địa chỉ mới nhất) → FE chỉ cần refetch danh sách sau mỗi thay đổi.
   */
  // GET /addresses → UserAddressResponse[] (mặc định đứng đầu, rồi mới nhất trước)
  getAddresses: () => call(() => http.get('/addresses'), 'getAddresses'),
  // POST /addresses → 201 UserAddressResponse
  createAddress: (body) => call(() => http.post('/addresses', body), 'createAddress', body),
  // PUT /addresses/:id → UserAddressResponse
  updateAddress: ({ id, ...body }) => call(() => http.put(`/addresses/${id}`, body), 'updateAddress', { id, ...body }),
  // DELETE /addresses/:id → 204
  deleteAddress: (id) => call(() => http.delete(`/addresses/${id}`), 'deleteAddress', id),
  // PATCH /addresses/:id/default → UserAddressResponse (chính địa chỉ đó)
  setDefaultAddress: (id) => call(() => http.patch(`/addresses/${id}/default`), 'setDefaultAddress', id),

  /*
   * ===== ORDERS — đặt hàng từ giỏ (docs/order-checkout-fe.md của BE) =====
   * BE TỰ làm hết phần nghiệp vụ: tách giỏ thành N đơn theo supplier, chọn chi nhánh gần điểm giao
   * nhất, tính phí ship theo khoảng cách, áp coupon, tạo 1 payment chung (1 QR) và xoá giỏ.
   * FE chỉ gửi "giao ở đâu" + ghi chú + voucher đã chọn (promotionIds) — KHÔNG gửi giá/phí ship (never trust the client).
   */
  // POST /orders/checkout  body: { addressId } | { recipientName, recipientPhone, addressLine, ward?, district?, city, latitude, longitude, locationSource?, saveAddress? }
  //   + { note?, promotionIds? } → 201 CheckoutResponse { orders: OrderResponse[], payment: PaymentResponse, grandTotal }
  checkout: (body) => call(() => http.post('/orders/checkout', body), 'checkout', body),
  /*
   * POST /orders/preview (BE-07) — body giống checkout { addressId, promotionIds } → { groups[] (mỗi NCC 1 đơn: subtotal,
   * shippingFee, productDiscount, shippingDiscount, total, appliedVouchers, amountToFreeShip), subtotal, shippingFee,
   * discount, grandTotal, couponErrors[], unavailableItems[] }. KHÔNG tạo đơn / trừ voucher → gọi bao nhiêu lần cũng được.
   */
  previewOrder: (body) => call(() => http.post('/orders/preview', body), 'previewOrder', body),
  // PUT /supplier/orders/:id/vat-invoice { invoiceNumber, invoiceUrl? } — NCC ghi nhận đã xuất hoá đơn VAT (gửi lại = sửa)
  markVatIssued: ({ id, ...body }) => call(() => http.put('/supplier/orders/' + id + '/vat-invoice', body), 'markVatIssued', { id, ...body }),

  /*
   * ===== BÁO GIÁ SỐ LƯỢNG LỚN (BE-08, docs BE b2b-bulk-quote-vat-fe.md) =====
   * Luồng: khách DN gửi (pending) → NCC báo giá (offered, gửi lại = thay) → khách chấp nhận (accepted → 1 đơn QR)
   * | khách từ chối (rejected) | NCC từ chối (declined) | khách huỷ (cancelled) | 7 ngày chưa báo giá (expired).
   */
  // POST /bulk-quotes { items: [{ variantId, quantity }], addressId, vatInvoice, note } · 403 BUSINESS_PROFILE_REQUIRED · 400 BULK_QUOTE_MIXED_SUPPLIERS
  createBulkQuote: (body) => call(() => http.post('/bulk-quotes', body), 'createBulkQuote', body),
  getMyBulkQuotes: (params) => call(() => http.get('/bulk-quotes', { params }), 'getMyBulkQuotes', params),
  getBulkQuote: (id) => call(() => http.get('/bulk-quotes/' + id), 'getBulkQuote', id),
  // POST /bulk-quotes/:id/accept { offerId } → giống checkout { orders, payment, grandTotal } · 409 BULK_QUOTE_INVALID_STATE / QUOTE_EXPIRED
  acceptBulkQuote: ({ id, offerId }) => call(() => http.post('/bulk-quotes/' + id + '/accept', { offerId }), 'acceptBulkQuote', { id, offerId }),
  rejectBulkQuote: (id) => call(() => http.post('/bulk-quotes/' + id + '/reject'), 'rejectBulkQuote', id),
  cancelBulkQuote: (id) => call(() => http.post('/bulk-quotes/' + id + '/cancel'), 'cancelBulkQuote', id),
  getSupplierBulkQuotes: (params) => call(() => http.get('/supplier/bulk-quotes', { params }), 'getSupplierBulkQuotes', params),
  // POST /supplier/bulk-quotes/:id/offer { items: [{ quoteItemId, unitPrice }] (đủ MỌI dòng), shippingFee, leadTimeDays, validDays, note }
  offerBulkQuote: ({ id, ...body }) => call(() => http.post('/supplier/bulk-quotes/' + id + '/offer', body), 'offerBulkQuote', { id, ...body }),
  declineBulkQuote: ({ id, reason }) => call(() => http.post('/supplier/bulk-quotes/' + id + '/decline', { reason }), 'declineBulkQuote', { id, reason }),
  // GET /orders?status=&page=&size=&sort= → Page<OrderResponse> (mặc định createdAt,desc)
  getOrders: (params) => call(() => http.get('/orders', { params }), 'getOrders', params),
  // GET /orders/:id → OrderResponse (đơn người khác → 404)
  getOrder: (id) => call(() => http.get(`/orders/${id}`), 'getOrder', id),
  // POST /orders/:id/cancel — chỉ khi đơn đang pending_payment, sai trạng thái → 409
  cancelOrder: (id) => call(() => http.post(`/orders/${id}/cancel`), 'cancelOrder', id),
  /*
   * GET /vouchers/available?addressId= → VoucherResponse[] (docs BE vouchers-fe.md) — thay cho nhập mã tay
   * (/promotions/lookup đã bị BE xoá, gửi couponCodes khi checkout → 400 COUPON_CODE_UNSUPPORTED).
   * Tính trên GIỎ HIỆN TẠI; có addressId thì BE ước tính được cả voucher vận chuyển. Mỗi voucher:
   * { id, code, name, scope: platform|shop, supplierId, supplierName, type: product|shipping, discountType, discountValue,
   *   maxDiscountAmount, minOrderAmount, endsAt, remainingUses, eligible, reason, reasonCode, reasonParams,
   *   estimatedDiscount (khi dùng RIÊNG voucher đó), recommended (BE gợi ý chọn sẵn) }
   */
  getAvailableVouchers: (params) => call(() => http.get('/vouchers/available', { params }), 'getAvailableVouchers', params),

  /*
   * ===== XỬ LÝ ĐƠN — supplier (đơn của mình) & admin (mọi đơn). Cùng OrderResponse với phía khách. =====
   * Body cập nhật: { status, note? }. Chuyển trạng thái sai luật → 409; supplier sửa đơn người khác → 403.
   * pending_payment → paid do webhook SePay tự làm, KHÔNG cập nhật tay.
   */
  // GET /supplier/orders?status=&page=&size= → Page<OrderResponse>
  getSupplierOrders: (params) => call(() => http.get('/supplier/orders', { params }), 'getSupplierOrders', params),
  updateSupplierOrderStatus: ({ id, ...body }) =>
    call(() => http.put(`/supplier/orders/${id}/status`, body), 'updateSupplierOrderStatus', { id, ...body }),
  // GET /admin/orders?status=&page=&size= → Page<OrderResponse>
  getAdminOrders: (params) => call(() => http.get('/admin/orders', { params }), 'getAdminOrders', params),
  updateAdminOrderStatus: ({ id, ...body }) =>
    call(() => http.put(`/admin/orders/${id}/status`, body), 'updateAdminOrderStatus', { id, ...body }),

  /*
   * ===== KHUYẾN MÃI (/promotions) — admin: KM toàn sàn (product|shipping); supplier: CHỈ KM product
   * cho sản phẩm của mình. Danh sách: admin thấy tất cả, supplier thấy KM của mình (BE tự lọc theo token).
   * Body: { code, name, description?, type, discountType, discountValue?, maxDiscountAmount?,
   * minOrderAmount?, startsAt?, endsAt?, isActive?, usageLimit?, usageLimitPerUser?, productIds? }
   */
  getPromotions: (params) => call(() => http.get('/promotions', { params }), 'getPromotions', params),
  getPromotion: (id) => call(() => http.get(`/promotions/${id}`), 'getPromotion', id),
  createPromotion: (body) => call(() => http.post('/promotions', body), 'createPromotion', body),
  updatePromotion: ({ id, ...body }) => call(() => http.put(`/promotions/${id}`, body), 'updatePromotion', { id, ...body }),
  deletePromotion: (id) => call(() => http.delete(`/promotions/${id}`), 'deletePromotion', id),

  // ===== CẤU HÌNH PHÍ SHIP toàn sàn (chỉ admin) — { baseFee, perKmFee, freeRadiusKm, freeShipThreshold|null, maxFeeCap|null } =====
  getShippingConfig: () => call(() => http.get('/admin/shipping-config'), 'getShippingConfig'),
  updateShippingConfig: (body) => call(() => http.put('/admin/shipping-config', body), 'updateShippingConfig', body),

  /*
   * ===== CUSTOM DESIGN (BE-6) — Custom Studio wizard (bước 5/6, mục 2 api-guide-fe.md) =====
   * ✅ 2026-07-20: đã bật thật (REAL_ENDPOINTS) — domain AI 3D không còn bị chặn (xem ghi chú ở
   * getModels3d bên dưới), customDesignId dùng cho Quote (BE-8) giờ trỏ đúng bản ghi thật ở BE.
   */
  // POST /custom/designs  body: { name, modelId, configuration, thumbnailUrl } → CustomDesignResponse (201), luôn tạo 'draft'
  createDesign: (body) => call(() => http.post('/custom/designs', body), 'createDesign', body),
  // GET /custom/designs/:id → CustomDesignResponse — chỉ chủ sở hữu/admin
  getDesignDetail: (id) => call(() => http.get(`/custom/designs/${id}`), 'getDesignDetail', id),
  /*
   * PUT /custom/designs/:id  body: { name, configuration, thumbnailUrl, status, version } — `version`
   * BẮT BUỘC (optimistic locking: gửi đúng version đang giữ, lệch → 409 → FE phải tải lại bản mới
   * nhất rồi thử lại, KHÔNG tự ý ghi đè). status:'completed' lần đầu → trừ 1 lượt `design` (429 nếu hết).
   */
  updateDesign: ({ id, ...body }) => call(() => http.put(`/custom/designs/${id}`, body), 'updateDesign', { id, ...body }),
  // DELETE /custom/designs/:id → 204
  deleteDesign: (id) => call(() => http.delete(`/custom/designs/${id}`), 'deleteDesign', id),
  // GET /custom/designs/my?status=draft|completed&page=&size= → Page<CustomDesignResponse> — "Thiết kế của tôi"
  getMyDesigns: (params) => call(() => http.get('/custom/designs/my', { params }), 'getMyDesigns', params),

  /*
   * ===== QUOTE & CUSTOM ORDER (BE-8) — báo giá & đơn custom customer ↔ workshop (FE-6) =====
   * State machine đầy đủ: backend/docs/be-8-state-machine.md. Contract: api-guide-fe.md mục 4.
   * ✅ 2026-07-20: đã bật thật (REAL_ENDPOINTS). `customDesignId` BẮT BUỘC là 1 CustomDesign CÓ
   * THẬT ở BE (đã curl xác nhận trước đó: customDesignId ngẫu nhiên → 404 "Không tìm thấy thiết
   * kế", logic BE đúng) — giờ CustomDesign đã real (xem block ở trên) nên điều kiện này tự đáp ứng.
   * ⚠️ Domain Quote/Order hiện CHƯA có dữ liệu thật (GET /quotes/my, /custom-orders/my đều rỗng
   * lúc curl xác nhận) — luồng đầy đủ (tạo quote → offer → accept → order) CHƯA được test end-to-end
   * qua BE thật, chỉ xác nhận API tồn tại/đúng logic 404 ở bước tạo. Cần test kỹ khi dùng thật.
   */
  // POST /quotes  body: { workshopId, customDesignId, quantity, location?, note?, expiresAt? } → QuoteRequestResponse (201)
  createQuote: (body) => call(() => http.post('/quotes', body), 'createQuote', body),
  // GET /quotes/my?status=&page=&size= → Page<QuoteRequestResponse> (list: offers=null) — customer
  getMyQuotes: (params) => call(() => http.get('/quotes/my', { params }), 'getMyQuotes', params),
  // GET /quotes/incoming?status=&page=&size= — workshop
  getIncomingQuotes: (params) => call(() => http.get('/quotes/incoming', { params }), 'getIncomingQuotes', params),
  // GET /quotes/:id → QuoteRequestResponse (kèm offers[]) — customer/workshop/admin liên quan
  getQuoteDetail: (id) => call(() => http.get(`/quotes/${id}`), 'getQuoteDetail', id),
  // POST /quotes/:id/cancel — customer, chỉ khi chưa chốt (pending/negotiating)
  cancelQuote: (id) => call(() => http.post(`/quotes/${id}/cancel`), 'cancelQuote', id),
  // POST /quotes/:id/offers  body: { price, leadTimeDays, note?, expiresAt? } → QuoteOfferResponse (201)
  // offeredBy tự suy từ vai người gọi (customer hoặc workshop) — dùng chung cho ra giá LẪN counter-offer
  createOffer: ({ quoteId, ...body }) => call(() => http.post(`/quotes/${quoteId}/offers`, body), 'createOffer', { quoteId, ...body }),
  // POST /quotes/:id/offers/:offerId/accept — CHỈ bên KHÔNG tạo offer đó → tạo CustomOrderResponse (201)
  acceptOffer: ({ quoteId, offerId }) => call(() => http.post(`/quotes/${quoteId}/offers/${offerId}/accept`), 'acceptOffer', { quoteId, offerId }),
  // POST /quotes/:id/offers/:offerId/reject — kết thúc đàm phán (quote → rejected, muốn tiếp thì counter-offer)
  rejectOffer: ({ quoteId, offerId }) => call(() => http.post(`/quotes/${quoteId}/offers/${offerId}/reject`), 'rejectOffer', { quoteId, offerId }),

  // GET /custom-orders/my?status=&page=&size= — customer
  getMyCustomOrders: (params) => call(() => http.get('/custom-orders/my', { params }), 'getMyCustomOrders', params),
  // GET /custom-orders/incoming?status=&page=&size= — workshop
  getIncomingCustomOrders: (params) => call(() => http.get('/custom-orders/incoming', { params }), 'getIncomingCustomOrders', params),
  // GET /custom-orders/:id → CustomOrderResponse (kèm history[])
  getCustomOrderDetail: (id) => call(() => http.get(`/custom-orders/${id}`), 'getCustomOrderDetail', id),
  /*
   * PATCH /custom-orders/:id/status  body: { status, note? } → CustomOrderResponse (kèm history mới)
   * Luồng BE-01 (custom-order-payment-fe.md §2, sai → 409): awaiting_deposit→cancelled · deposit_paid→in_production ·
   * in_production→awaiting_final_payment ("Hoàn thiện") · paid→shipping→delivered (xưởng) · delivered→completed (khách).
   * deposit_paid / paid chỉ hệ thống chuyển khi nhận tiền.
   */
  updateCustomOrderStatus: ({ id, ...body }) => call(() => http.patch(`/custom-orders/${id}/status`, body), 'updateCustomOrderStatus', { id, ...body }),
  /*
   * POST /custom-orders/:id/payment (chỉ khách) → PaymentResponse (purpose custom_deposit | custom_final, txnRef "CUS...").
   * Gọi lại nhiều lần an toàn: QR còn hạn → trả đúng QR đó; hết hạn / đổi số tiền → gia hạn cùng payment.
   * 409: không ở bước cần trả · chưa có địa chỉ (khoản cuối) · xưởng chưa khai báo địa điểm.
   */
  createCustomOrderPayment: (id) => call(() => http.post('/custom-orders/' + id + '/payment'), 'createCustomOrderPayment', id),
  // PUT /custom-orders/:id/address { addressId } (chỉ khách, địa chỉ phải có toạ độ) → CustomOrderResponse có shippingFee mới
  setCustomOrderAddress: ({ id, addressId }) => call(() => http.put('/custom-orders/' + id + '/address', { addressId }), 'setCustomOrderAddress', { id, addressId }),

  /*
   * ===== SUPPLIER (browse công khai — trang /suppliers, /suppliers/:id) =====
   * PublicResponse của BE CỐ TÌNH bỏ field nội bộ/nhạy cảm (status, commissionRate, taxCode...)
   * và KHÔNG có rating/portfolio/capability nhúng sẵn — phải gọi riêng portfolio/reviews.
   * KHÔNG có slug — định danh bằng UUID (id) trong mọi route/param dưới đây.
   */
  // GET /suppliers/public?type=retailer|workshop&page=&size= → Page<SupplierPublicResponse>
  getPublicSuppliers: (params) => call(() => http.get('/suppliers/public', { params }), 'getPublicSuppliers', params),
  // GET /suppliers/{id}/public → SupplierPublicResponse { id, businessName, type, description, contactEmail, contactPhone, createdAt }
  getSupplierPublicProfile: (id) => call(() => http.get(`/suppliers/${id}/public`), 'getSupplierPublicProfile', id),
  // GET /suppliers/{id}/stores → StorePublicResponse[] { id, supplierId, supplierType, district, city } — CHỈ khu vực, không địa chỉ đường
  getSupplierStores: (id) => call(() => http.get(`/suppliers/${id}/stores`), 'getSupplierStores', id),
  // GET /suppliers/{id}/portfolio → PortfolioResponse[] { id, supplierId, productId, productName, imageUrl, title, description, sortOrder, createdAt }
  getSupplierPortfolio: (id) => call(() => http.get(`/suppliers/${id}/portfolio`), 'getSupplierPortfolio', id),
  // GET /reviews?targetType=product|supplier&targetId=&page=&size= → Page<ReviewResponse>
  getReviews: (params) => call(() => http.get('/reviews', { params }), 'getReviews', params),
  // GET /reviews/summary?targetType=&targetId= → { targetType, targetId, average, count }
  getReviewSummary: (params) => call(() => http.get('/reviews/summary', { params }), 'getReviewSummary', params),
  /*
   * POST /reviews { targetType: 'product'|'supplier', targetId, rating 1..5, comment? ≤2000 } → 201 ReviewResponse
   * 409 = đã đánh giá đối tượng này rồi (phải sửa đánh giá cũ) · 403 = tự đánh giá SP/cửa hàng của chính mình
   */
  createReview: (body) => call(() => http.post('/reviews', body), 'createReview', body),
  // PUT /reviews/:id { rating, comment? } — chỉ người viết (khác → 403)
  updateReview: ({ id, ...body }) => call(() => http.put(`/reviews/${id}`, body), 'updateReview', { id, ...body }),
  // DELETE /reviews/:id → 204 — chỉ người viết
  deleteReview: (id) => call(() => http.delete(`/reviews/${id}`), 'deleteReview', id),

  /*
   * ===== SUPPLIER (quản trị — Portal Quản trị /admin/suppliers) — CHỈ ADMIN =====
   * Khác hẳn nhóm public ở trên: SupplierResponse đầy đủ (có taxCode/status/commissionRate/userId),
   * thấy được cả supplier pending/suspended.
   */
  // GET /suppliers?status=&type=&page=&size= → Page<SupplierResponse> — chỉ admin
  getAdminSuppliers: (params) => call(() => http.get('/suppliers', { params }), 'getAdminSuppliers', params),
  // GET /suppliers/{id} → SupplierResponse (đầy đủ) — chỉ admin
  getAdminSupplierDetail: (id) => call(() => http.get(`/suppliers/${id}`), 'getAdminSupplierDetail', id),
  // POST /suppliers  body: CreateSupplierRequest { email*, password*, fullName*, phone, businessName*,
  // type*(retailer|workshop), taxCode?, legalDocumentUrl?, contactEmail?, contactPhone?, description?,
  // commissionRate? } → SupplierResponse, 201 — chỉ admin. BE TỰ gửi email tài khoản+mật khẩu tạm,
  // set status=active ngay (không phải pending chờ duyệt), mustChangePassword=true cho user mới.
  createSupplier: (body) => call(() => http.post('/suppliers', body), 'createSupplier', body),
  // PUT /suppliers/{id}/status  body: { status*(pending|active|suspended), commissionRate? } → SupplierResponse
  // — chỉ admin. ĐÂY LÀ API duyệt/khoá supplier (không có endpoint approve/reject riêng). Đổi sang
  // suspended → BE tự hạ User.role về customer; active → tự nâng lại supplier (syncUserRole tự động).
  updateSupplierStatus: ({ id, ...body }) => call(() => http.put(`/suppliers/${id}/status`, body), 'updateSupplierStatus', { id, ...body }),

  /*
   * ===== SUPPLIER (hồ sơ của CHÍNH supplier đang đăng nhập) =====
   * GET /suppliers/me → SupplierResponse đầy đủ (có `type`: retailer|workshop). Dùng để biết
   * đúng loại supplier hiện tại — vd gate nút "Thêm chi nhánh" cho workshop (Module Store/GPS).
   * authStore.user.supplierType (AuthResponse, BE-0) đủ cho điều hướng/hiển thị; dùng hàm này khi
   * cần các field khác của hồ sơ supplier (status, commissionRate, taxCode...) mà AuthResponse không có.
   */
  getSupplierMe: () => call(() => http.get('/suppliers/me'), 'getSupplierMe'),

  /*
   * ===== THỐNG KÊ NCC / XƯỞNG (BE-09, docs BE supplier-stats-fe.md) =====
   * Tham số chung: { from, to, storeId? } — ISO có múi giờ (+07:00), kỳ [from, to), tối đa 366 ngày.
   * Chỉ tính đơn đã thanh toán trở đi; ngày = ngày khách thanh toán theo giờ VN.
   */
  // → { orderCount, grossSales, shopDiscount, revenue, commissionRate, commission, netRevenue, avgOrderValue,
  //     shippingFee, pendingOrders, rating, reviewCount, newReviews, unrepliedReviews, workshop: {...}|null }
  getSupplierStatsSummary: (params) => call(() => http.get('/supplier/stats/summary', { params }), 'getSupplierStatsSummary', params),
  // params + granularity=day|week|month → { granularity, points: [{ date, orders, revenue, customRevenue }] } (đủ mọi mốc)
  getSupplierStatsTimeseries: (params) => call(() => http.get('/supplier/stats/timeseries', { params }), 'getSupplierStatsTimeseries', params),
  // params + limit (1–50) → [{ productId|null, name, sold, revenue }] theo doanh thu giảm dần
  getSupplierStatsTopProducts: (params) => call(() => http.get('/supplier/stats/top-products', { params }), 'getSupplierStatsTopProducts', params),
  /*
   * GET /supplier/stats/export?format=csv → file text/csv (mỗi đơn 1 dòng). KHÔNG đi qua call() vì cần
   * responseType 'blob'. Trả Blob; khi lỗi body cũng là Blob → đọc text() rồi gắn lại vào err.response.data
   * để apiErrorMessage() đọc được errorCode như mọi lỗi khác.
   */
  exportSupplierStats: async (params) => {
    if (USE_MOCK) return mockAdapter.exportSupplierStats(params);
    try {
      const res = await http.get('/supplier/stats/export', { params: { ...params, format: 'csv' }, responseType: 'blob' });
      return res.data;
    } catch (err) {
      const data = err.response?.data;
      if (data instanceof Blob) {
        try { err.response.data = JSON.parse(await data.text()); } catch { /* body không phải JSON — giữ nguyên */ }
      }
      throw err;
    }
  },
  // PUT /suppliers/me — GHI ĐÈ toàn bộ (BE set mọi field theo body, kể cả null) → FE phải gửi đủ
  // { businessName*, taxCode, legalDocumentUrl, contactEmail, contactPhone, description }; 409 nếu trùng MST.
  updateSupplierMe: (body) => call(() => http.put('/suppliers/me', body), 'updateSupplierMe', body),
  /*
   * PATCH /suppliers/me (BE-10) — CHỈ cập nhật field có gửi: không gửi / null = giữ, "" = xoá. Có thêm 4 field mới
   * logoUrl, coverUrl, hqAddress, contactName (PUT cũ không đụng tới 4 field này). businessName "" → 400.
   */
  patchSupplierMe: (body) => call(() => http.patch('/suppliers/me', body), 'patchSupplierMe', body),
  /*
   * POST /uploads/image?purpose=logo|cover|portfolio (multipart, file ≤ 10MB JPEG/PNG/WEBP/GIF) → { url }.
   * Tải ảnh lên TRƯỚC, rồi mới gửi url vào API lưu (PATCH /suppliers/me hoặc portfolio).
   */
  uploadSupplierImage: ({ file, purpose }) => {
    const form = new FormData();
    form.append('file', file);
    return call(() => http.post('/uploads/image', form, { params: { purpose } }), 'uploadSupplierImage', { file, purpose });
  },
  // GET /supplier/reviews?targetType=product|supplier&rating=&replied=true|false&page=&size= → Page<ReviewResponse> (+ targetName)
  getSupplierReviewsPortal: (params) => call(() => http.get('/supplier/reviews', { params }), 'getSupplierReviewsPortal', params),
  // POST /reviews/:id/reply { content ≤ 1000 } — gửi lại = sửa · 403 REVIEW_REPLY_FORBIDDEN · 409 REVIEW_HIDDEN
  replyReview: ({ id, content }) => call(() => http.post('/reviews/' + id + '/reply', { content }), 'replyReview', { id, content }),
  // DELETE /reviews/:id/reply → ReviewResponse với reply = null
  deleteReviewReply: (id) => call(() => http.delete('/reviews/' + id + '/reply'), 'deleteReviewReply', id),
  /*
   * GET /suppliers/me/payout → { configured, bankCode, bankName, accountNumberMasked, accountHolder, branch, updatedAt }
   * (accountNumber LUÔN null với NCC). PUT gửi ĐỦ field kể cả số TK đầy đủ (6–19 chữ số); 503 = server chưa có khoá mã hoá.
   */
  /*
   * ===== THÔNG BÁO (BE-12, docs BE notifications-fe.md) =====
   * NotificationResponse { id, type, title (câu VI dự phòng), params, targetType: order|custom_order|quote|review,
   * targetId, read, readAt, createdAt }. Realtime: /user/queue/notifications (services/chatSocket.js).
   */
  // GET /notifications?unread=&page=&size= → Page, mới nhất trước
  getNotifications: (params) => call(() => http.get('/notifications', { params }), 'getNotifications', params),
  // GET /notifications/unread-count → { unread }
  getUnreadNotificationCount: () => call(() => http.get('/notifications/unread-count'), 'getUnreadNotificationCount'),
  // POST /notifications/:id/read → thông báo đã đọc · 404 NOTIFICATION_NOT_FOUND
  markNotificationRead: (id) => call(() => http.post('/notifications/' + id + '/read'), 'markNotificationRead', id),
  // POST /notifications/read-all → { updated }
  markAllNotificationsRead: () => call(() => http.post('/notifications/read-all'), 'markAllNotificationsRead'),
  getMyPayout: () => call(() => http.get('/suppliers/me/payout'), 'getMyPayout'),
  // GET /suppliers/me/capability (chỉ xưởng) → { productTypes[], maxLengthCm, maxWidthCm, maxHeightCm, materials[{id,name}], experienceYears, updatedAt }
  getMyCapability: () => call(() => http.get('/suppliers/me/capability'), 'getMyCapability'),
  // PUT ghi đè toàn bộ { productTypes, maxLengthCm, maxWidthCm, maxHeightCm, materialIds, experienceYears } · 403 SUPPLIER_NOT_WORKSHOP
  saveMyCapability: (body) => call(() => http.put('/suppliers/me/capability', body), 'saveMyCapability', body),
  saveMyPayout: (body) => call(() => http.put('/suppliers/me/payout', body), 'saveMyPayout', body),
  // GET /users/me/notification-settings → { email: [{ type, enabled, defaultEnabled }] } · PUT { email: { TYPE: bool } } (chỉ loại muốn đổi)
  getNotificationSettings: () => call(() => http.get('/users/me/notification-settings'), 'getNotificationSettings'),
  updateNotificationSettings: (email) => call(() => http.put('/users/me/notification-settings', { email }), 'updateNotificationSettings', email),
  // Portfolio của tôi: PortfolioResponse[] { id, productId, productName, imageUrl, title, description, sortOrder }.
  // Gắn productId mà bỏ trống imageUrl → BE tự lấy ảnh của sản phẩm.
  getMyPortfolio: () => call(() => http.get('/suppliers/me/portfolio'), 'getMyPortfolio'),
  addPortfolioItem: (body) => call(() => http.post('/suppliers/me/portfolio', body), 'addPortfolioItem', body),
  updatePortfolioItem: ({ id, ...body }) => call(() => http.put(`/suppliers/me/portfolio/${id}`, body), 'updatePortfolioItem', { id, ...body }),
  deletePortfolioItem: (id) => call(() => http.delete(`/suppliers/me/portfolio/${id}`), 'deletePortfolioItem', id),

  /*
   * ===== GỢI Ý VỊ TRÍ (GPS) — 3 API, đọc trực tiếp StoreController.java, KHÔNG suy đoán path =====
   * Cả 3 đều yêu cầu đăng nhập (không whitelist trong SecurityConfig). Query param `lat`/`lng`
   * (KHÁC tên `latitude`/`longitude` ở body Store — xem docs/API_CONTRACT.md mục 0).
   * Response KHÔNG có toạ độ (NearbyStoreResponse cố tình bỏ) — chỉ list + distanceKm, không vẽ
   * bản đồ ghim cho khách được.
   */
  // LUỒNG 1 (Pha 3, checkout): GET /stores/nearby/by-supplier/{supplierId}?lat=&lng=
  // → NearbyStoreResponse[] — TẤT CẢ chi nhánh của 1 supplier cụ thể, gần→xa.
  getNearbyStoresBySupplier: ({ supplierId, lat, lng }) =>
    call(() => http.get(`/stores/nearby/by-supplier/${supplierId}`, { params: { lat, lng } }), 'getNearbyStoresBySupplier', { supplierId, lat, lng }),
  // LUỒNG 2 (Pha 4, custom order) — top N xưởng gần nhất: GET /stores/nearby/workshops?lat=&lng=&limit=5
  getNearestWorkshops: ({ lat, lng, limit }) =>
    call(() => http.get('/stores/nearby/workshops', { params: { lat, lng, limit } }), 'getNearestWorkshops', { lat, lng, limit }),
  // LUỒNG 2 biến thể bán kính: GET /stores/nearby/workshops/radius?lat=&lng=&radiusKm=
  getWorkshopsWithinRadius: ({ lat, lng, radiusKm }) =>
    call(() => http.get('/stores/nearby/workshops/radius', { params: { lat, lng, radiusKm } }), 'getWorkshopsWithinRadius', { lat, lng, radiusKm }),

  /*
   * ===== AI 3D (BE-1→BE-4) — thư viện mẫu 3D + sinh model 3D bằng AI từ ảnh =====
   * Contract đầy đủ: backend/docs/api-guide-fe.md mục 1. Model3dResponse/Ai3DTaskResponse —
   * xem shape trong mockAdapter (đã khớp 1-1, giữ lại làm fallback khi VITE_USE_MOCK=true).
   * ✅ 2026-07-20: BE đã fix bug gốc (GET /api/custom/models 500 do `lower(bytea)` khi keyword/
   * productType null — giờ cast tường minh sang string trong JPQL) — đã curl xác nhận LẠI: danh
   * sách + chi tiết đều 200, có 1 template seed + ≥2 model đã sinh thật qua Meshy (isPublic=false,
   * cần đăng nhập đúng chủ mới xem được — khớp thiết kế "công khai; model riêng cần đăng nhập").
   * File upload cũng đã nới lỏng validate (BE-4 fix): chỉ soi magic bytes thật của file, KHÔNG
   * còn đối chiếu Content-Type/đuôi file client khai báo → ảnh đổi đuôi/sai Content-Type vẫn qua
   * được miễn nội dung đúng là JPEG/PNG/WEBP. ✅ Test thật qua UI (2026-07-20): upload 1 ảnh PNG
   * thật nhưng đổi đuôi thành .jpg (mismatch cố ý) qua Custom Studio → POST /custom/ai/generate
   * trả 202 {taskId, status:'queued'} bình thường, task tiến triển tới ~22% không lỗi — xác nhận
   * BE nhận diện đúng theo nội dung, không còn chặn nhầm như hành vi cũ.
   */
  // GET /custom/models?keyword=&productType=&page=&size= → Page<Model3dResponse>
  getModels3d: (params) => call(() => http.get('/custom/models', { params }), 'getModels3d', params),
  // GET /custom/models/:slug → Model3dResponse (công khai; model riêng của user cần đăng nhập)
  getModel3d: (slug) => call(() => http.get(`/custom/models/${slug}`), 'getModel3d', slug),
  // GET /custom/models/my?page=&size=&sort= → Page<Model3dResponse> — thư viện "model của tôi" (model AI tự lưu khi gen xong). Cần đăng nhập.
  getMyModels: (params) => call(() => http.get('/custom/models/my', { params }), 'getMyModels', params),
  // PUT /custom/models/:id  body: { name } → Model3dResponse — "Lưu mô hình" = đặt tên (chỉ chủ sở hữu; không sửa gì khác). 400 tên trống/>255.
  renameModel: ({ id, name }) => call(() => http.put(`/custom/models/${id}`, { name }), 'renameModel', { id, name }),
  /*
   * POST /custom/ai/generate — multipart/form-data (KHÔNG qua call() vì cần FormData, giống
   * uploadProductImage). Trừ 1 lượt `design` (hết → 429, xem docs/subscription-fe.md). Trả NGAY
   * (202), không chờ AI xong: { taskId, status:'queued', progress:0 }.
   * Check thêm REAL_ENDPOINTS.has('getGenTask') (khác uploadProductImage chỉ check USE_MOCK) —
   * hàm này SINH RA taskId mà getGenTask/retryGenTask/cancelGenTask phải tra cứu ĐÚNG CÙNG NGUỒN
   * (cùng thật hoặc cùng mock) — nay cả nhóm đã vào REAL_ENDPOINTS nên tự động dùng BE thật, gọi
   * Meshy thật qua BE proxy và trừ quota `design` thật. ⚠️ Từ đây generate3D KHÔNG còn miễn phí/
   * không giới hạn như lúc mock — mỗi lần gọi tốn 1 lượt design + chi phí Meshy thật phía BE.
   */
  generate3D: async ({ image, templateId, removeBackground, quality }) => {
    if (USE_MOCK || !REAL_ENDPOINTS.has('getGenTask')) return mockAdapter.generate3D({ image, templateId, removeBackground, quality });
    const form = new FormData();
    form.append('image', image);
    if (templateId != null) form.append('templateId', templateId);
    if (removeBackground != null) form.append('removeBackground', String(removeBackground));
    if (quality != null) form.append('quality', quality);
    const res = await http.post('/custom/ai/generate', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    return res.data;
  },
  /*
   * GET /custom/ai/tasks/:taskId → Ai3DTaskResponse — FE poll định kỳ (khuyến nghị 1.5-3s, xem
   * hooks/useModels3d.js) tới khi status là 1 trong 5 trạng thái TERMINAL: succeeded/failed/cancelled
   * (queued/processing là đang chạy, PHẢI tiếp tục poll).
   */
  getGenTask: (taskId) => call(() => http.get(`/custom/ai/tasks/${taskId}`), 'getGenTask', taskId),
  /*
   * POST /custom/ai/generate/text { prompt ≤600, artStyle 'realistic'|'sculpture', negativePrompt? ≤600 }
   * → 202 { taskId, status:'queued', progress:0 }. Chạy bước PREVIEW (hình khối, chưa texture) — model
   * tự lưu khi poll thấy succeeded. Trừ chung 1 lượt `design` với luồng ảnh (hết → 429).
   */
  generate3DFromText: (body) => call(() => http.post('/custom/ai/generate/text', body), 'generate3DFromText', body),
  /*
   * POST /custom/ai/tasks/:taskId/refine — nâng cấp texture cho task text đã preview xong (canRefine=true).
   * KHÔNG trừ thêm lượt. Task quay lại processing → poll getGenTask tiếp; xong thì model preview được
   * cập nhật texture (cùng modelId/slug). 409 chưa xong/đã refine/không phải task text · 400 provider không hỗ trợ.
   */
  refineGenTask: (taskId) => call(() => http.post(`/custom/ai/tasks/${taskId}/refine`), 'refineGenTask', taskId),
  // POST /custom/ai/tasks/:taskId/retry — chỉ khi task đang 'failed', giới hạn số lần (mặc định 3, vượt → 429)
  retryGenTask: (taskId) => call(() => http.post(`/custom/ai/tasks/${taskId}/retry`), 'retryGenTask', taskId),
  // POST /custom/ai/tasks/:taskId/cancel — chỉ khi task CHƯA terminal (đã kết thúc → 409)
  cancelGenTask: (taskId) => call(() => http.post(`/custom/ai/tasks/${taskId}/cancel`), 'cancelGenTask', taskId),
  // GET /custom/ai/tasks/my?status=&page=&size= → Page<Ai3DTaskResponse> — để wizard tự resume task khi quay lại trang
  getMyGenTasks: (params) => call(() => http.get('/custom/ai/tasks/my', { params }), 'getMyGenTasks', params),

  /*
   * ===== SUBSCRIPTION (gói đăng ký) — đọc trực tiếp SubscriptionPlanController/UserSubscription-
   * Controller/PaymentController/UsageLimitController.java, KHÔNG suy đoán path. =====
   */
  // GET /subscription-plans — công khai, danh sách gói ĐANG BÁN đã sắp sortOrder (trang Pricing)
  getSubscriptionPlans: () => call(() => http.get('/subscription-plans'), 'getSubscriptionPlans'),

  // POST /subscriptions  body: { planId } → UserSubscriptionResponse — CHỈ gói price=0 (BE 400 nếu trả phí)
  subscribe: (planId) => call(() => http.post('/subscriptions', { planId }), 'subscribe', planId),
  // GET /subscriptions/me → UserSubscriptionResponse, BE trả 404 nếu chưa có gói active
  getMySubscription: () => call(() => http.get('/subscriptions/me'), 'getMySubscription'),
  // GET /subscriptions/me/history → UserSubscriptionResponse[], mới nhất trước
  getMySubscriptionHistory: () => call(() => http.get('/subscriptions/me/history'), 'getMySubscriptionHistory'),
  // (Gia hạn: KHÔNG còn POST /subscriptions/me/renew — BE trả 402 từ AUD-002. Gia hạn = tạo payment cho gói đang dùng,
  //  xem PaymentQrModal; webhook cộng dồn +1 tháng.)
  // POST /subscriptions/me/cancel → 204
  cancelMySubscription: () => call(() => http.post('/subscriptions/me/cancel'), 'cancelMySubscription'),

  // POST /payments/subscription  body: { planId } → PaymentResponse (có qrUrl để hiện QR VietQR)
  createSubscriptionPayment: (planId) => call(() => http.post('/payments/subscription', { planId }), 'createSubscriptionPayment', planId),
  // GET /payments/{id} → PaymentResponse — FE poll tới status !== 'pending' (xem hooks/useSubscription.js)
  getPayment: (id) => call(() => http.get(`/payments/${id}`), 'getPayment', id),
  // GET /payments/me → PaymentResponse[], mới nhất trước
  getMyPayments: () => call(() => http.get('/payments/me'), 'getMyPayments'),

  // GET /usage/me → UsageStatusResponse[] — hạn mức mọi tính năng trong THÁNG NÀY
  getMyUsage: () => call(() => http.get('/usage/me'), 'getMyUsage'),

  /*
   * ===== CREDIT PACK — mua thêm lượt `design` (dùng đến hết, KHÔNG reset theo tháng) =====
   * Luồng thanh toán giống subscription: tạo payment → hiện QR → poll GET /payments/{id} tới 'paid'
   * → BE tự cộng lượt vào ví → GET /usage/me thấy purchasedRemaining tăng.
   */
  // GET /credit-packs → CreditPackResponse[] { id, name, displayName, feature, credits, price, isActive, sortOrder } (cần đăng nhập)
  getCreditPacks: () => call(() => http.get('/credit-packs'), 'getCreditPacks'),
  // POST /payments/credit-pack { packId } → 201 PaymentResponse (purpose 'credit_pack'). Gói price=0 → 400
  createCreditPackPayment: (packId) => call(() => http.post('/payments/credit-pack', { packId }), 'createCreditPackPayment', packId),
  // Admin — body: { name, displayName, feature? (mặc định design), credits, price, isActive?, sortOrder? }
  getAdminCreditPacks: () => call(() => http.get('/admin/credit-packs'), 'getAdminCreditPacks'),
  createCreditPack: (body) => call(() => http.post('/admin/credit-packs', body), 'createCreditPack', body),
  updateCreditPack: ({ id, ...body }) => call(() => http.put(`/admin/credit-packs/${id}`, body), 'updateCreditPack', { id, ...body }),
  deleteCreditPack: (id) => call(() => http.delete(`/admin/credit-packs/${id}`), 'deleteCreditPack', id),

  /*
   * ===== PAYMENTS (quản trị — Portal Quản trị /admin/payments) — CHỈ ADMIN, CHỈ ĐỌC =====
   * from/to: ISO-8601 CÓ HẬU TỐ 'Z' (xem utils/dateRange.js) — tránh dấu '+' của offset bị query
   * hiểu thành dấu cách → 400. Doanh thu tính theo paidAt, các *Count theo createdAt.
   */
  // GET /admin/payments?status=&purpose=&from=&to=&q=&page=&size=&sort= → Spring Page<AdminPaymentResponse>
  getAdminPayments: (params) => call(() => http.get('/admin/payments', { params }), 'getAdminPayments', params),
  // GET /admin/payments/{id} → AdminPaymentResponse (404 nếu không có)
  getAdminPayment: (id) => call(() => http.get(`/admin/payments/${id}`), 'getAdminPayment', id),
  // GET /admin/payments/stats?from=&to= → PaymentStatsResponse { totalRevenue, totalCount, paidCount, ..., dailyRevenue[] }
  getAdminPaymentStats: (params) => call(() => http.get('/admin/payments/stats', { params }), 'getAdminPaymentStats', params),

  // ===== DASHBOARD tổng quan — quản trị (chỉ admin, API chỉ đọc) =====
  // GET /admin/dashboard/summary?from=&to= → { users, revenue, subscriptions, suppliers, products, ai }
  getAdminDashboardSummary: (params) => call(() => http.get('/admin/dashboard/summary', { params }), 'getAdminDashboardSummary', params),
  // GET /admin/dashboard/timeseries?from=&to= → { revenue[], newUsers[], customOrders[], aiTasks[] } (chỉ ngày CÓ dữ liệu)
  getAdminDashboardTimeseries: (params) => call(() => http.get('/admin/dashboard/timeseries', { params }), 'getAdminDashboardTimeseries', params),
  // GET /admin/dashboard/top?from=&to=&limit= → { topPlans[], topSuppliers[] }
  getAdminDashboardTop: (params) => call(() => http.get('/admin/dashboard/top', { params }), 'getAdminDashboardTop', params),
  /*
   * GET /admin/dashboard/traffic?from=&to=&limit= → { totals, bySource[], byDay[], topPages[], realtime|null }
   * Nguồn GA4 (cả khách chưa đăng nhập), trễ 24–48h trừ realtime. Bỏ trống from/to = 30 ngày gần nhất.
   * 503 = BE chưa cấu hình GA → FE ẩn khối · 502 = GA lỗi/hết quota.
   */
  getAdminDashboardTraffic: (params) => call(() => http.get('/admin/dashboard/traffic', { params }), 'getAdminDashboardTraffic', params),

  // ===== SUBSCRIPTION PLANS — quản trị (chỉ admin) =====
  // GET /subscription-plans/all → CẢ gói đã tắt (khác GET /subscription-plans công khai)
  getAllSubscriptionPlans: () => call(() => http.get('/subscription-plans/all'), 'getAllSubscriptionPlans'),
  // POST /subscription-plans  body: CreateSubscriptionPlanRequest
  createSubscriptionPlan: (body) => call(() => http.post('/subscription-plans', body), 'createSubscriptionPlan', body),
  // PUT /subscription-plans/{id}  body: UpdateSubscriptionPlanRequest
  updateSubscriptionPlan: ({ id, ...body }) => call(() => http.put(`/subscription-plans/${id}`, body), 'updateSubscriptionPlan', { id, ...body }),
  // DELETE /subscription-plans/{id} — 409 nếu đang có người dùng gói này
  deleteSubscriptionPlan: (id) => call(() => http.delete(`/subscription-plans/${id}`), 'deleteSubscriptionPlan', id),

  /*
   * ===== AI CHAT (trợ lý AI tư vấn — chatbot nổi) =====
   * ✅ 2026-07-20: BE đã fix xong lỗi 502 (thiếu AI_API_URL trong render.yaml, xem đầu file) —
   * đã test thật qua UI (gửi "Tôi muốn tìm bàn ăn gỗ sồi"): POST trả 200 với reply + gợi ý sản
   * phẩm đúng (không còn lỗi kết nối service Python AI phía sau). UI vẫn giữ nguyên xử lý 502/429
   * (xem chatErrorKey trong ChatPanel.jsx) vì AI provider vẫn có thể timeout/bận lúc khác.
   * suggestedProducts trong AiChatMessageResponse — BE đã migrate sang AgentResponse JSON
   * (admin-payment-ai-chat-fe.md, B.5): passthrough field do AI trả, thường có
   * { id, name, price (số VND), category, material|null, image_url, reasons[] }, có thể thêm
   * colors/dimensions/seats. FE đọc PHÒNG THỦ (field có thể thiếu) — xem ProductSuggestion trong
   * ChatPanel.jsx. Cold start (Render free) có thể chậm vài chục giây hoặc 502 → UI có "thử lại".
   */
  // POST /ai-chat/sessions  body: { title? } → AiChatSessionResponse (201)
  createAiChatSession: (body) => call(() => http.post('/ai-chat/sessions', body ?? {}), 'createAiChatSession', body),
  // GET /ai-chat/sessions → AiChatSessionResponse[] (KHÔNG phân trang, mảng phẳng)
  getMyAiChatSessions: () => call(() => http.get('/ai-chat/sessions'), 'getMyAiChatSessions'),
  // GET /ai-chat/sessions/:id/messages → AiChatMessageResponse[]
  getAiChatMessages: (sessionId) => call(() => http.get(`/ai-chat/sessions/${sessionId}/messages`), 'getAiChatMessages', sessionId),
  /*
   * POST /ai-chat/sessions/:id/messages  body: { content, lat?, lng? } → AiChatMessageResponse
   * (CHỈ trả tin nhắn trả lời của assistant, KHÔNG trả lại tin của user — FE tự hiện optimistic
   * rồi refetch lịch sử để đồng bộ). Trừ 1 lượt `ai_chat` — hết → 429. AI lỗi/timeout → 502.
   */
  sendAiChatMessage: ({ sessionId, ...body }) => call(() => http.post(`/ai-chat/sessions/${sessionId}/messages`, body, { timeout: AI_CHAT_TIMEOUT_MS }), 'sendAiChatMessage', { sessionId, ...body }),

  // ===== CONTACT =====
  // POST /contact (BE-06, không cần đăng nhập) body: { name*, email*, phone?, subject*, message* } → 201 ContactResponse
  // 400 lỗi theo field · 429 quá 5 lần/giờ từ cùng mạng
  submitContact: (body) => call(() => http.post('/contact', body), 'submitContact', body),
};
