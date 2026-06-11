/*
 * Mock data mobile — RN <Image> không render được SVG data-URI như web,
 * nên dùng "color" để vẽ khối màu placeholder thay ảnh.
 */
export const PRODUCTS = [
  { id: 'p1', name: 'Bàn ăn gỗ sồi Scandi', category: 'table', material: 'oak', price: 5900000, rating: 4.8, supplierName: 'Xưởng Mộc Tân Bình', color: '#c8a165', description: 'Bàn ăn 6 chỗ gỗ sồi tự nhiên, hoàn thiện dầu lau, chân vát kiểu Bắc Âu.' },
  { id: 'p2', name: 'Tủ quần áo óc chó 3 cánh', category: 'cabinet', material: 'walnut', price: 14500000, rating: 4.9, supplierName: 'Nội thất Gia Phát', color: '#6b4a2f', description: 'Tủ 3 cánh gỗ óc chó Bắc Mỹ, ray giảm chấn, ngăn kéo âm.' },
  { id: 'p3', name: 'Kệ sách tần bì 5 tầng', category: 'shelf', material: 'ash', price: 3200000, rating: 4.6, supplierName: 'Xưởng Mộc Tân Bình', color: '#d9c7a7', description: 'Kệ mở 5 tầng gỗ tần bì, chịu tải 30kg/tầng.' },
  { id: 'p4', name: 'Ghế ăn gỗ cao su (bộ 2)', category: 'chair', material: 'rubber', price: 1800000, rating: 4.4, supplierName: 'Mộc Việt Décor', color: '#b08968', description: 'Ghế ăn gỗ cao su ghép thanh, sơn PU mờ, đệm rời.' },
  { id: 'p5', name: 'Bàn làm việc gỗ thông', category: 'table', material: 'pine', price: 2400000, rating: 4.3, supplierName: 'Mộc Việt Décor', color: '#e0c694', description: 'Bàn làm việc 120cm gỗ thông, có lỗ đi dây.' },
  { id: 'p6', name: 'Giường ngủ sồi 1m6', category: 'bed', material: 'oak', price: 9800000, rating: 4.7, supplierName: 'Nội thất Gia Phát', color: '#a8835c', description: 'Giường 1m6 gỗ sồi, đầu giường nan cong.' },
];

export const PRODUCT_TYPES = [
  { id: 'table', name: 'Bàn', emoji: '🪵' },
  { id: 'cabinet', name: 'Tủ', emoji: '🚪' },
  { id: 'shelf', name: 'Kệ', emoji: '📚' },
  { id: 'chair', name: 'Ghế', emoji: '🪑' },
];

export const WORKSHOPS = [
  { id: 'w1', name: 'Xưởng Mộc Tân Bình', district: 'Tân Bình, TP.HCM', rating: 4.8, completedJobs: 124, leadTimeDays: 14, capability: { types: ['table', 'shelf', 'chair'], maxWidthCm: 240, materials: ['oak', 'ash', 'rubber'] } },
  { id: 'w2', name: 'Nội thất Gia Phát', district: 'Thủ Đức, TP.HCM', rating: 4.9, completedJobs: 98, leadTimeDays: 21, capability: { types: ['cabinet', 'bed', 'table'], maxWidthCm: 300, materials: ['walnut', 'oak'] } },
  { id: 'w3', name: 'Mộc Việt Décor', district: 'Bình Thạnh, TP.HCM', rating: 4.5, completedJobs: 67, leadTimeDays: 10, capability: { types: ['chair', 'table', 'shelf'], maxWidthCm: 180, materials: ['pine', 'rubber', 'ash'] } },
];

export const WOOD_MATERIALS = [
  { id: 'oak', name: 'Sồi', hexColor: '#c8a165', pricePerM3: 18000000 },
  { id: 'walnut', name: 'Óc chó', hexColor: '#5d4030', pricePerM3: 34000000 },
  { id: 'ash', name: 'Tần bì', hexColor: '#d9c7a7', pricePerM3: 15000000 },
  { id: 'pine', name: 'Thông', hexColor: '#e0c694', pricePerM3: 9000000 },
];

export const FINISH_COLORS = [
  { id: 'natural', name: 'Tự nhiên', tint: '#ffffff', priceFactor: 1.0 },
  { id: 'dark', name: 'Nâu đậm', tint: '#8a6a50', priceFactor: 1.08 },
  { id: 'white', name: 'Trắng sữa', tint: '#f2ead9', priceFactor: 1.12 },
  { id: 'black', name: 'Đen mờ', tint: '#4a4038', priceFactor: 1.15 },
];

export const formatVnd = (n) => n.toLocaleString('vi-VN') + ' ₫';
