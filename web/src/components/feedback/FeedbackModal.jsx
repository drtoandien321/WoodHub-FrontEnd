import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ModalShell from '../admin/ModalShell.jsx';
import { Star } from '../suppliers/icons.jsx';
import { useAuthStore } from '../../stores/authStore.js';
import { useFeedbackStore } from '../../stores/feedbackStore.js';
import { useMyPlatformFeedback, useSubmitPlatformFeedback, FEEDBACK_ENABLED, FEEDBACK_REWARD, FEEDBACK_MIN_COMMENT, FEEDBACK_MAX_COMMENT, commentLength } from '../../hooks/usePlatformFeedback.js';
import { apiErrorMessage } from '../../utils/apiError.js';

/*
 * Modal "Bạn chấm WoodHub mấy sao?" — gắn 1 lần ở App.jsx, mở qua useFeedbackStore (popup sau đặt hàng, footer, landing).
 * - Chưa đăng nhập → mời đăng nhập (quay lại đúng trang sau khi đăng nhập).
 * - Đã đánh giá → điền sẵn để sửa; KHÔNG nhắc thưởng nữa (BE chỉ tặng 1 lần / tài khoản).
 * - Gửi xong → màn cảm ơn; BE trả rewardGranted = true thì báo đã cộng 5 lượt thiết kế (FE không tự cộng).
 */
export default function FeedbackModal() {
  const { t } = useTranslation();
  const location = useLocation();
  const { open, context, close } = useFeedbackStore();
  const user = useAuthStore((s) => s.user);
  const mine = useMyPlatformFeedback();
  const submit = useSubmitPlatformFeedback();

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [result, setResult] = useState(null);

  // Mỗi lần MỞ: xoá kết quả lần trước. Tách riêng khỏi bước điền sẵn — gửi xong query refetch (id mới) mà reset ở đây thì
  // màn "Cảm ơn + đã tặng lượt" bị xoá ngay, khách không kịp thấy.
  useEffect(() => {
    if (!open) return;
    setResult(null);
    submit.reset();
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Điền sẵn đánh giá cũ (nếu có) — chỉ khi đang ở form, không đụng màn cảm ơn
  useEffect(() => {
    if (!open || result) return;
    setRating(mine.data?.rating ?? 0);
    setComment(mine.data?.comment ?? '');
  }, [open, mine.data?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!FEEDBACK_ENABLED || !open) return null;

  const existing = mine.data;
  const isCustomer = user?.role === 'customer';
  const canReward = isCustomer && !existing?.rewardCredits;
  const length = commentLength(comment);
  const tooShort = length < FEEDBACK_MIN_COMMENT;

  const send = () => {
    if (!rating || tooShort) return;
    submit.mutate({ context, rating, comment: comment.trim() }, { onSuccess: setResult });
  };

  if (!user) {
    return (
      <ModalShell open onClose={close} title={t('feedback.title')}
        footer={<Link to="/login" state={{ from: location }} onClick={close} className="btn btn-primary">{t('feedback.loginCta')}</Link>}>
        <p className="text-base-content/75">{t('feedback.loginHint', { count: FEEDBACK_REWARD })}</p>
      </ModalShell>
    );
  }

  if (result) {
    return (
      <ModalShell open onClose={close} title={t('feedback.thanksTitle')} footer={<button onClick={close} className="btn btn-primary">{t('feedback.close')}</button>}>
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <Stars value={result.feedback.rating} size={28} />
          <p className="text-base-content/75">{t('feedback.thanksBody')}</p>
          {result.rewardGranted && (
            <div className="w-full rounded-2xl bg-success/10 p-4 text-success">
              <p className="font-semibold">{t('feedback.rewardGranted', { count: result.rewardCredits })}</p>
              <p className="mt-1 text-sm text-base-content/70">{t('feedback.rewardBalance', { count: result.designCreditBalance })}</p>
              <Link to="/custom/studio" onClick={close} className="btn btn-success btn-sm mt-3">{t('feedback.tryDesign')}</Link>
            </div>
          )}
        </div>
      </ModalShell>
    );
  }

  return (
    <ModalShell
      open
      onClose={close}
      title={t(existing ? 'feedback.editTitle' : 'feedback.title')}
      footer={(
        <>
          <button onClick={close} className="btn btn-ghost">{t(context === 'after_order' ? 'feedback.later' : 'feedback.cancel')}</button>
          <button onClick={send} disabled={!rating || tooShort || submit.isPending} className="btn btn-primary">
            {submit.isPending ? <span className="loading loading-spinner loading-sm" /> : t('feedback.submit')}
          </button>
        </>
      )}
    >
      <div className="flex flex-col gap-4">
        {context === 'after_order' && <p className="text-sm text-success">{t('feedback.afterOrderIntro')}</p>}
        {canReward && (
          <p className="rounded-xl bg-primary/10 px-3 py-2 text-sm text-primary">🎁 {t('feedback.rewardOffer', { count: FEEDBACK_REWARD })}</p>
        )}

        <div className="flex flex-col items-center gap-1">
          <div className="flex gap-1" onMouseLeave={() => setHover(0)} role="radiogroup" aria-label={t('feedback.ratingLabel')}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={rating === n}
                aria-label={t('feedback.starN', { count: n })}
                onMouseEnter={() => setHover(n)}
                onClick={() => setRating(n)}
                className={`p-1 transition-transform hover:scale-110 ${(hover || rating) >= n ? 'text-warning' : 'text-base-content/25'}`}
              >
                <Star width={34} height={34} filled={(hover || rating) >= n} />
              </button>
            ))}
          </div>
          <p className="h-5 text-sm text-base-content/60">{(hover || rating) ? t(`feedback.ratingText.${hover || rating}`) : ''}</p>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-base-content/70">{t('feedback.commentLabel')}</span>
          <textarea
            value={comment}
            onChange={(e) => setComment([...e.target.value].slice(0, FEEDBACK_MAX_COMMENT).join(''))}
            rows={4}
            placeholder={t('feedback.commentPlaceholder')}
            className="textarea textarea-bordered w-full rounded-xl"
          />
          <span className={`text-xs ${comment && tooShort ? 'text-warning' : 'text-base-content/45'}`}>
            {tooShort ? t('feedback.minChars', { count: FEEDBACK_MIN_COMMENT }) : `${length}/${FEEDBACK_MAX_COMMENT}`}
          </span>
        </label>

        {submit.isError && <p className="text-sm text-error">{apiErrorMessage(submit.error, t('feedback.error'))}</p>}
      </div>
    </ModalShell>
  );
}

export function Stars({ value = 0, size = 16 }) {
  return (
    <span className="inline-flex text-warning" aria-label={`${value}/5`}>
      {[1, 2, 3, 4, 5].map((n) => <Star key={n} width={size} height={size} filled={n <= Math.round(value)} className={n <= Math.round(value) ? '' : 'text-base-content/25'} />)}
    </span>
  );
}
