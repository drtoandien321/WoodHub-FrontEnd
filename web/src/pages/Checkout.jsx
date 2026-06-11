import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../stores/cartStore.js';
import { useCreateOrder } from '../hooks/useProducts.js';
import { formatVnd } from '../utils/format.js';

/*
 * Checkout GIẢ LẬP (roadmap C.2): bấm "Đặt hàng" → POST /orders →
 * đơn ở trạng thái pending_payment, KHÔNG redirect cổng VNPay/MoMo thật.
 * FE không bao giờ chạm thông tin thẻ — khi tích hợp thật chỉ redirect sang cổng.
 */
export default function Checkout() {
  const { items, clear } = useCartStore();
  const subtotal = useCartStore((s) => s.subtotal());
  const navigate = useNavigate();
  const createOrder = useCreateOrder();

  const [address, setAddress] = useState({ fullName: '', phone: '', street: '', district: '' });
  const [paymentMethod, setPaymentMethod] = useState('vnpay');
  const isValid = items.length > 0 && address.fullName && address.phone && address.street;

  const handleSubmit = async () => {
    const order = await createOrder.mutateAsync({ items, address, paymentMethod });
    clear();
    navigate(`/orders/${order.id}`);
  };

  const field = (key, label, placeholder) => (
    <label className="form-control">
      <span className="label-text mb-1">{label}</span>
      <input className="input input-bordered" placeholder={placeholder} value={address[key]} onChange={(e) => setAddress({ ...address, [key]: e.target.value })} />
    </label>
  );

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-8 max-w-4xl">
      <div className="flex flex-col gap-4">
        <h1 className="font-display text-3xl">Thanh toán</h1>
        <h2 className="font-medium mt-2">Địa chỉ giao hàng</h2>
        {field('fullName', 'Họ tên người nhận', 'Nguyễn Văn A')}
        <div className="grid grid-cols-2 gap-3">
          {field('phone', 'Số điện thoại', '09xx xxx xxx')}
          {field('district', 'Quận/Huyện', 'Tân Bình')}
        </div>
        {field('street', 'Địa chỉ', 'Số nhà, tên đường')}

        <h2 className="font-medium mt-2">Phương thức thanh toán</h2>
        <div className="flex flex-col gap-2">
          {[['vnpay', 'VNPay (giả lập demo)'], ['momo', 'MoMo (giả lập demo)'], ['bank', 'Chuyển khoản ngân hàng']].map(([value, label]) => (
            <label key={value} className="flex items-center gap-3 bg-base-200 rounded-xl p-3 cursor-pointer">
              <input type="radio" name="payment" className="radio radio-primary radio-sm" checked={paymentMethod === value} onChange={() => setPaymentMethod(value)} />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <aside className="bg-base-200 rounded-2xl p-5 h-fit flex flex-col gap-2">
        <h2 className="font-medium">Đơn hàng ({items.length} món)</h2>
        {items.map((i) => (
          <div key={i.productId} className="flex justify-between text-sm">
            <span className="line-clamp-1">{i.name} ×{i.qty}</span>
            <span className="shrink-0">{formatVnd(i.price * i.qty)}</span>
          </div>
        ))}
        <div className="divider my-1" />
        <div className="flex justify-between font-semibold"><span>Tổng</span><span className="text-primary">{formatVnd(subtotal)}</span></div>
        <button onClick={handleSubmit} disabled={!isValid || createOrder.isPending} className="btn btn-primary mt-2">
          {createOrder.isPending ? <span className="loading loading-spinner loading-sm" /> : 'Đặt hàng'}
        </button>
        {!isValid && items.length > 0 && <p className="text-xs text-base-content/50">Điền đủ họ tên, SĐT và địa chỉ để đặt hàng.</p>}
      </aside>
    </div>
  );
}
