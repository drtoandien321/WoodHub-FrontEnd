import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client.js';
import { formatVnd } from '../../utils/format.js';
import { apiErrorMessage } from '../../utils/apiError.js';
import { statsRange, RANGE_OPTIONS } from '../../utils/statsRange.js';
import { useSupplierStatsSummary, useSupplierStatsTimeseries, useSupplierStatsTopProducts } from '../../hooks/useSupplierStats.js';
import { useMyStores } from '../../hooks/useStores.js';
import StatCard from './StatCard.jsx';
import RevenueChart from './RevenueChart.jsx';
import { Download, Star, TrendingUp } from '../suppliers/icons.jsx';

/*
 * StatsReport — trang "Báo cáo" dùng chung cho Portal NCC và Portal xưởng, số liệu THẬT từ BE-09
 * (GET /supplier/stats/summary | timeseries | top-products | export). Trước đây cả 2 trang là số minh hoạ
 * cố định trong api/mock/*.
 *
 * Props:
 *  - basePath: '/portal/supplier' | '/portal/workshop' — để link "Đơn cần xử lý", "Cần phản hồi" đúng portal.
 *  - showStores: NCC có chi nhánh → hiện bộ lọc chi nhánh (xưởng không có chi nhánh bán lẻ).
 *  - linkProducts: portal có trang chi tiết sản phẩm (chỉ NCC) → tên SP trong bảng bán chạy là link.
 *
 * Bỏ hẳn 2 khối của bản mock vì BE không có số tương ứng (không bịa): "Đơn theo trạng thái" và
 * "Hiệu suất theo chi nhánh" (muốn xem 1 chi nhánh thì chọn ở bộ lọc).
 */
