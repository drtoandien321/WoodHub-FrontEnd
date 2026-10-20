import OrderManagement from '../../components/orders/OrderManagement.jsx';

/*
 * AdminOrders (/admin/orders) — xem & cập nhật trạng thái MỌI đơn B2C (GET/PUT /api/admin/orders).
 * Dùng chung OrderManagement với portal nhà cung cấp, chỉ khác scope (admin thấy thêm tên NCC).
 */
export default function AdminOrders() {
  return (
    <OrderManagement
      scope="admin"
      title="Đơn hàng"
      subtitle="Toàn bộ đơn B2C trên sàn. Có thể can thiệp trạng thái khi nhà cung cấp chậm xử lý hoặc cần hoàn tiền."
    />
  );
}
