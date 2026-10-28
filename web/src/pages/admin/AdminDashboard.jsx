import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminDashboardSummary, useAdminDashboardTimeseries, useAdminDashboardTop, useAdminDashboardTraffic, useAdminPaidSales, useAdminReviewAverage } from '../../hooks/useAdminDashboard.js';
import StatCard from '../../components/supplier/StatCard.jsx';
import RevenueChart from '../../components/supplier/RevenueChart.jsx';
import DailyBarChart from '../../components/admin/DailyBarChart.jsx';
import { Wallet, Users, Briefcase, Package, CreditCard, Bolt, Star } from '../../components/suppliers/icons.jsx';
import { formatVnd } from '../../utils/format.js';
import { startOfDayIso, endOfDayIso, toYmd } from '../../utils/dateRange.js';
import { PRODUCT_STATUS } from '../../utils/supplierStatus.js';
import { ROLE_LABEL, supplierAdminMeta } from '../../utils/adminStatus.js';
import { useAdminFeedbackSummary, FEEDBACK_ENABLED } from '../../hooks/usePlatformFeedback.js';

// Khoảng thời gian nhanh. days = null → toàn bộ (không gửi from/to)
const RANGES = [
  { key: '7d', label: '7 ngày qua', days: 7 },
  { key: '30d', label: '30 ngày qua', days: 30 },
  { key: '90d', label: '90 ngày qua', days: 90 },
  { key: 'all', label: 'Toàn bộ', days: null },
];
// 'YYYY-MM-DD' → 'dd/MM/yyyy' (cắt chuỗi, không qua Date để khỏi lệch ngày do múi giờ)
const formatYmd = (ymd) => `${ymd.slice(8, 10)}/${ymd.slice(5, 7)}/${ymd.slice(0, 4)}`;

const pct = (n) => `${Math.round((n ?? 0) * 100)}%`;

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

/*
 * Ô KPI thứ 4 — Đánh giá người dùng. Số chính = điểm trung bình đánh giá WEB + APP (docs/BE-platform-feedback.md);
 * dòng phụ tách Web / App / Sản phẩm & NCC. BE chưa làm đánh giá nền tảng (FEEDBACK_ENABLED = false) hoặc chưa có lượt nào
 * → số chính tạm lấy điểm sản phẩm & NCC (bảng reviews) và ghi rõ nguồn, không để ô trống.
 */
const fmtRating = (r) => (r == null ? '—' : `★ ${Number(r).toFixed(1)}`);
function RatingStatCard({ platform, reviews }) {
  const app = platform && ['android', 'ios'].map((k) => platform.byPlatform?.[k]).filter((x) => x?.count);
  const appCount = app?.reduce((n, x) => n + x.count, 0) ?? 0;
  const appAvg = appCount ? app.reduce((n, x) => n + x.avgRating * x.count, 0) / appCount : null;
  const hasPlatform = platform?.count > 0;
  const parts = [
    hasPlatform && `Web ${fmtRating(platform.byPlatform?.web?.count ? platform.byPlatform.web.avgRating : null)} (${platform.byPlatform?.web?.count ?? 0})`,
    hasPlatform && `App ${fmtRating(appAvg)} (${appCount})`,
    reviews && `Sản phẩm & NCC ${fmtRating(reviews.avgRating)} (${reviews.count})`,
    !FEEDBACK_ENABLED && 'đánh giá web/app: chờ BE',
  ].filter(Boolean);
  // Số chính là điểm web/app → bấm mở trang Đánh giá WoodHub; chưa có lượt nào thì mở kiểm duyệt đánh giá SP & NCC
  return (
    <StatCard icon={Star} label={hasPlatform ? `Đánh giá người dùng · ${platform.count} lượt` : 'Đánh giá người dùng'}
      value={hasPlatform ? fmtRating(platform.avgRating) : fmtRating(reviews?.avgRating)}
      hint={parts.join(' · ') || 'Đang tải…'} to={hasPlatform ? '/admin/feedback' : '/admin/reviews'} iconWrap="bg-warning/10 text-warning" />
  );
}

function ChartCard({ title, children, empty }) {
  return (
    <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
      <h2 className="mb-3 font-display text-lg">{title}</h2>
      {empty ? <p className="py-10 text-center text-sm text-base-content/70">Chưa có dữ liệu trong khoảng này.</p> : children}
    </section>
  );
}

const formatDuration = (sec = 0) => `${Math.floor(sec / 60)}p ${String(Math.round(sec % 60)).padStart(2, '0')}s`;
const SOURCE_LABEL = { '(direct)': 'Truy cập trực tiếp', '(not set)': 'Không xác định' };

/*
 * TrafficSection — lượt truy cập web từ GA4 (GET /admin/dashboard/traffic), gồm cả khách CHƯA đăng
 * nhập (khác các số khác trên dashboard chỉ đếm user trong DB). Mentor cần số này để đo hiệu quả
 * khi đăng link lên Facebook/TikTok → khối "Nguồn truy cập" là phần quan trọng nhất.
 *  - 503: BE chưa cấu hình GA → ẨN cả khối (không làm hỏng dashboard), đúng yêu cầu trong doc.
 *  - 502: GA lỗi/hết quota → báo lỗi nhỏ ngay tại khối, các khối khác vẫn chạy.
 *  - "Toàn bộ" (không from/to) → BE tự lấy 30 ngày gần nhất, nên ghi rõ trên tiêu đề.
 */
