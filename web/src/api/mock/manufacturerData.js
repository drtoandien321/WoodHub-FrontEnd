/*
 * manufacturerData.js — MOCK dữ liệu cho Portal Nhà cung cấp (manufacturer: bán sản phẩm có sẵn,
 * nhiều chi nhánh, KHÔNG custom). Self-contained để dựng UI trước; khi có BE thì thay bằng API
 * (giữ shape camelCase). Tiền là số nguyên VND (format bằng formatVnd).
 *
 * ⚠️ Đây là portal khác với /portal cũ (workshop-ish). Không đụng tới supplierData.js.
 */

// ---- Hồ sơ doanh nghiệp ----
export const MANUFACTURER = {
  id: 'sup_anphat',
  name: 'Nội Thất An Phát',
  initials: 'AP',
  email: 'contact@noithatanphat.vn',
  hotline: '0909 123 456',
  taxCode: '0312345678',
  website: 'https://noithatanphat.vn',
  hqAddress: 'Số 25 Đường D1, KDC An Phú, P. An Phú, TP. Thủ Đức, TP. Hồ Chí Minh',
  description:
    'Nội Thất An Phát chuyên cung cấp các sản phẩm nội thất gỗ cao cấp với thiết kế tinh tế, chất lượng bền vững và dịch vụ tận tâm. Chúng tôi cam kết mang đến không gian sống ấm cúng, sang trọng cho mọi gia đình Việt.',
  contactName: 'Anh Phạm Minh Phát',
  bank: 'ACB - Ngân hàng Á Châu',
  accountTail: '6789',
  joinDate: '12/03/2024',
  branchCount: 5,
  status: 'active',
};

// ---- Chi nhánh ----
export const BRANCHES = [
  {
    id: 'BR001', name: 'Chi nhánh Quận 1', district: 'Quận 1, TP.HCM',
    address: '123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
    phone: '(028) 3821 2345', email: 'quan1@noithatanphat.vn', manager: 'Nguyễn Minh Tuấn',
    status: 'active', performance: 98, monthRevenue: 168_600_000, monthOrders: 78, rating: 4.9,
    hours: 'Thứ 2 – Chủ nhật: 08:00 – 21:00',
    description: 'Chi nhánh Quận 1 là cửa hàng trưng bày và trải nghiệm các sản phẩm nội thất cao cấp của WoodHub. Chúng tôi cam kết mang đến cho khách hàng không gian mua sắm tiện nghi và dịch vụ tận tâm.',
  },
  {
    id: 'BR002', name: 'Chi nhánh Thủ Đức', district: 'Thủ Đức, TP.HCM',
    address: '456 Võ Văn Ngân, P. Bình Thọ, TP. Thủ Đức, TP.HCM',
    phone: '0902 345 678', email: 'thuduc@noithatanphat.vn', manager: 'Trần Thị Bích Ngọc',
    status: 'active', performance: 96, monthRevenue: 142_300_000, monthOrders: 65, rating: 4.8,
    hours: 'Thứ 2 – Chủ nhật: 08:00 – 21:00',
    description: 'Chi nhánh Thủ Đức phục vụ khu vực phía Đông thành phố với kho hàng rộng và đội ngũ tư vấn nhiệt tình.',
  },
  {
    id: 'BR003', name: 'Chi nhánh Gò Vấp', district: 'Gò Vấp, TP.HCM',
    address: '789 Quang Trung, P. 10, Q. Gò Vấp, TP.HCM',
    phone: '0903 456 789', email: 'govap@noithatanphat.vn', manager: 'Lê Hoàng Nam',
    status: 'active', performance: 94, monthRevenue: 98_400_000, monthOrders: 54, rating: 4.7,
    hours: 'Thứ 2 – Chủ nhật: 08:00 – 21:00',
    description: 'Chi nhánh Gò Vấp thuận tiện cho khách hàng khu vực phía Bắc thành phố.',
  },
  {
    id: 'BR004', name: 'Chi nhánh Bình Tân', district: 'Bình Tân, TP.HCM',
    address: '321 Kinh Dương Vương, P. An Lạc, Q. Bình Tân, TP.HCM',
    phone: '0904 567 890', email: 'binhtan@noithatanphat.vn', manager: 'Phạm Thị Thu Hà',
    status: 'paused', performance: 72, monthRevenue: 61_200_000, monthOrders: 31, rating: 4.5,
    hours: 'Thứ 2 – Chủ nhật: 08:00 – 21:00',
    description: 'Chi nhánh Bình Tân đang tạm ngưng để nâng cấp showroom.',
  },
  {
    id: 'BR005', name: 'Chi nhánh Tân Bình', district: 'Tân Bình, TP.HCM',
    address: '654 Cộng Hòa, P. 13, Q. Tân Bình, TP.HCM',
    phone: '0905 678 901', email: 'tanbinh@noithatanphat.vn', manager: 'Đỗ Quốc Anh',
    status: 'active', performance: 97, monthRevenue: 156_800_000, monthOrders: 78, rating: 4.9,
    hours: 'Thứ 2 – Chủ nhật: 08:00 – 21:00',
    description: 'Chi nhánh Tân Bình là chi nhánh chủ lực với doanh thu cao nhất hệ thống.',
  },
];

