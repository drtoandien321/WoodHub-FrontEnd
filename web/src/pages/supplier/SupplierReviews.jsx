import { M_REVIEWS, M_REVIEWS_SUMMARY } from '../../api/mock/manufacturerData.js';
import ReviewsView from '../../components/supplier/ReviewsView.jsx';

export default function SupplierReviews() {
  return <ReviewsView summary={M_REVIEWS_SUMMARY} reviews={M_REVIEWS} subtitle="Theo dõi và phản hồi đánh giá của khách hàng về sản phẩm và dịch vụ." />;
}
