import { Link } from 'react-router-dom';
import { formatVnd } from '../../utils/format.js';
import { TrendingUp, ChevronRight } from '../suppliers/icons.jsx';

/*
 * StatCard — thẻ KPI dùng chung (Dashboard, Sản phẩm, Báo cáo...).
 * Props: icon, label, value, money?, delta? (số %), hint?, to?,
 *   iconWrap: class TĨNH cho ô icon (vd 'bg-success/10 text-success') — KHÔNG dùng class động
 *   vì Tailwind purge. Mặc định nâu (primary).
 */
export default function StatCard({
  icon: Icon, label, value, money, delta, hint, to,
  iconWrap = 'bg-primary/10 text-primary',
}) {
  const display = money ? formatVnd(value) : value;
  const positive = delta == null || delta >= 0;

  const body = (
    <div className="group h-full rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-base-content/60">{label}</p>
          <p className="mt-1 truncate text-2xl font-semibold text-base-content">{display}</p>
        </div>
        {Icon && (
          <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${iconWrap}`}>
            <Icon width={20} height={20} />
          </span>
        )}
      </div>

      {delta != null && (
        <p className={`mt-2 inline-flex items-center gap-1 text-xs font-medium ${positive ? 'text-success' : 'text-error'}`}>
          <TrendingUp width={13} height={13} className={positive ? '' : 'rotate-180'} />
          {positive ? '+' : ''}{delta}% <span className="font-normal text-base-content/45">so với 7 ngày trước</span>
        </p>
      )}
      {hint && !to && <p className="mt-2 text-xs text-base-content/55">{hint}</p>}
      {hint && to && (
        <p className="mt-2 flex items-center justify-between text-xs text-base-content/55">
          {hint}
          <span className="inline-flex items-center gap-0.5 font-medium text-primary transition-all group-hover:gap-1.5">
            <ChevronRight width={13} height={13} />
          </span>
        </p>
      )}
    </div>
  );

  return to ? <Link to={to} className="block">{body}</Link> : body;
}
