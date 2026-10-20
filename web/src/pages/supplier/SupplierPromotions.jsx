import PromotionManagement from '../../components/promotions/PromotionManagement.jsx';

// SupplierPromotions (/portal/supplier/promotions) — nhà cung cấp tạo mã giảm giá cho SẢN PHẨM CỦA MÌNH
export default function SupplierPromotions() {
  return (
    <PromotionManagement
      scope="supplier"
      title="Khuyến mãi"
      subtitle="Tạo mã giảm giá cho sản phẩm của bạn. Mã chỉ áp cho đơn của cửa hàng bạn."
    />
  );
}
