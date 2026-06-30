import { Link } from 'react-router-dom';
import { formatVnd } from '../../utils/format.js';
import { DASHBOARD, BRANCHES, M_ORDERS } from '../../api/mock/manufacturerData.js';
import { orderMeta } from '../../utils/supplierStatus.js';
import StatCard from '../../components/supplier/StatCard.jsx';
import StatusBadge from '../../components/supplier/StatusBadge.jsx';
import RevenueChart from '../../components/supplier/RevenueChart.jsx';
import {
  Wallet, ShoppingBag, Package, Star, Store, Users, ChevronRight,
} from '../../components/suppliers/icons.jsx';

const ICONS = { wallet: Wallet, bag: ShoppingBag, package: Package, star: Star, store: Store, users: Users };

export default function SupplierDashboard() {
  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl">Tổng quan</h1>
        <p className="mt-1 text-base-content/60">Chào mừng trở lại! Đây là tổng quan hoạt động kinh doanh của bạn.</p>
      </header>

      {/* KPI hàng đầu */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {DASHBOARD.kpis.map((k) => (
          <StatCard key={k.key} icon={ICONS[k.icon]} label={k.label} value={k.value} money={k.money} delta={k.delta} />
        ))}
      </div>

      {/* Doanh thu + Đơn gần đây */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-display text-lg">Doanh thu 7 ngày qua</h2>
            <select className="select select-bordered select-sm w-32" defaultValue="7d" aria-label="Khoảng thời gian">
              <option value="7d">7 ngày qua</option>
              <option value="30d">30 ngày</option>
              <option value="month">Tháng này</option>
            </select>
          </div>
          <RevenueChart data={DASHBOARD.revenue7d} />
        </section>

        <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg">Đơn hàng gần đây</h2>
            <Link to="/portal/supplier/orders" className="text-sm text-primary hover:underline">Xem tất cả</Link>
          </div>
          <ul className="flex flex-col gap-2">
            {M_ORDERS.slice(0, 3).map((o) => (
              <li key={o.id}>
                <Link to="/portal/supplier/orders" className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-base-200">
                  <img src={o.productImage} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" loading="lazy" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">#{o.id} · {o.productName}</p>
                    <p className="truncate text-xs text-base-content/50">{o.branch} · {o.date}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <StatusBadge meta={orderMeta(o.status)} />
                    <span className="text-sm font-semibold">{formatVnd(o.total)}</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {/* KPI phụ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {DASHBOARD.secondary.map((s) => (
          <StatCard key={s.key} icon={ICONS[s.icon]} label={s.label} value={s.value} hint={s.hint} to={s.to} />
        ))}
      </div>

      {/* Hiệu suất chi nhánh */}
      <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
        <h2 className="mb-3 font-display text-lg">Hiệu suất chi nhánh</h2>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr className="text-base-content/55">
                <th>#</th><th>Chi nhánh</th><th className="text-right">Doanh thu</th>
                <th className="text-right">Đơn hàng</th><th>Tỷ lệ hoàn thành</th><th className="text-right">Đánh giá</th>
              </tr>
            </thead>
            <tbody>
              {BRANCHES.map((b, i) => (
                <tr key={b.id} className="hover:bg-base-200/50">
                  <td className="text-base-content/50">{i + 1}</td>
                  <td>
                    <Link to={`/portal/supplier/branches/${b.id}`} className="font-medium hover:text-primary">{b.name}</Link>
                    <p className="text-xs text-base-content/45">{b.district}</p>
                  </td>
                  <td className="text-right font-medium">{formatVnd(b.monthRevenue)}</td>
                  <td className="text-right">{b.monthOrders}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <progress className="progress progress-success w-24" value={b.performance} max="100" />
                      <span className="text-xs text-base-content/60">{b.performance}%</span>
                    </div>
                  </td>
                  <td className="text-right">
                    <span className="inline-flex items-center gap-1"><Star width={13} height={13} className="text-warning" /> {b.rating}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
