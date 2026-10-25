import { useState } from 'react';
import { useSupplierReviewsPortal, useReplyReview, useDeleteReviewReply } from '../../hooks/useSupplierPortal.js';
import { useSupplierStatsSummary } from '../../hooks/useSupplierStats.js';
import { ratingDistribution } from '../../hooks/useReviews.js';
import { apiErrorMessage } from '../../utils/apiError.js';
import { statsRange } from '../../utils/statsRange.js';
import Stars from '../suppliers/Stars.jsx';
import { Star } from '../suppliers/icons.jsx';
import { formatDate } from '../../utils/format.js';

const PAGE_SIZE = 20;
const REPLY_MAX = 1000;
const REPLY_TABS = [['false', 'Cần phản hồi'], ['true', 'Đã phản hồi'], ['', 'Tất cả']];
// Điểm TB + tổng đánh giá trong summary là TỪ TRƯỚC ĐẾN NAY (không theo kỳ) → kỳ nào cũng được, lấy 30 ngày
const SUMMARY_PARAMS = (() => { const { from, to } = statsRange('30d'); return { from, to }; })();

/*
 * ReviewsView — trang "Đánh giá khách hàng" của portal (dùng chung NCC & xưởng), dữ liệu THẬT:
 *  - Danh sách: GET /supplier/reviews (BE-12 §2) — gồm đánh giá về cửa hàng + mọi SP của NCC, có `targetName`,
 *    lọc `replied=false` cho tab "Cần phản hồi" (mặc định), lọc loại / số sao.
 *  - Trả lời: POST /reviews/{id}/reply (gửi lại = sửa), xoá: DELETE /reviews/{id}/reply. Khách nhận thông báo ở
 *    lần trả lời đầu; phản hồi hiện công khai dưới đánh giá ở trang sản phẩm / trang NCC.
 *  - Điểm TB + tổng + số chưa phản hồi: GET /supplier/stats/summary (BE-09) — tính cả cửa hàng lẫn sản phẩm.
 * Trước đây trang chỉ xem được đánh giá từng đối tượng và không trả lời được (BE chưa có API).
 */
