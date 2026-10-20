import ReviewsView from '../../components/supplier/ReviewsView.jsx';

// Xưởng mộc không có catalog cố định → chỉ có đánh giá cho xưởng (targetType=supplier)
export default function WorkshopReviews() {
  return <ReviewsView subtitle="Theo dõi đánh giá của khách hàng đã đặt thiết kế custom tại xưởng." />;
}
