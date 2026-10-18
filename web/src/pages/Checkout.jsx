import { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCartStore } from '../stores/cartStore.js';
import { useLocationStore } from '../stores/locationStore.js';
import { useCreateOrder } from '../hooks/useProducts.js';
import { paymentService } from '../services/paymentService.js';
import { formatVnd } from '../utils/format.js';
import EmptyState from '../components/ui/EmptyState.jsx';
import NearbyBranchPicker from '../components/checkout/NearbyBranchPicker.jsx';
import { Check, Wallet, Shield } from '../components/suppliers/icons.jsx';

// Danh sách quận/huyện TP.HCM cho dropdown địa chỉ giao hàng
const HCMC_DISTRICTS = [
  'Quận 1', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6', 'Quận 7', 'Quận 8',
  'Quận 10', 'Quận 11', 'Quận 12', 'Bình Thạnh', 'Bình Tân', 'Gò Vấp',
  'Phú Nhuận', 'Tân Bình', 'Tân Phú', 'TP. Thủ Đức',
  'Bình Chánh', 'Củ Chi', 'Hóc Môn', 'Nhà Bè', 'Cần Giờ',
];

// SĐT VN: bắt đầu bằng 0, tổng 10 số (vd 0901234567). Chấp nhận có khoảng trắng khi nhập.
const PHONE_RE = /^0\d{9}$/;

/*
 * Thông tin tài khoản nhận chuyển khoản — lấy từ .env (VITE_BANK_*), KHÔNG hardcode số tài khoản
 * vào mã nguồn. Chưa cấu hình thì chỉ hiện hướng dẫn chung, không hiện khối thông tin ngân hàng.
 */
const BANK = {
  name: import.meta.env.VITE_BANK_NAME,
  account: import.meta.env.VITE_BANK_ACCOUNT,
  holder: import.meta.env.VITE_BANK_HOLDER,
};

