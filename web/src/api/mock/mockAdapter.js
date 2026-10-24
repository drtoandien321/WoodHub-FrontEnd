import i18n from '../../i18n/index.js';
import { PRODUCTS, WORKSHOPS, CATEGORY_NAMES, MATERIAL_NAMES, ROOMS, STYLES, ROOM_SCENES } from './data.js';
import { MODELS_3D, buildGeneratedModel } from './models3dData.js';
import { storage } from '../../services/storage.js';
import { useAuthStore } from '../../stores/authStore.js';
import { getAdvisorReply } from '../../services/chatbot/advisor.js';

/*
 * Mock adapter — giả lập BE để FE chạy độc lập trước khi BE xong.
 * Mỗi hàm trả về ĐÚNG response shape đã thống nhất trong docs/API_CONTRACT.md,
 * nên khi BE bật lên, chuyển VITE_USE_MOCK=false là chạy, không sửa UI.
 */
const delay = (ms = 350) => new Promise((r) => setTimeout(r, ms)); // giả lập độ trễ mạng

// Field tổng hợp của báo giá (giá mới nhất, giá chốt, thời gian dự kiến, số vòng) — mirror QuoteRequestResponse của BE.
const withQuoteSummary = (q) => {
  const offers = q.offers ?? [];
  const latest = offers[offers.length - 1];
  const accepted = offers.find((o) => o.status === 'accepted');
  const done = q.status === 'accepted' && accepted;
  const days = done ? accepted.leadTimeDays : latest?.leadTimeDays ?? null;
  let date = null;
  if (done && days) { const d = new Date(accepted.createdAt); d.setDate(d.getDate() + days); date = d.toISOString().slice(0, 10); }
  return {
    ...q,
    latestOfferPrice: latest?.price ?? null, latestOfferBy: latest?.offeredBy ?? null,
    finalPrice: done ? accepted.price : null, finalTotal: done ? accepted.price * q.quantity : null,
    estimatedDays: days, estimatedCompletionDate: date,
    negotiationRounds: offers.length, updatedAt: q.updatedAt ?? q.createdAt,
  };
};

// Lấy thiết kế của CHÍNH user đang đăng nhập — của người khác (hoặc không tồn tại) đều 404, giống BE thật
const ownedDesign = (id) => {
  const design = memoryDb.customDesigns.get(id);
  if (!design || design.userId !== (useAuthStore.getState().user?.id ?? null)) {
    throw Object.assign(new Error('DESIGN_NOT_FOUND'), { response: { status: 404 } });
  }
  return design;
};

/*
 * Dữ liệu thanh toán mock cho Portal Quản trị. Sinh tất định (theo chỉ số i) → lọc/phân trang ổn định.
 * 60 giao dịch rải 45 ngày gần nhất, đúng shape AdminPaymentResponse.
 */
const MOCK_PAYMENTS = (() => {
  const STATUSES = ['paid', 'paid', 'paid', 'pending', 'failed', 'expired'];
  const USERS = [
    ['Nguyễn Văn An', 'an.nguyen@example.com'], ['Trần Thị Bình', 'binh.tran@example.com'],
    ['Lê Hoàng Cường', 'cuong.le@example.com'], ['Phạm Minh Dũng', 'dung.pham@example.com'],
    ['Võ Thị Em', 'em.vo@example.com'],
  ];
  const PLANS = [['plan_basic', 'Gói Cơ bản', 99000], ['plan_pro', 'Gói Pro', 199000], ['plan_biz', 'Gói Doanh nghiệp', 499000]];
  const DAY = 86_400_000;
  const now = Date.now();
  return Array.from({ length: 60 }, (_, i) => {
    const status = STATUSES[i % STATUSES.length];
    const [name, email] = USERS[i % USERS.length];
    const [planId, planName, amount] = PLANS[i % PLANS.length];
    const created = now - (i * 0.75 * DAY) - (i % 7) * 3_600_000;
    const isSub = i % 4 !== 3;
    return {
      id: `pay-${String(i + 1).padStart(4, '0')}`,
      purpose: isSub ? 'subscription' : 'order',
      provider: 'sepay',
      status,
      amount,
      paidAmount: status === 'paid' ? amount : null,
      txnRef: `${isSub ? 'SUB' : 'ORD'}${(0xA1B2C3 + i * 7919).toString(16).toUpperCase().padStart(10, '0')}`,
      providerTxnId: status === 'paid' ? `FT25${String(100000 + i * 37)}` : null,
      expiresAt: new Date(created + 15 * 60_000).toISOString(),
      paidAt: status === 'paid' ? new Date(created + 4 * 60_000).toISOString() : null,
      createdAt: new Date(created).toISOString(),
      userId: `user-${(i % USERS.length) + 1}`, userEmail: email, userFullName: name,
      planId: isSub ? planId : null, planName: isSub ? planName : null,
    };
  });
})();

// Lọc theo createdAt (from/to) + status/purpose + q (txnRef/email/tên, không phân biệt hoa thường)
const filterMockPayments = ({ status, purpose, from, to, q }) => {
  const fromMs = from ? Date.parse(from) : -Infinity;
  const toMs = to ? Date.parse(to) : Infinity;
  const kw = q?.trim().toLowerCase();
  return MOCK_PAYMENTS.filter((p) => {
    const t = Date.parse(p.createdAt);
    if (t < fromMs || t > toMs) return false;
    if (status && p.status !== status) return false;
    if (purpose && p.purpose !== purpose) return false;
    if (kw && !`${p.txnRef} ${p.userEmail} ${p.userFullName}`.toLowerCase().includes(kw)) return false;
    return true;
  });
};

/*
 * ===== I18N CHO DỮ LIỆU SẢN PHẨM =====
 * BE thật sẽ trả chuỗi đã localize theo Accept-Language. Mock thì tự "dẹt" field song ngữ
 * { vi, en } về string theo ngôn ngữ đang chọn — UI chỉ nhận string, không phải xử lý gì.
 * (Để UI đổi theo ngôn ngữ, queryKey trong useProducts.js có kèm i18n.language → đổi ngữ là refetch.)
 */
const currentLang = () => (i18n.language?.startsWith('en') ? 'en' : 'vi');
const loc = (val) =>
  val && typeof val === 'object' && !Array.isArray(val) ? val[currentLang()] ?? val.vi : val;

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

// Kích thước fallback cho variant.dimensions khi sản phẩm mock không tự khai p.sizes
const defaultDimensions = (p) => (Array.isArray(p.sizes) && p.sizes.length ? p.sizes[0] : (DEFAULT_SIZES_BY_CATEGORY[p.categoryId]?.[0] ?? null));

/*
 * Chiếu dữ liệu PRODUCTS (mock cũ, song ngữ, 1 giá/1 ảnh) XUỐNG ĐÚNG shape ProductSummaryResponse/
 * ProductResponse thật của BE (đã curl xác nhận — xem client.js) — để bật REAL_ENDPOINTS không
 * phải sửa UI. Mock chỉ có 1 "biến thể" (variant) mỗi sản phẩm — khác thật (có thể nhiều), nhưng
 * đa số sản phẩm thật cũng chỉ có 1 variant nên đủ để demo UI chọn biến thể.
 */
const toProductSummary = (p) => ({
  id: p.id, supplierId: p.supplierId, supplierName: p.supplierName,
  categoryId: p.categoryId, categoryName: loc(p.category),
  materialName: p.materialId ? loc(p.material) : null,
  name: loc(p.name), status: p.status,
  priceFrom: p.price, primaryImageUrl: p.image ?? null,
  createdAt: p.createdAt,
});

const toProductDetail = (p) => ({
  id: p.id, supplierId: p.supplierId, supplierName: p.supplierName,
  categoryId: p.categoryId, categoryName: loc(p.category),
  materialId: p.materialId ?? null, materialName: p.materialId ? loc(p.material) : null,
  name: loc(p.name), description: loc(p.description), status: p.status,
  createdAt: p.createdAt, updatedAt: p.updatedAt ?? p.createdAt,
  variants: [{
    id: `${p.id}-v1`, productId: p.id, sku: null, color: null,
    dimensions: defaultDimensions(p),
    price: p.price, createdAt: p.createdAt, updatedAt: p.updatedAt ?? p.createdAt,
  }],
  images: buildGallery(p).map((url, i) => ({ id: `${p.id}-img${i}`, productId: p.id, url, primary: i === 0, sortOrder: i, createdAt: p.createdAt })),
});

// Demo: các tài khoản test để đăng nhập supplier/admin khi KHÔNG chạy BE (BE thật xác định role từ DB)
const TEST_ACCOUNTS = {
  'supplier@woodhub.vn': 'supplier',
  'ncc@woodhub.vn': 'supplier', // Nhà cung cấp (manufacturer) — vào Portal /portal/supplier
  'xuong@woodhub.vn': 'supplier', // Xưởng mộc (workshop) — vào Portal /portal/workshop
  // Demo luồng "admin tạo tài khoản supplier → bắt đổi mật khẩu lần đầu" (mustChangePassword=true)
  'newsupplier@woodhub.vn': 'supplier',
  'admin@woodhub.vn': 'admin',
};
// Subtype của supplier (retailer | workshop) — quyết định portal đích sau khi login.
const SUPPLIER_TYPE = {
  'xuong@woodhub.vn': 'workshop',
  // còn lại (supplier@, ncc@) mặc định retailer
};

const ORDERS_KEY = 'woodhub:orders-v2'; // v2: shape OrderResponse mới (checkout tách đơn theo supplier) — không đọc lại dữ liệu v1 cũ
const GEN_TASKS_KEY = 'woodhub:genTasks';
const GEN_MODELS_KEY = 'woodhub:genModels';
const CUSTOM_DESIGNS_KEY = 'woodhub:customDesigns'; // Custom Studio wizard (BE-6)

/*
 * "DB" cho designs/orders/AI-3D-tasks — giữ trong Map (lookup nhanh theo id) nhưng đồng bộ
 * với localStorage để dữ liệu không mất khi F5. Map không tự JSON.stringify được
 * nên lưu dưới dạng mảng [id, value] (entries) rồi dựng lại Map khi đọc.
 * genTasks/genModels PERSIST (khác Phase 0 cũ) — FE-2 yêu cầu "rời trang vẫn tiếp tục kiểm tra
 * task khi quay lại", nên task đang chạy phải sống sót qua điều hướng/F5, giống getMyGenTasks thật.
 */
const QUOTES_KEY = 'woodhub:quotes'; // BE-8 — FE-6
const CUSTOM_ORDERS_KEY = 'woodhub:customOrders'; // BE-8 — TÁCH khỏi memoryDb.orders (checkout B2C cũ)
const AI_CHAT_SESSIONS_KEY = 'woodhub:aiChatSessions';
const AI_CHAT_MESSAGES_KEY = 'woodhub:aiChatMessages';

const memoryDb = {
  orders: new Map(storage.getItem(ORDERS_KEY, [])),
  genTasks: new Map(storage.getItem(GEN_TASKS_KEY, [])),
  genModels: new Map(storage.getItem(GEN_MODELS_KEY, [])),
  customDesigns: new Map(storage.getItem(CUSTOM_DESIGNS_KEY, [])),
  quotes: new Map(storage.getItem(QUOTES_KEY, [])),
  customOrders: new Map(storage.getItem(CUSTOM_ORDERS_KEY, [])),
  aiChatSessions: new Map(storage.getItem(AI_CHAT_SESSIONS_KEY, [])),
  aiChatMessages: new Map(storage.getItem(AI_CHAT_MESSAGES_KEY, [])), // sessionId -> message[]
};
const persistOrders = () => storage.setItem(ORDERS_KEY, Array.from(memoryDb.orders.entries()));
const persistGenTasks = () => storage.setItem(GEN_TASKS_KEY, Array.from(memoryDb.genTasks.entries()));
const persistGenModels = () => storage.setItem(GEN_MODELS_KEY, Array.from(memoryDb.genModels.entries()));
const persistCustomDesigns = () => storage.setItem(CUSTOM_DESIGNS_KEY, Array.from(memoryDb.customDesigns.entries()));
const persistQuotes = () => storage.setItem(QUOTES_KEY, Array.from(memoryDb.quotes.entries()));
const persistCustomOrders = () => storage.setItem(CUSTOM_ORDERS_KEY, Array.from(memoryDb.customOrders.entries()));
const persistAiChatSessions = () => storage.setItem(AI_CHAT_SESSIONS_KEY, Array.from(memoryDb.aiChatSessions.entries()));
const persistAiChatMessages = () => storage.setItem(AI_CHAT_MESSAGES_KEY, Array.from(memoryDb.aiChatMessages.entries()));

/*
 * Xác định vai trò của user ĐANG ĐĂNG NHẬP so với 1 quote/order — mock đơn phiên (1 user/lần),
 * không biết "workshopId của tôi" thật (đó là dữ liệu server-side thật ở BE) nên suy theo quy ước:
 * user.id === customerId → 'customer'; role === 'admin' → 'admin'; còn lại (supplier) → 'workshop'.
 * ĐỦ để demo hành vi 2 chiều (đăng nhập customer test 1 vai, đăng nhập workshop test vai kia) —
 * KHÔNG mô phỏng nhiều workshop khác nhau cùng lúc trong 1 phiên trình duyệt.
 */
const actorRole = (entity) => {
  const me = useAuthStore.getState().user;
  if (!me) return 'customer';
  if (me.role === 'admin') return 'admin';
  if (me.id === entity.customerId) return 'customer';
  return 'workshop';
};

/*
 * Tính Ai3DTaskResponse hiện tại của 1 task từ dữ liệu lưu (lazy-on-read, giống Mock provider
 * thật ở BE-2 — KHÔNG dùng setInterval nền). Mốc thời gian mô phỏng: queued 0-500ms, processing
 * 500ms→7s (progress tăng dần), từ 7s → succeeded (hoặc failed nếu task.simulateFail).
 */
const resolveGenTask = async (taskId) => {
  const task = memoryDb.genTasks.get(taskId);
  if (!task) throw Object.assign(new Error('TASK_NOT_FOUND'), { response: { status: 404 } });

  if (task.explicitStatus === 'cancelled') {
    return { taskId, status: 'cancelled', progress: task.cancelledProgress ?? 0, modelSlug: null, posterUrl: null, modelUrl: null, errorCode: null, errorMessage: null };
  }

  const TOTAL_MS = 7000;
  const elapsed = Date.now() - task.startedAt;

  if (elapsed < TOTAL_MS) {
    return {
      taskId,
      status: elapsed < 500 ? 'queued' : 'processing',
      progress: elapsed < 500 ? 0 : Math.min(95, Math.round((elapsed / TOTAL_MS) * 100)),
      modelSlug: null, posterUrl: null, modelUrl: null, errorCode: null, errorMessage: null,
    };
  }

  if (task.simulateFail) {
    return {
      taskId, status: 'failed', progress: 100, modelSlug: null, posterUrl: null, modelUrl: null,
      errorCode: 'PROVIDER_ERROR', errorMessage: 'Không dựng được model từ ảnh này (mô phỏng lỗi để demo retry).',
    };
  }

  const slug = `gen-${taskId}`;
  if (!memoryDb.genModels.has(slug)) {
    const built = buildGeneratedModel(taskId, task.imageName);
    // Giống BE thật (MeshyAi3DProvider): mọi model AI mang tên mặc định "Model AI (Meshy)" — FE gợi ý tên ở bước 4
    built.name = 'Model AI (Meshy)';
    memoryDb.genModels.set(slug, built);
    persistGenModels();
  }
  // Refine (chỉ text-to-3D) vừa chạy xong → cập nhật CHÍNH model preview (cùng id/slug, giống BE)
  if (task.refining) {
    task.refining = false;
    task.refined = true;
    const m = memoryDb.genModels.get(slug);
    memoryDb.genModels.set(slug, { ...m, metadata: { ...m.metadata, refined: true } });
    persistGenModels();
    persistGenTasks();
  }
  const model = memoryDb.genModels.get(slug);
  const isText = task.inputType === 'text';
  return {
    taskId, status: 'succeeded', progress: 100, modelId: model.id, modelSlug: slug, posterUrl: model.posterUrl, modelUrl: model.modelGlbUrl,
    inputType: task.inputType ?? 'image', prompt: task.prompt ?? null,
    refined: !!task.refined, canRefine: isText && !task.refined,
    errorCode: null, errorMessage: null,
  };
};

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
 * "DB" cho GIỎ HÀNG server-side (/cart) — mỗi user 1 giỏ, khoá theo userId trong localStorage
 * (giống BE: giỏ gắn với tài khoản, đổi tài khoản là giỏ khác). Dòng giỏ chỉ lưu
 * { id, variantId, quantity, priceAtAddition, addedAt }; thông tin SP/giá HIỆN TẠI được "join"
 * lại mỗi lần đọc (toCartResponse) — đúng như BE join qua variant → product.
 */
const CART_KEY_PREFIX = 'woodhub:cart-v2:';
const cartKey = () => CART_KEY_PREFIX + (useAuthStore.getState().user?.id ?? 'anonymous');
const loadCart = () => storage.getItem(cartKey(), { id: crypto.randomUUID(), items: [], updatedAt: new Date().toISOString() });
const saveCart = (cart) => storage.setItem(cartKey(), { ...cart, updatedAt: new Date().toISOString() });

