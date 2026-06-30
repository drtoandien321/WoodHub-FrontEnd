import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { formatVnd } from '../../utils/format.js';
import { BRANCHES } from '../../api/mock/manufacturerData.js';
import { branchMeta } from '../../utils/supplierStatus.js';
import StatusBadge from '../../components/supplier/StatusBadge.jsx';
import {
  Search, Store, Plus, MapPin, Phone, Eye, Pencil, Trash, Star, TrendingUp, ExternalLink,
} from '../../components/suppliers/icons.jsx';

export default function SupplierBranches() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');

  const list = useMemo(
    () => BRANCHES.filter((b) =>
      (status === 'all' || b.status === status) &&
      (b.name.toLowerCase().includes(q.toLowerCase()) || b.address.toLowerCase().includes(q.toLowerCase()))),
    [q, status]
  );

  const total = BRANCHES.length;
  const active = BRANCHES.filter((b) => b.status === 'active').length;
  const paused = total - active;
  const sumRevenue = BRANCHES.reduce((s, b) => s + b.monthRevenue, 0);
  const sumOrders = BRANCHES.reduce((s, b) => s + b.monthOrders, 0);
  const avgRating = (BRANCHES.reduce((s, b) => s + b.rating, 0) / total).toFixed(1);
  const avgPerf = Math.round(BRANCHES.reduce((s, b) => s + b.performance, 0) / total);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl">Chi nhánh</h1>
        <p className="mt-1 text-base-content/60">Quản lý nhiều chi nhánh cửa hàng của bạn một cách tập trung và hiệu quả.</p>
      </header>

      {/* Controls + summary */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr_auto]">
        <div className="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm sm:flex-row sm:items-center">
          <label className="input input-bordered flex flex-1 items-center gap-2">
            <Search width={16} height={16} className="text-base-content/40" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm kiếm chi nhánh…" className="grow" />
          </label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="select select-bordered" aria-label="Lọc trạng thái">
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="paused">Tạm ngưng</option>
          </select>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <MiniStat label="Tổng chi nhánh" value={total} wrap="bg-primary/10 text-primary" icon={Store} />
          <MiniStat label="Đang hoạt động" value={active} wrap="bg-success/10 text-success" icon={Store} />
          <MiniStat label="Tạm dừng" value={paused} wrap="bg-warning/10 text-warning" icon={Store} />
        </div>

        <button className="btn btn-primary gap-2 self-start xl:self-auto"><Plus width={16} height={16} /> Thêm chi nhánh</button>
      </div>

      {/* Hiệu suất + phân bổ */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <h2 className="mb-4 font-display text-lg">Hiệu suất chi nhánh</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Perf label="Tổng doanh thu" value={formatVnd(sumRevenue)} delta="+15.2%" />
            <Perf label="Đơn hàng" value={sumOrders} delta="+8.7%" />
            <Perf label="Đánh giá TB" value={`${avgRating} / 5`} delta="+0.2" />
            <Perf label="Tỷ lệ hoàn thành" value={`${avgPerf}%`} delta="+2.1%" />
          </div>
        </section>

        <section className="flex flex-col rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg">Phân bổ chi nhánh</h2>
            <button className="btn btn-ghost btn-xs gap-1 text-primary">Xem bản đồ <ExternalLink width={12} height={12} /></button>
          </div>
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><MapPin width={22} height={22} /></span>
            <div>
              <p className="font-medium">{total} chi nhánh tại TP. Hồ Chí Minh</p>
              <p className="text-sm text-base-content/55">Phủ sóng {total} quận/huyện</p>
            </div>
          </div>
          {/* Map placeholder */}
          <div className="relative mt-4 flex-1 overflow-hidden rounded-xl border border-base-200 bg-[linear-gradient(135deg,#efe7d8_0%,#e6dcc8_100%)] min-h-28">
            <span className="absolute left-[20%] top-[45%] text-primary"><MapPin width={20} height={20} /></span>
            <span className="absolute left-[55%] top-[30%] text-primary"><MapPin width={20} height={20} /></span>
            <span className="absolute left-[75%] top-[60%] text-primary"><MapPin width={20} height={20} /></span>
          </div>
        </section>
      </div>

      {/* Table */}
      <section className="rounded-2xl border border-base-300 bg-base-100 p-2 shadow-sm md:p-4">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr className="text-base-content/55">
                <th>Tên chi nhánh</th><th>Địa chỉ</th><th>SĐT</th><th>Quản lý</th>
                <th>Trạng thái</th><th>Hiệu suất</th><th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {list.map((b) => (
                <tr key={b.id} className="hover:bg-base-200/50">
                  <td>
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-base-200 text-primary"><Store width={16} height={16} /></span>
                      <span className="font-medium">{b.name}</span>
                    </div>
                  </td>
                  <td className="max-w-[220px]"><span className="flex items-start gap-1 text-sm text-base-content/70"><MapPin width={14} height={14} className="mt-0.5 shrink-0 text-base-content/40" />{b.address}</span></td>
                  <td><span className="flex items-center gap-1 text-sm text-base-content/70"><Phone width={14} height={14} className="text-base-content/40" />{b.phone}</span></td>
                  <td className="text-sm">{b.manager}</td>
                  <td><StatusBadge meta={branchMeta(b.status)} /></td>
                  <td>
                    <div className="flex items-center gap-2">
                      <progress className={`progress w-20 ${b.performance >= 90 ? 'progress-success' : 'progress-warning'}`} value={b.performance} max="100" />
                      <span className="text-xs text-base-content/60">{b.performance}%</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <Link to={`/portal/supplier/branches/${b.id}`} className="btn btn-ghost btn-xs btn-square" aria-label="Xem chi tiết"><Eye width={15} height={15} /></Link>
                      <button className="btn btn-ghost btn-xs btn-square" aria-label="Chỉnh sửa"><Pencil width={15} height={15} /></button>
                      <button className="btn btn-ghost btn-xs btn-square text-error" aria-label="Xóa"><Trash width={15} height={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!list.length && (
                <tr><td colSpan={7} className="py-10 text-center text-base-content/50">Không tìm thấy chi nhánh phù hợp.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination (mock) */}
        <div className="flex items-center justify-between px-2 py-3 text-sm text-base-content/60">
          <span>Hiển thị 1 – {list.length} của {total} chi nhánh</span>
          <div className="join">
            <button className="btn btn-sm join-item">«</button>
            <button className="btn btn-sm join-item btn-active">1</button>
            <button className="btn btn-sm join-item">»</button>
          </div>
        </div>
      </section>
    </div>
  );
}

function MiniStat({ label, value, wrap, icon: Icon }) {
  return (
    <div className="flex flex-col items-start gap-1.5 rounded-2xl border border-base-300 bg-base-100 p-3 shadow-sm">
      <span className={`grid h-8 w-8 place-items-center rounded-lg ${wrap}`}><Icon width={16} height={16} /></span>
      <span className="text-lg font-semibold leading-none">{value}</span>
      <span className="text-xs text-base-content/55">{label}</span>
    </div>
  );
}

function Perf({ label, value, delta }) {
  return (
    <div>
      <p className="text-sm text-base-content/55">{label}</p>
      <p className="mt-0.5 text-lg font-semibold">{value}</p>
      <p className="inline-flex items-center gap-1 text-xs font-medium text-success"><TrendingUp width={12} height={12} />{delta}</p>
    </div>
  );
}