// ---- Sản phẩm có sẵn ----
const IMG = '/mockdataimage';
export const M_PRODUCTS = [
  {
    id: 'PRD-1003', sku: 'BAN-AN-SCANDI-OAK', nameVi: 'Bàn ăn gỗ sồi Scandi', nameEn: 'Scandi Oak Dining Table',
    category: 'Bàn ăn', material: 'Gỗ sồi', color: 'Tự nhiên (Natural Oak)', size: 'Dài 160 × Rộng 90 × Cao 75 cm',
    price: 5_900_000, stock: 54, status: 'active', branch: 'Chi nhánh Tân Bình',
    image: `${IMG}/Bàn ăn gỗ sồi 6 ghế.jpg`, views: 1352, addToCart: 86, orders: 14, revenue: 82_600_000,
    tags: ['Gỗ sồi tự nhiên', 'Scandi'],
    description: 'Bàn ăn gỗ sồi Scandi mang phong cách tối giản Bắc Âu với thiết kế tinh tế, đường nét thanh mảnh và màu gỗ tự nhiên ấm áp. Sản phẩm được chế tác từ gỗ sồi tự nhiên cao cấp, bề mặt hoàn thiện mịn màng, bền đẹp theo thời gian. Phù hợp với không gian phòng ăn hiện đại, chung cư, nhà phố và homestay.',
  },
  {
    id: 'PRD-1006', sku: 'KE-SACH-TANBI-5T', nameVi: 'Kệ sách tần bì 5 tầng', nameEn: 'Ash 5-tier Bookshelf',
    category: 'Kệ sách', material: 'Gỗ tần bì', color: 'Vàng nhạt', size: 'Rộng 80 × Sâu 30 × Cao 180 cm',
    price: 2_950_000, stock: 6, status: 'low', branch: 'Chi nhánh Tân Bình',
    image: `${IMG}/Kệ sách gỗ óc chó 5 tầng.jpg`, views: 940, addToCart: 52, orders: 9, revenue: 26_550_000,
    tags: ['Gỗ tần bì'],
    description: 'Kệ sách tần bì 5 tầng thiết kế tối giản, chịu lực tốt, phù hợp phòng khách và phòng làm việc.',
  },
  {
    id: 'PRD-1009', sku: 'TU-AO-3C-OAK', nameVi: 'Tủ quần áo 3 cánh', nameEn: '3-door Wardrobe',
    category: 'Tủ quần áo', material: 'Gỗ sồi', color: 'Nâu gỗ', size: 'Rộng 160 × Sâu 60 × Cao 200 cm',
    price: 8_200_000, stock: 0, status: 'out', branch: 'Chi nhánh Thủ Đức',
    image: `${IMG}/Tủ quần áo 3 cánh gỗ MDF phủ melamine.jpg`, views: 612, addToCart: 30, orders: 5, revenue: 41_000_000,
    tags: ['Gỗ sồi'],
    description: 'Tủ quần áo 3 cánh gỗ sồi, nhiều ngăn tiện dụng, hoàn thiện chắc chắn.',
  },
  {
    id: 'PRD-1011', sku: 'BAN-TRA-OCCHO', nameVi: 'Bàn trà gỗ óc chó', nameEn: 'Walnut Coffee Table',
    category: 'Bàn trà', material: 'Gỗ óc chó', color: 'Nâu óc chó', size: 'Rộng 110 × Sâu 60 × Cao 45 cm',
    price: 3_450_000, stock: 11, status: 'active', branch: 'Chi nhánh Gò Vấp',
    image: `${IMG}/Kệ tivi gỗ óc chó 1m8.jpg`, views: 720, addToCart: 41, orders: 8, revenue: 27_600_000,
    tags: ['Gỗ óc chó'],
    description: 'Bàn trà gỗ óc chó sang trọng, vân gỗ đẹp tự nhiên, điểm nhấn cho phòng khách.',
  },
  {
    id: 'PRD-1014', sku: 'SOFA-HD-OAK', nameVi: 'Sofa gỗ hiện đại', nameEn: 'Modern Wooden Sofa',
    category: 'Sofa', material: 'Gỗ sồi', color: 'Be / Nâu gỗ', size: 'Rộng 200 × Sâu 90 × Cao 85 cm',
    price: 12_900_000, stock: 3, status: 'low', branch: 'Chi nhánh Tân Bình',
    image: `${IMG}/Giường ngủ gỗ sồi 1m6.jpg`, views: 1180, addToCart: 64, orders: 12, revenue: 154_800_000,
    tags: ['Gỗ sồi', 'Bán chạy'],
    description: 'Sofa gỗ hiện đại khung sồi chắc chắn, đệm êm, phong cách tối giản.',
  },
];

