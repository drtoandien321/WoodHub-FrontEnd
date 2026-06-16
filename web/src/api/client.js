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
const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false'; // mặc định mock để FE chạy độc lập
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8081/api';

/*
 * BE hiện mới làm xong nhóm Auth + User (xem Swagger). Các endpoint khác (products,
 * orders, custom, supplier...) CHƯA có BE → vẫn dùng mock kể cả khi VITE_USE_MOCK=false.
 * Chỉ những key nằm trong REAL_ENDPOINTS mới gọi BE thật. Khi BE làm xong endpoint mới,
 * chỉ cần thêm key vào đây — không phải sửa page/component.
 */
const REAL_ENDPOINTS = new Set(['login', 'register']);

/*
 * Lớp chuyển đổi shape: BE trả phẳng { token, userId, email, fullName, role },
 * còn toàn bộ FE (authStore, các page) dùng { token, user: { id, name, email, role } }.
 * Gom về đúng 1 chỗ này để không phải sửa UI khi shape BE khác mock.
 */
const toAuthResult = (data) => ({
  token: data.token,
  user: { id: data.userId, name: data.fullName, email: data.email, role: data.role },
});

export const http = axios.create({ baseURL: BASE_URL, timeout: 10_000 });

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

// 401 → token hết hạn/không hợp lệ → logout (V1: gọi POST /auth/refresh trước khi logout)
http.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) useAuthStore.getState().logout();
    return Promise.reject(error);
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
   * BE chỉ nhận { email, password, fullName, phone } và LUÔN tạo role = customer
   * (chưa hỗ trợ đăng ký supplier/business). Nên chỉ lấy đúng các field BE cần;
   * name/role/supplierInfo... từ form FE được map/bỏ qua tại đây.
   * BE trả 201 + { token, userId, email, fullName, role } → đổi về { token, user }.
   */
  register: async (body) => {
    if (USE_MOCK) return mockAdapter.register(body);
    const res = await http.post('/auth/register', {
      email: body.email,
      password: body.password,
      fullName: body.name,
      phone: body.phone,
    });
    return toAuthResult(res.data);
  },
  /*
   * POST /auth/login
   * BE chỉ nhận { email, password } (role do BE tự xác định từ tài khoản, bỏ qua role FE gửi).
   * Trả { token, userId, email, fullName, role } → đổi về { token, user }.
   */
  login: async (body) => {
    if (USE_MOCK) return mockAdapter.login(body);
    const res = await http.post('/auth/login', { email: body.email, password: body.password });
    return toAuthResult(res.data);
  },

  // ===== PRODUCTS (B2C catalog) =====
  // GET /products?category=&material=&minPrice=&maxPrice=&sort=&page=
  getProducts: (params) => call(() => http.get('/products', { params }), 'getProducts', params),
  // GET /products/featured — cho landing page
  getFeaturedProducts: () => call(() => http.get('/products/featured'), 'getFeaturedProducts'),
  // GET /products/:id
  getProduct: (id) => call(() => http.get(`/products/${id}`), 'getProduct', id),

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

  // ===== WORKSHOPS (trang Suppliers) =====
  // GET /workshops — danh sách xưởng/nhà cung cấp
  getWorkshops: () => call(() => http.get('/workshops'), 'getWorkshops'),

  // ===== PLANS (trang Pricing) =====
  // GET /plans — danh sách gói subscription theo nhóm (b2c | supplier | custom)
  getPlans: () => call(() => http.get('/plans'), 'getPlans'),

  // ===== CONTACT =====
  // POST /contact  body: { name, email, subject, message }
  submitContact: (body) => call(() => http.post('/contact', body), 'submitContact', body),

  // ===== SUPPLIER PORTAL (B.6) =====
  // GET /supplier/dashboard — KPI tổng quan
  getDashboardStats: () => call(() => http.get('/supplier/dashboard'), 'getDashboardStats'),
  // GET /supplier/store
  getSupplierStore: () => call(() => http.get('/supplier/store'), 'getSupplierStore'),
  // PATCH /supplier/store  body: { name, description, logoUrl, coverUrl }
  updateSupplierStore: (body) => call(() => http.patch('/supplier/store', body), 'updateSupplierStore', body),
  // GET /supplier/products
  getSupplierProducts: () => call(() => http.get('/supplier/products'), 'getSupplierProducts'),
  // POST /supplier/products
  createSupplierProduct: (body) => call(() => http.post('/supplier/products', body), 'createSupplierProduct', body),
  // PATCH /supplier/products/:id
  updateSupplierProduct: ({ id, ...body }) => call(() => http.patch(`/supplier/products/${id}`, body), 'updateSupplierProduct', { id, ...body }),
  // DELETE /supplier/products/:id
  deleteSupplierProduct: (id) => call(() => http.delete(`/supplier/products/${id}`), 'deleteSupplierProduct', id),
  // GET /supplier/orders
  getSupplierOrders: () => call(() => http.get('/supplier/orders'), 'getSupplierOrders'),
  // PATCH /supplier/orders/:id/status  body: { status }
  updateSupplierOrderStatus: ({ id, status }) => call(() => http.patch(`/supplier/orders/${id}/status`, { status }), 'updateSupplierOrderStatus', { id, status }),
};