export default function StatsReport({ basePath, showStores = false, linkProducts = false }) {
  const [rangeKey, setRangeKey] = useState('30d');
  const [storeId, setStoreId] = useState('');
  const [exportError, setExportError] = useState('');
  const [exporting, setExporting] = useState(false);

  const { from, to, granularity } = useMemo(() => statsRange(rangeKey), [rangeKey]);
  const params = { from, to, ...(storeId ? { storeId } : {}) };

  const stores = useMyStores();
  const summary = useSupplierStatsSummary(params);
  const series = useSupplierStatsTimeseries({ ...params, granularity });
  const top = useSupplierStatsTopProducts({ ...params, limit: 5 });

  const s = summary.data;
  const ws = s?.workshop;
  // Xưởng: doanh thu biểu đồ gồm cả tiền đơn custom thực nhận
  const chartData = (series.data?.points ?? []).map((p) => ({
    date: `${p.date.slice(8, 10)}/${p.date.slice(5, 7)}`,
    value: Number(p.revenue || 0) + Number(p.customRevenue || 0),
  }));
  const chartEmpty = chartData.every((p) => !p.value);

  const handleExport = async () => {
    setExportError('');
    setExporting(true);
    try {
      const blob = await api.exportSupplierStats(params);
      const url = URL.createObjectURL(blob);
      const a = Object.assign(document.createElement('a'), { href: url, download: `woodhub-bao-cao-${from.slice(0, 10)}.csv` });
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setExportError(apiErrorMessage(err, 'Không xuất được báo cáo, vui lòng thử lại.'));
    } finally {
      setExporting(false);
    }
  };

  const alerts = [
    s?.pendingOrders > 0 && { tone: 'warning', text: `${s.pendingOrders} đơn đang chờ bạn xử lý`, to: `${basePath}/orders` },
    s?.unrepliedReviews > 0 && { tone: 'info', text: `${s.unrepliedReviews} đánh giá chưa được phản hồi`, to: `${basePath}/reviews` },
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl">Báo cáo</h1>
        <p className="mt-1 text-base-content/70">
          Doanh thu, đơn hàng và sản phẩm bán chạy{ws ? ', kèm hiệu quả báo giá và đơn custom của xưởng' : ''}.
        </p>
      </header>

      {/* Bộ lọc */}
      <div className="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm lg:flex-row lg:items-center">
        <select value={rangeKey} onChange={(e) => setRangeKey(e.target.value)} className="select select-bordered" aria-label="Khoảng thời gian">
          {RANGE_OPTIONS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        {showStores && (
          <select value={storeId} onChange={(e) => setStoreId(e.target.value)} className="select select-bordered" aria-label="Chi nhánh">
            <option value="">Tất cả chi nhánh</option>
            {/* StoreResponse không có tên chi nhánh → hiện địa chỉ + quận */}
            {(stores.data ?? []).map((b) => <option key={b.id} value={b.id}>{[b.address, b.district].filter(Boolean).join(', ')}</option>)}
          </select>
        )}
        <button onClick={handleExport} disabled={exporting} className="btn btn-primary gap-2 lg:ml-auto">
          {exporting ? <span className="loading loading-spinner loading-sm" /> : <Download width={16} height={16} />} Xuất báo cáo (CSV)
        </button>
      </div>
      {exportError && <p className="-mt-3 text-sm text-error">{exportError}</p>}

      {summary.isError ? (
        <p className="rounded-xl border border-error/30 bg-error/5 px-4 py-3 text-sm text-error">
          {apiErrorMessage(summary.error, 'Không tải được số liệu báo cáo.')}
        </p>
      ) : (
        <>
          {/* KPI kỳ đang chọn */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Doanh thu" value={s ? s.revenue : '…'} money={!!s} hint={s ? `Tiền hàng ${formatVnd(s.grossSales)} − voucher shop` : undefined} />
            <StatCard label="Thực nhận dự kiến" value={s ? s.netRevenue : '…'} money={!!s} hint={s ? `Sau hoa hồng ${Number(s.commissionRate)}%` : undefined} iconWrap="bg-success/10 text-success" />
            <StatCard label="Đơn đã thanh toán" value={s ? s.orderCount : '…'} hint={s ? `Phí ship ${formatVnd(s.shippingFee)}` : undefined} />
            <StatCard label="Giá trị đơn trung bình" value={s ? s.avgOrderValue : '…'} money={!!s} />
          </div>

          {/* Xưởng: báo giá + đơn custom */}
          {ws && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Yêu cầu báo giá nhận" value={ws.quotesReceived} hint={`${ws.quotesWon} yêu cầu đã thành đơn`} />
              <StatCard label="Tỷ lệ chốt đơn" value={`${Math.round(Number(ws.conversionRate || 0) * 100)}%`} />
              <StatCard label="Đơn đang sản xuất" value={ws.inProduction} hint="Hiện tại, từ nhận cọc tới đang giao" to={`${basePath}/production`} />
              <StatCard label="Doanh thu đơn custom" value={ws.customRevenue} money hint={`Thực nhận ${formatVnd(ws.customNetRevenue)}`} />
            </div>
          )}
        </>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <h2 className="mb-3 font-display text-lg">Doanh thu theo thời gian</h2>
          {series.isLoading ? <div className="skeleton h-64 w-full rounded-xl" />
            : chartEmpty ? <p className="grid h-64 place-items-center text-sm text-base-content/70">Chưa có đơn đã thanh toán trong kỳ này.</p>
            : <RevenueChart data={chartData} ariaLabel="Biểu đồ doanh thu theo kỳ đã chọn" />}
          <p className="mt-2 text-xs text-base-content/70">
            Chỉ tính đơn đã thanh toán (không tính chờ thanh toán, đã huỷ, đã hoàn tiền), theo ngày khách thanh toán (giờ Việt Nam).
            {granularity !== 'day' && ` Mỗi điểm là 1 ${granularity === 'week' ? 'tuần (từ thứ Hai)' : 'tháng'}.`}
          </p>
        </section>

        <section className="flex flex-col gap-4 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <h2 className="font-display text-lg">Đánh giá &amp; việc cần làm</h2>
          <div className="flex items-center gap-3">
            <Star width={22} height={22} className="text-warning" />
            <p className="text-2xl font-semibold">{s?.rating != null ? Number(s.rating).toFixed(1) : '—'}</p>
            <p className="text-sm text-base-content/70">
              {s ? `${s.reviewCount} đánh giá · ${s.newReviews} mới trong kỳ` : ''}
            </p>
          </div>
          {alerts.length ? (
            <ul className="flex flex-col gap-2">
              {alerts.map((a) => (
                <li key={a.to}>
                  <Link to={a.to} className={`flex items-center justify-between rounded-xl border px-4 py-3 text-sm font-medium transition-colors ${
                    a.tone === 'warning' ? 'border-warning/30 bg-warning/5 text-warning hover:bg-warning/10' : 'border-info/30 bg-info/5 text-info hover:bg-info/10'}`}>
                    {a.text} <span aria-hidden="true">→</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : s && <p className="text-sm text-base-content/70">Không có đơn chờ xử lý hay đánh giá cần phản hồi.</p>}
        </section>
      </div>

      <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg"><TrendingUp width={18} height={18} className="text-primary" /> Sản phẩm bán chạy</h2>
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead><tr className="text-base-content/70"><th>Sản phẩm</th><th className="text-right">Đã bán</th><th className="text-right">Doanh thu (trước voucher)</th></tr></thead>
            <tbody>
              {(top.data ?? []).map((p, i) => (
                <tr key={p.productId ?? `deleted-${i}`} className="hover:bg-base-200/50">
                  <td className="font-medium">
                    {p.productId && linkProducts
                      ? <Link to={`${basePath}/products/${p.productId}`} className="hover:text-primary">{p.name}</Link>
                      : <>{p.name}{!p.productId && <span className="ml-1 text-xs font-normal text-base-content/70">(đã xoá)</span>}</>}
                  </td>
                  <td className="text-right">{p.sold}</td>
                  <td className="text-right">{formatVnd(p.revenue)}</td>
                </tr>
              ))}
              {!top.isLoading && !top.data?.length && (
                <tr><td colSpan={3} className="py-6 text-center text-base-content/70">Chưa bán được sản phẩm nào trong kỳ này.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
