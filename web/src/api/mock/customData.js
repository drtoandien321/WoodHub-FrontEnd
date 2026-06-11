/*
 * Cấu hình cho Custom Configurator — tách riêng vì cả configuratorStore (logic giá)
 * lẫn component 3D (màu/texture) đều cần dùng.
 */
export const PRODUCT_TYPES = [
  { id: 'table', name: 'Bàn', emoji: '🪵', desc: 'Bàn ăn, bàn làm việc, bàn trà' },
  { id: 'cabinet', name: 'Tủ', emoji: '🚪', desc: 'Tủ quần áo, tủ bếp, tủ trưng bày' },
  { id: 'shelf', name: 'Kệ', emoji: '📚', desc: 'Kệ sách, kệ trang trí, kệ treo tường' },
  { id: 'chair', name: 'Ghế', emoji: '🪑', desc: 'Ghế ăn, ghế làm việc, băng ghế' },
];

// Giới hạn kích thước theo loại — BE cũng phải validate đúng các giới hạn này
export const PRODUCT_TYPE_DEFAULTS = {
  table:   { dimensions: { width: 140, height: 75, depth: 70 },  limits: { width: [60, 240], height: [40, 110], depth: [40, 120] } },
  cabinet: { dimensions: { width: 120, height: 200, depth: 55 }, limits: { width: [60, 300], height: [80, 260], depth: [35, 70] } },
  shelf:   { dimensions: { width: 80, height: 180, depth: 30 },  limits: { width: [40, 200], height: [60, 240], depth: [20, 45] } },
  chair:   { dimensions: { width: 45, height: 90, depth: 50 },   limits: { width: [35, 70], height: [70, 110], depth: [40, 60] } },
};

// hexColor: màu áp lên meshStandardMaterial trong 3D (MVP dùng màu phẳng; V1 thay bằng texture vân gỗ PBR)
export const WOOD_MATERIALS = [
  { id: 'oak',    name: 'Sồi (Oak)',       hexColor: '#c8a165', pricePerM3: 18_000_000 },
  { id: 'walnut', name: 'Óc chó (Walnut)', hexColor: '#5d4030', pricePerM3: 34_000_000 },
  { id: 'ash',    name: 'Tần bì (Ash)',    hexColor: '#d9c7a7', pricePerM3: 15_000_000 },
  { id: 'pine',   name: 'Thông (Pine)',    hexColor: '#e0c694', pricePerM3: 9_000_000 },
];

// tint: nhân màu (multiply) lên màu gỗ để giả lập lớp hoàn thiện
export const FINISH_COLORS = [
  { id: 'natural', name: 'Tự nhiên (dầu lau)', tint: '#ffffff', priceFactor: 1.0 },
  { id: 'dark',    name: 'Nâu đậm',            tint: '#8a6a50', priceFactor: 1.08 },
  { id: 'white',   name: 'Trắng sữa',          tint: '#f2ead9', priceFactor: 1.12 },
  { id: 'black',   name: 'Đen mờ',             tint: '#4a4038', priceFactor: 1.15 },
];