// ---- Đơn hàng (sản phẩm có sẵn) ----
export const M_ORDERS = [
  {
    id: 'ORD-1003', date: '28/06/2025 14:32', customerName: 'Bàn Gỗ Scandi', customerPhone: '0909 123 456',
    productName: 'Kệ sách gỗ Sồi 5 tầng', productImage: `${IMG}/Kệ sách gỗ óc chó 5 tầng.jpg`, qtyLabel: '8 sản phẩm',
    total: 5_900_000, payment: 'Chuyển khoản', status: 'processing', branch: 'Chi nhánh Tân Bình',
  },
  {
    id: 'ORD-1002', date: '27/06/2025 10:18', customerName: 'Nhà Xinh', customerPhone: '0908 888 222',
    productName: 'Bàn ăn gỗ Sồi 6 ghế', productImage: `${IMG}/Bàn ăn gỗ sồi 6 ghế.jpg`, qtyLabel: '1 bộ',
    total: 8_200_000, payment: 'Chuyển khoản', status: 'packing', branch: 'Chi nhánh Tân Bình',
  },
  {
    id: 'ORD-1001', date: '26/06/2025 16:45', customerName: 'Tủ Bếp Xanh', customerPhone: '0933 456 789',
    productName: 'Kệ tivi gỗ Óc chó 3 ngăn', productImage: `${IMG}/Kệ tivi gỗ óc chó 1m8.jpg`, qtyLabel: '1 sản phẩm',
    total: 6_400_000, payment: 'Chuyển khoản', status: 'shipping', branch: 'Chi nhánh Gò Vấp',
  },
  {
    id: 'ORD-1000', date: '25/06/2025 09:12', customerName: 'Anh Hoàng Long', customerPhone: '0977 111 222',
    productName: 'Bàn trà gỗ óc chó', productImage: `${IMG}/Kệ tivi gỗ óc chó 1m8.jpg`, qtyLabel: '2 sản phẩm',
    total: 6_900_000, payment: 'COD', status: 'completed', branch: 'Chi nhánh Thủ Đức',
  },
  {
    id: 'ORD-0999', date: '24/06/2025 18:03', customerName: 'Chị Mai Anh', customerPhone: '0966 333 444',
    productName: 'Tủ quần áo 3 cánh', productImage: `${IMG}/Tủ quần áo 3 cánh gỗ MDF phủ melamine.jpg`, qtyLabel: '1 sản phẩm',
    total: 8_200_000, payment: 'Chuyển khoản', status: 'cancelled', branch: 'Chi nhánh Thủ Đức',
  },
];

