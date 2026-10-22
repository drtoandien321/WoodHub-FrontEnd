import { useState } from 'react';
import { useManagedOrders, useUpdateOrderStatus, useMarkVatIssued } from '../../hooks/useOrderManagement.js';
import { apiErrorMessage } from '../../utils/apiError.js';
import { pageInfoOf } from '../../hooks/useOrders.js';
import { ORDER_STATUS_LABEL, ORDER_STATUS_BADGE as BADGE, ORDER_ACTION_LABEL, nextActions } from '../../utils/orderStatus.js';
import { formatVnd, formatDate } from '../../utils/format.js';
import { confirmInfo, refundInfo, formatRemaining, useNow } from '../../utils/orderDeadline.js';
import ModalShell from '../admin/ModalShell.jsx';
import { Calendar, Phone, Clock } from '../suppliers/icons.jsx';
import Pagination from '../ui/Pagination.jsx';

const PAGE_SIZE = 10;
// Tab "Cần xác nhận": tải nhiều hơn để sắp theo hạn trên cả trang (BE trả mới nhất trước)
const CONFIRM_PAGE_SIZE = 50;
// Lý do huỷ gợi ý khi NCC huỷ đơn đã thanh toán (bắt buộc có lý do — docs no-inventory §4.2)
const CANCEL_REASONS = ['Hết hàng', 'Hết màu/kích thước này', 'Không giao được tới địa chỉ này'];
const CONFIRM_LEVEL_CLS = {
  ok: 'bg-base-200 text-base-content/70',
  soon: 'bg-warning/15 text-warning',
  overdue: 'bg-error/15 text-error',
};
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
 *
 * Xác nhận 24 giờ (docs BE no-inventory-order-confirm-fe.md §4): sàn không quản lý tồn kho, NCC phải xác nhận còn
 * hàng trước `confirmDeadline`. Portal NCC mở sẵn tab "Cần xác nhận" (status=paid), sắp theo hạn tăng dần, đếm ngược
 * (vàng ≤ 6 giờ, đỏ khi quá hạn). Huỷ đơn đã thanh toán bắt buộc có lý do và báo trước khách được hoàn tiền 48 giờ.
 */
