import i18n from '../../i18n/index.js';
import { PRODUCTS, WORKSHOPS, CATEGORY_NAMES, MATERIAL_NAMES } from './data.js';
import { PRODUCT_TYPES } from './customData.js';
import { MODELS_3D, buildGeneratedModel } from './models3dData.js';
import { storage } from '../../services/storage.js';
import { useAuthStore } from '../../stores/authStore.js';

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

/*
 * ===== LÀM GIÀU DỮ LIỆU CHO TRANG CHI TIẾT (gallery + sizes) =====
 * Mock data gốc mỗi sản phẩm chỉ có 1 `image` + 1 thông số. Trang chi tiết mới cần GALLERY
 * nhiều ảnh + tuỳ chọn KÍCH THƯỚC. Để không phải sửa từng sản phẩm, ta sinh fallback tập trung
 * tại đây — khi BE thật trả `gallery`/`sizes` thì các field này có sẵn, UI không phải đổi.
 *   - gallery: ưu tiên p.gallery; nếu không có → [ảnh thật, + vài biến thể picsum theo seed id].
 *   - sizes:   ưu tiên p.sizes;   nếu không có → bộ kích thước mặc định theo categoryId (có thể rỗng).
 */
const DEFAULT_SIZES_BY_CATEGORY = {
  cat_dining: ['120 × 75 × 75 cm', '160 × 80 × 75 cm', '180 × 90 × 75 cm'],
  cat_table: ['80 × 45 × 45 cm', '100 × 50 × 45 cm', '120 × 55 × 45 cm'],
  cat_storage: ['60 × 30 × 180 cm', '70 × 30 × 180 cm', '80 × 30 × 180 cm'],
  cat_desk: ['100 × 60 × 75 cm', '120 × 60 × 75 cm', '140 × 70 × 75 cm'],
  cat_bed: ['Queen 160 × 200 cm', 'King 180 × 200 cm'],
  cat_chair: ['Tiêu chuẩn', 'Có tựa tay'],
};

const buildGallery = (p) => {
  if (Array.isArray(p.gallery) && p.gallery.length) return p.gallery;
  // Ảnh thật luôn đứng đầu (chạy offline được); 5 biến thể minh hoạ thêm để demo gallery.
  const extra = Array.from({ length: 5 }, (_, i) => `https://picsum.photos/seed/${p.id}-${i + 1}/800/600`);
  return [p.image, ...extra];
};

