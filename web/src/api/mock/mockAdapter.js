import i18n from '../../i18n/index.js';
import { PRODUCTS, WORKSHOPS } from './data.js';
import { PRODUCT_TYPES } from './customData.js';
import { PLANS } from './plansData.js';
import { DEFAULT_SUPPLIER_STORE, DEFAULT_SUPPLIER_PRODUCTS, DEFAULT_SUPPLIER_ORDERS, ORDER_STATUS_SEQUENCE } from './supplierData.js';
import { storage } from '../../services/storage.js';

/*
 * Mock adapter — giả lập BE để FE chạy độc lập trước khi BE xong.
 * Mỗi hàm trả về ĐÚNG response shape đã thống nhất trong docs/API_CONTRACT.md,
 * nên khi BE bật lên, chuyển VITE_USE_MOCK=false là chạy, không sửa UI.
 */
const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms)); // giả lập độ trễ mạng

/*
 * ===== I18N CHO DỮ LIỆU SẢN PHẨM =====
 * BE thật sẽ trả chuỗi đã localize theo Accept-Language. Mock thì tự "dẹt" field song ngữ
 * { vi, en } về string theo ngôn ngữ đang chọn — UI chỉ nhận string, không phải xử lý gì.
 * (Để UI đổi theo ngôn ngữ, queryKey trong useProducts.js có kèm i18n.language → đổi ngữ là refetch.)
 */
const currentLang = () => (i18n.language?.startsWith('en') ? 'en' : 'vi');
const loc = (val) =>
  val && typeof val === 'object' && !Array.isArray(val) ? val[currentLang()] ?? val.vi : val;

// Chuyển 1 product (field song ngữ) → shape phẳng mà UI dùng: name/description/categoryName/materialName là string
const localizeProduct = (p) => ({
  ...p,
  name: loc(p.name),
  description: loc(p.description),
  categoryName: loc(p.category),
  materialName: loc(p.material),
});

// Cửa hàng demo hiển thị TẤT CẢ sản phẩm trong data (kể cả draft/archived) theo yêu cầu.
// (Muốn ẩn bớt sau này thì lọc theo p.status ở getProducts.)

// Dựng danh sách facet (danh mục/vật liệu) từ tập sản phẩm — distinct theo id, name đã localize
const buildFacet = (list, idKey, nameKey) => {
  const map = new Map();
  list.forEach((p) => {
    if (p[idKey] && !map.has(p[idKey])) map.set(p[idKey], loc(p[nameKey]));
  });
  return Array.from(map, ([id, name]) => ({ id, name }));
};

// Demo: 2 tài khoản test để đăng nhập supplier/admin khi KHÔNG chạy BE (BE thật xác định role từ DB)
const TEST_ACCOUNTS = {
  'supplier@woodhub.vn': 'supplier',
  'admin@woodhub.vn': 'admin',
};

const ORDERS_KEY = 'woodhub:orders';
const DESIGNS_KEY = 'woodhub:designs';
const SUPPLIER_STORE_KEY = 'woodhub:supplier-store';
const SUPPLIER_PRODUCTS_KEY = 'woodhub:supplier-products';
const SUPPLIER_ORDERS_KEY = 'woodhub:supplier-orders';

/*
 * "DB" cho designs/orders — giữ trong Map (lookup nhanh theo id) nhưng đồng bộ
 * với localStorage để dữ liệu không mất khi F5. Map không tự JSON.stringify được
 * nên lưu dưới dạng mảng [id, value] (entries) rồi dựng lại Map khi đọc.
 */
const memoryDb = {
  orders: new Map(storage.getItem(ORDERS_KEY, [])),
  designs: new Map(storage.getItem(DESIGNS_KEY, [])),
};
const persistOrders = () => storage.setItem(ORDERS_KEY, Array.from(memoryDb.orders.entries()));
const persistDesigns = () => storage.setItem(DESIGNS_KEY, Array.from(memoryDb.designs.entries()));

/*
 * "DB" cho Supplier Portal — demo chỉ có 1 supplier ("Xưởng Mộc Tân Bình"), nên lưu
 * dạng object/array đơn giản (không cần Map theo userId).
 */
let supplierStore = storage.getItem(SUPPLIER_STORE_KEY, null) ?? { ...DEFAULT_SUPPLIER_STORE };
let supplierProducts = storage.getItem(SUPPLIER_PRODUCTS_KEY, null) ?? DEFAULT_SUPPLIER_PRODUCTS.map((p) => ({ ...p }));
let supplierOrders = storage.getItem(SUPPLIER_ORDERS_KEY, null) ?? DEFAULT_SUPPLIER_ORDERS.map((o) => ({ ...o }));

const persistSupplierStore = () => storage.setItem(SUPPLIER_STORE_KEY, supplierStore);
const persistSupplierProducts = () => storage.setItem(SUPPLIER_PRODUCTS_KEY, supplierProducts);
const persistSupplierOrders = () => storage.setItem(SUPPLIER_ORDERS_KEY, supplierOrders);

