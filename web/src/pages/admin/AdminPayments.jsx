import { useEffect, useMemo, useState } from 'react';
import { useAdminPayments, useAdminPaymentDetail, useAdminPaymentStats } from '../../hooks/useAdminPayments.js';
import StatCard from '../../components/supplier/StatCard.jsx';
import RevenueChart from '../../components/supplier/RevenueChart.jsx';
import { Wallet, CheckCircle, Clock, X, Search, Eye } from '../../components/suppliers/icons.jsx';
import { formatVnd, formatDate } from '../../utils/format.js';
import { startOfDayIso, endOfDayIso, toYmd } from '../../utils/dateRange.js';

const PAGE_SIZE = 20;
const STATUS_LABEL = { pending: 'Chờ thanh toán', paid: 'Đã thanh toán', failed: 'Thất bại', expired: 'Hết hạn' };
// Class TĨNH (không ghép động) để Tailwind không purge
const STATUS_BADGE = { pending: 'badge-warning', paid: 'badge-success', failed: 'badge-error', expired: 'badge-ghost' };
const PURPOSE_LABEL = { subscription: 'Gói đăng ký', order: 'Đơn hàng' };

/*
 * Đọc thông tin phân trang cho CẢ 2 dạng: Spring Page phẳng (BE payments: totalElements/number
 * nằm ngoài) và dạng lồng `page: {...}` (BE /users). Tránh vỡ UI nếu BE đổi dạng.
 */
const readPage = (data) => {
  const src = data?.page ?? data ?? {};
  return { number: src.number ?? 0, totalPages: src.totalPages ?? 1, totalElements: src.totalElements ?? 0 };
};

// Lỗi 403 (không phải admin) / 400 (sai tham số, vd định dạng ngày) → thông báo dễ hiểu
const errorText = (error) => {
  const s = error?.response?.status;
  if (s === 403) return 'Bạn không có quyền xem dữ liệu thanh toán (chỉ dành cho quản trị viên).';
  if (s === 400) return 'Bộ lọc không hợp lệ (vd sai định dạng ngày). Hãy kiểm tra lại khoảng ngày.';
  return 'Không tải được dữ liệu thanh toán. Vui lòng thử lại.';
};

// Debounce giá trị: chỉ cập nhật sau khi ngừng gõ `ms` mili-giây → không gọi API mỗi phím bấm
const useDebounced = (value, ms = 400) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), ms);
    return () => clearTimeout(id);
  }, [value, ms]);
  return v;
};

// dailyRevenue BE chỉ có ngày CÓ giao dịch → điền 0 cho ngày trống để đường biểu đồ liền mạch
const fillDays = (daily = [], fromYmd, toYmdStr) => {
  if (!daily.length && !(fromYmd && toYmdStr)) return [];
  const map = new Map(daily.map((d) => [d.date, d.revenue]));
  const start = fromYmd || daily[0].date;
  const end = toYmdStr || daily[daily.length - 1].date;
  const out = [];
  const cur = new Date(`${start}T00:00:00`);
  const last = new Date(`${end}T00:00:00`);
  // Chặn khoảng quá dài (an toàn): tối đa 366 điểm
  for (let i = 0; cur <= last && i < 366; i++, cur.setDate(cur.getDate() + 1)) {
    const ymd = toYmd(cur);
    out.push({ date: ymd.slice(8) + '/' + ymd.slice(5, 7), value: map.get(ymd) ?? 0 });
  }
  return out;
};

function DetailRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-4 py-2 text-sm">
      <span className="shrink-0 text-base-content/55">{label}</span>
      <span className="min-w-0 break-all text-right font-medium">{children ?? '—'}</span>
    </div>
  );
}

