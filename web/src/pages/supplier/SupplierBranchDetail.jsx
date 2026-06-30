import { useParams, Link } from 'react-router-dom';
import { formatVnd } from '../../utils/format.js';
import { findBranch } from '../../api/mock/manufacturerData.js';
import { branchMeta } from '../../utils/supplierStatus.js';
import StatusBadge from '../../components/supplier/StatusBadge.jsx';
import {
  Store, MapPin, Phone, Mail, Users, Clock, Info, Wallet, ShoppingBag, Star,
  Pencil, Package,
} from '../../components/suppliers/icons.jsx';

export default function SupplierBranchDetail() {
  const { branchId } = useParams();
  const b = findBranch(branchId);

  if (!b) {
    return (
      <div className="rounded-2xl border border-dashed border-base-300 bg-base-100 py-20 text-center">
        <p className="font-display text-xl">Không tìm thấy chi nhánh</p>
        <Link to="/portal/supplier/branches" className="btn btn-primary mt-4">Về danh sách chi nhánh</Link>
      </div>
    );
  }

  const stats = [
    { icon: Wallet, label: 'Doanh thu tháng', value: formatVnd(b.monthRevenue) },
    { icon: ShoppingBag, label: 'Đơn hàng tháng', value: b.monthOrders },
    { icon: Star, label: 'Đánh giá trung bình', value: `${b.rating}/5` },
  ];
  const rows = [
    { icon: MapPin, label: 'Địa chỉ', value: b.address },
    { icon: Phone, label: 'Số điện thoại', value: b.phone },
    { icon: Mail, label: 'Email', value: b.email },
    { icon: Users, label: 'Người quản lý', value: b.manager },
    { icon: Clock, label: 'Giờ hoạt động', value: b.hours },
  ];

  return (
    <div className="flex flex-col gap-6">
      <nav className="flex items-center gap-1.5 text-sm text-base-content/55">
        <Link to="/portal/supplier/branches" className="hover:text-primary">Chi nhánh</Link>
        <span>/</span><span className="font-medium text-base-content/80">Chi tiết chi nhánh</span>
      </nav>
      <header>
        <h1 className="font-display text-3xl">Chi tiết chi nhánh</h1>
        <p className="mt-1 text-base-content/60">Xem thông tin và quản lý chi nhánh của bạn.</p>
      </header>

      {/* Hero */}
      <section className="overflow-hidden rounded-3xl border border-base-300 bg-base-100 shadow-sm">
        <div className="h-32 w-full bg-[linear-gradient(135deg,#cdab7e_0%,#9a6f47_100%)] md:h-40" />
        <div className="px-5 pb-5 md:px-7">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex items-end gap-4">
              <span className="-mt-10 grid h-20 w-20 shrink-0 place-items-center rounded-2xl border-4 border-base-100 bg-base-200 text-primary shadow md:-mt-12 md:h-24 md:w-24"><Store width={32} height={32} /></span>
              <div>
                <h2 className="font-display text-2xl">{b.name}</h2>
                <StatusBadge meta={branchMeta(b.status)} className="mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:min-w-[460px]">
              {stats.map((s) => (
                <div key={s.label} className="flex items-center gap-2.5 rounded-2xl bg-base-200/60 p-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><s.icon width={18} height={18} /></span>
                  <div className="min-w-0"><p className="truncate text-base font-semibold leading-tight">{s.value}</p><p className="truncate text-xs text-base-content/55">{s.label}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Info + Map */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <h2 className="mb-4 font-display text-lg">Thông tin chi nhánh</h2>
          <dl className="flex flex-col gap-3.5">
            {rows.map((r) => (
              <div key={r.label} className="flex gap-3">
                <dt className="flex w-36 shrink-0 items-center gap-2 text-sm text-base-content/55"><r.icon width={15} height={15} className="text-base-content/40" />{r.label}</dt>
                <dd className="text-sm">{r.value}</dd>
              </div>
            ))}
            <div className="flex gap-3">
              <dt className="flex w-36 shrink-0 items-center gap-2 text-sm text-base-content/55"><Info width={15} height={15} className="text-base-content/40" />Trạng thái</dt>
              <dd><StatusBadge meta={branchMeta(b.status)} /></dd>
            </div>
            <div className="flex gap-3">
              <dt className="flex w-36 shrink-0 items-center gap-2 text-sm text-base-content/55"><Info width={15} height={15} className="text-base-content/40" />Mô tả</dt>
              <dd className="text-sm leading-relaxed text-base-content/75">{b.description}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-base-300 bg-base-100 p-3 shadow-sm">
          <div className="relative h-full min-h-64 overflow-hidden rounded-xl bg-[linear-gradient(135deg,#eef0e8_0%,#dfe5d4_60%,#cfe0e8_100%)]">
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-primary"><MapPin width={34} height={34} /></span>
            <span className="absolute bottom-2 right-2 rounded-md bg-base-100/80 px-2 py-1 text-[11px] text-base-content/60">Bản đồ minh hoạ</span>
          </div>
        </section>
      </div>

      {/* Footer actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <button className="btn btn-outline gap-2"><Pencil width={16} height={16} /> Chỉnh sửa</button>
        <button className="btn btn-outline btn-warning gap-2">Tạm ngưng hoạt động</button>
        <Link to="/portal/supplier/products" className="btn btn-primary gap-2"><Package width={16} height={16} /> Xem sản phẩm của chi nhánh</Link>
      </div>
    </div>
  );
}
