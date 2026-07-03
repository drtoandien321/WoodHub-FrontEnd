import { useState } from 'react';
import { useMyProducts, useVariants } from '../../hooks/useMyProducts.js';
import { useAddStock } from '../../hooks/useStores.js';
import { X } from '../suppliers/icons.jsx';

/*
 * StockFormModal — thêm 1 BIẾN THỂ mới vào kho của chi nhánh (POST /stores/{id}/inventory/{variantId}).
 * Chọn theo 2 bước (sản phẩm → biến thể) vì BE không có endpoint liệt kê toàn bộ variant của
 * supplier — chỉ có GET /products/{id}/variants theo từng sản phẩm.
 * CHỈ dùng để thêm MỚI; biến thể đã có trong kho chi nhánh này phải điều chỉnh bằng adjustStock
 * (BE trả 409 nếu addStock lại biến thể đã tồn tại — xem client.js).
 */
export default function StockFormModal({ open, onClose, storeId, existingVariantIds }) {
  const { data: productsPage } = useMyProducts();
  const [productId, setProductId] = useState('');
  const { data: variants } = useVariants(productId);
  const [variantId, setVariantId] = useState('');
  const [stockQuantity, setStockQuantity] = useState('0');
  const [err, setErr] = useState('');
  const addStock = useAddStock(storeId);

  if (!open) return null;

  const products = productsPage?.content ?? [];
  const availableVariants = (variants ?? []).filter((v) => !existingVariantIds?.includes(v.id));

  const submit = async () => {
    if (!variantId) { setErr('Vui lòng chọn biến thể'); return; }
    if (stockQuantity === '' || Number(stockQuantity) < 0) { setErr('Tồn kho phải ≥ 0'); return; }
    setErr('');
    try {
      await addStock.mutateAsync({ storeId, variantId, stockQuantity: Number(stockQuantity) });
      onClose();
    } catch (e) {
      setErr(e?.response?.data?.message ?? 'Không thể thêm biến thể vào kho');
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-base-100 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog" aria-modal="true" aria-label="Thêm biến thể vào kho"
      >
        <header className="flex items-center justify-between border-b border-base-300 px-5 py-4">
          <h2 className="font-display text-xl">Thêm biến thể vào kho</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle" aria-label="Đóng"><X width={18} height={18} /></button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-base-content/70">Sản phẩm</span>
              <select value={productId} onChange={(e) => { setProductId(e.target.value); setVariantId(''); }} className="select select-bordered w-full">
                <option value="">— Chọn sản phẩm —</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-base-content/70">Biến thể</span>
              <select value={variantId} onChange={(e) => setVariantId(e.target.value)} disabled={!productId} className="select select-bordered w-full">
                <option value="">— Chọn biến thể —</option>
                {availableVariants.map((v) => (
                  <option key={v.id} value={v.id}>{[v.sku, v.color, v.dimensions].filter(Boolean).join(' · ') || v.id}</option>
                ))}
              </select>
              {productId && !availableVariants.length && (
                <span className="text-xs text-base-content/50">Sản phẩm này không có biến thể nào (khác) để thêm.</span>
              )}
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-base-content/70">Tồn kho ban đầu</span>
              <input type="number" min="0" value={stockQuantity} onChange={(e) => setStockQuantity(e.target.value)} className="input input-bordered w-full" />
            </label>
            {err && <p className="text-xs text-error">{err}</p>}
          </div>
        </div>

        <footer className="flex justify-end gap-3 border-t border-base-300 px-5 py-4">
          <button onClick={onClose} className="btn btn-ghost" disabled={addStock.isPending}>Hủy</button>
          <button onClick={submit} className="btn btn-primary" disabled={addStock.isPending}>
            {addStock.isPending ? <span className="loading loading-spinner loading-sm" /> : 'Thêm vào kho'}
          </button>
        </footer>
      </div>
    </div>
  );
}
