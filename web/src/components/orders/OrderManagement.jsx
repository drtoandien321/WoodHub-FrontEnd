import { useState } from 'react';
import { useManagedOrders, useUpdateOrderStatus } from '../../hooks/useOrderManagement.js';
import { pageInfoOf } from '../../hooks/useOrders.js';
import { ORDER_STATUS_LABEL, ORDER_STATUS_BADGE as BADGE, ORDER_ACTION_LABEL, nextActions } from '../../utils/orderStatus.js';
import { formatVnd, formatDate } from '../../utils/format.js';
import ModalShell from '../admin/ModalShell.jsx';
import { Calendar, Phone } from '../suppliers/icons.jsx';

const PAGE_SIZE = 10;
const TABS = [
  ['', 'Tất cả'], ['paid', 'Cần xác nhận'], ['confirmed', 'Đã xác nhận'], ['processing', 'Đang chuẩn bị'],
  ['shipping', 'Đang giao'], ['delivered', 'Đã giao'], ['completed', 'Hoàn tất'], ['pending_payment', 'Chờ thanh toán'], ['cancelled', 'Đã hủy'],
];

/*
 * OrderManagement — danh sách + cập nhật trạng thái đơn B2C, dùng cho:
 *  - scope="supplier": /portal/supplier/orders (đơn của nhà cung cấp)
 *  - scope="admin":    /admin/orders (mọi đơn, hiện thêm tên nhà cung cấp)
 *
 * Nút hành động lấy từ utils/orderStatus.js (chỉ hiện bước hợp lệ). Mọi thay đổi đều qua modal xác
 * nhận có ô ghi chú (BE lưu vào lịch sử trạng thái) — vì đổi trạng thái đơn là việc khách nhìn thấy
 * ngay và không tự hoàn tác được. Lỗi 409 (đơn vừa bị đổi ở nơi khác) hiện ngay trong modal.
 */
