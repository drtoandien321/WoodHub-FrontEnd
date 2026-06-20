/*
 * Mock data — copy từ mockapi (https://.../demowoodhub) đưa về local để FE chạy offline ổn định.
 *
 * KHÁC mockapi gốc:
 * - name/description/category/material lưu SONG NGỮ { vi, en } để khi đổi ngôn ngữ thì
 *   tên + dữ liệu sản phẩm cũng đổi (mockapi gốc chỉ có tiếng Việt).
 *   → mockAdapter.localizeProduct() sẽ "dẹt" về string theo ngôn ngữ hiện tại trước khi trả cho UI.
 * - Bổ sung rating/stock/hasModel3d (mockapi không có) để giữ nguyên các tính năng UI hiện có.
 * - image trỏ tới ảnh thật trong public/mockdataimage/ (Vite phục vụ ở "/...") → CHẠY OFFLINE.
 *   Đường dẫn đã URL-encode (tên file có dấu + khoảng trắng) để không bị 404.
 *   URL ảnh gốc của mockapi (picsum) lưu ở thumbnailUrl để sau này nối BE thật thì dùng lại.
 *
 * Giữ field gốc: id, status, supplierId/supplierName, categoryId, materialId, price, createdAt, updatedAt.
 */

// Gradient SVG inline — fallback ảnh chạy offline khi cần (hiện không dùng vì đã có ảnh thật). label = chữ giữa ảnh.
export const woodSvg = (c1, c2, label) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="600" height="450" fill="url(#g)"/><text x="50%" y="52%" font-family="Georgia" font-size="34" fill="rgba(255,255,255,0.85)" text-anchor="middle">${label}</text></svg>`
  )}`;

/*
 * Bảng dịch danh mục & vật liệu — dùng lại cho từng sản phẩm để không lặp chuỗi.
 * id giữ đúng như mockapi (cat_*, mat_*).
 */
const CATEGORY_NAMES = {
  cat_dining: { vi: 'Bàn ăn', en: 'Dining Tables' },
  cat_storage: { vi: 'Kệ & Tủ', en: 'Storage & Cabinets' },
  cat_chair: { vi: 'Ghế', en: 'Chairs' },
  cat_desk: { vi: 'Bàn làm việc', en: 'Desks' },
  cat_bed: { vi: 'Giường', en: 'Beds' },
  cat_table: { vi: 'Bàn trà', en: 'Coffee Tables' },
};

const MATERIAL_NAMES = {
  mat_oak: { vi: 'Gỗ sồi', en: 'Oak' },
  mat_walnut: { vi: 'Gỗ óc chó', en: 'Walnut' },
  mat_rubberwood: { vi: 'Gỗ cao su', en: 'Rubberwood' },
  mat_mdf: { vi: 'Gỗ MDF', en: 'MDF' },
  mat_pine: { vi: 'Gỗ thông', en: 'Pine' },
  mat_acacia: { vi: 'Gỗ tràm', en: 'Acacia' },
};