// Tìm variant ở catalog công khai (PRODUCTS, variant id = `${productId}-v1`, xem toProductDetail) lẫn SP portal (myProducts)
const findCartVariant = (variantId) => {
  const p = PRODUCTS.find((x) => `${x.id}-v1` === variantId);
  if (p) {
    return {
      productId: p.id, productName: loc(p.name), status: p.status, sku: null, color: null,
      supplierId: p.supplierId, supplierName: p.supplierName,
      dimensions: defaultDimensions(p), imageUrl: buildGallery(p)[0] ?? null, price: p.price,
    };
  }
  const found = findVariantWithProduct(variantId);
  if (!found) return null;
  const { variant, product } = found;
  return {
    productId: product.id, productName: product.name, status: product.status, sku: variant.sku ?? null,
    supplierId: product.supplierId ?? null, supplierName: product.supplierName ?? null,
    color: variant.color ?? null, dimensions: variant.dimensions ?? null,
    imageUrl: product.images?.find((i) => i.primary)?.url ?? product.images?.[0]?.url ?? null, price: variant.price,
  };
};

const cartError = (status, message) => Object.assign(new Error(message), { response: { status, data: { status, message } } });

const toCartResponse = (cart) => {
  const items = cart.items
    .map((it) => {
      const v = findCartVariant(it.variantId);
      if (!v) return null; // variant đã bị xoá → bỏ khỏi response
      return {
        id: it.id, variantId: it.variantId, productId: v.productId, productName: v.productName,
        sku: v.sku, color: v.color, dimensions: v.dimensions, imageUrl: v.imageUrl,
        unitPrice: v.price, quantity: it.quantity, lineTotal: v.price * it.quantity,
        priceAtAddition: it.priceAtAddition, addedAt: it.addedAt,
      };
    })
    .filter(Boolean);
  return {
    id: cart.id, items,
    totalItems: items.length,
    totalQuantity: items.reduce((n, i) => n + i.quantity, 0),
    subtotal: items.reduce((s, i) => s + i.lineTotal, 0),
    updatedAt: cart.updatedAt,
  };
};

/*
 * "DB" cho SỔ ĐỊA CHỈ (/addresses) — mỗi user 1 danh sách riêng (khoá theo userId), mô phỏng
 * đúng các bất biến BE tự giữ: địa chỉ đầu tiên tự là mặc định; isDefault=true thì gỡ cờ ở địa
 * chỉ khác; xoá địa chỉ mặc định thì đề bạt địa chỉ MỚI NHẤT còn lại.
 */
const ADDRESSES_KEY_PREFIX = 'woodhub:addresses-v1:';
const addressesKey = () => ADDRESSES_KEY_PREFIX + (useAuthStore.getState().user?.id ?? 'anonymous');
const loadAddresses = () => storage.getItem(addressesKey(), []);
const saveAddresses = (list) => storage.setItem(addressesKey(), list);
const toAddressResponse = (a) => ({ ...a, hasCoordinates: a.latitude != null && a.longitude != null });
// Thứ tự giống BE: mặc định đứng đầu, sau đó mới nhất trước
const sortAddresses = (list) =>
  [...list].sort((a, b) => (b.isDefault - a.isDefault) || b.createdAt.localeCompare(a.createdAt));
const findOwnAddress = (list, id) => {
  const a = list.find((x) => x.id === id);
  if (!a) throw Object.assign(new Error('ADDRESS_NOT_FOUND'), { response: { status: 404, data: { status: 404, message: 'Không tìm thấy địa chỉ' } } });
  return a;
};
const ADDRESS_FIELDS = ['recipientName', 'recipientPhone', 'addressLine', 'ward', 'district', 'city', 'latitude', 'longitude'];
const pickAddressFields = (body) =>
  Object.fromEntries(ADDRESS_FIELDS.map((k) => [k, body[k] ?? null]));

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
const MOCK_SUBSCRIPTION_PLANS_KEY = 'woodhub:subscription-plans-v2'; // v2: 3 gói giống production (bản v1 có dữ liệu cũ khác shape)
let mockSubscriptionPlans = storage.getItem(MOCK_SUBSCRIPTION_PLANS_KEY, null) ?? [
  {
    id: 'plan_free', name: 'free', displayName: 'Free', description: 'Trải nghiệm cơ bản', price: 0,
    featureLimits: { ai_chat: 20, design: 5, export: 5, ar_3d: 5 }, displayFeatures: [],
    isActive: true, sortOrder: 0, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'plan_premium', name: 'B2C Premium AR/3D', displayName: 'B2C Premium AR/3D', description: 'Chat AI không giới hạn cho người dùng cá nhân', price: 79000,
    featureLimits: { ai_chat: -1, design: 5, export: 5, ar_3d: 5 }, displayFeatures: [],
    isActive: true, sortOrder: 1, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
  {
    id: 'plan_custom', name: 'Custom Design Premium / Verified', displayName: 'Custom Design Premium / Verified', description: 'Thiết kế tuỳ chỉnh không giới hạn', price: 299000,
    featureLimits: { ai_chat: -1, design: -1, export: -1, ar_3d: -1 }, displayFeatures: [],
    isActive: true, sortOrder: 2, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  },
];
const persistMockSubscriptionPlans = () => storage.setItem(MOCK_SUBSCRIPTION_PLANS_KEY, mockSubscriptionPlans);

const MOCK_MY_SUBSCRIPTION_KEY = 'woodhub:my-subscription-v1';
let mockMySubscription = storage.getItem(MOCK_MY_SUBSCRIPTION_KEY, null);
const persistMockMySubscription = () => storage.setItem(MOCK_MY_SUBSCRIPTION_KEY, mockMySubscription);

const MOCK_PAYMENTS_KEY = 'woodhub:subscription-payments-v1';
let mockPayments = storage.getItem(MOCK_PAYMENTS_KEY, []);
const persistMockPayments = () => storage.setItem(MOCK_PAYMENTS_KEY, mockPayments);

/*
 * ===== CREDIT PACK (mua thêm lượt design) + VÍ LƯỢT ĐÃ MUA =====
 * Ví (purchased credits) KHÔNG reset theo tháng, tiêu sau khi hết hạn mức tháng của gói — mirror
 * bảng user_credit_balances bên BE. Mock giữ 1 ví chung (mock chỉ có 1 khách demo).
 */
const CREDIT_PACKS_KEY = 'woodhub:credit-packs-v1';
let mockCreditPacks = storage.getItem(CREDIT_PACKS_KEY, null) ?? [
  { id: 'cp_1', name: 'design_5', displayName: 'Gói 5 lượt thiết kế', feature: 'design', credits: 5, price: 50000, isActive: true, sortOrder: 1 },
  { id: 'cp_2', name: 'design_10', displayName: 'Gói 10 lượt thiết kế', feature: 'design', credits: 10, price: 90000, isActive: true, sortOrder: 2 },
  { id: 'cp_3', name: 'design_30', displayName: 'Gói 30 lượt (ngừng bán)', feature: 'design', credits: 30, price: 240000, isActive: false, sortOrder: 3 },
];
const persistCreditPacks = () => storage.setItem(CREDIT_PACKS_KEY, mockCreditPacks);
const CREDIT_WALLET_KEY = 'woodhub:credit-wallet-v1';
let mockCreditWallet = storage.getItem(CREDIT_WALLET_KEY, { design: 0 });
const persistCreditWallet = () => storage.setItem(CREDIT_WALLET_KEY, mockCreditWallet);

// Đánh giá WoodHub (web/app) — docs/BE-platform-feedback.md. Thưởng 5 lượt thiết kế cho lần đánh giá đầu của tài khoản.
const FEEDBACK_KEY = 'woodhub-mock-platform-feedback';
const FEEDBACK_REWARD = 5;
const avgOf = (list) => (list.length ? Math.round((list.reduce((s, f) => s + f.rating, 0) / list.length) * 10) / 10 : 0); // BE: chưa có → 0

/*
 * Traffic GA4 giả lập — số ổn định theo ngày (không random mỗi lần gọi) để biểu đồ không nhảy khi refetch.
 * Bật cờ localStorage 'woodhub:mock-ga-off' = '1' để giả lập BE chưa cấu hình GA (503).
 */
const seeded = (s) => { const x = Math.sin(s) * 10000; return x - Math.floor(x); };
const mockTraffic = ({ from, to, limit = 5 } = {}) => {
  const end = to ? new Date(to) : new Date();
  const start = from ? new Date(from) : new Date(end.getTime() - 29 * 86_400_000);
  const byDay = [];
  for (let d = new Date(start); d <= end && byDay.length < 366; d.setDate(d.getDate() + 1)) {
    const key = Math.floor(d.getTime() / 86_400_000);
    if (seeded(key) < 0.08) continue; // vài ngày không có dữ liệu → FE phải tự điền 0
    const users = 20 + Math.round(seeded(key + 1) * 60);
    byDay.push({ date: d.toISOString().slice(0, 10), users, sessions: Math.round(users * 1.35), pageViews: Math.round(users * 4.8) });
  }
  const sum = (k) => byDay.reduce((s, r) => s + r[k], 0);
  const users = sum('users');
  const sources = [['facebook', 'social', 0.46], ['(direct)', '(none)', 0.22], ['tiktok', 'social', 0.17], ['google', 'organic', 0.11], ['zalo', 'referral', 0.04]];
  const pages = [['/', 0.3], ['/shop', 0.22], ['/custom', 0.14], ['/product/p1', 0.08], ['/pricing', 0.06], ['/suppliers', 0.05]];
  return {
    totals: { activeUsers: users, newUsers: Math.round(users * 0.71), sessions: sum('sessions'), pageViews: sum('pageViews'), engagementRate: 0.62, avgSessionSeconds: 94 },
    bySource: sources.slice(0, limit).map(([source, medium, r]) => ({ source, medium, users: Math.round(users * r), sessions: Math.round(users * r * 1.3) })),
    byDay,
    topPages: pages.slice(0, limit).map(([path, r]) => ({ path, views: Math.round(sum('pageViews') * r), users: Math.round(users * r * 0.8) })),
    realtime: { activeUsers: 3 + Math.round(seeded(Date.now() / 60_000) * 9) },
  };
};

/*
 * ===== Helper cho mock CHECKOUT/ORDER (mirror logic BE ở OrderServiceImpl) =====
 */
const orderError = (status, message) => Object.assign(new Error(message), { response: { status, data: { status, message } } });

// Chi nhánh giao giả lập theo supplier (BE thật chọn chi nhánh có toạ độ GẦN điểm giao nhất)
const MOCK_SUPPLIER_STORES = {
  sup_01: { id: 'store_01', address: '45 Nguyễn Huệ, Quận 1', city: 'TP.HCM', phone: '02838000001', latitude: 10.7743, longitude: 106.7031 },
  sup_02: { id: 'store_02', address: '120 Phan Văn Trị, Gò Vấp', city: 'TP.HCM', phone: '02838000002', latitude: 10.8231, longitude: 106.6870 },
};
const mockStoreFor = (supplierId) =>
  MOCK_SUPPLIER_STORES[supplierId] ?? { id: 'store_x', address: '1 Võ Văn Kiệt, Quận 5', city: 'TP.HCM', phone: null, latitude: 10.7500, longitude: 106.6600 };

// Khoảng cách đường chim bay giữa 2 toạ độ (Haversine, km) — cùng công thức BE dùng tính phí ship
const haversineKm = (a, b) => {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.latitude)) * Math.cos(toRad(b.latitude)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
};

// Cấu hình ship mặc định của BE: 15k + 5k/km ngoài 3km, miễn khi đơn ≥ 2tr, trần 100k
// Admin sửa được qua PUT /admin/shipping-config (lưu localStorage để F5 không mất)
const SHIPPING_KEY = 'woodhub:shipping-config-v1';
let MOCK_SHIPPING = storage.getItem(SHIPPING_KEY, {
  id: 'ship_cfg_1', baseFee: 15000, perKmFee: 5000, freeRadiusKm: 3, freeShipThreshold: 2_000_000, maxFeeCap: 100_000,
  isActive: true, updatedAt: '2026-10-01T00:00:00Z',
});
const shippingFeeFor = (subtotal, distanceKm) => {
  const c = MOCK_SHIPPING;
  if (c.freeShipThreshold != null && subtotal >= c.freeShipThreshold) return 0;
  const fee = c.baseFee + c.perKmFee * Math.max(0, distanceKm - c.freeRadiusKm);
  return Math.round(c.maxFeeCap != null ? Math.min(fee, c.maxFeeCap) : fee);
};

/*
 * Coupon demo để test luồng checkout ở chế độ mock:
 *  SALE10   — giảm 10% tiền hàng (tối đa 500k), đơn từ 1tr
 *  GIAM50K  — giảm 50k tiền hàng, đơn từ 500k
 *  FREESHIP — miễn phí ship
 *  HETHAN   — đã hết hạn (để test lỗi 400)
 */
const PROMOTIONS_KEY = 'woodhub:promotions-v1';
// Supplier mock đang đăng nhập (getSupplierMe trả 'mock-supplier-id') được coi là chủ luôn 'sup_01'
// (Xưởng gỗ Thành Phát trong catalog mock) để demo được portal đơn hàng/khuyến mãi với dữ liệu sẵn có.
const MOCK_MY_SUPPLIER_IDS = ['mock-supplier-id', 'sup_01'];
const MOCK_MY_SUPPLIER = { id: 'sup_01', name: 'Xưởng gỗ Thành Phát' };
// Hồ sơ đã sửa (PUT /suppliers/me) + portfolio của supplier mock — persist để F5 vẫn còn
const SUPPLIER_ME_KEY = 'woodhub-mock-supplier-me';
const BUSINESS_PROFILE_KEY = 'woodhub-mock-business-profiles';
const PORTFOLIO_KEY = 'woodhub-mock-portfolio';
let mockPortfolio = storage.getItem(PORTFOLIO_KEY, null) ?? [];
const isSupplierUser = () => useAuthStore.getState().user?.role === 'supplier';
let MOCK_PROMOTIONS = storage.getItem(PROMOTIONS_KEY, null) ?? [
  { code: 'SALE10', name: 'Giảm 10% toàn sàn', type: 'product', discountType: 'percentage', discountValue: 10, maxDiscountAmount: 500_000, minOrderAmount: 1_000_000, endsAt: null },
  { code: 'GIAM50K', name: 'Giảm 50.000đ', type: 'product', discountType: 'fixed_amount', discountValue: 50_000, maxDiscountAmount: null, minOrderAmount: 500_000, endsAt: null },
  { code: 'FREESHIP', name: 'Miễn phí vận chuyển', type: 'shipping', discountType: 'free_shipping', discountValue: null, maxDiscountAmount: null, minOrderAmount: null, endsAt: null },
  { code: 'HETHAN', name: 'Mã đã hết hạn', type: 'product', discountType: 'percentage', discountValue: 20, maxDiscountAmount: null, minOrderAmount: null, endsAt: '2026-01-01T00:00:00Z' },
].map((p, i) => ({
  id: `promo_${i + 1}`, description: null, supplierId: null, supplierName: null, startsAt: null, isActive: true,
  usageLimit: null, usageLimitPerUser: null, usedCount: 0, productIds: [], createdAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-01T00:00:00Z', ...p,
}));
const persistPromotions = () => storage.setItem(PROMOTIONS_KEY, MOCK_PROMOTIONS);
const findActivePromotion = (raw) => {
  const code = String(raw ?? '').trim().toUpperCase();
  const promo = MOCK_PROMOTIONS.find((p) => p.code === code);
  if (!promo) throw orderError(404, `Mã ${code} không tồn tại`);
  const now = new Date();
  const outOfWindow = (promo.startsAt && new Date(promo.startsAt) > now) || (promo.endsAt && new Date(promo.endsAt) < now);
  if (!promo.isActive || outOfWindow) throw orderError(400, `Mã ${code} đã hết hiệu lực`);
  return { ...promo };
};
/*
 * Số tiền 1 mã giảm được trên 1 đơn. Mã product: chỉ tính trên dòng hàng thuộc phạm vi mã
 * (productIds rỗng = mọi sản phẩm — chỉ có ở seed demo, BE thật bắt buộc productIds) và mã của
 * supplier chỉ áp cho đơn của chính supplier đó.
 */
const promotionDiscount = (promo, order) => {
  if (promo.type === 'shipping') {
    return promo.discountType === 'free_shipping' ? order.shippingFee : Math.min(order.shippingFee, promo.discountValue ?? 0);
  }
  if (promo.supplierId && promo.supplierId !== order.supplierId) return 0;
  const base = promo.productIds?.length
    ? order.items.filter((i) => promo.productIds.includes(findCartVariant(i.variantId)?.productId)).reduce((s, i) => s + i.lineTotal, 0)
    : order.subtotal;
  if (!base) return 0;
  const raw = promo.discountType === 'percentage' ? Math.round((base * promo.discountValue) / 100) : promo.discountValue;
  return Math.min(base, promo.maxDiscountAmount != null ? Math.min(raw, promo.maxDiscountAmount) : raw);
};

// Luật chuyển trạng thái đơn — mirror bảng trong promotions-admin-fe.md (sai → 409)
const ORDER_TRANSITIONS = {
  pending_payment: ['cancelled'],
  paid: ['confirmed', 'cancelled', 'refunded'],
  confirmed: ['processing', 'cancelled', 'refunded'],
  processing: ['shipping', 'cancelled', 'refunded'],
  shipping: ['delivered', 'refunded'],
  delivered: ['completed', 'refunded'],
  completed: ['refunded'],
};
const applyOrderStatus = (order, status) => {
  // pending_payment → paid chỉ do webhook — không cho cập nhật tay (giống BE)
  if (!(ORDER_TRANSITIONS[order.status] ?? []).includes(status)) {
    throw orderError(409, `Không thể chuyển đơn từ "${order.status}" sang "${status}"`);
  }
  order.status = status;
  order.updatedAt = new Date().toISOString();
  persistOrders();
  return withPaymentInfo(order);
};

