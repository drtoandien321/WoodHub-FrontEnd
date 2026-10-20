import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../stores/authStore.js';
import { useReviews, useReviewSummary, useCreateReview, useUpdateReview, useDeleteReview, ratingDistribution } from '../../hooks/useReviews.js';
import Stars from '../suppliers/Stars.jsx';
import LogoBadge from '../suppliers/LogoBadge.jsx';
import StarInput from './StarInput.jsx';
import { formatDate } from '../../utils/format.js';
import { Star } from '../suppliers/icons.jsx';

const PAGE_SIZE = 10;
const COMMENT_MAX = 2000;

// Lỗi BE → key i18n: 409 đã đánh giá rồi · 403 tự đánh giá của mình · 401 hết phiên
const reviewErrorKey = (err) =>
  ({ 409: 'reviews.errDuplicate', 403: 'reviews.errForbidden', 401: 'reviews.errAuth', 400: 'reviews.errInvalid' })[err?.response?.status] ?? 'reviews.errGeneric';

/*
 * ReviewForm — viết mới hoặc sửa đánh giá của chính mình (POST / PUT /reviews).
 * `existing` = đánh giá cũ của user (nếu có) → chế độ sửa.
 */
function ReviewForm({ targetType, targetId, existing, onDone }) {
  const { t } = useTranslation();
  const create = useCreateReview();
  const update = useUpdateReview();
  const [rating, setRating] = useState(existing?.rating ?? 0);
  const [comment, setComment] = useState(existing?.comment ?? '');
  // Ẩn tên: BE lưu cờ is_anonymous, trả tên đã che ("N*****n") + không trả userId cho người khác
  const [anonymous, setAnonymous] = useState(existing?.anonymous ?? false);
  const [err, setErr] = useState('');
  const saving = create.isPending || update.isPending;
  const starLabels = [1, 2, 3, 4, 5].map((n) => t(`reviews.star${n}`));

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) { setErr(t('reviews.errNoRating')); return; }
    setErr('');
    const body = { rating, comment: comment.trim() || null, anonymous };
    try {
      if (existing) await update.mutateAsync({ id: existing.id, ...body });
      else await create.mutateAsync({ targetType, targetId, ...body });
      onDone();
    } catch (error) {
      setErr(t(reviewErrorKey(error)));
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4">
      <p className="text-sm font-medium">{existing ? t('reviews.editTitle') : t('reviews.writeTitle')}</p>
      <StarInput value={rating} onChange={(n) => { setRating(n); setErr(''); }} label={t('reviews.ratingLabel')} labels={starLabels} />
      <label className="flex flex-col gap-1">
        <span className="sr-only">{t('reviews.commentLabel')}</span>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value.slice(0, COMMENT_MAX))}
          rows={3}
          placeholder={t('reviews.commentPlaceholder')}
          className="textarea textarea-bordered w-full"
        />
        <span className="self-end text-xs text-base-content/45">{comment.length}/{COMMENT_MAX}</span>
      </label>
      <label className="flex cursor-pointer items-start gap-2 text-sm">
        <input type="checkbox" checked={anonymous} onChange={(e) => setAnonymous(e.target.checked)} className="checkbox checkbox-primary checkbox-sm mt-0.5" />
        <span>
          {t('reviews.anonymousLabel')}
          <span className="block text-xs text-base-content/50">{t('reviews.anonymousHint')}</span>
        </span>
      </label>
      {err && <p role="alert" className="text-sm text-error">{err}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} disabled={saving} className="btn btn-ghost btn-sm">{t('reviews.cancel')}</button>
        <button type="submit" disabled={saving} className="btn btn-primary btn-sm">
          {saving ? <span className="loading loading-spinner loading-xs" /> : existing ? t('reviews.update') : t('reviews.submit')}
        </button>
      </div>
    </form>
  );
}

/*
 * ReviewSection — khối "Đánh giá" ở trang SẢN PHẨM và trang HỒ SƠ NHÀ CUNG CẤP.
 *  - Ai cũng xem được điểm trung bình + danh sách (GET /reviews, /reviews/summary là công khai).
 *  - Khách hàng (role customer) đã đăng nhập viết được 1 đánh giá / đối tượng; có rồi thì sửa/xoá.
 *    BE không có API "đánh giá của tôi" → tìm trong trang đầu theo cờ `mine` của BE (đánh giá ẩn danh
 *    không trả userId nên không so được bằng id); dự phòng so userId cho BE bản cũ. BE vẫn chặn trùng bằng 409.
 *  - Ẩn danh: khách tích "Ẩn tên của tôi" → người khác thấy tên đã che; chủ đánh giá vẫn sửa/xoá được.
 *  - Chưa đăng nhập: link sang /login (state.from để quay lại đúng trang).
 *  - Supplier/admin không có form: BE chặn tự đánh giá, và đánh giá là tiếng nói của người mua.
 */