export const PRODUCTS = [
  {
    id: 'p1',
    name: { vi: 'Bàn ăn gỗ sồi 6 ghế', en: 'Oak Dining Table (6 seats)' },
    description: {
      vi: 'Bàn ăn mặt gỗ sồi tự nhiên, chân sắt sơn tĩnh điện, phù hợp gia đình 4-6 người.',
      en: 'Natural oak top dining table with electrostatic-coated steel legs, ideal for families of 4-6.',
    },
    status: 'active',
    supplierId: 'sup_01', supplierName: 'Xưởng gỗ Thành Phát',
    categoryId: 'cat_dining', category: CATEGORY_NAMES.cat_dining,
    materialId: 'mat_oak', material: MATERIAL_NAMES.mat_oak,
    image: '/mockdataimage/B%C3%A0n%20%C4%83n%20g%E1%BB%97%20s%E1%BB%93i%206%20gh%E1%BA%BF.jpg', thumbnailUrl: 'https://picsum.photos/seed/oak-table/600/400',
    price: 8_500_000, rating: 4.8, stock: 12, hasModel3d: true,
    createdAt: '2025-02-10T09:15:00+07:00', updatedAt: '2025-03-01T14:20:00+07:00',
  },
  {
    id: 'p2',
    name: { vi: 'Kệ sách gỗ óc chó 5 tầng', en: 'Walnut 5-Tier Bookshelf' },
    description: {
      vi: 'Kệ sách 5 tầng gỗ óc chó, thiết kế tối giản, chịu lực tốt.',
      en: '5-tier walnut bookshelf with a minimalist design and sturdy load capacity.',
    },
    status: 'active',
    supplierId: 'sup_02', supplierName: 'Nội thất Minh Long',
    categoryId: 'cat_storage', category: CATEGORY_NAMES.cat_storage,
    materialId: 'mat_walnut', material: MATERIAL_NAMES.mat_walnut,
    image: '/mockdataimage/K%E1%BB%87%20s%C3%A1ch%20g%E1%BB%97%20%C3%B3c%20ch%C3%B3%205%20t%E1%BA%A7ng.jpg', thumbnailUrl: 'https://picsum.photos/seed/walnut-shelf/600/400',
    price: 6_200_000, rating: 4.7, stock: 8, hasModel3d: false,
    createdAt: '2025-02-12T10:00:00+07:00', updatedAt: '2025-02-28T08:45:00+07:00',
  },
  {
    id: 'p3',
    name: { vi: 'Ghế ăn gỗ cao su (bộ 2)', en: 'Rubberwood Dining Chairs (set of 2)' },
    description: {
      vi: 'Bộ 2 ghế ăn gỗ cao su, nệm bọc vải, êm ái.',
      en: 'Set of 2 rubberwood dining chairs with comfortable fabric-upholstered cushions.',
    },
    status: 'active',
    supplierId: 'sup_01', supplierName: 'Xưởng gỗ Thành Phát',
    categoryId: 'cat_chair', category: CATEGORY_NAMES.cat_chair,
    materialId: 'mat_rubberwood', material: MATERIAL_NAMES.mat_rubberwood,
    image: '/mockdataimage/Gh%E1%BA%BF%20%C4%83n%20g%E1%BB%97%20cao%20su.jpg', thumbnailUrl: 'https://picsum.photos/seed/rubber-chair/600/400',
    price: 2_400_000, rating: 4.5, stock: 30, hasModel3d: false,
    createdAt: '2025-01-20T13:30:00+07:00', updatedAt: '2025-02-15T16:10:00+07:00',
  },
  {
    id: 'p4',
    name: { vi: 'Tủ quần áo 3 cánh gỗ MDF phủ melamine', en: '3-Door MDF Wardrobe (Melamine finish)' },
    description: {
      vi: 'Tủ quần áo 3 cánh, gỗ MDF lõi xanh chống ẩm, phủ melamine vân gỗ.',
      en: '3-door wardrobe in moisture-resistant green-core MDF with a wood-grain melamine finish.',
    },
    status: 'draft',
    supplierId: 'sup_03', supplierName: 'Gỗ Đại Phát',
    categoryId: 'cat_storage', category: CATEGORY_NAMES.cat_storage,
    materialId: 'mat_mdf', material: MATERIAL_NAMES.mat_mdf,
    image: '/mockdataimage/T%E1%BB%A7%20qu%E1%BA%A7n%20%C3%A1o%203%20c%C3%A1nh%20g%E1%BB%97%20MDF%20ph%E1%BB%A7%20melamine.jpg', thumbnailUrl: 'https://picsum.photos/seed/mdf-wardrobe/600/400',
    price: 5_800_000, rating: 4.3, stock: 5, hasModel3d: false,
    createdAt: '2025-03-05T11:00:00+07:00', updatedAt: '2025-03-05T11:00:00+07:00',
  },
  {
    id: 'p5',
    name: { vi: 'Bàn làm việc gỗ thông chân chữ A', en: 'Pine Desk with A-Frame Legs' },
    description: {
      vi: 'Bàn làm việc gỗ thông mộc, chân chữ A vững chắc, phong cách Bắc Âu.',
      en: 'Solid pine desk with a sturdy A-frame, Scandinavian style.',
    },
    status: 'active',
    supplierId: 'sup_02', supplierName: 'Nội thất Minh Long',
    categoryId: 'cat_desk', category: CATEGORY_NAMES.cat_desk,
    materialId: 'mat_pine', material: MATERIAL_NAMES.mat_pine,
    image: '/mockdataimage/B%C3%A0n%20l%C3%A0m%20vi%E1%BB%87c%20g%E1%BB%97%20th%C3%B4ng%20ch%C3%A2n%20ch%E1%BB%AF%20A.jpg', thumbnailUrl: 'https://picsum.photos/seed/pine-desk/600/400',
    price: 3_100_000, rating: 4.4, stock: 18, hasModel3d: true,
    createdAt: '2025-02-01T08:00:00+07:00', updatedAt: '2025-02-20T09:30:00+07:00',
  },
  {
    id: 'p6',
    name: { vi: 'Giường ngủ gỗ sồi 1m6', en: 'Oak Bed 1.6m' },
    description: {
      vi: 'Giường ngủ gỗ sồi tự nhiên, kích thước 1m6 x 2m, đầu giường bo tròn.',
      en: 'Natural oak bed, 1.6m x 2m, with a rounded headboard.',
    },
    status: 'out_of_stock',
    supplierId: 'sup_01', supplierName: 'Xưởng gỗ Thành Phát',
    categoryId: 'cat_bed', category: CATEGORY_NAMES.cat_bed,
    materialId: 'mat_oak', material: MATERIAL_NAMES.mat_oak,
    image: '/mockdataimage/Gi%C6%B0%E1%BB%9Dng%20ng%E1%BB%A7%20g%E1%BB%97%20s%E1%BB%93i%201m6.jpg', thumbnailUrl: 'https://picsum.photos/seed/oak-bed/600/400',
    price: 12_500_000, rating: 4.9, stock: 0, hasModel3d: true,
    createdAt: '2025-01-15T15:45:00+07:00', updatedAt: '2025-03-10T10:05:00+07:00',
  },
  {
    id: 'p7',
    name: { vi: 'Bàn trà gỗ tràm mặt kính', en: 'Acacia Coffee Table with Glass Top' },
    description: {
      vi: 'Bàn trà khung gỗ tràm, mặt kính cường lực, có ngăn để đồ.',
      en: 'Acacia-frame coffee table with a tempered glass top and a storage shelf.',
    },
    status: 'active',
    supplierId: 'sup_03', supplierName: 'Gỗ Đại Phát',
    categoryId: 'cat_table', category: CATEGORY_NAMES.cat_table,
    materialId: 'mat_acacia', material: MATERIAL_NAMES.mat_acacia,
    image: '/mockdataimage/B%C3%A0n%20tr%C3%A0%20g%E1%BB%97%20tr%C3%A0m%20m%E1%BA%B7t%20k%C3%ADnh.jpg', thumbnailUrl: 'https://picsum.photos/seed/acacia-coffee/600/400',
    price: 1_900_000, rating: 4.6, stock: 22, hasModel3d: true,
    createdAt: '2025-02-25T14:00:00+07:00', updatedAt: '2025-03-02T11:20:00+07:00',
  },
  {
    id: 'p8',
    name: { vi: 'Kệ tivi gỗ óc chó 1m8', en: 'Walnut TV Stand 1.8m' },
    description: {
      vi: 'Kệ tivi dài 1m8 gỗ óc chó, nhiều ngăn kéo, phù hợp phòng khách hiện đại.',
      en: '1.8m walnut TV stand with multiple drawers, suited to modern living rooms.',
    },
    status: 'active',
    supplierId: 'sup_02', supplierName: 'Nội thất Minh Long',
    categoryId: 'cat_storage', category: CATEGORY_NAMES.cat_storage,
    materialId: 'mat_walnut', material: MATERIAL_NAMES.mat_walnut,
    image: '/mockdataimage/K%E1%BB%87%20tivi%20g%E1%BB%97%20%C3%B3c%20ch%C3%B3%201m8.jpg', thumbnailUrl: 'https://picsum.photos/seed/walnut-tv/600/400',
    price: 7_400_000, rating: 4.7, stock: 9, hasModel3d: false,
    createdAt: '2025-02-18T09:50:00+07:00', updatedAt: '2025-03-04T13:15:00+07:00',
  },
  {
    id: 'p9',
    name: { vi: 'Bàn console gỗ cao su (mẫu thử)', en: 'Rubberwood Console Table (prototype)' },
    description: {
      vi: 'Bàn console gỗ cao su, đang trong giai đoạn thiết kế thử nghiệm.',
      en: 'Rubberwood console table, currently in the trial design phase.',
    },
    status: 'draft',
    supplierId: 'sup_01', supplierName: 'Xưởng gỗ Thành Phát',
    categoryId: 'cat_table', category: CATEGORY_NAMES.cat_table,
    materialId: null, material: null,
    image: '/mockdataimage/B%C3%A0n%20console%20g%E1%BB%97%20cao%20su.jpg', thumbnailUrl: 'https://picsum.photos/seed/console-draft/600/400',
    price: 0, rating: 0, stock: 0, hasModel3d: false,
    createdAt: '2025-03-12T16:30:00+07:00', updatedAt: '2025-03-12T16:30:00+07:00',
  },
  {
    id: 'p10',
    name: { vi: 'Tủ giày gỗ MDF 4 ngăn', en: '4-Tier MDF Shoe Cabinet' },
    description: {
      vi: 'Tủ giày 4 ngăn lật, gỗ MDF phủ melamine, tiết kiệm diện tích.',
      en: '4-tier flip-door shoe cabinet in melamine-coated MDF, space-saving.',
    },
    status: 'archived',
    supplierId: 'sup_03', supplierName: 'Gỗ Đại Phát',
    categoryId: 'cat_storage', category: CATEGORY_NAMES.cat_storage,
    materialId: 'mat_mdf', material: MATERIAL_NAMES.mat_mdf,
    image: '/mockdataimage/T%E1%BB%A7%20gi%C3%A0y%20g%E1%BB%97%20MDF%204%20ng%C4%83n.jpg', thumbnailUrl: 'https://picsum.photos/seed/mdf-shoe/600/400',
    price: 1_600_000, rating: 4.2, stock: 0, hasModel3d: false,
    createdAt: '2024-12-10T10:10:00+07:00', updatedAt: '2025-01-05T09:00:00+07:00',
  },
];

