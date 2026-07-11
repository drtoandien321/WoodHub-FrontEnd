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
  // Module Product (Portal Nhà cung cấp tự quản lý — /portal/supplier/products)
  // LƯU Ý: 'getMyProductDetail' TÁCH RIÊNG khỏi 'getProduct' dù cùng gọi GET /products/{id} —
  // 'getProduct' còn phục vụ trang công khai ProductDetail.jsx (CHƯA làm đợt này, shape UI
  // chưa đổi) nên không được bật chung, kẻo trang đó vỡ vì đổi sang shape thật giữa chừng.
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
]);

/*
 * Lớp chuyển đổi shape: BE trả phẳng AuthResponse
 *   { token, refreshToken, tokenType, userId, email, fullName, role, customerType, mustChangePassword }
 * còn toàn bộ FE (authStore, các page) dùng { token, refreshToken, user: { id, name, email, role, ... } }.
 * Gom về đúng 1 chỗ này để không phải sửa UI khi shape BE khác mock.
 * (Trước đây hàm này chỉ lấy 4 field — bỏ mất refreshToken/customerType/mustChangePassword nên
 * không thể làm refresh-token flow hay bắt supplier đổi mật khẩu lần đầu. Đã bổ sung đủ.)
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
 */
let refreshRequest = null;

http.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;
    const isAuthEndpoint = originalRequest?.url?.startsWith('/auth/');

    if (error.response?.status !== 401 || originalRequest._retry || isAuthEndpoint) {
      if (error.response?.status === 401) useAuthStore.getState().logout();
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

  // ===== PRODUCTS (B2C catalog) =====
  // GET /products?category=&material=&minPrice=&maxPrice=&sort=&page=
  getProducts: (params) => call(() => http.get('/products', { params }), 'getProducts', params),
  // GET /products/featured — cho landing page
  getFeaturedProducts: () => call(() => http.get('/products/featured'), 'getFeaturedProducts'),
  // GET /products/:id
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
   * ⚠️ authStore.user KHÔNG có field supplierType (AuthResponse của BE không trả field này) —
   * đây là hook DUY NHẤT lấy đúng type thật, không suy đoán từ đâu khác.
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

  // ===== AI 3D (nhánh Mẫu 3D / Upload — Meshy sau này) =====
  // GET /custom/models — thư viện mẫu 3D
  getModels3d: () => call(() => http.get('/custom/models'), 'getModels3d'),
  // GET /custom/models/:slug — 1 mẫu (gồm model vừa sinh từ ảnh)
  getModel3d: (slug) => call(() => http.get(`/custom/models/${slug}`), 'getModel3d', slug),
  // POST /custom/ai/generate — dựng 3D từ ảnh (BE proxy Meshy, giữ API key ở BE)
  generate3D: (body) => call(() => http.post('/custom/ai/generate', body), 'generate3D', body),
  // GET /custom/ai/tasks/:taskId — poll tiến trình dựng
  getGenTask: (taskId) => call(() => http.get(`/custom/ai/tasks/${taskId}`), 'getGenTask', taskId),

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

  // ===== CONTACT =====
  // POST /contact  body: { name, email, subject, message }
  submitContact: (body) => call(() => http.post('/contact', body), 'submitContact', body),
};
