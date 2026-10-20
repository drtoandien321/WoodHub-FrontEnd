import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../hooks/useCart.js';
import { useAddresses, formatAddressLine } from '../hooks/useAddresses.js';
import { useCheckout, useLookupPromotion } from '../hooks/useOrders.js';
import { formatVnd } from '../utils/format.js';
import EmptyState from '../components/ui/EmptyState.jsx';
import AddressFormModal from '../components/address/AddressFormModal.jsx';
import OrderPaymentPanel from '../components/checkout/OrderPaymentPanel.jsx';
import { Check, Wallet, Shield, Plus, X } from '../components/suppliers/icons.jsx';
// Lỗi BE: dùng message tiếng Việt khi UI là VI, còn lại dùng câu đã dịch (xem utils/apiError.js)
import { apiErrorMessage } from '../utils/apiError.js';

const NOTE_MAX = 500;

// Thanh 3 bước ở đầu trang: Giỏ hàng (xong) → Thanh toán → Hoàn tất. `current` = index bước đang làm.
function Steps({ t, current }) {
  const steps = [t('checkout.stepCart'), t('checkout.stepCheckout'), t('checkout.stepDone')];
  return (
    <ol className="mb-8 flex items-center justify-center gap-2 text-sm sm:gap-4" aria-label={t('checkout.progress')}>
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={label} className="flex items-center gap-2 sm:gap-4">
            <span className="flex items-center gap-2">
              <span
                className={`grid h-7 w-7 place-items-center rounded-full text-xs font-semibold ${
                  done ? 'bg-primary text-primary-content' : active ? 'border-2 border-primary text-primary' : 'border border-base-300 text-base-content/40'
                }`}
              >
                {done ? <Check width={14} height={14} /> : i + 1}
              </span>
              <span className={active ? 'font-medium' : 'text-base-content/55'}>{label}</span>
            </span>
            {i < steps.length - 1 && <span className="h-px w-6 bg-base-300 sm:w-12" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}

function Section({ no, title, action, children }) {
  return (
    <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 font-display text-lg">
          <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{no}</span>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}


/*
 * Checkout — đặt hàng từ giỏ theo POST /api/orders/checkout.
 *
 * FE chỉ gửi: địa chỉ giao (addressId từ sổ địa chỉ — bắt buộc có toạ độ), ghi chú, mã coupon.
 * BE tự làm phần còn lại: tách đơn theo nhà cung cấp, chọn chi nhánh gần nhất, tính phí ship theo
 * khoảng cách, áp coupon, tạo 1 QR chung và xoá giỏ. Vì vậy phí ship/giảm giá CHỈ biết được sau khi đặt
 * — trước đó tóm tắt chỉ hiện tạm tính tiền hàng (không tự đoán phí ship để tránh lệch với BE).
 *
 * Sau khi đặt: chuyển sang màn "Thanh toán" (QR chung + danh sách đơn), poll tới khi paid.
 */
export default function Checkout() {
  const { t } = useTranslation();
  const { data: cart, isLoading: cartLoading } = useCart();
  const { data: addresses = [], isLoading: addressesLoading } = useAddresses();
  const checkout = useCheckout();
  const lookupPromotion = useLookupPromotion();

  const [selectedId, setSelectedId] = useState(null);
  const [addressModal, setAddressModal] = useState(null); // null | 'new' | UserAddressResponse (sửa để ghim)
  const [note, setNote] = useState('');
  const [couponInput, setCouponInput] = useState('');
  const [coupons, setCoupons] = useState([]); // PromotionResponse[] đã tra cứu hợp lệ
  const [couponErr, setCouponErr] = useState('');
  const [submitErr, setSubmitErr] = useState('');
  const [result, setResult] = useState(null); // CheckoutResponse sau khi đặt thành công
  const [paid, setPaid] = useState(false);

  // Tự chọn sẵn: địa chỉ mặc định nếu đã có toạ độ, không thì địa chỉ đầu tiên có toạ độ
  useEffect(() => {
    if (selectedId || !addresses.length) return;
    const usable = addresses.filter((a) => a.hasCoordinates);
    setSelectedId((usable.find((a) => a.isDefault) ?? usable[0])?.id ?? null);
  }, [addresses, selectedId]);

  // ===== Màn THANH TOÁN (sau khi checkout thành công) =====
  if (result) {
    return (
      <div className="mx-auto max-w-4xl">
        <Steps t={t} current={paid ? 3 : 1} />
        <div className="grid items-start gap-6 md:grid-cols-[1fr_340px]">
          <div className="flex flex-col gap-4">
            <h1 className="font-display text-3xl">{paid ? t('checkout.doneTitle') : t('checkout.payTitle')}</h1>
            {result.orders.length > 1 && <p className="text-sm text-base-content/65">{t('checkout.splitNote', { count: result.orders.length })}</p>}
            <ul className="flex flex-col gap-3">
              {result.orders.map((o) => (
                <li key={o.id} className="rounded-2xl border border-base-300 bg-base-100 p-4 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium">{o.supplierName}</span>
                    <Link to={`/orders/${o.id}`} className="font-mono text-xs text-primary hover:underline">{o.orderCode}</Link>
                  </div>
                  <p className="mt-1 text-xs text-base-content/55">
                    {t('checkout.shipFrom', { store: [o.storeAddress, o.storeCity].filter(Boolean).join(', '), km: o.distanceKm })}
                  </p>
                  <dl className="mt-3 grid gap-1">
                    <div className="flex justify-between"><dt className="text-base-content/60">{t('checkout.subtotal')}</dt><dd>{formatVnd(o.subtotal)}</dd></div>
                    {o.productDiscount > 0 && <div className="flex justify-between text-success"><dt>{t('checkout.productDiscount')}</dt><dd>−{formatVnd(o.productDiscount)}</dd></div>}
                    <div className="flex justify-between"><dt className="text-base-content/60">{t('checkout.shippingFee')}</dt><dd>{o.shippingFee === 0 ? t('checkout.freeShipping') : formatVnd(o.shippingFee)}</dd></div>
                    {o.shippingDiscount > 0 && <div className="flex justify-between text-success"><dt>{t('checkout.shippingDiscount')}</dt><dd>−{formatVnd(o.shippingDiscount)}</dd></div>}
                    <div className="flex justify-between font-semibold"><dt>{t('checkout.orderTotal')}</dt><dd className="text-primary">{formatVnd(o.totalAmount)}</dd></div>
                  </dl>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              <Link to="/orders" className="btn btn-outline btn-sm">{t('checkout.viewOrders')}</Link>
              <Link to="/shop" className="btn btn-ghost btn-sm">{t('checkout.backToShop')}</Link>
            </div>
          </div>

          <aside className="flex flex-col gap-3 md:sticky md:top-24">
            <div className="flex items-baseline justify-between rounded-2xl bg-base-200/60 px-4 py-3">
              <span className="text-sm">{t('checkout.grandTotal')}</span>
              <span className="text-xl font-semibold text-primary">{formatVnd(result.grandTotal)}</span>
            </div>
            <OrderPaymentPanel paymentId={result.payment.id} fallback={result.payment} onPaid={() => setPaid(true)} />
          </aside>
        </div>
      </div>
    );
  }

  if (cartLoading || addressesLoading) {
    return <div className="flex justify-center py-20"><span className="loading loading-spinner loading-lg text-primary" /></div>;
  }

  const items = cart?.items ?? [];
  if (!items.length) {
    return <EmptyState title={t('checkout.emptyCart')} hint={t('checkout.emptyCartHint')} ctaLabel={t('checkout.backToShop')} ctaTo="/shop" />;
  }

  const selected = addresses.find((a) => a.id === selectedId);
  const canSubmit = !!selected?.hasCoordinates && !checkout.isPending;

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    if (coupons.some((c) => c.code.toUpperCase() === code)) { setCouponErr(t('checkout.couponDuplicate')); return; }
    setCouponErr('');
    lookupPromotion.mutate(code, {
      onSuccess: (promo) => { setCoupons((list) => [...list, promo]); setCouponInput(''); },
      onError: (err) => setCouponErr(apiErrorMessage(err, t(err?.response?.status === 404 ? 'checkout.couponNotFound' : 'checkout.couponInvalid'))),
    });
  };

  const handleSubmit = () => {
    if (!selected?.hasCoordinates) return;
    setSubmitErr('');
    checkout.mutate(
      {
        addressId: selected.id,
        note: note.trim() || undefined,
        couponCodes: coupons.length ? coupons.map((c) => c.code) : undefined,
      },
      {
        onSuccess: (res) => { setResult(res); window.scrollTo({ top: 0 }); },
        // 400 (giỏ trống / thiếu toạ độ / coupon sai) · 409 (SP ngừng bán / supplier chưa có chi nhánh / mã hết lượt)
        onError: (err) => setSubmitErr(apiErrorMessage(err, t('checkout.submitFailed'))),
      }
    );
  };

  return (
    <div className="mx-auto max-w-6xl">
      <Steps t={t} current={1} />

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_380px]">
        <div className="flex flex-col gap-5">
          <h1 className="font-display text-3xl">{t('checkout.title')}</h1>

          {/* 1. Địa chỉ giao — chọn từ sổ địa chỉ; địa chỉ chưa ghim toạ độ không chọn được */}
          <Section
            no="1"
            title={t('checkout.shippingAddress')}
            action={
              <button type="button" onClick={() => setAddressModal('new')} className="btn btn-ghost btn-xs gap-1">
                <Plus width={14} height={14} /> {t('checkout.addAddress')}
              </button>
            }
          >
            {!addresses.length ? (
              <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-base-300 p-6 text-center">
                <p className="text-sm text-base-content/70">{t('checkout.noAddress')}</p>
                <button type="button" onClick={() => setAddressModal('new')} className="btn btn-primary btn-sm">{t('checkout.addAddress')}</button>
              </div>
            ) : (
              <div className="flex flex-col gap-2" role="radiogroup" aria-label={t('checkout.shippingAddress')}>
                {addresses.map((a) => {
                  const active = a.id === selectedId;
                  return (
                    <label
                      key={a.id}
                      className={`flex gap-3 rounded-xl border p-3 transition-colors ${
                        !a.hasCoordinates ? 'border-dashed border-base-300 opacity-80' : active ? 'cursor-pointer border-primary bg-primary/5' : 'cursor-pointer border-base-300 hover:border-primary/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="address"
                        className="radio radio-primary radio-sm mt-0.5"
                        checked={active}
                        disabled={!a.hasCoordinates}
                        onChange={() => setSelectedId(a.id)}
                      />
                      <div className="min-w-0 flex-1 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{a.recipientName}</span>
                          <span className="text-base-content/60">{a.recipientPhone}</span>
                          {a.isDefault && <span className="badge badge-primary badge-xs">{t('address.default')}</span>}
                        </div>
                        <p className="mt-0.5 text-base-content/70">{formatAddressLine(a)}</p>
                        {!a.hasCoordinates && (
                          <p className="mt-1 text-xs text-warning">
                            ⚠ {t('checkout.needPin')}{' '}
                            <button type="button" onClick={(e) => { e.preventDefault(); setAddressModal(a); }} className="link link-primary">
                              {t('address.pinNow')}
                            </button>
                          </p>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </Section>

          {/* 2. Mã giảm giá — tra trước bằng /promotions/lookup; lượt dùng chỉ kiểm khi đặt hàng */}
          <Section no="2" title={t('checkout.coupon')}>
            <div className="flex gap-2">
              <input
                value={couponInput}
                onChange={(e) => { setCouponInput(e.target.value); setCouponErr(''); }}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); applyCoupon(); } }}
                placeholder={t('checkout.couponPlaceholder')}
                className={`input input-bordered flex-1 uppercase ${couponErr ? 'input-error' : ''}`}
                aria-label={t('checkout.coupon')}
              />
              <button type="button" onClick={applyCoupon} disabled={!couponInput.trim() || lookupPromotion.isPending} className="btn btn-outline">
                {lookupPromotion.isPending ? <span className="loading loading-spinner loading-sm" /> : t('checkout.applyCoupon')}
              </button>
            </div>
            {couponErr && <p className="mt-2 text-xs text-error">{couponErr}</p>}
            {coupons.length > 0 && (
              <ul className="mt-3 flex flex-wrap gap-2">
                {coupons.map((c) => (
                  <li key={c.code} className="flex items-center gap-1.5 rounded-full border border-success/40 bg-success/10 py-1 pl-3 pr-1 text-xs">
                    <span className="font-mono font-semibold">{c.code}</span>
                    <span className="text-base-content/65">· {c.name}</span>
                    <button
                      type="button"
                      onClick={() => setCoupons((list) => list.filter((x) => x.code !== c.code))}
                      className="btn btn-ghost btn-xs btn-circle"
                      aria-label={`${t('checkout.removeCoupon')} ${c.code}`}
                    >
                      <X width={12} height={12} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-xs text-base-content/50">{t('checkout.couponHint')}</p>
          </Section>

          {/* 3. Ghi chú + phương thức thanh toán */}
          <Section no="3" title={t('checkout.noteAndPayment')}>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm text-base-content/70">{t('checkout.note')}</span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, NOTE_MAX))}
                rows={2}
                placeholder={t('checkout.notePlaceholder')}
                className="textarea textarea-bordered w-full"
              />
            </label>
            <div className="mt-4 flex items-center gap-3 rounded-xl border-2 border-primary bg-primary/5 p-4">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><Wallet width={20} height={20} /></span>
              <div className="flex-1">
                <p className="font-medium">{t('checkout.bank')}</p>
                <p className="text-sm text-base-content/60">{t('checkout.bankQrDesc')}</p>
              </div>
              <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-content"><Check width={14} height={14} /></span>
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
              <li key={i.id} className="flex gap-3 text-sm">
                <div className="relative shrink-0">
                  {i.imageUrl ? <img src={i.imageUrl} alt={i.productName} className="h-14 w-14 rounded-lg object-cover" /> : <div className="h-14 w-14 rounded-lg bg-base-200" aria-hidden="true" />}
                  <span className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-base-content px-1 text-[11px] font-medium text-base-100">{i.quantity}</span>
                </div>
                <span className="line-clamp-2 min-w-0 flex-1 leading-snug">{i.productName}</span>
                <span className="shrink-0 font-medium">{formatVnd(i.lineTotal)}</span>
              </li>
            ))}
          </ul>

          <div className="divider my-0" />
          <div className="flex justify-between text-sm"><span>{t('checkout.subtotal')}</span><span>{formatVnd(cart.subtotal)}</span></div>
          <div className="flex justify-between text-sm text-base-content/60"><span>{t('checkout.shippingFee')}</span><span>{t('checkout.calculatedOnOrder')}</span></div>
          {coupons.length > 0 && (
            <div className="flex justify-between text-sm text-base-content/60"><span>{t('checkout.discount')}</span><span>{t('checkout.calculatedOnOrder')}</span></div>
          )}
          <p className="text-xs text-base-content/50">{t('checkout.summaryHint')}</p>
          <div className="divider my-0" />

          <button onClick={handleSubmit} disabled={!canSubmit} className="btn btn-primary btn-lg w-full">
            {checkout.isPending ? <span className="loading loading-spinner loading-sm" /> : t('checkout.placeOrder')}
          </button>
          {!selected?.hasCoordinates && <p className="text-xs text-base-content/55">{t('checkout.selectAddressHint')}</p>}
          {submitErr && <div role="alert" className="alert alert-error py-2 text-sm">{submitErr}</div>}
          <p className="flex items-center justify-center gap-1.5 text-xs text-base-content/55"><Shield width={14} height={14} /> {t('cart.secure')}</p>
        </aside>
      </div>

      {/* Ghim/thêm địa chỉ ngay tại checkout — bắt buộc toạ độ; lưu xong tự chọn địa chỉ đó */}
      {addressModal && (
        <AddressFormModal
          key={addressModal === 'new' ? 'new' : addressModal.id}
          initial={addressModal === 'new' ? null : addressModal}
          requireCoordinates
          onClose={() => setAddressModal(null)}
          onSaved={(saved) => setSelectedId(saved.id)}
        />
      )}
    </div>
  );
}
