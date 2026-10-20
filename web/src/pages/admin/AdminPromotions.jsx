import PromotionManagement from '../../components/promotions/PromotionManagement.jsx';

// AdminPromotions (/admin/promotions) — mã giảm giá toàn sàn (sản phẩm/phí ship) + xem KM của các nhà cung cấp
export default function AdminPromotions() {
  return (
    <PromotionManagement
      scope="admin"
      title="Khuyến mãi"
      subtitle="Mã giảm giá toàn sàn (giảm tiền hàng hoặc phí ship). Danh sách gồm cả mã do nhà cung cấp tạo."
    />
  );
}
