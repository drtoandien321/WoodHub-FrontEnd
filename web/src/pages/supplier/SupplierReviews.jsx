import ReviewsView from '../../components/supplier/ReviewsView.jsx';

// Nhà cung cấp có catalog → xem được cả đánh giá cửa hàng lẫn từng sản phẩm của mình
export default function SupplierReviews() {
  return <ReviewsView withProducts subtitle="Theo dõi đánh giá của khách hàng về cửa hàng và từng sản phẩm của bạn." />;
}
