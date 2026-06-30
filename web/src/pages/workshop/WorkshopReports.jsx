import { formatVnd } from '../../utils/format.js';
import { W_REPORTS, W_DASHBOARD } from '../../api/mock/workshopPortalData.js';
import StatCard from '../../components/supplier/StatCard.jsx';
import RevenueChart from '../../components/supplier/RevenueChart.jsx';
import { Download, TrendingUp } from '../../components/suppliers/icons.jsx';

const STATUS_COLOR = {
  quote_pending: 'bg-warning', quoted: 'bg-info', producing: 'bg-primary', completed: 'bg-success', cancelled: 'bg-error',
};

export default function WorkshopReports() {
  const totalOrders = W_REPORTS.ordersByStatus.reduce((s, x) => s + x.value, 0);

  return (
    <div className="flex flex-col gap-6">
      <header><h1 className="font-display text-3xl">Báo cáo</h1>
        <p className="mt-1 text-base-content/60">Theo dõi doanh thu, đơn custom và hiệu suất sản xuất của xưởng.</p>
      </header>

      <div className="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm lg:flex-row lg:items-center">
        <select className="select select-bordered" defaultValue="7d" aria-label="Khoảng thời gian">
          <option value="today">Hôm nay</option><option value="7d">7 ngày qua</option><option value="30d">30 ngày qua</option><option value="month">Tháng này</option>
        </select>
        <button className="btn btn-primary gap-2 lg:ml-auto"><Download width={16} height={16} /> Xuất báo cáo</button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {W_REPORTS.kpis.map((k) => <StatCard key={k.label} label={k.label} value={k.value} money={k.money} delta={k.delta} />)}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <h2 className="mb-3 font-display text-lg">Doanh thu theo thời gian</h2>
          <RevenueChart data={W_DASHBOARD.revenue7d} />
        </section>
        <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <h2 className="mb-4 font-display text-lg">Đơn custom theo trạng thái</h2>
          <div className="flex h-3 w-full overflow-hidden rounded-full">
            {W_REPORTS.ordersByStatus.map((s) => <span key={s.key} className={STATUS_COLOR[s.key]} style={{ width: `${(s.value / totalOrders) * 100}%` }} title={`${s.label}: ${s.value}`} />)}
          </div>
          <ul className="mt-4 flex flex-col gap-2.5">
            {W_REPORTS.ordersByStatus.map((s) => (
              <li key={s.key} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${STATUS_COLOR[s.key]}`} />{s.label}</span>
                <span className="font-medium">{s.value} <span className="text-base-content/40">({Math.round((s.value / totalOrders) * 100)}%)</span></span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
        <h2 className="mb-3 font-display text-lg">Sản phẩm custom nổi bật</h2>
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead><tr className="text-base-content/55"><th>Loại sản phẩm</th><th className="text-right">Số đơn</th><th className="text-right">Doanh thu</th><th className="text-right">Tăng trưởng</th></tr></thead>
            <tbody>
              {W_REPORTS.topItems.map((p) => (
                <tr key={p.name} className="hover:bg-base-200/50">
                  <td className="font-medium">{p.name}</td><td className="text-right">{p.sold}</td><td className="text-right">{formatVnd(p.revenue)}</td>
                  <td className={`text-right font-medium ${p.growth >= 0 ? 'text-success' : 'text-error'}`}>{p.growth >= 0 ? '+' : ''}{p.growth}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg"><TrendingUp width={18} height={18} className="text-primary" /> Cảnh báo sản xuất</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {W_REPORTS.alerts.map((a, i) => (
            <div key={i} className={`rounded-2xl border p-4 text-sm font-medium ${a.tone === 'error' ? 'border-error/30 bg-error/5 text-error' : a.tone === 'warning' ? 'border-warning/30 bg-warning/5 text-warning' : 'border-info/30 bg-info/5 text-info'}`}>{a.text}</div>
          ))}
        </div>
      </section>
    </div>
  );
}
