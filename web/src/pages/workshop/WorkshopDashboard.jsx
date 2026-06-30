import { Link } from 'react-router-dom';
import { formatVnd } from '../../utils/format.js';
import { W_DASHBOARD, W_ORDERS } from '../../api/mock/workshopPortalData.js';
import { workshopOrderMeta } from '../../utils/supplierStatus.js';
import StatCard from '../../components/supplier/StatCard.jsx';
import StatusBadge from '../../components/supplier/StatusBadge.jsx';
import RevenueChart from '../../components/supplier/RevenueChart.jsx';
import { Package, Briefcase, Tool, Star, Users } from '../../components/suppliers/icons.jsx';

const ICONS = { inbox: Package, quote: Briefcase, hammer: Tool, star: Star, users: Users };

export default function WorkshopDashboard() {
  const needAction = W_ORDERS.filter((o) => o.status === 'quote_pending' || o.status === 'quoted');

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl">Tổng quan</h1>
        <p className="mt-1 text-base-content/60">Chào mừng trở lại! Đây là tình hình đơn custom và sản xuất của xưởng.</p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {W_DASHBOARD.kpis.map((k) => (
          <StatCard key={k.key} icon={ICONS[k.icon]} label={k.label} value={k.value} delta={k.delta} />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="font-display text-lg">Doanh thu 7 ngày qua</h2>
            <select className="select select-bordered select-sm w-32" defaultValue="7d" aria-label="Khoảng thời gian">
              <option value="7d">7 ngày qua</option><option value="30d">30 ngày</option>
            </select>
          </div>
          <RevenueChart data={W_DASHBOARD.revenue7d} />
        </section>

        <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg">Đơn custom gần đây</h2>
            <Link to="/portal/workshop/orders" className="text-sm text-primary hover:underline">Xem tất cả</Link>
          </div>
          <ul className="flex flex-col gap-2">
            {W_ORDERS.slice(0, 3).map((o) => (
              <li key={o.id}>
                <Link to="/portal/workshop/orders" className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-base-200">
                  <img src={o.image} alt="" className="h-12 w-12 shrink-0 rounded-lg object-cover" loading="lazy" />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">#{o.id} · {o.title}</p><p className="truncate text-xs text-base-content/50">{o.customerName} · {o.date}</p></div>
                  <StatusBadge meta={workshopOrderMeta(o.status)} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {W_DASHBOARD.secondary.map((s) => (
          <StatCard key={s.key} icon={ICONS[s.icon]} label={s.label} value={s.value} hint={s.hint} to={s.to} />
        ))}
      </div>

      <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
        <h2 className="mb-3 font-display text-lg">Đơn cần xử lý</h2>
        <div className="overflow-x-auto">
          <table className="table">
            <thead><tr className="text-base-content/55"><th>Mã đơn</th><th>Khách hàng</th><th>Yêu cầu</th><th>Trạng thái</th><th className="text-right">Báo giá</th></tr></thead>
            <tbody>
              {needAction.map((o) => (
                <tr key={o.id} className="hover:bg-base-200/50">
                  <td className="font-medium">#{o.id}</td>
                  <td>{o.customerName}</td>
                  <td className="text-sm text-base-content/70">{o.title}</td>
                  <td><StatusBadge meta={workshopOrderMeta(o.status)} /></td>
                  <td className="text-right">{o.quotedPrice ? formatVnd(o.quotedPrice) : <span className="text-base-content/40">—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
