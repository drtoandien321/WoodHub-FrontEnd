import { Link, useNavigate } from 'react-router-dom';
import { useCartStore } from '../stores/cartStore.js';
import { formatVnd } from '../utils/format.js';
import EmptyState from '../components/ui/EmptyState.jsx';

export default function Cart() {
  const { items, updateQty, removeItem } = useCartStore();
  const subtotal = useCartStore((s) => s.subtotal());
  const navigate = useNavigate();

  if (!items.length)
    return <EmptyState title="Giỏ hàng đang trống" hint="Khám phá cửa hàng hoặc tự thiết kế một món đồ riêng cho bạn." ctaLabel="Vào cửa hàng" ctaTo="/shop" />;

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-8">
      <div className="flex flex-col gap-3">
        <h1 className="font-display text-3xl mb-2">Giỏ hàng</h1>
        {items.map((item) => (
          <div key={item.productId} className="flex items-center gap-4 bg-base-200 rounded-2xl p-3">
            <img src={item.image} alt={item.name} className="w-20 h-16 object-cover rounded-xl" />
            <div className="flex-1 min-w-0">
              <Link to={`/product/${item.productId}`} className="font-medium hover:link line-clamp-1">{item.name}</Link>
              <p className="text-sm text-primary">{formatVnd(item.price)}</p>
            </div>
            <input type="number" min={0} value={item.qty} onChange={(e) => updateQty(item.productId, Number(e.target.value))} className="input input-bordered input-sm w-16" />
            <button onClick={() => removeItem(item.productId)} className="btn btn-ghost btn-sm text-error">Xóa</button>
          </div>
        ))}
      </div>

      <aside className="bg-base-200 rounded-2xl p-5 h-fit flex flex-col gap-3">
        <h2 className="font-medium">Tạm tính</h2>
        <div className="flex justify-between text-sm"><span>Sản phẩm</span><span>{formatVnd(subtotal)}</span></div>
        <div className="flex justify-between text-sm text-base-content/60"><span>Phí vận chuyển</span><span>Tính ở bước sau</span></div>
        <div className="divider my-1" />
        <div className="flex justify-between font-semibold"><span>Tổng</span><span className="text-primary">{formatVnd(subtotal)}</span></div>
        <button onClick={() => navigate('/checkout')} className="btn btn-primary mt-2">Tiến hành thanh toán</button>
      </aside>
    </div>
  );
}
