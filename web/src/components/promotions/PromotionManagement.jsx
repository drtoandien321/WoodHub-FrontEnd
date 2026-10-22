import { useState } from 'react';
import { usePromotions, useDeletePromotion } from '../../hooks/usePromotions.js';
import { pageInfoOf } from '../../hooks/useOrders.js';
import PromotionFormModal from './PromotionFormModal.jsx';
import { formatVnd, formatDate } from '../../utils/format.js';
import { Plus, Pencil, Trash } from '../suppliers/icons.jsx';
import Pagination from '../ui/Pagination.jsx';

const PAGE_SIZE = 20;

// Mô tả mức giảm ngắn gọn cho 1 dòng bảng
const discountText = (p) => {
  if (p.discountType === 'free_shipping') return 'Miễn phí ship';
  if (p.discountType === 'percentage') return `−${p.discountValue}%${p.maxDiscountAmount ? ` (tối đa ${formatVnd(p.maxDiscountAmount)})` : ''}`;
  return `−${formatVnd(p.discountValue)}`;
};

// Trạng thái hiệu lực THỰC TẾ (gộp isActive + khung thời gian + lượt dùng) — admin nhìn là biết mã có dùng được không
const effectiveStatus = (p) => {
  const now = new Date();
  if (!p.isActive) return { label: 'Đã tắt', cls: 'badge-ghost' };
  if (p.endsAt && new Date(p.endsAt) < now) return { label: 'Hết hạn', cls: 'badge-ghost' };
  if (p.usageLimit != null && p.usedCount >= p.usageLimit) return { label: 'Hết lượt', cls: 'badge-warning' };
  if (p.startsAt && new Date(p.startsAt) > now) return { label: 'Sắp diễn ra', cls: 'badge-info' };
  return { label: 'Đang chạy', cls: 'badge-success' };
};

/*
 * PromotionManagement — CRUD mã khuyến mãi, dùng cho:
 *  - scope="admin":    /admin/promotions — KM toàn sàn (sản phẩm hoặc phí ship), thấy cả KM của NCC
 *  - scope="supplier": /portal/supplier/promotions — KM sản phẩm của chính nhà cung cấp
 * Danh sách do BE tự lọc theo vai trò (GET /promotions), FE không truyền supplierId.
 */
export default function PromotionManagement({ scope, title, subtitle }) {
  const [page, setPage] = useState(0);
  const [modal, setModal] = useState(null); // null | 'create' | PromotionResponse
  const { data, isLoading, isError, refetch } = usePromotions({ page, size: PAGE_SIZE });
  const deletePromotion = useDeletePromotion();
  const items = data?.content ?? [];
  const pageInfo = pageInfoOf(data);

  const handleDelete = (p) => {
    if (!window.confirm(`Xoá mã "${p.code}"? Khách sẽ không dùng được mã này nữa.`)) return;
    deletePromotion.mutate(p.id, {
      onError: (err) => window.alert(err?.response?.data?.message || 'Xoá khuyến mãi thất bại, vui lòng thử lại'),
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 text-base-content/60">{subtitle}</p>}
        </div>
        <button onClick={() => setModal('create')} className="btn btn-primary gap-2"><Plus width={16} height={16} /> Thêm khuyến mãi</button>
      </header>

      <section className="rounded-2xl border border-base-300 bg-base-100 p-2 shadow-sm md:p-4">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr className="text-base-content/55">
                <th>Mã</th><th>Loại</th><th>Mức giảm</th><th>Thời gian</th><th>Đã dùng</th><th>Trạng thái</th><th className="text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={7} className="py-10 text-center text-base-content/50">Đang tải…</td></tr>}
              {isError && (
                <tr><td colSpan={7} className="py-10 text-center">
                  <span className="text-error">Không tải được danh sách. </span>
                  <button onClick={() => refetch()} className="link link-primary">Thử lại</button>
                </td></tr>
              )}
              {!isLoading && !isError && !items.length && (
                <tr><td colSpan={7} className="py-10 text-center text-base-content/50">Chưa có khuyến mãi nào.</td></tr>
              )}
              {items.map((p) => {
                const st = effectiveStatus(p);
                return (
                  <tr key={p.id} className="hover:bg-base-200/50">
                    <td>
                      <p className="font-mono font-semibold">{p.code}</p>
                      <p className="text-xs text-base-content/55">{p.name}</p>
                      {scope === 'admin' && p.supplierName && <p className="text-xs text-base-content/45">NCC: {p.supplierName}</p>}
                    </td>
                    <td className="text-sm">
                      {p.type === 'shipping' ? 'Phí ship' : 'Sản phẩm'}
                      {p.type === 'product' && <p className="text-xs text-base-content/50">{p.productIds?.length ?? 0} SP</p>}
                    </td>
                    <td className="text-sm">
                      {discountText(p)}
                      {p.minOrderAmount != null && <p className="text-xs text-base-content/50">Đơn từ {formatVnd(p.minOrderAmount)}</p>}
                    </td>
                    <td className="text-xs text-base-content/65">
                      {p.startsAt || p.endsAt ? <>{p.startsAt ? formatDate(p.startsAt) : '…'} → {p.endsAt ? formatDate(p.endsAt) : '…'}</> : 'Không giới hạn'}
                    </td>
                    <td className="text-sm tabular-nums">{p.usedCount}{p.usageLimit != null ? ` / ${p.usageLimit}` : ''}</td>
                    <td><span className={`badge badge-sm ${st.cls}`}>{st.label}</span></td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setModal(p)} className="btn btn-ghost btn-sm btn-square" aria-label={`Sửa ${p.code}`}><Pencil width={15} height={15} /></button>
                        <button onClick={() => handleDelete(p)} disabled={deletePromotion.isPending} className="btn btn-ghost btn-sm btn-square text-error" aria-label={`Xoá ${p.code}`}><Trash width={15} height={15} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination pageInfo={pageInfo} onChange={setPage} unit="mã" className="px-2 pt-3" />
      </section>

      {modal && <PromotionFormModal key={modal === 'create' ? 'new' : modal.id} scope={scope} initial={modal === 'create' ? null : modal} onClose={() => setModal(null)} />}
    </div>
  );
}
