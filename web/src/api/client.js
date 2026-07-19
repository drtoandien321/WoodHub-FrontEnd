import axios from 'axios';
import { useAuthStore } from '../stores/authStore.js';
import { mockAdapter } from './mock/mockAdapter.js';

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
  // Module Supplier (browse công khai) — đã xác nhận BE thật (curl local, sau khi pull 2 endpoint mới)
  'getPublicSuppliers', 'getSupplierPublicProfile', 'getSupplierStores', 'getSupplierPortfolio',
  'getReviews', 'getReviewSummary',
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
   * ⚠️ Còn 1 lỗi CHƯA fix: GET /products/featured → 400 Bad Request (nghi bị khớp nhầm vào
   * /products/{id} với id="featured") → 'getFeaturedProducts' CHƯA thêm vào set này, Landing.jsx vẫn dùng mock.
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
  // Module GPS/Vị trí — hồ sơ supplier tự thân (biết type để gate UI)
  'getSupplierMe',
  // Module GPS/Vị trí — 3 API gợi ý gần (Pha 3 Checkout + Pha 4 Custom order)
  'getNearbyStoresBySupplier', 'getNearestWorkshops', 'getWorkshopsWithinRadius',
  // Module Subscription — gói đăng ký (trang Pricing + "Gói của tôi")
  'getSubscriptionPlans', 'subscribe', 'getMySubscription', 'getMySubscriptionHistory',
  'renewMySubscription', 'cancelMySubscription',
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
  'getModels3d', 'getModel3d', 'getGenTask', 'retryGenTask', 'cancelGenTask', 'getMyGenTasks',
  'createDesign', 'getDesignDetail', 'updateDesign', 'deleteDesign', 'getMyDesigns',
  'createQuote', 'getMyQuotes', 'getIncomingQuotes', 'getQuoteDetail', 'cancelQuote',
  'createOffer', 'acceptOffer', 'rejectOffer',
  'getMyCustomOrders', 'getIncomingCustomOrders', 'getCustomOrderDetail', 'updateCustomOrderStatus',
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
export const http = axios.create({ baseURL: BASE_URL, timeout: 60_000 });

/*
 * Interceptor = "middleware" của axios: chạy trước mỗi request.
 * Ở đây dùng để tự đính JWT vào header Authorization — viết 1 lần, mọi request đều có,
 * thay vì lặp lại ở từng chỗ gọi API.
 */
http.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
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
 * refreshRequest: gom nhiều request 401 cùng lúc thành 1 lần gọi /auth/refresh duy nhất
 * (không phải mỗi request lỗi lại tự gọi refresh riêng, tránh cấp thừa refresh token).
 *
 * ⚠️ CŨNG bắt 403 giống 401 (khác quy ước REST thông thường) — đã test bằng browser thật + JWT
 * hết hạn: BE trả 403 (KHÔNG phải 401) cho token hết hạn/không hợp lệ, xác nhận trên nhiều
 * endpoint (getMe/getMySubscription/getMyDesigns đều 403), không phải hành vi riêng 1 API.
 * Đây là bug BE (thiếu AuthenticationEntryPoint trả 401 đúng chuẩn Spring Security — token hết
 * hạn đang bị xử lý như "không đủ quyền" thay vì "chưa xác thực") — ĐÃ báo BE, chưa có ETA fix.
 * Vá tạm ở đây để phiên đăng nhập không tự vỡ mỗi 15 phút (JWT_ACCESS_EXPIRATION_MS). Đánh đổi
 * chấp nhận được: 403 "hợp lệ" (vd thao tác không đủ quyền như tự accept offer của mình) sẽ tốn
 * thêm 1 lượt refresh+gọi lại thừa (refresh vẫn thành công vì access token cũ tuy hết hạn nhưng
 * refresh token còn hạn 7 ngày) — nhưng KHÔNG bị logout oan vì chỉ logout khi refresh THẤT BẠI,
 * không logout chỉ vì request lặp lại vẫn lỗi (có thể vẫn là 403 hợp lệ, không phải hết hạn).
 */
