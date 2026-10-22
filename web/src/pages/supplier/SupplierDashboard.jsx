import { Link } from 'react-router-dom';
import { useQueries } from '@tanstack/react-query';
import { api } from '../../api/client.js';
import { formatVnd, formatDate } from '../../utils/format.js';
import { useManagedOrders } from '../../hooks/useOrderManagement.js';
import { pageInfoOf } from '../../hooks/useOrders.js';
import { useMyProducts } from '../../hooks/useMyProducts.js';
import { useMyStores } from '../../hooks/useStores.js';
import { useSupplierStatsSummary, useSupplierStatsTimeseries } from '../../hooks/useSupplierStats.js';
import { statsRange } from '../../utils/statsRange.js';
import { ORDER_STATUS_LABEL, ORDER_STATUS_BADGE } from '../../utils/orderStatus.js';
import StatCard from '../../components/supplier/StatCard.jsx';
import RevenueChart from '../../components/supplier/RevenueChart.jsx';
import { Wallet, ShoppingBag, Package, Star, Clock, Truck } from '../../components/suppliers/icons.jsx';

// params ngoài component → object ổn định giữa các lần render (queryKey không đổi, không fetch lặp)
const RANGE_30D = (() => { const { from, to } = statsRange('30d'); return { from, to }; })();
const RANGE_7D = (() => { const { from, to } = statsRange('7d'); return { from, to, granularity: 'day' }; })();
const RECENT_PARAMS = { page: 0, size: 3 };
const COUNT_ONLY = { page: 0, size: 1 }; // chỉ cần page.totalElements
const NEED_CONFIRM_PARAMS = { status: 'paid', ...COUNT_ONLY };
const AWAITING_PAYMENT_PARAMS = { status: 'pending_payment', ...COUNT_ONLY };

/*
 * Dashboard NCC — số liệu từ API thống kê BE-09 (GET /supplier/stats/summary | timeseries), tính ở BE trên TOÀN BỘ đơn.
 * Trước đây FE tự cộng từ 200 đơn mới nhất (utils/supplierStats.js) vì BE chưa có API → NCC nhiều đơn sẽ lệch số.
 *
 *  - KPI doanh thu / thực nhận / số đơn: 30 ngày gần nhất (giờ VN), chỉ tính đơn đã thanh toán.
 *  - "Cần xác nhận": totalElements của GET /supplier/orders?status=paid — docs BE dặn KHÔNG dùng pendingOrders
 *    (pendingOrders gồm cả confirmed + processing) → pendingOrders dùng cho thẻ "Đang xử lý".
 *  - Hiệu suất chi nhánh: summary lọc theo từng storeId (mỗi chi nhánh 1 request; NCC thường ít chi nhánh).
 */
