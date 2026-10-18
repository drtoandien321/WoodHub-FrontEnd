import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminDashboardSummary, useAdminDashboardTimeseries, useAdminDashboardTop } from '../../hooks/useAdminDashboard.js';
import StatCard from '../../components/supplier/StatCard.jsx';
import RevenueChart from '../../components/supplier/RevenueChart.jsx';
import DailyBarChart from '../../components/admin/DailyBarChart.jsx';
import { Wallet, Users, Briefcase, Package, CreditCard, Bolt, Star } from '../../components/suppliers/icons.jsx';
import { formatVnd } from '../../utils/format.js';
import { startOfDayIso, endOfDayIso, toYmd } from '../../utils/dateRange.js';

// Khoảng thời gian nhanh. days = null → toàn bộ (không gửi from/to)
const RANGES = [
  { key: '7d', label: '7 ngày qua', days: 7 },
  { key: '30d', label: '30 ngày qua', days: 30 },
  { key: '90d', label: '90 ngày qua', days: 90 },
  { key: 'all', label: 'Toàn bộ', days: null },
];

const pct = (n) => `${Math.round((n ?? 0) * 100)}%`;
const SUPPLIER_STATUS = { pending: 'Chờ duyệt', active: 'Hoạt động', suspended: 'Tạm khóa' };
const PRODUCT_STATUS = { draft: 'Nháp', active: 'Đang bán', hidden: 'Ẩn' };
const ROLE_LABEL = { customer: 'Khách hàng', supplier: 'Nhà cung cấp', admin: 'Quản trị' };

const errorText = (error) => {
  const s = error?.response?.status;
  if (s === 403) return 'Bạn không có quyền xem dashboard (chỉ dành cho quản trị viên).';
  if (s === 400) return 'Khoảng thời gian không hợp lệ.';
  return 'Không tải được dữ liệu dashboard. Vui lòng thử lại.';
};

// BE chỉ trả ngày CÓ dữ liệu → điền 0 cho ngày trống để biểu đồ liền mạch (tối đa 366 điểm)
const fillDays = (rows = [], pick, fromYmd, toYmdStr) => {
  if (!rows.length && !(fromYmd && toYmdStr)) return [];
  const map = new Map(rows.map((r) => [r.date, r]));
  const start = fromYmd || rows[0].date;
  const end = toYmdStr || rows[rows.length - 1].date;
  const out = [];
  const cur = new Date(`${start}T00:00:00`);
  const last = new Date(`${end}T00:00:00`);
  for (let i = 0; cur <= last && i < 366; i++, cur.setDate(cur.getDate() + 1)) {
    const ymd = toYmd(cur);
    out.push({ date: `${ymd.slice(8)}/${ymd.slice(5, 7)}`, ...pick(map.get(ymd)) });
  }
  return out;
};

