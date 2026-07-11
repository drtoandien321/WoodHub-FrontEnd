import { useState } from 'react';
import { useAdminSubscriptionPlans, useDeleteSubscriptionPlan } from '../../hooks/useAdminSubscriptionPlans.js';
import SubscriptionPlanFormModal from '../../components/admin/SubscriptionPlanFormModal.jsx';
import { formatVnd } from '../../utils/format.js';
import { Plus, Pencil, Trash } from '../../components/suppliers/icons.jsx';

/*
 * AdminSubscriptionPlans (/admin/subscription-plans) — CRUD gói đăng ký (mục 6 tài liệu
 * Subscription). GET /subscription-plans/all không phân trang, không search ở BE → hiện hết,
 * giống AdminMaterials/AdminCategories.
 */
export default function AdminSubscriptionPlans() {
  const { data: plans, isLoading } = useAdminSubscriptionPlans();
  const deletePlan = useDeleteSubscriptionPlan();
  const [modalMode, setModalMode] = useState(null); // null | 'create' | plan đang sửa

  const items = plans ?? [];

  const handleDelete = (p) => {
    if (!window.confirm(`Xoá gói "${p.displayName}"? Hành động này không thể hoàn tác.`)) return;
    deletePlan.mutate(p.id, {
      onError: (err) => window.alert(err?.response?.data?.message || 'Xoá gói thất bại, vui lòng thử lại'),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Gói đăng ký</h1>
          <p className="mt-1 text-base-content/60">Quản lý các gói subscription hiển thị ở trang Pricing.</p>
        </div>
        <button onClick={() => setModalMode('create')} className="btn btn-primary gap-2"><Plus width={16} height={16} /> Thêm gói</button>
      </header>

      <section className="rounded-2xl border border-base-300 bg-base-100 p-2 shadow-sm md:p-4">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr className="text-base-content/55">
                <th>Gói</th><th>Giá</th><th>Trạng thái</th><th>Thứ tự</th><th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={5} className="py-10 text-center text-base-content/50">Đang tải…</td></tr>}
              {!isLoading && items.map((p) => (
                <tr key={p.id} className="hover:bg-base-200/50">
                  <td>
                    <p className="font-medium">{p.displayName}</p>
                    <p className="text-xs text-base-content/50">{p.name}</p>
                  </td>
                  <td className="text-sm">{p.price === 0 ? 'Miễn phí' : formatVnd(p.price)}</td>
                  <td>
                    <span className={`badge badge-sm ${p.isActive ? 'badge-success' : 'badge-ghost'}`}>
                      {p.isActive ? 'Đang bán' : 'Đã tắt'}
                    </span>
                  </td>
                  <td className="text-sm text-base-content/60">{p.sortOrder}</td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setModalMode(p)} className="btn btn-ghost btn-xs btn-square" aria-label="Sửa"><Pencil width={15} height={15} /></button>
                      <button onClick={() => handleDelete(p)} className="btn btn-ghost btn-xs btn-square text-error" aria-label="Xóa"><Trash width={15} height={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && !items.length && (
                <tr><td colSpan={5} className="py-10 text-center text-base-content/50">Chưa có gói nào.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <SubscriptionPlanFormModal
        key={modalMode === 'create' ? 'create' : modalMode?.id}
        open={!!modalMode}
        onClose={() => setModalMode(null)}
        initial={modalMode === 'create' ? null : modalMode}
      />
    </div>
  );
}
