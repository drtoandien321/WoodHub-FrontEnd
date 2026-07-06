import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useMyStores, useDeleteStore } from '../../hooks/useStores.js';
import { useSupplierMe } from '../../hooks/useSupplierMe.js';
import StoreFormModal from '../../components/supplier/StoreFormModal.jsx';
import { Search, Store, Plus, MapPin, Phone, Eye, Pencil, Trash } from '../../components/suppliers/icons.jsx';

/*
 * SupplierBranches — danh sách CHI NHÁNH (Store) thật của nhà cung cấp.
 * ⚠️ Store thật (StoreResponse) CHỈ có: address/ward/district/city/phone/latitude/longitude —
 * KHÔNG có name/manager/status/performance/monthRevenue/rating/hours như mock cũ
 * (api/mock/manufacturerData.js) nên các KPI/hiệu suất giả đã bỏ hẳn, không bịa dữ liệu.
 *
 * Workshop chỉ được TỐI ĐA 1 chi nhánh — BE đã chặn ở tầng service (409) + unique index DB,
 * nhưng FE vẫn nên ẩn/disable nút sớm để trải nghiệm mượt hơn (validate 2 lớp, giống cách
 * AdminRoute chỉ là UX còn bảo mật thật nằm ở BE).
 */
export default function SupplierBranches() {
  const [q, setQ] = useState('');
  const { data: stores, isLoading } = useMyStores();
  const { data: me } = useSupplierMe();
  const deleteStore = useDeleteStore();
  const [modalMode, setModalMode] = useState(null); // null | 'create' | store object (đang sửa)

  const items = stores ?? [];
  const list = useMemo(
    () => items.filter((s) => [s.address, s.district, s.city].filter(Boolean).join(' ').toLowerCase().includes(q.toLowerCase())),
    [items, q]
  );

  const isWorkshopLimited = me?.type === 'workshop' && items.length >= 1;

  const handleDelete = (s) => {
    if (window.confirm(`Xoá chi nhánh "${s.address}"? Hành động này không thể hoàn tác.`)) deleteStore.mutate(s.id);
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-3xl">Chi nhánh</h1>
        <p className="text-base-content/60">Quản lý các chi nhánh (cửa hàng) của bạn trên WoodHub.</p>
      </header>

      <div className="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm lg:flex-row lg:items-center">
        <label className="input input-bordered flex flex-1 items-center gap-2">
          <Search width={16} height={16} className="text-base-content/40" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm kiếm theo địa chỉ, quận…" className="grow" />
        </label>
        <div className="tooltip tooltip-left" data-tip={isWorkshopLimited ? 'Xưởng sản xuất chỉ được đăng ký 1 địa chỉ' : undefined}>
          <button onClick={() => setModalMode('create')} disabled={isWorkshopLimited} className="btn btn-primary gap-2">
            <Plus width={16} height={16} /> Thêm chi nhánh
          </button>
        </div>
      </div>

      <section className="rounded-2xl border border-base-300 bg-base-100 p-2 shadow-sm md:p-4">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr className="text-base-content/55">
                <th>Địa chỉ</th><th>Quận/Huyện</th><th>Tỉnh/Thành</th><th>SĐT</th><th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={5} className="py-10 text-center text-base-content/50">Đang tải…</td></tr>}
              {!isLoading && list.map((s) => (
                <tr key={s.id} className="hover:bg-base-200/50">
                  <td>
                    <div className="flex items-center gap-2.5">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-base-200 text-primary"><Store width={16} height={16} /></span>
                      <Link to={`/portal/supplier/branches/${s.id}`} className="max-w-[220px] font-medium hover:text-primary">{s.address}</Link>
                    </div>
                  </td>
                  <td className="text-sm">{s.district || '—'}</td>
                  <td className="text-sm">{s.city || '—'}</td>
                  <td><span className="flex items-center gap-1 text-sm text-base-content/70">{s.phone ? <><Phone width={14} height={14} className="text-base-content/40" />{s.phone}</> : '—'}</span></td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <Link to={`/portal/supplier/branches/${s.id}`} className="btn btn-ghost btn-xs btn-square" aria-label="Xem chi tiết"><Eye width={15} height={15} /></Link>
                      <button onClick={() => setModalMode(s)} className="btn btn-ghost btn-xs btn-square" aria-label="Chỉnh sửa"><Pencil width={15} height={15} /></button>
                      <button onClick={() => handleDelete(s)} className="btn btn-ghost btn-xs btn-square text-error" aria-label="Xóa"><Trash width={15} height={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && !list.length && (
                <tr><td colSpan={5} className="py-10 text-center text-base-content/50">Chưa có chi nhánh nào. Bấm "Thêm chi nhánh" để bắt đầu.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <StoreFormModal
        key={modalMode === 'create' ? 'create' : modalMode?.id}
        open={!!modalMode}
        onClose={() => setModalMode(null)}
        initial={modalMode === 'create' ? null : modalMode}
      />
    </div>
  );
}