// Thanh 3 bước ở đầu trang: Giỏ hàng (xong) → Thanh toán (đang làm) → Hoàn tất
function Steps({ t }) {
  const steps = [t('checkout.stepCart'), t('checkout.stepCheckout'), t('checkout.stepDone')];
  return (
    <ol className="mb-8 flex items-center justify-center gap-2 text-sm sm:gap-4" aria-label="Tiến trình đặt hàng">
      {steps.map((label, i) => {
        const done = i === 0;
        const current = i === 1;
        return (
          <li key={label} className="flex items-center gap-2 sm:gap-4">
            <span className="flex items-center gap-2">
              <span
                className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold ${
                  done ? 'bg-primary text-primary-content' : current ? 'border-2 border-primary text-primary' : 'border border-base-300 text-base-content/40'
                }`}
              >
                {done ? <Check width={14} height={14} /> : i + 1}
              </span>
              <span className={current ? 'font-medium' : 'text-base-content/55'}>{label}</span>
            </span>
            {i < steps.length - 1 && <span className="h-px w-6 bg-base-300 sm:w-12" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}

function Section({ no, title, children }) {
  return (
    <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
      <h2 className="mb-4 flex items-center gap-2.5 font-display text-lg">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{no}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default function Checkout() {
  const { t } = useTranslation();
  const { items, clear } = useCartStore();
  const subtotal = useCartStore((s) => s.subtotal());
  const coords = useLocationStore((s) => s.coords);
  const navigate = useNavigate();
  const createOrder = useCreateOrder();

  const [address, setAddress] = useState({ fullName: '', phone: '', address: '', district: '' });
  const [touched, setTouched] = useState({}); // field nào đã blur/đụng vào → mới hiện lỗi
  // Chỉ còn 1 phương thức thanh toán: chuyển khoản ngân hàng (giữ giá trị 'bank' để khớp BE/đơn cũ)
  const paymentMethod = 'bank';
  const [processing, setProcessing] = useState(false);
  const [successMsg, setSuccessMsg] = useState(false);
  const [selectedBranches, setSelectedBranches] = useState({}); // { [supplierId]: StoreResponse }

  /*
   * Gợi ý chi nhánh gần (tính năng GPS) — mỗi supplier trong giỏ 1 khối <NearbyBranchPicker> riêng
   * vì API gợi ý gần chỉ nhận 1 supplierId/lần gọi. Bỏ qua item không có supplierId.
   */
  const uniqueSuppliers = useMemo(() => {
    const map = new Map();
    items.forEach((i) => { if (i.supplierId && !map.has(i.supplierId)) map.set(i.supplierId, i.supplierName); });
    return Array.from(map, ([supplierId, supplierName]) => ({ supplierId, supplierName }));
  }, [items]);

  // Phí ship giả định, miễn phí trên 5tr (cùng ngưỡng với Cart.jsx)
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
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-base-content/75">{label}</span>
      <input
        type={type}
        className={`input input-bordered w-full ${showErr(key) ? 'input-error' : ''}`}
        placeholder={placeholder}
        value={address[key]}
        onChange={(e) => setAddress({ ...address, [key]: e.target.value })}
        onBlur={() => touch(key)}
        aria-invalid={Boolean(showErr(key))}
      />
      {showErr(key) && <span className="text-error text-xs">{errors[key]}</span>}
    </label>
  );

  const bankRows = [
    [t('checkout.bankName'), BANK.name],
    [t('checkout.bankAccount'), BANK.account],
    [t('checkout.bankHolder'), BANK.holder],
  ].filter(([, v]) => v);

  return (
    <div className="mx-auto max-w-6xl">
      <Steps t={t} />

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-5">
          <h1 className="font-display text-3xl">{t('checkout.title')}</h1>

          {/* Gợi ý chi nhánh gần — chỉ hiện khi có toạ độ khách VÀ supplier có chi nhánh gắn toạ độ */}
          {coords && uniqueSuppliers.length > 0 && (
            <div className="flex flex-col gap-2.5">
              {uniqueSuppliers.map((s) => (
                <NearbyBranchPicker
                  key={s.supplierId}
                  supplierId={s.supplierId}
                  supplierName={s.supplierName}
                  coords={coords}
                  selectedId={selectedBranches[s.supplierId]?.id}
                  onSelect={(store) => setSelectedBranches((prev) => ({ ...prev, [s.supplierId]: store }))}
                />
              ))}
            </div>
          )}

          <Section no="1" title={t('checkout.shippingAddress')}>
            <div className="flex flex-col gap-4">
              {field('fullName', t('checkout.fullName'), t('checkout.namePlaceholder'))}
              <div className="grid gap-4 sm:grid-cols-2">
                {field('phone', t('checkout.phone'), t('checkout.phonePlaceholder'), 'tel')}
                {/* Quận/huyện = dropdown TP.HCM (thay vì text tự do) */}
                <label className="flex flex-col gap-1.5">
                  <span className="text-sm font-medium text-base-content/75">{t('checkout.district')}</span>
                  <select
                    className={`select select-bordered w-full ${showErr('district') ? 'select-error' : ''}`}
                    value={address.district}
                    onChange={(e) => setAddress({ ...address, district: e.target.value })}
                    onBlur={() => touch('district')}
                    aria-invalid={Boolean(showErr('district'))}
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
            </div>
          </Section>

          <Section no="2" title={t('checkout.paymentMethod')}>
            {/* Chỉ 1 phương thức → hiện như 1 thẻ đã chọn + hướng dẫn, không cần radio */}
            <div className="rounded-xl border-2 border-primary bg-primary/5 p-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Wallet width={20} height={20} /></span>
                <div className="flex-1">
                  <p className="font-medium">{t('checkout.bank')}</p>
                  <p className="text-sm text-base-content/60">{t('checkout.bankDesc')}</p>
                </div>
                <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-content"><Check width={14} height={14} /></span>
              </div>

              {bankRows.length > 0 && (
                <dl className="mt-4 grid gap-2 rounded-lg bg-base-100 p-3 text-sm">
                  {bankRows.map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-4"><dt className="text-base-content/55">{k}</dt><dd className="font-medium">{v}</dd></div>
                  ))}
                </dl>
              )}

              <ol className="mt-4 flex flex-col gap-1.5 text-sm text-base-content/70">
                {['bankHow1', 'bankHow2', 'bankHow3'].map((k, i) => (
                  <li key={k} className="flex gap-2"><span className="font-semibold text-primary">{i + 1}.</span>{t(`checkout.${k}`)}</li>
                ))}
              </ol>
            </div>
          </Section>
        </div>

        <aside className="sticky top-24 flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl">{t('checkout.orderSummary')}</h2>
            <Link to="/cart" className="text-xs text-primary hover:underline">{t('checkout.editCart')}</Link>
          </div>
          <ul className="flex max-h-64 flex-col gap-3 overflow-y-auto px-1 pb-1 pt-2">
            {items.map((i) => (
              <li key={i.productId} className="flex gap-3 text-sm">
                <div className="relative shrink-0">
                  <img src={i.image} alt={i.name} className="h-14 w-14 rounded-lg object-cover" />
                  <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-base-content px-1 text-[11px] font-medium text-base-100">{i.qty}</span>
                </div>
                <span className="line-clamp-2 min-w-0 flex-1 leading-snug">{i.name}</span>
                <span className="shrink-0 font-medium">{formatVnd(i.price * i.qty)}</span>
              </li>
            ))}
          </ul>

          <div className="divider my-0" />
          <div className="flex justify-between text-sm"><span>{t('checkout.subtotal')}</span><span>{formatVnd(subtotal)}</span></div>
          <div className="flex justify-between text-sm"><span>{t('checkout.shippingFee')}</span><span className={shippingFee === 0 ? 'font-medium text-success' : ''}>{shippingFee === 0 ? t('checkout.freeShipping') : formatVnd(shippingFee)}</span></div>
          <div className="divider my-0" />

          <div className="flex items-baseline justify-between">
            <span className="font-medium">{t('checkout.total')}</span>
            <span className="text-2xl font-semibold text-primary">{formatVnd(total)}</span>
          </div>
          <button onClick={handleSubmit} disabled={!isValid || createOrder.isPending} className="btn btn-primary btn-lg mt-1 w-full">
            {createOrder.isPending ? <span className="loading loading-spinner loading-sm" /> : t('checkout.placeOrder')}
          </button>
          {!isValid && items.length > 0 && <p className="text-xs text-base-content/55">{t('checkout.fillAllHint')}</p>}
          <p className="flex items-center justify-center gap-1.5 text-xs text-base-content/55"><Shield width={14} height={14} /> {t('cart.secure')}</p>
        </aside>
      </div>
    </div>
  );
}
