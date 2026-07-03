import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { formatVnd } from '../../utils/format.js';
import { useMyProducts, useMyProductDetail, useDeleteProduct } from '../../hooks/useMyProducts.js';
import { useCategories, useMaterials } from '../../hooks/useCatalog.js';
import { productMeta } from '../../utils/supplierStatus.js';
import StatCard from '../../components/supplier/StatCard.jsx';
import StatusBadge from '../../components/supplier/StatusBadge.jsx';
import ProductFormModal from '../../components/supplier/ProductFormModal.jsx';
import { Package, ShoppingBag, Search, Plus, Eye, Pencil, Trash } from '../../components/suppliers/icons.jsx';

const STATUS_OPTS = [['all', 'Tất cả trạng thái'], ['draft', 'Nháp'], ['active', 'Đang bán'], ['hidden', 'Đang ẩn']];

export default function SupplierProducts() {
  const [q, setQ] = useState('');
  const [materialName, setMaterialName] = useState('all');
  const [status, setStatus] = useState('all');
  const [modalMode, setModalMode] = useState(null); // null | 'create' | productId (đang sửa)

  const { data, isLoading } = useMyProducts(status !== 'all' ? { status } : undefined);
  const { data: categories } = useCategories();
  const { data: materials } = useMaterials();
  const deleteProduct = useDeleteProduct();
  // Sửa cần đủ variants/images (list chỉ có summary) — fetch chi tiết riêng khi mở modal sửa
  const editingDetail = useMyProductDetail(typeof modalMode === 'string' && modalMode !== 'create' ? modalMode : undefined);

  const items = data?.content ?? [];
  const list = useMemo(
    () => items.filter((p) =>
      (materialName === 'all' || p.materialName === materialName) &&
      p.name.toLowerCase().includes(q.toLowerCase())),
    [items, materialName, q]
  );
  const counts = useMemo(() => ({
    total: items.length,
    active: items.filter((p) => p.status === 'active').length,
    draft: items.filter((p) => p.status === 'draft').length,
    hidden: items.filter((p) => p.status === 'hidden').length,
  }), [items]);

  const handleDelete = (p) => {
    if (window.confirm(`Xoá "${p.name}"? Hành động này không thể hoàn tác.`)) deleteProduct.mutate(p.id);
  };

  const closeModal = () => setModalMode(null);
  const modalOpen = modalMode === 'create' || (typeof modalMode === 'string' && !!editingDetail.data);

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-3xl">Sản phẩm</h1>
        <p className="text-base-content/60">Quản lý danh sách sản phẩm bạn đang bán trên WoodHub.</p>
      </header>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Package} label="Tổng sản phẩm" value={counts.total} hint="Tất cả sản phẩm" />
        <StatCard icon={ShoppingBag} label="Đang bán" value={counts.active} iconWrap="bg-success/10 text-success" />
        <StatCard icon={Package} label="Nháp" value={counts.draft} iconWrap="bg-base-300/60 text-base-content/60" />
        <StatCard icon={Package} label="Đang ẩn" value={counts.hidden} iconWrap="bg-warning/10 text-warning" />
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm lg:flex-row lg:items-center">
        <label className="input input-bordered flex flex-1 items-center gap-2">
          <Search width={16} height={16} className="text-base-content/40" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm kiếm sản phẩm…" className="grow" />
        </label>
        <select value={materialName} onChange={(e) => setMaterialName(e.target.value)} className="select select-bordered" aria-label="Lọc chất liệu">
          <option value="all">Tất cả chất liệu</option>
          {(materials ?? []).map((m) => <option key={m.id} value={m.name}>{m.name}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="select select-bordered" aria-label="Lọc trạng thái">
          {STATUS_OPTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <button onClick={() => setModalMode('create')} className="btn btn-primary gap-2"><Plus width={16} height={16} /> Thêm sản phẩm</button>
      </div>

      <section className="rounded-2xl border border-base-300 bg-base-100 p-2 shadow-sm md:p-4">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr className="text-base-content/55">
                <th>Ảnh</th><th>Tên sản phẩm</th><th>Danh mục</th><th className="text-right">Giá</th>
                <th>Chất liệu</th><th>Trạng thái</th><th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={7} className="py-10 text-center text-base-content/50">Đang tải…</td></tr>}
              {!isLoading && list.map((p) => (
                <tr key={p.id} className="hover:bg-base-200/50">
                  <td>
                    {p.primaryImageUrl
                      ? <img src={p.primaryImageUrl} alt="" className="h-12 w-16 rounded-lg object-cover" loading="lazy" />
                      : <div className="grid h-12 w-16 place-items-center rounded-lg bg-base-200 text-[10px] text-base-content/40">Chưa có ảnh</div>}
                  </td>
                  <td><Link to={`/portal/supplier/products/${p.id}`} className="font-medium hover:text-primary">{p.name}</Link></td>
                  <td className="text-sm">{p.categoryName}</td>
                  <td className="text-right font-medium">{p.priceFrom != null ? `Từ ${formatVnd(p.priceFrom)}` : '—'}</td>
                  <td className="text-sm">{p.materialName ?? '—'}</td>
                  <td><StatusBadge meta={productMeta(p.status)} /></td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <Link to={`/portal/supplier/products/${p.id}`} className="btn btn-ghost btn-xs btn-square" aria-label="Xem"><Eye width={15} height={15} /></Link>
                      <button onClick={() => setModalMode(p.id)} className="btn btn-ghost btn-xs btn-square" aria-label="Sửa"><Pencil width={15} height={15} /></button>
                      <button onClick={() => handleDelete(p)} className="btn btn-ghost btn-xs btn-square text-error" aria-label="Xóa"><Trash width={15} height={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!isLoading && !list.length && <tr><td colSpan={7} className="py-10 text-center text-base-content/50">Không tìm thấy sản phẩm phù hợp.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      {categories && (
        <ProductFormModal
          key={modalMode === 'create' ? 'create' : modalMode} // remount mỗi lần mở sửa SP khác — reset state form sạch
          open={modalOpen}
          onClose={closeModal}
          initial={modalMode === 'create' ? null : editingDetail.data}
        />
      )}
    </div>
  );
}