export default function OrderManagement({ scope, title, subtitle }) {
  const [status, setStatus] = useState(scope === 'supplier' ? 'paid' : '');
  const [page, setPage] = useState(0);
  const [expanded, setExpanded] = useState(null);
  const [pending, setPending] = useState(null); // { order, to } — đang mở modal xác nhận
  const [note, setNote] = useState('');
  const [modalErr, setModalErr] = useState('');
  const now = useNow();

  const confirmTab = status === 'paid';
  const { data, isLoading, isError, refetch, isFetching } = useManagedOrders(scope, {
    status: status || undefined, page, size: confirmTab ? CONFIRM_PAGE_SIZE : PAGE_SIZE,
  });
  const updateStatus = useUpdateOrderStatus(scope);
  const rawOrders = data?.content ?? [];
  // Tab "Cần xác nhận": đơn sắp hết hạn lên đầu
  const orders = confirmTab
    ? [...rawOrders].sort((a, b) => new Date(a.confirmDeadline ?? 8.64e15) - new Date(b.confirmDeadline ?? 8.64e15))
    : rawOrders;
  const pageInfo = pageInfoOf(data);

  // Huỷ đơn KHÁCH ĐÃ TRẢ TIỀN → admin phải hoàn tiền 48h → bắt buộc ghi lý do
  const isPaidCancel = (p) => p?.to === 'cancelled' && !!p.order.paidAt;
  const actionLabel = (from, to) => {
    if (scope === 'supplier' && from === 'paid' && to === 'confirmed') return 'Xác nhận còn hàng';
    if (scope === 'supplier' && from === 'paid' && to === 'cancelled') return 'Hết hàng – huỷ';
    return ORDER_ACTION_LABEL[to];
  };

  const openAction = (order, to) => { setPending({ order, to }); setNote(''); setModalErr(''); };
  const closeModal = () => { if (!updateStatus.isPending) setPending(null); };
  const confirm = () => {
    if (isPaidCancel(pending) && !note.trim()) { setModalErr('Vui lòng chọn hoặc nhập lý do huỷ để báo cho khách.'); return; }
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
            const cInfo = confirmInfo(o, now);
            const rInfo = refundInfo(o, now);
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
                    {o.vat && (
                      <span className={`ml-1 mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${o.vat.issued ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'}`}>
                        {o.vat.issued ? 'Đã xuất VAT' : 'Cần xuất VAT'}
                      </span>
                    )}
                    {o.bulkQuoteId && <span className="ml-1 mt-1 inline-block rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">Báo giá SL lớn</span>}
                  </div>
                </div>

                {/* Đếm ngược hạn xác nhận 24h / trạng thái hoàn tiền của đơn đã trả tiền bị huỷ */}
                {cInfo && (
                  <p className={`mt-3 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium ${CONFIRM_LEVEL_CLS[cInfo.level]}`}>
                    <Clock width={13} height={13} />
                    {cInfo.level === 'overdue'
                      ? `Quá hạn xác nhận${cInfo.remainingMs < 0 ? ` ${formatRemaining(cInfo.remainingMs)}` : ''} (hạn ${formatDate(cInfo.deadline)})`
                      : `Còn ${formatRemaining(cInfo.remainingMs)} để xác nhận (trước ${formatDate(cInfo.deadline)})`}
                  </p>
                )}
                {rInfo && (
                  <p className={`mt-3 rounded-lg px-3 py-1.5 text-xs ${rInfo.done ? 'bg-success/10 text-success' : rInfo.overdue ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'}`}>
                    {rInfo.done
                      ? `Đã hoàn ${formatVnd(rInfo.refund.amount)} lúc ${formatDate(rInfo.refund.refundedAt)} · mã GD ${rInfo.refund.reference}`
                      : `Khách đã thanh toán — chờ admin hoàn tiền${rInfo.deadline ? ` trước ${formatDate(rInfo.deadline)}` : ' trong 48 giờ'}${rInfo.overdue ? ' (đã quá hạn)' : ''}`}
                  </p>
                )}

                {open && (
                  <div className="mt-4 grid gap-4 rounded-xl bg-base-200/50 p-4 text-sm md:grid-cols-2">
                    <div>
                      <p className="mb-1 font-medium">Giao đến</p>
                      <p className="text-base-content/70">{[o.shippingAddress, o.ward, o.district, o.city].filter(Boolean).join(', ')}</p>
                      <p className="mt-1 text-xs text-base-content/55">Từ chi nhánh: {[o.storeAddress, o.storeCity].filter(Boolean).join(', ') || '—'}</p>
                      {o.note && <p className="mt-2 text-xs"><span className="text-base-content/55">Ghi chú của khách:</span> {o.note}</p>}
                      {o.vat && <VatBlock order={o} canEdit={scope === 'supplier'} />}
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
                      <button key={s} onClick={() => openAction(o, s)} className="btn btn-outline btn-error btn-sm">{actionLabel(o.status, s)}</button>
                    ))}
                    {forward.map((s) => (
                      <button key={s} onClick={() => openAction(o, s)} className="btn btn-primary btn-sm">{actionLabel(o.status, s)}</button>
                    ))}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Pagination pageInfo={pageInfo} onChange={setPage} unit="đơn" />

      <ModalShell
        open={!!pending}
        onClose={closeModal}
        title={pending ? actionLabel(pending.order.status, pending.to) : ''}
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
            {isPaidCancel(pending) ? (
              <p className="rounded-lg bg-error/10 px-3 py-2 text-xs text-error">
                Huỷ đơn đã thanh toán. Khách sẽ được hoàn {formatVnd(pending.order.totalAmount)} trong vòng 48 giờ. Thao tác này không hoàn tác được.
              </p>
            ) : (pending.to === 'cancelled' || pending.to === 'refunded') && (
              <p className="rounded-lg bg-error/10 px-3 py-2 text-xs text-error">Thao tác này không hoàn tác được. Nên ghi rõ lý do để khách và quản trị viên nắm.</p>
            )}
            {isPaidCancel(pending) && (
              <div className="flex flex-wrap gap-1.5">
                {CANCEL_REASONS.map((r) => (
                  <button key={r} type="button" onClick={() => { setNote(r); setModalErr(''); }} className={`btn btn-xs ${note === r ? 'btn-primary' : 'btn-outline'}`}>{r}</button>
                ))}
              </div>
            )}
            <label className="flex flex-col gap-1.5">
              <span className="text-base-content/70">{isPaidCancel(pending) ? 'Lý do huỷ (bắt buộc, khách sẽ thấy)' : 'Ghi chú (tuỳ chọn)'}</span>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="textarea textarea-bordered w-full" placeholder="VD: Đã xác nhận, chuẩn bị hàng trong 2 ngày" />
            </label>
            {modalErr && <div role="alert" className="alert alert-error py-2 text-sm">{modalErr}</div>}
          </div>
        )}
      </ModalShell>
    </div>
  );
}

