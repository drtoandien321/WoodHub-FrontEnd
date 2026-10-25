/*
 * Trạng thái đơn B2C — nhãn giống web (i18n orders.status), màu theo Badge của app.
 * Luồng chính: pending_payment → paid → confirmed → processing → shipping → delivered → completed; nhánh cancelled / refunded.
 */
export const ORDER_FLOW = ['pending_payment', 'paid', 'confirmed', 'processing', 'shipping', 'delivered', 'completed'];

export const ORDER_STATUS = {
  pending_payment: ['pending', 'Chờ thanh toán'],
  paid: ['neg', 'Đã thanh toán'],
  confirmed: ['neg', 'Đã xác nhận'],
  processing: ['neg', 'Đang chuẩn bị'],
  shipping: ['neg', 'Đang giao'],
  delivered: ['closed', 'Đã giao'],
  completed: ['closed', 'Hoàn tất'],
  cancelled: ['muted', 'Đã hủy'],
  refunded: ['rej', 'Đã hoàn tiền'],
};

export const ORDER_TABS = [
  { l: 'Tất cả', s: undefined },
  { l: 'Chờ thanh toán', s: 'pending_payment' },
  { l: 'Đã thanh toán', s: 'paid' },
  { l: 'Đang giao', s: 'shipping' },
  { l: 'Hoàn tất', s: 'completed' },
  { l: 'Đã hủy', s: 'cancelled' },
];

// Chính sách xác nhận đơn (cùng câu với web checkout.confirmNotice)
export const CONFIRM_NOTICE = 'Sau khi bạn thanh toán, nhà cung cấp sẽ xác nhận còn hàng trong vòng 24 giờ. Nếu sản phẩm hết hàng, đơn sẽ được huỷ và tiền được hoàn lại cho bạn trong vòng 48 giờ.';
