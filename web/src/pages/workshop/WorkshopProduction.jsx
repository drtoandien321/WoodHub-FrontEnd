import { formatVnd } from '../../utils/format.js';
import { W_ORDERS } from '../../api/mock/workshopPortalData.js';
import { WORKSHOP_STEPS } from '../../utils/supplierStatus.js';
import WorkshopStepper from '../../components/supplier/WorkshopStepper.jsx';
import { Calendar } from '../../components/suppliers/icons.jsx';

export default function WorkshopProduction() {
  // Đơn đang trong sản xuất = đã chốt (producing). Các đơn quoted cũng có thể đang thiết kế.
  const inProgress = W_ORDERS.filter((o) => o.status === 'producing' || (o.status === 'quoted' && o.step));
  const stepLabel = (key) => WORKSHOP_STEPS.find((s) => s.key === key)?.label ?? key;

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl">Tiến độ sản xuất</h1>
        <p className="mt-1 text-base-content/60">Theo dõi và cập nhật tiến độ từng đơn custom qua 5 bước: tiếp nhận → thiết kế → sản xuất → hoàn thiện → giao hàng.</p>
      </header>

      <div className="flex flex-col gap-4">
        {inProgress.map((o) => (
          <article key={o.id} className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm md:p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <img src={o.image} alt="" className="h-24 w-full shrink-0 rounded-xl object-cover md:w-28" loading="lazy" />
              <div className="min-w-0 flex-1">
                <p className="font-display text-lg">#{o.id} <span className="font-sans text-base font-medium text-base-content/80">· {o.title}</span></p>
                <p className="mt-0.5 text-sm text-base-content/60">{o.customerName} · {o.specs}</p>
                <p className="mt-1 flex flex-wrap items-center gap-3 text-xs text-base-content/50">
                  <span className="inline-flex items-center gap-1"><Calendar width={12} height={12} />Hẹn giao ~ {o.quotedDays} ngày</span>
                  {o.quotedPrice && <span>Giá trị: {formatVnd(o.quotedPrice)}</span>}
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">Bước: {stepLabel(o.step)}</span>
                </p>
              </div>
            </div>

            <div className="mt-4 border-t border-base-200 pt-4">
              <WorkshopStepper step={o.step} />
            </div>

            <div className="mt-3 flex justify-end gap-2">
              <button className="btn btn-ghost btn-sm">Xem chi tiết</button>
              <button className="btn btn-primary btn-sm">Cập nhật bước</button>
            </div>
          </article>
        ))}
        {!inProgress.length && <p className="py-10 text-center text-base-content/50">Chưa có đơn nào đang sản xuất.</p>}
      </div>
    </div>
  );
}
