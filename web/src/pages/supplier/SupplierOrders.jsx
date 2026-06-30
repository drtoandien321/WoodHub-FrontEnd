import { useState, useMemo } from 'react';
import { formatVnd } from '../../utils/format.js';
import { M_ORDERS } from '../../api/mock/manufacturerData.js';
import { orderMeta } from '../../utils/supplierStatus.js';
import StatusBadge from '../../components/supplier/StatusBadge.jsx';
import OrderStepper from '../../components/supplier/OrderStepper.jsx';
import { Calendar, Phone, MoreVertical } from '../../components/suppliers/icons.jsx';

const TABS = [
  ['all', 'Tất cả'], ['processing', 'Đang xử lý'], ['packing', 'Đang đóng gói'],
  ['shipping', 'Đang giao hàng'], ['completed', 'Hoàn thành'], ['cancelled', 'Đã hủy'],
];

export default function SupplierOrders() {
  const [tab, setTab] = useState('all');
  const list = useMemo(() => M_ORDERS.filter((o) => tab === 'all' || o.status === tab), [tab]);

  return (
    <div className="flex flex-col gap-6">
      <header><h1 className="font-display text-3xl">Đơn hàng</h1></header>

      {/* Tabs */}
      <div className="overflow-x-auto">
        <div className="inline-flex gap-1 rounded-2xl border border-base-300 bg-base-100 p-1 shadow-sm">
          {TABS.map(([v, l]) => (
            <button
              key={v}
              onClick={() => setTab(v)}
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm transition-colors ${tab === v ? 'bg-primary text-primary-content' : 'text-base-content/70 hover:bg-base-200'}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Order cards */}
      <div className="flex flex-col gap-4">
        {list.map((o) => (
          <article key={o.id} className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm md:p-5">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-2">
                <p className="font-display text-lg">#{o.id}</p>
                <p className="mt-1 flex items-center gap-1 text-xs text-base-content/50"><Calendar width={13} height={13} />{o.date}</p>
              </div>

              <div className="lg:col-span-2">
                <p className="text-xs text-base-content/45">Khách hàng</p>
                <p className="text-sm font-medium">{o.customerName}</p>
                <p className="flex items-center gap-1 text-xs text-base-content/55"><Phone width={12} height={12} />{o.customerPhone}</p>
              </div>

              <div className="lg:col-span-3">
                <p className="text-xs text-base-content/45">Sản phẩm (Chuẩn)</p>
                <div className="mt-1 flex items-center gap-2">
                  <img src={o.productImage} alt="" className="h-11 w-11 shrink-0 rounded-lg object-cover" loading="lazy" />
                  <div className="min-w-0"><p className="truncate text-sm font-medium">{o.productName}</p><p className="text-xs text-base-content/50">SL: {o.qtyLabel}</p></div>
                </div>
              </div>

              <div className="lg:col-span-2">
                <p className="text-xs text-base-content/45">Tổng tiền đơn hàng</p>
                <p className="text-sm font-semibold">{formatVnd(o.total)}</p>
                <p className="text-xs text-base-content/50">Thanh toán: {o.payment}</p>
              </div>

              <div className="lg:col-span-3">
                <OrderStepper status={o.status} />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-base-200 pt-3">
              <StatusBadge meta={orderMeta(o.status)} />
              <div className="flex items-center gap-2">
                {o.status === 'completed' || o.status === 'cancelled'
                  ? <button className="btn btn-outline btn-sm">Xem chi tiết</button>
                  : <button className="btn btn-primary btn-sm">Cập nhật trạng thái</button>}
                <button className="btn btn-ghost btn-sm btn-square" aria-label="Thêm"><MoreVertical width={16} height={16} /></button>
              </div>
            </div>
          </article>
        ))}
        {!list.length && <p className="py-10 text-center text-base-content/50">Không có đơn hàng ở trạng thái này.</p>}
      </div>

      {/* Pagination (mock) */}
      <div className="flex items-center justify-between text-sm text-base-content/60">
        <span>Hiển thị 1 – {list.length} trong 24 đơn hàng</span>
        <div className="join">
          <button className="btn btn-sm join-item">‹</button>
          <button className="btn btn-sm join-item btn-active">1</button>
          <button className="btn btn-sm join-item">2</button>
          <button className="btn btn-sm join-item">3</button>
          <button className="btn btn-sm join-item">›</button>
        </div>
      </div>
    </div>
  );
}
