import i18n from '../i18n/index.js';

/*
 * Loại sản phẩm của mẫu 3D — ĐÚNG bộ giá trị BE chấp nhận (AdminModel3dServiceImpl, admin-models3d-fe.md §1;
 * giá trị khác → 400). Dùng chung cho: bộ lọc thư viện mẫu (/custom/models?productType=), form admin Mẫu 3D,
 * và gợi ý tên model AI ở Custom Studio.
 * Trước đây FE dùng danh sách mock (table / cabinet / shelf…) không khớp BE → lọc "Bàn" trên BE thật luôn rỗng.
 */
export const PRODUCT_TYPES = [
  { id: 'dining_table', emoji: '🪵' },
  { id: 'chair', emoji: '🪑' },
  { id: 'sofa', emoji: '🛋️' },
  { id: 'bed', emoji: '🛏️' },
  { id: 'wardrobe', emoji: '🚪' },
  { id: 'bookshelf', emoji: '📚' },
  { id: 'desk', emoji: '🖥️' },
  { id: 'kitchen_cabinet', emoji: '🍳' },
  { id: 'decor', emoji: '🏺' },
];

export const productTypeLabel = (id) => (id ? i18n.t(`custom.studio.productTypes.${id}`, { defaultValue: id }) : '');
