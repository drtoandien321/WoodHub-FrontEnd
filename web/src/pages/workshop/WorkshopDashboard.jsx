import { Link } from 'react-router-dom';
import { formatVnd, formatDate } from '../../utils/format.js';
import { useIncomingQuotes, useIncomingCustomOrders } from '../../hooks/useQuotes.js';
import { useReviewSummary } from '../../hooks/useReviews.js';
import { useSupplierMe } from '../../hooks/useSupplierMe.js';
import { pageInfoOf } from '../../hooks/useOrders.js';
import { quoteMeta } from '../../utils/quoteStatus.js';
import { computeOrderStats, STATS_PAGE_SIZE } from '../../utils/supplierStats.js';
import StatCard from '../../components/supplier/StatCard.jsx';
import StatusBadge from '../../components/supplier/StatusBadge.jsx';
import RevenueChart from '../../components/supplier/RevenueChart.jsx';
import { Package, Briefcase, Tool, Star, CheckCircle } from '../../components/suppliers/icons.jsx';

const LIST_PARAMS = { page: 0, size: STATS_PAGE_SIZE };
const NEED_ACTION = new Set(['pending', 'negotiating']);

/*
 * Dashboard xưởng — dữ liệu THẬT (lỗi QA 20/10: trước đây toàn bộ KPI/đơn/biểu đồ lấy từ file mock).
 *  - Báo giá: GET /quotes/incoming · Đơn sản xuất: GET /custom-orders/incoming · Đánh giá: /reviews/summary
 * Đơn custom CHƯA có thanh toán qua sàn (docx BE bản 2, BE-01) → biểu đồ là "giá trị đơn đã chốt", không gọi là doanh thu.
 */
export default function WorkshopDashboard() {
  const quotesQuery = useIncomingQuotes(LIST_PARAMS);
  const ordersQuery = useIncomingCustomOrders(LIST_PARAMS);
  const quotes = quotesQuery.data?.content ?? [];
  const orders = ordersQuery.data?.content ?? [];
  const { data: me } = useSupplierMe();
  const { data: rating } = useReviewSummary('supplier', me?.id);

  const needAction = quotes.filter((q) => NEED_ACTION.has(q.status));
  const activeOrders = orders.filter((o) => o.status !== 'cancelled');
  // Tái dùng hàm gom theo ngày: coi đơn custom (khác cancelled) như đơn "đã chốt" để vẽ giá trị theo ngày tạo
  const valueStats = computeOrderStats(activeOrders.map((o) => ({ ...o, status: 'confirmed' })));

  const loading = quotesQuery.isLoading || ordersQuery.isLoading;
  const quoteTotal = pageInfoOf(quotesQuery.data)?.totalElements ?? quotes.length;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl">Tổng quan</h1>
        <p className="mt-1 text-base-content/60">Chào mừng trở lại! Đây là tình hình báo giá và sản xuất của xưởng.</p>
        {quoteTotal > quotes.length && (
          <p className="mt-2 text-xs text-base-content/50">Số liệu tính trên {quotes.length} yêu cầu báo giá gần nhất (tổng {quoteTotal}).</p>
        )}
      </header>

      {(quotesQuery.isError || ordersQuery.isError) && (
        <p className="rounded-xl bg-error/10 p-4 text-sm text-error">
          Không tải được dữ liệu. <button onClick={() => { quotesQuery.refetch(); ordersQuery.refetch(); }} className="link">Thử lại</button>
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          [0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-24 rounded-2xl" />)
        ) : (
          <>
            <StatCard icon={Package} label="Yêu cầu chờ phản hồi" value={quotes.filter((q) => q.status === 'pending').length} to="/portal/workshop/orders" iconWrap="bg-warning/15 text-warning" />
            <StatCard icon={Briefcase} label="Đang thương lượng" value={quotes.filter((q) => q.status === 'negotiating').length} to="/portal/workshop/orders" />
            <StatCard icon={Tool} label="Đang sản xuất" value={orders.filter((o) => o.status === 'in_production').length} to="/portal/workshop/production" />
            <StatCard icon={Star} label="Đánh giá xưởng" value={rating?.count ? `${rating.average.toFixed(1)}/5` : '—'} hint={rating ? `${rating.count} đánh giá` : undefined} to="/portal/workshop/reviews" iconWrap="bg-warning/15 text-warning" />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="min-w-0 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="font-display text-lg">Giá trị đơn đã chốt — 7 ngày qua</h2>
            <span className="text-sm font-semibold text-primary">{formatVnd(valueStats.revenueInRange)}</span>
          </div>
          {loading ? (
            <div className="skeleton h-48 rounded-xl" />
          ) : valueStats.revenueInRange === 0 ? (
            <p className="py-12 text-center text-sm text-base-content/50">Chưa có đơn custom nào được chốt trong 7 ngày qua.</p>
          ) : (
            <RevenueChart data={valueStats.revenueByDay} ariaLabel="Giá trị đơn custom 7 ngày" />
          )}
        </section>

        <section className="min-w-0 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg">Yêu cầu báo giá gần đây</h2>
            <Link to="/portal/workshop/orders" className="text-sm text-primary hover:underline">Xem tất cả</Link>
          </div>
          {loading ? (
            <div className="flex flex-col gap-2">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-14 rounded-xl" />)}</div>
          ) : !quotes.length ? (
            <p className="py-6 text-center text-sm text-base-content/50">Chưa có yêu cầu báo giá nào.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {quotes.slice(0, 3).map((q) => (
                <li key={q.id}>
                  <Link to={`/quotes/${q.id}`} className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-base-200">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{q.customerName} · SL {q.quantity}</p>
                      <p className="truncate text-xs text-base-content/50">{formatDate(q.createdAt)}</p>
                    </div>
                    <StatusBadge meta={quoteMeta(q.status)} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard icon={CheckCircle} label="Đơn hoàn thành" value={loading ? '…' : orders.filter((o) => o.status === 'completed').length} to="/portal/workshop/production" iconWrap="bg-success/15 text-success" />
        <StatCard icon={Briefcase} label="Báo giá đã chốt" value={loading ? '…' : quotes.filter((q) => q.status === 'accepted').length} />
        <StatCard icon={Package} label="Tổng giá trị đơn đang làm" value={loading ? 0 : activeOrders.filter((o) => o.status !== 'completed').reduce((s, o) => s + (Number(o.totalAmount) || 0), 0)} money />
      </div>

      <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
        <h2 className="mb-3 font-display text-lg">Yêu cầu cần xử lý</h2>
        {loading ? (
          <div className="skeleton h-24 rounded-xl" />
        ) : !needAction.length ? (
          <p className="py-6 text-center text-sm text-base-content/50">Không có yêu cầu nào đang chờ bạn.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead><tr className="text-base-content/55"><th>Khách hàng</th><th>Số lượng</th><th>Ngày gửi</th><th>Trạng thái</th><th className="text-right">Giá đề xuất gần nhất</th></tr></thead>
              <tbody>
                {needAction.map((q) => (
                  <tr key={q.id} className="hover:bg-base-200/50">
                    <td><Link to={`/quotes/${q.id}`} className="font-medium hover:text-primary">{q.customerName}</Link></td>
                    <td>{q.quantity}</td>
                    <td className="text-sm text-base-content/70">{formatDate(q.createdAt)}</td>
                    <td><StatusBadge meta={quoteMeta(q.status)} /></td>
                    <td className="text-right">{q.latestOfferPrice ? formatVnd(q.latestOfferPrice) : <span className="text-base-content/40">—</span>}</td>
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
