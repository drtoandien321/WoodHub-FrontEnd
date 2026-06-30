import { formatVnd } from '../../utils/format.js';

/*
 * RevenueChart — line/area chart bằng SVG thuần (không cần thư viện chart).
 * data: [{ date, value }]. Tự scale theo viewBox; đường nâu (primary), nền gradient nhạt.
 */
const W = 700;
const H = 260;
const PAD = { top: 20, right: 16, bottom: 28, left: 56 };

export default function RevenueChart({ data = [] }) {
  if (!data.length) return null;

  const max = Math.max(...data.map((d) => d.value));
  const niceMax = Math.ceil(max / 10_000_000) * 10_000_000 || 10_000_000;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;

  const x = (i) => PAD.left + (data.length === 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
  const y = (v) => PAD.top + innerH - (v / niceMax) * innerH;

  const pts = data.map((d, i) => [x(i), y(d.value)]);
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ');
  const area = `${line} L${pts[pts.length - 1][0]},${PAD.top + innerH} L${pts[0][0]},${PAD.top + innerH} Z`;

  // 4 mốc lưới ngang
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({ v: niceMax * t, y: y(niceMax * t) }));
  const shortVnd = (v) => `${Math.round(v / 1_000_000)}tr`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-64 w-full" role="img" aria-label="Biểu đồ doanh thu 7 ngày">
      <defs>
        <linearGradient id="revFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-primary, #5A3A28)" stopOpacity="0.18" />
          <stop offset="100%" stopColor="var(--color-primary, #5A3A28)" stopOpacity="0" />
        </linearGradient>
      </defs>

      {ticks.map((t, i) => (
        <g key={i}>
          <line x1={PAD.left} x2={W - PAD.right} y1={t.y} y2={t.y} stroke="currentColor" className="text-base-300" strokeWidth="1" />
          <text x={PAD.left - 8} y={t.y + 4} textAnchor="end" className="fill-base-content/45" fontSize="11">{shortVnd(t.v)}</text>
        </g>
      ))}

      <path d={area} fill="url(#revFill)" />
      <path d={line} fill="none" stroke="currentColor" className="text-primary" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p[0]} cy={p[1]} r="3.5" className="fill-base-100 stroke-primary" strokeWidth="2" />
          <title>{`${data[i].date}: ${formatVnd(data[i].value)}`}</title>
          <text x={p[0]} y={H - 8} textAnchor="middle" className="fill-base-content/50" fontSize="11">{data[i].date}</text>
        </g>
      ))}
    </svg>
  );
}
