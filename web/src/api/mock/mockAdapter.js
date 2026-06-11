import { PRODUCTS, CATEGORIES, WORKSHOPS } from './data.js';
import { PRODUCT_TYPES } from './customData.js';
import { PLANS } from './plansData.js';

/*
 * Mock adapter — giả lập BE để FE chạy độc lập trước khi BE xong.
 * Mỗi hàm trả về ĐÚNG response shape đã thống nhất trong docs/API_CONTRACT.md,
 * nên khi BE bật lên, chuyển VITE_USE_MOCK=false là chạy, không sửa UI.
 */
const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms)); // giả lập độ trễ mạng

// "DB" tạm trong RAM cho designs/orders tạo trong phiên demo
const memoryDb = { designs: new Map(), orders: new Map() };
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
    // Demo: mọi email/password đều pass. BE thật phải verify + trả 401 nếu sai.
    return {
      token: 'mock-jwt-token',
      user: { id: 'u1', name: body.email.split('@')[0], email: body.email, role: 'customer' },
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
    /*
     * Checkout GIẢ LẬP theo roadmap C.2: tạo đơn trạng thái pending_payment,
     * KHÔNG gọi cổng VNPay/MoMo thật. Tích hợp thật để sau môn học.
     */
    const order = {
      id,
      status: 'pending_payment',
      items: body.items,
      address: body.address,
      paymentMethod: body.paymentMethod,
      total: body.items.reduce((s, i) => s + i.price * i.qty, 0),
      createdAt: new Date().toISOString(),
      timeline: [{ status: 'pending_payment', at: new Date().toISOString() }],
    };
    memoryDb.orders.set(id, order);
    return order;
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
};