export default function SupplierDashboard() {
  const summary = useSupplierStatsSummary(RANGE_30D);
  const series = useSupplierStatsTimeseries(RANGE_7D);
  const recent = useManagedOrders('supplier', RECENT_PARAMS);
  const needConfirm = useManagedOrders('supplier', NEED_CONFIRM_PARAMS);
  const awaitingPayment = useManagedOrders('supplier', AWAITING_PAYMENT_PARAMS);
  const products = useMyProducts(COUNT_ONLY);
  const stores = useMyStores();

  const s = summary.data;
  const recentList = recent.data?.content ?? [];
  const countOf = (q) => (q.isLoading ? '…' : pageInfoOf(q.data)?.totalElements ?? 0);
  const chartData = (series.data?.points ?? []).map((p) => ({ date: `${p.date.slice(8, 10)}/${p.date.slice(5, 7)}`, value: Number(p.revenue) || 0 }));
  const revenue7d = chartData.reduce((sum, p) => sum + p.value, 0);

  // Summary từng chi nhánh (cùng kỳ 30 ngày) — useQueries vì số chi nhánh thay đổi theo NCC
  const branchQueries = useQueries({
    queries: (stores.data ?? []).map((b) => ({
      queryKey: ['supplierStats', 'summary', { ...RANGE_30D, storeId: b.id }],
      queryFn: () => api.getSupplierStatsSummary({ ...RANGE_30D, storeId: b.id }),
      staleTime: 60_000,
    })),
  });
  const branches = (stores.data ?? [])
    .map((b, i) => ({ store: b, stats: branchQueries[i]?.data, loading: branchQueries[i]?.isLoading }))
    .sort((a, b) => (Number(b.stats?.revenue) || 0) - (Number(a.stats?.revenue) || 0));

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl">Tổng quan</h1>
        <p className="mt-1 text-base-content/60">Chào mừng trở lại! Đây là tổng quan hoạt động kinh doanh 30 ngày qua.</p>
      </header>

      {summary.isError && (
        <p className="rounded-xl bg-error/10 p-4 text-sm text-error">
          Không tải được số liệu thống kê. <button onClick={() => summary.refetch()} className="link">Thử lại</button>
        </p>
      )}

      {/* KPI hàng đầu */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summary.isLoading ? (
          [0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-24 rounded-2xl" />)
        ) : (
          <>
            <StatCard icon={Wallet} label="Doanh thu 30 ngày" value={s?.revenue ?? 0} money hint={s ? `Thực nhận ${formatVnd(s.netRevenue)} (sau hoa hồng ${Number(s.commissionRate)}%)` : undefined} to="/portal/supplier/reports" />
            <StatCard icon={Clock} label="Đơn cần xác nhận" value={countOf(needConfirm)} hint="Xác nhận trong 24 giờ" to="/portal/supplier/orders" iconWrap="bg-warning/15 text-warning" />
            <StatCard icon={Truck} label="Đang xử lý" value={s?.pendingOrders ?? 0} hint="Đã thanh toán → đang chuẩn bị" to="/portal/supplier/orders" />
            <StatCard
              icon={Star}
              label="Đánh giá"
              value={s?.rating != null ? `${Number(s.rating).toFixed(1)}/5` : '—'}
              hint={s ? `${s.reviewCount} đánh giá${s.unrepliedReviews ? ` · ${s.unrepliedReviews} cần phản hồi` : ''}` : undefined}
              to="/portal/supplier/reviews"
              iconWrap="bg-warning/15 text-warning"
            />
          </>
        )}
      </div>

      {/* Doanh thu + Đơn gần đây */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="min-w-0 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="font-display text-lg">Doanh thu 7 ngày qua</h2>
            <span className="text-sm font-semibold text-primary">{formatVnd(revenue7d)}</span>
          </div>
          {series.isLoading ? (
            <div className="skeleton h-48 rounded-xl" />
          ) : revenue7d === 0 ? (
            <p className="py-12 text-center text-sm text-base-content/50">Chưa có đơn đã thanh toán trong 7 ngày qua.</p>
          ) : (
            <RevenueChart data={chartData} />
          )}
        </section>

        <section className="min-w-0 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg">Đơn hàng gần đây</h2>
            <Link to="/portal/supplier/orders" className="text-sm text-primary hover:underline">Xem tất cả</Link>
          </div>
          {recent.isLoading ? (
            <div className="flex flex-col gap-2">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
          ) : !recentList.length ? (
            <p className="py-6 text-center text-sm text-base-content/50">Chưa có đơn hàng nào.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {recentList.map((o) => (
                <li key={o.id}>
                  <Link to="/portal/supplier/orders" className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-base-200">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        <span className="font-mono">{o.orderCode}</span> · {o.items?.[0]?.productName}{o.items?.length > 1 ? ` +${o.items.length - 1}` : ''}
                      </p>
                      <p className="truncate text-xs text-base-content/50">{o.recipientName} · {formatDate(o.placedAt ?? o.createdAt)}</p>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${ORDER_STATUS_BADGE[o.status] ?? ''}`}>
                        {o.status === 'paid' ? 'Cần xác nhận' : ORDER_STATUS_LABEL[o.status] ?? o.status}
                      </span>
                      <span className="text-sm font-semibold">{formatVnd(o.totalAmount)}</span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* KPI phụ */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={ShoppingBag} label="Đơn đã thanh toán (30 ngày)" value={summary.isLoading ? '…' : s?.orderCount ?? 0} hint={s ? `Giá trị TB ${formatVnd(s.avgOrderValue)}` : undefined} />
        <StatCard icon={Clock} label="Đơn chờ khách thanh toán" value={countOf(awaitingPayment)} hint="Khách vẫn quét lại QR cũ được" />
        <StatCard icon={Package} label="Sản phẩm" value={countOf(products)} to="/portal/supplier/products" />
      </div>

      {/* Hiệu suất chi nhánh — summary BE-09 lọc theo storeId */}
      <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
        <h2 className="mb-3 font-display text-lg">Hiệu suất chi nhánh (30 ngày)</h2>
        {stores.isLoading ? (
          <div className="skeleton h-24 rounded-xl" />
        ) : !branches.length ? (
          <p className="py-6 text-center text-sm text-base-content/50">Chưa có chi nhánh. <Link to="/portal/supplier/branches" className="link link-primary">Thêm chi nhánh</Link></p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr className="text-base-content/55">
                  <th>#</th><th>Chi nhánh</th><th className="text-right">Doanh thu</th><th className="text-right">Đơn đã thanh toán</th><th className="text-right">Giá trị TB</th>
                </tr>
              </thead>
              <tbody>
                {branches.map(({ store: b, stats, loading }, i) => (
                  <tr key={b.id} className="hover:bg-base-200/50">
                    <td className="text-base-content/50">{i + 1}</td>
                    <td>
                      <Link to={`/portal/supplier/branches/${b.id}`} className="font-medium hover:text-primary">{b.address}</Link>
                      <p className="text-xs text-base-content/45">{[b.district, b.city].filter(Boolean).join(', ')}</p>
                    </td>
                    <td className="text-right font-medium">{loading ? '…' : formatVnd(stats?.revenue ?? 0)}</td>
                    <td className="text-right">{loading ? '…' : stats?.orderCount ?? 0}</td>
                    <td className="text-right">{loading ? '…' : formatVnd(stats?.avgOrderValue ?? 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
