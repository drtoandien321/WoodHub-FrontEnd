import { PRODUCTS, CATEGORIES, WORKSHOPS } from './data.js';
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

export const mockAdapter = {
  async register(body) {
    await delay(500);
    return {
      token: 'mock-jwt-token',
      user: { id: 'u1', name: body.name, email: body.email, role: body.role ?? 'customer' },
    };
  },

  async login(body) {
    await delay(500);
    // Demo: mọi email/password đều pass, role lấy theo lựa chọn ở Login.jsx (BE thật sẽ tự xác định role từ tài khoản).
    const role = body.role ?? 'customer';
    // Demo: gắn tên hiển thị riêng cho supplier/admin để portal/admin có ngữ cảnh ngay sau khi login
    const name = role === 'supplier' ? supplierStore.name : role === 'admin' ? 'Quản trị viên' : body.email.split('@')[0];
    return {
      token: 'mock-jwt-token',
      user: { id: 'u1', name, email: body.email, role },
    };
  },

  async getProducts(params = {}) {
    await delay();
    let items = [...PRODUCTS];
    if (params.category) items = items.filter((p) => p.category === params.category);
    if (params.material) items = items.filter((p) => p.material === params.material);
    if (params.minPrice) items = items.filter((p) => p.price >= Number(params.minPrice));
    if (params.maxPrice) items = items.filter((p) => p.price <= Number(params.maxPrice));
    if (params.sort === 'price_asc') items.sort((a, b) => a.price - b.price);
    if (params.sort === 'price_desc') items.sort((a, b) => b.price - a.price);

    // Pagination shape chuẩn — BE trả y hệt để FE không sửa
    const page = Number(params.page ?? 1);
    const pageSize = Number(params.pageSize ?? 12);
    return {
      items: items.slice((page - 1) * pageSize, page * pageSize),
      page,
      pageSize,
      total: items.length,
      categories: CATEGORIES,
    };
  },

  async getFeaturedProducts() {
    await delay(250);
    return { items: PRODUCTS.slice(0, 4) };
  },

  async getProduct(id) {
    await delay(250);
    const product = PRODUCTS.find((p) => p.id === id);
    if (!product) throw Object.assign(new Error('Not found'), { response: { status: 404 } });
    return { ...product, related: PRODUCTS.filter((p) => p.id !== id && p.category === product.category) };
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
