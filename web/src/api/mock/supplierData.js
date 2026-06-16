import { PRODUCTS } from './data.js';

/*
 * Seed data cho Supplier Portal (B.6 — MVP).
 * Demo: chỉ 1 supplier đăng nhập được — "Xưởng Mộc Tân Bình" (s1/w1, đã có trong data.js/WORKSHOPS).
 * Sản phẩm seed lấy từ PRODUCTS có supplierId === 's1' (p1, p3), thêm field riêng cho portal
 * (nameEn/descriptionEn để hỗ trợ form song ngữ, sold để tính "sản phẩm bán chạy").
 */
const findProduct = (id) => PRODUCTS.find((p) => p.id === id);

export const DEFAULT_SUPPLIER_STORE = {
  name: 'Xưởng Mộc Tân Bình',
  description: 'Xưởng mộc gia đình hơn 15 năm kinh nghiệm, chuyên bàn ghế và kệ gỗ tự nhiên.',
  logoUrl: '',
  coverUrl: '',
};

export const DEFAULT_SUPPLIER_PRODUCTS = [
  {
    id: 'p1',
    name: 'Bàn ăn gỗ sồi Scandi',
    nameEn: 'Scandi Oak Dining Table',
    price: 5_900_000,
    material: 'oak',
    stock: 12,
    image: findProduct('p1').image,
    description: 'Bàn ăn 6 chỗ gỗ sồi tự nhiên, hoàn thiện dầu lau, chân vát kiểu Bắc Âu.',
    descriptionEn: '6-seat solid oak dining table, oil finish, Scandinavian tapered legs.',
    sold: 28,
  },
  {
    id: 'p3',
    name: 'Kệ sách tần bì 5 tầng',
    nameEn: '5-Tier Ash Bookshelf',
    price: 3_200_000,
    material: 'ash',
    stock: 20,
    image: findProduct('p3').image,
    description: 'Kệ mở 5 tầng gỗ tần bì, chịu tải 30kg/tầng.',
    descriptionEn: 'Open 5-tier ash shelf, 30kg load capacity per tier.',
    sold: 15,
  },
];

// Thứ tự trạng thái đơn hàng — dùng để tính bước "tiếp theo" khi supplier cập nhật trạng thái
export const ORDER_STATUS_SEQUENCE = ['processing', 'packing', 'shipping', 'completed'];

const buildTimeline = (doneUpTo) =>
  ORDER_STATUS_SEQUENCE.map((key, i) => ({
    key,
    done: i <= doneUpTo,
    at: i <= doneUpTo ? new Date(2026, 5, 10 + i).toISOString() : null,
  }));

export const DEFAULT_SUPPLIER_ORDERS = [
  {
    id: 'sord_1001',
    customerName: 'Nguyễn Văn A',
    items: [{ productId: 'p1', name: 'Bàn ăn gỗ sồi Scandi', qty: 1, price: 5_900_000, image: findProduct('p1').image }],
    total: 5_900_000,
    status: 'processing',
    createdAt: new Date(2026, 5, 12).toISOString(),
    timeline: buildTimeline(0),
  },
  {
    id: 'sord_1002',
    customerName: 'Trần Thị B',
    items: [{ productId: 'p3', name: 'Kệ sách tần bì 5 tầng', qty: 2, price: 3_200_000, image: findProduct('p3').image }],
    total: 6_400_000,
    status: 'packing',
    createdAt: new Date(2026, 5, 11).toISOString(),
    timeline: buildTimeline(1),
  },
  {
    id: 'sord_1003',
    customerName: 'Lê Văn C',
    items: [{ productId: 'p1', name: 'Bàn ăn gỗ sồi Scandi', qty: 1, price: 5_900_000, image: findProduct('p1').image }],
    total: 5_900_000,
    status: 'shipping',
    createdAt: new Date(2026, 5, 10).toISOString(),
    timeline: buildTimeline(2),
  },
];
