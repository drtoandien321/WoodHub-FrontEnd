import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCartStore } from '../stores/cartStore.js';
import { useCreateOrder } from '../hooks/useProducts.js';
import { paymentService } from '../services/paymentService.js';
import { formatVnd } from '../utils/format.js';
import EmptyState from '../components/ui/EmptyState.jsx';

// Danh sách quận/huyện TP.HCM cho dropdown địa chỉ giao hàng
const HCMC_DISTRICTS = [
  'Quận 1', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 'Quận 7', 'Quận 8',
  'Quận 10', 'Quận 11', 'Quận 12', 'Bình Thạnh', 'Bình Tân', 'Gò Vấp',
  'Phú Nhuận', 'Tân Bình', 'Tân Phú', 'TP. Thủ Đức',
  'Bình Chánh', 'Củ Chi', 'Hóc Môn', 'Nhà Bè', 'Cần Giờ',
];

// SĐT VN: bắt đầu bằng 0, tổng 10 số (vd 0901234567). Chấp nhận có khoảng trắng khi nhập.
const PHONE_RE = /^0\d{9}$/;

export default function Checkout() {
  const { t } = useTranslation();
  const { items, clear } = useCartStore();
  const subtotal = useCartStore((s) => s.subtotal());
  const navigate = useNavigate();
  const createOrder = useCreateOrder();

  const [address, setAddress] = useState({ fullName: '', phone: '', address: '', district: '' });
  const [touched, setTouched] = useState({}); // field nào đã blur/đụng vào → mới hiện lỗi
  const [paymentMethod, setPaymentMethod] = useState('vnpay');
  const [processing, setProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);

  // Phí ship giả định, miễn phí trên 5tr
  const shippingFee = subtotal > 5000000 ? 0 : 50000;
  const total = subtotal + shippingFee;

  // ===== VALIDATION =====
  // Trả message lỗi cho từng field (chuỗi rỗng = hợp lệ). Tính lại mỗi render theo address hiện tại.
  const errors = {
    fullName: address.fullName.trim() ? '' : t('checkout.errName'),
    phone: PHONE_RE.test(address.phone.replace(/\s/g, '')) ? '' : t('checkout.errPhone'),
    address: address.address.trim().length >= 5 ? '' : t('checkout.errAddress'),
    district: address.district ? '' : t('checkout.errDistrict'),
  };
  const isValid = items.length > 0 && Object.values(errors).every((e) => !e);
  const showErr = (key) => touched[key] && errors[key];
  const touch = (key) => setTouched((prev) => ({ ...prev, [key]: true }));

  if (!items.length && !processing && !successMsg) {
    return (
      <EmptyState
        title={t('checkout.emptyCart')}
        hint={t('checkout.emptyCartHint')}
        ctaLabel={t('checkout.backToShop')}
        ctaTo="/shop"
      />
    );
  }

  const handleSubmit = async () => {
    // Đánh dấu tất cả field đã touched để hiện hết lỗi nếu user bấm khi chưa hợp lệ
    setTouched({ fullName: true, phone: true, address: true, district: true });
    if (!isValid) return;
    setProcessing(true);

    try {
      // 1. Process mock payment
      await paymentService.processPayment({ method: paymentMethod, amount: total });

      // 2. Create order
      const order = await createOrder.mutateAsync({
        items,
        shippingAddress: address,
        paymentMethod,
        subtotal,
        shippingFee,
        total,
      });

      // 3. Clear cart and show success
      clear();
      setSuccessMsg(true);
      setTimeout(() => {
        navigate(`/orders/${order.id}`);
      }, 1000);
    } catch (error) {
      console.error('Checkout failed', error);
      setProcessing(false);
    }
  };

  if (processing || successMsg) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        {successMsg ? (
          <div className="text-2xl font-bold text-success mb-4">{t('checkout.success')}</div>
        ) : (
          <>
            <span className="loading loading-spinner loading-lg text-primary mb-4"></span>
            <p className="text-xl font-medium">{t('checkout.processing')}</p>
          </>
        )}
      </div>
    );
  }

  // flex-col: nhãn nằm TRÊN ô input. Hiện viền đỏ + message khi field đã touched mà còn lỗi.
  const field = (key, label, placeholder, type = 'text') => (
    <label className="flex flex-col gap-1">
      <span className="text-sm text-base-content/70">{label}</span>
      <input
        type={type}
        className={`input input-bordered w-full ${showErr(key) ? 'input-error' : ''}`}
        placeholder={placeholder}
        value={address[key]}
        onChange={(e) => setAddress({ ...address, [key]: e.target.value })}
        onBlur={() => touch(key)}
      />
      {showErr(key) && <span className="text-error text-xs">{errors[key]}</span>}
    </label>
  );

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-8 max-w-5xl mx-auto">
      <div className="flex flex-col gap-4">
        <h1 className="font-display text-3xl">{t('checkout.title')}</h1>
        <h2 className="font-medium mt-2">{t('checkout.shippingAddress')}</h2>
        {field('fullName', t('checkout.fullName'), t('checkout.namePlaceholder'))}
        <div className="grid grid-cols-2 gap-3">
          {field('phone', t('checkout.phone'), t('checkout.phonePlaceholder'), 'tel')}
          {/* Quận/huyện = dropdown TP.HCM (thay vì text tự do) */}
          <label className="flex flex-col gap-1">
            <span className="text-sm text-base-content/70">{t('checkout.district')}</span>
            <select
              className={`select select-bordered w-full ${showErr('district') ? 'select-error' : ''}`}
              value={address.district}
              onChange={(e) => setAddress({ ...address, district: e.target.value })}
              onBlur={() => touch('district')}
            >
              <option value="">{t('checkout.districtPlaceholder')}</option>
              {HCMC_DISTRICTS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            {showErr('district') && <span className="text-error text-xs">{errors.district}</span>}
          </label>
        </div>
        {field('address', t('checkout.address'), t('checkout.addressPlaceholder'))}

        <h2 className="font-medium mt-2">{t('checkout.paymentMethod')}</h2>
        <div className="flex flex-col gap-2">
          {[
            ['vnpay', t('checkout.vnpay')],
            ['momo', t('checkout.momo')],
            ['bank', t('checkout.bank')],
          ].map(([value, label]) => (
            <label key={value} className={`flex items-center gap-3 rounded-xl p-3 cursor-pointer transition-colors ${paymentMethod === value ? 'border border-primary bg-primary/5' : 'bg-base-200'}`}>
              <input type="radio" name="payment" className="radio radio-primary radio-sm" checked={paymentMethod === value} onChange={() => setPaymentMethod(value)} />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>
      </div>

      <aside className="bg-base-200 rounded-2xl p-5 h-fit flex flex-col gap-3 sticky top-24">
        <h2 className="font-medium">{t('checkout.orderSummary')}</h2>
        <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-2">
          {items.map((i) => (
            <div key={i.productId} className="flex gap-3 text-sm">
              <img src={i.image} alt={i.name} className="w-12 h-12 object-cover rounded-md" />
              <div className="flex-1 min-w-0">
                <span className="line-clamp-1">{i.name}</span>
                <span className="text-base-content/60">×{i.qty}</span>
              </div>
              <span className="shrink-0">{formatVnd(i.price * i.qty)}</span>
            </div>
          ))}
        </div>

        <div className="divider my-0" />
        <div className="flex justify-between text-sm"><span>{t('checkout.subtotal')}</span><span>{formatVnd(subtotal)}</span></div>
        <div className="flex justify-between text-sm"><span>{t('checkout.shippingFee')}</span><span>{shippingFee === 0 ? t('checkout.freeShipping') : formatVnd(shippingFee)}</span></div>
        <div className="divider my-0" />

        <div className="flex justify-between font-semibold"><span>{t('checkout.total')}</span><span className="text-primary">{formatVnd(total)}</span></div>
        <button onClick={handleSubmit} disabled={!isValid || createOrder.isPending} className="btn btn-primary w-full mt-2">
          {createOrder.isPending ? <span className="loading loading-spinner loading-sm" /> : t('checkout.placeOrder')}
        </button>
        {!isValid && items.length > 0 && <p className="text-xs text-base-content/50">{t('checkout.fillAllHint')}</p>}
      </aside>
    </div>
  );
}