export default function OrderManagement({ scope, title, subtitle }) {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState(null);
  const [pending, setPending] = useState(null); // { order, to } — đang mở modal xác nhận
  const [note, setNote] = useState('');
  const [modalErr, setModalErr] = useState('');

  const { data, isLoading, isError, refetch, isFetching } = useManagedOrders(scope, { status: status || undefined, page, size: PAGE_SIZE });
  const updateStatus = useUpdateOrderStatus(scope);
  const orders = data?.content ?? [];
  const pageInfo = pageInfoOf(data);

  const openAction = (order, to) => { setPending({ order, to }); setNote(''); setModalErr(''); };
  const closeModal = () => { if (!updateStatus.isPending) setPending(null); };
  const confirm = () => {
    updateStatus.mutate(
      { id: pending.order.id, status: pending.to, note: note.trim() || undefined },
      {
        onSuccess: () => setPending(null),
        onError: (err) => {
          // 409 = đơn đã bị đổi trạng thái ở nơi khác (tab khác / admin) → tải lại để thấy trạng thái thật
          if (err?.response?.status === 409) refetch();
          setModalErr(err?.response?.data?.message || 'Cập nhật thất bại, vui lòng thử lại.');
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-base-content/60">{subtitle}</p>}
      </header>

      <div className="overflow-x-auto">
        <div className="inline-flex gap-1 rounded-2xl border border-base-300 bg-base-100 p-1 shadow-sm">
          {TABS.map(([v, l]) => (
            <button
              key={v || 'all'}
              onClick={() => { setStatus(v); setPage(0); }}
              className={`whitespace-nowrap rounded-xl px-4 py-2 text-sm transition-colors ${status === v ? 'bg-primary text-primary-content' : 'text-base-content/70 hover:bg-base-200'}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4">{[0, 1, 2].map((i) => <div key={i} className="skeleton h-36 rounded-2xl" />)}</div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-error">Không tải được danh sách đơn.</p>
          <button onClick={() => refetch()} className="btn btn-outline btn-sm">Thử lại</button>
        </div>
      ) : !orders.length ? (
        <p className="py-10 text-center text-base-content/50">Không có đơn hàng ở trạng thái này.</p>
      ) : (
        <div className={`flex flex-col gap-4 ${isFetching ? 'opacity-70' : ''}`}>
          {orders.map((o) => {
            const { forward, negative } = nextActions(o.status);
            const open = expanded === o.id;
            return (
              <article key={o.id} className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm md:p-5">
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:items-center">
                  <div className="lg:col-span-3">
                    <p className="font-mono text-sm font-semibold">{o.orderCode}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-base-content/50"><Calendar width={13} height={13} />{formatDate(o.placedAt ?? o.createdAt)}</p>
                    {scope === 'admin' && <p className="mt-1 text-xs text-base-content/70">NCC: <span className="font-medium">{o.supplierName}</span></p>}
                  </div>
                  <div className="lg:col-span-3">
                    <p className="text-xs text-base-content/45">Khách nhận</p>
                    <p className="text-sm font-medium">{o.recipientName}</p>
                    <p className="flex items-center gap-1 text-xs text-base-content/55"><Phone width={12} height={12} />{o.recipientPhone}</p>
                  </div>
                  <div className="lg:col-span-3">
                    <p className="text-xs text-base-content/45">Sản phẩm</p>
                    <p className="truncate text-sm">{o.items?.[0]?.productName}{o.items?.length > 1 ? ` +${o.items.length - 1} SP khác` : ''}</p>
                    <p className="text-xs text-base-content/50">{o.items?.reduce((n, i) => n + i.quantity, 0)} sản phẩm · {o.distanceKm} km</p>
                  </div>
                  <div className="lg:col-span-3 lg:text-right">
                    <p className="text-xs text-base-content/45">Tổng đơn</p>
                    <p className="text-sm font-semibold">{formatVnd(o.totalAmount)}</p>
                    <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${BADGE[o.status] ?? ''}`}>{ORDER_STATUS_LABEL[o.status] ?? o.status}</span>
                  </div>
                </div>

                {open && (
                  <div className="mt-4 grid gap-4 rounded-xl bg-base-200/50 p-4 text-sm md:grid-cols-2">
                    <div>
                      <p className="mb-1 font-medium">Giao đến</p>
                      <p className="text-base-content/70">{[o.shippingAddress, o.ward, o.district, o.city].filter(Boolean).join(', ')}</p>
                      <p className="mt-1 text-xs text-base-content/55">Từ chi nhánh: {[o.storeAddress, o.storeCity].filter(Boolean).join(', ') || '—'}</p>
                      {o.note && <p className="mt-2 text-xs"><span className="text-base-content/55">Ghi chú của khách:</span> {o.note}</p>}
                    </div>
                    <div>
                      <ul className="flex flex-col gap-1">
                        {o.items?.map((i) => (
                          <li key={i.id} className="flex justify-between gap-3">
                            <span className="min-w-0 truncate">{i.productName} <span className="text-base-content/50">× {i.quantity}</span></span>
                            <span className="shrink-0">{formatVnd(i.lineTotal)}</span>
                          </li>
                        ))}
                      </ul>
                      <dl className="mt-2 flex flex-col gap-0.5 border-t border-base-300 pt-2 text-xs">
                        <div className="flex justify-between"><dt>Tiền hàng</dt><dd>{formatVnd(o.subtotal)}</dd></div>
                        {o.productDiscount > 0 && <div className="flex justify-between text-success"><dt>Giảm giá SP</dt><dd>−{formatVnd(o.productDiscount)}</dd></div>}
                        <div className="flex justify-between"><dt>Phí ship</dt><dd>{o.shippingFee === 0 ? 'Miễn phí' : formatVnd(o.shippingFee)}</dd></div>
                        {o.shippingDiscount > 0 && <div className="flex justify-between text-success"><dt>Giảm phí ship</dt><dd>−{formatVnd(o.shippingDiscount)}</dd></div>}
                      </dl>
                    </div>
                  </div>
                )}

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-base-200 pt-3">
                  <button onClick={() => setExpanded(open ? null : o.id)} className="btn btn-ghost btn-sm">{open ? 'Thu gọn' : 'Xem chi tiết'}</button>
                  <div className="flex flex-wrap items-center gap-2">
                    {o.status === 'pending_payment' && <span className="text-xs text-base-content/50">Đơn tự chuyển "Đã thanh toán" khi khách chuyển khoản</span>}
                    {negative.map((s) => (
                      <button key={s} onClick={() => openAction(o, s)} className="btn btn-outline btn-error btn-sm">{ORDER_ACTION_LABEL[s]}</button>
                    ))}
                    {forward.map((s) => (
                      <button key={s} onClick={() => openAction(o, s)} className="btn btn-primary btn-sm">{ORDER_ACTION_LABEL[s]}</button>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {pageInfo.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-base-content/60">
          <span>Trang {pageInfo.number + 1} / {pageInfo.totalPages} — {pageInfo.totalElements} đơn</span>
          <div className="join">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={pageInfo.number === 0} className="btn btn-sm join-item">‹</button>
            <button onClick={() => setPage((p) => p + 1)} disabled={pageInfo.number >= pageInfo.totalPages - 1} className="btn btn-sm join-item">›</button>
          </div>
        </div>
      )}

      <ModalShell
        open={!!pending}
        onClose={closeModal}
        title={pending ? ORDER_ACTION_LABEL[pending.to] : ''}
        footer={
          <>
            <button onClick={closeModal} className="btn btn-ghost" disabled={updateStatus.isPending}>Quay lại</button>
            <button
              onClick={confirm}
              disabled={updateStatus.isPending}
              className={`btn ${pending && (pending.to === 'cancelled' || pending.to === 'refunded') ? 'btn-error' : 'btn-primary'}`}
            >
              {updateStatus.isPending ? <span className="loading loading-spinner loading-sm" /> : 'Xác nhận'}
            </button>
          </>
        }
      >
        {pending && (
          <div className="flex flex-col gap-3 text-sm">
            <p>
              Đơn <span className="font-mono font-semibold">{pending.order.orderCode}</span>:{' '}
              <span className="font-medium">{ORDER_STATUS_LABEL[pending.order.status]}</span> → <span className="font-medium">{ORDER_STATUS_LABEL[pending.to]}</span>
            </p>
            {(pending.to === 'cancelled' || pending.to === 'refunded') && (
              <p className="rounded-lg bg-error/10 px-3 py-2 text-xs text-error">Thao tác này không hoàn tác được. Nên ghi rõ lý do để khách và quản trị viên nắm.</p>
            )}
            <label className="flex flex-col gap-1.5">
              <span className="text-base-content/70">Ghi chú (tuỳ chọn)</span>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="textarea textarea-bordered w-full" placeholder="VD: Đã xác nhận, chuẩn bị hàng trong 2 ngày" />
            </label>
            {modalErr && <div role="alert" className="alert alert-error py-2 text-sm">{modalErr}</div>}
          </div>
        )}
      </ModalShell>
    </div>
  );
}