export default function ReviewSection({ targetType, targetId, title }) {
  const { t } = useTranslation();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const [size, setSize] = useState(PAGE_SIZE);
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { data, isLoading } = useReviews(targetType, targetId, { size });
  const { data: summary } = useReviewSummary(targetType, targetId);
  const deleteReview = useDeleteReview();

  const reviews = data?.content ?? [];
  const total = summary?.count ?? 0;
  const mine = user ? reviews.find((r) => r.mine || (r.userId && r.userId === user.id)) : null;
  const canWrite = user?.role === 'customer';
  const distribution = ratingDistribution(reviews);
  const hasMore = reviews.length < (data?.page?.totalElements ?? data?.totalElements ?? 0);

  const remove = () => deleteReview.mutate(mine.id, { onSuccess: () => setConfirmDelete(false) });

  return (
    <section id="reviews" className="flex flex-col gap-5 rounded-3xl border border-base-300 bg-base-100 p-5 md:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl">{title ?? t('reviews.title')}</h2>
        {!user && (
          <Link to="/login" state={{ from: location }} className="btn btn-outline btn-sm">{t('reviews.loginToWrite')}</Link>
        )}
        {canWrite && !mine && !editing && (
          <button onClick={() => setEditing(true)} className="btn btn-primary btn-sm">{t('reviews.write')}</button>
        )}
      </header>

      {/* Tổng quan: điểm TB + số lượt từ /summary; phân bố sao tính từ các đánh giá đã tải */}
      {total > 0 && (
        <div className="grid gap-4 rounded-2xl bg-base-200/50 p-4 sm:grid-cols-[160px_1fr] sm:items-center">
          <div className="text-center">
            <p className="font-display text-4xl text-primary">{summary.average.toFixed(1)}</p>
            <Stars value={summary.average} size={16} />
            <p className="mt-1 text-xs text-base-content/55">{t('reviews.count', { count: total })}</p>
          </div>
          <ul className="flex flex-col gap-1.5">
            {distribution.map((d) => (
              <li key={d.star} className="flex items-center gap-2 text-xs">
                <span className="flex w-7 items-center gap-0.5 text-base-content/60">{d.star}<Star width={11} height={11} className="text-accent" filled /></span>
                <progress className="progress progress-accent flex-1" value={d.count} max={Math.max(reviews.length, 1)} />
                <span className="w-6 text-right text-base-content/50">{d.count}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {editing && (
        <ReviewForm targetType={targetType} targetId={targetId} existing={mine} onDone={() => setEditing(false)} />
      )}

      {isLoading ? (
        <div className="flex flex-col gap-3">{[0, 1].map((i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
      ) : !reviews.length ? (
        !editing && <p className="py-6 text-center text-sm text-base-content/55">{canWrite ? t('reviews.emptyCta') : t('reviews.empty')}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {reviews.map((r) => {
            const isMine = mine?.id === r.id;
            if (isMine && editing) return null; // đang sửa thì form đã hiện phía trên
            return (
              <li key={r.id} className={`flex flex-col gap-2 rounded-2xl border p-4 ${isMine ? 'border-primary/40 bg-primary/5' : 'border-base-300'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <LogoBadge name={r.userName} className="h-9 w-9 rounded-full text-xs" />
                    <div>
                      <p className="text-sm font-medium">
                        {r.userName}
                        {r.anonymous && <span className="ml-1.5 badge badge-ghost badge-xs">{t('reviews.anonymousBadge')}</span>}
                        {isMine && <span className="ml-1.5 badge badge-primary badge-xs">{t('reviews.yours')}</span>}
                      </p>
                      {/* Chỉ chủ đánh giá thấy dòng này → yên tâm là tên đã được ẩn với người khác */}
                      {isMine && r.anonymous && <p className="text-xs text-base-content/50">{t('reviews.anonymousOwnerNote')}</p>}
                      <Stars value={r.rating} size={13} />
                    </div>
                  </div>
                  <time className="shrink-0 text-xs text-base-content/45">
                    {formatDate(r.createdAt)}{r.updatedAt && r.updatedAt !== r.createdAt ? ` · ${t('reviews.edited')}` : ''}
                  </time>
                </div>
                {r.comment && <p className="whitespace-pre-line text-sm leading-relaxed text-base-content/75">{r.comment}</p>}
                {isMine && (
                  <div className="flex items-center justify-end gap-2">
                    {confirmDelete ? (
                      <>
                        <span className="text-xs text-base-content/60">{t('reviews.deleteConfirm')}</span>
                        <button onClick={remove} disabled={deleteReview.isPending} className="btn btn-error btn-xs">
                          {deleteReview.isPending ? <span className="loading loading-spinner loading-xs" /> : t('reviews.delete')}
                        </button>
                        <button onClick={() => setConfirmDelete(false)} className="btn btn-ghost btn-xs">{t('reviews.cancel')}</button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => setEditing(true)} className="btn btn-ghost btn-xs">{t('reviews.edit')}</button>
                        <button onClick={() => setConfirmDelete(true)} className="btn btn-ghost btn-xs text-error">{t('reviews.delete')}</button>
                      </>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {hasMore && (
        <button onClick={() => setSize((s) => s + PAGE_SIZE)} className="btn btn-ghost btn-sm self-center">{t('reviews.loadMore')}</button>
      )}
      {deleteReview.isError && <p role="alert" className="text-sm text-error">{t(reviewErrorKey(deleteReview.error))}</p>}
    </section>
  );
}
