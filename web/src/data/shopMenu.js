/*
 * shopMenu.js — Cây danh mục cho MEGA MENU "Cửa hàng" (multi-level dropdown).
 *
 * Đây là TAXONOMY điều hướng (marketing), KHÁC với catalog sản phẩm phẳng lấy
 * động từ products (xem Shop.jsx). Vì vậy để static + song ngữ {vi,en}. Khi có
 * BE, thay mảng này bằng dữ liệu category thật (giữ nguyên shape: id/label/children/
 * products/to là FE không phải sửa component).
 *
 * Cấu trúc 1 node:
 *   { id, label:{vi,en}, icon?, to?, children?: node[], products?: preview[] }
 *   - children: hiển thị ở cột kế tiếp (tối đa 3 cấp: phòng → khu vực → loại).
 *   - products: danh sách SP cụ thể hiện ở CỘT 4 (ảnh + tên + "Xem chi tiết").
 *   - to: link điều hướng khi click (mặc định về /shop — vì shop đang mock-first).
 *   - icon: chỉ dùng ở cấp 1 (key map sang SVG trong ShopMegaMenu.jsx).
 *
 * Lưu ý: phần lớn link tạm trỏ /shop để luôn chạy được; sau này map sang
 * /shop/:category hoặc /product/:id theo dữ liệu BE.
 */

// Tạo nhanh vài SP preview cho cột 4 (ảnh placeholder picsum theo seed — giống
// thumbnailUrl đang dùng trong mock data).
const preview = (id, vi, en, seed) => ({
  id,
  label: { vi, en },
  image: `https://picsum.photos/seed/woodhub-${seed}/160/120`,
  to: '/shop',
});

export const SHOP_MENU = [
  {
    id: 'furniture',
    label: { vi: 'Sản phẩm nội thất', en: 'Furniture' },
    icon: 'furniture',
    children: [
      { id: 'f-table', label: { vi: 'Bàn', en: 'Tables' }, to: '/shop' },
      { id: 'f-chair', label: { vi: 'Ghế', en: 'Chairs' }, to: '/shop' },
      { id: 'f-cabinet', label: { vi: 'Tủ', en: 'Cabinets' }, to: '/shop' },
      { id: 'f-shelf', label: { vi: 'Kệ', en: 'Shelves' }, to: '/shop' },
      { id: 'f-bed', label: { vi: 'Giường', en: 'Beds' }, to: '/shop' },
    ],
  },
  {
    id: 'materials',
    label: { vi: 'Vật liệu & Phụ kiện', en: 'Materials & hardware' },
    icon: 'materials',
    children: [
      { id: 'm-oak', label: { vi: 'Gỗ sồi', en: 'Oak' }, to: '/shop' },
      { id: 'm-walnut', label: { vi: 'Gỗ óc chó', en: 'Walnut' }, to: '/shop' },
      { id: 'm-ash', label: { vi: 'Gỗ tần bì', en: 'Ash' }, to: '/shop' },
      { id: 'm-hardware', label: { vi: 'Ray trượt & bản lề', en: 'Slides & hinges' }, to: '/shop' },
      { id: 'm-handle', label: { vi: 'Tay nắm & núm', en: 'Handles & knobs' }, to: '/shop' },
    ],
  },
  {
    id: 'decor',
    label: { vi: 'Trang trí & Đồ decor', en: 'Decor' },
    icon: 'decor',
    children: [
      { id: 'd-mirror', label: { vi: 'Gương trang trí', en: 'Decorative mirrors' }, to: '/shop' },
      { id: 'd-vase', label: { vi: 'Bình & lọ gốm', en: 'Vases & ceramics' }, to: '/shop' },
      { id: 'd-frame', label: { vi: 'Khung tranh', en: 'Picture frames' }, to: '/shop' },
      { id: 'd-rug', label: { vi: 'Thảm trải sàn', en: 'Rugs' }, to: '/shop' },
    ],
  },
  {
    id: 'lighting',
    label: { vi: 'Đèn & Chiếu sáng', en: 'Lighting' },
    icon: 'lighting',
    children: [
      { id: 'l-ceiling', label: { vi: 'Đèn trần', en: 'Ceiling lights' }, to: '/shop' },
      { id: 'l-floor', label: { vi: 'Đèn cây', en: 'Floor lamps' }, to: '/shop' },
      { id: 'l-table', label: { vi: 'Đèn bàn', en: 'Table lamps' }, to: '/shop' },
      { id: 'l-wall', label: { vi: 'Đèn tường', en: 'Wall sconces' }, to: '/shop' },
    ],
  },
  {
    id: 'deals',
    label: { vi: 'Ưu đãi & Bộ sưu tập', en: 'Deals & collections' },
    icon: 'deals',
    children: [
      { id: 'deal-new', label: { vi: 'Hàng mới về', en: 'New arrivals' }, to: '/shop' },
      { id: 'deal-best', label: { vi: 'Bán chạy', en: 'Best sellers' }, to: '/shop' },
      { id: 'deal-sale', label: { vi: 'Đang giảm giá', en: 'On sale' }, to: '/shop' },
      { id: 'deal-collection', label: { vi: 'Bộ sưu tập gỗ óc chó', en: 'Walnut collection' }, to: '/shop' },
    ],
  },
];