// Validate body khuyến mãi giống ràng buộc BE (400 kèm errors theo field)
const validatePromotion = (body, { asSupplier }) => {
  const errors = {};
  if (!body.code?.trim()) errors.code = 'Mã khuyến mãi không được để trống';
  if (!body.name?.trim()) errors.name = 'Tên khuyến mãi không được để trống';
  if (asSupplier && body.type !== 'product') errors.type = 'Nhà cung cấp chỉ tạo được khuyến mãi sản phẩm';
  if (body.discountType === 'free_shipping' && body.type !== 'shipping') errors.discountType = 'free_shipping chỉ dùng cho khuyến mãi shipping';
  if (body.discountType === 'percentage' && !(body.discountValue > 0 && body.discountValue <= 100)) errors.discountValue = 'Phần trăm phải trong (0, 100]';
  if (body.discountType === 'fixed_amount' && !(body.discountValue > 0)) errors.discountValue = 'Số tiền giảm phải > 0';
  if (body.type === 'product' && !body.productIds?.length) errors.productIds = 'Khuyến mãi sản phẩm phải chọn ít nhất 1 sản phẩm';
  if (Object.keys(errors).length) {
    throw Object.assign(new Error('VALIDATION'), { response: { status: 400, data: { status: 400, message: Object.values(errors)[0], errors } } });
  }
};
const ownPromotion = (id) => {
  const promo = MOCK_PROMOTIONS.find((p) => p.id === id);
  if (!promo) throw orderError(404, 'Không tìm thấy khuyến mãi');
  if (isSupplierUser() && promo.supplierId !== MOCK_MY_SUPPLIER.id) throw orderError(403, 'Không có quyền với khuyến mãi này');
  return promo;
};

// "Join" thông tin payment chung vào OrderResponse — giống BE (paymentStatus/QrUrl/TxnRef/ExpiresAt)
const withPaymentInfo = (order) => {
  const p = mockPayments.find((x) => x.id === order.paymentId);
  return {
    ...order,
    paymentStatus: p?.status ?? null, paymentQrUrl: p?.qrUrl ?? null,
    paymentTxnRef: p?.txnRef ?? null, paymentExpiresAt: p?.expiresAt ?? null,
  };
};

// Spring Page dạng VIA_DTO (BE bật @EnableSpringDataWebSupport(pageSerializationMode = VIA_DTO))
const toSpringPage = (all, { page = 0, size = 20 } = {}) => {
  const number = Number(page) || 0;
  const pageSize = Number(size) || 20;
  return {
    content: all.slice(number * pageSize, (number + 1) * pageSize),
    page: { size: pageSize, number, totalElements: all.length, totalPages: Math.max(1, Math.ceil(all.length / pageSize)) },
  };
};

let seq = 1;
const nextId = (prefix) => `${prefix}_${Date.now()}_${seq++}`;

// "Đăng ký đang chờ xác thực" — mock lưu tạm theo email để verifyOtp lấy lại tên/role.
// Mô phỏng luồng OTP mới của BE: register chỉ trả message, phải verifyOtp mới có token.
const pendingRegistrations = new Map();

// Mật khẩu tạm cho demo "supplier do admin tạo, bắt đổi mật khẩu lần đầu" — xem login() bên dưới.
const FORCE_CHANGE_PASSWORD_ACCOUNTS = new Set(['newsupplier@woodhub.vn']);

// Tra 1 workshop mock theo id (BE thật) hoặc slug (dữ liệu mock cũ) — dùng cho các hàm getSupplier*/getReview* bên dưới
const findWorkshop = (idOrSlug) => WORKSHOPS.find((w) => w.id === idOrSlug || w.slug === idOrSlug);

/*
 * "DB" ĐÁNH GIÁ (/reviews) = đánh giá do user mock viết (sửa/xoá được, lưu localStorage)
 * + đánh giá seed chỉ-đọc (của "người khác"): xưởng lấy từ WORKSHOPS[].reviews, cửa hàng mock của supplier
 * đang đăng nhập + sản phẩm p1 có vài đánh giá demo để portal/trang SP không trống.
 */
const USER_REVIEWS_KEY = 'woodhub:reviews-v1';
let mockUserReviews = storage.getItem(USER_REVIEWS_KEY, []);
const persistUserReviews = () => storage.setItem(USER_REVIEWS_KEY, mockUserReviews);
const ddmmyyyyToIso = (s) => {
  const [d, m, y] = String(s).split('/');
  return y ? new Date(`${y}-${m}-${d}T09:00:00Z`).toISOString() : s;
};
const DEMO_REVIEWS = [
  { name: 'Anh Minh Tuấn', date: '28/09/2026', rating: 5, text: 'Sản phẩm đẹp, đúng mô tả, giao nhanh. Nhân viên tư vấn nhiệt tình.' },
  { name: 'Chị Thu Hằng', date: '26/09/2026', rating: 4, text: 'Gỗ chắc, màu đẹp. Đóng gói kỹ nhưng giao trễ 1 ngày.' },
  { name: 'Anh Quốc Bảo', date: '20/09/2026', rating: 5, text: 'Rất hài lòng, sẽ ủng hộ tiếp.' },
  { name: 'Chị Mai Anh', date: '11/09/2026', rating: 3, text: 'Sản phẩm ổn, lắp ráp hơi mất thời gian.' },
];
const seedReviewsFor = (targetType, targetId) => {
  let rows = [];
  if (targetType === 'supplier' && findWorkshop(targetId)) rows = findWorkshop(targetId).reviews ?? [];
  else if (targetType === 'supplier' && MOCK_MY_SUPPLIER_IDS.includes(targetId)) rows = DEMO_REVIEWS;
  else if (targetType === 'product' && targetId === 'p1') rows = DEMO_REVIEWS.slice(0, 2);
  return rows.map((r, i) => ({
    id: `seed-${targetId}-${i}`, userId: `seed-user-${i}`, userName: r.name, targetType, targetId,
    rating: r.rating, comment: r.text, createdAt: ddmmyyyyToIso(r.date), updatedAt: ddmmyyyyToIso(r.date),
  }));
};
// 'mock-supplier-id' (getSupplierMe) và 'sup_01' (catalog) là CÙNG 1 cửa hàng mock → gộp đánh giá 2 id
const sameTarget = (r, targetType, targetId) =>
  r.targetType === targetType &&
  (r.targetId === targetId || (targetType === 'supplier' && MOCK_MY_SUPPLIER_IDS.includes(targetId) && MOCK_MY_SUPPLIER_IDS.includes(r.targetId)));
const allReviewsFor = (targetType, targetId) =>
  [...mockUserReviews.filter((r) => sameTarget(r, targetType, targetId)), ...seedReviewsFor(targetType, targetId)]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
/*
 * Mirror ReviewResponse.fromEntity của BE: đánh giá ẩn danh → che tên ("N*****n"), userId = null;
 * `mine` = của người đang xem. Dữ liệu lưu (mockUserReviews) vẫn giữ tên/id thật như DB.
 */
const maskReviewerName = (fullName) => {
  const compact = [...String(fullName ?? '').replace(/\s+/g, '')];
  if (!compact.length) return 'Ẩn danh';
  return compact.length === 1 ? `${compact[0]}*****` : `${compact[0]}*****${compact[compact.length - 1]}`;
};
// Thông báo mẫu cho mock — đọc trạng thái đã đọc từ storage để markRead có tác dụng
const mockNotificationsFor = (user) => {
  const readIds = new Set(storage.getItem('woodhub-mock-notif-read', []));
  const now = Date.now();
  const base = user?.role === 'supplier'
    ? [
      { id: 'n-s1', type: 'ORDER_PAID', title: 'Đơn mới #WH0001 đã thanh toán 1.500.000 ₫', params: { orderCode: 'WH0001', totalAmount: 1500000 }, targetType: 'order', targetId: 'o1' },
      { id: 'n-s2', type: 'REVIEW_NEW', title: 'Đánh giá mới 5 sao', params: { rating: 5, targetName: 'Bàn ăn gỗ sồi', reviewTargetType: 'product', reviewTargetId: 'p1' }, targetType: 'review', targetId: 'r1' },
    ]
    : [
      { id: 'n-c1', type: 'ORDER_STATUS_CHANGED', title: 'Đơn #WH0001 đã được xác nhận', params: { orderCode: 'WH0001', status: 'confirmed' }, targetType: 'order', targetId: 'o1' },
    ];
  return base.map((n, i) => ({ ...n, read: readIds.has(n.id), readAt: null, createdAt: new Date(now - (i + 1) * 3_600_000).toISOString() }));
};

