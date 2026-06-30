import Stars from '../suppliers/Stars.jsx';
import { Star, MessageCircle } from '../suppliers/icons.jsx';

/*
 * ReviewsView — trang Đánh giá khách hàng dùng chung (manufacturer & workshop).
 * Props: summary {average,total,distribution[{star,count}]}, reviews[], subtitle.
 */
export default function ReviewsView({ summary, reviews, subtitle }) {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl">Đánh giá khách hàng</h1>
        <p className="mt-1 text-base-content/60">{subtitle}</p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[300px_1fr]">
        {/* Tổng quan đánh giá */}
        <section className="h-fit rounded-2xl border border-base-300 bg-base-100 p-5 text-center shadow-sm lg:sticky lg:top-24">
          <p className="font-display text-5xl text-primary">{summary.average}</p>
          <Stars value={Math.round(summary.average)} size={18} />
          <p className="mt-1 text-sm text-base-content/55">{summary.total} đánh giá</p>
          <ul className="mt-4 flex flex-col gap-2 text-left">
            {summary.distribution.map((d) => {
              const pct = Math.round((d.count / summary.total) * 100);
              return (
                <li key={d.star} className="flex items-center gap-2 text-xs">
                  <span className="flex w-8 items-center gap-0.5 text-base-content/60">{d.star}<Star width={11} height={11} className="text-warning" /></span>
                  <progress className="progress progress-warning flex-1" value={pct} max="100" />
                  <span className="w-8 text-right text-base-content/50">{d.count}</span>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Danh sách đánh giá */}
        <section className="flex flex-col gap-3">
          {reviews.map((r) => (
            <article key={r.id} className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-base-200 text-sm font-medium text-primary">{r.name.split(' ').slice(-1)[0][0]}</span>
                  <div>
                    <p className="text-sm font-medium">{r.name}</p>
                    <Stars value={r.rating} size={13} />
                  </div>
                </div>
                <time className="text-xs text-base-content/45">{r.date}</time>
              </div>
              <p className="mt-2.5 text-sm leading-relaxed text-base-content/75">{r.text}</p>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-base-content/45">{r.product}{r.branch ? ` · ${r.branch}` : ''}</span>
                {r.replied
                  ? <span className="text-xs text-success">✓ Đã phản hồi</span>
                  : <button className="btn btn-ghost btn-xs gap-1 text-primary"><MessageCircle width={13} height={13} /> Phản hồi</button>}
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}
