import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminReviews, useModerateReview, useDeleteAdminReview } from '../../hooks/useAdminOps.js';
import { apiErrorMessage } from '../../utils/apiError.js';
import Stars from '../../components/suppliers/Stars.jsx';
import { formatDate } from '../../utils/format.js';

const PAGE_SIZE = 20;
const HIDDEN_TABS = [['', 'Tất cả'], ['false', 'Đang hiển thị'], ['true', 'Đã ẩn']];

/*
 * AdminReviews — kiểm duyệt đánh giá (BE-11 §2): GET /admin/reviews (lọc loại / số sao / đã ẩn), Ẩn / Hiện lại
 * (PATCH, có lý do) và Xoá vĩnh viễn (DELETE). Đánh giá bị ẩn không hiện công khai và không tính điểm trung bình.
 * Admin luôn thấy người viết thật kể cả đánh giá ẩn danh → link sang trang người dùng để khoá nếu spam.
 * Ưu tiên Ẩn (hoàn tác được) hơn Xoá.
 */
export default function AdminReviews() {
  const [hidden, setHidden] = useState('');
  const [targetType, setTargetType] = useState('');
  const [rating, setRating] = useState('');
  const [page, setPage] = useState(0);
  const { data, isLoading, isError, refetch } = useAdminReviews({
    hidden: hidden || undefined, targetType: targetType || undefined, rating: rating || undefined, page, size: PAGE_SIZE,
  });
  const items = data?.content ?? [];
  const pageInfo = data?.page ?? { number: 0, totalPages: 1, totalElements: 0 };
  const reset = (fn) => (e) => { fn(e?.target ? e.target.value : e); setPage(0); };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl">Kiểm duyệt đánh giá</h1>
        <p className="mt-1 text-base-content/60">Ẩn đánh giá vi phạm (spam, quảng cáo, ngôn từ xấu). Đánh giá bị ẩn không hiện công khai và không tính điểm.</p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex gap-1 rounded-2xl border border-base-300 bg-base-100 p-1 shadow-sm">
          {HIDDEN_TABS.map(([v, l]) => (
            <button key={v || 'all'} onClick={() => reset(setHidden)(v)} className={`rounded-xl px-4 py-2 text-sm ${hidden === v ? 'bg-primary text-primary-content' : 'text-base-content/70 hover:bg-base-200'}`}>{l}</button>
          ))}
        </div>
        <select value={targetType} onChange={reset(setTargetType)} className="select select-bordered select-sm" aria-label="Loại">
          <option value="">Sản phẩm + nhà cung cấp</option>
          <option value="product">Đánh giá sản phẩm</option>
          <option value="supplier">Đánh giá nhà cung cấp</option>
        </select>
        <select value={rating} onChange={reset(setRating)} className="select select-bordered select-sm" aria-label="Số sao">
          <option value="">Mọi số sao</option>
          {[1, 2, 3, 4, 5].map((s) => <option key={s} value={s}>{s} sao</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}</div>
      ) : isError ? (
        <p className="text-center text-error">Không tải được đánh giá. <button onClick={() => refetch()} className="link">Thử lại</button></p>
      ) : !items.length ? (
        <p className="rounded-2xl border border-dashed border-base-300 bg-base-100 py-12 text-center text-base-content/55">Không có đánh giá nào.</p>
      ) : (
        <div className="flex flex-col gap-3">{items.map((r) => <ReviewRow key={r.id} review={r} />)}</div>
      )}

      {pageInfo.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-base-content/60">
          <span>Trang {pageInfo.number + 1} / {pageInfo.totalPages} — {pageInfo.totalElements} đánh giá</span>
          <div className="join">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={pageInfo.number === 0} className="btn btn-sm join-item">«</button>
            <button onClick={() => setPage((p) => p + 1)} disabled={pageInfo.number >= pageInfo.totalPages - 1} className="btn btn-sm join-item">»</button>
          </div>
        </div>
      )}
    </div>
  );
}

function ReviewRow({ review: r }) {
  const moderate = useModerateReview();
  const remove = useDeleteAdminReview();
  const [hiding, setHiding] = useState(false);
  const [reason, setReason] = useState('');
  const [err, setErr] = useState('');
  const targetLink = r.targetType === 'product' ? `/product/${r.targetId}` : `/suppliers/${r.targetId}`;
  const onError = (e) => setErr(apiErrorMessage(e, 'Thao tác chưa thành công.'));

  const hide = () => moderate.mutate({ id: r.id, hidden: true, reason: reason.trim() || undefined }, { onSuccess: () => { setHiding(false); setReason(''); }, onError });
  const unhide = () => moderate.mutate({ id: r.id, hidden: false }, { onError });
  const del = () => {
    if (!window.confirm('Xoá vĩnh viễn đánh giá này? Không thể hoàn tác — nên dùng Ẩn nếu chỉ muốn gỡ khỏi trang công khai.')) return;
    remove.mutate(r.id, { onError });
  };

  return (
    <article className={`rounded-2xl border p-4 shadow-sm ${r.hidden ? 'border-warning/40 bg-warning/5' : 'border-base-300 bg-base-100'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Stars value={r.rating} size={13} />
            <span className="text-xs text-base-content/50">{r.targetType === 'product' ? 'Sản phẩm' : 'Nhà cung cấp'}:</span>
            {r.targetName ? <Link to={targetLink} className="text-sm font-medium hover:text-primary">{r.targetName}</Link> : <span className="text-sm text-base-content/50">(đã xoá)</span>}
            {r.hidden && <span className="rounded-full bg-warning/20 px-2 py-0.5 text-xs font-medium text-warning">Đã ẩn</span>}
          </div>
          <p className="mt-1 text-xs text-base-content/55">
            {r.author?.id ? <Link to={`/admin/users/${r.author.id}`} className="font-medium hover:text-primary">{r.author.fullName}</Link> : r.author?.fullName}
            {r.author?.email && ` · ${r.author.email}`}{r.anonymous && ' · đăng ẩn danh'} · {formatDate(r.createdAt)}
          </p>
        </div>
        <div className="flex gap-1">
          {r.hidden
            ? <button onClick={unhide} disabled={moderate.isPending} className="btn btn-outline btn-xs">Hiện lại</button>
            : <button onClick={() => setHiding((x) => !x)} className="btn btn-outline btn-warning btn-xs">Ẩn</button>}
          <button onClick={del} disabled={remove.isPending} className="btn btn-ghost btn-xs text-error">Xoá</button>
        </div>
      </div>
      {r.comment ? <p className="mt-2 whitespace-pre-line text-sm text-base-content/75">{r.comment}</p> : <p className="mt-2 text-xs italic text-base-content/45">Không có nhận xét</p>}
      {r.hidden && r.hiddenReason && <p className="mt-2 text-xs text-warning">Lý do ẩn: {r.hiddenReason}{r.hiddenAt ? ` · ${formatDate(r.hiddenAt)}` : ''}</p>}
      {hiding && (
        <div className="mt-3 flex flex-wrap gap-2">
          <input value={reason} onChange={(e) => setReason(e.target.value.slice(0, 500))} placeholder="Lý do ẩn (tuỳ chọn), VD: Nội dung quảng cáo" className="input input-bordered input-sm min-w-0 flex-1" />
          <button onClick={hide} disabled={moderate.isPending} className="btn btn-warning btn-sm">Xác nhận ẩn</button>
        </div>
      )}
      {err && <p className="mt-2 text-xs text-error">{err}</p>}
    </article>
  );
}
