import OrderManagement from '../../components/orders/OrderManagement.jsx';

/*
 * Đơn hàng của nhà cung cấp — GET/PUT /api/supplier/orders (đơn khách đặt từ catalog của mình).
 * Trước đây trang này hiển thị dữ liệu tĩnh M_ORDERS; nay dùng API thật qua OrderManagement.
 */
export default function SupplierOrders() {
  return (
    <OrderManagement
      scope="supplier"
      title="Đơn hàng"
      subtitle="Xác nhận và cập nhật tiến độ đơn khách đặt. Đơn mới chuyển sang 'Cần xác nhận' ngay khi khách thanh toán."
    />
  );
}
