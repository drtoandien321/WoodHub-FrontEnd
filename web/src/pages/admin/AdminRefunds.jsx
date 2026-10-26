import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePendingRefunds, useConfirmRefund, usePendingCustomRefunds, useConfirmCustomRefund } from '../../hooks/useAdminOps.js';
import { useManagedOrders, useUpdateOrderStatus } from '../../hooks/useOrderManagement.js';
import { apiErrorMessage } from '../../utils/apiError.js';
import { formatVnd, formatDate } from '../../utils/format.js';
import { formatRemaining, useNow } from '../../utils/orderDeadline.js';
import ModalShell from '../../components/admin/ModalShell.jsx';
import Pagination from '../../components/ui/Pagination.jsx';

const PAGE_SIZE = 20;
const OVERDUE_PARAMS = { status: 'paid', page: 0, size: 100 };

/*
 * AdminRefunds — vận hành theo docs BE no-inventory-order-confirm-fe.md §5:
 *  1. Đơn QUÁ HẠN XÁC NHẬN: GET /admin/orders?status=paid rồi lọc confirmOverdue — NCC không xác nhận trong 24h.
 *     Admin nhắc NCC hoặc huỷ thay (PUT /admin/orders/{id}/status cancelled + lý do) → đơn chuyển sang danh sách cần hoàn.
 *  2. Đơn CẦN HOÀN TIỀN: GET /admin/orders/refunds/pending (đã trả tiền + bị huỷ + chưa hoàn, huỷ sớm nhất trước).
 *     Admin chuyển khoản THỦ CÔNG cho khách (SePay không tự hoàn) trong 48h rồi ghi nhận POST /admin/orders/{id}/refund
 *     với mã giao dịch ngân hàng (để đối soát khi khách khiếu nại). Khách nhận thông báo ORDER_REFUNDED.
 *  3. Đơn CUSTOM CẦN HOÀN TIỀN (OBS-08, §5.3): GET /admin/custom-orders/refunds/pending — đơn custom đã huỷ mà đã có tiền
 *     (xưởng huỷ sau khi nhận cọc, hoặc tiền vào sau khi huỷ). Không có hạn 48h trên API; số tiền mặc định = paidAmount.
 *     Ghi nhận POST /admin/custom-orders/{id}/refund → khách nhận thông báo CUSTOM_ORDER_REFUNDED.
 * BE không lưu số tài khoản của khách → admin lấy từ trao đổi với khách (chat / email / SĐT trên đơn).
 */