// ---- Dashboard ----
export const DASHBOARD = {
  kpis: [
    { key: 'revenue', label: 'Tổng doanh thu', value: 320_500_000, money: true, delta: 12.5, icon: 'wallet' },
    { key: 'newOrders', label: 'Đơn hàng mới', value: 48, delta: 9.3, icon: 'bag' },
    { key: 'processing', label: 'Đơn đang xử lý', value: 26, delta: 4.1, icon: 'package' },
    { key: 'rating', label: 'Đánh giá trung bình', value: '4.8/5', delta: 0.2, icon: 'star' },
  ],
  // Doanh thu 7 ngày (triệu VND đã ×1e6 để format ra tiền thật)
  revenue7d: [
    { date: '22/06', value: 31_000_000 },
    { date: '23/06', value: 38_500_000 },
    { date: '24/06', value: 58_000_000 },
    { date: '25/06', value: 46_000_000 },
    { date: '26/06', value: 50_500_000 },
    { date: '27/06', value: 41_000_000 },
    { date: '28/06', value: 55_000_000 },
  ],
  secondary: [
    { key: 'branches', label: 'Chi nhánh', value: '5', hint: 'Chi nhánh hoạt động', to: '/portal/supplier/branches', icon: 'store' },
    { key: 'products', label: 'Sản phẩm', value: '128', hint: 'Sản phẩm đang bán', to: '/portal/supplier/products', icon: 'package' },
    { key: 'customers', label: 'Khách hàng', value: '1.256', hint: 'Khách hàng thân thiết', to: '/portal/supplier/reports', icon: 'users' },
    { key: 'reviews', label: 'Đánh giá', value: '241', hint: 'Đánh giá từ khách hàng', to: '/portal/supplier/reports', icon: 'star' },
  ],
};

// ---- Tổng hợp sản phẩm (summary cards trang Sản phẩm) ----
export const PRODUCT_SUMMARY = { total: 128, active: 96, low: 20, out: 12 };

// ---- Báo cáo ----
export const REPORTS = {
  kpis: [
    { label: 'Doanh thu', value: 320_500_000, money: true, delta: 12.5 },
    { label: 'Tổng đơn hàng', value: 786, delta: 8.7 },
    { label: 'Giá trị đơn TB', value: 4_078_000, money: true, delta: 3.2 },
    { label: 'Tỷ lệ hoàn thành', value: '96%', delta: 2.1 },
  ],
  ordersByStatus: [
    { key: 'processing', label: 'Đang xử lý', value: 26 },
    { key: 'packing', label: 'Đang đóng gói', value: 18 },
    { key: 'shipping', label: 'Đang giao', value: 22 },
    { key: 'completed', label: 'Hoàn thành', value: 698 },
    { key: 'cancelled', label: 'Đã hủy', value: 22 },
  ],
  topProducts: [
    { name: 'Sofa gỗ hiện đại', sold: 64, revenue: 154_800_000, growth: 18.3 },
    { name: 'Bàn ăn gỗ sồi Scandi', sold: 48, revenue: 82_600_000, growth: 12.5 },
    { name: 'Tủ quần áo 3 cánh', sold: 30, revenue: 41_000_000, growth: -4.0 },
    { name: 'Bàn trà gỗ óc chó', sold: 41, revenue: 27_600_000, growth: 8.1 },
  ],
  alerts: [
    { tone: 'warning', text: '12 sản phẩm sắp hết hàng' },
    { tone: 'error', text: '3 chi nhánh có đơn trễ xử lý' },
    { tone: 'info', text: '5 đơn cần cập nhật trạng thái' },
  ],
};

