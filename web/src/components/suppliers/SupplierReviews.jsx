import { useTranslation } from 'react-i18next';
import SectionCard from './SectionCard.jsx';
import LogoBadge from './LogoBadge.jsx';
import Stars from './Stars.jsx';
import { formatDate } from '../../utils/format.js';
import { MessageCircle, ChevronRight } from './icons.jsx';

/*
 * Section "Đánh giá khách hàng" — items từ ReviewResponse[] (GET /reviews?targetType=supplier),
 * KHÔNG còn lấy từ supplier.reviews (field không tồn tại ở SupplierPublicResponse). Ẩn cả
 * section nếu chưa có đánh giá nào (thực tế MVP: DB mới, hầu hết supplier sẽ rỗng).
 */
export default function SupplierReviews({ items = [], onViewAll }) {
  const { t } = useTranslation();
  if (!items.length) return null;

  const viewAll = (
    <button onClick={onViewAll} className="btn btn-ghost btn-sm gap-1 text-primary">
      {t('suppliers.viewAllReviews')} <ChevronRight width={15} height={15} />
    </button>
  );

  return (
    <SectionCard icon={MessageCircle} title={t('suppliers.sectionReviews')} action={viewAll}>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        {items.map((r) => (
          <article key={r.id} className="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-200/40 p-4">
            <header className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <LogoBadge name={r.userName} className="h-9 w-9 rounded-full text-xs" />
                <span className="text-sm font-medium">{r.userName}</span>
              </div>
              <time className="text-xs text-base-content/50">{formatDate(r.createdAt)}</time>
            </header>
            <Stars value={r.rating} size={14} />
            <p className="text-sm leading-relaxed text-base-content/75">{r.comment}</p>
          </article>
        ))}
      </div>
    </SectionCard>
  );
}
