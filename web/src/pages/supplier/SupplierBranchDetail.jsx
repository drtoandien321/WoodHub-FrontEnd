import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { formatVnd } from '../../utils/format.js';
import { useMyStores, useDeleteStore, useStoreInventory, useAdjustStock, useDeleteStock } from '../../hooks/useStores.js';
import { useMyProducts } from '../../hooks/useMyProducts.js';
import StoreFormModal from '../../components/supplier/StoreFormModal.jsx';
import StockFormModal from '../../components/supplier/StockFormModal.jsx';
import { Store, MapPin, Phone, Info, Pencil, Trash, Plus, Package } from '../../components/suppliers/icons.jsx';

/*
 * SupplierBranchDetail — chi tiết 1 CHI NHÁNH thật + TỒN KHO theo biến thể.
 * ⚠️ BE không có GET /stores/{id} riêng — chỉ có GET /stores (danh sách của tôi), nên lấy
 * store hiện tại bằng cách tìm trong danh sách đã fetch (giống cách BE giới hạn — mỗi supplier
 * thường chỉ có vài chi nhánh, không cần phân trang riêng).
 */
export default function SupplierBranchDetail() {
  const { branchId } = useParams();
  const navigate = useNavigate();
  const { data: stores, isLoading: loadingStores } = useMyStores();
  const store = stores?.find((s) => s.id === branchId);

  const { data: inventory, isLoading: loadingInventory } = useStoreInventory(branchId);
  const { data: productsPage } = useMyProducts();
  const productNameById = new Map((productsPage?.content ?? []).map((p) => [p.id, p.name]));

  const deleteStore = useDeleteStore();
  const adjustStock = useAdjustStock(branchId);
  const deleteStock = useDeleteStock(branchId);

  const [editOpen, setEditOpen] = useState(false);
  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [deltaByVariant, setDeltaByVariant] = useState({});

  if (loadingStores) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="skeleton h-64 rounded-2xl" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="rounded-2xl border border-dashed border-base-300 bg-base-100 py-20 text-center">
        <p className="font-display text-xl">Không tìm thấy chi nhánh</p>
        <Link to="/portal/supplier/branches" className="btn btn-primary mt-4">Về danh sách chi nhánh</Link>
      </div>
    );
  }

  const rows = [
    { icon: MapPin, label: 'Địa chỉ', value: store.address },
    { icon: Info, label: 'Phường/Xã', value: store.ward || '—' },
    { icon: Info, label: 'Quận/Huyện', value: store.district || '—' },
    { icon: Info, label: 'Tỉnh/Thành', value: store.city || '—' },
    { icon: Phone, label: 'Số điện thoại', value: store.phone || '—' },
  ];

  const handleDeleteStore = () => {
    if (window.confirm(`Xoá chi nhánh "${store.address}"? Toàn bộ tồn kho của chi nhánh này cũng sẽ bị xoá.`)) {
      deleteStore.mutate(store.id, { onSuccess: () => navigate('/portal/supplier/branches') });
    }
  };

  const applyDelta = (variantId) => {
    const raw = deltaByVariant[variantId];
    const delta = Number(raw);
    if (!raw || Number.isNaN(delta) || delta === 0) return;
    adjustStock.mutate({ storeId: branchId, variantId, delta }, {
      onSuccess: () => setDeltaByVariant((s) => ({ ...s, [variantId]: '' })),
      onError: (e) => window.alert(e?.response?.data?.message ?? 'Không thể điều chỉnh tồn kho'),
    });
  };

  const handleDeleteStock = (variantId) => {
    if (window.confirm('Xoá biến thể này khỏi kho chi nhánh?')) deleteStock.mutate({ storeId: branchId, variantId });
  };

  return (
    <div className="flex flex-col gap-6">
      <nav className="flex items-center gap-1.5 text-sm text-base-content/55">
        <Link to="/portal/supplier/branches" className="hover:text-primary">Chi nhánh</Link>
        <span>/</span><span className="font-medium text-base-content/80">Chi tiết chi nhánh</span>
      </nav>
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Chi tiết chi nhánh</h1>
          <p className="mt-1 text-base-content/60">Xem thông tin và quản lý tồn kho của chi nhánh.</p>
        </div>
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-base-200 text-primary"><Store width={26} height={26} /></span>
      </header>

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
          </dl>
          <div className="mt-5 flex flex-wrap gap-2">
            <button onClick={() => setEditOpen(true)} className="btn btn-outline gap-2"><Pencil width={16} height={16} /> Chỉnh sửa</button>
            <button onClick={handleDeleteStore} disabled={deleteStore.isPending} className="btn btn-outline btn-error gap-2"><Trash width={16} height={16} /> Xóa chi nhánh</button>
          </div>
        </section>

        <section className="rounded-2xl border border-base-300 bg-base-100 p-3 shadow-sm">
          <div className="relative h-full min-h-64 overflow-hidden rounded-xl bg-[linear-gradient(135deg,#eef0e8_0%,#dfe5d4_60%,#cfe0e8_100%)]">
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-primary"><MapPin width={34} height={34} /></span>
            <span className="absolute bottom-2 right-2 rounded-md bg-base-100/80 px-2 py-1 text-[11px] text-base-content/60">Bản đồ minh hoạ</span>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-base-300 bg-base-100 p-2 shadow-sm md:p-4">
        <div className="mb-3 flex items-center justify-between px-2 md:px-0">
          <h2 className="flex items-center gap-2 font-display text-lg"><Package width={18} height={18} /> Tồn kho ({inventory?.length ?? 0})</h2>
          <button onClick={() => setStockModalOpen(true)} className="btn btn-primary btn-sm gap-1.5"><Plus width={14} height={14} /> Thêm biến thể</button>
        </div>
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr className="text-base-content/55">
                <th>Sản phẩm</th><th>SKU / Màu / Kích thước</th><th className="text-right">Giá</th>
                <th className="text-right">Tồn kho</th><th>Điều chỉnh</th><th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loadingInventory && <tr><td colSpan={6} className="py-10 text-center text-base-content/50">Đang tải…</td></tr>}
              {!loadingInventory && (inventory ?? []).map((inv) => (
                <tr key={inv.variantId} className="hover:bg-base-200/50">
                  <td className="text-sm font-medium">{productNameById.get(inv.productId) ?? '—'}</td>
                  <td className="text-sm text-base-content/70">{[inv.sku, inv.color, inv.dimensions].filter(Boolean).join(' · ') || '—'}</td>
                  <td className="text-right text-sm">{inv.price != null ? formatVnd(inv.price) : '—'}</td>
                  <td className="text-right font-semibold">{inv.stockQuantity}</td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number" placeholder="±SL"
                        value={deltaByVariant[inv.variantId] ?? ''}
                        onChange={(e) => setDeltaByVariant((s) => ({ ...s, [inv.variantId]: e.target.value }))}
                        className="input input-bordered input-xs w-20"
                      />
                      <button onClick={() => applyDelta(inv.variantId)} disabled={adjustStock.isPending} className="btn btn-outline btn-xs">Áp dụng</button>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center justify-end">
                      <button onClick={() => handleDeleteStock(inv.variantId)} className="btn btn-ghost btn-xs btn-square text-error" aria-label="Xóa khỏi kho"><Trash width={15} height={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loadingInventory && !inventory?.length && (
                <tr><td colSpan={6} className="py-10 text-center text-base-content/50">Chưa có biến thể nào trong kho chi nhánh này.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <StoreFormModal open={editOpen} onClose={() => setEditOpen(false)} initial={store} />
      <StockFormModal
        open={stockModalOpen}
        onClose={() => setStockModalOpen(false)}
        storeId={branchId}
        existingVariantIds={(inventory ?? []).map((i) => i.variantId)}
      />
    </div>
  );
}
