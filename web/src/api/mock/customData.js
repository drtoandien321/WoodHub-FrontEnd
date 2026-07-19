/*
 * Vật liệu/màu dùng chung cho Custom Studio (chọn màu/chất liệu ở bước 5) — tách riêng vì cả
 * component 3D lẫn UI chọn màu đều cần dùng.
 *
 * Tên hiển thị (name/desc) KHÔNG để ở đây — UI lấy qua i18n bằng id (custom.materials.<id>)
 * để đảm bảo song ngữ vi/en mà không lặp dữ liệu.
 */

/*
 * Loại sản phẩm cho bước 2 của Custom Studio (AI 3D). `productType` ở Model3dResponse là string
 * tự do (BE chưa chốt enum cứng — xem api-guide-fe.md mục 1.2 ví dụ "decor | null"), nên đây là
 * gợi ý UI, KHÔNG phải enum BE ép buộc. Tên hiển thị qua i18n: custom.studio.productTypes.<id>
 */
export const AI_PRODUCT_TYPES = [
  { id: 'sofa', emoji: '🛋️' },
  { id: 'chair', emoji: '🪑' },
  { id: 'table', emoji: '🪵' },
  { id: 'cabinet', emoji: '🚪' },
  { id: 'shelf', emoji: '📚' },
  { id: 'bed', emoji: '🛏️' },
  { id: 'decor', emoji: '🏺' },
];

// hexColor: màu áp lên meshStandardMaterial trong 3D (MVP dùng màu phẳng; V1 thay bằng texture vân gỗ PBR)
export const WOOD_MATERIALS = [
  { id: 'oak', hexColor: '#c8a165', pricePerM3: 18_000_000 },
  { id: 'walnut', hexColor: '#5d4030', pricePerM3: 34_000_000 },
  { id: 'ash', hexColor: '#d9c7a7', pricePerM3: 15_000_000 },
  { id: 'pine', hexColor: '#e0c694', pricePerM3: 9_000_000 },
];
