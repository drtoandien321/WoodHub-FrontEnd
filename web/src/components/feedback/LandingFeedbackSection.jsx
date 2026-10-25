import { useTranslation } from 'react-i18next';
import { useFeedbackStore } from '../../stores/feedbackStore.js';
import { useAuthStore } from '../../stores/authStore.js';
import { usePlatformFeedbackSummary, useMyPlatformFeedback, FEEDBACK_ENABLED, FEEDBACK_REWARD } from '../../hooks/usePlatformFeedback.js';
import { Stars } from './FeedbackModal.jsx';

/*
 * Khối "Bạn thấy WoodHub thế nào?" ở Landing: điểm trung bình thật (GET /feedback/summary) + nút mở modal đánh giá.
 * Chưa có lượt nào → chỉ hiện lời mời (không bịa "4.9★ từ 1.000 khách"). Khách đã đánh giá → nút đổi thành "Sửa đánh giá".
 */
export default function LandingFeedbackSection() {
  const { t } = useTranslation();
  const openFeedback = useFeedbackStore((s) => s.openFeedback);
  const isCustomer = useAuthStore((s) => s.user?.role) === 'customer';
  const summary = usePlatformFeedbackSummary();
  const mine = useMyPlatformFeedback();
  if (!FEEDBACK_ENABLED) return null;

  const s = summary.data;
  const reviewed = !!mine.data;

  return (
    <section className="mx-auto max-w-7xl px-4 pb-20 md:px-8">
      <div className="flex flex-col items-start gap-5 rounded-3xl border border-base-300 bg-base-200/60 p-6 md:flex-row md:items-center md:justify-between md:p-8">
        <div className="max-w-xl">
          <h2 className="font-display text-3xl">{t('feedback.landingTitle')}</h2>
          <p className="mt-2 text-base-content/70">
            {reviewed ? t('feedback.landingThanks') : t('feedback.landingBody', { count: FEEDBACK_REWARD })}
          </p>
          {s?.count > 0 && (
            <p className="mt-3 flex items-center gap-2 text-sm text-base-content/70">
              <Stars value={s.avgRating} />
              <span className="font-semibold">{s.avgRating.toFixed(1)}</span>
              <span>· {t('feedback.landingCount', { count: s.count })}</span>
            </p>
          )}
        </div>
        <button onClick={() => openFeedback('landing')} className="btn btn-primary shrink-0 gap-2">
          ★ {reviewed ? t('feedback.editCta') : t('feedback.landingCta')}
          {!reviewed && (isCustomer || !mine.isFetched) && <span className="badge badge-sm border-0 bg-primary-content/20 text-primary-content">+{FEEDBACK_REWARD}</span>}
        </button>
      </div>
    </section>
  );
}
