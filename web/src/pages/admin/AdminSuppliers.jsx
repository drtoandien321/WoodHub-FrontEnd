import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAdminSuppliers } from '../../hooks/useAdminSuppliers.js';
import StatusBadge from '../../components/supplier/StatusBadge.jsx';
import StatCard from '../../components/supplier/StatCard.jsx';
import SupplierFormModal from '../../components/admin/SupplierFormModal.jsx';
import { supplierAdminMeta, SUPPLIER_TYPE_LABEL } from '../../utils/adminStatus.js';
import { Briefcase, Plus, Eye } from '../../components/suppliers/icons.jsx';

/*
 * AdminSuppliers — danh sách nhà cung cấp (GET /suppliers, admin). CHỈ filter theo status/type
 * (2 param BE thật hỗ trợ) — KHÔNG thêm ô tìm kiếm tự do, vì BE không có param search và filter
 * client-side trên 1 trang phân trang sẽ gây hiểu nhầm kết quả (chỉ lọc được trang hiện tại).
 */
const PAGE_SIZE = 10;

export default function AdminSuppliers() {
  const [status, setStatus] = useState('all');
  const [type, setType] = useState('all');
  const [page, setPage] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  const params = { page, size: PAGE_SIZE };
  if (status !== 'all') params.status = status;
  if (type !== 'all') params.type = type;

  const { data, isLoading } = useAdminSuppliers(params);
  const items = data?.content ?? [];
  const pageInfo = data?.page ?? { number: 0, totalPages: 1, totalElements: 0 };

  const counts = {
    total: pageInfo.totalElements,
    active: items.filter((s) => s.status === 'active').length,
    pending: items.filter((s) => s.status === 'pending').length,
    suspended: items.filter((s) => s.status === 'suspended').length,
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Nhà cung cấp</h1>
          <p className="mt-1 text-base-content/60">Quản lý tài khoản nhà cung cấp — tạo mới, duyệt, khoá.</p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn btn-primary gap-2"><Plus width={16} height={16} /> Tạo nhà cung cấp</button>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Briefcase} label="Tổng (trang này / tổng)" value={`${items.length} / ${counts.total}`} hint="Theo bộ lọc hiện tại" />
        <StatCard icon={Briefcase} label="Đang hoạt động" value={counts.active} iconWrap="bg-success/10 text-success" />
        <StatCard icon={Briefcase} label="Chờ duyệt" value={counts.pending} iconWrap="bg-warning/10 text-warning" />
        <StatCard icon={Briefcase} label="Đã khoá" value={counts.suspended} iconWrap="bg-error/10 text-error" />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm sm:flex-row sm:items-center">
        <select value={type} onChange={(e) => { setType(e.target.value); setPage(0); }} className="select select-bordered" aria-label="Lọc loại">
          <option value="all">Tất cả loại</option>
          <option value="retailer">Retailer</option>
          <option value="workshop">Workshop</option>
        </select>
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }} className="select select-bordered" aria-label="Lọc trạng thái">
          <option value="all">Tất cả trạng thái</option>
          <option value="pending">Chờ duyệt</option>
          <option value="active">Đang hoạt động</option>
          <option value="suspended">Đã khoá</option>
        </select>
      </div>

      <section className="rounded-2xl border border-base-300 bg-base-100 p-2 shadow-sm md:p-4">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr className="text-base-content/55">
                <th>Tên doanh nghiệp</th><th>Loại</th><th>Trạng thái</th><th>Ngày tạo</th><th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={5} className="py-10 text-center text-base-content/50">Đang tải…</td></tr>}
              {!isLoading && items.map((s) => (
                <tr key={s.id} className="hover:bg-base-200/50">
                  <td><Link to={`/admin/suppliers/${s.id}`} className="font-medium hover:text-primary">{s.businessName}</Link></td>
                  <td className="text-sm">{SUPPLIER_TYPE_LABEL[s.type] ?? s.type}</td>
                  <td><StatusBadge meta={supplierAdminMeta(s.status)} /></td>
                  <td className="text-sm text-base-content/60">{new Date(s.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td>
                    <div className="flex items-center justify-end">
                      <Link to={`/admin/suppliers/${s.id}`} className="btn btn-ghost btn-xs btn-square" aria-label="Xem chi tiết"><Eye width={15} height={15} /></Link>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && !items.length && (
                <tr><td colSpan={5} className="py-10 text-center text-base-content/50">Không có nhà cung cấp nào phù hợp.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {pageInfo.totalPages > 1 && (
          <div className="flex items-center justify-between px-2 py-3 text-sm text-base-content/60">
            <span>Trang {pageInfo.number + 1} / {pageInfo.totalPages} — {pageInfo.totalElements} nhà cung cấp</span>
            <div className="join">
              <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={pageInfo.number === 0} className="btn btn-sm join-item">«</button>
              <button onClick={() => setPage((p) => Math.min(pageInfo.totalPages - 1, p + 1))} disabled={pageInfo.number >= pageInfo.totalPages - 1} className="btn btn-sm join-item">»</button>
            </div>
          </div>
        )}
      </section>

      <SupplierFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