function PaymentDetailModal({ id, onClose }) {
  const { data: p, isLoading, isError, error } = useAdminPaymentDetail(id);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal modal-open" role="dialog" aria-modal="true" aria-label="Chi tiết giao dịch">
      <div className="modal-box max-w-lg">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl">Chi tiết giao dịch</h3>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-square" aria-label="Đóng"><X width={16} height={16} /></button>
        </div>

        {isLoading && <p className="py-8 text-center text-base-content/50">Đang tải…</p>}
        {isError && <p className="py-8 text-center text-error">{error?.response?.status === 404 ? 'Không tìm thấy giao dịch.' : errorText(error)}</p>}
        {p && (
          <div className="mt-3 divide-y divide-base-200">
            <DetailRow label="Trạng thái"><span className={`badge ${STATUS_BADGE[p.status] ?? 'badge-ghost'}`}>{STATUS_LABEL[p.status] ?? p.status}</span></DetailRow>
            <DetailRow label="Mục đích">{PURPOSE_LABEL[p.purpose] ?? p.purpose}</DetailRow>
            <DetailRow label="Gói">{p.planName}</DetailRow>
            <DetailRow label="Số tiền yêu cầu">{formatVnd(p.amount)}</DetailRow>
            <DetailRow label="Số tiền thực nhận">{p.paidAmount != null ? formatVnd(p.paidAmount) : null}</DetailRow>
            <DetailRow label="Nội dung CK (txnRef)"><code>{p.txnRef}</code></DetailRow>
            <DetailRow label="Mã GD nhà cung cấp"><code>{p.providerTxnId}</code></DetailRow>
            <DetailRow label="Cổng thanh toán">{p.provider}</DetailRow>
            <DetailRow label="Người mua">{p.userFullName}</DetailRow>
            <DetailRow label="Email">{p.userEmail}</DetailRow>
            <DetailRow label="Tạo lúc">{formatDate(p.createdAt)}</DetailRow>
            <DetailRow label="Hạn thanh toán (QR)">{p.expiresAt ? formatDate(p.expiresAt) : null}</DetailRow>
            <DetailRow label="Thanh toán lúc">{p.paidAt ? formatDate(p.paidAt) : null}</DetailRow>
          </div>
        )}
      </div>
      <button className="modal-backdrop" onClick={onClose} aria-label="Đóng" />
    </div>
  );
}

/*
 * AdminPayments — Quản lý thanh toán (chỉ đọc). Trên: thống kê + biểu đồ doanh thu theo ngày;
 * dưới: bộ lọc + bảng phân trang; bấm 1 dòng → modal chi tiết.
 * Thống kê dùng CÙNG khoảng ngày (from/to) với bảng, nhưng KHÔNG theo status/purpose/q
 * (BE /stats chỉ nhận from/to).
 */
