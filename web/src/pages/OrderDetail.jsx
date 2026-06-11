import { useParams, Link } from 'react-router-dom';
import { useOrder } from '../hooks/useProducts.js';
import { formatVnd } from '../utils/format.js';

const STATUS_LABELS = {
  pending_payment: 'Chờ thanh toán',
  processing: 'Đang xử lý',
  shipping: 'Đang giao',
  completed: 'Hoàn tất',
};

export default function OrderDetail() {
  const { id } = useParams();
  const { data: order, isLoading, isError } = useOrder(id);

  if (isLoading) return <div className="skeleton h-64 rounded-2xl max-w-2xl" />;
  if (isError || !order) return <p className="text-error">Không tìm thấy đơn hàng (đơn mock chỉ tồn tại trong phiên hiện tại).</p>;

  return (
    <div className="max-w-2xl flex flex-col gap-6">
      <div className="alert alert-success">✓ Đặt hàng thành công! Mã đơn: <span className="font-mono">{order.id}</span></div>

      <div className="bg-base-200 rounded-2xl p-5">
        <div className="flex justify-between items-center mb-4">
          <h1 className="font-display text-2xl">Chi tiết đơn hàng</h1>
          <span className="badge badge-warning">{STATUS_LABELS[order.status] ?? order.status}</span>
        </div>
        {order.items.map((i) => (
          <div key={i.productId} className="flex justify-between text-sm py-1">
            <span>{i.name} ×{i.qty}</span>
            <span>{formatVnd(i.price * i.qty)}</span>
          </div>
        ))}
        <div className="divider my-2" />
        <div className="flex justify-between font-semibold"><span>Tổng</span><span className="text-primary">{formatVnd(order.total)}</span></div>
        <p className="text-sm text-base-content/60 mt-3">
          Giao tới: {order.address.fullName} — {order.address.street}, {order.address.district} · {order.address.phone}
        </p>
      </div>

      {/* Timeline trạng thái — BE sẽ trả mảng timeline đầy đủ khi có flow xử lý đơn */}
      <ul className="steps steps-horizontal text-xs">
        <li className="step step-primary">Chờ thanh toán</li>
        <li className="step">Đang xử lý</li>
        <li className="step">Đang giao</li>
        <li className="step">Hoàn tất</li>
      </ul>

      <Link to="/shop" className="btn btn-outline self-start">← Tiếp tục mua sắm</Link>
    </div>
  );
}
