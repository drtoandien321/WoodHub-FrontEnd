import { Link } from 'react-router-dom';
import { formatVnd, formatDate } from '../../utils/format.js';
import { useManagedOrders } from '../../hooks/useOrderManagement.js';
import { pageInfoOf } from '../../hooks/useOrders.js';
import { useMyProducts } from '../../hooks/useMyProducts.js';
import { useReviewSummary } from '../../hooks/useReviews.js';
import { useSupplierMe } from '../../hooks/useSupplierMe.js';
import { ORDER_STATUS_LABEL, ORDER_STATUS_BADGE } from '../../utils/orderStatus.js';
import { computeOrderStats, STATS_PAGE_SIZE } from '../../utils/supplierStats.js';
import StatCard from '../../components/supplier/StatCard.jsx';
import RevenueChart from '../../components/supplier/RevenueChart.jsx';
import { Wallet, ShoppingBag, Package, Star, Clock, Truck } from '../../components/suppliers/icons.jsx';

// params ngoài component → object ổn định giữa các lần render (queryKey không đổi, không fetch lặp)
const STATS_PARAMS = { page: 0, size: STATS_PAGE_SIZE };
const PRODUCT_COUNT_PARAMS = { page: 0, size: 1 }; // chỉ cần totalElements

/*
 * Dashboard NCC — MỌI số liệu đều thật (lỗi QA 20/10: KPI/doanh thu/chi nhánh trước đây lấy từ file mock).
 * BE chưa có API thống kê cho supplier (docx BE bản 2, BE-09) nên KPI tính ở FE từ STATS_PAGE_SIZE đơn mới nhất
 * (utils/supplierStats.js). Nếu NCC có nhiều đơn hơn, trang ghi rõ "tính trên N đơn gần nhất".
 */
export default function SupplierDashboard() {
  const ordersQuery = useManagedOrders('supplier', STATS_PARAMS);
  const orders = ordersQuery.data?.content ?? [];
  const totalOrders = pageInfoOf(ordersQuery.data)?.totalElements ?? orders.length;
  const stats = computeOrderStats(orders);
  const recentList = orders.slice(0, 3);

  const { data: me } = useSupplierMe();
  const { data: rating } = useReviewSummary('supplier', me?.id);
  const products = useMyProducts(PRODUCT_COUNT_PARAMS);
  const productCount = pageInfoOf(products.data)?.totalElements;

  const loading = ordersQuery.isLoading;
  const truncated = totalOrders > orders.length;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl">Tổng quan</h1>
        <p className="mt-1 text-base-content/60">Chào mừng trở lại! Đây là tổng quan hoạt động kinh doanh của bạn.</p>
        {truncated && (
          <p className="mt-2 text-xs text-base-content/50">Số liệu tính trên {orders.length} đơn gần nhất (tổng {totalOrders} đơn).</p>
        )}
      </header>

      {ordersQuery.isError && (
        <p className="rounded-xl bg-error/10 p-4 text-sm text-error">
          Không tải được đơn hàng. <button onClick={() => ordersQuery.refetch()} className="link">Thử lại</button>
        </p>
      )}

      {/* KPI hàng đầu */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {loading ? (
          [0, 1, 2, 3].map((i) => <div key={i} className="skeleton h-24 rounded-2xl" />)
        ) : (
          <>
            <StatCard icon={Wallet} label="Doanh thu (đơn đã thanh toán)" value={stats.revenue} money />
            <StatCard icon={Clock} label="Đơn cần xác nhận" value={stats.needConfirm} hint="Khách đã thanh toán" to="/portal/supplier/orders" iconWrap="bg-warning/15 text-warning" />
            <StatCard icon={Truck} label="Đang xử lý / giao" value={stats.inProgress} to="/portal/supplier/orders" />
            <StatCard icon={Star} label="Đánh giá cửa hàng" value={rating?.count ? `${rating.average.toFixed(1)}/5` : '—'} hint={rating ? `${rating.count} đánh giá` : undefined} to="/portal/supplier/reviews" iconWrap="bg-warning/15 text-warning" />
          </>
        )}
      </div>

      {/* Doanh thu + Đơn gần đây */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="min-w-0 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="font-display text-lg">Doanh thu 7 ngày qua</h2>
            <span className="text-sm font-semibold text-primary">{formatVnd(stats.revenueInRange)}</span>
          </div>
          {loading ? (
            <div className="skeleton h-48 rounded-xl" />
          ) : stats.revenueInRange === 0 ? (
            <p className="py-12 text-center text-sm text-base-content/50">Chưa có đơn đã thanh toán trong 7 ngày qua.</p>
          ) : (
            <RevenueChart data={stats.revenueByDay} />
          )}
        </section>

        <section className="min-w-0 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg">Đơn hàng gần đây</h2>
            <Link to="/portal/supplier/orders" className="text-sm text-primary hover:underline">Xem tất cả</Link>
          </div>
          {loading ? (
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
        <StatCard icon={ShoppingBag} label="Đơn đã thanh toán" value={loading ? '…' : stats.paidOrders} />
        <StatCard icon={Clock} label="Đơn chờ khách thanh toán" value={loading ? '…' : stats.awaitingPayment} hint="Khách vẫn quét lại QR cũ được" />
        <StatCard icon={Package} label="Sản phẩm" value={productCount ?? '…'} to="/portal/supplier/products" />
      </div>

      {/* Hiệu suất chi nhánh — gom theo storeId của đơn (chi nhánh giao hàng) */}
      <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
        <h2 className="mb-3 font-display text-lg">Hiệu suất chi nhánh</h2>
        {loading ? (
          <div className="skeleton h-24 rounded-xl" />
        ) : !stats.branches.length ? (
          <p className="py-6 text-center text-sm text-base-content/50">Chưa có đơn nào gắn chi nhánh.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr className="text-base-content/55">
                  <th>#</th><th>Chi nhánh</th><th className="text-right">Doanh thu</th>
                  <th className="text-right">Đơn hàng</th><th>Tỷ lệ hoàn thành</th>
                </tr>
              </thead>
              <tbody>
                {stats.branches.map((b, i) => {
                  const rate = b.orders ? Math.round((b.completed / b.orders) * 100) : 0;
                  return (
                    <tr key={b.storeId} className="hover:bg-base-200/50">
                      <td className="text-base-content/50">{i + 1}</td>
                      <td>
                        <Link to={`/portal/supplier/branches/${b.storeId}`} className="font-medium hover:text-primary">{b.address}</Link>
                        <p className="text-xs text-base-content/45">{b.city}</p>
                      </td>
                      <td className="text-right font-medium">{formatVnd(b.revenue)}</td>
                      <td className="text-right">{b.orders}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <progress className="progress progress-success w-24" value={rate} max="100" />
                          <span className="text-xs text-base-content/60">{rate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