function TrafficSection({ params, fromYmd, toYmdStr }) {
  const traffic = useAdminDashboardTraffic({ ...params, limit: 5 });
  const t = traffic.data;
  const daySeries = useMemo(
    () => fillDays(t?.byDay, (r) => ({ value: r?.users ?? 0, extra: r ? `${r.pageViews} lượt xem` : '' }), fromYmd, toYmdStr),
    [t, fromYmd, toYmdStr],
  );

  if (traffic.error?.response?.status === 503) return null;

  return (
    <section className="flex flex-col gap-4 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-display text-lg">Lượt truy cập website {!params.from && <span className="text-sm font-normal text-base-content/70">(30 ngày gần nhất)</span>}</h2>
          <p className="text-xs text-base-content/70">Nguồn Google Analytics 4 · gồm cả khách chưa đăng nhập · số liệu trễ 24–48 giờ (trừ "đang online")</p>
        </div>
        {t?.realtime && (
          <span className="flex items-center gap-1.5 rounded-full bg-success/10 px-3 py-1 text-xs font-medium text-success">
            <span className="h-2 w-2 animate-pulse rounded-full bg-success" aria-hidden="true" />
            {t.realtime.activeUsers} đang online (30 phút)
          </span>
        )}
      </div>

      {traffic.isLoading ? (
        <div className="skeleton h-40 rounded-xl" />
      ) : traffic.error ? (
        <div role="alert" className="flex items-center justify-between gap-3 rounded-xl bg-error/10 px-4 py-3 text-sm text-error">
          <span>Không lấy được số liệu Google Analytics (dịch vụ lỗi hoặc hết hạn mức). Các số liệu khác không bị ảnh hưởng.</span>
          <button onClick={() => traffic.refetch()} className="btn btn-ghost btn-xs">Thử lại</button>
        </div>
      ) : t && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {[
              ['Người truy cập', t.totals.activeUsers.toLocaleString('vi-VN')],
              ['Người mới', t.totals.newUsers.toLocaleString('vi-VN')],
              ['Phiên', t.totals.sessions.toLocaleString('vi-VN')],
              ['Lượt xem trang', t.totals.pageViews.toLocaleString('vi-VN')],
              ['Tỷ lệ tương tác', pct(t.totals.engagementRate)],
              ['Thời gian / phiên', formatDuration(t.totals.avgSessionSeconds)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-xl bg-base-200/50 px-3 py-2.5">
                <p className="text-xs text-base-content/70">{label}</p>
                <p className="mt-0.5 text-lg font-semibold tabular-nums">{value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
            <div>
              <h3 className="mb-2 text-sm font-medium">Người truy cập theo ngày</h3>
              {daySeries.some((d) => d.value > 0)
                ? <DailyBarChart data={daySeries} ariaLabel="Người truy cập theo ngày" unit=" người" />
                : <p className="py-10 text-center text-sm text-base-content/70">Chưa có dữ liệu trong khoảng này.</p>}
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium">Nguồn truy cập</h3>
              {!t.bySource.length ? <p className="text-sm text-base-content/70">Chưa có dữ liệu.</p> : (
                <ul className="flex flex-col gap-2.5">
                  {t.bySource.map((s) => (
                    <li key={`${s.source}/${s.medium}`}>
                      <div className="flex justify-between gap-2 text-sm">
                        <span className="truncate">{SOURCE_LABEL[s.source] ?? s.source} <span className="text-xs text-base-content/70">/ {s.medium}</span></span>
                        <span className="shrink-0 font-medium tabular-nums">{s.users.toLocaleString('vi-VN')}</span>
                      </div>
                      <progress className="progress progress-primary w-full" value={s.users} max={Math.max(t.totals.activeUsers, 1)} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-medium">Trang được xem nhiều</h3>
            <div className="overflow-x-auto">
              <table className="table table-sm">
                <thead><tr className="text-base-content/70"><th>Trang</th><th className="text-right">Lượt xem</th><th className="text-right">Người xem</th></tr></thead>
                <tbody>
                  {!t.topPages.length && <tr><td colSpan={3} className="text-center text-base-content/70">Chưa có dữ liệu</td></tr>}
                  {t.topPages.map((p) => (
                    <tr key={p.path} className="hover:bg-base-200/50">
                      <td className="font-mono text-xs">{p.path}</td>
                      <td className="text-right tabular-nums">{p.views.toLocaleString('vi-VN')}</td>
                      <td className="text-right tabular-nums">{p.users.toLocaleString('vi-VN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default function AdminDashboard() {
  // Mặc định "Toàn bộ" (chốt của chủ dự án): mentor cần thấy tổng doanh thu ngay; muốn xem theo kỳ thì tự chọn bộ lọc
  const [rangeKey, setRangeKey] = useState('all');
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

  /*
   * Nhãn kỳ + link sang trang Thanh toán CÙNG khoảng ngày. Trước đây ô KPI tính theo kỳ (mặc định 30 ngày) nhưng link
   * mở Payments không lọc ngày → số "đã thanh toán" 2 bên lệch nhau (vd 2 ↔ 4) dù cả hai đều đúng.
   */
  const rangeLabel = RANGES.find((r) => r.key === rangeKey).label;
  const paymentsLink = (extra = {}) => {
    const qs = new URLSearchParams({ ...(fromYmd ? { from: fromYmd, to: toYmdStr } : {}), ...extra }).toString();
    return qs ? `/admin/payments?${qs}` : '/admin/payments';
  };

  const summary = useAdminDashboardSummary(params);
  const series = useAdminDashboardTimeseries(params);
  const top = useAdminDashboardTop({ ...params, limit: 5 });
  const sales = useAdminPaidSales(params);
  const reviewAvg = useAdminReviewAverage();
  const feedback = useAdminFeedbackSummary(params);

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
          <p className="mt-1 text-base-content/70">Số liệu toàn sàn: người dùng, doanh thu, gói đăng ký, nhà cung cấp và AI.</p>
          <p className="mt-1 text-sm text-base-content/70">
            Kỳ đang xem: <span className="font-medium text-base-content">{rangeLabel}</span>
            {fromYmd && ` (${formatYmd(fromYmd)} – ${formatYmd(toYmdStr)})`}
            {' · '}Doanh thu & lượt mua tính trong kỳ; tổng người dùng, nhà cung cấp, sản phẩm là toàn bộ.
          </p>
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
              hint={`${rangeLabel}: ${s.revenue.paidCount}/${s.revenue.totalCount} giao dịch · thành công ${pct(s.revenue.successRate)}`} to={paymentsLink()} />
            <StatCard icon={Users} label="Tổng người dùng" value={s.users.total}
              hint={`+${s.users.newInPeriod} mới trong kỳ · ${s.users.activeRecently} hoạt động 24h`} to="/admin/users"
              iconWrap="bg-info/10 text-info" />
            {/* Lượt thanh toán thành công: gói đăng ký, gói thiết kế, đơn hàng, đơn custom (không tính gói Free — 0đ) */}
            <StatCard icon={CreditCard} label="Lượt mua (thanh toán thành công)" value={sales.data?.total ?? '…'}
              hint={sales.data
                ? `${rangeLabel}: ${sales.data.subscriptions} gói đăng ký · ${sales.data.creditPacks} gói thiết kế · ${sales.data.orders} đơn hàng · ${sales.data.customPayments} thanh toán custom · ${sales.data.buyers} tài khoản · ${formatVnd(sales.data.revenue)}`
                : 'Đang tải…'}
              to={paymentsLink({ status: 'paid' })} iconWrap="bg-success/10 text-success" />
            <RatingStatCard platform={feedback.data} reviews={reviewAvg.data} />
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
              items={Object.entries(s.suppliers.byStatus).map(([k, v]) => ({ label: supplierAdminMeta(k).label, value: v }))} />
            <Breakdown title="Sản phẩm theo trạng thái" total={s.products.total}
              items={Object.entries(s.products.byStatus).map(([k, v]) => ({ label: PRODUCT_STATUS[k]?.label ?? k, value: v }))} />
          </div>
        </>
      )}

      {/* Lượt truy cập GA4 — độc lập với summary: lỗi/chưa cấu hình GA không ảnh hưởng các khối khác */}
      <TrafficSection params={params} fromYmd={fromYmd} toYmdStr={toYmdStr} />

      {/* Bảng xếp hạng */}
      {top.data && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
            <h2 className="mb-3 font-display text-lg">Gói bán chạy</h2>
            <div className="overflow-x-auto">
              <table className="table">
                <thead><tr className="text-base-content/70"><th>#</th><th>Gói</th><th className="text-right">Lượt bán</th><th className="text-right">Doanh thu</th></tr></thead>
                <tbody>
                  {top.data.topPlans.length === 0 && <tr><td colSpan={4} className="text-center text-base-content/70">Chưa có dữ liệu</td></tr>}
                  {top.data.topPlans.map((p, i) => (
                    <tr key={p.planName} className="hover:bg-base-200/50">
                      <td className="text-base-content/70">{i + 1}</td><td className="font-medium">{p.planName}</td>
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
                <thead><tr className="text-base-content/70"><th>#</th><th>Xưởng</th><th className="text-right">Đơn</th><th className="text-right">Doanh thu</th></tr></thead>
                <tbody>
                  {top.data.topSuppliers.length === 0 && <tr><td colSpan={4} className="text-center text-base-content/70">Chưa có dữ liệu</td></tr>}
                  {top.data.topSuppliers.map((p, i) => (
                    <tr key={p.supplierId} className="hover:bg-base-200/50">
                      <td className="text-base-content/70">{i + 1}</td>
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
