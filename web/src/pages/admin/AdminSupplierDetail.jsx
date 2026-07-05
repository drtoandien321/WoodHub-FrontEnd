import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAdminSupplierDetail, useUpdateSupplierStatus } from '../../hooks/useAdminSuppliers.js';
import StatusBadge from '../../components/supplier/StatusBadge.jsx';
import { supplierAdminMeta, SUPPLIER_TYPE_LABEL } from '../../utils/adminStatus.js';
import { Briefcase, Info, Mail, Phone } from '../../components/suppliers/icons.jsx';

export default function AdminSupplierDetail() {
  const { id } = useParams();
  const { data: supplier, isLoading, isError } = useAdminSupplierDetail(id);
  const updateStatus = useUpdateSupplierStatus();

  const [status, setStatus] = useState('');
  const [commissionRate, setCommissionRate] = useState('');
  const [err, setErr] = useState('');

  // Đồng bộ form theo data mới tải — chỉ chạy lại khi supplier.id đổi (tránh ghi đè lúc user đang gõ dở).
  useEffect(() => {
    if (supplier) {
      setStatus(supplier.status);
      setCommissionRate(String(supplier.commissionRate ?? 0));
    }
  }, [supplier?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isLoading) {
    return <div className="skeleton h-64 rounded-2xl" />;
  }
  if (isError || !supplier) {
    return (
      <div className="rounded-2xl border border-dashed border-base-300 bg-base-100 py-20 text-center">
        <p className="font-display text-xl">Không tìm thấy nhà cung cấp</p>
        <Link to="/admin/suppliers" className="btn btn-primary mt-4">Về danh sách</Link>
      </div>
    );
  }

  const dirty = status !== supplier.status || Number(commissionRate) !== Number(supplier.commissionRate ?? 0);

  const save = async () => {
    setErr('');
    try {
      await updateStatus.mutateAsync({ id: supplier.id, status, commissionRate: Number(commissionRate) });
    } catch (e) {
      setErr(e?.response?.data?.message ?? 'Không lưu được, vui lòng thử lại');
    }
  };

  const rows = [
    { icon: Briefcase, label: 'Loại', value: SUPPLIER_TYPE_LABEL[supplier.type] ?? supplier.type },
    { icon: Info, label: 'Mã số thuế', value: supplier.taxCode || '—' },
    { icon: Mail, label: 'Email liên hệ', value: supplier.contactEmail || '—' },
    { icon: Phone, label: 'SĐT liên hệ', value: supplier.contactPhone || '—' },
  ];

  return (
    <div className="flex flex-col gap-6">
      <nav className="flex items-center gap-1.5 text-sm text-base-content/55">
        <Link to="/admin/suppliers" className="hover:text-primary">Nhà cung cấp</Link>
        <span>/</span><span className="font-medium text-base-content/80">Chi tiết</span>
      </nav>

      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">{supplier.businessName}</h1>
          <div className="mt-2"><StatusBadge meta={supplierAdminMeta(supplier.status)} /></div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <h2 className="mb-4 font-display text-lg">Thông tin</h2>
          <dl className="flex flex-col gap-3.5">
            {rows.map((r) => (
              <div key={r.label} className="flex gap-3">
                <dt className="flex w-36 shrink-0 items-center gap-2 text-sm text-base-content/55"><r.icon width={15} height={15} className="text-base-content/40" />{r.label}</dt>
                <dd className="text-sm">{r.value}</dd>
              </div>
            ))}
          </dl>
          {supplier.description && <p className="mt-4 text-sm leading-relaxed text-base-content/75">{supplier.description}</p>}
        </section>

        <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <h2 className="mb-4 font-display text-lg">Duyệt / Khoá tài khoản</h2>
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-base-content/70">Trạng thái</span>
              <select value={status} onChange={(e) => setStatus(e.target.value)} className="select select-bordered w-full">
                <option value="pending">Chờ duyệt</option>
                <option value="active">Đang hoạt động</option>
                <option value="suspended">Đã khoá</option>
              </select>
              <span className="text-xs text-base-content/45">Chuyển sang "Đã khoá" sẽ hạ quyền tài khoản về customer; "Đang hoạt động" nâng lại thành supplier.</span>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-base-content/70">Hoa hồng (%)</span>
              <input type="number" min="0" max="100" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} className="input input-bordered w-full" />
            </label>
            {err && <p className="text-xs text-error">{err}</p>}
            <button onClick={save} disabled={!dirty || updateStatus.isPending} className="btn btn-primary">
              {updateStatus.isPending ? <span className="loading loading-spinner loading-sm" /> : 'Lưu thay đổi'}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
