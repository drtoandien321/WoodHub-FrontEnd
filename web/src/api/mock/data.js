/*
 * Mock data — mô phỏng đúng response shape mà BE sẽ trả (xem docs/API_CONTRACT.md).
 * Ảnh dùng gradient SVG inline để không phụ thuộc mạng/CDN khi demo offline.
 */
const woodSvg = (c1, c2, label) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="450"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs><rect width="600" height="450" fill="url(#g)"/><text x="50%" y="52%" font-family="Georgia" font-size="34" fill="rgba(255,255,255,0.85)" text-anchor="middle">${label}</text></svg>`
  )}`;

export const PRODUCTS = [
  { id: 'p1', name: 'Bàn ăn gỗ sồi Scandi', category: 'table', material: 'oak', price: 5_900_000, stock: 12, rating: 4.8, supplierId: 's1', supplierName: 'Xưởng Mộc Tân Bình', hasModel3d: true, image: woodSvg('#c8a165', '#8a6a45', 'Bàn ăn Scandi'), description: 'Bàn ăn 6 chỗ gỗ sồi tự nhiên, hoàn thiện dầu lau, chân vát kiểu Bắc Âu.' },
  { id: 'p2', name: 'Tủ quần áo óc chó 3 cánh', category: 'cabinet', material: 'walnut', price: 14_500_000, stock: 4, rating: 4.9, supplierId: 's2', supplierName: 'Nội thất Gia Phát', hasModel3d: true, image: woodSvg('#6b4a2f', '#3f2c1c', 'Tủ óc chó'), description: 'Tủ 3 cánh gỗ óc chó Bắc Mỹ, ray giảm chấn, ngăn kéo âm.' },
  { id: 'p3', name: 'Kệ sách tần bì 5 tầng', category: 'shelf', material: 'ash', price: 3_200_000, stock: 20, rating: 4.6, supplierId: 's1', supplierName: 'Xưởng Mộc Tân Bình', hasModel3d: false, image: woodSvg('#d9c7a7', '#a8906c', 'Kệ tần bì'), description: 'Kệ mở 5 tầng gỗ tần bì, chịu tải 30kg/tầng.' },
  { id: 'p4', name: 'Ghế ăn gỗ cao su (bộ 2)', category: 'chair', material: 'rubber', price: 1_800_000, stock: 35, rating: 4.4, supplierId: 's3', supplierName: 'Mộc Việt Décor', hasModel3d: false, image: woodSvg('#b08968', '#7a5c44', 'Ghế gỗ cao su'), description: 'Ghế ăn gỗ cao su ghép thanh, sơn PU mờ, đệm rời.' },
  { id: 'p5', name: 'Bàn làm việc gỗ thông', category: 'table', material: 'pine', price: 2_400_000, stock: 18, rating: 4.3, supplierId: 's3', supplierName: 'Mộc Việt Décor', hasModel3d: true, image: woodSvg('#e0c694', '#b89a64', 'Bàn làm việc'), description: 'Bàn làm việc 120cm gỗ thông, có lỗ đi dây.' },
  { id: 'p6', name: 'Giường ngủ sồi 1m6', category: 'bed', material: 'oak', price: 9_800_000, stock: 7, rating: 4.7, supplierId: 's2', supplierName: 'Nội thất Gia Phát', hasModel3d: false, image: woodSvg('#c8a165', '#6b4a2f', 'Giường sồi'), description: 'Giường 1m6 gỗ sồi, đầu giường nan cong, dát phản chắc chắn.' },
];

export const CATEGORIES = [
  { id: 'table', name: 'Bàn' },
  { id: 'chair', name: 'Ghế' },
  { id: 'cabinet', name: 'Tủ' },
  { id: 'shelf', name: 'Kệ' },
  { id: 'bed', name: 'Giường' },
];

/*
 * Workshops kèm "capability" — dữ liệu phục vụ matching RULE-BASED:
 * lọc theo loại sản phẩm làm được + kích thước tối đa + khu vực. KHÔNG dùng AI (scope MVP).
 */
export const WORKSHOPS = [
  { id: 'w1', name: 'Xưởng Mộc Tân Bình', district: 'Tân Bình, TP.HCM', rating: 4.8, completedJobs: 124, leadTimeDays: 14, capability: { types: ['table', 'shelf', 'chair'], maxWidthCm: 240, materials: ['oak', 'ash', 'rubber'] } },
  { id: 'w2', name: 'Nội thất Gia Phát', district: 'Thủ Đức, TP.HCM', rating: 4.9, completedJobs: 98, leadTimeDays: 21, capability: { types: ['cabinet', 'bed', 'table'], maxWidthCm: 300, materials: ['walnut', 'oak'] } },
  { id: 'w3', name: 'Mộc Việt Décor', district: 'Bình Thạnh, TP.HCM', rating: 4.5, completedJobs: 67, leadTimeDays: 10, capability: { types: ['chair', 'table', 'shelf'], maxWidthCm: 180, materials: ['pine', 'rubber', 'ash'] } },
  { id: 'w4', name: 'Tinh Mộc Studio', district: 'Quận 7, TP.HCM', rating: 4.7, completedJobs: 45, leadTimeDays: 18, capability: { types: ['cabinet', 'shelf'], maxWidthCm: 260, materials: ['walnut', 'oak', 'ash'] } },
];
