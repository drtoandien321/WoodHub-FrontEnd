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
export const CATEGORY_NAMES = {
  cat_dining: { vi: 'Bàn ăn', en: 'Dining Tables' },
  cat_storage: { vi: 'Kệ & Tủ', en: 'Storage & Cabinets' },
  cat_chair: { vi: 'Ghế', en: 'Chairs' },
  cat_desk: { vi: 'Bàn làm việc', en: 'Desks' },
  cat_bed: { vi: 'Giường', en: 'Beds' },
  cat_table: { vi: 'Bàn trà', en: 'Coffee Tables' },
};

export const MATERIAL_NAMES = {
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
// Encode đường dẫn ảnh (có dấu tiếng Việt + khoảng trắng) một chỗ để <img src> luôn hợp lệ
const img = (p) => encodeURI(p);

/*
 * WORKSHOPS — dữ liệu xưởng/nhà cung cấp.
 * - Nhóm field GỐC (rating, completedJobs, leadTimeDays, capability) GIỮ NGUYÊN: matchWorkshops()
 *   và WorkshopMatch page phụ thuộc vào chúng → không đổi để tránh ảnh hưởng trang khác.
 * - Nhóm field MỚI (slug, verified, profile...) chỉ phục vụ trang /suppliers và /suppliers/:slug.
 *   Tất cả là mock — khi có API thật chỉ cần trả về cùng shape này.
 */
export const WORKSHOPS = [
  {
    id: 'w1', slug: 'tan-binh', name: 'Xưởng Mộc Tân Bình', district: 'Tân Bình, TP.HCM',
    rating: 4.8, completedJobs: 124, leadTimeDays: 14,
    capability: { types: ['table', 'shelf', 'chair'], maxWidthCm: 240, materials: ['oak', 'ash', 'rubber'] },
    verified: true, topRated: false,
    reviewCount: 152, ordersDisplay: '320+', leadTimeLabel: '7–10 ngày', responseTime: '1.3h',
    experience: '8 năm', priceFrom: 6_500_000, referencePrice: 2_500_000,
    specialties: ['Bàn ghế', 'Tủ kệ', 'Giường'],
    materialsDisplay: ['Gỗ sồi', 'Gỗ tần bì', 'Gỗ óc chó'],
    description: 'Chuyên thi công nội thất gỗ tự nhiên, bàn ghế, tủ kệ và thiết kế theo yêu cầu.',
    about: 'Xưởng Mộc Tân Bình là đơn vị chuyên thiết kế và thi công nội thất gỗ tự nhiên theo yêu cầu tại TP.HCM. Với đội ngũ thợ lành nghề, máy móc hiện đại và quy trình làm việc chuyên nghiệp, xưởng cam kết mang đến sản phẩm bền đẹp, tinh tế và đúng tiến độ cho mọi không gian.',
    cover: img('/mockdataimage/Bàn ăn gỗ sồi 6 ghế.jpg'),
    capacity: '30–40 đơn / tháng',
    serviceArea: 'TP.HCM và các tỉnh lân cận',
    supportedProducts: 'Bàn, ghế, tủ, kệ, giường, vách, quầy, decor...',
    supportedWood: ['Gỗ sồi', 'Gỗ óc chó', 'Gỗ tần bì', 'Gỗ cao su'],
    workType: 'Theo yêu cầu', installation: 'Có hỗ trợ',
    contact: { phone: '0901 234 567', email: 'info@tanbinhwood.vn', address: 'Tân Bình, TP.HCM' },
    portfolio: [
      img('/mockdataimage/Bàn ăn gỗ sồi 6 ghế.jpg'),
      img('/mockdataimage/Kệ tivi gỗ óc chó 1m8.jpg'),
      img('/mockdataimage/Kệ sách gỗ óc chó 5 tầng.jpg'),
      img('/mockdataimage/Giường ngủ gỗ sồi 1m6.jpg'),
      img('/image/bep1.png'),
      img('/mockdataimage/Bàn làm việc gỗ thông chân chữ A.jpg'),
    ],
    reviews: [
      { name: 'Anh Minh Tuấn', date: '12/05/2024', rating: 5, text: 'Sản phẩm đẹp, đúng thiết kế và chất lượng gỗ rất tốt. Xưởng làm việc chuyên nghiệp, giao hàng đúng hẹn.' },
      { name: 'Chị Thu Hằng', date: '28/04/2024', rating: 5, text: 'Tủ kệ hoàn thiện rất tinh tế, đường nét sắc sảo. Rất hài lòng với dịch vụ và thái độ làm việc.' },
      { name: 'Anh Quốc Bảo', date: '15/04/2024', rating: 5, text: 'Bàn ăn gỗ óc chó đẹp và chắc chắn. Sẽ tiếp tục ủng hộ những dự án sau.' },
    ],
  },
  {
    id: 'w2', slug: 'gia-phat', name: 'Nội thất Gia Phát', district: 'Bình Thạnh, TP.HCM',
    rating: 4.9, completedJobs: 98, leadTimeDays: 21,
    capability: { types: ['cabinet', 'bed', 'table'], maxWidthCm: 300, materials: ['walnut', 'oak'] },
    verified: true, topRated: true,
    reviewCount: 241, ordersDisplay: '560+', leadTimeLabel: '5–8 ngày', responseTime: '1.8h',
    experience: '10 năm', priceFrom: 8_900_000, referencePrice: 3_000_000,
    specialties: ['Bàn ghế', 'Tủ bếp', 'Tủ quần áo'],
    materialsDisplay: ['Gỗ sồi', 'Gỗ óc chó'],
    description: 'Chuyên nội thất phòng khách, phòng ngủ và tủ bếp gỗ tự nhiên cao cấp.',
    about: 'Nội thất Gia Phát là thương hiệu nội thất gỗ tự nhiên cao cấp với hơn một thập kỷ kinh nghiệm. Đội ngũ thiết kế và sản xuất khép kín giúp kiểm soát chất lượng từ bản vẽ đến thành phẩm, mang lại không gian sống tinh tế và bền vững.',
    cover: img('/mockdataimage/Tủ quần áo 3 cánh gỗ MDF phủ melamine.jpg'),
    capacity: '40–60 đơn / tháng',
    serviceArea: 'TP.HCM và toàn miền Nam',
    supportedProducts: 'Bàn, ghế, tủ bếp, tủ quần áo, giường, kệ trang trí...',
    supportedWood: ['Gỗ sồi', 'Gỗ óc chó', 'Gỗ tần bì'],
    workType: 'Theo yêu cầu', installation: 'Có hỗ trợ',
    contact: { phone: '0902 345 678', email: 'info@giaphatfurniture.vn', address: 'Bình Thạnh, TP.HCM' },
    portfolio: [
      img('/mockdataimage/Tủ quần áo 3 cánh gỗ MDF phủ melamine.jpg'),
      img('/mockdataimage/Giường ngủ gỗ sồi 1m6.jpg'),
      img('/image/bep1.png'),
      img('/mockdataimage/Bàn trà gỗ tràm mặt kính.jpg'),
      img('/mockdataimage/Tủ giày gỗ MDF 4 ngăn.jpg'),
      img('/mockdataimage/Bàn ăn gỗ sồi 6 ghế.jpg'),
    ],
    reviews: [
      { name: 'Chị Lan Anh', date: '02/05/2024', rating: 5, text: 'Tủ bếp đẹp, gỗ chắc, hoàn thiện kỹ. Tư vấn nhiệt tình từ đầu đến cuối.' },
      { name: 'Anh Hoàng Nam', date: '21/04/2024', rating: 5, text: 'Giường gỗ sồi rất chắc chắn, đúng kích thước đặt. Lắp đặt nhanh gọn.' },
      { name: 'Chị Mỹ Duyên', date: '09/04/2024', rating: 4, text: 'Sản phẩm chất lượng, giao hơi trễ một chút nhưng xưởng chủ động báo trước.' },
    ],
  },
  {
    id: 'w3', slug: 'moc-viet', name: 'Mộc Việt Décor', district: 'Thủ Đức, TP.HCM',
    rating: 4.5, completedJobs: 67, leadTimeDays: 10,
    capability: { types: ['chair', 'table', 'shelf'], maxWidthCm: 180, materials: ['pine', 'rubber', 'ash'] },
    verified: true, topRated: false,
    reviewCount: 98, ordersDisplay: '210+', leadTimeLabel: '6–9 ngày', responseTime: '2.1h',
    experience: '6 năm', priceFrom: 7_200_000, referencePrice: 2_800_000,
    specialties: ['Nội thất gỗ tự nhiên', 'Decor'],
    materialsDisplay: ['Gỗ óc chó', 'Gỗ sồi', 'Gỗ xoan đào'],
    description: 'Chuyên đồ décor và nội thất gỗ tự nhiên phong cách hiện đại, tối giản.',
    about: 'Mộc Việt Décor mang đến giải pháp nội thất và trang trí gỗ tự nhiên theo phong cách hiện đại, tối giản. Xưởng chú trọng từng chi tiết hoàn thiện để tạo nên những món đồ vừa thẩm mỹ vừa thực dụng cho không gian sống.',
    cover: img('/mockdataimage/Kệ tivi gỗ óc chó 1m8.jpg'),
    capacity: '25–35 đơn / tháng',
    serviceArea: 'TP.HCM và các tỉnh lân cận',
    supportedProducts: 'Bàn, ghế, kệ, đồ décor, vách trang trí...',
    supportedWood: ['Gỗ óc chó', 'Gỗ sồi', 'Gỗ tần bì', 'Gỗ xoan đào'],
    workType: 'Theo yêu cầu', installation: 'Có hỗ trợ',
    contact: { phone: '0903 456 789', email: 'hello@mocvietdecor.vn', address: 'Thủ Đức, TP.HCM' },
    portfolio: [
      img('/mockdataimage/Kệ tivi gỗ óc chó 1m8.jpg'),
      img('/mockdataimage/Bàn console gỗ cao su.jpg'),
      img('/mockdataimage/Kệ sách gỗ óc chó 5 tầng.jpg'),
      img('/mockdataimage/Ghế ăn gỗ cao su.jpg'),
      img('/mockdataimage/Bàn trà gỗ tràm mặt kính.jpg'),
      img('/image/lamviec1.png'),
    ],
    reviews: [
      { name: 'Anh Tiến Đạt', date: '30/04/2024', rating: 5, text: 'Kệ tivi đẹp đúng gu hiện đại, màu gỗ rất sang. Rất ưng ý.' },
      { name: 'Chị Phương Thảo', date: '18/04/2024', rating: 4, text: 'Đồ décor tinh tế, hoàn thiện tốt. Giao hàng đúng hẹn.' },
      { name: 'Anh Gia Huy', date: '05/04/2024', rating: 5, text: 'Bàn console nhỏ gọn, chắc chắn, hợp không gian phòng khách.' },
    ],
  },
  {
    id: 'w4', slug: 'tinh-moc', name: 'Tinh Mộc Studio', district: 'Quận 7, TP.HCM',
    rating: 4.7, completedJobs: 45, leadTimeDays: 18,
    capability: { types: ['cabinet', 'shelf'], maxWidthCm: 260, materials: ['walnut', 'oak', 'ash'] },
    verified: true, topRated: false,
    reviewCount: 67, ordersDisplay: '180+', leadTimeLabel: '7–12 ngày', responseTime: '1.6h',
    experience: '7 năm', priceFrom: 6_900_000, referencePrice: 2_600_000,
    specialties: ['Bàn ăn', 'Kệ tivi', 'Giường'],
    materialsDisplay: ['Gỗ sồi', 'Gỗ tần bì'],
    description: 'Studio nội thất gỗ thủ công, tập trung vào chi tiết và độ hoàn thiện cao.',
    about: 'Tinh Mộc Studio là xưởng nội thất gỗ thủ công đề cao sự tỉ mỉ và độ hoàn thiện. Mỗi sản phẩm được chăm chút trong từng đường nét, phù hợp với khách hàng yêu thích vẻ đẹp mộc mạc nhưng tinh tế.',
    cover: img('/mockdataimage/Giường ngủ gỗ sồi 1m6.jpg'),
    capacity: '20–30 đơn / tháng',
    serviceArea: 'TP.HCM',
    supportedProducts: 'Bàn ăn, kệ tivi, tủ, giường, kệ sách...',
    supportedWood: ['Gỗ sồi', 'Gỗ tần bì', 'Gỗ óc chó'],
    workType: 'Theo yêu cầu', installation: 'Có hỗ trợ',
    contact: { phone: '0904 567 890', email: 'info@tinhmocstudio.vn', address: 'Quận 7, TP.HCM' },
    portfolio: [
      img('/mockdataimage/Giường ngủ gỗ sồi 1m6.jpg'),
      img('/mockdataimage/Bàn ăn gỗ sồi 6 ghế.jpg'),
      img('/mockdataimage/Kệ sách gỗ óc chó 5 tầng.jpg'),
      img('/mockdataimage/Tủ giày gỗ MDF 4 ngăn.jpg'),
      img('/mockdataimage/Bàn làm việc gỗ thông chân chữ A.jpg'),
      img('/mockdataimage/Kệ tivi gỗ óc chó 1m8.jpg'),
    ],
    reviews: [
      { name: 'Chị Khánh Vy', date: '27/04/2024', rating: 5, text: 'Bàn ăn hoàn thiện rất kỹ, cảm giác chắc tay. Đáng đồng tiền.' },
      { name: 'Anh Đức Long', date: '14/04/2024', rating: 4, text: 'Kệ tivi đẹp, đóng gói cẩn thận. Sẽ giới thiệu bạn bè.' },
      { name: 'Chị Bảo Trân', date: '03/04/2024', rating: 5, text: 'Giường gỗ sồi chắc chắn, mùi gỗ tự nhiên dễ chịu.' },
    ],
  },
];
