/*
 * DailyBarChart — biểu đồ cột theo ngày bằng SVG thuần (cùng phong cách RevenueChart).
 * data: [{ date: 'dd/mm', value, extra? }]; extra (vd số task lỗi) chỉ hiện trong tooltip.
 */
const W = 700;
const H = 220;
const PAD = { top: 16, right: 12, bottom: 26, left: 36 };

export default function DailyBarChart({ data = [], ariaLabel = 'Biểu đồ theo ngày', unit = '' }) {
  if (!data.length) return null;
  const max = Math.max(...data.map((d) => d.value), 1);
  const niceMax = max <= 4 ? 4 : Math.ceil(max / 4) * 4;
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const slot = innerW / data.length;
  const barW = Math.max(2, slot * 0.6);
  const labelEvery = Math.ceil(data.length / 8);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-52 w-full" role="img" aria-label={ariaLabel}>
      {[0, 0.5, 1].map((t) => {
        const y = PAD.top + innerH - t * innerH;
        return (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y} y2={y} stroke="currentColor" className="text-base-300" />
            <text x={PAD.left - 6} y={y + 4} textAnchor="end" className="fill-base-content/45" fontSize="11">{Math.round(niceMax * t)}</text>
          </g>
        );
      })}
      {data.map((d, i) => {
        const h = (d.value / niceMax) * innerH;
        const x = PAD.left + i * slot + (slot - barW) / 2;
        return (
          <g key={d.date + i}>
            <rect x={x} y={PAD.top + innerH - h} width={barW} height={h} rx="2" className="fill-primary/70">
              <title>{`${d.date}: ${d.value}${unit}${d.extra ? ` (${d.extra})` : ''}`}</title>
            </rect>
            {i % labelEvery === 0 && (
              <text x={x + barW / 2} y={H - 8} textAnchor="middle" className="fill-base-content/50" fontSize="11">{d.date}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
