import { useSupplierMe, usePortalBrand } from '../../hooks/useSupplierMe.js';
import { useAuthStore } from '../../stores/authStore.js';
import { Phone, Mail, Calendar, Briefcase } from '../suppliers/icons.jsx';

const STATUS = {
  active: ['Đang hoạt động', 'bg-success/15 text-success', 'bg-success'],
  pending: ['Chờ duyệt', 'bg-warning/15 text-warning', 'bg-warning'],
  suspended: ['Tạm khoá', 'bg-error/15 text-error', 'bg-error'],
};

/*
 * Thẻ "Tổng quan" bên phải trang Cài đặt portal — đọc GET /suppliers/me (bản cũ lấy cứng từ file mock:
 * số chi nhánh, ngân hàng, số đuôi tài khoản… BE không có các field đó nên đã bỏ).
 */
export default function SupplierOverviewCard({ title = 'Tổng quan doanh nghiệp' }) {
  const { data } = useSupplierMe();
  const brand = usePortalBrand(useAuthStore((s) => s.user?.name));
  const [label, badge, dot] = STATUS[data?.status] ?? STATUS.pending;
  const rows = [
    { icon: Mail, label: 'Email', value: data?.contactEmail },
    { icon: Phone, label: 'SĐT', value: data?.contactPhone },
    { icon: Briefcase, label: 'Mã số thuế', value: data?.taxCode },
    { icon: Calendar, label: 'Tham gia', value: data?.createdAt && new Date(data.createdAt).toLocaleDateString('vi-VN') },
  ];

  return (
    <aside className="h-fit rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm lg:sticky lg:top-24">
      <h2 className="mb-4 font-display text-lg">{title}</h2>
      <div className="flex flex-col items-center text-center">
        <span className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-br from-secondary to-primary font-display text-2xl text-primary-content">{brand.initials}</span>
        <p className="mt-3 font-display text-lg">{brand.name}</p>
        {data && (
          <span className={`mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${badge}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${dot}`} /> {label}
          </span>
        )}
      </div>
      <dl className="mt-5 flex flex-col divide-y divide-base-200">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-3 py-2.5">
            <dt className="flex items-center gap-2 text-xs text-base-content/55"><r.icon width={14} height={14} className="text-base-content/40" />{r.label}</dt>
            <dd className="min-w-0 truncate text-right text-sm font-medium">{r.value || <span className="text-base-content/35">Chưa có</span>}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
