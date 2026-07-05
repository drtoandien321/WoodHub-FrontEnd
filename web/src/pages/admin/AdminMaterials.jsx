import { useState, useMemo } from 'react';
import { useMaterials } from '../../hooks/useCatalog.js';
import { useDeleteMaterial } from '../../hooks/useAdminMaterials.js';
import MaterialFormModal from '../../components/admin/MaterialFormModal.jsx';
import { Search, Plus, Pencil, Trash } from '../../components/suppliers/icons.jsx';

/*
 * AdminMaterials — BE không phân trang (GET /materials trả toàn bộ), nên search ở đây lọc
 * CLIENT-SIDE trên TOÀN BỘ dữ liệu đã tải — khác các trang có Pageable (Users/Suppliers), nơi
 * filter client-side trên 1 trang sẽ gây hiểu nhầm kết quả.
 */
export default function AdminMaterials() {
  const { data: materials, isLoading } = useMaterials();
  const deleteMaterial = useDeleteMaterial();
  const [q, setQ] = useState('');
  const [modalMode, setModalMode] = useState(null); // null | 'create' | material đang sửa

  const items = materials ?? [];
  const list = useMemo(
    () => items.filter((m) => m.name.toLowerCase().includes(q.toLowerCase())),
    [items, q]
  );

  const handleDelete = (m) => {
    if (!window.confirm(`Xoá vật liệu "${m.name}"? Hành động này không thể hoàn tác.`)) return;
    deleteMaterial.mutate(m.id, {
      onError: () => window.alert('Xoá vật liệu thất bại, vui lòng thử lại'),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Vật liệu</h1>
          <p className="mt-1 text-base-content/60">Quản lý danh sách vật liệu gỗ dùng cho sản phẩm.</p>
        </div>
        <button onClick={() => setModalMode('create')} className="btn btn-primary gap-2"><Plus width={16} height={16} /> Thêm vật liệu</button>
      </header>

      <label className="input input-bordered flex max-w-sm items-center gap-2">
        <Search width={16} height={16} className="text-base-content/40" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm kiếm vật liệu…" className="grow" />
      </label>

      <section className="rounded-2xl border border-base-300 bg-base-100 p-2 shadow-sm md:p-4">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr className="text-base-content/55">
                <th>Tên vật liệu</th><th>Ngày tạo</th><th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={3} className="py-10 text-center text-base-content/50">Đang tải…</td></tr>}
              {!isLoading && list.map((m) => (
                <tr key={m.id} className="hover:bg-base-200/50">
                  <td className="font-medium">{m.name}</td>
                  <td className="text-sm text-base-content/60">{new Date(m.createdAt).toLocaleDateString('vi-VN')}</td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setModalMode(m)} className="btn btn-ghost btn-xs btn-square" aria-label="Sửa"><Pencil width={15} height={15} /></button>
                      <button onClick={() => handleDelete(m)} className="btn btn-ghost btn-xs btn-square text-error" aria-label="Xóa"><Trash width={15} height={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && !list.length && (
                <tr><td colSpan={3} className="py-10 text-center text-base-content/50">Không tìm thấy vật liệu phù hợp.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <MaterialFormModal
        key={modalMode === 'create' ? 'create' : modalMode?.id}
        open={!!modalMode}
        onClose={() => setModalMode(null)}
        initial={modalMode === 'create' ? null : modalMode}
      />
    </div>
  );
}