// Câu trả lời của NCC theo reviewId (BE lưu trong review_replies) — mock persist để F5 vẫn còn
const REVIEW_REPLIES_KEY = 'woodhub-mock-review-replies';
let mockReviewReplies = storage.getItem(REVIEW_REPLIES_KEY, {});
const persistReviewReplies = () => storage.setItem(REVIEW_REPLIES_KEY, mockReviewReplies);
const toReviewResponse = (r, viewerId) => ({
  ...r,
  reply: mockReviewReplies[r.id] ?? null,
  anonymous: !!r.anonymous,
  userId: r.anonymous ? null : r.userId,
  userName: r.anonymous ? maskReviewerName(r.userName) : r.userName,
  mine: viewerId != null && r.userId === viewerId,
});
const reviewError = (status, message) => Object.assign(new Error(message), { response: { status, data: { status, message } } });
const validateReviewBody = (body) => {
  if (!Number.isInteger(body.rating) || body.rating < 1 || body.rating > 5) {
    throw Object.assign(new Error('VALIDATION'), { response: { status: 400, data: { status: 400, message: 'Số sao phải từ 1 đến 5', errors: { rating: 'Số sao phải từ 1 đến 5' } } } });
  }
  if ((body.comment ?? '').length > 2000) throw reviewError(400, 'Nội dung đánh giá tối đa 2000 ký tự');
};
const ownReview = (id) => {
  const review = mockUserReviews.find((r) => r.id === id);
  if (!review) throw reviewError(404, 'Không tìm thấy đánh giá');
  if (review.userId !== useAuthStore.getState().user?.id) throw reviewError(403, 'Bạn không có quyền sửa/xóa đánh giá này');
  return review;
};

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
  // ===== HỒ SƠ DOANH NGHIỆP (mock theo user đang đăng nhập, persist localStorage) =====
  async getBusinessProfile() {
    await delay(200);
    const uid = useAuthStore.getState().user?.id;
    const all = storage.getItem(BUSINESS_PROFILE_KEY, {});
    if (!all[uid]) throw orderError(404, 'Bạn không có hồ sơ doanh nghiệp');
    return all[uid];
  },
  async createBusinessProfile(body) {
    await delay(300);
    const uid = useAuthStore.getState().user?.id;
    const all = storage.getItem(BUSINESS_PROFILE_KEY, {});
    if (all[uid]) throw orderError(409, 'Bạn đã có hồ sơ doanh nghiệp');
    const now = new Date().toISOString();
    all[uid] = { id: `bp_${Date.now()}`, userId: uid, companyName: body.companyName.trim(), taxCode: body.taxCode.trim(), companyAddress: body.companyAddress.trim(), createdAt: now, updatedAt: now };
    storage.setItem(BUSINESS_PROFILE_KEY, all);
    return all[uid];
  },
  async updateBusinessProfile(body) {
    await delay(300);
    const uid = useAuthStore.getState().user?.id;
    const all = storage.getItem(BUSINESS_PROFILE_KEY, {});
    if (!all[uid]) throw orderError(404, 'Bạn không có hồ sơ doanh nghiệp');
    all[uid] = { ...all[uid], companyName: body.companyName.trim(), taxCode: body.taxCode.trim(), companyAddress: body.companyAddress.trim(), updatedAt: new Date().toISOString() };
    storage.setItem(BUSINESS_PROFILE_KEY, all);
    return all[uid];
  },

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
    const supplierType = role === 'supplier' ? (SUPPLIER_TYPE[email] ?? 'retailer') : undefined;
    // Demo: gắn tên hiển thị riêng cho supplier/admin để portal/admin có ngữ cảnh ngay sau khi login
    const name =
      email === 'ncc@woodhub.vn' ? 'Nội Thất An Phát'
      : email === 'xuong@woodhub.vn' ? 'Xưởng Mộc Tân Phát'
      : email === 'newsupplier@woodhub.vn' ? 'NCC Mới (demo)'
      : role === 'supplier' ? MOCK_MY_SUPPLIER.name // (trước đây trỏ tới biến supplierStore đã bị xoá → login supplier mock bị lỗi)
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

  /*
   * GET /products — khớp query + Page<ProductSummaryResponse> thật (FE-4). room/style luôn trả
   * rỗng (mock chưa gắn phòng/phong cách cho sản phẩm) — ĐÚNG hành vi BE thật lúc chưa seed
   * (xem docs/be-0-to-be-8-summary.md BE-7), không phải thiếu sót riêng của mock.
   */
  async getProducts(params = {}) {
    await delay();
    let items = PRODUCTS.filter((p) => p.status === 'active');
    const keyword = params.keyword?.toLowerCase().trim();
    if (keyword) items = items.filter((p) => loc(p.name).toLowerCase().includes(keyword));
    if (params.categoryId) items = items.filter((p) => p.categoryId === params.categoryId);
    if (params.materialId) items = items.filter((p) => p.materialId === params.materialId);
    if (params.minPrice) items = items.filter((p) => p.price >= Number(params.minPrice));
    if (params.maxPrice) items = items.filter((p) => p.price <= Number(params.maxPrice));
    if (String(params.has3d) === 'true') items = items.filter((p) => p.hasModel3d);
    if (String(params.customizable) === 'true') items = items.filter((p) => p.hasModel3d);
    if (String(params.available) === 'true') items = items.filter((p) => (p.stock ?? 0) > 0);
    if (params.room || params.style) items = [];

    const [sortField, sortDir] = (params.sort ?? '').split(',');
    const dirMul = sortDir === 'desc' ? -1 : 1;
    // Query param thật là `price` (khớp cột @Formula ở BE), KHÔNG phải `priceFrom` (đó là tên field response) — đã xác nhận 2026-07-20
    if (sortField === 'price') items = [...items].sort((a, b) => (a.price - b.price) * dirMul);
    else if (sortField === 'name') items = [...items].sort((a, b) => loc(a.name).localeCompare(loc(b.name)) * dirMul);
    else if (sortField === 'createdAt') items = [...items].sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1) * dirMul);

    const size = Number(params.size) || 12;
    const number = Number(params.page) || 0;
    const totalElements = items.length;
    const content = items.slice(number * size, number * size + size).map(toProductSummary);
    return { content, page: { size, number, totalElements, totalPages: Math.max(1, Math.ceil(totalElements / size)) } };
  },

  // GET /products/:id → ProductResponse thật (variants[]/images[], KHÔNG có `related` — related
  // dựng ở FE bằng 1 lượt getProducts({categoryId}) riêng, xem ProductDetail.jsx)
  async getProduct(id) {
    await delay(250);
    const product = PRODUCTS.find((p) => p.id === id);
    if (!product) throw Object.assign(new Error('Not found'), { response: { status: 404 } });
    return toProductDetail(product);
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

  // ===== ROOM / STYLE / ROOM SCENE (BE-7) — xem ghi chú seed demo ở data.js =====
  async getRooms() {
    await delay(200);
    return ROOMS.map((r) => ({ id: r.id, name: loc(r.name), slug: r.slug, sortOrder: r.sortOrder }));
  },
  async getRoomBySlug(slug) {
    await delay(200);
    const r = ROOMS.find((x) => x.slug === slug);
    if (!r) throw Object.assign(new Error('ROOM_NOT_FOUND'), { response: { status: 404 } });
    return { id: r.id, name: loc(r.name), slug: r.slug, sortOrder: r.sortOrder };
  },
  async getRoomScenes(slug) {
    await delay(250);
    const room = ROOMS.find((x) => x.slug === slug);
    if (!room) throw Object.assign(new Error('ROOM_NOT_FOUND'), { response: { status: 404 } });
    return ROOM_SCENES.filter((s) => s.roomId === room.id && s.isPublished).map((s) => ({
      id: s.id, name: loc(s.name), slug: s.slug, backgroundImageUrl: s.backgroundImageUrl, sortOrder: s.sortOrder,
    }));
  },
  async getRoomSceneDetail(id) {
    await delay(250);
    const scene = ROOM_SCENES.find((s) => s.id === id && s.isPublished);
    if (!scene) throw Object.assign(new Error('SCENE_NOT_FOUND'), { response: { status: 404 } });
    const room = ROOMS.find((r) => r.id === scene.roomId);
    return {
      id: scene.id, room: room ? { id: room.id, name: loc(room.name), slug: room.slug, sortOrder: room.sortOrder } : null,
      name: loc(scene.name), slug: scene.slug, backgroundImageUrl: scene.backgroundImageUrl,
      items: scene.items
        .map((item) => {
          const product = PRODUCTS.find((p) => p.id === item.productId && p.status === 'active');
          if (!product) return null; // hotspot chỉ gồm SP đang bán — khớp hành vi BE thật
          return { id: item.id, xPercent: item.xPercent, yPercent: item.yPercent, displayOrder: item.displayOrder, product: toProductSummary(product) };
        })
        .filter(Boolean)
        .sort((a, b) => a.displayOrder - b.displayOrder),
    };
  },
  async getStyles() {
    await delay(200);
    return STYLES.map((s) => ({ id: s.id, name: loc(s.name), slug: s.slug, sortOrder: s.sortOrder }));
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

  // ===== CART — mirror /api/cart (mọi hàm trả TOÀN BỘ CartResponse, giống BE) =====
  async getCart() {
    await delay(200);
    const cart = loadCart();
    saveCart(cart); // "tự tạo giỏ rỗng nếu chưa có" — lưu lại để id giỏ cố định
    return toCartResponse(cart);
  },

  async addCartItem({ variantId, quantity }) {
    await delay(250);
    const v = findCartVariant(variantId);
    if (!v) throw cartError(404, 'Không tìm thấy biến thể sản phẩm');
    if (v.status !== 'active') throw cartError(409, 'Sản phẩm không còn được bán');
    const cart = loadCart();
    const existing = cart.items.find((i) => i.variantId === variantId);
    if (existing) {
      existing.quantity = Math.min(999, existing.quantity + quantity); // cộng dồn như BE
    } else {
      cart.items.push({ id: crypto.randomUUID(), variantId, quantity, priceAtAddition: v.price, addedAt: new Date().toISOString() });
    }
    saveCart(cart);
    return toCartResponse(loadCart());
  },

  async updateCartItem({ itemId, quantity }) {
    await delay(200);
    const cart = loadCart();
    const item = cart.items.find((i) => i.id === itemId);
    if (!item) throw cartError(404, 'Không tìm thấy dòng giỏ hàng');
    item.quantity = quantity; // ghi đè, không cộng dồn
    saveCart(cart);
    return toCartResponse(loadCart());
  },

  async removeCartItem(itemId) {
    await delay(200);
    const cart = loadCart();
    if (!cart.items.some((i) => i.id === itemId)) throw cartError(404, 'Không tìm thấy dòng giỏ hàng');
    saveCart({ ...cart, items: cart.items.filter((i) => i.id !== itemId) });
    return toCartResponse(loadCart());
  },

  async clearCart() {
    await delay(200);
    saveCart({ ...loadCart(), items: [] });
    return toCartResponse(loadCart());
  },

  // ===== ADDRESSES — mirror /api/addresses =====
  async getAddresses() {
    await delay(200);
    return sortAddresses(loadAddresses()).map(toAddressResponse);
  },

  async createAddress(body) {
    await delay(300);
    const list = loadAddresses();
    const now = new Date().toISOString();
    // Địa chỉ đầu tiên luôn là mặc định, kể cả khi client gửi isDefault=false
    const isDefault = list.length === 0 || body.isDefault === true;
    const next = isDefault ? list.map((a) => ({ ...a, isDefault: false })) : list;
    const address = { id: crypto.randomUUID(), ...pickAddressFields(body), isDefault, createdAt: now, updatedAt: now };
    saveAddresses([...next, address]);
    return toAddressResponse(address);
  },

  async updateAddress({ id, ...body }) {
    await delay(300);
    let list = loadAddresses();
    const current = findOwnAddress(list, id);
    // isDefault=true → gỡ cờ ở địa chỉ khác; không gửi/false thì giữ nguyên cờ hiện tại
    // (không cho "bỏ mặc định" để rơi vào trạng thái không có địa chỉ mặc định nào)
    const isDefault = body.isDefault === true ? true : current.isDefault;
    if (body.isDefault === true) list = list.map((a) => ({ ...a, isDefault: false }));
    const updated = { ...current, ...pickAddressFields(body), isDefault, updatedAt: new Date().toISOString() };
    saveAddresses(list.map((a) => (a.id === id ? updated : a)));
    return toAddressResponse(updated);
  },

  async deleteAddress(id) {
    await delay(250);
    const list = loadAddresses();
    const target = findOwnAddress(list, id);
    let rest = list.filter((a) => a.id !== id);
    if (target.isDefault && rest.length) {
      const newest = [...rest].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
      rest = rest.map((a) => ({ ...a, isDefault: a.id === newest.id }));
    }
    saveAddresses(rest);
    return null; // 204
  },

  async setDefaultAddress(id) {
    await delay(250);
    const list = loadAddresses();
    findOwnAddress(list, id);
    const next = list.map((a) => ({ ...a, isDefault: a.id === id }));
    saveAddresses(next);
    return toAddressResponse(next.find((a) => a.id === id));
  },

  // ===== ORDERS + CHECKOUT — mirror /api/orders (docs/order-checkout-fe.md) =====
  async checkout(body) {
    await delay(700);
    const cart = loadCart();
    const lines = toCartResponse(cart).items;
    if (!lines.length) throw orderError(400, 'Giỏ hàng trống');

    // ① Điểm giao: địa chỉ đã lưu (phải có toạ độ) HOẶC nhập tay kèm toạ độ
    let dest;
    if (body.addressId) {
      const saved = loadAddresses().find((a) => a.id === body.addressId);
      if (!saved) throw orderError(404, 'Không tìm thấy địa chỉ');
      if (saved.latitude == null || saved.longitude == null) throw orderError(400, 'Địa chỉ chưa có toạ độ, vui lòng ghim trên bản đồ');
      dest = { ...saved, locationSource: body.locationSource ?? 'map_pin' };
    } else {
      const required = ['recipientName', 'recipientPhone', 'addressLine', 'city'];
      if (required.some((k) => !body[k]?.trim())) throw orderError(400, 'Thiếu thông tin người nhận/địa chỉ');
      if (body.latitude == null || body.longitude == null) throw orderError(400, 'Thiếu toạ độ điểm giao');
      dest = { ...pickAddressFields(body), locationSource: body.locationSource ?? 'map_pin' };
      if (body.saveAddress) await mockAdapter.createAddress(body);
    }

    // ② Tách giỏ theo supplier → mỗi supplier 1 đơn, tính ship từ chi nhánh mock của supplier đó
    const groups = new Map();
    for (const line of lines) {
      const v = findCartVariant(line.variantId);
      if (v.status !== 'active') throw orderError(409, `Sản phẩm "${line.productName}" đã ngừng bán`);
      const key = v.supplierId ?? 'unknown';
      if (!groups.has(key)) groups.set(key, { supplierId: v.supplierId, supplierName: v.supplierName, lines: [] });
      groups.get(key).lines.push(line);
    }
    const now = new Date().toISOString();
    const orders = [...groups.values()].map((g) => {
      const store = mockStoreFor(g.supplierId);
      const distanceKm = Math.round(haversineKm(store, dest) * 100) / 100;
      const subtotal = g.lines.reduce((s, l) => s + l.lineTotal, 0);
      return {
        id: crypto.randomUUID(), orderCode: `WH${now.slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        status: 'pending_payment', supplierId: g.supplierId, supplierName: g.supplierName,
        storeId: store.id, storeAddress: store.address, storeCity: store.city, storePhone: store.phone,
        recipientName: dest.recipientName, recipientPhone: dest.recipientPhone, shippingAddress: dest.addressLine,
        ward: dest.ward, district: dest.district, city: dest.city,
        destLatitude: dest.latitude, destLongitude: dest.longitude, locationSource: dest.locationSource, distanceKm,
        subtotal, productDiscount: 0, shippingFee: shippingFeeFor(subtotal, distanceKm), shippingDiscount: 0, totalAmount: 0,
        note: body.note ?? null, placedAt: now, createdAt: now, updatedAt: now,
        items: g.lines.map((l) => ({
          id: crypto.randomUUID(), variantId: l.variantId, productName: l.productName, variantSku: l.sku,
          color: l.color, dimensions: l.dimensions, unitPrice: l.unitPrice, quantity: l.quantity, lineTotal: l.lineTotal,
        })),
      };
    });

    // ③ Coupon: mỗi mã áp cho ĐÚNG 1 đơn có giá trị giảm cao nhất; mỗi đơn tối đa 1 mã product + 1 mã shipping
    const usedPromoIds = [];
    // BE đã bỏ nhập mã tay: gửi couponCodes → 400 COUPON_CODE_UNSUPPORTED; chỉ nhận promotionIds (chọn từ danh sách voucher)
    if (body.couponCodes?.some((c) => c?.trim())) throw orderError(400, 'Nhập mã đã ngừng hỗ trợ, hãy chọn voucher trong danh sách');
    for (const id of body.promotionIds ?? []) {
      const found = MOCK_PROMOTIONS.find((p) => p.id === id);
      if (!found) throw orderError(400, 'Voucher không tồn tại');
      const promo = findActivePromotion(found.code); // ném 400 nếu hết hạn — giống BE
      if (promo.usageLimit != null && promo.usedCount >= promo.usageLimit) throw orderError(409, `Mã ${promo.code} đã hết lượt sử dụng`);
      usedPromoIds.push(promo.id);
      const field = promo.type === 'shipping' ? 'shippingDiscount' : 'productDiscount';
      const candidates = orders
        .filter((o) => o[field] === 0 && (promo.minOrderAmount == null || o.subtotal >= promo.minOrderAmount))
        .map((o) => ({ o, amount: promotionDiscount(promo, o) }))
        .filter((c) => c.amount > 0)
        .sort((a, b) => b.amount - a.amount);
      if (!candidates.length) throw orderError(409, `Mã ${promo.code} không áp dụng được cho đơn hàng này`);
      candidates[0].o[field] = candidates[0].amount;
    }
    orders.forEach((o) => { o.totalAmount = o.subtotal - o.productDiscount + o.shippingFee - o.shippingDiscount; });
    MOCK_PROMOTIONS.forEach((p) => { if (usedPromoIds.includes(p.id)) p.usedCount += 1; });
    persistPromotions();

    // ④ 1 payment chung cho mọi đơn (khách quét 1 QR), rồi xoá giỏ
    const grandTotal = orders.reduce((s, o) => s + o.totalAmount, 0);
    const payment = {
      id: nextId('pay'), purpose: 'order', amount: grandTotal, status: 'pending',
      txnRef: nextId('ORD').toUpperCase(),
      qrUrl: `https://qr.sepay.vn/img?acc=demo&bank=DEMO&amount=${grandTotal}&des=demo`,
      expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
      paidAt: null, paidAmount: null, createdAt: now, planId: null, planName: null, _polls: 0,
    };
    mockPayments = [payment, ...mockPayments];
    persistMockPayments();
    // BE-08: vatInvoice → chụp thông tin công ty vào từng đơn (mock lấy từ hồ sơ doanh nghiệp đã lưu)
    const bp = storage.getItem(BUSINESS_PROFILE_KEY, {})[useAuthStore.getState().user?.id];
    orders.forEach((o) => {
      o.paymentId = payment.id;
      o.vat = body.vatInvoice ? { companyInfo: { companyName: bp?.companyName ?? 'Công ty demo', taxCode: bp?.taxCode ?? '0101234567', companyAddress: bp?.companyAddress ?? '', email: null }, issued: false, invoiceNumber: null, invoiceUrl: null, issuedAt: null } : null;
      memoryDb.orders.set(o.id, o);
    });
    persistOrders();
    saveCart({ ...cart, items: [] });

    return { orders: orders.map(withPaymentInfo), payment: { ...payment }, grandTotal };
  },

  async getOrders(params = {}) {
    await delay(300);
    const all = Array.from(memoryDb.orders.values())
      .filter((o) => !params.status || o.status === params.status)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(withPaymentInfo);
    return toSpringPage(all, params);
  },

  async getOrder(id) {
    await delay(250);
    const order = memoryDb.orders.get(id);
    if (!order) throw orderError(404, 'Không tìm thấy đơn hàng');
    return withPaymentInfo(order);
  },

  async cancelOrder(id) {
    await delay(300);
    const order = memoryDb.orders.get(id);
    if (!order) throw orderError(404, 'Không tìm thấy đơn hàng');
    if (order.status !== 'pending_payment') throw orderError(409, 'Chỉ hủy được đơn đang chờ thanh toán');
    order.status = 'cancelled';
    order.updatedAt = new Date().toISOString();
    persistOrders();
    return withPaymentInfo(order);
  },

  /*
   * GET /vouchers/available — mô phỏng gọn: tính trên tạm tính giỏ (mock không biết phí ship trước khi đặt → voucher
   * vận chuyển có estimatedDiscount = null). Gợi ý: voucher sản phẩm giảm nhiều nhất + 1 voucher ship.
   */
  // POST /orders/preview — mock: ship cố định 30.000đ/NCC, giảm theo voucher đã chọn (ước tính như getAvailableVouchers)
  async previewOrder(body = {}) {
    await delay(250);
    const cart = toCartResponse(loadCart());
    const items = (cart.items ?? []).filter((i) => i.available !== false);
    const bySupplier = new Map();
    for (const i of items) bySupplier.set(i.supplierId ?? 'sup', [...(bySupplier.get(i.supplierId ?? 'sup') ?? []), i]);
    const vouchers = await this.getAvailableVouchers();
    const picked = vouchers.filter((v) => (body.promotionIds ?? []).includes(v.id));
    const groups = [...bySupplier].map(([supplierId, list]) => {
      const subtotal = list.reduce((s, i) => s + Number(i.lineTotal), 0);
      const shippingFee = body.addressId ? 30_000 : 0;
      const productDiscount = picked.filter((v) => v.type === 'product' && v.eligible).reduce((s, v) => s + (v.estimatedDiscount ?? 0), 0);
      const shippingDiscount = picked.some((v) => v.type === 'shipping' && v.eligible) ? shippingFee : 0;
      return { supplierId, supplierName: list[0]?.supplierName ?? 'Nhà cung cấp', storeId: null, distanceKm: 5, subtotal, shippingFee, productDiscount, shippingDiscount,
        total: subtotal + shippingFee - productDiscount - shippingDiscount, appliedVouchers: [], amountToFreeShip: null };
    });
    const sum = (k) => groups.reduce((s, g) => s + g[k], 0);
    return {
      groups, subtotal: sum('subtotal'), shippingFee: sum('shippingFee'), discount: sum('productDiscount') + sum('shippingDiscount'), grandTotal: sum('total'),
      couponErrors: picked.filter((v) => !v.eligible).map((v) => ({ promotionId: v.id, errorCode: v.reasonCode, message: v.reason, params: { ...v.reasonParams, voucherName: v.name } })),
      unavailableItems: (cart.items ?? []).filter((i) => i.available === false).map((i) => ({ cartItemId: i.id, productName: i.productName, reason: i.unavailableReason })),
    };
  },

  // ===== BÁO GIÁ SỐ LƯỢNG LỚN (BE-08) — mock rút gọn: danh sách rỗng, thao tác báo cần BE thật =====
  async getMyBulkQuotes(params = {}) { await delay(200); return toSpringPage([], params); },
  async getSupplierBulkQuotes(params = {}) { await delay(200); return toSpringPage([], params); },
  async getBulkQuote() { await delay(150); throw Object.assign(new Error('Not found'), { response: { status: 404 } }); },
  async createBulkQuote() { await delay(300); throw Object.assign(new Error('MOCK'), { response: { status: 400, data: { message: 'Báo giá số lượng lớn chỉ chạy với BE thật (VITE_USE_MOCK=false).' } } }); },
  async acceptBulkQuote() { return this.createBulkQuote(); },
  async rejectBulkQuote() { return this.createBulkQuote(); },
  async cancelBulkQuote() { return this.createBulkQuote(); },
  async offerBulkQuote() { return this.createBulkQuote(); },
  async declineBulkQuote() { return this.createBulkQuote(); },
  async markVatIssued({ id, invoiceNumber, invoiceUrl }) {
    await delay(250);
    const o = memoryDb.orders.get(id);
    if (!o?.vat) throw Object.assign(new Error('VAT_NOT_REQUESTED'), { response: { status: 409, data: { errorCode: 'VAT_NOT_REQUESTED' } } });
    o.vat = { ...o.vat, issued: true, invoiceNumber, invoiceUrl: invoiceUrl ?? null, issuedAt: new Date().toISOString() };
    persistOrders();
    return o;
  },

  async getAvailableVouchers() {
    await delay(250);
    const subtotal = toCartResponse(loadCart()).subtotal ?? 0;
    const now = new Date();
    const list = MOCK_PROMOTIONS
      .filter((p) => p.isActive && !(p.endsAt && new Date(p.endsAt) < now) && !(p.startsAt && new Date(p.startsAt) > now))
      .map((p) => {
        const missing = p.minOrderAmount != null ? p.minOrderAmount - subtotal : 0;
        const eligible = subtotal > 0 && missing <= 0;
        const estimated = !eligible || p.type === 'shipping' ? null
          : Math.min(subtotal, p.discountType === 'percentage' ? Math.min(Math.round((subtotal * p.discountValue) / 100), p.maxDiscountAmount ?? Infinity) : p.discountValue);
        return {
          id: p.id, code: p.code, name: p.name, description: p.description, scope: p.supplierId ? 'shop' : 'platform',
          supplierId: p.supplierId, supplierName: p.supplierName, type: p.type, discountType: p.discountType,
          discountValue: p.discountValue, maxDiscountAmount: p.maxDiscountAmount, minOrderAmount: p.minOrderAmount, endsAt: p.endsAt,
          remainingUses: p.usageLimit != null ? p.usageLimit - p.usedCount : null, eligible,
          reason: subtotal <= 0 ? 'Giỏ hàng trống' : eligible ? null : `Đơn tối thiểu ${p.minOrderAmount.toLocaleString('vi-VN')} ₫ (còn thiếu ${missing.toLocaleString('vi-VN')} ₫)`,
          reasonCode: subtotal <= 0 ? 'CART_EMPTY' : eligible ? null : 'COUPON_MIN_ORDER_NOT_MET',
          reasonParams: eligible || subtotal <= 0 ? {} : { minOrderAmount: p.minOrderAmount, missingAmount: missing },
          estimatedDiscount: estimated, recommended: false,
        };
      });
    const best = list.filter((v) => v.eligible && v.type === 'product').sort((a, b) => b.estimatedDiscount - a.estimatedDiscount)[0];
    if (best) best.recommended = true;
    const ship = list.find((v) => v.eligible && v.type === 'shipping');
    if (ship) ship.recommended = true;
    const rank = (v) => (v.recommended ? 0 : v.eligible ? 1 : 2);
    return list.sort((a, b) => rank(a) - rank(b) || (b.estimatedDiscount ?? 0) - (a.estimatedDiscount ?? 0));
  },

  // ===== XỬ LÝ ĐƠN — supplier chỉ thấy/sửa đơn của mình, admin thấy/sửa mọi đơn =====
  async getSupplierOrders(params = {}) {
    await delay(300);
    const all = Array.from(memoryDb.orders.values())
      .filter((o) => MOCK_MY_SUPPLIER_IDS.includes(o.supplierId))
      .filter((o) => !params.status || o.status === params.status)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(withPaymentInfo);
    return toSpringPage(all, params);
  },

  async updateSupplierOrderStatus({ id, status }) {
    await delay(350);
    const order = memoryDb.orders.get(id);
    if (!order) throw orderError(404, 'Không tìm thấy đơn hàng');
    if (!MOCK_MY_SUPPLIER_IDS.includes(order.supplierId)) throw orderError(403, 'Đơn này không thuộc nhà cung cấp của bạn');
    return applyOrderStatus(order, status);
  },

  async getAdminOrders(params = {}) {
    await delay(300);
    const all = Array.from(memoryDb.orders.values())
      .filter((o) => !params.status || o.status === params.status)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(withPaymentInfo);
    return toSpringPage(all, params);
  },

  async updateAdminOrderStatus({ id, status }) {
    await delay(350);
    const order = memoryDb.orders.get(id);
    if (!order) throw orderError(404, 'Không tìm thấy đơn hàng');
    return applyOrderStatus(order, status);
  },

  // ===== KHUYẾN MÃI — admin: toàn bộ; supplier: chỉ KM của mình =====
  async getPromotions(params = {}) {
    await delay(300);
    const list = isSupplierUser() ? MOCK_PROMOTIONS.filter((p) => p.supplierId === MOCK_MY_SUPPLIER.id) : MOCK_PROMOTIONS;
    return toSpringPage([...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt)), params);
  },

  async getPromotion(id) {
    await delay(200);
    return { ...ownPromotion(id) };
  },

  async createPromotion(body) {
    await delay(350);
    const asSupplier = isSupplierUser();
    validatePromotion(body, { asSupplier });
    const code = body.code.trim().toUpperCase();
    if (MOCK_PROMOTIONS.some((p) => p.code === code)) throw orderError(409, `Mã ${code} đã tồn tại`);
    const now = new Date().toISOString();
    const promo = {
      id: crypto.randomUUID(), code, name: body.name.trim(), description: body.description ?? null,
      type: body.type, discountType: body.discountType,
      discountValue: body.discountType === 'free_shipping' ? null : body.discountValue,
      maxDiscountAmount: body.maxDiscountAmount ?? null, minOrderAmount: body.minOrderAmount ?? null,
      startsAt: body.startsAt ?? null, endsAt: body.endsAt ?? null, isActive: body.isActive ?? true,
      usageLimit: body.usageLimit ?? null, usageLimitPerUser: body.usageLimitPerUser ?? null, usedCount: 0,
      productIds: body.type === 'shipping' ? [] : body.productIds,
      supplierId: asSupplier ? MOCK_MY_SUPPLIER.id : null, supplierName: asSupplier ? MOCK_MY_SUPPLIER.name : null,
      createdAt: now, updatedAt: now,
    };
    MOCK_PROMOTIONS = [promo, ...MOCK_PROMOTIONS];
    persistPromotions();
    return { ...promo };
  },

  async updatePromotion({ id, ...body }) {
    await delay(350);
    const current = ownPromotion(id);
    validatePromotion(body, { asSupplier: isSupplierUser() });
    const code = body.code.trim().toUpperCase();
    if (MOCK_PROMOTIONS.some((p) => p.code === code && p.id !== id)) throw orderError(409, `Mã ${code} đã tồn tại`);
    const updated = {
      ...current, ...body, code,
      discountValue: body.discountType === 'free_shipping' ? null : body.discountValue,
      productIds: body.type === 'shipping' ? [] : body.productIds,
      updatedAt: new Date().toISOString(),
    };
    MOCK_PROMOTIONS = MOCK_PROMOTIONS.map((p) => (p.id === id ? updated : p));
    persistPromotions();
    return { ...updated };
  },

  async deletePromotion(id) {
    await delay(250);
    ownPromotion(id);
    MOCK_PROMOTIONS = MOCK_PROMOTIONS.filter((p) => p.id !== id);
    persistPromotions();
    return null; // 204
  },

  // ===== CẤU HÌNH PHÍ SHIP =====
  async getShippingConfig() {
    await delay(200);
    return { ...MOCK_SHIPPING };
  },

  async updateShippingConfig(body) {
    await delay(300);
    const required = ['baseFee', 'perKmFee', 'freeRadiusKm'];
    const bad = [...required.filter((k) => body[k] == null), ...Object.keys(body).filter((k) => body[k] != null && body[k] < 0)];
    if (bad.length) throw Object.assign(new Error('VALIDATION'), { response: { status: 400, data: { status: 400, message: 'Giá trị không hợp lệ', errors: Object.fromEntries(bad.map((k) => [k, 'Không hợp lệ'])) } } });
    MOCK_SHIPPING = {
      ...MOCK_SHIPPING,
      baseFee: body.baseFee, perKmFee: body.perKmFee, freeRadiusKm: body.freeRadiusKm,
      freeShipThreshold: body.freeShipThreshold ?? null, maxFeeCap: body.maxFeeCap ?? null,
      updatedAt: new Date().toISOString(),
    };
    storage.setItem(SHIPPING_KEY, MOCK_SHIPPING);
    return { ...MOCK_SHIPPING };
  },

  /*
   * ===== CUSTOM DESIGN (BE-6) — Custom Studio wizard bước 5/6 =====
   * Shape khớp CustomDesignResponse thật: { id,name,modelId,modelSlug,configuration,thumbnailUrl,
   * status,completedAt,version,createdAt,updatedAt }. Optimistic locking: version lệch → 409.
   */
  async createDesign({ name, modelId, configuration, thumbnailUrl } = {}) {
    await delay(400);
    const id = nextId('cdsg');
    const now = new Date().toISOString();
    // BE loại field giá do FE gửi trong configuration — mock cũng bỏ để đúng hành vi
    const { price, estimatePrice, ...safeConfig } = configuration ?? {};
    const model = memoryDb.genModels.get(modelId) ?? MODELS_3D.find((m) => m.id === modelId);
    const design = {
      id, name: name ?? 'Thiết kế chưa đặt tên', modelId: modelId ?? null, modelSlug: model?.slug ?? null,
      configuration: safeConfig, thumbnailUrl: thumbnailUrl ?? null,
      status: 'draft', completedAt: null, version: 1, createdAt: now, updatedAt: now,
      userId: useAuthStore.getState().user?.id ?? null, // chủ thiết kế — BE thật cũng chỉ cho chủ/admin xem
    };
    memoryDb.customDesigns.set(id, design);
    persistCustomDesigns();
    return design;
  },

  async getDesignDetail(id) {
    await delay(250);
    const design = ownedDesign(id);
    return design;
  },

  async updateDesign({ id, name, configuration, thumbnailUrl, status, version }) {
    await delay(400);
    const design = ownedDesign(id);
    if (version !== design.version) {
      throw Object.assign(new Error('VERSION_CONFLICT'), { response: { status: 409, data: { message: 'Thiết kế đã bị thay đổi ở nơi khác — vui lòng tải lại.' } } });
    }
    const { price, estimatePrice, ...safeConfig } = configuration ?? design.configuration;
    const wasCompleted = design.status === 'completed';
    const updated = {
      ...design,
      name: name ?? design.name,
      configuration: safeConfig,
      thumbnailUrl: thumbnailUrl ?? design.thumbnailUrl,
      status: status ?? design.status,
      completedAt: !wasCompleted && status === 'completed' ? new Date().toISOString() : design.completedAt,
      version: design.version + 1,
      updatedAt: new Date().toISOString(),
    };
    memoryDb.customDesigns.set(id, updated);
    persistCustomDesigns();
    return updated;
  },

  async deleteDesign(id) {
    await delay(300);
    ownedDesign(id);
    memoryDb.customDesigns.delete(id);
    persistCustomDesigns();
    return {};
  },

  async getMyDesigns(params = {}) {
    await delay(250);
    const myId = useAuthStore.getState().user?.id ?? null;
    const all = Array.from(memoryDb.customDesigns.values()).filter((d) => d.userId === myId).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    const items = all.filter((d) => !params?.status || d.status === params.status);
    return { content: items, page: { size: items.length || 20, number: 0, totalElements: items.length, totalPages: 1 } };
  },

  /*
   * ===== QUOTE & CUSTOM ORDER (BE-8, FE-6) — state machine đầy đủ ở docs/be-8-state-machine.md.
   * offeredBy/actor role suy theo actorRole() (xem ghi chú ở trên) — hạn chế mock đơn phiên.
   */
  async createQuote({ workshopId, customDesignId, quantity, location, note, expiresAt }) {
    await delay(400);
    const design = memoryDb.customDesigns.get(customDesignId);
    if (!design || design.userId !== (useAuthStore.getState().user?.id ?? null)) throw Object.assign(new Error('DESIGN_NOT_FOUND'), { response: { status: 404, data: { message: 'Không tìm thấy thiết kế' } } });
    const me = useAuthStore.getState().user;
    const id = nextId('quote');
    const now = new Date().toISOString();
    const workshop = findWorkshop(workshopId);
    const quote = {
      id, customerId: me?.id ?? 'mock-user', customerName: me?.name ?? 'Khách',
      workshopId, workshopName: workshop?.name ?? 'Xưởng mộc',
      customDesignId,
      designSnapshot: { ...design.configuration, design: { designName: design.name, modelId: design.modelId, modelSlug: design.modelSlug, posterUrl: design.thumbnailUrl, modelGlbUrl: null, sourceType: 'template', prompt: null } },
      quantity: quantity ?? 1, location: location ?? null, note: note ?? null,
      status: 'pending', expiresAt: expiresAt ?? null, createdAt: now,
      offers: [],
    };
    memoryDb.quotes.set(id, quote);
    persistQuotes();
    return quote;
  },

  async getMyQuotes(params = {}) {
    // (field tổng hợp: xem withQuoteSummary — mirror QuoteRequestResponse của BE)
    await delay(250);
    const me = useAuthStore.getState().user;
    let items = Array.from(memoryDb.quotes.values()).filter((q) => q.customerId === me?.id);
    if (params?.status) items = items.filter((q) => q.status === params.status);
    items = items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).map((q) => ({ ...withQuoteSummary(q), offers: null }));
    return { content: items, page: { size: items.length || 20, number: 0, totalElements: items.length, totalPages: 1 } };
  },

  // Mock đơn phiên: "incoming" = mọi quote KHÔNG do chính user hiện tại tạo (xem ghi chú actorRole)
  async getIncomingQuotes(params = {}) {
    await delay(250);
    const me = useAuthStore.getState().user;
    let items = Array.from(memoryDb.quotes.values()).filter((q) => q.customerId !== me?.id);
    if (params?.status) items = items.filter((q) => q.status === params.status);
    items = items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).map((q) => ({ ...q, offers: null }));
    return { content: items, page: { size: items.length || 20, number: 0, totalElements: items.length, totalPages: 1 } };
  },

  async getQuoteDetail(id) {
    await delay(200);
    const quote = memoryDb.quotes.get(id);
    if (!quote) throw Object.assign(new Error('QUOTE_NOT_FOUND'), { response: { status: 404 } });
    return quote;
  },

  async cancelQuote(id) {
    await delay(300);
    const quote = memoryDb.quotes.get(id);
    if (!quote) throw Object.assign(new Error('QUOTE_NOT_FOUND'), { response: { status: 404 } });
    if (['accepted', 'rejected', 'expired', 'cancelled'].includes(quote.status)) {
      throw Object.assign(new Error('QUOTE_ALREADY_CLOSED'), { response: { status: 409, data: { message: 'Yêu cầu báo giá đã kết thúc.' } } });
    }
    quote.status = 'cancelled';
    memoryDb.quotes.set(id, quote);
    persistQuotes();
    return quote;
  },

  async createOffer({ quoteId, price, leadTimeDays, note, expiresAt }) {
    await delay(400);
    const quote = memoryDb.quotes.get(quoteId);
    if (!quote) throw Object.assign(new Error('QUOTE_NOT_FOUND'), { response: { status: 404 } });
    if (['accepted', 'rejected', 'expired', 'cancelled'].includes(quote.status)) {
      throw Object.assign(new Error('QUOTE_ALREADY_CLOSED'), { response: { status: 409, data: { message: 'Yêu cầu báo giá đã kết thúc, không thể ra giá thêm.' } } });
    }
    const offeredBy = actorRole(quote) === 'customer' ? 'customer' : 'workshop';
    quote.offers.forEach((o) => { if (o.status === 'pending') o.status = 'superseded'; });
    const offer = {
      id: nextId('offer'), offeredBy, price, leadTimeDays, note: note ?? null,
      status: 'pending', expiresAt: expiresAt ?? null, createdAt: new Date().toISOString(),
    };
    quote.offers.push(offer);
    quote.status = 'negotiating';
    memoryDb.quotes.set(quoteId, quote);
    persistQuotes();
    return offer;
  },

  async acceptOffer({ quoteId, offerId }) {
    await delay(400);
    const quote = memoryDb.quotes.get(quoteId);
    if (!quote) throw Object.assign(new Error('QUOTE_NOT_FOUND'), { response: { status: 404 } });
    const offer = quote.offers.find((o) => o.id === offerId);
    if (!offer) throw Object.assign(new Error('OFFER_NOT_FOUND'), { response: { status: 404 } });
    if (offer.status !== 'pending') throw Object.assign(new Error('OFFER_NOT_PENDING'), { response: { status: 409, data: { message: 'Offer đã hết hạn hoặc không còn hiệu lực.' } } });
    const myRole = actorRole(quote);
    if (myRole === offer.offeredBy) throw Object.assign(new Error('CANNOT_ACCEPT_OWN_OFFER'), { response: { status: 403, data: { message: 'Chỉ bên còn lại mới được chấp nhận offer này.' } } });

    offer.status = 'accepted';
    quote.status = 'accepted';
    memoryDb.quotes.set(quoteId, quote);
    persistQuotes();

    const orderId = nextId('corder');
    const now = new Date().toISOString();
    const orderNumber = `CO-${now.slice(0, 10).replace(/-/g, '')}-${orderId.slice(-6).toUpperCase()}`;
    const order = {
      id: orderId, orderNumber, quoteRequestId: quote.id,
      customerId: quote.customerId, customerName: quote.customerName,
      workshopId: quote.workshopId, workshopName: quote.workshopName,
      customDesignId: quote.customDesignId, designSnapshot: quote.designSnapshot,
      unitPrice: offer.price, quantity: quote.quantity, totalAmount: offer.price * quote.quantity, leadTimeDays: offer.leadTimeDays,
      location: quote.location, note: quote.note, status: 'awaiting_deposit', createdAt: now, updatedAt: now,
      // BE-01: cọc 30% làm tròn lên nghìn đồng; ship chỉ tính khi khách chọn địa chỉ
      depositAmount: Math.ceil((offer.price * quote.quantity * 0.3) / 1000) * 1000, paidAmount: 0, shippingFee: null,
      remainingAmount: offer.price * quote.quantity, addressId: null, shippingAddress: null, payments: [],
      history: [{ id: nextId('coh'), fromStatus: null, toStatus: 'awaiting_deposit', changedById: useAuthStore.getState().user?.id ?? 'mock-user', changedByRole: myRole, note: null, createdAt: now }],
    };
    memoryDb.customOrders.set(orderId, order);
    persistCustomOrders();
    return order;
  },

  async rejectOffer({ quoteId, offerId }) {
    await delay(300);
    const quote = memoryDb.quotes.get(quoteId);
    if (!quote) throw Object.assign(new Error('QUOTE_NOT_FOUND'), { response: { status: 404 } });
    const offer = quote.offers.find((o) => o.id === offerId);
    if (!offer) throw Object.assign(new Error('OFFER_NOT_FOUND'), { response: { status: 404 } });
    if (offer.status !== 'pending') throw Object.assign(new Error('OFFER_NOT_PENDING'), { response: { status: 409 } });
    const myRole = actorRole(quote);
    if (myRole === offer.offeredBy) throw Object.assign(new Error('CANNOT_REJECT_OWN_OFFER'), { response: { status: 403, data: { message: 'Chỉ bên còn lại mới được từ chối offer này.' } } });
    offer.status = 'rejected';
    quote.status = 'rejected';
    memoryDb.quotes.set(quoteId, quote);
    persistQuotes();
    return quote;
  },

  async getMyCustomOrders(params = {}) {
    await delay(250);
    const me = useAuthStore.getState().user;
    let items = Array.from(memoryDb.customOrders.values()).filter((o) => o.customerId === me?.id);
    if (params?.status) items = items.filter((o) => o.status === params.status);
    items = items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).map((o) => ({ ...o, history: undefined }));
    return { content: items, page: { size: items.length || 20, number: 0, totalElements: items.length, totalPages: 1 } };
  },

  async getIncomingCustomOrders(params = {}) {
    await delay(250);
    const me = useAuthStore.getState().user;
    let items = Array.from(memoryDb.customOrders.values()).filter((o) => o.customerId !== me?.id);
    if (params?.status) items = items.filter((o) => o.status === params.status);
    items = items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).map((o) => ({ ...o, history: undefined }));
    return { content: items, page: { size: items.length || 20, number: 0, totalElements: items.length, totalPages: 1 } };
  },

  async getCustomOrderDetail(id) {
    await delay(200);
    const order = memoryDb.customOrders.get(id);
    if (!order) throw Object.assign(new Error('ORDER_NOT_FOUND'), { response: { status: 404 } });
    return order;
  },

  /*
   * POST /custom-orders/{id}/payment — QR cọc (awaiting_deposit) hoặc phần còn lại (awaiting_final_payment).
   * Mock: poll 3 lần thì coi như đã trả (xem getPayment) → đơn tự sang deposit_paid / paid.
   */
  async createCustomOrderPayment(id) {
    await delay(300);
    const order = memoryDb.customOrders.get(id);
    if (!order) throw Object.assign(new Error('ORDER_NOT_FOUND'), { response: { status: 404 } });
    const final = order.status === 'awaiting_final_payment';
    if (!final && order.status !== 'awaiting_deposit') throw Object.assign(new Error('NOT_PAYABLE'), { response: { status: 409, data: { message: 'Đơn không ở bước cần thanh toán' } } });
    if (final && !order.addressId) throw Object.assign(new Error('NO_ADDRESS'), { response: { status: 409, data: { message: 'Vui lòng chọn địa chỉ giao trước khi thanh toán' } } });
    const amount = final ? Number(order.totalAmount) + Number(order.shippingFee ?? 0) - Number(order.paidAmount ?? 0) : order.depositAmount;
    const now = new Date().toISOString();
    const payment = {
      id: nextId('pay'), purpose: final ? 'custom_final' : 'custom_deposit', amount, status: 'pending', txnRef: nextId('CUS').toUpperCase(),
      qrUrl: 'https://qr.sepay.vn/img?acc=demo&bank=DEMO&amount=' + amount + '&des=demo', expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(),
      paidAt: null, paidAmount: null, createdAt: now, planId: null, planName: null, _polls: 0, _customOrderId: id,
    };
    mockPayments = [payment, ...mockPayments];
    persistMockPayments();
    return { ...payment };
  },

  // PUT /custom-orders/{id}/address — mock tính ship cố định 50.000đ (BE thật tính theo khoảng cách từ xưởng)
  async setCustomOrderAddress({ id, addressId }) {
    await delay(300);
    const order = memoryDb.customOrders.get(id);
    if (!order) throw Object.assign(new Error('ORDER_NOT_FOUND'), { response: { status: 404 } });
    const addr = (await this.getAddresses()).find((a) => a.id === addressId);
    if (!addr) throw Object.assign(new Error('ADDRESS_NOT_FOUND'), { response: { status: 404 } });
    if (!addr.hasCoordinates) throw Object.assign(new Error('NO_COORDS'), { response: { status: 400, data: { message: 'Địa chỉ chưa có toạ độ' } } });
    order.addressId = addressId;
    order.shippingAddress = addr.recipientName + ' (' + addr.recipientPhone + '), ' + (addr.addressLine ?? '');
    order.shippingFee = 50_000;
    order.remainingAmount = Math.max(0, Number(order.totalAmount) + order.shippingFee - Number(order.paidAmount ?? 0));
    memoryDb.customOrders.set(id, order);
    persistCustomOrders();
    return order;
  },

  // Chuyển hợp lệ + ai được phép — bảng §2 custom-order-payment-fe.md
  async updateCustomOrderStatus({ id, status, note }) {
    await delay(350);
    const order = memoryDb.customOrders.get(id);
    if (!order) throw Object.assign(new Error('ORDER_NOT_FOUND'), { response: { status: 404 } });
    const myRole = actorRole(order);
    // Bảng §2 custom-order-payment-fe.md (BE-01). deposit_paid/paid chỉ hệ thống chuyển (khi nhận tiền).
    const ALLOWED = {
      awaiting_deposit: { cancelled: ['customer', 'workshop', 'admin'] },
      deposit_paid: { in_production: ['workshop', 'admin'], cancelled: ['workshop', 'admin'] },
      in_production: { awaiting_final_payment: ['workshop', 'admin'], cancelled: ['workshop', 'admin'] },
      awaiting_final_payment: { cancelled: ['workshop', 'admin'] },
      paid: { shipping: ['workshop', 'admin'] },
      shipping: { delivered: ['workshop', 'admin'] },
      delivered: { completed: ['customer', 'admin'] },
    };
    const allowedRoles = ALLOWED[order.status]?.[status];
    if (!allowedRoles) throw Object.assign(new Error('INVALID_TRANSITION'), { response: { status: 409, data: { message: `Không thể chuyển từ ${order.status} sang ${status}.` } } });
    if (!allowedRoles.includes(myRole)) throw Object.assign(new Error('FORBIDDEN_TRANSITION'), { response: { status: 403, data: { message: 'Bạn không có quyền thực hiện thao tác này.' } } });

    const now = new Date().toISOString();
    order.history.push({ id: nextId('coh'), fromStatus: order.status, toStatus: status, changedById: useAuthStore.getState().user?.id ?? 'mock-user', changedByRole: myRole, note: note ?? null, createdAt: now });
    order.status = status;
    order.updatedAt = now;
    memoryDb.customOrders.set(id, order);
    persistCustomOrders();
    return order;
  },

  /*
   * ===== AI CHAT — trợ lý AI tư vấn (chatbot nổi) =====
   * "Bộ não" mock TÁI DÙNG getAdvisorReply() (dò từ khoá/ngân sách trên catalog PRODUCTS) — y hệt
   * logic đã chạy offline từ trước, chỉ bọc lại đúng shape AiChatSessionResponse/AiChatMessageResponse
   * thật (role 'user'|'assistant', suggestedProducts thay vì products) để bật REAL_ENDPOINTS không
   * phải sửa UI. Khi BE thật nối xong Python AI service, chỉ cần bỏ USE_MOCK, không đổi gì ở đây.
   */
  async createAiChatSession({ title } = {}) {
    await delay(300);
    const me = useAuthStore.getState().user;
    const id = nextId('chatsession');
    const now = new Date().toISOString();
    memoryDb.aiChatSessions.set(id, { id, userId: me?.id ?? 'mock-user', title: title ?? null, createdAt: now, updatedAt: now });
    memoryDb.aiChatMessages.set(id, []);
    persistAiChatSessions();
    persistAiChatMessages();
    const s = memoryDb.aiChatSessions.get(id);
    return { id: s.id, title: s.title, createdAt: s.createdAt, updatedAt: s.updatedAt };
  },

  async getMyAiChatSessions() {
    await delay(200);
    const me = useAuthStore.getState().user;
    return Array.from(memoryDb.aiChatSessions.values())
      .filter((s) => s.userId === (me?.id ?? 'mock-user'))
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
      .map((s) => ({ id: s.id, title: s.title, createdAt: s.createdAt, updatedAt: s.updatedAt }));
  },

  async getAiChatMessages(sessionId) {
    await delay(200);
    const session = memoryDb.aiChatSessions.get(sessionId);
    if (!session) throw Object.assign(new Error('SESSION_NOT_FOUND'), { response: { status: 404 } });
    // Giống BE thật: chỉ chủ phiên mới xem được lịch sử (403 nếu không phải chủ)
    if (session.userId !== (useAuthStore.getState().user?.id ?? 'mock-user')) throw Object.assign(new Error('FORBIDDEN'), { response: { status: 403 } });
    return memoryDb.aiChatMessages.get(sessionId) ?? [];
  },

  async sendAiChatMessage({ sessionId, content }) {
    await delay(500);
    const session = memoryDb.aiChatSessions.get(sessionId);
    if (!session) throw Object.assign(new Error('SESSION_NOT_FOUND'), { response: { status: 404 } });
    if (session.userId !== (useAuthStore.getState().user?.id ?? 'mock-user')) throw Object.assign(new Error('FORBIDDEN'), { response: { status: 403 } });
    const list = memoryDb.aiChatMessages.get(sessionId) ?? [];

    const userMsg = { id: nextId('chatmsg'), role: 'user', content, extractedParams: {}, suggestedProducts: [], createdAt: new Date().toISOString() };
    const { textKey, products } = getAdvisorReply(content);
    const assistantMsg = {
      id: nextId('chatmsg'), role: 'assistant', content: i18n.t(textKey),
      extractedParams: {}, suggestedProducts: products, createdAt: new Date().toISOString(),
    };
    list.push(userMsg, assistantMsg);
    memoryDb.aiChatMessages.set(sessionId, list);
    persistAiChatMessages();

    // Tự đặt tên phiên từ tin nhắn đầu (giống hành vi thật — CreateAiChatSessionRequest.title "bỏ trống → tự đặt tên từ tin nhắn đầu tiên")
    if (!session.title) session.title = content.slice(0, 60);
    session.updatedAt = assistantMsg.createdAt; // phiên vừa có tin mới → lên đầu danh sách lịch sử
    memoryDb.aiChatSessions.set(sessionId, session);
    persistAiChatSessions();
    return assistantMsg;
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
    // Mới nhất trước, giống BE (findByTargetTypeAndTargetIdOrderByCreatedAtDesc)
    const viewerId = useAuthStore.getState().user?.id ?? null;
    return toSpringPage(allReviewsFor(params.targetType, params.targetId).map((r) => toReviewResponse(r, viewerId)), params);
  },

  async getReviewSummary(params = {}) {
    await delay(200);
    const reviews = allReviewsFor(params.targetType, params.targetId);
    const average = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
    return { targetType: params.targetType, targetId: params.targetId, average, count: reviews.length };
  },

  async createReview(body) {
    await delay(350);
    const user = useAuthStore.getState().user;
    if (!user) throw reviewError(401, 'Chưa xác thực');
    validateReviewBody(body);
    if (allReviewsFor(body.targetType, body.targetId).some((r) => r.userId === user.id)) {
      throw reviewError(409, 'Bạn đã đánh giá đối tượng này rồi, hãy sửa đánh giá cũ');
    }
    const now = new Date().toISOString();
    const review = {
      id: crypto.randomUUID(), userId: user.id, userName: user.name, targetType: body.targetType, targetId: body.targetId,
      rating: body.rating, comment: body.comment?.trim() || null, anonymous: body.anonymous === true, createdAt: now, updatedAt: now,
    };
    mockUserReviews = [review, ...mockUserReviews];
    persistUserReviews();
    return toReviewResponse(review, user.id);
  },

  async updateReview({ id, ...body }) {
    await delay(300);
    const review = ownReview(id);
    validateReviewBody(body);
    Object.assign(review, {
      rating: body.rating, comment: body.comment?.trim() || null, updatedAt: new Date().toISOString(),
      // null/không gửi = giữ nguyên lựa chọn ẩn danh (giống BE)
      ...(body.anonymous != null ? { anonymous: body.anonymous } : {}),
    });
    persistUserReviews();
    return toReviewResponse(review, review.userId);
  },

  // GET /supplier/reviews — đánh giá về cửa hàng mock + mọi SP của cửa hàng mock (MOCK_MY_SUPPLIER_IDS)
  async getSupplierReviewsPortal(params = {}) {
    await delay(250);
    const productNames = new Map([
      ...PRODUCTS.filter((p) => MOCK_MY_SUPPLIER_IDS.includes(p.supplierId)).map((p) => [p.id, p.name?.vi ?? p.name]),
      ...myProducts.map((p) => [p.id, p.name]),
    ]);
    let list = [
      ...MOCK_MY_SUPPLIER_IDS.flatMap((id) => allReviewsFor('supplier', id).map((r) => ({ ...r, targetName: MOCK_MY_SUPPLIER.name }))),
      ...[...productNames].flatMap(([id, name]) => allReviewsFor('product', id).map((r) => ({ ...r, targetName: name }))),
    ];
    if (params.targetType) list = list.filter((r) => r.targetType === params.targetType);
    if (params.rating) list = list.filter((r) => r.rating === Number(params.rating));
    if (params.replied != null) list = list.filter((r) => !!mockReviewReplies[r.id] === (String(params.replied) === 'true'));
    list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return toSpringPage(list.map((r) => toReviewResponse(r, null)), params);
  },

  async replyReview({ id, content }) {
    await delay(300);
    if (!content?.trim() || content.length > 1000) throw reviewError(400, 'Nội dung phản hồi bắt buộc, tối đa 1000 ký tự');
    mockReviewReplies[id] = { content: content.trim(), createdAt: mockReviewReplies[id]?.createdAt ?? new Date().toISOString() };
    persistReviewReplies();
    return { id, reply: mockReviewReplies[id] };
  },

  async deleteReviewReply(id) {
    await delay(250);
    delete mockReviewReplies[id];
    persistReviewReplies();
    return { id, reply: null };
  },

  // ===== BE-10 / BE-14 cho Portal NCC (mock gọn, lưu localStorage) =====
  async patchSupplierMe(body) {
    await delay(300);
    const clean = Object.fromEntries(Object.entries(body).filter(([, v]) => v != null).map(([k, v]) => [k, v === '' ? null : v]));
    if ('businessName' in body && body.businessName === '') throw reviewError(400, 'Tên cửa hàng không được để trống');
    storage.setItem(SUPPLIER_ME_KEY, { ...storage.getItem(SUPPLIER_ME_KEY, {}), ...clean });
    return this.getSupplierMe();
  },

  async uploadSupplierImage({ file }) {
    await delay(500);
    if (file.size > 10 * 1024 * 1024) throw Object.assign(new Error('IMAGE_TOO_LARGE'), { response: { status: 413, data: { errorCode: 'IMAGE_TOO_LARGE', params: { maxMb: 10 } } } });
    // data URL để ảnh còn hiện sau F5 (mock không có storage thật)
    const url = await new Promise((resolve) => { const fr = new FileReader(); fr.onload = () => resolve(fr.result); fr.readAsDataURL(file); });
    return { url };
  },

  // ===== THÔNG BÁO (mock: vài thông báo mẫu theo vai, lưu trạng thái đã đọc) =====
  async getNotifications(params = {}) {
    await delay(200);
    let list = mockNotificationsFor(useAuthStore.getState().user);
    if (String(params.unread) === 'true') list = list.filter((n) => !n.read);
    return toSpringPage(list, params);
  },

  async getUnreadNotificationCount() {
    await delay(150);
    return { unread: mockNotificationsFor(useAuthStore.getState().user).filter((n) => !n.read).length };
  },

  async markNotificationRead(id) {
    await delay(150);
    const readIds = storage.getItem('woodhub-mock-notif-read', []);
    storage.setItem('woodhub-mock-notif-read', [...new Set([...readIds, id])]);
    return mockNotificationsFor(useAuthStore.getState().user).find((n) => n.id === id) ?? null;
  },

  async markAllNotificationsRead() {
    await delay(150);
    const list = mockNotificationsFor(useAuthStore.getState().user);
    storage.setItem('woodhub-mock-notif-read', list.map((n) => n.id));
    return { updated: list.length };
  },

  // ===== ADMIN mock (BE-11 / hoàn tiền / liên hệ / payout) — đủ để chạy UI =====
  async setUserStatus({ id, status, reason }) {
    await delay(300);
    const u = mockAdminUsers.find((x) => x.id === id);
    if (!u) throw Object.assign(new Error('Not found'), { response: { status: 404 } });
    if (u.role === 'admin') throw Object.assign(new Error('CANNOT_LOCK_ADMIN'), { response: { status: 409, data: { errorCode: 'CANNOT_LOCK_ADMIN', message: 'Không thể khoá tài khoản quản trị' } } });
    Object.assign(u, { status, lockedReason: status === 'locked' ? reason ?? null : null, lockedAt: status === 'locked' ? new Date().toISOString() : null });
    return { ...u };
  },

  async getAdminReviews(params = {}) {
    await delay(250);
    const hidden = storage.getItem('woodhub-mock-hidden-reviews', {});
    let list = mockUserReviews.map((r) => ({
      id: r.id, targetType: r.targetType, targetId: r.targetId, targetName: null, rating: r.rating, comment: r.comment, anonymous: !!r.anonymous,
      author: { id: r.userId, fullName: r.userName, email: null }, hidden: !!hidden[r.id], hiddenReason: hidden[r.id]?.reason ?? null,
      hiddenAt: hidden[r.id]?.at ?? null, createdAt: r.createdAt, updatedAt: r.updatedAt,
    }));
    if (params.targetType) list = list.filter((r) => r.targetType === params.targetType);
    if (params.rating) list = list.filter((r) => r.rating === Number(params.rating));
    if (params.hidden != null) list = list.filter((r) => r.hidden === (String(params.hidden) === 'true'));
    return toSpringPage(list, params);
  },

  async moderateReview({ id, hidden, reason }) {
    await delay(250);
    const map = storage.getItem('woodhub-mock-hidden-reviews', {});
    if (hidden) map[id] = { reason: reason ?? null, at: new Date().toISOString() }; else delete map[id];
    storage.setItem('woodhub-mock-hidden-reviews', map);
    return (await this.getAdminReviews({ size: 500 })).content.find((r) => r.id === id);
  },

  async deleteAdminReview(id) {
    await delay(250);
    mockUserReviews = mockUserReviews.filter((r) => r.id !== id);
    persistUserReviews();
    return null;
  },

  async getPendingRefunds(params = {}) {
    await delay(250);
    const list = Array.from(memoryDb.orders.values()).filter((o) => o.status === 'cancelled' && o.paidAt && !o.refund);
    return toSpringPage(list, params);
  },

  async confirmRefund({ id, reference, amount, note }) {
    await delay(300);
    const o = memoryDb.orders.get(id);
    if (!o) throw Object.assign(new Error('Not found'), { response: { status: 404 } });
    if (o.refund) throw Object.assign(new Error('ALREADY'), { response: { status: 409, data: { errorCode: 'ORDER_ALREADY_REFUNDED' } } });
    o.refund = { amount: amount ?? o.totalAmount, reference, note: note ?? null, refundedAt: new Date().toISOString() };
    persistOrders();
    return o;
  },

  async getAdminContacts(params = {}) {
    await delay(250);
    let list = storage.getItem('woodhub-mock-contacts', []);
    if (params.status) list = list.filter((c) => c.status === params.status);
    if (params.keyword) list = list.filter((c) => [c.name, c.email, c.subject].join(' ').toLowerCase().includes(String(params.keyword).toLowerCase()));
    return toSpringPage(list, params);
  },

  async updateContactStatus({ id, status }) {
    await delay(200);
    const list = storage.getItem('woodhub-mock-contacts', []).map((c) => (c.id === id ? { ...c, status } : c));
    storage.setItem('woodhub-mock-contacts', list);
    return list.find((c) => c.id === id);
  },

  async getAdminSupplierPayout() {
    await delay(250);
    const p = storage.getItem('woodhub-mock-payout', null);
    if (!p) throw Object.assign(new Error('Not found'), { response: { status: 404, data: { errorCode: 'PAYOUT_ACCOUNT_NOT_FOUND' } } });
    return { ...p, accountNumber: '0123456789' };
  },

  // ===== Mẫu 3D admin + retexture (mock rút gọn) =====
  async getAdminModels3d(params = {}) {
    await delay(250);
    let list = MODELS_3D.filter((m) => m.source === 'template').map((m) => ({ ...m, status: storage.getItem('woodhub-mock-model-status', {})[m.id] ?? 'active', productId: storage.getItem('woodhub-mock-model-links', {})[m.id] ?? null }));
    if (params.status) list = list.filter((m) => m.status === params.status);
    if (params.keyword) list = list.filter((m) => m.name.toLowerCase().includes(String(params.keyword).toLowerCase()));
    if (params.productType) list = list.filter((m) => m.productType === params.productType);
    return toSpringPage(list, params);
  },
  async updateAdminModel3d({ id, ...body }) { await delay(250); return { ...MODELS_3D.find((m) => m.id === id), ...body }; },
  async setAdminModel3dStatus({ id, status }) {
    await delay(200);
    storage.setItem('woodhub-mock-model-status', { ...storage.getItem('woodhub-mock-model-status', {}), [id]: status });
    return { ...MODELS_3D.find((m) => m.id === id), status };
  },
  async deleteAdminModel3d() { await delay(200); throw Object.assign(new Error('IN_USE'), { response: { status: 409, data: { message: 'Mẫu đang được dùng trong thiết kế của khách — hãy ẩn mẫu thay vì xoá' } } }); },
  async linkProductModel3d({ productId, model3dId }) {
    await delay(250);
    storage.setItem('woodhub-mock-model-links', { ...storage.getItem('woodhub-mock-model-links', {}), [model3dId]: productId });
    return { id: productId };
  },
  async unlinkProductModel3d(productId) {
    await delay(200);
    const links = storage.getItem('woodhub-mock-model-links', {});
    storage.setItem('woodhub-mock-model-links', Object.fromEntries(Object.entries(links).filter(([, p]) => p !== productId)));
    return { id: productId };
  },
  async retextureModel({ modelId }) {
    await delay(400);
    const m = MODELS_3D.find((x) => x.id === modelId);
    return { state: 'ready', taskId: null, status: 'succeeded', progress: 100, model: m ? { ...m, parentModelId: m.id, variantKey: 'material:mock' } : null };
  },
  async getModelVariants() { await delay(150); return []; },

  async getMyCapability() {
    await delay(200);
    return storage.getItem('woodhub-mock-capability', null) ?? { productTypes: [], maxLengthCm: null, maxWidthCm: null, maxHeightCm: null, materials: [], experienceYears: null, updatedAt: null };
  },

  async saveMyCapability(body) {
    await delay(300);
    const mats = await this.getMaterials();
    const list = mats.content ?? mats;
    const saved = { ...body, materials: list.filter((m) => (body.materialIds ?? []).includes(m.id)).map((m) => ({ id: m.id, name: m.name })), updatedAt: new Date().toISOString() };
    delete saved.materialIds;
    storage.setItem('woodhub-mock-capability', saved);
    return saved;
  },

  async getMyPayout() {
    await delay(200);
    return storage.getItem('woodhub-mock-payout', null) ?? { configured: false, bankCode: null, bankName: null, accountNumberMasked: null, accountNumber: null, accountHolder: null, branch: null, updatedAt: null };
  },

  async saveMyPayout(body) {
    await delay(300);
    const digits = String(body.accountNumber ?? '');
    if (!/^\d{6,19}$/.test(digits)) throw Object.assign(new Error('VALIDATION'), { response: { status: 400, data: { errorCode: 'VALIDATION_FAILED', fieldErrorCodes: { accountNumber: 'PATTERN' }, message: 'Số tài khoản 6–19 chữ số' } } });
    const saved = {
      configured: true, bankCode: body.bankCode, bankName: body.bankName, accountNumber: null,
      accountNumberMasked: '*'.repeat(Math.max(0, digits.length - 4)) + digits.slice(-4),
      accountHolder: String(body.accountHolder).toUpperCase(), branch: body.branch || null, updatedAt: new Date().toISOString(),
    };
    storage.setItem('woodhub-mock-payout', saved);
    return saved;
  },

  async getNotificationSettings() {
    await delay(200);
    const defaults = { ORDER_PAID: true, QUOTE_NEW: true, QUOTE_OFFER_ACCEPTED: true, CUSTOM_ORDER_DEPOSIT_PAID: true, CUSTOM_ORDER_FINAL_PAID: true, REVIEW_NEW: false, QUOTE_OFFER: false, QUOTE_OFFER_REJECTED: false, CUSTOM_ORDER_STATUS_CHANGED: false, BULK_QUOTE_NEW: true, BULK_QUOTE_ACCEPTED: true, BULK_QUOTE_REJECTED: false };
    const saved = storage.getItem('woodhub-mock-notif-email', {});
    return { email: Object.entries(defaults).map(([type, def]) => ({ type, enabled: saved[type] ?? def, defaultEnabled: def })) };
  },

  async updateNotificationSettings(email) {
    await delay(250);
    storage.setItem('woodhub-mock-notif-email', { ...storage.getItem('woodhub-mock-notif-email', {}), ...email });
    return this.getNotificationSettings();
  },

  async deleteReview(id) {
    await delay(250);
    ownReview(id);
    mockUserReviews = mockUserReviews.filter((r) => r.id !== id);
    persistUserReviews();
    return null;
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
      createdAt: '2026-09-01T00:00:00Z', updatedAt: new Date().toISOString(),
      ...storage.getItem(SUPPLIER_ME_KEY, {}),
    };
  },

  async updateSupplierMe(body) {
    await delay(300);
    if (!body?.businessName?.trim()) throw orderError(400, 'Tên doanh nghiệp không được để trống');
    const norm = (v) => (v == null || String(v).trim() === '' ? null : String(v).trim());
    storage.setItem(SUPPLIER_ME_KEY, {
      businessName: body.businessName.trim(), taxCode: norm(body.taxCode), legalDocumentUrl: norm(body.legalDocumentUrl),
      contactEmail: norm(body.contactEmail), contactPhone: norm(body.contactPhone), description: norm(body.description),
    });
    return this.getSupplierMe();
  },

  async getMyPortfolio() {
    await delay(200);
    return [...mockPortfolio].sort((a, b) => a.sortOrder - b.sortOrder);
  },
  async addPortfolioItem(body) {
    await delay(300);
    const product = body.productId ? myProducts.find((p) => p.id === body.productId) : null;
    const imageUrl = body.imageUrl?.trim() || product?.images?.[0]?.url || product?.thumbnailUrl || null;
    if (!imageUrl) throw orderError(400, 'Cần ảnh hoặc sản phẩm có ảnh');
    const item = {
      id: `pf_${Date.now()}`, supplierId: 'mock-supplier-id', productId: product?.id ?? null, productName: product?.name ?? null,
      imageUrl, title: body.title?.trim() || null, description: body.description?.trim() || null,
      sortOrder: body.sortOrder ?? mockPortfolio.length, createdAt: new Date().toISOString(),
    };
    mockPortfolio = [...mockPortfolio, item];
    storage.setItem(PORTFOLIO_KEY, mockPortfolio);
    return item;
  },
  async updatePortfolioItem({ id, ...body }) {
    await delay(300);
    const cur = mockPortfolio.find((p) => p.id === id);
    if (!cur) throw orderError(404, 'Không tìm thấy mục portfolio');
    const next = {
      ...cur, title: body.title?.trim() || null, description: body.description?.trim() || null,
      imageUrl: body.imageUrl?.trim() || cur.imageUrl, sortOrder: body.sortOrder ?? cur.sortOrder,
    };
    mockPortfolio = mockPortfolio.map((p) => (p.id === id ? next : p));
    storage.setItem(PORTFOLIO_KEY, mockPortfolio);
    return next;
  },
  async deletePortfolioItem(id) {
    await delay(250);
    mockPortfolio = mockPortfolio.filter((p) => p.id !== id);
    storage.setItem(PORTFOLIO_KEY, mockPortfolio);
    return null;
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

  /*
   * ===== PAYMENTS quản trị (Portal Quản trị /admin/payments) — trả đúng shape Spring Page phẳng =====
   * Dữ liệu sinh 1 lần từ seed cố định (không random mỗi lần gọi) để lọc/phân trang ổn định.
   */
  async getAdminPayments({ status, purpose, from, to, q, page = 0, size = 20 } = {}) {
    await delay(300);
    const list = filterMockPayments({ status, purpose, from, to, q });
    const total = list.length;
    const content = list.slice(page * size, page * size + size);
    const totalPages = Math.ceil(total / size);
    return {
      content, totalElements: total, totalPages, number: page, size,
      first: page === 0, last: page >= totalPages - 1, numberOfElements: content.length, empty: !content.length,
    };
  },

  async getAdminPayment(id) {
    await delay(200);
    const p = MOCK_PAYMENTS.find((x) => x.id === id);
    if (!p) throw Object.assign(new Error('Not found'), { response: { status: 404 } });
    return p;
  },

  async getAdminPaymentStats({ from, to } = {}) {
    await delay(300);
    const list = filterMockPayments({ from, to });
    // Doanh thu theo paidAt (đúng quy ước BE) — lọc riêng theo paidAt, không theo createdAt
    const fromMs = from ? Date.parse(from) : -Infinity;
    const toMs = to ? Date.parse(to) : Infinity;
    const paid = MOCK_PAYMENTS.filter((p) => p.status === 'paid' && Date.parse(p.paidAt) >= fromMs && Date.parse(p.paidAt) <= toMs);
    const byDay = new Map();
    paid.forEach((p) => {
      const d = p.paidAt.slice(0, 10);
      const cur = byDay.get(d) ?? { date: d, revenue: 0, count: 0 };
      cur.revenue += p.paidAmount; cur.count += 1;
      byDay.set(d, cur);
    });
    const count = (s) => list.filter((p) => p.status === s).length;
    return {
      totalRevenue: paid.reduce((sum, p) => sum + p.paidAmount, 0),
      totalCount: list.length,
      paidCount: count('paid'), pendingCount: count('pending'), failedCount: count('failed'), expiredCount: count('expired'),
      dailyRevenue: [...byDay.values()].sort((a, b) => (a.date < b.date ? -1 : 1)),
    };
  },

  // ===== DASHBOARD tổng quan (Portal Quản trị /admin/dashboard) — dữ liệu giả đúng shape BE =====
  async getAdminDashboardSummary() {
    await delay(300);
    return {
      users: { total: 1280, newInPeriod: 42, byRole: { customer: 1200, supplier: 79, admin: 1 }, activeRecently: 37, emailVerifiedRate: 0.86 },
      revenue: { totalRevenue: 15800000, totalCount: 128, paidCount: 110, pendingCount: 12, failedCount: 6, successRate: 0.859 },
      subscriptions: {
        activeTotal: 95,
        byPlan: [{ planName: 'B2C Premium AR/3D', count: 60 }, { planName: 'Free', count: 35 }],
        expiringIn7Days: 8, estimatedMrr: 11940000,
      },
      suppliers: { total: 79, byStatus: { pending: 5, active: 70, suspended: 4 } },
      products: { total: 540, byStatus: { draft: 40, active: 480, hidden: 20 }, storeCount: 86 },
      ai: { chatSessions: 320, aiMessagesInPeriod: 1500, gen3dTasks: 210, gen3dFailedRate: 0.07 },
    };
  },

  async getAdminDashboardTimeseries({ from, to } = {}) {
    await delay(300);
    const end = to ? new Date(to) : new Date();
    const start = from ? new Date(from) : new Date(end.getTime() - 13 * 86400000);
    const days = [];
    for (let d = new Date(start); d <= end && days.length < 90; d = new Date(d.getTime() + 86400000)) days.push(d.toISOString().slice(0, 10));
    return {
      revenue: days.map((date, i) => ({ date, revenue: (((i * 7) % 5) + 1) * 199000, count: ((i * 7) % 5) + 1 })),
      newUsers: days.map((date, i) => ({ date, count: (i * 3) % 7 })).filter((d) => d.count),
      customOrders: days.map((date, i) => ({ date, count: (i * 5) % 4 })).filter((d) => d.count),
      aiTasks: days.map((date, i) => ({ date, count: ((i * 11) % 9) + 1, failed: i % 6 === 0 ? 1 : 0 })),
    };
  },

  async getAdminDashboardTop() {
    await delay(300);
    return {
      topPlans: [{ planName: 'B2C Premium AR/3D', sales: 60, revenue: 11940000 }, { planName: 'B2B Pro', sales: 12, revenue: 5988000 }],
      topSuppliers: [{ supplierId: 'mock-1', name: 'Xưởng Gỗ An Phát', orderCount: 12, revenue: 36000000 }],
    };
  },

  // ===== THỐNG KÊ NCC / XƯỞNG (BE-09) — số minh hoạ cố định, chỉ để chạy UI khi VITE_USE_MOCK =====
  async getSupplierStatsSummary() {
    await delay(250);
    return {
      orderCount: 6, grossSales: 18_400_000, shopDiscount: 400_000, platformDiscount: 200_000, revenue: 18_000_000,
      commissionRate: 10, commission: 1_800_000, netRevenue: 16_200_000, avgOrderValue: 3_000_000, shippingFee: 450_000,
      pendingOrders: 2, rating: 4.5, reviewCount: 8, newReviews: 2, unrepliedReviews: 1, workshop: null,
    };
  },

  async getSupplierStatsTimeseries({ from, to, granularity = 'day' } = {}) {
    await delay(250);
    const end = to ? new Date(to) : new Date();
    const start = from ? new Date(from) : new Date(end.getTime() - 30 * 86400000);
    const points = [];
    for (let d = new Date(start), i = 0; d < end && points.length < 400; d = new Date(d.getTime() + 86400000), i += 1) {
      points.push({ date: d.toISOString().slice(0, 10), orders: i % 3 === 0 ? 1 : 0, revenue: i % 3 === 0 ? 3_000_000 : 0, customRevenue: 0 });
    }
    return { granularity, points };
  },

  async getSupplierStatsTopProducts() {
    await delay(250);
    return PRODUCTS.slice(0, 3).map((p, i) => ({ productId: p.id, name: p.name?.vi ?? p.name, sold: 3 - i, revenue: (3 - i) * 3_000_000 }));
  },

  async exportSupplierStats() {
    await delay(200);
    return new Blob(['﻿Ngày thanh toán,Mã đơn,Doanh thu\n'], { type: 'text/csv' });
  },

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

  // ===== AI 3D (nhánh Mẫu 3D / Upload) — shape khớp Model3dResponse/Ai3DTaskResponse thật (BE-4) =====
  // GET /custom/models?keyword=&productType=&sort=&page=&size= → Page<Model3dResponse>
  // CHỈ lọc/sort đúng những gì BE thật hỗ trợ (keyword/productType/sort=createdAt,desc) — xem
  // ghi chú ở CustomModels.jsx (FE-3): style/material/featured KHÔNG có tham số lọc ở BE.
  async getModels3d(params = {}) {
    await delay(250);
    // "công khai" — CHỈ mẫu isPublic (đúng theo BE-1: owner_user_id null cho mẫu public).
    // Model AI đã sinh riêng của user (isPublic=false) tra bằng slug (getModel3d), KHÔNG lọt vào đây.
    const keyword = params?.keyword?.toLowerCase().trim();
    let items = MODELS_3D.filter((m) =>
      m.isPublic &&
      (!keyword || m.name.toLowerCase().includes(keyword)) &&
      (!params?.productType || m.productType === params.productType)
    );
    if (params?.sort === 'createdAt,desc') items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    const size = Number(params?.size) || 20;
    const number = Number(params?.page) || 0;
    const totalElements = items.length;
    const paged = items.slice(number * size, number * size + size);
    return { content: paged, page: { size, number, totalElements, totalPages: Math.max(1, Math.ceil(totalElements / size)) } };
  },

  // GET /custom/models/:slug → Model3dResponse (gồm cả model do user vừa sinh từ ảnh)
  // GET /custom/models/my — model AI đã dựng (mock: mọi model trong genModels, mới nhất trước). Trước đây THIẾU → trang
  // "Model 3D của tôi" luôn báo lỗi ở chế độ mock (production gọi BE thật nên không bị).
  async getMyModels(params = {}) {
    await delay(250);
    const all = [...memoryDb.genModels.values()].sort((x, y) => String(y.createdAt).localeCompare(String(x.createdAt)));
    return toSpringPage(all, params);
  },
  // PUT /custom/models/{id} { name } — chỉ đổi tên
  async renameModel({ id, name }) {
    await delay(250);
    const entry = [...memoryDb.genModels.entries()].find(([, m]) => m.id === id);
    if (!entry) throw orderError(404, 'Không tìm thấy model');
    const updated = { ...entry[1], name: String(name).trim().slice(0, 255) };
    memoryDb.genModels.set(entry[0], updated);
    persistGenModels();
    return updated;
  },

  async getModel3d(slug) {
    await delay(200);
    const model = memoryDb.genModels.get(slug) ?? MODELS_3D.find((m) => m.slug === slug || m.id === slug);
    if (!model) throw Object.assign(new Error('MODEL_NOT_FOUND'), { response: { status: 404 } });
    return model;
  },

  /*
   * POST /custom/ai/generate — bắt đầu dựng 3D từ ảnh, trả NGAY (202), không chờ AI xong.
   * Mock: tạo task 'queued', trả { taskId, status, progress } đúng shape thật.
   * (Thật: BE proxy gọi Meshy image-to-3D, KHÔNG để key ở FE.)
   * Testability: đặt tên file chứa "fail" (không phân biệt hoa/thường) → mô phỏng task 'failed'
   * khi dựng xong, để FE dựng UI retry/error mà không cần BE thật (giống cờ simulateFail của BE).
   */
  async generate3D({ image, templateId } = {}) {
    await delay(400);
    const taskId = `task_${Date.now().toString(36)}`;
    const imageName = image?.name ?? null;
    memoryDb.genTasks.set(taskId, {
      taskId, startedAt: Date.now(), imageName, templateId: templateId ?? null,
      simulateFail: !!imageName?.toLowerCase().includes('fail'),
      explicitStatus: null, retryCount: 0,
    });
    persistGenTasks();
    return { taskId, status: 'queued', progress: 0 };
  },

  /*
   * GET /custom/ai/tasks/:taskId → Ai3DTaskResponse — poll tiến trình dựng.
   * Mock: lazy-on-read (tính trạng thái từ startedAt, KHÔNG dùng timer nền) — mô phỏng
   * queued (~0.5s đầu) → processing → succeeded/failed (~7s), giống chiến lược Mock provider thật ở BE-2.
   */
  async getGenTask(taskId) { return resolveGenTask(taskId); },

  // POST /custom/ai/generate/text { prompt, artStyle?, negativePrompt? } → 202 { taskId, status:'queued', progress:0 }
  async generate3DFromText({ prompt, artStyle, negativePrompt } = {}) {
    await delay(400);
    if (!prompt?.trim()) throw Object.assign(new Error('PROMPT_REQUIRED'), { response: { status: 400, data: { message: 'Vui lòng nhập mô tả' } } });
    const taskId = `task_${Date.now().toString(36)}`;
    memoryDb.genTasks.set(taskId, {
      taskId, startedAt: Date.now(), imageName: null, templateId: null, inputType: 'text',
      prompt: prompt.trim(), artStyle: artStyle ?? 'realistic', negativePrompt: negativePrompt ?? null,
      // gõ chữ "fail" trong mô tả để demo luồng lỗi (giống ảnh có tên chứa "fail")
      simulateFail: prompt.toLowerCase().includes('fail'), explicitStatus: null, retryCount: 0, refined: false,
    });
    persistGenTasks();
    return { taskId, status: 'queued', progress: 0 };
  },

  // POST /custom/ai/tasks/:taskId/refine — chỉ task text đã preview xong, chưa refine (sai → 409)
  async refineGenTask(taskId) {
    await delay(300);
    const task = memoryDb.genTasks.get(taskId);
    if (!task) throw Object.assign(new Error('TASK_NOT_FOUND'), { response: { status: 404 } });
    const current = await resolveGenTask(taskId);
    if (task.inputType !== 'text' || current.status !== 'succeeded' || task.refined) {
      throw Object.assign(new Error('CANNOT_REFINE'), { response: { status: 409, data: { message: 'Task không thể nâng cấp texture' } } });
    }
    task.refining = true;
    task.startedAt = Date.now(); // quay lại processing → succeeded sau ~7s
    persistGenTasks();
    return resolveGenTask(taskId);
  },

  // POST /custom/ai/tasks/:taskId/retry — chỉ khi đang 'failed', tối đa 3 lần (vượt → 429)
  async retryGenTask(taskId) {
    await delay(200);
    const task = memoryDb.genTasks.get(taskId);
    if (!task) throw Object.assign(new Error('TASK_NOT_FOUND'), { response: { status: 404 } });
    const current = await resolveGenTask(taskId);
    if (current.status !== 'failed') throw Object.assign(new Error('TASK_NOT_FAILED'), { response: { status: 409 } });
    if (task.retryCount >= 3) throw Object.assign(new Error('RETRY_LIMIT'), { response: { status: 429 } });
    task.retryCount += 1;
    task.startedAt = Date.now();
    task.explicitStatus = null;
    persistGenTasks();
    return resolveGenTask(taskId);
  },

  // POST /custom/ai/tasks/:taskId/cancel — chỉ khi CHƯA terminal (đã kết thúc → 409)
  async cancelGenTask(taskId) {
    await delay(200);
    const task = memoryDb.genTasks.get(taskId);
    if (!task) throw Object.assign(new Error('TASK_NOT_FOUND'), { response: { status: 404 } });
    const current = await resolveGenTask(taskId);
    if (['succeeded', 'failed', 'cancelled'].includes(current.status)) {
      throw Object.assign(new Error('TASK_ALREADY_TERMINAL'), { response: { status: 409 } });
    }
    task.explicitStatus = 'cancelled';
    task.cancelledProgress = current.progress;
    persistGenTasks();
    return resolveGenTask(taskId);
  },

  // GET /custom/ai/tasks/my?status=&page=&size= → Page<Ai3DTaskResponse>
  async getMyGenTasks(params = {}) {
    await delay(250);
    const all = await Promise.all(Array.from(memoryDb.genTasks.keys()).map(resolveGenTask));
    const items = all.filter((t) => !params?.status || t.status === params.status).sort((a, b) => b.taskId < a.taskId ? -1 : 1);
    return { content: items, page: { size: items.length || 20, number: 0, totalElements: items.length, totalPages: 1 } };
  },

  async submitContact(body) {
    await delay(500);
    // Lưu lại để trang admin Liên hệ (mock) có dữ liệu
    const contact = { id: crypto.randomUUID(), ...body, phone: body.phone ?? null, status: 'new', userId: useAuthStore.getState().user?.id ?? null, createdAt: new Date().toISOString() };
    storage.setItem('woodhub-mock-contacts', [contact, ...storage.getItem('woodhub-mock-contacts', [])]);
    return contact;
  },

  // ===== ĐÁNH GIÁ WOODHUB (docs/BE-platform-feedback.md) — lưu localStorage, thưởng 5 lượt design 1 lần / tài khoản =====
  async getMyPlatformFeedback({ platform = 'web' } = {}) {
    await delay(200);
    const me = useAuthStore.getState().user;
    const fb = storage.getItem(FEEDBACK_KEY, []).find((f) => f.userId === me?.id && f.platform === platform);
    if (!fb) throw Object.assign(new Error('FEEDBACK_NOT_FOUND'), { response: { status: 404, data: { errorCode: 'FEEDBACK_NOT_FOUND' } } });
    return fb;
  },
  async submitPlatformFeedback({ platform = 'web', context, rating, comment }) {
    await delay(500);
    const me = useAuthStore.getState().user;
    if (!me) throw Object.assign(new Error('UNAUTHORIZED'), { response: { status: 401, data: { errorCode: 'UNAUTHORIZED' } } });
    if (!(rating >= 1 && rating <= 5) || [...String(comment ?? '').trim()].length < 10) {
      throw Object.assign(new Error('VALIDATION_FAILED'), { response: { status: 400, data: { errorCode: 'VALIDATION_FAILED', message: 'Vui lòng chọn số sao và viết ít nhất 10 ký tự' } } });
    }
    const all = storage.getItem(FEEDBACK_KEY, []);
    const now = new Date().toISOString();
    const idx = all.findIndex((f) => f.userId === me.id && f.platform === platform);
    const alreadyRewarded = all.some((f) => f.userId === me.id && f.rewardCredits > 0);
    const rewardGranted = !alreadyRewarded && me.role === 'customer';
    const base = idx >= 0 ? all[idx] : { id: crypto.randomUUID(), userId: me.id, userEmail: me.email, userFullName: me.fullName ?? me.name, platform, rewardCredits: 0, hidden: false, appVersion: null, createdAt: now };
    const fb = { ...base, context, rating, comment: comment.trim(), updatedAt: now, rewardCredits: base.rewardCredits || (rewardGranted ? FEEDBACK_REWARD : 0) };
    if (idx >= 0) all[idx] = fb; else all.unshift(fb);
    storage.setItem(FEEDBACK_KEY, all);
    if (rewardGranted) { mockCreditWallet.design = (mockCreditWallet.design ?? 0) + FEEDBACK_REWARD; persistCreditWallet(); }
    return { feedback: fb, rewardGranted, rewardCredits: rewardGranted ? FEEDBACK_REWARD : 0, designCreditBalance: mockCreditWallet.design ?? 0 };
  },
  async getPlatformFeedbackSummary() {
    await delay(200);
    const list = storage.getItem(FEEDBACK_KEY, []).filter((f) => !f.hidden);
    return { avgRating: avgOf(list), count: list.length };
  },
  async getAdminFeedback(params = {}) {
    await delay(250);
    let list = storage.getItem(FEEDBACK_KEY, []);
    if (params.platform) list = list.filter((f) => f.platform === params.platform);
    if (params.rating) list = list.filter((f) => f.rating === Number(params.rating));
    return toSpringPage(list, params);
  },
  async getAdminFeedbackSummary() {
    await delay(250);
    const list = storage.getItem(FEEDBACK_KEY, []);
    const byPlatform = Object.fromEntries(['web', 'android', 'ios'].map((p) => { const l = list.filter((f) => f.platform === p); return [p, { avgRating: avgOf(l), count: l.length }]; }));
    const distribution = Object.fromEntries([1, 2, 3, 4, 5].map((r) => [r, list.filter((f) => f.rating === r).length]));
    return { avgRating: avgOf(list), count: list.length, byPlatform, distribution, rewardedUsers: new Set(list.filter((f) => f.rewardCredits > 0).map((f) => f.userId)).size };
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
      if (payment._polls >= 3 && payment.purpose === 'order') {
        // Webhook SePay giả lập cho đơn hàng: mọi đơn dùng chung payment này pending_payment → paid
        payment.status = 'paid';
        payment.paidAt = new Date().toISOString();
        payment.paidAmount = payment.amount;
        memoryDb.orders.forEach((o) => {
          if (o.paymentId === payment.id && o.status === 'pending_payment') { o.status = 'paid'; o.updatedAt = payment.paidAt; }
        });
        persistOrders();
      } else if (payment._polls >= 3 && payment.purpose === 'credit_pack') {
        // Webhook giả lập: cộng lượt của gói vào ví (không đụng tới gói đăng ký)
        payment.status = 'paid';
        payment.paidAt = new Date().toISOString();
        payment.paidAmount = payment.amount;
        const pack = mockCreditPacks.find((p) => p.id === payment._packId);
        if (pack) { mockCreditWallet[pack.feature] = (mockCreditWallet[pack.feature] ?? 0) + pack.credits; persistCreditWallet(); }
      } else if (payment._polls >= 3 && payment._customOrderId) {
        // Webhook giả lập đơn custom: cộng tiền đã trả, hệ thống tự chuyển deposit_paid / paid
        payment.status = 'paid';
        payment.paidAt = new Date().toISOString();
        payment.paidAmount = payment.amount;
        const order = memoryDb.customOrders.get(payment._customOrderId);
        if (order) {
          const to = payment.purpose === 'custom_final' ? 'paid' : 'deposit_paid';
          order.paidAmount = Number(order.paidAmount ?? 0) + payment.amount;
          order.remainingAmount = Math.max(0, Number(order.totalAmount) + Number(order.shippingFee ?? 0) - order.paidAmount);
          order.history.push({ id: nextId('coh'), fromStatus: order.status, toStatus: to, changedById: null, changedByRole: 'system', note: null, createdAt: payment.paidAt });
          order.status = to;
          order.payments = [...(order.payments ?? []), { id: payment.id, purpose: payment.purpose, amount: payment.amount, status: 'paid', paidAt: payment.paidAt }];
          memoryDb.customOrders.set(order.id, order);
          persistCustomOrders();
        }
      } else if (payment._polls >= 3) {
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
    // Trả BẢN SAO: nếu trả đúng object đã sửa tại chỗ, React Query so sánh cũ/mới là cùng tham chiếu → coi như không đổi → UI không cập nhật
    return { ...payment };
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
    // ar_3d đã bỏ khỏi /usage/me (AR dùng Scene Viewer free, không giới hạn)
    const features = ['ai_chat', 'design', 'export'];
    return features.map((feature) => {
      const limit = limits[feature] ?? 0;
      const unlimited = limit === -1;
      // purchasedRemaining: chỉ tính năng CÓ bán lượt (design) mới có số; còn lại null
      const purchasedRemaining = feature === 'design' ? (mockCreditWallet.design ?? 0) : null;
      return { feature, period, used: 0, limit: unlimited ? null : limit, remaining: unlimited ? null : limit, unlimited, purchasedRemaining };
    });
  },

  // ===== CREDIT PACK =====
  async getCreditPacks() {
    await delay(200);
    return mockCreditPacks.filter((p) => p.isActive).sort((a, b) => a.sortOrder - b.sortOrder);
  },

  async createCreditPackPayment(packId) {
    await delay(400);
    const pack = mockCreditPacks.find((p) => p.id === packId && p.isActive);
    if (!pack) throw Object.assign(new Error('Not found'), { response: { status: 404, data: { message: 'Không tìm thấy gói lượt' } } });
    if (!(pack.price > 0)) throw Object.assign(new Error('Free'), { response: { status: 400, data: { message: 'Gói miễn phí không cần thanh toán' } } });
    const now = new Date();
    const payment = {
      id: nextId('pay'), purpose: 'credit_pack', amount: pack.price, status: 'pending',
      txnRef: nextId('CRD').toUpperCase(),
      qrUrl: `https://qr.sepay.vn/img?acc=demo&bank=DEMO&amount=${pack.price}&des=demo`,
      expiresAt: new Date(now.getTime() + 15 * 60_000).toISOString(),
      paidAt: null, paidAmount: null, createdAt: now.toISOString(), planId: null, planName: null, _polls: 0, _packId: pack.id,
    };
    mockPayments = [payment, ...mockPayments];
    persistMockPayments();
    return { ...payment };
  },

  async getAdminCreditPacks() {
    await delay(250);
    return [...mockCreditPacks].sort((a, b) => a.sortOrder - b.sortOrder);
  },

  async createCreditPack(body) {
    await delay(300);
    if (mockCreditPacks.some((p) => p.name === body.name)) throw Object.assign(new Error('Dup'), { response: { status: 409, data: { message: `Mã gói ${body.name} đã tồn tại` } } });
    const pack = { id: crypto.randomUUID(), feature: 'design', isActive: true, sortOrder: 0, ...body };
    mockCreditPacks = [...mockCreditPacks, pack];
    persistCreditPacks();
    return { ...pack };
  },

  async updateCreditPack({ id, ...body }) {
    await delay(300);
    const current = mockCreditPacks.find((p) => p.id === id);
    if (!current) throw Object.assign(new Error('Not found'), { response: { status: 404, data: { message: 'Không tìm thấy gói lượt' } } });
    const updated = { ...current, ...body };
    mockCreditPacks = mockCreditPacks.map((p) => (p.id === id ? updated : p));
    persistCreditPacks();
    return { ...updated };
  },

  async deleteCreditPack(id) {
    await delay(250);
    mockCreditPacks = mockCreditPacks.filter((p) => p.id !== id);
    persistCreditPacks();
    return null;
  },

  // ===== GA4 TRAFFIC =====
  async getAdminDashboardTraffic(params = {}) {
    await delay(500);
    if (String(storage.getItem('woodhub:mock-ga-off', '')) === '1') {
      throw Object.assign(new Error('GA not configured'), { response: { status: 503, data: { message: 'Chưa cấu hình Google Analytics' } } });
    }
    return mockTraffic(params);
  },
};
