import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminFeedbackList, useAdminFeedbackSummary, useSetFeedbackHidden } from '../../hooks/usePlatformFeedback.js';
import { apiErrorMessage } from '../../utils/apiError.js';
import Stars from '../../components/suppliers/Stars.jsx';
import { formatDate } from '../../utils/format.js';
import Pagination from '../../components/ui/Pagination.jsx';

const PAGE_SIZE = 20;
const HIDDEN_TABS = [['', 'Tất cả'], ['false', 'Đang hiển thị'], ['true', 'Đã ẩn']];
const PLATFORM_LABEL = { web: 'Web', android: 'Android', ios: 'iOS' };
const CONTEXT_LABEL = { after_order: 'Sau khi đặt đơn', footer: 'Nút ở footer', landing: 'Trang chủ' };

/*
 * AdminPlatformFeedback — đánh giá WoodHub ("Bạn chấm WoodHub mấy sao", web + app). QA OBS-03: BE đã có API từ PR #25
 * nhưng admin chưa có chỗ xem/gỡ spam. GET /admin/feedback (lọc nền tảng / số sao / đã ẩn) + PATCH /:id/hidden.
 * Ẩn chỉ gỡ khỏi khối đánh giá trên trang chủ; điểm trung bình ở đây và dashboard VẪN tính (không "làm đẹp" số liệu),
 * và KHÔNG thu hồi 5 lượt thiết kế đã tặng (docs/BE-platform-feedback.md §5.4). Không có xoá — BE không mở endpoint.
 */