/*
 * Hoá đơn VAT của 1 đơn (BE-08 §4): thông tin công ty khách chụp lúc đặt. NCC tự xuất hoá đơn điện tử bên ngoài
 * (MISA, Viettel…) rồi nhập số hoá đơn (+ link) — gửi lại để sửa. Chỉ làm được khi đơn đã thanh toán, chưa huỷ (409).
 * Khách nhận thông báo ORDER_VAT_ISSUED ở lần đánh dấu đầu.
 */
function VatBlock({ order: o, canEdit }) {
  const mark = useMarkVatIssued();
  const [editing, setEditing] = useState(false);
  const [number, setNumber] = useState(o.vat.invoiceNumber ?? '');
  const [url, setUrl] = useState(o.vat.invoiceUrl ?? '');
  const [err, setErr] = useState('');
  const c = o.vat.companyInfo ?? {};
  const payable = !['pending_payment', 'cancelled', 'refunded'].includes(o.status);

  const save = () => {
    setErr('');
    if (!number.trim()) { setErr('Nhập số hoá đơn.'); return; }
    if (url.trim() && !/^https?:\/\//i.test(url.trim())) { setErr('Link hoá đơn phải bắt đầu bằng http:// hoặc https://'); return; }
    mark.mutate({ id: o.id, invoiceNumber: number.trim(), invoiceUrl: url.trim() || undefined }, {
      onSuccess: () => setEditing(false),
      onError: (e) => setErr(apiErrorMessage(e, 'Lưu hoá đơn chưa được.')),
    });
  };

  return (
    <div className="mt-3 rounded-lg border border-base-300 bg-base-100 p-3 text-xs">
      <p className="mb-1 font-medium">Hoá đơn VAT {o.vat.issued ? <span className="text-success">· đã xuất {o.vat.invoiceNumber}</span> : <span className="text-warning">· chưa xuất</span>}</p>
      <p>{c.companyName} · MST <span className="font-mono">{c.taxCode}</span></p>
      {c.companyAddress && <p className="text-base-content/60">{c.companyAddress}</p>}
      {c.email && <p className="text-base-content/60">Email nhận hoá đơn: {c.email}</p>}
      {o.vat.invoiceUrl && <a href={o.vat.invoiceUrl} target="_blank" rel="noreferrer" className="link link-primary">Xem hoá đơn</a>}
      {canEdit && payable && !editing && (
        <button type="button" onClick={() => setEditing(true)} className="btn btn-outline btn-xs mt-2">{o.vat.issued ? 'Sửa thông tin hoá đơn' : 'Đã xuất hoá đơn VAT'}</button>
      )}
      {canEdit && !payable && !o.vat.issued && <p className="mt-1 text-base-content/50">Xuất hoá đơn sau khi khách thanh toán.</p>}
      {editing && (
        <div className="mt-2 flex flex-col gap-2">
          <input value={number} onChange={(e) => setNumber(e.target.value)} placeholder="Số hoá đơn, VD: HD001" className="input input-bordered input-xs w-full font-mono" />
          <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="Link hoá đơn điện tử (tuỳ chọn)" className="input input-bordered input-xs w-full" />
          <div className="flex gap-2">
            <button type="button" onClick={save} disabled={mark.isPending} className="btn btn-primary btn-xs">{mark.isPending ? <span className="loading loading-spinner loading-xs" /> : 'Lưu'}</button>
            <button type="button" onClick={() => setEditing(false)} className="btn btn-ghost btn-xs">Huỷ</button>
          </div>
        </div>
      )}
      {err && <p className="mt-1 text-error">{err}</p>}
    </div>
  );
}
