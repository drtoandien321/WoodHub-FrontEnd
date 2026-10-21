import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { confirmInfo, refundInfo } from '../../utils/orderDeadline.js';
import { formatVnd, formatDate } from '../../utils/format.js';

/*
 * OrderDeadlineNote — dòng trạng thái phụ cho KHÁCH (docs BE no-inventory-order-confirm-fe.md §3):
 *  - paid: "Chờ NCC xác nhận trước HH:mm dd/MM" · quá hạn → "NCC đang xác nhận chậm" + link Liên hệ hỗ trợ
 *  - đã trả tiền nhưng bị huỷ: "Sẽ hoàn tiền trong 48 giờ" (chưa hoàn) / "Đã hoàn X ngày Y (mã Z)"
 * compact: bản 1 dòng cho danh sách đơn; mặc định: khối alert ở đầu trang chi tiết.
 * (Khách không tự huỷ được đơn đã thanh toán — chỉ hướng sang chat / liên hệ.)
 */
export default function OrderDeadlineNote({ order, compact = false }) {
  const { t } = useTranslation();
  const confirm = confirmInfo(order);
  const refund = refundInfo(order);

  if (confirm) {
    const overdue = confirm.level === 'overdue';
    if (compact) {
      return <p className={`mt-1 text-xs ${overdue ? 'text-warning' : 'text-info'}`}>{overdue ? t('orders.confirmOverdue') : t('orders.waitingConfirm', { time: formatDate(confirm.deadline) })}</p>;
    }
    return (
      <div role="status" className={`alert ${overdue ? 'alert-warning' : 'alert-info'} text-sm`}>
        <span>
          {overdue ? t('orders.confirmOverdue') : t('orders.waitingConfirm', { time: formatDate(confirm.deadline) })}
          {overdue && <> <Link to="/contact" className="link font-medium">{t('orders.contactSupport')}</Link></>}
        </span>
      </div>
    );
  }

  if (refund) {
    if (compact) {
      return <p className={`mt-1 text-xs ${refund.done ? 'text-success' : 'text-warning'}`}>{t(refund.done ? 'orders.refundedShort' : 'orders.refundPendingShort')}</p>;
    }
    return refund.done ? (
      <div role="status" className="alert alert-success text-sm">
        <span>{t('orders.refunded', { amount: formatVnd(refund.refund.amount), date: formatDate(refund.refund.refundedAt), reference: refund.refund.reference })}</span>
      </div>
    ) : (
      <div role="status" className="alert alert-warning text-sm">
        <span>
          {t('orders.refundNotice', { orderCode: order.orderCode, totalAmount: formatVnd(order.totalAmount) })}
          {refund.deadline && <> {t('orders.refundBy', { time: formatDate(refund.deadline) })}</>}
        </span>
      </div>
    );
  }
  return null;
}