const enrichProductDetail = (p) => ({
  ...localizeProduct(p),
  gallery: buildGallery(p),
  sizes: Array.isArray(p.sizes) && p.sizes.length ? p.sizes : (DEFAULT_SIZES_BY_CATEGORY[p.categoryId] ?? []),
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

// Demo: các tài khoản test để đăng nhập supplier/admin khi KHÔNG chạy BE (BE thật xác định role từ DB)
const TEST_ACCOUNTS = {
  'supplier@woodhub.vn': 'supplier',
  'ncc@woodhub.vn': 'supplier', // Nhà cung cấp (manufacturer) — vào Portal /portal/supplier
  'xuong@woodhub.vn': 'supplier', // Xưởng mộc (workshop) — vào Portal /portal/workshop
  // Demo luồng "admin tạo tài khoản supplier → bắt đổi mật khẩu lần đầu" (mustChangePassword=true)
  'newsupplier@woodhub.vn': 'supplier',
  'admin@woodhub.vn': 'admin',
};
// Subtype của supplier (manufacturer | workshop) — quyết định portal đích sau khi login.
const SUPPLIER_TYPE = {
  'xuong@woodhub.vn': 'workshop',
  // còn lại (supplier@, ncc@) mặc định manufacturer
};

const ORDERS_KEY = 'woodhub:orders';
const DESIGNS_KEY = 'woodhub:designs';

/*
 * "DB" cho designs/orders — giữ trong Map (lookup nhanh theo id) nhưng đồng bộ
 * với localStorage để dữ liệu không mất khi F5. Map không tự JSON.stringify được
 * nên lưu dưới dạng mảng [id, value] (entries) rồi dựng lại Map khi đọc.
 */
const memoryDb = {
  orders: new Map(storage.getItem(ORDERS_KEY, [])),
  designs: new Map(storage.getItem(DESIGNS_KEY, [])),
  // Luồng AI 3D (Phase 0, ephemeral — không persist): task dựng model + model đã sinh ra
  genTasks: new Map(),
  genModels: new Map(),
};
const persistOrders = () => storage.setItem(ORDERS_KEY, Array.from(memoryDb.orders.entries()));

/*
 * "DB" cho sản phẩm THẬT của Portal Nhà cung cấp (/portal/supplier/products) — model đúng
 * ProductResponse thật: 1 sản phẩm nhiều variant + nhiều ảnh.
 * ⚠️ Ảnh dùng URL.createObjectURL(file) (xem uploadProductImage) — CHỈ tồn tại trong phiên hiện
 * tại, mất khi F5 (vì blob URL gắn với bộ nhớ JS, không phải file thật) — không sao ở mock,
 * BE thật lưu ảnh vĩnh viễn ở Supabase Storage.
 */
const MY_PRODUCTS_KEY = 'woodhub:my-products-v2';
let myProducts = storage.getItem(MY_PRODUCTS_KEY, []);
const persistMyProducts = () => storage.setItem(MY_PRODUCTS_KEY, myProducts);
const persistDesigns = () => storage.setItem(DESIGNS_KEY, Array.from(memoryDb.designs.entries()));

/*
 * "DB" cho CHI NHÁNH (Store) + TỒN KHO (StoreInventory) của Portal Nhà cung cấp mới
 * (/portal/supplier/branches) — khớp StoreResponse/StoreInventoryResponse thật.
 * storeInventory KHÔNG có id riêng — khoá kép (storeId, variantId), giống hệt BE
 * (composite key store_id + variant_id, xem entity/StoreInventoryId.java).
 */
const MY_STORES_KEY = 'woodhub:my-stores-v1';
let myStores = storage.getItem(MY_STORES_KEY, []);
const persistMyStores = () => storage.setItem(MY_STORES_KEY, myStores);

const STORE_INVENTORY_KEY = 'woodhub:store-inventory-v1';
let storeInventory = storage.getItem(STORE_INVENTORY_KEY, []); // [{ storeId, variantId, stockQuantity, createdAt, updatedAt }]
const persistStoreInventory = () => storage.setItem(STORE_INVENTORY_KEY, storeInventory);

// Tìm variant (+ product chứa nó) trong myProducts — dùng để "join" sku/color/dimensions/price
// vào StoreInventoryResponse, đúng như StoreInventoryResponse.fromEntity() bên BE join qua variant.
const findVariantWithProduct = (variantId) => {
  for (const p of myProducts) {
    const v = p.variants.find((x) => x.id === variantId);
    if (v) return { variant: v, product: p };
  }
  return null;
};

/*
 * "DB" cho CHAT (Conversation + Message) — chỉ để đầy đủ tầng api/client.js theo đúng quy ước
 * chung. ⚠️ 2 store thật dùng chat (stores/supplierChatStore.js, stores/portalChatStore.js) GIỮ
 * NGUYÊN luồng giả lập client-only cũ (setTimeout, không qua đây) khi VITE_USE_MOCK=true, vì mô
 * phỏng 2 CHIỀU thật (khách ↔ NCC) qua REST polling ở mock không đáng công — xem đầu 2 file đó.
 */
const CONVERSATIONS_KEY = 'woodhub:conversations-v1';
let mockConversations = storage.getItem(CONVERSATIONS_KEY, []);
const persistConversations = () => storage.setItem(CONVERSATIONS_KEY, mockConversations);

const CHAT_MESSAGES_KEY = 'woodhub:chat-messages-v1';
let mockChatMessages = storage.getItem(CHAT_MESSAGES_KEY, []);
const persistChatMessages = () => storage.setItem(CHAT_MESSAGES_KEY, mockChatMessages);

/*
 * "DB" cho CATEGORY (Portal Quản trị /admin/categories) — mutable, hỗ trợ cha-con thật để test
 * cây trong chế độ mock. Seed từ CATEGORY_NAMES (bilingual, gốc là danh mục phẳng) — bản ghi mới
 * do Admin tạo chỉ có tên đơn ngữ (giống CategoryResponse thật, BE không có i18n cho category).
 */
const MOCK_CATEGORIES_KEY = 'woodhub:admin-categories-v1';
let mockCategories = storage.getItem(MOCK_CATEGORIES_KEY, null) ?? Object.entries(CATEGORY_NAMES).map(([id, name]) => ({
  id, name: loc(name), slug: id.replace(/^cat_/, ''), parentId: null, createdAt: new Date().toISOString(),
}));
const persistMockCategories = () => storage.setItem(MOCK_CATEGORIES_KEY, mockCategories);

const slugify = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/(^-+|-+$)/g, '');

const buildCategoryTree = (items, parentId = null) =>
  items.filter((c) => (c.parentId ?? null) === parentId).map((c) => ({
    id: c.id, name: c.name, slug: c.slug, createdAt: c.createdAt, children: buildCategoryTree(items, c.id),
  }));

// Tra tên category theo id — ưu tiên bảng mutable (kể cả danh mục mới Admin vừa tạo), fallback
// CATEGORY_NAMES song ngữ gốc — để dropdown chọn danh mục ở form Thêm sản phẩm (Portal Nhà cung
// cấp) vẫn hiện đúng tên dù danh mục đó mới được Admin tạo trong phiên mock hiện tại.
const categoryNameById = (id) => mockCategories.find((c) => c.id === id)?.name ?? loc(CATEGORY_NAMES[id]);

/*
 * "DB" cho MATERIAL (Portal Quản trị /admin/materials) — mảng mutable, giống category nhưng
 * phẳng (không cha-con). Seed từ MATERIAL_NAMES (bilingual) — bản ghi mới do Admin tạo chỉ có
 * tên đơn ngữ (giống MaterialResponse thật, BE không có i18n cho material).
 */
const MOCK_MATERIALS_KEY = 'woodhub:admin-materials-v1';
let mockMaterials = storage.getItem(MOCK_MATERIALS_KEY, null) ?? Object.entries(MATERIAL_NAMES).map(([id, name]) => ({
  id, name: loc(name), createdAt: new Date().toISOString(),
}));
const persistMockMaterials = () => storage.setItem(MOCK_MATERIALS_KEY, mockMaterials);

const materialNameById = (id) => mockMaterials.find((m) => m.id === id)?.name ?? loc(MATERIAL_NAMES[id]);

/*
 * "DB" cho SUPPLIER quản trị (Portal Quản trị /admin/suppliers) — khác hẳn WORKSHOPS (dữ liệu
 * browse công khai, phong phú nhưng thiếu field nội bộ). Bắt đầu RỖNG (không seed) — Admin tự
 * tạo qua UI mới, giống trải nghiệm thật (admin tạo supplier từ đầu, không có sẵn "demo data").
 */
const MOCK_ADMIN_SUPPLIERS_KEY = 'woodhub:admin-suppliers-v1';
let mockAdminSuppliers = storage.getItem(MOCK_ADMIN_SUPPLIERS_KEY, []);
const persistMockAdminSuppliers = () => storage.setItem(MOCK_ADMIN_SUPPLIERS_KEY, mockAdminSuppliers);

/*
 * "DB" cho USER quản trị (Portal Quản trị /admin/users) — seed vài user mẫu + tự thêm user đang
 * đăng nhập (nếu có) để demo sửa/xoá thấy có tác dụng thật trong phiên hiện tại.
 */
const MOCK_ADMIN_USERS_KEY = 'woodhub:admin-users-v1';
const seedAdminUsers = () => {
  const now = new Date().toISOString();
  const base = [
    { id: 'demo-u1', email: 'khach1@example.com', fullName: 'Nguyễn Văn A', phone: '0901111111', role: 'customer', customerType: 'individual', createdAt: now, updatedAt: now },
    { id: 'demo-u2', email: 'doanhnghiep@example.com', fullName: 'Công ty TNHH ABC', phone: '0902222222', role: 'customer', customerType: 'business', createdAt: now, updatedAt: now },
    { id: 'demo-u3', email: 'supplier@woodhub.vn', fullName: 'Nhà cung cấp Demo', phone: '0903333333', role: 'supplier', customerType: 'individual', createdAt: now, updatedAt: now },
  ];
  const me = useAuthStore.getState().user;
  if (me?.id && !base.some((u) => u.id === me.id)) {
    base.unshift({ id: me.id, email: me.email, fullName: me.name, phone: me.phone ?? '', role: me.role, customerType: me.customerType ?? 'individual', createdAt: now, updatedAt: now });
  }
  return base;
};
let mockAdminUsers = storage.getItem(MOCK_ADMIN_USERS_KEY, null) ?? seedAdminUsers();
const persistMockAdminUsers = () => storage.setItem(MOCK_ADMIN_USERS_KEY, mockAdminUsers);

const toStoreInventoryResponse = (inv) => {
  const found = findVariantWithProduct(inv.variantId);
  return {
    storeId: inv.storeId,
    variantId: inv.variantId,
    productId: found?.product.id ?? null,
    sku: found?.variant.sku ?? '',
    color: found?.variant.color ?? '',
    dimensions: found?.variant.dimensions ?? '',
    price: found?.variant.price ?? null,
    stockQuantity: inv.stockQuantity,
    createdAt: inv.createdAt,
    updatedAt: inv.updatedAt,
  };
};

/*
 * "DB" cho SUBSCRIPTION (gói đăng ký) — 3 mảng mutable: gói đang bán (seed sẵn Free + 1 gói trả
 * phí, để trang Pricing mock có gì hiển thị), gói user đang dùng (null = chưa có gói active,
 * giống BE trả 404 ở GET /subscriptions/me), lịch sử thanh toán. Persist qua localStorage để demo
 * không mất khi F5, giống các module Admin khác ở trên.
 */
const MOCK_SUBSCRIPTION_PLANS_KEY = 'woodhub:subscription-plans-v1';
let mockSubscriptionPlans = storage.getItem(MOCK_SUBSCRIPTION_PLANS_KEY, null) ?? [
  {
    id: 'plan_free', name: 'free', displayName: 'Gói Free', description: 'Trải nghiệm cơ bản', price: 0,
    featureLimits: { ai_chat: 10, design: 3, export: 0, ar_3d: 0 },
    displayFeatures: ['Chat AI 10 lượt/tháng', 'Thiết kế 3 mẫu/tháng'],
    isActive: true, sortOrder: 0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'plan_premium', name: 'b2c_premium', displayName: 'B2C Premium AR/3D', description: 'Đầy đủ tính năng', price: 99000,
    featureLimits: { ai_chat: -1, design: 50, export: 20, ar_3d: 20 },
    displayFeatures: ['Chat AI không giới hạn', 'Thiết kế 50 mẫu/tháng', 'Xuất file 20 lượt/tháng', 'AR/3D 20 lượt/tháng'],
    isActive: true, sortOrder: 1, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
];
const persistMockSubscriptionPlans = () => storage.setItem(MOCK_SUBSCRIPTION_PLANS_KEY, mockSubscriptionPlans);

const MOCK_MY_SUBSCRIPTION_KEY = 'woodhub:my-subscription-v1';
let mockMySubscription = storage.getItem(MOCK_MY_SUBSCRIPTION_KEY, null);
const persistMockMySubscription = () => storage.setItem(MOCK_MY_SUBSCRIPTION_KEY, mockMySubscription);

const MOCK_PAYMENTS_KEY = 'woodhub:subscription-payments-v1';
let mockPayments = storage.getItem(MOCK_PAYMENTS_KEY, []);
const persistMockPayments = () => storage.setItem(MOCK_PAYMENTS_KEY, mockPayments);

let seq = 1;
const nextId = (prefix) => `${prefix}_${Date.now()}_${seq++}`;

// "Đăng ký đang chờ xác thực" — mock lưu tạm theo email để verifyOtp lấy lại tên/role.
// Mô phỏng luồng OTP mới của BE: register chỉ trả message, phải verifyOtp mới có token.
const pendingRegistrations = new Map();

// Mật khẩu tạm cho demo "supplier do admin tạo, bắt đổi mật khẩu lần đầu" — xem login() bên dưới.
const FORCE_CHANGE_PASSWORD_ACCOUNTS = new Set(['newsupplier@woodhub.vn']);

// Tra 1 workshop mock theo id (BE thật) hoặc slug (dữ liệu mock cũ) — dùng cho các hàm getSupplier*/getReview* bên dưới
const findWorkshop = (idOrSlug) => WORKSHOPS.find((w) => w.id === idOrSlug || w.slug === idOrSlug);

// Project 1 workshop mock (nhiều field) xuống ĐÚNG shape SupplierPublicResponse của BE thật
const toPublicSupplier = (w) => ({
  id: w.id,
  businessName: w.name,
  type: 'workshop', // mock hiện chỉ có dữ liệu xưởng; supplier type=retailer test qua BE thật
  description: w.about ?? w.description,
  contactEmail: w.contact?.email,
  contactPhone: w.contact?.phone,
  createdAt: new Date().toISOString(),
});

export const mockAdapter = {
  async register(body) {
    await delay(500);
    // Lưu tạm customerType + field doanh nghiệp để verifyOtp trả lại đúng (giống BE thật lưu vào users/business_profiles)
    pendingRegistrations.set(body.email, {
      name: body.name,
      role: 'customer',
      customerType: body.customerType ?? 'individual',
    });
    return { message: 'Đăng ký thành công (demo). Nhập 6 số bất kỳ để xác thực email.' };
  },

  // Demo: chấp nhận mọi mã 6 số → trả token + user (lấy tên đã lưu lúc register, mặc định từ email)
  async verifyOtp(body) {
    await delay(400);
    const pending = pendingRegistrations.get(body.email);
    pendingRegistrations.delete(body.email);
    return {
      token: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token',
      user: {
        id: 'u1',
        name: pending?.name ?? body.email.split('@')[0],
        email: body.email,
        role: pending?.role ?? 'customer',
        customerType: pending?.customerType ?? 'individual',
        mustChangePassword: false,
      },
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
      refreshToken: 'mock-refresh-token',
      user: {
        id: 'u_google', name: 'Google User', email: 'googleuser@gmail.com', role: 'customer',
        customerType: 'individual', mustChangePassword: false,
      },
    };
  },

  // Demo "quên mật khẩu": không gửi mail thật, chỉ trả message giống BE
  async forgotPassword() {
    await delay(400);
    return { message: 'Đã gửi mã đặt lại mật khẩu (demo). Nhập 6 số bất kỳ.' };
  },

  // Demo: chấp nhận mọi mã 6 số + mật khẩu mới hợp lệ
  async resetPassword() {
    await delay(400);
    return { message: 'Đặt lại mật khẩu thành công (demo).' };
  },

  async logout() {
    await delay(200);
    return { message: 'Đã đăng xuất (demo).' };
  },

  // Demo: không kiểm tra currentPassword, luôn thành công
  async changePassword() {
    await delay(400);
    return { message: 'Đổi mật khẩu thành công (demo).' };
  },

  // GET /users/me demo — trả lại đúng user đang có trong authStore (đăng nhập bằng mock trước đó)
  async getMe() {
    await delay(300);
    const user = useAuthStore.getState().user;
    return {
      id: user?.id ?? 'u1',
      email: user?.email ?? '',
      fullName: user?.name ?? '',
      phone: user?.phone ?? '',
      role: user?.role ?? 'customer',
      customerType: user?.customerType ?? 'individual',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  /*
   * PUT /users/{id} — dùng chung cho Profile.jsx (tự sửa) VÀ Admin sửa hộ user khác
   * (Portal Quản trị /admin/users). Ưu tiên tìm trong mockAdminUsers (để admin sửa user KHÁC
   * mình vẫn thấy đúng email/role của NGƯỜI ĐÓ, không lộn sang thông tin của admin đang đăng
   * nhập) — fallback về authStore khi user không có trong danh sách mock (tự sửa hồ sơ mình).
   */
  async updateUser({ id, fullName, phone }) {
    await delay(400);
    const idx = mockAdminUsers.findIndex((u) => u.id === id);
    if (idx !== -1) {
      mockAdminUsers[idx] = { ...mockAdminUsers[idx], fullName, phone, updatedAt: new Date().toISOString() };
      persistMockAdminUsers();
      return mockAdminUsers[idx];
    }
    const user = useAuthStore.getState().user;
    return {
      id, fullName, phone,
      email: user?.email ?? '',
      role: user?.role ?? 'customer',
      customerType: user?.customerType ?? 'individual',
      updatedAt: new Date().toISOString(),
    };
  },

  async login(body) {
    await delay(500);
    // Demo: mọi email/password đều pass. Role ưu tiên theo email test (supplier@/admin@),
    // còn lại mặc định 'customer'. BE thật sẽ tự xác định role từ tài khoản trong DB.
    const email = body.email?.toLowerCase();
    const role = TEST_ACCOUNTS[email] ?? body.role ?? 'customer';
    const supplierType = role === 'supplier' ? (SUPPLIER_TYPE[email] ?? 'manufacturer') : undefined;
    // Demo: gắn tên hiển thị riêng cho supplier/admin để portal/admin có ngữ cảnh ngay sau khi login
    const name =
      email === 'ncc@woodhub.vn' ? 'Nội Thất An Phát'
      : email === 'xuong@woodhub.vn' ? 'Xưởng Mộc Tân Phát'
      : email === 'newsupplier@woodhub.vn' ? 'NCC Mới (demo)'
      : role === 'supplier' ? supplierStore.name
      : role === 'admin' ? 'Quản trị viên'
      : body.email.split('@')[0];
    return {
      token: 'mock-jwt-token',
      refreshToken: 'mock-refresh-token',
      user: {
        id: 'u1', name, email: body.email, role,
        customerType: 'individual',
        // Demo luồng "supplier do admin tạo, bắt đổi mật khẩu lần đầu": đăng nhập bằng
        // newsupplier@woodhub.vn để thấy ChangePasswordRequired.jsx (xem routes/ProtectedRoute.jsx)
        mustChangePassword: FORCE_CHANGE_PASSWORD_ACCOUNTS.has(email),
        ...(supplierType && { supplierType }),
      },
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
    return { ...enrichProductDetail(product), related: related.map(localizeProduct) };
  },

  // ===== CATEGORY (Portal Quản trị /admin/categories) — mảng mutable mockCategories, hỗ trợ cây thật =====
  async getCategories() {
    await delay(200);
    return mockCategories.map((c) => ({
      id: c.id, parentId: c.parentId,
      parentName: c.parentId ? (mockCategories.find((p) => p.id === c.parentId)?.name ?? null) : null,
      name: c.name, slug: c.slug, createdAt: c.createdAt,
    }));
  },

  async getCategoryTree() {
    await delay(200);
    return buildCategoryTree(mockCategories);
  },

  async createCategory({ name, slug, parentId }) {
    await delay(300);
    if (parentId && !mockCategories.some((c) => c.id === parentId)) {
      throw Object.assign(new Error('parentId không tồn tại'), { response: { status: 400, data: { message: 'Danh mục cha không tồn tại' } } });
    }
    const cat = { id: nextId('cat'), name: name.trim(), slug: slug?.trim() || slugify(name), parentId: parentId || null, createdAt: new Date().toISOString() };
    mockCategories = [...mockCategories, cat];
    persistMockCategories();
    return { id: cat.id, parentId: cat.parentId, parentName: mockCategories.find((p) => p.id === cat.parentId)?.name ?? null, name: cat.name, slug: cat.slug, createdAt: cat.createdAt };
  },

  async updateCategory({ id, name, slug, parentId }) {
    await delay(300);
    const idx = mockCategories.findIndex((c) => c.id === id);
    if (idx === -1) throw Object.assign(new Error('Not found'), { response: { status: 404 } });
    if (parentId && parentId === id) {
      throw Object.assign(new Error('cycle'), { response: { status: 400, data: { message: 'Không thể chọn chính danh mục này làm danh mục cha' } } });
    }
    mockCategories[idx] = { ...mockCategories[idx], name: name.trim(), slug: slug?.trim() || mockCategories[idx].slug, parentId: parentId || null };
    persistMockCategories();
    const c = mockCategories[idx];
    return { id: c.id, parentId: c.parentId, parentName: mockCategories.find((p) => p.id === c.parentId)?.name ?? null, name: c.name, slug: c.slug, createdAt: c.createdAt };
  },

  // Mô phỏng đúng 2 rủi ro thật của BE: category có sản phẩm dùng → 409 (chặn xoá);
  // category có con → SET NULL (con tự thành gốc), không lỗi.
  async deleteCategory(id) {
    await delay(300);
    const inUse = PRODUCTS.some((p) => p.categoryId === id) || myProducts.some((p) => p.categoryId === id);
    if (inUse) {
      throw Object.assign(new Error('in use'), { response: { status: 409, data: { message: 'Danh mục đang được sử dụng bởi sản phẩm' } } });
    }
    mockCategories = mockCategories.filter((c) => c.id !== id).map((c) => (c.parentId === id ? { ...c, parentId: null } : c));
    persistMockCategories();
    return {};
  },

  // ===== MATERIAL (Portal Quản trị /admin/materials) — mảng mutable mockMaterials =====
  async getMaterials() {
    await delay(200);
    return mockMaterials.map((m) => ({ id: m.id, name: m.name, createdAt: m.createdAt }));
  },

  async createMaterial({ name }) {
    await delay(300);
    const trimmed = name.trim();
    if (mockMaterials.some((m) => m.name.toLowerCase() === trimmed.toLowerCase())) {
      throw Object.assign(new Error('Đã tồn tại'), { response: { status: 409, data: { message: 'Tên vật liệu đã tồn tại' } } });
    }
    const material = { id: nextId('mat'), name: trimmed, createdAt: new Date().toISOString() };
    mockMaterials = [...mockMaterials, material];
    persistMockMaterials();
    return material;
  },

  async updateMaterial({ id, name }) {
    await delay(300);
    const idx = mockMaterials.findIndex((m) => m.id === id);
    if (idx === -1) throw Object.assign(new Error('Not found'), { response: { status: 404 } });
    const trimmed = name.trim();
    if (mockMaterials.some((m) => m.id !== id && m.name.toLowerCase() === trimmed.toLowerCase())) {
      throw Object.assign(new Error('Đã tồn tại'), { response: { status: 409, data: { message: 'Tên vật liệu đã tồn tại' } } });
    }
    mockMaterials[idx] = { ...mockMaterials[idx], name: trimmed };
    persistMockMaterials();
    return mockMaterials[idx];
  },

  // AN TOÀN khi đang có sản phẩm dùng — giống BE (material_id ON DELETE SET NULL), không chặn xoá.
  async deleteMaterial(id) {
    await delay(300);
    mockMaterials = mockMaterials.filter((m) => m.id !== id);
    persistMockMaterials();
    return {};
  },

  // ===== PRODUCT (Portal Nhà cung cấp — /portal/supplier/products) =====
  async createProduct(body) {
    await delay(400);
    const now = new Date().toISOString();
    const id = nextId('prod');
    const variants = (body.variants ?? []).map((v) => ({
      id: nextId('var'), productId: id, sku: v.sku ?? '', color: v.color ?? '',
      dimensions: v.dimensions ?? '', price: v.price, createdAt: now, updatedAt: now,
    }));
    const product = {
      id, supplierId: 'mock-supplier', supplierName: 'Cửa hàng của bạn (demo)',
      categoryId: body.categoryId, categoryName: categoryNameById(body.categoryId) ?? '',
      materialId: body.materialId || null, materialName: body.materialId ? materialNameById(body.materialId) : null,
      name: body.name, description: body.description ?? '',
      status: body.status ?? 'draft', createdAt: now, updatedAt: now,
      variants, images: [],
    };
    myProducts = [product, ...myProducts];
    persistMyProducts();
    return product;
  },

  async getMyProducts(params = {}) {
    await delay(300);
    const items = params?.status ? myProducts.filter((p) => p.status === params.status) : myProducts;
    const toSummary = (p) => ({
      id: p.id, supplierId: p.supplierId, supplierName: p.supplierName,
      categoryId: p.categoryId, categoryName: p.categoryName, materialName: p.materialName,
      name: p.name, status: p.status,
      priceFrom: p.variants.length ? Math.min(...p.variants.map((v) => v.price)) : null,
      primaryImageUrl: p.images.find((i) => i.primary)?.url ?? p.images[0]?.url ?? null,
      createdAt: p.createdAt,
    });
    return { content: items.map(toSummary), page: { size: items.length || 20, number: 0, totalElements: items.length, totalPages: 1 } };
  },

  async getMyProductDetail(id) {
    await delay(250);
    const p = myProducts.find((x) => x.id === id);
    if (!p) throw Object.assign(new Error('Not found'), { response: { status: 404 } });
    return p;
  },

  async updateProduct({ id, name, description, categoryId, materialId }) {
    await delay(300);
    const idx = myProducts.findIndex((p) => p.id === id);
    if (idx === -1) throw Object.assign(new Error('Not found'), { response: { status: 404 } });
    myProducts[idx] = {
      ...myProducts[idx], name, description, categoryId,
      categoryName: categoryNameById(categoryId) ?? myProducts[idx].categoryName,
      materialId: materialId || null,
      materialName: materialId ? materialNameById(materialId) : null,
      updatedAt: new Date().toISOString(),
    };
    persistMyProducts();
    return myProducts[idx];
  },

  async updateProductStatus({ id, status }) {
    await delay(200);
    const idx = myProducts.findIndex((p) => p.id === id);
    if (idx === -1) throw Object.assign(new Error('Not found'), { response: { status: 404 } });
    myProducts[idx] = { ...myProducts[idx], status, updatedAt: new Date().toISOString() };
    persistMyProducts();
    return myProducts[idx];
  },

  async deleteProduct(id) {
    await delay(300);
    myProducts = myProducts.filter((p) => p.id !== id);
    persistMyProducts();
    return {};
  },

  // ===== PRODUCT VARIANT =====
  async createVariant({ productId, sku, color, dimensions, price }) {
    await delay(300);
    const idx = myProducts.findIndex((p) => p.id === productId);
    if (idx === -1) throw Object.assign(new Error('Not found'), { response: { status: 404 } });
    const now = new Date().toISOString();
    const variant = { id: nextId('var'), productId, sku: sku ?? '', color: color ?? '', dimensions: dimensions ?? '', price, createdAt: now, updatedAt: now };
    myProducts[idx] = { ...myProducts[idx], variants: [...myProducts[idx].variants, variant] };
    persistMyProducts();
    return variant;
  },

  async getVariants(productId) {
    await delay(200);
    return myProducts.find((p) => p.id === productId)?.variants ?? [];
  },

  async updateVariant({ variantId, sku, color, dimensions, price }) {
    await delay(300);
    const pIdx = myProducts.findIndex((p) => p.variants.some((v) => v.id === variantId));
    if (pIdx === -1) throw Object.assign(new Error('Not found'), { response: { status: 404 } });
    const variants = myProducts[pIdx].variants.map((v) =>
      v.id === variantId ? { ...v, sku: sku ?? '', color: color ?? '', dimensions: dimensions ?? '', price, updatedAt: new Date().toISOString() } : v
    );
    myProducts[pIdx] = { ...myProducts[pIdx], variants };
    persistMyProducts();
    return variants.find((v) => v.id === variantId);
  },

  async deleteVariant(variantId) {
    await delay(250);
    const pIdx = myProducts.findIndex((p) => p.variants.some((v) => v.id === variantId));
    if (pIdx !== -1) {
      myProducts[pIdx] = { ...myProducts[pIdx], variants: myProducts[pIdx].variants.filter((v) => v.id !== variantId) };
      persistMyProducts();
    }
    return {};
  },

  // ===== PRODUCT IMAGE — mock KHÔNG upload đi đâu cả, chỉ tạo blob URL tạm để preview =====
  async uploadProductImage({ productId, file, primary, sortOrder }) {
    await delay(500);
    const pIdx = myProducts.findIndex((p) => p.id === productId);
    if (pIdx === -1) throw Object.assign(new Error('Not found'), { response: { status: 404 } });
    const images = myProducts[pIdx].images;
    const isFirst = images.length === 0;
    const image = {
      id: nextId('img'), productId, url: URL.createObjectURL(file),
      primary: primary ?? isFirst, // nguyên lý (b): ảnh đầu tiên tự thành primary
      sortOrder: sortOrder ?? images.length,
      createdAt: new Date().toISOString(),
    };
    let next = [...images, image];
    if (image.primary) next = next.map((i) => (i.id === image.id ? i : { ...i, primary: false })); // nguyên lý (a)
    myProducts[pIdx] = { ...myProducts[pIdx], images: next };
    persistMyProducts();
    return image;
  },

  async getProductImages(productId) {
    await delay(200);
    const images = myProducts.find((p) => p.id === productId)?.images ?? [];
    return [...images].sort((a, b) => Number(b.primary) - Number(a.primary) || a.sortOrder - b.sortOrder);
  },

  async setPrimaryImage(imageId) {
    await delay(200);
    const pIdx = myProducts.findIndex((p) => p.images.some((i) => i.id === imageId));
    if (pIdx === -1) throw Object.assign(new Error('Not found'), { response: { status: 404 } });
    const images = myProducts[pIdx].images.map((i) => ({ ...i, primary: i.id === imageId }));
    myProducts[pIdx] = { ...myProducts[pIdx], images };
    persistMyProducts();
    return images.find((i) => i.id === imageId);
  },

  async updateProductImage({ imageId, url, sortOrder }) {
    await delay(250);
    const pIdx = myProducts.findIndex((p) => p.images.some((i) => i.id === imageId));
    if (pIdx === -1) throw Object.assign(new Error('Not found'), { response: { status: 404 } });
    const images = myProducts[pIdx].images.map((i) => (i.id === imageId ? { ...i, url, sortOrder } : i));
    myProducts[pIdx] = { ...myProducts[pIdx], images };
    persistMyProducts();
    return images.find((i) => i.id === imageId);
  },

  async deleteProductImage(imageId) {
    await delay(250);
    const pIdx = myProducts.findIndex((p) => p.images.some((i) => i.id === imageId));
    if (pIdx !== -1) {
      myProducts[pIdx] = { ...myProducts[pIdx], images: myProducts[pIdx].images.filter((i) => i.id !== imageId) };
      persistMyProducts();
    }
    return {};
  },

  // ===== STORE (Portal Nhà cung cấp — chi nhánh, /portal/supplier/branches) =====
  async createStore(body) {
    await delay(350);
    const now = new Date().toISOString();
    const store = {
      id: nextId('store'), supplierId: 'mock-supplier', supplierType: 'retailer',
      address: body.address, ward: body.ward ?? null, district: body.district ?? null, city: body.city ?? null,
      latitude: body.latitude ?? null, longitude: body.longitude ?? null, phone: body.phone ?? null,
      createdAt: now, updatedAt: now,
    };
    myStores = [store, ...myStores];
    persistMyStores();
    return store;
  },

  async getMyStores() {
    await delay(250);
    return myStores;
  },

  async updateStore({ id, address, ward, district, city, latitude, longitude, phone }) {
    await delay(300);
    const idx = myStores.findIndex((s) => s.id === id);
    if (idx === -1) throw Object.assign(new Error('Not found'), { response: { status: 404 } });
    myStores[idx] = {
      ...myStores[idx], address, ward: ward ?? null, district: district ?? null, city: city ?? null,
      latitude: latitude ?? null, longitude: longitude ?? null, phone: phone ?? null,
      updatedAt: new Date().toISOString(),
    };
    persistMyStores();
    return myStores[idx];
  },

  async deleteStore(id) {
    await delay(300);
    myStores = myStores.filter((s) => s.id !== id);
    storeInventory = storeInventory.filter((i) => i.storeId !== id);
    persistMyStores();
    persistStoreInventory();
    return {};
  },

  // ===== STORE INVENTORY (tồn kho theo cặp chi nhánh × biến thể) =====
  async getStoreInventory(storeId) {
    await delay(250);
    return storeInventory.filter((i) => i.storeId === storeId).map(toStoreInventoryResponse);
  },

  async addStock({ storeId, variantId, stockQuantity }) {
    await delay(300);
    // Khớp BE: 409 nếu biến thể này đã có trong kho của chi nhánh — phải adjustStock thay vì thêm lại.
    if (storeInventory.some((i) => i.storeId === storeId && i.variantId === variantId)) {
      throw Object.assign(new Error('Đã tồn tại'), {
        response: { status: 409, data: { message: 'Biến thể này đã có trong kho của chi nhánh; hãy điều chỉnh tồn kho thay vì thêm mới' } },
      });
    }
    const now = new Date().toISOString();
    const record = { storeId, variantId, stockQuantity, createdAt: now, updatedAt: now };
    storeInventory = [...storeInventory, record];
    persistStoreInventory();
    return toStoreInventoryResponse(record);
  },

  async adjustStock({ storeId, variantId, delta }) {
    await delay(250);
    const idx = storeInventory.findIndex((i) => i.storeId === storeId && i.variantId === variantId);
    if (idx === -1) {
      throw Object.assign(new Error('Not found'), {
        response: { status: 404, data: { message: 'Biến thể chưa có trong kho của chi nhánh; hãy thêm mới trước' } },
      });
    }
    const nextQty = storeInventory[idx].stockQuantity + delta;
    if (nextQty < 0) {
      throw Object.assign(new Error('Tồn kho không đủ'), {
        response: { status: 400, data: { message: `Tồn kho không đủ để xuất; tồn hiện tại là ${storeInventory[idx].stockQuantity}` } },
      });
    }
    storeInventory[idx] = { ...storeInventory[idx], stockQuantity: nextQty, updatedAt: new Date().toISOString() };
    persistStoreInventory();
    return toStoreInventoryResponse(storeInventory[idx]);
  },

  async deleteStock({ storeId, variantId }) {
    await delay(250);
    storeInventory = storeInventory.filter((i) => !(i.storeId === storeId && i.variantId === variantId));
    persistStoreInventory();
    return {};
  },

  async getVariantInventory(variantId) {
    await delay(250);
    const stores = storeInventory.filter((i) => i.variantId === variantId).map(toStoreInventoryResponse);
    const totalStock = stores.reduce((sum, s) => sum + s.stockQuantity, 0);
    return { variantId, totalStock, stores };
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

  /*
   * ===== SUPPLIER (browse công khai) =====
   * Project dữ liệu phong phú của WORKSHOPS (mock cũ) XUỐNG ĐÚNG shape BE thật trả về
   * (SupplierPublicResponse/StorePublicResponse/PortfolioResponse/ReviewResponse) — để component
   * viết theo shape thật chạy y hệt dù đang mock hay gọi BE. Không dùng slug — tra theo id
   * (giữ fallback theo w.slug để tương thích dữ liệu mock cũ, id thật của BE luôn là UUID).
   */
  async getPublicSuppliers(params = {}) {
    await delay(250);
    // Mock hiện chỉ có dữ liệu xưởng (workshop); supplier type=retailer test qua BE thật (VITE_USE_MOCK=false)
    const items = WORKSHOPS.filter((w) => !params?.type || params.type === 'workshop').map(toPublicSupplier);
    return { content: items, page: { size: items.length || 20, number: 0, totalElements: items.length, totalPages: 1 } };
  },

  async getSupplierPublicProfile(id) {
    await delay(250);
    const w = findWorkshop(id);
    if (!w) throw Object.assign(new Error('Not found'), { response: { status: 404 } });
    return toPublicSupplier(w);
  },

  async getSupplierStores(id) {
    await delay(250);
    const w = findWorkshop(id);
    if (!w) return [];
    const [district, city] = (w.district ?? '').split(',').map((s) => s.trim());
    return [{ id: `${w.id}-store1`, supplierId: w.id, supplierType: 'workshop', district: district || w.district, city: city || 'TP.HCM' }];
  },

  async getSupplierPortfolio(id) {
    await delay(250);
    const w = findWorkshop(id);
    if (!w) return [];
    return (w.portfolio ?? []).map((src, i) => ({
      id: `${w.id}-p${i}`, supplierId: w.id, productId: null, productName: null,
      imageUrl: src, title: null, description: null, sortOrder: i, createdAt: new Date().toISOString(),
    }));
  },

  async getReviews(params = {}) {
    await delay(250);
    const w = findWorkshop(params.targetId);
    const items = (w?.reviews ?? []).map((r, i) => ({
      id: `${params.targetId}-r${i}`, userId: `u-${i}`, userName: r.name,
      targetType: params.targetType, targetId: params.targetId, rating: r.rating, comment: r.text, createdAt: r.date,
    }));
    return { content: items, page: { size: items.length || 20, number: 0, totalElements: items.length, totalPages: 1 } };
  },

  async getReviewSummary(params = {}) {
    await delay(200);
    const w = findWorkshop(params.targetId);
    const reviews = w?.reviews ?? [];
    const average = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
    return { targetType: params.targetType, targetId: params.targetId, average, count: reviews.length };
  },

  // ===== SUPPLIER (hồ sơ CHÍNH supplier đang đăng nhập) =====
  async getSupplierMe() {
    await delay(200);
    const user = useAuthStore.getState().user;
    return {
      id: 'mock-supplier-id', userId: user?.id ?? 'u1',
      businessName: user?.name ?? 'Cửa hàng của bạn (demo)',
      taxCode: null, legalDocumentUrl: null, contactEmail: null, contactPhone: null, description: null,
      type: user?.supplierType ?? 'retailer', status: 'active', commissionRate: 0,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
  },

  /*
   * ===== GỢI Ý VỊ TRÍ (GPS) — mock trả rỗng =====
   * Mock không có store nào gắn toạ độ thật (catalog mock cũng dùng supplierId giả 'sup_01'...,
   * không khớp UUID thật) — trả [] để UI tự ẩn khối gợi ý (đúng luồng fallback "không có dữ
   * liệu toạ độ" đã thiết kế), KHÔNG bịa dữ liệu giả có distanceKm gây hiểu lầm khi demo.
   */
  async getNearbyStoresBySupplier() { await delay(300); return []; },
  async getNearestWorkshops() { await delay(300); return []; },
  async getWorkshopsWithinRadius() { await delay(300); return []; },

  // ===== USER quản trị (Portal Quản trị /admin/users) =====
  async getAdminUsers() {
    await delay(300);
    return { content: mockAdminUsers, page: { size: mockAdminUsers.length || 20, number: 0, totalElements: mockAdminUsers.length, totalPages: 1 } };
  },

  async getAdminUserDetail(id) {
    await delay(200);
    const u = mockAdminUsers.find((x) => x.id === id);
    if (!u) throw Object.assign(new Error('Not found'), { response: { status: 404 } });
    return u;
  },

  async deleteUser(id) {
    await delay(300);
    mockAdminUsers = mockAdminUsers.filter((u) => u.id !== id);
    persistMockAdminUsers();
    return {};
  },

  // ===== SUPPLIER quản trị (Portal Quản trị /admin/suppliers) =====
  async getAdminSuppliers(params = {}) {
    await delay(300);
    let items = mockAdminSuppliers;
    if (params.status) items = items.filter((s) => s.status === params.status);
    if (params.type) items = items.filter((s) => s.type === params.type);
    return { content: items, page: { size: items.length || 20, number: 0, totalElements: items.length, totalPages: 1 } };
  },

  async getAdminSupplierDetail(id) {
    await delay(200);
    const s = mockAdminSuppliers.find((x) => x.id === id);
    if (!s) throw Object.assign(new Error('Not found'), { response: { status: 404 } });
    return s;
  },

  // Mô phỏng: tạo user + supplier, KHÔNG thật sự gửi email (mock không có mail server) — chỉ demo UI/luồng.
  async createSupplier(body) {
    await delay(500);
    if (mockAdminSuppliers.some((s) => s.contactEmail && s.contactEmail === body.contactEmail)) {
      throw Object.assign(new Error('Đã tồn tại'), { response: { status: 409, data: { message: 'Email hoặc mã số thuế đã tồn tại' } } });
    }
    const now = new Date().toISOString();
    const supplier = {
      id: nextId('sup'), userId: nextId('user'), businessName: body.businessName,
      taxCode: body.taxCode ?? null, legalDocumentUrl: body.legalDocumentUrl ?? null,
      contactEmail: body.contactEmail ?? null, contactPhone: body.contactPhone ?? null,
      description: body.description ?? null, type: body.type, status: 'active',
      commissionRate: body.commissionRate ?? 0, createdAt: now, updatedAt: now,
    };
    mockAdminSuppliers = [supplier, ...mockAdminSuppliers];
    persistMockAdminSuppliers();
    return supplier;
  },

  async updateSupplierStatus({ id, status, commissionRate }) {
    await delay(300);
    const idx = mockAdminSuppliers.findIndex((s) => s.id === id);
    if (idx === -1) throw Object.assign(new Error('Not found'), { response: { status: 404 } });
    mockAdminSuppliers[idx] = {
      ...mockAdminSuppliers[idx], status,
      commissionRate: commissionRate ?? mockAdminSuppliers[idx].commissionRate,
      updatedAt: new Date().toISOString(),
    };
    persistMockAdminSuppliers();
    return mockAdminSuppliers[idx];
  },

  // ===== AI 3D (nhánh Mẫu 3D / Upload) =====
  // GET /custom/models — thư viện mẫu 3D dựng sẵn
  async getModels3d() {
    await delay(250);
    return { items: MODELS_3D };
  },

  // GET /custom/models/:slug — 1 mẫu (gồm cả model do user vừa sinh từ ảnh)
  async getModel3d(slug) {
    await delay(200);
    const model = memoryDb.genModels.get(slug) ?? MODELS_3D.find((m) => m.slug === slug || m.id === slug);
    if (!model) throw new Error('MODEL_NOT_FOUND');
    return model;
  },

  /*
   * POST /custom/ai/generate — bắt đầu dựng 3D từ ảnh.
   * Mock: tạo task, trả taskId ngay. (Thật: BE proxy gọi Meshy image-to-3D, KHÔNG để key ở FE.)
   */
  async generate3D({ imageName } = {}) {
    await delay(400);
    const taskId = `task_${Date.now().toString(36)}`;
    memoryDb.genTasks.set(taskId, { startedAt: Date.now(), imageName: imageName ?? null });
    return { taskId };
  },

  /*
   * GET /custom/ai/tasks/:taskId — poll tiến trình dựng.
   * Mock: giả lập ~7s rồi 'succeeded' + đăng ký model mới để getModel3d trả về.
   */
  async getGenTask(taskId) {
    await delay(150);
    const task = memoryDb.genTasks.get(taskId);
    if (!task) throw new Error('TASK_NOT_FOUND');
    const TOTAL_MS = 7000;
    const elapsed = Date.now() - task.startedAt;
    if (elapsed >= TOTAL_MS) {
      const slug = `gen-${taskId}`;
      if (!memoryDb.genModels.has(slug)) {
        memoryDb.genModels.set(slug, buildGeneratedModel(taskId, task.imageName));
      }
      return { status: 'succeeded', progress: 100, modelSlug: slug };
    }
    return { status: 'pending', progress: Math.min(95, Math.round((elapsed / TOTAL_MS) * 100)) };
  },

  async submitContact(body) {
    await delay(500);
    return { ok: true };
  },

  // ===== CHAT (hội thoại khách hàng ↔ nhà cung cấp) — xem ghi chú ở CONVERSATIONS_KEY =====
  async startConversation({ supplierId, productId }) {
    await delay(300);
    const me = useAuthStore.getState().user;
    const existing = mockConversations.find((c) => c.supplierId === supplierId && c.customerId === me?.id);
    if (existing) return existing;
    const now = new Date().toISOString();
    const conv = {
      id: nextId('conv'), customerId: me?.id ?? 'mock-user', customerName: me?.name ?? 'Khách',
      supplierId, supplierUserId: supplierId, supplierBusinessName: 'Nhà cung cấp',
      productId: productId ?? null, productName: null,
      lastMessageAt: null, customerLastReadAt: null, supplierLastReadAt: null, unreadCount: 0,
      createdAt: now, updatedAt: now,
    };
    mockConversations = [conv, ...mockConversations];
    persistConversations();
    return conv;
  },

  async getConversations() {
    await delay(250);
    return { content: mockConversations, page: { size: mockConversations.length || 20, number: 0, totalElements: mockConversations.length, totalPages: 1 } };
  },

  async getMessages({ conversationId }) {
    await delay(200);
    const items = mockChatMessages.filter((m) => m.conversationId === conversationId).slice().reverse();
    return { content: items, page: { size: items.length || 30, number: 0, totalElements: items.length, totalPages: 1 } };
  },

  async sendMessage({ conversationId, content, attachmentUrl }) {
    await delay(200);
    const me = useAuthStore.getState().user;
    const msg = {
      id: nextId('msg'), conversationId, senderId: me?.id ?? 'mock-user', senderName: me?.name ?? 'Bạn',
      content: content ?? null, attachmentUrl: attachmentUrl ?? null, createdAt: new Date().toISOString(),
    };
    mockChatMessages = [...mockChatMessages, msg];
    persistChatMessages();
    return msg;
  },

  async markAsRead() {
    await delay(150);
    return {};
  },

  async getPresence(userId) {
    await delay(150);
    return { userId, online: false, lastSeenAt: null };
  },

  // ===== SUBSCRIPTION PLANS (trang Pricing — công khai) =====
  async getSubscriptionPlans() {
    await delay(250);
    return mockSubscriptionPlans.filter((p) => p.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  },

  // ===== SUBSCRIPTION PLANS — quản trị (Portal Quản trị /admin/subscription-plans) =====
  async getAllSubscriptionPlans() {
    await delay(250);
    return [...mockSubscriptionPlans].sort((a, b) => a.sortOrder - b.sortOrder);
  },

  async createSubscriptionPlan(body) {
    await delay(350);
    if (mockSubscriptionPlans.some((p) => p.name === body.name)) {
      throw Object.assign(new Error('Conflict'), { response: { status: 409, data: { message: 'Mã gói đã tồn tại' } } });
    }
    const now = new Date().toISOString();
    const plan = {
      id: nextId('plan'), name: body.name, displayName: body.displayName, description: body.description ?? '',
      price: body.price, featureLimits: body.featureLimits ?? {}, displayFeatures: body.displayFeatures ?? [],
      isActive: body.isActive ?? true, sortOrder: body.sortOrder ?? 0, createdAt: now, updatedAt: now,
    };
    mockSubscriptionPlans = [...mockSubscriptionPlans, plan];
    persistMockSubscriptionPlans();
    return plan;
  },

  async updateSubscriptionPlan({ id, ...body }) {
    await delay(350);
    const idx = mockSubscriptionPlans.findIndex((p) => p.id === id);
    if (idx === -1) throw Object.assign(new Error('Not found'), { response: { status: 404 } });
    if (mockSubscriptionPlans.some((p) => p.id !== id && p.name === body.name)) {
      throw Object.assign(new Error('Conflict'), { response: { status: 409, data: { message: 'Mã gói đã tồn tại' } } });
    }
    mockSubscriptionPlans[idx] = {
      ...mockSubscriptionPlans[idx], name: body.name, displayName: body.displayName,
      description: body.description ?? '', price: body.price, featureLimits: body.featureLimits ?? {},
      displayFeatures: body.displayFeatures ?? [], isActive: body.isActive ?? true, sortOrder: body.sortOrder ?? 0,
      updatedAt: new Date().toISOString(),
    };
    persistMockSubscriptionPlans();
    return mockSubscriptionPlans[idx];
  },

  async deleteSubscriptionPlan(id) {
    await delay(300);
    if (mockMySubscription?.plan?.id === id) {
      throw Object.assign(new Error('Conflict'), { response: { status: 409, data: { message: 'Gói đang có người dùng, không thể xoá' } } });
    }
    mockSubscriptionPlans = mockSubscriptionPlans.filter((p) => p.id !== id);
    persistMockSubscriptionPlans();
    return {};
  },

  // ===== SUBSCRIPTIONS (gói của user đang đăng nhập) =====
  async subscribe(planId) {
    await delay(400);
    const plan = mockSubscriptionPlans.find((p) => p.id === planId);
    if (!plan) throw Object.assign(new Error('Not found'), { response: { status: 404, data: { message: 'Không tìm thấy gói' } } });
    if (plan.price > 0) {
      throw Object.assign(new Error('Bad request'), { response: { status: 400, data: { message: 'Gói trả phí phải thanh toán qua /payments/subscription' } } });
    }
    if (mockMySubscription?.status === 'active' && mockMySubscription.plan.id === planId) {
      throw Object.assign(new Error('Conflict'), { response: { status: 409, data: { message: 'Bạn đang sử dụng gói này' } } });
    }
    const now = new Date().toISOString();
    mockMySubscription = { id: nextId('sub'), userId: 'u1', status: 'active', startDate: now, endDate: null, createdAt: now, updatedAt: now, plan };
    persistMockMySubscription();
    return mockMySubscription;
  },

  async getMySubscription() {
    await delay(200);
    if (!mockMySubscription || mockMySubscription.status !== 'active') {
      throw Object.assign(new Error('Not found'), { response: { status: 404, data: { message: 'Chưa có gói active' } } });
    }
    return mockMySubscription;
  },

  async getMySubscriptionHistory() {
    await delay(200);
    return mockMySubscription ? [mockMySubscription] : [];
  },

  async renewMySubscription() {
    await delay(300);
    if (!mockMySubscription || mockMySubscription.status !== 'active') {
      throw Object.assign(new Error('Not found'), { response: { status: 404, data: { message: 'Chưa có gói active' } } });
    }
    if (mockMySubscription.plan.price === 0) {
      throw Object.assign(new Error('Bad request'), { response: { status: 400, data: { message: 'Gói free không cần gia hạn' } } });
    }
    const base = mockMySubscription.endDate ? new Date(mockMySubscription.endDate) : new Date();
    base.setMonth(base.getMonth() + 1);
    mockMySubscription = { ...mockMySubscription, endDate: base.toISOString(), updatedAt: new Date().toISOString() };
    persistMockMySubscription();
    return mockMySubscription;
  },

  async cancelMySubscription() {
    await delay(300);
    if (!mockMySubscription || mockMySubscription.status !== 'active') {
      throw Object.assign(new Error('Not found'), { response: { status: 404, data: { message: 'Chưa có gói active' } } });
    }
    mockMySubscription = { ...mockMySubscription, status: 'cancelled', updatedAt: new Date().toISOString() };
    persistMockMySubscription();
    return {};
  },

  // ===== PAYMENTS (SePay VietQR — chỉ gói trả phí) =====
  async createSubscriptionPayment(planId) {
    await delay(400);
    const plan = mockSubscriptionPlans.find((p) => p.id === planId);
    if (!plan) throw Object.assign(new Error('Not found'), { response: { status: 404, data: { message: 'Không tìm thấy gói' } } });
    const now = new Date();
    const payment = {
      id: nextId('pay'), purpose: 'subscription', amount: plan.price, status: 'pending',
      txnRef: nextId('SUB').toUpperCase(),
      qrUrl: `https://qr.sepay.vn/img?acc=demo&bank=DEMO&amount=${plan.price}&des=demo`,
      expiresAt: new Date(now.getTime() + 15 * 60_000).toISOString(),
      paidAt: null, paidAmount: null, createdAt: now.toISOString(),
      planId: plan.id, planName: plan.displayName, _polls: 0,
    };
    mockPayments = [payment, ...mockPayments];
    persistMockPayments();
    return payment;
  },

  // Demo: sau 3 lần FE poll thì tự chuyển "paid" + kích hoạt gói, để test được luồng poll không cần SePay thật.
  async getPayment(id) {
    await delay(300);
    const payment = mockPayments.find((p) => p.id === id);
    if (!payment) throw Object.assign(new Error('Not found'), { response: { status: 404, data: { message: 'Không tìm thấy giao dịch' } } });
    if (payment.status === 'pending') {
      payment._polls += 1;
      if (payment._polls >= 3) {
        payment.status = 'paid';
        payment.paidAt = new Date().toISOString();
        payment.paidAmount = payment.amount;
        const plan = mockSubscriptionPlans.find((p) => p.id === payment.planId);
        const now = new Date();
        mockMySubscription = {
          id: nextId('sub'), userId: 'u1', status: 'active', startDate: now.toISOString(),
          endDate: new Date(now.getTime() + 30 * 86_400_000).toISOString(),
          createdAt: now.toISOString(), updatedAt: now.toISOString(), plan,
        };
        persistMockMySubscription();
      }
      persistMockPayments();
    }
    return payment;
  },

  async getMyPayments() {
    await delay(200);
    return mockPayments;
  },

  // ===== USAGE (hạn mức dùng theo tháng) — demo: luôn "chưa dùng gì" (used: 0) =====
  async getMyUsage() {
    await delay(200);
    const limits = mockMySubscription?.status === 'active' ? mockMySubscription.plan.featureLimits : {};
    const period = new Date().toISOString().slice(0, 7);
    const features = ['ai_chat', 'design', 'export', 'ar_3d'];
    return features.map((feature) => {
      const limit = limits[feature] ?? 0;
      const unlimited = limit === -1;
      return { feature, period, used: 0, limit: unlimited ? null : limit, remaining: unlimited ? null : limit, unlimited };
    });
  },
};
