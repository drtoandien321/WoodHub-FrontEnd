import { W_REVIEWS, W_REVIEWS_SUMMARY } from '../../api/mock/workshopPortalData.js';
import ReviewsView from '../../components/supplier/ReviewsView.jsx';

export default function WorkshopReviews() {
  return <ReviewsView summary={W_REVIEWS_SUMMARY} reviews={W_REVIEWS} subtitle="Theo dõi và phản hồi đánh giá của khách hàng đã đặt thiết kế custom tại xưởng." />;
}