/*
 * Workshops kèm "capability" — dữ liệu phục vụ matching RULE-BASED:
 * lọc theo loại sản phẩm làm được + kích thước tối đa + khu vực. KHÔNG dùng AI (scope MVP).
 * Lưu ý: capability.types/materials dùng id của Custom Configurator (table, chair... ; oak, walnut...),
 * KHÁC id catalog (cat_..., mat_...) — vì luồng custom và luồng catalog là 2 nhánh riêng.
 */
export const WORKSHOPS = [
  { id: 'w1', name: 'Xưởng Mộc Tân Bình', district: 'Tân Bình, TP.HCM', rating: 4.8, completedJobs: 124, leadTimeDays: 14, capability: { types: ['table', 'shelf', 'chair'], maxWidthCm: 240, materials: ['oak', 'ash', 'rubber'] } },
  { id: 'w2', name: 'Nội thất Gia Phát', district: 'Thủ Đức, TP.HCM', rating: 4.9, completedJobs: 98, leadTimeDays: 21, capability: { types: ['cabinet', 'bed', 'table'], maxWidthCm: 300, materials: ['walnut', 'oak'] } },
  { id: 'w3', name: 'Mộc Việt Décor', district: 'Bình Thạnh, TP.HCM', rating: 4.5, completedJobs: 67, leadTimeDays: 10, capability: { types: ['chair', 'table', 'shelf'], maxWidthCm: 180, materials: ['pine', 'rubber', 'ash'] } },
  { id: 'w4', name: 'Tinh Mộc Studio', district: 'Quận 7, TP.HCM', rating: 4.7, completedJobs: 45, leadTimeDays: 18, capability: { types: ['cabinet', 'shelf'], maxWidthCm: 260, materials: ['walnut', 'oak', 'ash'] } },
];
