import { PASTEL } from './pastel.js';

/*
 * supplierStatus — trạng thái SẢN PHẨM của portal Nhà cung cấp. Trả { label, cls } cho StatusBadge, luôn có chữ
 * (không chỉ dựa vào màu — accessibility).
 * Trạng thái ĐƠN B2C: utils/orderStatus.js · đơn custom / báo giá: utils/quoteStatus.js.
 * (Đã bỏ BRANCH_STATUS / WORKSHOP_ORDER_STATUS / WORKSHOP_STEPS của mô hình mock cũ — BE không có các trạng thái đó.)
 *
 * Khớp enum ProductStatus của BE: draft | active | hidden. Không có "hết hàng" — sàn không quản lý tồn kho, hết hàng
 * thì NCC chọn "Tạm ẩn".
 */
// label: nhãn badge · option: chữ trong ô chọn đổi trạng thái · hint: giải thích ngắn cho NCC (ProductStatusSelect)
export const PRODUCT_STATUS = {
  active: { label: 'Đang bán', cls: PASTEL.success, option: 'Đang bán', hint: 'Hiện trên cửa hàng, khách đặt mua được.' },
  hidden: { label: 'Tạm ẩn', cls: PASTEL.warning, option: 'Tạm ẩn (hết hàng / ngừng bán)', hint: 'Không hiện trên cửa hàng, khách không đặt mua được. Dùng khi hết hàng hoặc ngừng bán.' },
  draft: { label: 'Nháp', cls: PASTEL.neutral, option: 'Nháp', hint: 'Chưa đăng bán, chỉ bạn thấy.' },
};