export default function ReviewsView({ subtitle, withProducts = false }) {
  const [replied, setReplied] = useState('false');
  const [targetType, setTargetType] = useState('');
  const [rating, setRating] = useState('');
  const [size, setSize] = useState(PAGE_SIZE);

  const params = {
    replied: replied || undefined, targetType: targetType || undefined, rating: rating || undefined, page: 0, size,
  };
  const { data, isLoading, isError, refetch, isFetching } = useSupplierReviewsPortal(params);
  const { data: summary } = useSupplierStatsSummary(SUMMARY_PARAMS);
  const reviews = data?.content ?? [];
  const total = data?.page?.totalElements ?? data?.totalElements ?? reviews.length;
  const distribution = ratingDistribution(reviews);

  const resetSize = (fn) => (e) => { fn(e.target ? e.target.value : e); setSize(PAGE_SIZE); };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl">Đánh giá khách hàng</h1>
        <p className="mt-1 text-base-content/70">{subtitle}</p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex gap-1 rounded-2xl border border-base-300 bg-base-100 p-1 shadow-sm">
          {REPLY_TABS.map(([v, l]) => (
            <button key={v || 'all'} onClick={() => resetSize(setReplied)(v)} className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm ${replied === v ? 'bg-primary text-primary-content' : 'text-base-content/70 hover:bg-base-200'}`}>
              {l}
              {v === 'false' && summary?.unrepliedReviews > 0 && <span className="badge badge-warning badge-sm">{summary.unrepliedReviews}</span>}
            </button>
          ))}
        </div>
        {withProducts && (
          <select value={targetType} onChange={resetSize(setTargetType)} className="select select-bordered select-sm" aria-label="Loại đánh giá">
            <option value="">Cửa hàng + sản phẩm</option>
            <option value="supplier">Đánh giá cửa hàng</option>
            <option value="product">Đánh giá sản phẩm</option>
          </select>
        )}
        <select value={rating} onChange={resetSize(setRating)} className="select select-bordered select-sm" aria-label="Lọc số sao">
          <option value="">Mọi số sao</option>
          {[5, 4, 3, 2, 1].map((s) => <option key={s} value={s}>{s} sao</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
        <section className="h-fit rounded-2xl border border-base-300 bg-base-100 p-5 text-center shadow-sm lg:sticky lg:top-24">
          <p className="font-display text-5xl text-primary">{summary?.rating != null ? Number(summary.rating).toFixed(1) : '—'}</p>
          <Stars value={summary?.rating ?? 0} size={18} />
          <p className="mt-1 text-sm text-base-content/70">{summary?.reviewCount ?? 0} đánh giá · {summary?.unrepliedReviews ?? 0} chưa phản hồi</p>
          {reviews.length > 0 && (
            <>
              <ul className="mt-4 flex flex-col gap-2 text-left">
                {distribution.map((d) => (
                  <li key={d.star} className="flex items-center gap-2 text-xs">
                    <span className="flex w-8 items-center gap-0.5 text-base-content/70">{d.star}<Star width={11} height={11} className="text-warning" /></span>
                    <progress className="progress progress-warning flex-1" value={d.count} max={Math.max(reviews.length, 1)} />
                    <span className="w-8 text-right text-base-content/70">{d.count}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-base-content/70">Phân bố tính trên {reviews.length} đánh giá đang hiển thị</p>
            </>
          )}
        </section>

        <section className={`flex flex-col gap-3 ${isFetching && !isLoading ? 'opacity-70' : ''}`}>
          {isLoading ? (
            [0, 1, 2].map((i) => <div key={i} className="skeleton h-24 rounded-2xl" />)
          ) : isError ? (
            <div className="rounded-2xl border border-base-300 bg-base-100 p-6 text-center">
              <p className="text-error">Không tải được đánh giá.</p>
              <button onClick={() => refetch()} className="btn btn-outline btn-sm mt-2">Thử lại</button>
            </div>
          ) : !reviews.length ? (
            <p className="rounded-2xl border border-dashed border-base-300 bg-base-100 p-10 text-center text-base-content/70">
              {replied === 'false' ? 'Không còn đánh giá nào cần phản hồi.' : 'Chưa có đánh giá nào.'}
            </p>
          ) : (
            reviews.map((r) => <ReviewCard key={r.id} review={r} />)
          )}
          {reviews.length < total && (
            <button onClick={() => setSize((s) => s + PAGE_SIZE)} className="btn btn-ghost btn-sm self-center">Xem thêm</button>
          )}
        </section>
      </div>
    </div>
  );
}

// 1 đánh giá + khung phản hồi của NCC (xem / viết / sửa / xoá)
function ReviewCard({ review: r }) {
  const reply = useReplyReview();
  const removeReply = useDeleteReviewReply();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(r.reply?.content ?? '');
  const [error, setError] = useState('');

  const startEdit = () => { setText(r.reply?.content ?? ''); setError(''); setEditing(true); };
  const save = () => {
    if (!text.trim()) { setError('Nhập nội dung phản hồi.'); return; }
    setError('');
    reply.mutate({ id: r.id, content: text.trim() }, {
      onSuccess: () => setEditing(false),
      onError: (err) => setError(apiErrorMessage(err, 'Gửi phản hồi chưa được, vui lòng thử lại.')),
    });
  };
  const remove = () => {
    if (!window.confirm('Xoá phản hồi này? Khách sẽ không còn thấy câu trả lời của bạn.')) return;
    removeReply.mutate(r.id, { onError: (err) => setError(apiErrorMessage(err, 'Xoá phản hồi chưa được.')) });
  };

  return (
    <article className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-base-200 text-sm font-medium text-primary">
            {(r.userName ?? '?').trim().split(/\s+/).slice(-1)[0][0]?.toUpperCase()}
          </span>
          <div>
            <p className="text-sm font-medium">{r.userName}</p>
            <Stars value={r.rating} size={13} />
          </div>
        </div>
        <div className="text-right">
          <time className="text-xs text-base-content/70">{formatDate(r.createdAt)}</time>
          {r.targetName && (
            <p className="mt-0.5 max-w-[220px] truncate text-xs text-base-content/70">
              {r.targetType === 'supplier' ? 'Cửa hàng' : 'SP'}: <span className="font-medium">{r.targetName}</span>
            </p>
          )}
        </div>
      </div>
      {r.comment ? <p className="mt-2.5 whitespace-pre-line text-sm leading-relaxed text-base-content/75">{r.comment}</p> : <p className="mt-2.5 text-xs italic text-base-content/70">Không có nhận xét</p>}

      {/* Phản hồi của NCC */}
      {editing ? (
        <div className="mt-3 flex flex-col gap-2 rounded-xl bg-base-200/50 p-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value.slice(0, REPLY_MAX))}
            rows={3}
            autoFocus
            placeholder="Cảm ơn khách, giải đáp thắc mắc hoặc hướng xử lý…"
            className="textarea textarea-bordered w-full text-sm"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-xs text-base-content/70">{text.length}/{REPLY_MAX} · Phản hồi hiển thị công khai dưới đánh giá</span>
            <span className="flex gap-2">
              <button type="button" onClick={() => setEditing(false)} disabled={reply.isPending} className="btn btn-ghost btn-sm">Hủy</button>
              <button type="button" onClick={save} disabled={reply.isPending} className="btn btn-primary btn-sm">
                {reply.isPending ? <span className="loading loading-spinner loading-xs" /> : r.reply ? 'Lưu phản hồi' : 'Gửi phản hồi'}
              </button>
            </span>
          </div>
        </div>
      ) : r.reply ? (
        <div className="mt-3 rounded-xl border-l-4 border-primary/40 bg-base-200/50 p-3 text-sm">
          <p className="mb-1 text-xs font-medium text-base-content/70">Phản hồi của bạn · {formatDate(r.reply.createdAt)}</p>
          <p className="whitespace-pre-line text-base-content/75">{r.reply.content}</p>
          <div className="mt-2 flex justify-end gap-1">
            <button type="button" onClick={startEdit} className="btn btn-ghost btn-xs">Sửa</button>
            <button type="button" onClick={remove} disabled={removeReply.isPending} className="btn btn-ghost btn-xs text-error">Xoá</button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex justify-end">
          <button type="button" onClick={startEdit} className="btn btn-outline btn-primary btn-sm">Phản hồi</button>
        </div>
      )}
      {error && <p className="mt-2 text-xs text-error">{error}</p>}
    </article>
  );
}