let seq = 1;
const nextId = (prefix) => `${prefix}_${Date.now()}_${seq++}`;

// "Đăng ký đang chờ xác thực" — mock lưu tạm theo email để verifyOtp lấy lại tên/role.
// Mô phỏng luồng OTP mới của BE: register chỉ trả message, phải verifyOtp mới có token.
const pendingRegistrations = new Map();

export const mockAdapter = {
  async register(body) {
    await delay(500);
    pendingRegistrations.set(body.email, { name: body.name, role: 'customer' });
    return { message: 'Đăng ký thành công (demo). Nhập 6 số bất kỳ để xác thực email.' };
  },

  // Demo: chấp nhận mọi mã 6 số → trả token + user (lấy tên đã lưu lúc register, mặc định từ email)
  async verifyOtp(body) {
    await delay(400);
    const pending = pendingRegistrations.get(body.email);
    pendingRegistrations.delete(body.email);
    return {
      token: 'mock-jwt-token',
      user: { id: 'u1', name: pending?.name ?? body.email.split('@')[0], email: body.email, role: pending?.role ?? 'customer' },
    };
  },

  async resendOtp() {
    await delay(300);
    return { message: 'Đã gửi lại mã (demo).' };
  },

  // Demo đăng nhập Google — không gọi Google thật, trả 1 user mẫu
  async loginWithGoogle() {
    await delay(500);
    return {
      token: 'mock-jwt-token',
      user: { id: 'u_google', name: 'Google User', email: 'googleuser@gmail.com', role: 'customer' },
    };
  },

  async login(body) {
    await delay(500);
    // Demo: mọi email/password đều pass. Role ưu tiên theo email test (supplier@/admin@),
    // còn lại mặc định 'customer'. BE thật sẽ tự xác định role từ tài khoản trong DB.
    const role = TEST_ACCOUNTS[body.email?.toLowerCase()] ?? body.role ?? 'customer';
    // Demo: gắn tên hiển thị riêng cho supplier/admin để portal/admin có ngữ cảnh ngay sau khi login
    const name = role === 'supplier' ? supplierStore.name : role === 'admin' ? 'Quản trị viên' : body.email.split('@')[0];
    return {
      token: 'mock-jwt-token',
      user: { id: 'u1', name, email: body.email, role },
    };
  },

  async getProducts(params = {}) {
    await delay();
    // Hiển thị toàn bộ sản phẩm; facet danh mục+vật liệu dựng từ TẤT CẢ (không phụ thuộc filter)
    const all = [...PRODUCTS];
    const categories = buildFacet(all, 'categoryId', 'category');
    const materials = buildFacet(all, 'materialId', 'material');

    let items = all;
    if (params.category) items = items.filter((p) => p.categoryId === params.category);
    if (params.material) items = items.filter((p) => p.materialId === params.material);
    if (params.minPrice) items = items.filter((p) => p.price >= Number(params.minPrice));
    if (params.maxPrice) items = items.filter((p) => p.price <= Number(params.maxPrice));
    if (params.sort === 'price_asc') items = [...items].sort((a, b) => a.price - b.price);
    if (params.sort === 'price_desc') items = [...items].sort((a, b) => b.price - a.price);

    // Pagination shape chuẩn — BE trả y hệt để FE không sửa
    const page = Number(params.page ?? 1);
    const pageSize = Number(params.pageSize ?? 12);
    return {
      items: items.slice((page - 1) * pageSize, page * pageSize).map(localizeProduct),
      page,
      pageSize,
      total: items.length,
      categories,
      materials,
    };
  },

  async getFeaturedProducts() {
    await delay(250);
    return { items: PRODUCTS.filter((p) => p.status === 'active').slice(0, 4).map(localizeProduct) };
  },

  async getProduct(id) {
    await delay(250);
    const product = PRODUCTS.find((p) => p.id === id);
    if (!product) throw Object.assign(new Error('Not found'), { response: { status: 404 } });
    const related = PRODUCTS.filter((p) => p.id !== id && p.categoryId === product.categoryId);
    return { ...localizeProduct(product), related: related.map(localizeProduct) };
  },

  async createOrder(body) {
    await delay(600);
    const id = nextId('ord');
    
    // Status ban đầu sau khi đã (giả lập) thanh toán thành công ở Checkout
    const order = {
      id,
      status: 'processing',
      items: body.items,
      subtotal: body.subtotal || 0,
      shippingFee: body.shippingFee || 0,
      total: body.total || 0,
      shippingAddress: body.shippingAddress,
      paymentMethod: body.paymentMethod,
      createdAt: new Date().toISOString(),
      timeline: [
        { key: 'processing', done: true, at: new Date().toISOString() },
        { key: 'packing', done: false, at: null },
        { key: 'shipping', done: false, at: null },
        { key: 'completed', done: false, at: null },
      ],
    };
    memoryDb.orders.set(id, order);
    persistOrders();
    return order;
  },

  async getOrders() {
    await delay(300);
    const orders = Array.from(memoryDb.orders.values());
    orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    return { items: orders };
  },

  async getOrder(id) {
    await delay(250);
    const order = memoryDb.orders.get(id);
    if (!order) throw Object.assign(new Error('Not found'), { response: { status: 404 } });
    return order;
  },

  async getProductTypes() {
    await delay(200);
    return { items: PRODUCT_TYPES };
  },

  async saveDesign(body) {
    await delay(500);
    const id = nextId('dsg');
    const design = { id, ...body, createdAt: new Date().toISOString() };
    memoryDb.designs.set(id, design);
    persistDesigns();
    return design;
  },

  async getDesign(id) {
    await delay(250);
    const design = memoryDb.designs.get(id);
    if (!design) throw Object.assign(new Error('Not found'), { response: { status: 404 } });
    return design;
  },

  /*
   * Matching RULE-BASED (đúng scope MVP, không AI):
   * 1. Lọc cứng: xưởng phải làm được loại sản phẩm + đủ kích thước + có vật liệu
   * 2. Chấm điểm đơn giản: rating (50%) + tốc độ giao (30%) + kinh nghiệm (20%)
   * BE port y nguyên logic này sang Spring Boot service.
   */
  async matchWorkshops({ designId }) {
    await delay(700);
    const design = memoryDb.designs.get(designId);
    const { productType = 'table', dimensions = { width: 120 }, materialId = 'oak' } = design ?? {};

    const matches = WORKSHOPS
      .filter(
        (w) =>
          w.capability.types.includes(productType) &&
          w.capability.maxWidthCm >= dimensions.width &&
          w.capability.materials.includes(materialId)
      )
      .map((w) => ({
        ...w,
        score: Math.round(
          (w.rating / 5) * 50 + (1 - Math.min(w.leadTimeDays, 30) / 30) * 30 + Math.min(w.completedJobs / 150, 1) * 20
        ),
      }))
      .sort((a, b) => b.score - a.score);

    return { designId, matches };
  },

  async getWorkshops() {
    await delay(250);
    return { items: WORKSHOPS };
  },

  async getPlans() {
    await delay(250);
    return { items: PLANS };
  },

  async submitContact(body) {
    await delay(500);
    return { ok: true };
  },

  // ===== SUPPLIER PORTAL (B.6) =====
  async getDashboardStats() {
    await delay(300);
    const newOrders = supplierOrders.filter((o) => o.status === 'processing').length;
    const monthlyRevenue = supplierOrders.reduce((sum, o) => sum + o.total, 0);
    const topProducts = [...supplierProducts].sort((a, b) => (b.sold ?? 0) - (a.sold ?? 0)).slice(0, 3);
    const recentOrders = [...supplierOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5);
    // "Báo giá chờ xử lý" = số thiết kế khách đã lưu (custom configurator) — tiềm năng yêu cầu báo giá tới xưởng
    const pendingQuotes = memoryDb.designs.size;
    return { newOrders, monthlyRevenue, topProducts, pendingQuotes, recentOrders };
  },

  async getSupplierStore() {
    await delay(200);
    return { ...supplierStore };
  },

  async updateSupplierStore(body) {
    await delay(400);
    supplierStore = { ...supplierStore, ...body };
    persistSupplierStore();
    return { ...supplierStore };
  },

  async getSupplierProducts() {
    await delay(300);
    return { items: supplierProducts };
  },

  async createSupplierProduct(body) {
    await delay(400);
    const product = { id: nextId('sp'), sold: 0, ...body };
    supplierProducts = [product, ...supplierProducts];
    persistSupplierProducts();
    return product;
  },

  async updateSupplierProduct({ id, ...body }) {
    await delay(400);
    supplierProducts = supplierProducts.map((p) => (p.id === id ? { ...p, ...body } : p));
    persistSupplierProducts();
    return supplierProducts.find((p) => p.id === id);
  },

  async deleteSupplierProduct(id) {
    await delay(300);
    supplierProducts = supplierProducts.filter((p) => p.id !== id);
    persistSupplierProducts();
    return { ok: true };
  },

  async getSupplierOrders() {
    await delay(300);
    return { items: [...supplierOrders].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) };
  },

  // Cập nhật trạng thái đơn + đánh dấu "done" cho các bước timeline từ đầu tới status mới
  async updateSupplierOrderStatus({ id, status }) {
    await delay(400);
    supplierOrders = supplierOrders.map((o) => {
      if (o.id !== id) return o;
      const targetIdx = ORDER_STATUS_SEQUENCE.indexOf(status);
      const timeline = o.timeline.map((step, i) => ({
        ...step,
        done: i <= targetIdx,
        at: i <= targetIdx ? (step.at ?? new Date().toISOString()) : null,
      }));
      return { ...o, status, timeline };
    });
    persistSupplierOrders();
    return supplierOrders.find((o) => o.id === id);
  },
};
