import { formatVnd } from '../../utils/format.js';
import { REPORTS, DASHBOARD, BRANCHES } from '../../api/mock/manufacturerData.js';
import StatCard from '../../components/supplier/StatCard.jsx';
import RevenueChart from '../../components/supplier/RevenueChart.jsx';
import { Download, Star, TrendingUp } from '../../components/suppliers/icons.jsx';

// Màu cho từng trạng thái đơn (segment bar + legend)
const STATUS_COLOR = {
  processing: 'bg-info', packing: 'bg-warning', shipping: 'bg-primary', completed: 'bg-success', cancelled: 'bg-error',
};

export default function SupplierReports() {
  const totalOrders = REPORTS.ordersByStatus.reduce((s, x) => s + x.value, 0);

  return (
    <div className="flex flex-col gap-6">
      <header><h1 className="font-display text-3xl">Báo cáo</h1>
        <p className="mt-1 text-base-content/60">Theo dõi doanh thu, đơn hàng, sản phẩm và hiệu suất chi nhánh.</p>
      </header>

      {/* Filter bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm lg:flex-row lg:items-center">
        <select className="select select-bordered" defaultValue="7d" aria-label="Khoảng thời gian">
          <option value="today">Hôm nay</option><option value="7d">7 ngày qua</option>
          <option value="30d">30 ngày qua</option><option value="month">Tháng này</option>
        </select>
        <select className="select select-bordered" defaultValue="all" aria-label="Chi nhánh">
          <option value="all">Tất cả chi nhánh</option>
          {BRANCHES.map((b) => <option key={b.id}>{b.name}</option>)}
        </select>
        <button className="btn btn-primary gap-2 lg:ml-auto"><Download width={16} height={16} /> Xuất báo cáo</button>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {REPORTS.kpis.map((k) => (
          <StatCard key={k.label} label={k.label} value={k.value} money={k.money} delta={k.delta} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <h2 className="mb-3 font-display text-lg">Doanh thu theo thời gian</h2>
          <RevenueChart data={DASHBOARD.revenue7d} />
        </section>

        <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <h2 className="mb-4 font-display text-lg">Đơn hàng theo trạng thái</h2>
          <div className="flex h-3 w-full overflow-hidden rounded-full">
            {REPORTS.ordersByStatus.map((s) => (
              <span key={s.key} className={STATUS_COLOR[s.key]} style={{ width: `${(s.value / totalOrders) * 100}%` }} title={`${s.label}: ${s.value}`} />
            ))}
          </div>
          <ul className="mt-4 flex flex-col gap-2.5">
            {REPORTS.ordersByStatus.map((s) => (
              <li key={s.key} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2"><span className={`h-2.5 w-2.5 rounded-full ${STATUS_COLOR[s.key]}`} />{s.label}</span>
                <span className="font-medium">{s.value} <span className="text-base-content/40">({Math.round((s.value / totalOrders) * 100)}%)</span></span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* Top products + Branch perf */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <h2 className="mb-3 font-display text-lg">Top sản phẩm bán chạy</h2>
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead><tr className="text-base-content/55"><th>Sản phẩm</th><th className="text-right">Đã bán</th><th className="text-right">Doanh thu</th><th className="text-right">Tăng trưởng</th></tr></thead>
              <tbody>
                {REPORTS.topProducts.map((p) => (
                  <tr key={p.name} className="hover:bg-base-200/50">
                    <td className="font-medium">{p.name}</td>
                    <td className="text-right">{p.sold}</td>
                    <td className="text-right">{formatVnd(p.revenue)}</td>
                    <td className={`text-right font-medium ${p.growth >= 0 ? 'text-success' : 'text-error'}`}>{p.growth >= 0 ? '+' : ''}{p.growth}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <h2 className="mb-3 font-display text-lg">Hiệu suất theo chi nhánh</h2>
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead><tr className="text-base-content/55"><th>Chi nhánh</th><th className="text-right">Doanh thu</th><th className="text-right">Đơn</th><th>Hoàn thành</th><th className="text-right">Rating</th></tr></thead>
              <tbody>
                {BRANCHES.map((b) => (
                  <tr key={b.id} className="hover:bg-base-200/50">
                    <td className="font-medium">{b.name}</td>
                    <td className="text-right">{formatVnd(b.monthRevenue)}</td>
                    <td className="text-right">{b.monthOrders}</td>
                    <td><progress className="progress progress-success w-16" value={b.performance} max="100" /></td>
                    <td className="text-right"><span className="inline-flex items-center gap-1"><Star width={12} height={12} className="text-warning" />{b.rating}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* Alerts */}
      <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg"><TrendingUp width={18} height={18} className="text-primary" /> Cảnh báo kinh doanh</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {REPORTS.alerts.map((a, i) => (
            <div key={i} className={`rounded-2xl border p-4 text-sm font-medium ${
              a.tone === 'error' ? 'border-error/30 bg-error/5 text-error'
              : a.tone === 'warning' ? 'border-warning/30 bg-warning/5 text-warning'
              : 'border-info/30 bg-info/5 text-info'}`}>
              {a.text}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