export default function AdminPayments() {
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState('');
  const [purpose, setPurpose] = useState('');
  const [fromDate, setFromDate] = useState(''); // 'YYYY-MM-DD'
  const [toDate, setToDate] = useState('');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const q = useDebounced(search.trim());

  const range = useMemo(() => ({ from: startOfDayIso(fromDate), to: endOfDayIso(toDate) }), [fromDate, toDate]);
  const listParams = {
    page, size: PAGE_SIZE, sort: 'createdAt,desc',
    status: status || undefined, purpose: purpose || undefined, q: q || undefined, ...range,
  };

  const list = useAdminPayments(listParams);
  const stats = useAdminPaymentStats(range);

  // Đổi bất kỳ bộ lọc nào → về trang đầu (nếu không có thể đang ở trang không còn tồn tại)
  const resetPage = (setter) => (e) => { setter(e.target.value); setPage(0); };
  useEffect(() => { setPage(0); }, [q]);

  const items = list.data?.content ?? [];
  const pageInfo = readPage(list.data);
  const s = stats.data;
  const chartData = useMemo(() => fillDays(s?.dailyRevenue, fromDate, toDate), [s, fromDate, toDate]);
  const hasFilter = status || purpose || fromDate || toDate || search;

  const clearFilters = () => { setStatus(''); setPurpose(''); setFromDate(''); setToDate(''); setSearch(''); setPage(0); };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl">Thanh toán</h1>
        <p className="mt-1 text-base-content/60">Theo dõi giao dịch và doanh thu trên hệ thống (chỉ xem).</p>
      </header>

      {/* Thống kê */}
      {stats.isError ? (
        <div className="rounded-2xl border border-error/30 bg-error/5 p-4 text-sm text-error">{errorText(stats.error)}</div>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <div className="col-span-2 lg:col-span-1">
              <StatCard icon={Wallet} label="Doanh thu" value={s?.totalRevenue ?? 0} money hint="Tính theo ngày thanh toán" />
            </div>
            <StatCard icon={Search} label="Tổng giao dịch" value={s?.totalCount ?? 0} hint="Theo ngày tạo" />
            <StatCard icon={CheckCircle} label="Đã thanh toán" value={s?.paidCount ?? 0} iconWrap="bg-success/10 text-success" />
            <StatCard icon={Clock} label="Chờ thanh toán" value={s?.pendingCount ?? 0} iconWrap="bg-warning/10 text-warning" />
            <StatCard icon={X} label="Thất bại" value={s?.failedCount ?? 0} iconWrap="bg-error/10 text-error" />
            <StatCard icon={Clock} label="Hết hạn" value={s?.expiredCount ?? 0} iconWrap="bg-base-200 text-base-content/60" />
          </section>

          <section className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm md:p-5">
            <h2 className="font-semibold">Doanh thu theo ngày</h2>
            <p className="mb-2 text-xs text-base-content/55">Chỉ tính giao dịch đã thanh toán, theo ngày thanh toán (paidAt). Ngày không có giao dịch hiển thị 0.</p>
            {chartData.length ? (
              <RevenueChart data={chartData} ariaLabel="Biểu đồ doanh thu theo ngày" />
            ) : (
              <p className="py-10 text-center text-sm text-base-content/50">{stats.isLoading ? 'Đang tải…' : 'Chưa có doanh thu trong khoảng này.'}</p>
            )}
          </section>
        </>
      )}

      {/* Bộ lọc + bảng */}
      <section className="rounded-2xl border border-base-300 bg-base-100 p-2 shadow-sm md:p-4">
        <div className="flex flex-wrap items-end gap-3 p-2">
          <label className="form-control w-full sm:w-56">
            <span className="mb-1 text-xs text-base-content/60">Tìm (mã GD / email / tên)</span>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="vd: nguyen, SUB…" className="input input-bordered input-sm w-full" />
          </label>
          <label className="form-control">
            <span className="mb-1 text-xs text-base-content/60">Trạng thái</span>
            <select value={status} onChange={resetPage(setStatus)} className="select select-bordered select-sm">
              <option value="">Tất cả</option>
              {Object.entries(STATUS_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label className="form-control">
            <span className="mb-1 text-xs text-base-content/60">Mục đích</span>
            <select value={purpose} onChange={resetPage(setPurpose)} className="select select-bordered select-sm">
              <option value="">Tất cả</option>
              {Object.entries(PURPOSE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label className="form-control">
            <span className="mb-1 text-xs text-base-content/60">Từ ngày</span>
            <input type="date" value={fromDate} max={toDate || undefined} onChange={resetPage(setFromDate)} className="input input-bordered input-sm" />
          </label>
          <label className="form-control">
            <span className="mb-1 text-xs text-base-content/60">Đến ngày</span>
            <input type="date" value={toDate} min={fromDate || undefined} onChange={resetPage(setToDate)} className="input input-bordered input-sm" />
          </label>
          {hasFilter && <button onClick={clearFilters} className="btn btn-ghost btn-sm">Xoá bộ lọc</button>}
        </div>

        {list.isError && <div className="m-2 rounded-xl border border-error/30 bg-error/5 p-3 text-sm text-error">{errorText(list.error)}</div>}

        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr className="text-base-content/55">
                <th>Mã GD</th><th>Người mua</th><th>Mục đích</th><th className="text-right">Số tiền</th><th>Trạng thái</th><th>Ngày tạo</th><th className="text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {list.isLoading && <tr><td colSpan={7} className="py-10 text-center text-base-content/50">Đang tải…</td></tr>}
              {!list.isLoading && items.map((p) => (
                <tr key={p.id} className="cursor-pointer hover:bg-base-200/50" onClick={() => setSelectedId(p.id)}>
                  <td className="font-mono text-xs">{p.txnRef}</td>
                  <td className="text-sm">
                    <div className="font-medium">{p.userFullName}</div>
                    <div className="text-xs text-base-content/55">{p.userEmail}</div>
                  </td>
                  <td className="text-sm">{PURPOSE_LABEL[p.purpose] ?? p.purpose}{p.planName ? <div className="text-xs text-base-content/55">{p.planName}</div> : null}</td>
                  <td className="text-right text-sm">
                    {formatVnd(p.paidAmount ?? p.amount)}
                    {p.paidAmount != null && p.paidAmount !== p.amount && <div className="text-xs text-warning">yêu cầu {formatVnd(p.amount)}</div>}
                  </td>
                  <td><span className={`badge badge-sm ${STATUS_BADGE[p.status] ?? 'badge-ghost'}`}>{STATUS_LABEL[p.status] ?? p.status}</span></td>
                  <td className="text-sm text-base-content/60">{formatDate(p.createdAt)}</td>
                  <td className="text-right">
                    <button onClick={(e) => { e.stopPropagation(); setSelectedId(p.id); }} className="btn btn-ghost btn-xs btn-square" aria-label="Xem chi tiết"><Eye width={15} height={15} /></button>
                  </td>
                </tr>
              ))}
              {!list.isLoading && !list.isError && !items.length && (
                <tr><td colSpan={7} className="py-10 text-center text-base-content/50">Không có giao dịch nào.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {pageInfo.totalPages > 1 && (
          <div className="flex items-center justify-between px-2 py-3 text-sm text-base-content/60">
            <span>Trang {pageInfo.number + 1} / {pageInfo.totalPages} — {pageInfo.totalElements} giao dịch</span>
            <div className="join">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={pageInfo.number === 0} className="btn btn-sm join-item">«</button>
              <button onClick={() => setPage((p) => Math.min(pageInfo.totalPages - 1, p + 1))} disabled={pageInfo.number >= pageInfo.totalPages - 1} className="btn btn-sm join-item">»</button>
            </div>
          </div>
        )}
      </section>

      {selectedId && <PaymentDetailModal id={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}