// ---- Đánh giá khách hàng ----
export const M_REVIEWS_SUMMARY = {
  average: 4.8, total: 241,
  distribution: [{ star: 5, count: 198 }, { star: 4, count: 31 }, { star: 3, count: 8 }, { star: 2, count: 3 }, { star: 1, count: 1 }],
};
export const M_REVIEWS = [
  { id: 'rv1', name: 'Anh Minh Tuấn', date: '28/06/2025', rating: 5, product: 'Bàn ăn gỗ sồi Scandi', branch: 'Chi nhánh Tân Bình', text: 'Sản phẩm đẹp, đúng mô tả, giao nhanh. Nhân viên tư vấn nhiệt tình, sẽ ủng hộ tiếp.', replied: true },
  { id: 'rv2', name: 'Chị Thu Hằng', date: '26/06/2025', rating: 5, product: 'Sofa gỗ hiện đại', branch: 'Chi nhánh Quận 1', text: 'Sofa chắc chắn, đệm êm, màu gỗ sang. Rất hài lòng!', replied: false },
  { id: 'rv3', name: 'Anh Quốc Bảo', date: '24/06/2025', rating: 4, product: 'Kệ sách tần bì 5 tầng', branch: 'Chi nhánh Tân Bình', text: 'Kệ đẹp, lắp ráp hơi mất thời gian một chút nhưng nhìn chung tốt.', replied: false },
  { id: 'rv4', name: 'Chị Mai Anh', date: '21/06/2025', rating: 3, product: 'Tủ quần áo 3 cánh', branch: 'Chi nhánh Thủ Đức', text: 'Sản phẩm ổn nhưng giao trễ 2 ngày so với hẹn.', replied: true },
  { id: 'rv5', name: 'Anh Hoàng Long', date: '18/06/2025', rating: 5, product: 'Bàn trà gỗ óc chó', branch: 'Chi nhánh Gò Vấp', text: 'Vân gỗ đẹp, đóng gói kỹ. Giao hàng đúng hẹn.', replied: true },
];

// ---- Hồ sơ & Năng lực (showcase) ----
export const M_PROFILE = {
  cover: `${IMG}/Tủ quần áo 3 cánh gỗ MDF phủ melamine.jpg`,
  strengths: ['Gỗ tự nhiên cao cấp', 'Bảo hành dài hạn', 'Giao lắp tận nơi', 'Đổi trả 7 ngày'],
  capabilities: [
    { label: 'Năng lực cung ứng', value: '500+ sản phẩm/tháng' },
    { label: 'Danh mục', value: 'Bàn, ghế, tủ, kệ, sofa, giường' },
    { label: 'Khu vực giao hàng', value: 'Toàn quốc' },
    { label: 'Chất liệu chủ lực', value: 'Gỗ sồi, óc chó, tần bì, MDF' },
  ],
  portfolio: [
    `${IMG}/Bàn ăn gỗ sồi 6 ghế.jpg`,
    `${IMG}/Kệ sách gỗ óc chó 5 tầng.jpg`,
    `${IMG}/Kệ tivi gỗ óc chó 1m8.jpg`,
    `${IMG}/Giường ngủ gỗ sồi 1m6.jpg`,
    `${IMG}/Tủ quần áo 3 cánh gỗ MDF phủ melamine.jpg`,
    `${IMG}/Bàn làm việc gỗ thông chân chữ A.jpg`,
  ],
  certs: ['Chứng nhận gỗ hợp pháp (FSC)', 'ISO 9001:2015', 'Đối tác xác minh WoodHub'],
};

export const findBranch = (id) => BRANCHES.find((b) => b.id === id);
export const findMProduct = (id) => M_PRODUCTS.find((p) => p.id === id);
