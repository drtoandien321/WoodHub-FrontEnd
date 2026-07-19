/*
 * Đánh dấu 1 tin nhắn chat là "ngữ cảnh sản phẩm" bằng attachmentUrl dạng /product/:id — tái dùng
 * field sẵn có (không cần cột DB mới). ChatMessageBubble parse lại để hiện thẻ sản phẩm thay vì
 * bong bóng text thường, ở CẢ khung chat khách (supplierChatStore) lẫn hộp thư NCC (portalChatStore).
 */
const PRODUCT_LINK_PREFIX = '/product/';

export const productChatLink = (productId) => `${PRODUCT_LINK_PREFIX}${productId}`;

// Trả về productId nếu attachmentUrl là link sản phẩm, ngược lại null.
export const parseProductChatLink = (attachmentUrl) => {
  if (!attachmentUrl?.startsWith(PRODUCT_LINK_PREFIX)) return null;
  return attachmentUrl.slice(PRODUCT_LINK_PREFIX.length);
};
