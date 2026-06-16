/*
 * Cấu hình cho Custom Configurator — tách riêng vì cả configuratorStore (logic giá)
 * lẫn component 3D (màu/texture) đều cần dùng.
 *
 * Tên hiển thị (name/desc) KHÔNG để ở đây — UI lấy qua i18n bằng id
 * (custom.types.<id>.name, custom.materials.<id>, custom.finishes.<id>)
 * để đảm bảo song ngữ vi/en mà không lặp dữ liệu.
 */
export const PRODUCT_TYPES = [
  { id: 'table', emoji: '🪵' },
  { id: 'cabinet', emoji: '🚪' },
  { id: 'shelf', emoji: '📚' },
  { id: 'chair', emoji: '🪑' },
];

// Giới hạn kích thước theo loại — BE cũng phải validate đúng các giới hạn này
export const PRODUCT_TYPE_DEFAULTS = {
  table:   { dimensions: { width: 140, height: 75, depth: 70 },  limits: { width: [60, 240], height: [40, 110], depth: [40, 120] } },
  cabinet: { dimensions: { width: 120, height: 200, depth: 55 }, limits: { width: [60, 300], height: [80, 260], depth: [35, 70] } },
  shelf:   { dimensions: { width: 80, height: 180, depth: 30 },  limits: { width: [40, 200], height: [60, 240], depth: [20, 45] } },
  chair:   { dimensions: { width: 45, height: 90, depth: 50 },   limits: { width: [35, 70], height: [70, 110], depth: [40, 60] } },
};

// Số ngày gia công cơ bản theo loại — estimateDays() cộng thêm theo thể tích (xem configuratorStore.js)
export const PRODUCT_TYPE_BASE_DAYS = {
  table: 7,
  cabinet: 12,
  shelf: 5,
  chair: 6,
};

// hexColor: màu áp lên meshStandardMaterial trong 3D (MVP dùng màu phẳng; V1 thay bằng texture vân gỗ PBR)
export const WOOD_MATERIALS = [
  { id: 'oak', hexColor: '#c8a165', pricePerM3: 18_000_000 },
  { id: 'walnut', hexColor: '#5d4030', pricePerM3: 34_000_000 },
  { id: 'ash', hexColor: '#d9c7a7', pricePerM3: 15_000_000 },
  { id: 'pine', hexColor: '#e0c694', pricePerM3: 9_000_000 },
];

// tint: nhân màu (multiply) lên màu gỗ để giả lập lớp hoàn thiện
export const FINISH_COLORS = [
  { id: 'natural', tint: '#ffffff', priceFactor: 1.0 },
  { id: 'dark', tint: '#8a6a50', priceFactor: 1.08 },
  { id: 'white', tint: '#f2ead9', priceFactor: 1.12 },
  { id: 'black', tint: '#4a4038', priceFactor: 1.15 },
];
