import { useState, useMemo } from 'react';
import { formatVnd } from '../../utils/format.js';
import { W_ORDERS } from '../../api/mock/workshopPortalData.js';
import { workshopOrderMeta } from '../../utils/supplierStatus.js';
import StatusBadge from '../../components/supplier/StatusBadge.jsx';
import { Phone, Calendar, Ruler, X } from '../../components/suppliers/icons.jsx';

const TABS = [
  ['all', 'Tất cả'], ['quote_pending', 'Chờ báo giá'], ['quoted', 'Đã báo giá'],
  ['producing', 'Đang sản xuất'], ['completed', 'Hoàn thành'], ['cancelled', 'Đã hủy'],
];

export default function WorkshopOrders() {
  const [tab, setTab] = useState('all');
  const [quoting, setQuoting] = useState(null); // order đang báo giá
  const list = useMemo(() => W_ORDERS.filter((o) => tab === 'all' || o.status === tab), [tab]);

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl">Đơn custom &amp; Báo giá</h1>
        <p className="mt-1 text-base-content/60">Tiếp nhận yêu cầu thiết kế theo yêu cầu, báo giá và chốt đơn với khách.</p>
      </header>

      <div className="overflow-x-auto">
        <div className="inline-flex gap-1 rounded-2xl border border-base-300 bg-base-100 p-1 shadow-sm">
          {TABS.map(([v, l]) => (
            <button key={v} onClick={() => setTab(v)} className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm transition-colors ${tab === v ? 'bg-primary text-primary-content' : 'text-base-content/70 hover:bg-base-200'}`}>{l}</button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {list.map((o) => (
          <article key={o.id} className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm md:p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start">
              <img src={o.image} alt="" className="h-28 w-full shrink-0 rounded-xl object-cover md:h-24 md:w-32" loading="lazy" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-lg">#{o.id}</p>
                  <StatusBadge meta={workshopOrderMeta(o.status)} />
                </div>
                <p className="mt-1 font-medium">{o.title}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-sm text-base-content/65"><Ruler width={14} height={14} className="text-base-content/40" />{o.specs} · SL {o.qty}</p>
                <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-base-content/50">
                  <span>{o.customerName}</span>
                  <span className="inline-flex items-center gap-1"><Phone width={12} height={12} />{o.customerPhone}</span>
                  <span className="inline-flex items-center gap-1"><Calendar width={12} height={12} />{o.date}</span>
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                {o.quotedPrice && (
                  <div className="text-right">
                    <p className="font-semibold text-primary">{formatVnd(o.quotedPrice)}</p>
                    <p className="text-xs text-base-content/50">~ {o.quotedDays} ngày</p>
                  </div>
                )}
                {o.status === 'quote_pending'
                  ? <button onClick={() => setQuoting(o)} className="btn btn-primary btn-sm">Báo giá</button>
                  : o.status === 'quoted'
                    ? <button className="btn btn-outline btn-sm">Chờ khách chốt</button>
                    : <button className="btn btn-outline btn-sm">Xem chi tiết</button>}
              </div>
            </div>
          </article>
        ))}
        {!list.length && <p className="py-10 text-center text-base-content/50">Không có đơn ở trạng thái này.</p>}
      </div>

      {quoting && <QuoteModal order={quoting} onClose={() => setQuoting(null)} />}
    </div>
  );
}

function QuoteModal({ order, onClose }) {
  const [price, setPrice] = useState('');
  const [days, setDays] = useState('');
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-3xl bg-base-100 shadow-2xl" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Báo giá đơn">
        <header className="flex items-center justify-between border-b border-base-300 px-5 py-4">
          <h2 className="font-display text-lg">Báo giá · #{order.id}</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle" aria-label="Đóng"><X width={18} height={18} /></button>
        </header>
        <div className="flex flex-col gap-4 px-5 py-4">
          <div className="rounded-xl bg-base-200/60 p-3 text-sm">
            <p className="font-medium">{order.title}</p>
            <p className="text-base-content/60">{order.specs}</p>
          </div>
          <label className="flex flex-col gap-1.5"><span className="text-sm text-base-content/70">Giá báo (VNĐ) <span className="text-error">*</span></span>
            <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="input input-bordered w-full" placeholder="9500000" /></label>
          <label className="flex flex-col gap-1.5"><span className="text-sm text-base-content/70">Thời gian hoàn thành (ngày) <span className="text-error">*</span></span>
            <input type="number" value={days} onChange={(e) => setDays(e.target.value)} className="input input-bordered w-full" placeholder="12" /></label>
        </div>
        <footer className="flex justify-end gap-3 border-t border-base-300 px-5 py-4">
          <button onClick={onClose} className="btn btn-ghost">Hủy</button>
          <button onClick={onClose} className="btn btn-primary" disabled={!price || !days}>Gửi báo giá</button>
        </footer>
      </div>
    </div>
  );
}
