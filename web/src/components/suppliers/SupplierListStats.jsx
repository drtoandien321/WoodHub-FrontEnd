import { CheckCircle, Tool, Briefcase } from './icons.jsx';

// Icon theo thứ tự stat: tổng đối tác, xưởng mộc, nhà cung cấp.
const STAT_ICONS = [CheckCircle, Tool, Briefcase];

/*
 * Dải 4 stat card tổng quan dưới hero của trang /suppliers.
 * Nhận stats đã tính sẵn (mỗi item { value, label }) — số đếm thật từ danh sách NCC công khai.
 */
export default function SupplierListStats({ stats = [] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {stats.map((s, i) => {
        const Icon = STAT_ICONS[i] ?? CheckCircle;
        return (
          <div key={s.label} className="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Icon width={20} height={20} />
            </span>
            <div className="min-w-0">
              <p className="text-xl font-bold leading-tight text-primary">{s.value}</p>
              <p className="truncate text-sm text-base-content/70">{s.label}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