// Thanh phân bố (role / status): mỗi dòng nhãn + số + thanh tỷ lệ
function Breakdown({ title, items, total }) {
  return (
    <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
      <h2 className="mb-3 font-display text-lg">{title}</h2>
      <ul className="flex flex-col gap-3">
        {items.map((it) => (
          <li key={it.label}>
            <div className="flex justify-between text-sm">
              <span>{it.label}</span><span className="font-medium">{it.value}</span>
            </div>
            <progress className="progress progress-primary w-full" value={it.value} max={Math.max(total, 1)} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function ChartCard({ title, children, empty }) {
  return (
    <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
      <h2 className="mb-3 font-display text-lg">{title}</h2>
      {empty ? <p className="py-10 text-center text-sm text-base-content/50">Chưa có dữ liệu trong khoảng này.</p> : children}
    </section>
  );
}

export default function AdminDashboard() {
  const [rangeKey, setRangeKey] = useState('30d');
  const days = RANGES.find((r) => r.key === rangeKey).days;

  // useMemo để params ổn định giữa các lần render → không bắn request lặp
  const { params, fromYmd, toYmdStr } = useMemo(() => {
    if (!days) return { params: {}, fromYmd: undefined, toYmdStr: undefined };
    const today = new Date();
    const start = new Date();
    start.setDate(today.getDate() - (days - 1));
    const f = toYmd(start);
    const t = toYmd(today);
    return { params: { from: startOfDayIso(f), to: endOfDayIso(t) }, fromYmd: f, toYmdStr: t };
  }, [days]);

  const summary = useAdminDashboardSummary(params);
  const series = useAdminDashboardTimeseries(params);
  const top = useAdminDashboardTop({ ...params, limit: 5 });

  const s = summary.data;
  const revenueSeries = useMemo(
    () => fillDays(series.data?.revenue, (r) => ({ value: r?.revenue ?? 0 }), fromYmd, toYmdStr),
    [series.data, fromYmd, toYmdStr],
  );
  const usersSeries = useMemo(
    () => fillDays(series.data?.newUsers, (r) => ({ value: r?.count ?? 0 }), fromYmd, toYmdStr),
    [series.data, fromYmd, toYmdStr],
  );
  const aiSeries = useMemo(
    () => fillDays(series.data?.aiTasks, (r) => ({ value: r?.count ?? 0, extra: r?.failed ? `${r.failed} lỗi` : '' }), fromYmd, toYmdStr),
    [series.data, fromYmd, toYmdStr],
  );
  const ordersSeries = useMemo(
    () => fillDays(series.data?.customOrders, (r) => ({ value: r?.count ?? 0 }), fromYmd, toYmdStr),
    [series.data, fromYmd, toYmdStr],
  );
  const hasData = (arr) => arr.some((d) => d.value > 0);

  const firstError = summary.error || series.error || top.error;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Tổng quan hệ thống</h1>
          <p className="mt-1 text-base-content/60">Số liệu toàn sàn: người dùng, doanh thu, gói đăng ký, nhà cung cấp và AI.</p>
        </div>
        <select
          className="select select-bordered select-sm w-40"
          value={rangeKey}
          onChange={(e) => setRangeKey(e.target.value)}
          aria-label="Khoảng thời gian"
        >
          {RANGES.map((r) => <option key={r.key} value={r.key}>{r.label}</option>)}
        </select>
      </header>

      {firstError && (
        <div role="alert" className="alert alert-error">
          <span>{errorText(firstError)}</span>
        </div>
      )}

      {summary.isLoading && <div className="py-16 text-center"><span className="loading loading-spinner loading-lg text-primary" /></div>}

      {s && (
        <>
          {/* KPI hàng đầu */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Wallet} label="Doanh thu (đã thanh toán)" value={s.revenue.totalRevenue} money
              hint={`${s.revenue.paidCount}/${s.revenue.totalCount} giao dịch · thành công ${pct(s.revenue.successRate)}`} to="/admin/payments" />
            <StatCard icon={Users} label="Tổng người dùng" value={s.users.total}
              hint={`+${s.users.newInPeriod} mới trong kỳ · ${s.users.activeRecently} hoạt động 24h`} to="/admin/users"
              iconWrap="bg-info/10 text-info" />
            <StatCard icon={CreditCard} label="Gói đang hoạt động" value={s.subscriptions.activeTotal}
              hint={`${s.subscriptions.expiringIn7Days} gói hết hạn trong 7 ngày`} to="/admin/subscription-plans"
              iconWrap="bg-success/10 text-success" />
            <StatCard icon={Wallet} label="MRR ước tính" value={s.subscriptions.estimatedMrr} money
              hint="Tổng giá gói của các đăng ký active" iconWrap="bg-warning/10 text-warning" />
          </div>

          {/* Biểu đồ doanh thu + user mới */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
            <ChartCard title="Doanh thu theo ngày" empty={!hasData(revenueSeries)}>
              <RevenueChart data={revenueSeries} ariaLabel="Biểu đồ doanh thu theo ngày" />
            </ChartCard>
            <ChartCard title="Người dùng mới" empty={!hasData(usersSeries)}>
              <DailyBarChart data={usersSeries} ariaLabel="Người dùng mới theo ngày" unit=" user" />
            </ChartCard>
          </div>

          {/* KPI phụ */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard icon={Briefcase} label="Nhà cung cấp" value={s.suppliers.total}
              hint={`${s.suppliers.byStatus.pending} chờ duyệt`} to="/admin/suppliers" />
            <StatCard icon={Package} label="Sản phẩm" value={s.products.total}
              hint={`${s.products.storeCount} chi nhánh`} />
            <StatCard icon={Bolt} label="Phiên chat AI" value={s.ai.chatSessions}
              hint={`${s.ai.aiMessagesInPeriod} tin AI trong kỳ`} iconWrap="bg-info/10 text-info" />
            <StatCard icon={Star} label="Task sinh 3D" value={s.ai.gen3dTasks}
              hint={`Tỷ lệ lỗi ${pct(s.ai.gen3dFailedRate)}`} iconWrap="bg-error/10 text-error" />
          </div>

          {/* AI + đơn custom */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <ChartCard title="Task AI theo ngày" empty={!hasData(aiSeries)}>
              <DailyBarChart data={aiSeries} ariaLabel="Task AI theo ngày" unit=" task" />
            </ChartCard>
            <ChartCard title="Đơn custom theo ngày" empty={!hasData(ordersSeries)}>
              <DailyBarChart data={ordersSeries} ariaLabel="Đơn custom theo ngày" unit=" đơn" />
            </ChartCard>
          </div>

          {/* Phân bố */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Breakdown title="Người dùng theo vai trò" total={s.users.total}
              items={Object.entries(s.users.byRole).map(([k, v]) => ({ label: ROLE_LABEL[k] ?? k, value: v }))} />
            <Breakdown title="Nhà cung cấp theo trạng thái" total={s.suppliers.total}
              items={Object.entries(s.suppliers.byStatus).map(([k, v]) => ({ label: SUPPLIER_STATUS[k] ?? k, value: v }))} />
            <Breakdown title="Sản phẩm theo trạng thái" total={s.products.total}
              items={Object.entries(s.products.byStatus).map(([k, v]) => ({ label: PRODUCT_STATUS[k] ?? k, value: v }))} />
          </div>
        </>
      )}

      {/* Bảng xếp hạng */}
      {top.data && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
            <h2 className="mb-3 font-display text-lg">Gói bán chạy</h2>
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr className="text-base-content/55"><th>#</th><th>Gói</th><th className="text-right">Lượt bán</th><th className="text-right">Doanh thu</th></tr></thead>
                <tbody>
                  {top.data.topPlans.length === 0 && <tr><td colSpan={4} className="text-center text-base-content/50">Chưa có dữ liệu</td></tr>}
                  {top.data.topPlans.map((p, i) => (
                    <tr key={p.planName} className="hover:bg-base-200/50">
                      <td className="text-base-content/50">{i + 1}</td><td className="font-medium">{p.planName}</td>
                      <td className="text-right">{p.sales}</td><td className="text-right font-medium">{formatVnd(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
            <h2 className="mb-3 font-display text-lg">Xưởng doanh thu cao</h2>
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr className="text-base-content/55"><th>#</th><th>Xưởng</th><th className="text-right">Đơn</th><th className="text-right">Doanh thu</th></tr></thead>
                <tbody>
                  {top.data.topSuppliers.length === 0 && <tr><td colSpan={4} className="text-center text-base-content/50">Chưa có dữ liệu</td></tr>}
                  {top.data.topSuppliers.map((p, i) => (
                    <tr key={p.supplierId} className="hover:bg-base-200/50">
                      <td className="text-base-content/50">{i + 1}</td>
                      <td><Link to={`/admin/suppliers/${p.supplierId}`} className="font-medium hover:text-primary">{p.name}</Link></td>
                      <td className="text-right">{p.orderCount}</td><td className="text-right font-medium">{formatVnd(p.revenue)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
