import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { formatVnd } from '../../utils/format.js';
import { M_PRODUCTS, PRODUCT_SUMMARY } from '../../api/mock/manufacturerData.js';
import { productMeta } from '../../utils/supplierStatus.js';
import StatCard from '../../components/supplier/StatCard.jsx';
import StatusBadge from '../../components/supplier/StatusBadge.jsx';
import ProductFormModal from '../../components/supplier/ProductFormModal.jsx';
import { Package, ShoppingBag, Search, Plus, Eye, Pencil, Trash } from '../../components/suppliers/icons.jsx';

const MATERIALS = ['Gỗ sồi', 'Gỗ tần bì', 'Gỗ óc chó', 'MDF'];
const STATUS_OPTS = [['all', 'Tất cả trạng thái'], ['active', 'Đang bán'], ['low', 'Sắp hết hàng'], ['out', 'Hết hàng'], ['hidden', 'Đang ẩn']];

export default function SupplierProducts() {
  const [q, setQ] = useState('');
  const [material, setMaterial] = useState('all');
  const [status, setStatus] = useState('all');
  const [modal, setModal] = useState(false);

  const list = useMemo(
    () => M_PRODUCTS.filter((p) =>
      (material === 'all' || p.material === material) &&
      (status === 'all' || p.status === status) &&
      (p.nameVi.toLowerCase().includes(q.toLowerCase()) || p.nameEn.toLowerCase().includes(q.toLowerCase()))),
    [q, material, status]
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="font-display text-3xl">Sản phẩm</h1>
        <p className="text-base-content/60">Quản lý danh sách sản phẩm hoàn thiện bạn đang bán trên WoodHub.</p>
      </header>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Package} label="Tổng sản phẩm" value={PRODUCT_SUMMARY.total} hint="Tất cả sản phẩm" />
        <StatCard icon={ShoppingBag} label="Đang bán" value={PRODUCT_SUMMARY.active} hint="75.0% tổng sản phẩm" iconWrap="bg-success/10 text-success" />
        <StatCard icon={Package} label="Sắp hết hàng" value={PRODUCT_SUMMARY.low} hint="15.6% tổng sản phẩm" iconWrap="bg-warning/10 text-warning" />
        <StatCard icon={Package} label="Hết hàng" value={PRODUCT_SUMMARY.out} hint="9.4% tổng sản phẩm" iconWrap="bg-error/10 text-error" />
      </div>

      {/* Filter bar */}
      <div className="flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm lg:flex-row lg:items-center">
        <label className="input input-bordered flex flex-1 items-center gap-2">
          <Search width={16} height={16} className="text-base-content/40" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm kiếm sản phẩm…" className="grow" />
        </label>
        <select value={material} onChange={(e) => setMaterial(e.target.value)} className="select select-bordered" aria-label="Lọc chất liệu">
          <option value="all">Tất cả chất liệu</option>
          {MATERIALS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="select select-bordered" aria-label="Lọc trạng thái">
          {STATUS_OPTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <button onClick={() => setModal(true)} className="btn btn-primary gap-2"><Plus width={16} height={16} /> Thêm sản phẩm</button>
      </div>

      {/* Table */}
      <section className="rounded-2xl border border-base-300 bg-base-100 p-2 shadow-sm md:p-4">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr className="text-base-content/55">
                <th>Ảnh</th><th>Tên sản phẩm</th><th>Danh mục</th><th className="text-right">Giá</th>
                <th>Chất liệu</th><th className="text-right">Tồn kho</th><th>Trạng thái</th><th>Chi nhánh</th><th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className="hover:bg-base-200/50">
                  <td><img src={p.image} alt="" className="h-12 w-16 rounded-lg object-cover" loading="lazy" /></td>
                  <td>
                    <Link to={`/portal/supplier/products/${p.id}`} className="font-medium hover:text-primary">{p.nameVi}</Link>
                    <p className="text-xs text-base-content/45">{p.nameEn}</p>
                  </td>
                  <td className="text-sm">{p.category}</td>
                  <td className="text-right font-medium">{formatVnd(p.price)}</td>
                  <td className="text-sm">{p.material}</td>
                  <td className="text-right">{p.stock}</td>
                  <td><StatusBadge meta={productMeta(p.status)} /></td>
                  <td className="text-sm">{p.branch}</td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <Link to={`/portal/supplier/products/${p.id}`} className="btn btn-ghost btn-xs btn-square" aria-label="Xem"><Eye width={15} height={15} /></Link>
                      <button className="btn btn-ghost btn-xs btn-square" aria-label="Sửa"><Pencil width={15} height={15} /></button>
                      <button className="btn btn-ghost btn-xs btn-square text-error" aria-label="Xóa"><Trash width={15} height={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!list.length && <tr><td colSpan={9} className="py-10 text-center text-base-content/50">Không tìm thấy sản phẩm phù hợp.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <ProductFormModal open={modal} onClose={() => setModal(false)} />
    </div>
  );
}