export default function AdminRefunds() {
  const now = useNow();
  const [page, setPage] = useState(0);
  const refunds = usePendingRefunds({ page, size: PAGE_SIZE });
  const paid = useManagedOrders('admin', OVERDUE_PARAMS);
  const cancelOrder = useUpdateOrderStatus('admin');
  const [refunding, setRefunding] = useState(null);
  const [customPage, setCustomPage] = useState(0);
  const customRefunds = usePendingCustomRefunds({ page: customPage, size: PAGE_SIZE });
  const [refundingCustom, setRefundingCustom] = useState(null);
  const customItems = customRefunds.data?.content ?? [];
  const customPageInfo = customRefunds.data?.page ?? { number: 0, totalPages: 1, totalElements: 0 };

  const overdue = (paid.data?.content ?? []).filter((o) => o.confirmOverdue || (o.confirmDeadline && new Date(o.confirmDeadline) < now));
  const items = refunds.data?.content ?? [];
  const pageInfo = refunds.data?.page ?? { number: 0, totalPages: 1, totalElements: 0 };

  const cancelForSupplier = (o) => {
    if (!window.confirm(`Huỷ đơn ${o.orderCode} thay NCC? Khách đã thanh toán ${formatVnd(o.totalAmount)} và sẽ cần được hoàn tiền trong 48 giờ.`)) return;
    cancelOrder.mutate(
      { id: o.id, status: 'cancelled', note: 'NCC không xác nhận trong 24 giờ' },
      { onSuccess: () => refunds.refetch(), onError: (e) => window.alert(apiErrorMessage(e, 'Huỷ đơn chưa được.')) }
    );
  };

  return (
    <div className="flex flex-col gap-6">
      <header>
        <h1 className="font-display text-3xl">Hoàn tiền &amp; xác nhận chậm</h1>
        <p className="mt-1 text-base-content/70">Theo dõi đơn NCC chưa xác nhận sau 24 giờ và đơn đã thanh toán bị huỷ cần hoàn tiền trong 48 giờ.</p>
      </header>

      <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg">
          Đơn quá hạn xác nhận {overdue.length > 0 && <span className="badge badge-error">{overdue.length}</span>}
        </h2>
        {paid.isLoading ? <div className="skeleton h-16 rounded-xl" /> : !overdue.length ? (
          <p className="text-sm text-base-content/70">Không có đơn nào quá hạn xác nhận.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead><tr className="text-base-content/70"><th>Mã đơn</th><th>NCC</th><th>Khách</th><th className="text-right">Tổng</th><th>Quá hạn</th><th className="text-right">Thao tác</th></tr></thead>
              <tbody>
                {overdue.map((o) => (
                  <tr key={o.id}>
                    <td className="font-mono text-xs">{o.orderCode}</td>
                    <td className="text-sm">{o.supplierName}</td>
                    <td className="text-sm">{o.recipientName}<span className="block text-xs text-base-content/70">{o.recipientPhone}</span></td>
                    <td className="text-right text-sm font-medium">{formatVnd(o.totalAmount)}</td>
                    <td className="text-xs text-error">{o.confirmDeadline ? formatRemaining(now - new Date(o.confirmDeadline)) : '—'}</td>
                    <td className="text-right"><button onClick={() => cancelForSupplier(o)} disabled={cancelOrder.isPending} className="btn btn-outline btn-error btn-xs">Huỷ thay NCC</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg">
          Đơn cần hoàn tiền {pageInfo.totalElements > 0 && <span className="badge badge-warning">{pageInfo.totalElements}</span>}
        </h2>
        {refunds.isLoading ? <div className="skeleton h-24 rounded-xl" /> : refunds.isError ? (
          <p className="text-sm text-error">Không tải được danh sách. <button onClick={() => refunds.refetch()} className="link">Thử lại</button></p>
        ) : !items.length ? (
          <p className="text-sm text-base-content/70">Không có đơn nào đang chờ hoàn tiền.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead><tr className="text-base-content/70"><th>Mã đơn</th><th>Khách</th><th>NCC</th><th className="text-right">Số tiền</th><th>Hạn hoàn</th><th className="text-right">Thao tác</th></tr></thead>
              <tbody>
                {items.map((o) => {
                  const late = o.refundOverdue || (o.refundDeadline && new Date(o.refundDeadline) < now);
                  return (
                    <tr key={o.id} className={late ? 'bg-error/5' : ''}>
                      <td className="font-mono text-xs">{o.orderCode}</td>
                      <td className="text-sm">{o.recipientName}<span className="block text-xs text-base-content/70">{o.recipientPhone}</span></td>
                      <td className="text-sm">{o.supplierName}</td>
                      <td className="text-right text-sm font-semibold">{formatVnd(o.totalAmount)}</td>
                      <td className={`text-xs ${late ? 'font-medium text-error' : 'text-base-content/70'}`}>
                        {o.refundDeadline ? formatDate(o.refundDeadline) : '—'}{late && ' · quá hạn'}
                      </td>
                      <td className="text-right"><button onClick={() => setRefunding(o)} className="btn btn-primary btn-xs">Đã hoàn tiền</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <Pagination pageInfo={pageInfo} onChange={setPage} className="mt-3" />
      </section>

      <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
        <h2 className="mb-1 flex items-center gap-2 font-display text-lg">
          Đơn custom cần hoàn tiền {customPageInfo.totalElements > 0 && <span className="badge badge-warning">{customPageInfo.totalElements}</span>}
        </h2>
        <p className="mb-3 text-xs text-base-content/70">Đơn custom bị huỷ khi khách đã trả cọc / phần còn lại. Chưa có hạn 48 giờ như đơn thường — xử lý theo thứ tự (huỷ sớm nhất trước).</p>
        {customRefunds.isLoading ? <div className="skeleton h-24 rounded-xl" /> : customRefunds.isError ? (
          <p className="text-sm text-error">Không tải được danh sách. <button onClick={() => customRefunds.refetch()} className="link">Thử lại</button></p>
        ) : !customItems.length ? (
          <p className="text-sm text-base-content/70">Không có đơn custom nào đang chờ hoàn tiền.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-sm">
              <thead><tr className="text-base-content/70"><th>Mã đơn</th><th>Khách</th><th>Xưởng</th><th className="text-right">Đã trả</th><th>Huỷ lúc</th><th className="text-right">Thao tác</th></tr></thead>
              <tbody>
                {customItems.map((o) => (
                  <tr key={o.id}>
                    <td className="font-mono text-xs"><Link to={`/custom-orders/${o.id}`} className="link link-hover">{o.orderNumber}</Link></td>
                    <td className="text-sm">{o.customerName}{o.shippingAddress && <span className="block max-w-56 truncate text-xs text-base-content/70" title={o.shippingAddress}>{o.shippingAddress}</span>}</td>
                    <td className="text-sm">{o.workshopName}</td>
                    <td className="text-right text-sm font-semibold">{formatVnd(o.paidAmount)}</td>
                    <td className="text-xs text-base-content/70">{o.cancelledAt ? formatDate(o.cancelledAt) : '—'}</td>
                    <td className="text-right"><button onClick={() => setRefundingCustom(o)} className="btn btn-primary btn-xs">Đã hoàn tiền</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination pageInfo={customPageInfo} onChange={setCustomPage} className="mt-3" />
      </section>

      {refunding && (
        <RefundModal
          useConfirm={useConfirmRefund}
          target={{ id: refunding.id, code: refunding.orderCode, name: refunding.recipientName, contact: refunding.recipientPhone, max: refunding.totalAmount }}
          onClose={() => setRefunding(null)}
        />
      )}
      {refundingCustom && (
        <RefundModal
          useConfirm={useConfirmCustomRefund}
          target={{ id: refundingCustom.id, code: refundingCustom.orderNumber, name: refundingCustom.customerName, contact: refundingCustom.shippingAddress, max: refundingCustom.paidAmount }}
          onClose={() => setRefundingCustom(null)}
        />
      )}
    </div>
  );
}

/*
 * Form ghi nhận đã chuyển khoản hoàn tiền — dùng chung đơn thường + đơn custom (truyền hook mutation qua useConfirm).
 * Mã GD bắt buộc; số tiền mặc định = target.max (tổng đơn / tiền khách đã trả), sửa được nếu hoàn 1 phần.
 * Bằng đúng max thì không gửi amount — BE tự hoàn toàn bộ.
 */
function RefundModal({ useConfirm, target, onClose }) {
  const confirm = useConfirm();
  const [reference, setReference] = useState('');
  const [amount, setAmount] = useState(String(Math.round(Number(target.max))));
  const [note, setNote] = useState('');
  const [err, setErr] = useState('');

  const submit = () => {
    setErr('');
    if (!reference.trim()) { setErr('Nhập mã giao dịch ngân hàng của lần chuyển khoản hoàn tiền.'); return; }
    const amt = Number(amount);
    if (!(amt >= 1 && amt <= Number(target.max))) { setErr(`Số tiền từ 1 đến ${formatVnd(target.max)}.`); return; }
    confirm.mutate(
      { id: target.id, reference: reference.trim(), amount: amt === Number(target.max) ? undefined : amt, note: note.trim() || undefined },
      { onSuccess: onClose, onError: (e) => setErr(apiErrorMessage(e, 'Ghi nhận hoàn tiền chưa được.')) }
    );
  };

  return (
    <ModalShell
      open
      onClose={onClose}
      title={`Hoàn tiền đơn ${target.code}`}
      footer={(
        <>
          <button onClick={onClose} disabled={confirm.isPending} className="btn btn-ghost">Huỷ</button>
          <button onClick={submit} disabled={confirm.isPending} className="btn btn-primary">{confirm.isPending ? <span className="loading loading-spinner loading-sm" /> : 'Xác nhận đã hoàn'}</button>
        </>
      )}
    >
      <div className="flex flex-col gap-3 text-sm">
        <p className="rounded-lg bg-base-200/60 px-3 py-2 text-xs text-base-content/70">
          Chuyển khoản cho khách <b>{target.name}</b>{target.contact ? ` (${target.contact})` : ''} trước, rồi nhập mã giao dịch. Hệ thống không lưu số tài khoản của khách — lấy từ trao đổi với khách.
        </p>
        <label className="flex flex-col gap-1.5"><span className="text-base-content/70">Mã giao dịch ngân hàng *</span>
          <input value={reference} onChange={(e) => setReference(e.target.value.slice(0, 100))} placeholder="VD: FT26102112345" className="input input-bordered w-full font-mono" />
        </label>
        <label className="flex flex-col gap-1.5"><span className="text-base-content/70">Số tiền hoàn (₫)</span>
          <input type="number" min="1" max={target.max} value={amount} onChange={(e) => setAmount(e.target.value)} className="input input-bordered w-full" />
          <span className="text-xs text-base-content/70">Mặc định hoàn toàn bộ {formatVnd(target.max)}.</span>
        </label>
        <label className="flex flex-col gap-1.5"><span className="text-base-content/70">Ghi chú</span>
          <textarea value={note} onChange={(e) => setNote(e.target.value.slice(0, 1000))} rows={2} placeholder="VD: Đã CK qua MB Bank" className="textarea textarea-bordered w-full" />
        </label>
        {err && <p className="text-xs text-error">{err}</p>}
      </div>
    </ModalShell>
  );
}