export default function AdminPlatformFeedback() {
  const [hidden, setHidden] = useState('');
  const [platform, setPlatform] = useState('');
  const [rating, setRating] = useState('');
  const [page, setPage] = useState(0);
  const summary = useAdminFeedbackSummary();
  const { data, isLoading, isError, refetch } = useAdminFeedbackList({
    hidden: hidden || undefined, platform: platform || undefined, rating: rating || undefined, page, size: PAGE_SIZE,
  });
  const items = data?.content ?? [];
  const pageInfo = data?.page ?? { number: 0, totalPages: 1, totalElements: 0 };
  const reset = (fn) => (e) => { fn(e?.target ? e.target.value : e); setPage(0); };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl">Đánh giá WoodHub</h1>
        <p className="mt-1 text-base-content/70">
          Khách chấm điểm trải nghiệm web/app. Ẩn đánh giá spam để gỡ khỏi trang chủ — điểm trung bình vẫn tính và lượt thiết kế đã tặng không bị thu hồi.
        </p>
      </header>

      <SummaryCards summary={summary.data} loading={summary.isLoading} />

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex gap-1 rounded-2xl border border-base-300 bg-base-100 p-1 shadow-sm">
          {HIDDEN_TABS.map(([v, l]) => (
            <button key={v || 'all'} onClick={() => reset(setHidden)(v)} className={`rounded-xl px-4 py-2 text-sm ${hidden === v ? 'bg-primary text-primary-content' : 'text-base-content/70 hover:bg-base-200'}`}>{l}</button>
          ))}
        </div>
        <select value={platform} onChange={reset(setPlatform)} className="select select-bordered select-sm" aria-label="Nền tảng">
          <option value="">Mọi nền tảng</option>
          {Object.entries(PLATFORM_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={rating} onChange={reset(setRating)} className="select select-bordered select-sm" aria-label="Số sao">
          <option value="">Mọi số sao</option>
          {[1, 2, 3, 4, 5].map((s) => <option key={s} value={s}>{s} sao</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
      ) : isError ? (
        <p className="text-center text-error">Không tải được đánh giá. <button onClick={() => refetch()} className="link">Thử lại</button></p>
      ) : !items.length ? (
        <p className="rounded-2xl border border-dashed border-base-300 bg-base-100 py-12 text-center text-base-content/70">Chưa có đánh giá nào.</p>
      ) : (
        <div className="flex flex-col gap-3">{items.map((f) => <FeedbackRow key={f.id} feedback={f} />)}</div>
      )}

      <Pagination pageInfo={pageInfo} onChange={setPage} unit="đánh giá" />
    </div>
  );
}

// 3 ô tổng kết + phân bố số sao (thanh ngang). Tính CẢ đánh giá đã ẩn — giống BE /admin/feedback/summary.
function SummaryCards({ summary, loading }) {
  if (loading) return <div className="skeleton h-28 rounded-2xl" />;
  if (!summary) return null;
  const dist = summary.distribution ?? {};
  const max = Math.max(1, ...Object.values(dist).map(Number));
  return (
    <div className="grid gap-3 md:grid-cols-[repeat(3,minmax(0,1fr))_2fr]">
      <Stat label="Điểm trung bình" value={summary.count ? Number(summary.avgRating).toFixed(1) : '—'} hint={summary.count ? <Stars value={Math.round(summary.avgRating)} size={12} /> : 'Chưa có'} />
      <Stat label="Lượt đánh giá" value={summary.count} hint={Object.entries(summary.byPlatform ?? {}).filter(([, v]) => v.count).map(([k, v]) => `${PLATFORM_LABEL[k] ?? k} ${v.count}`).join(' · ') || '—'} />
      <Stat label="Tài khoản đã nhận thưởng" value={summary.rewardedUsers ?? 0} hint="+5 lượt thiết kế / tài khoản" />
      <div className="rounded-2xl border border-base-300 bg-base-100 p-4">
        <p className="text-xs text-base-content/70">Phân bố số sao</p>
        <ul className="mt-2 flex flex-col gap-1">
          {[5, 4, 3, 2, 1].map((s) => {
            const n = Number(dist[s] ?? 0);
            return (
              <li key={s} className="flex items-center gap-2 text-xs">
                <span className="w-6 text-right tabular-nums">{s}★</span>
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-base-200">
                  <span className="block h-full rounded-full bg-warning" style={{ width: `${(n / max) * 100}%` }} />
                </span>
                <span className="w-8 tabular-nums text-base-content/70">{n}</span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, value, hint }) {
  return (
    <div className="rounded-2xl border border-base-300 bg-base-100 p-4">
      <p className="text-xs text-base-content/70">{label}</p>
      <p className="mt-1 font-display text-3xl">{value}</p>
      <div className="mt-1 text-xs text-base-content/70">{hint}</div>
    </div>
  );
}

function FeedbackRow({ feedback: f }) {
  const setHidden = useSetFeedbackHidden();
  const [err, setErr] = useState('');
  const toggle = () => {
    if (!f.hidden && !window.confirm('Ẩn đánh giá này khỏi trang chủ? Có thể hiện lại sau.')) return;
    setErr('');
    setHidden.mutate({ id: f.id, hidden: !f.hidden }, { onError: (e) => setErr(apiErrorMessage(e, 'Thao tác chưa thành công.')) });
  };

  return (
    <article className={`rounded-2xl border p-4 shadow-sm ${f.hidden ? 'border-warning/40 bg-warning/5' : 'border-base-300 bg-base-100'}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Stars value={f.rating} size={13} />
            <span className="rounded-full bg-base-200 px-2 py-0.5 text-xs">{PLATFORM_LABEL[f.platform] ?? f.platform}</span>
            {f.context && <span className="text-xs text-base-content/70">{CONTEXT_LABEL[f.context] ?? f.context}</span>}
            {f.rewardCredits > 0 && <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs text-success">+{f.rewardCredits} lượt</span>}
            {f.hidden && <span className="rounded-full bg-warning/20 px-2 py-0.5 text-xs font-medium text-warning">Đã ẩn</span>}
          </div>
          <p className="mt-1 text-xs text-base-content/70">
            {f.userId ? <Link to={`/admin/users/${f.userId}`} className="font-medium hover:text-primary">{f.userFullName || f.userEmail}</Link> : f.userFullName}
            {f.userEmail && f.userFullName && ` · ${f.userEmail}`} · {formatDate(f.updatedAt ?? f.createdAt)}
            {f.appVersion && ` · app ${f.appVersion}`}
          </p>
        </div>
        <button
          onClick={toggle}
          disabled={setHidden.isPending}
          className={`btn btn-xs ${f.hidden ? 'btn-outline' : 'btn-outline btn-warning'}`}
        >
          {f.hidden ? 'Hiện lại' : 'Ẩn'}
        </button>
      </div>
      {f.comment && <p className="mt-2 whitespace-pre-line text-sm text-base-content/80">{f.comment}</p>}
      {err && <p className="mt-2 text-xs text-error">{err}</p>}
    </article>
  );
}