let refreshRequest = null;

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    const isAuthEndpoint = originalRequest?.url?.startsWith('/auth/');
    const status = error.response?.status;
    const isAuthFailure = status === 401 || status === 403;

    if (!isAuthFailure || originalRequest._retry || isAuthEndpoint) {
      if (status === 401) useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    const refreshToken = useAuthStore.getState().refreshToken;
    if (!refreshToken) {
      useAuthStore.getState().logout();
      return Promise.reject(error);
    }

    try {
      refreshRequest ??= http.post('/auth/refresh', { refreshToken }).finally(() => { refreshRequest = null; });
      const { data } = await refreshRequest;
      const result = toAuthResult(data);
      useAuthStore.getState().setAuth(result);
      originalRequest.headers.Authorization = `Bearer ${result.token}`;
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
   * ===== PRODUCTS (B2C catalog công khai — /shop, /product/:id) — FE-4 =====
   * GET /products?keyword=&categoryId=&materialId=&minPrice=&maxPrice=&room=&style=&available=&
   * has3d=&customizable=&sort=&page=&size= → Page<ProductSummaryResponse>
   * { id,supplierId,supplierName,categoryId,categoryName,materialName,name,status,priceFrom,
   *   primaryImageUrl,createdAt }. room/style luôn rỗng tới khi BE-7 seed dữ liệu (xem FE-5).
   * sort hỗ trợ 'name,asc|desc' và 'createdAt,asc|desc' — 'priceFrom,*' đang lỗi 500 ở BE (đã báo).
   */
  getProducts: (params) => call(() => http.get('/products', { params }), 'getProducts', params),
  // GET /products/featured — cho landing page. ⚠️ Đang 400 Bad Request trên BE (xem REAL_ENDPOINTS) — còn mock.
  getFeaturedProducts: () => call(() => http.get('/products/featured'), 'getFeaturedProducts'),
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

  // ===== ORDERS (checkout giả lập theo roadmap C.2) =====
  // POST /orders  body: { items: [{productId, qty}], address, paymentMethod }
  createOrder: (body) => call(() => http.post('/orders', body), 'createOrder', body),
  // GET /orders
  getOrders: () => call(() => http.get('/orders'), 'getOrders'),
  // GET /orders/:id
  getOrder: (id) => call(() => http.get(`/orders/${id}`), 'getOrder', id),

  // ===== CUSTOM =====
  // GET /custom/product-types
  getProductTypes: () => call(() => http.get('/custom/product-types'), 'getProductTypes'),
  // POST /custom/designs  body: { productType, dimensions, materialId, finishId }
  saveDesign: (body) => call(() => http.post('/custom/designs', body), 'saveDesign', body),
  // GET /custom/designs/:id
  getDesign: (id) => call(() => http.get(`/custom/designs/${id}`), 'getDesign', id),
  // POST /custom/match  body: { designId, location? } — matching RULE-BASED (không AI, theo scope MVP)
  matchWorkshops: (body) => call(() => http.post('/custom/match', body), 'matchWorkshops', body),

  /*
   * ===== CUSTOM DESIGN (BE-6) — Custom Studio wizard (bước 5/6, mục 2 api-guide-fe.md) =====
   * ⚠️ CÙNG path REST `/custom/designs` với saveDesign/getDesign ở trên nhưng body/response
   * KHÁC HẲN shape (saveDesign phục vụ CustomConfigure.jsx — trình chỉnh "khối hộp" cũ,
   * {productType,dimensions,materialId,finishId}; nhóm dưới đây đúng contract CustomDesignResponse
   * thật — {name,modelId,configuration jsonb gộp,thumbnailUrl,status,version}). Tách riêng tên hàm
   * để KHÔNG đụng luồng cũ (chưa gộp 2 luồng — xem CLAUDE.md mục 4.2 "sẽ hợp nhất vào luồng Meshy").
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
   * Chuyển hợp lệ (sai → 409): pending→confirmed/cancelled, confirmed→in_production/cancelled,
   * in_production→completed/cancelled. Customer CHỈ được cancel khi còn 'pending'.
   */
  updateCustomOrderStatus: ({ id, ...body }) => call(() => http.patch(`/custom-orders/${id}/status`, body), 'updateCustomOrderStatus', { id, ...body }),

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
  // POST /subscriptions/me/renew — cộng dồn +1 tháng cho gói trả phí đang active (free → 400)
  renewMySubscription: () => call(() => http.post('/subscriptions/me/renew'), 'renewMySubscription'),
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
   * suggestedProducts trong AiChatMessageResponse — đã xác nhận field THẬT (curl UI 2026-07-20):
   * [{ id, name, description, status, price }] — KHÔNG có productId/title/priceFrom/image như FE
   * dự phòng trước đó (ProductSuggestion trong ChatPanel.jsx vẫn giữ các fallback đó phòng khi AI
   * trả biến thể sản phẩm khác thiếu ảnh, nhưng field chính đã biết chắc là id/name/price).
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
  sendAiChatMessage: ({ sessionId, ...body }) => call(() => http.post(`/ai-chat/sessions/${sessionId}/messages`, body), 'sendAiChatMessage', { sessionId, ...body }),

  // ===== CONTACT =====
  // POST /contact  body: { name, email, subject, message }
  submitContact: (body) => call(() => http.post('/contact', body), 'submitContact', body),
};
