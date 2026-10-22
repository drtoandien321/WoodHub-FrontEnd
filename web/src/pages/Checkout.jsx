import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart } from '../hooks/useCart.js';
import { useAddresses, formatAddressLine } from '../hooks/useAddresses.js';
import { useCheckout, useAvailableVouchers, useOrderPreview } from '../hooks/useOrders.js';
import { useAuthStore } from '../stores/authStore.js';
import { translateErrorCode } from '../utils/apiError.js';
import { formatVnd } from '../utils/format.js';
import EmptyState from '../components/ui/EmptyState.jsx';
import AddressFormModal from '../components/address/AddressFormModal.jsx';
import OrderPaymentPanel from '../components/checkout/OrderPaymentPanel.jsx';
import VoucherPicker from '../components/checkout/VoucherPicker.jsx';
import { Check, Wallet, Shield, Plus } from '../components/suppliers/icons.jsx';
// Lỗi BE: dùng message tiếng Việt khi UI là VI, còn lại dùng câu đã dịch (xem utils/apiError.js)
import { apiErrorMessage } from '../utils/apiError.js';
import { useFeedbackStore } from '../stores/feedbackStore.js';
import { useMyPlatformFeedback, FEEDBACK_ENABLED } from '../hooks/usePlatformFeedback.js';

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
 * FE chỉ gửi: địa chỉ giao (addressId từ sổ địa chỉ — bắt buộc có toạ độ), ghi chú, voucher đã chọn (promotionIds).
 * Voucher chọn từ danh sách GET /vouchers/available (BE đã bỏ nhập mã tay). BE tự làm phần còn lại: tách đơn theo
 * nhà cung cấp, chọn chi nhánh gần nhất, tính phí ship theo khoảng cách, áp voucher, tạo 1 QR chung và xoá giỏ. Vì vậy phí ship/giảm giá CHỈ biết được sau khi đặt
 * — trước đó tóm tắt chỉ hiện tạm tính tiền hàng (không tự đoán phí ship để tránh lệch với BE).
 *
 * Sau khi đặt: chuyển sang màn "Thanh toán" (QR chung + danh sách đơn), poll tới khi paid.
 */
export default function Checkout() {
  const { t } = useTranslation();
  const { data: cart, isLoading: cartLoading, refetch: refetchCart } = useCart();
  const { data: addresses = [], isLoading: addressesLoading } = useAddresses();
  const checkout = useCheckout();

  const [selectedId, setSelectedId] = useState(null);
  const [addressModal, setAddressModal] = useState(null); // null | 'new' | UserAddressResponse (sửa để ghim)
  const [note, setNote] = useState('');
  const [voucherIds, setVoucherIds] = useState([]);
  // Khách đã tự tick/bỏ tick chưa — chưa thì luôn bám theo gợi ý (recommended) mới nhất của BE
  const [voucherTouched, setVoucherTouched] = useState(false);
  const [submitErr, setSubmitErr] = useState('');
  const [result, setResult] = useState(null); // CheckoutResponse sau khi đặt thành công
  const [paid, setPaid] = useState(false);

  const selectedAddress = addresses.find((a) => a.id === selectedId);
  // Chữ ký giỏ: đổi số lượng / món → tải lại voucher (eligible + số tiền giảm tính theo giỏ)
  const cartKey = (cart?.items ?? []).map((i) => `${i.variantId ?? i.id}x${i.quantity}`).join(',');
  const vouchersQuery = useAvailableVouchers({
    addressId: selectedAddress?.hasCoordinates ? selectedAddress.id : undefined,
    cartKey,
    enabled: !!cart?.items?.length && !result,
  });
  const vouchers = useMemo(() => vouchersQuery.data ?? [], [vouchersQuery.data]);

  // Khách doanh nghiệp: tuỳ chọn xuất hoá đơn VAT cho mọi đơn của lần checkout này (BE-08 §4.1)
  const isBusiness = useAuthStore((s) => s.user?.customerType) === 'business';
  const [vatInvoice, setVatInvoice] = useState(false);

  /*
   * Xem trước (BE-07): cùng phép tính với checkout → phí ship, giảm giá, tổng chính xác trước khi đặt. Tự gọi lại khi
   * đổi địa chỉ / voucher / giỏ. Thay dòng "Phí ship: tính khi đặt hàng" và giảm giá "dự kiến" của bản trước.
   */
  const preview = useOrderPreview({
    addressId: selectedAddress?.hasCoordinates ? selectedAddress.id : undefined,
    promotionIds: voucherIds,
    cartKey,
    enabled: !!cart?.items?.length && !result,
  });
  const couponErrors = preview.data?.couponErrors ?? [];

  /*
   * Mỗi lần có danh sách mới: chưa đụng tay → chọn đúng các voucher BE gợi ý; đã đụng tay → giữ lựa chọn của khách
   * nhưng bỏ những voucher không còn dùng được (giỏ/địa chỉ đổi làm voucher hết điều kiện).
   */
  useEffect(() => {
    if (!vouchersQuery.data) return;
    setVoucherIds((ids) => (voucherTouched
      ? ids.filter((id) => vouchers.some((v) => v.id === id && v.eligible))
      : vouchers.filter((v) => v.recommended && v.eligible).map((v) => v.id)));
  }, [vouchersQuery.data, vouchers, voucherTouched]);

  // Tự chọn sẵn: địa chỉ mặc định nếu đã có toạ độ, không thì địa chỉ đầu tiên có toạ độ
  useEffect(() => {
    if (selectedId || !addresses.length) return;
    const usable = addresses.filter((a) => a.hasCoordinates);
    setSelectedId((usable.find((a) => a.isDefault) ?? usable[0])?.id ?? null);
  }, [addresses, selectedId]);

  /*
   * Đơn vừa thanh toán thành công → mời 'Bạn chấm WoodHub mấy sao?' (docs/BE-platform-feedback.md). Chỉ khi khách CHƯA
   * đánh giá (GET /feedback/me = 404) và chưa bấm 'Để sau' trong phiên. Trễ 1,5s để khách kịp thấy màn 'Đặt hàng thành công'.
   */
  const myFeedback = useMyPlatformFeedback();
  const openFeedback = useFeedbackStore((st) => st.openFeedback);
  const dismissedAfterOrder = useFeedbackStore((st) => st.dismissedAfterOrder);
  useEffect(() => {
    if (!FEEDBACK_ENABLED || !paid || dismissedAfterOrder || !myFeedback.isFetched || myFeedback.data) return;
    const timer = setTimeout(() => openFeedback('after_order'), 1500);
    return () => clearTimeout(timer);
  }, [paid, dismissedAfterOrder, myFeedback.isFetched, myFeedback.data, openFeedback]);

  // ===== Màn THANH TOÁN (sau khi checkout thành công) =====
  if (result) {
    return (
      <div className="mx-auto max-w-4xl">
        <Steps t={t} current={paid ? 3 : 1} />
        <div className="grid items-start gap-6 md:grid-cols-[1fr_340px]">
          <div className="flex flex-col gap-4">
            <h1 className="font-display text-3xl">{paid ? t('checkout.doneTitle') : t('checkout.payTitle')}</h1>
            {result.orders.length > 1 && <p className="text-sm text-base-content/65">{t('checkout.splitNote', { count: result.orders.length })}</p>}
            {/* Sàn không quản lý tồn kho: NCC xác nhận trong 24h, hết hàng thì huỷ + hoàn tiền 48h (no-inventory-order-confirm-fe.md) */}
            {!paid && <p className="rounded-xl border border-info/30 bg-info/5 p-3 text-sm text-base-content/75">{t('checkout.confirmNotice')}</p>}
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

  const selected = selectedAddress;
  // Món ngừng bán (available=false) không đặt được — BE trả 409 → khoá nút, bảo khách về giỏ xoá trước
  const unavailableCount = cart.unavailableCount ?? items.filter((i) => i.available === false).length;
  // Voucher đã chọn mà preview báo không áp được → checkout sẽ lỗi → bắt khách bỏ voucher đó trước (docs BE-07)
  const canSubmit = !!selected?.hasCoordinates && !checkout.isPending && unavailableCount === 0 && couponErrors.length === 0;
  const p = preview.data;
  const voucherName = (id) => vouchers.find((v) => v.id === id)?.name ?? '';
  const couponErrorText = (e) => translateErrorCode(e.errorCode, e.params) ?? e.message;
  const dropErroredVouchers = () => {
    setVoucherTouched(true);
    setVoucherIds((ids) => ids.filter((id) => !couponErrors.some((e) => e.promotionId === id)));
  };

  const handleSubmit = () => {
    if (!selected?.hasCoordinates) return;
    setSubmitErr('');
    checkout.mutate(
      {
        addressId: selected.id,
        note: note.trim() || undefined,
        promotionIds: voucherIds.length ? voucherIds : undefined,
        vatInvoice: isBusiness && vatInvoice ? true : undefined,
      },
      {
        onSuccess: (res) => { setResult(res); window.scrollTo({ top: 0 }); },
        // 400 (giỏ trống / thiếu toạ độ / voucher không áp được) · 409 (SP ngừng bán / NCC chưa có chi nhánh / voucher hết lượt)
        onError: (err) => {
          // Lỗi do voucher (vừa hết lượt, hết hạn...) → đơn CHƯA được tạo; tải lại danh sách để khách chọn lại
          // NCC vừa ẩn SP đúng lúc khách đang thanh toán → tải lại giỏ để dòng đó hiện "ngừng bán"
          if (err?.response?.data?.errorCode === 'PRODUCT_UNAVAILABLE') refetchCart();
          if (String(err?.response?.data?.errorCode ?? '').startsWith('COUPON_')) {
            vouchersQuery.refetch();
            setSubmitErr(`${apiErrorMessage(err, t('checkout.submitFailed'))} ${t('checkout.voucherChanged')}`);
            return;
          }
          // VAT mà chưa có hồ sơ công ty → dẫn tới Hồ sơ doanh nghiệp
          if (err?.response?.data?.errorCode === 'BUSINESS_PROFILE_REQUIRED') { setSubmitErr(t('checkout.vatNeedProfile')); return; }
          setSubmitErr(apiErrorMessage(err, t('checkout.submitFailed')));
        },
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

          {/* 2. Voucher — chọn từ danh sách BE tính sẵn cho giỏ (thay ô nhập mã đã ngừng hỗ trợ) */}
          <Section no="2" title={t('checkout.voucher')}>
            {vouchersQuery.isLoading ? (
              <div className="flex flex-col gap-2">{[0, 1].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}</div>
            ) : vouchersQuery.isError ? (
              <p className="text-sm text-error">
                {t('checkout.vouchersError')}{' '}
                <button type="button" onClick={() => vouchersQuery.refetch()} className="link link-primary">{t('checkout.vouchersRetry')}</button>
              </p>
            ) : !vouchers.length ? (
              <p className="text-sm text-base-content/60">{t('checkout.vouchersEmpty')}</p>
            ) : (
              <VoucherPicker
                vouchers={vouchers}
                selectedIds={voucherIds}
                onChange={(ids) => { setVoucherTouched(true); setVoucherIds(ids); }}
                hasAddress={!!selected?.hasCoordinates}
              />
            )}
            {couponErrors.length > 0 && (
              <div role="alert" className="mt-3 flex flex-col gap-2 rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs">
                <ul className="flex flex-col gap-1">
                  {couponErrors.map((e) => (
                    <li key={e.promotionId}><b>{voucherName(e.promotionId) || e.params?.voucherName}</b>: {couponErrorText(e)}</li>
                  ))}
                </ul>
                <button type="button" onClick={dropErroredVouchers} className="btn btn-warning btn-xs self-start">{t('checkout.dropInvalidVouchers')}</button>
              </div>
            )}
            <p className="mt-2 text-xs text-base-content/50">{t('checkout.voucherHint')}</p>
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
            {isBusiness && (
              <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-xl border border-base-300 p-4">
                <input type="checkbox" className="checkbox checkbox-primary checkbox-sm mt-0.5" checked={vatInvoice} onChange={(e) => setVatInvoice(e.target.checked)} />
                <span className="text-sm">
                  <span className="block font-medium">{t('checkout.vatInvoice')}</span>
                  <span className="block text-xs text-base-content/60">{t('checkout.vatInvoiceHint')} <Link to="/profile#business" className="link link-primary">{t('checkout.vatEditProfile')}</Link></span>
                </span>
              </label>
            )}
          </Section>
        </div>

        <aside className="sticky top-24 flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl">{t('checkout.orderSummary')}</h2>
            <Link to="/cart" className="text-xs text-primary hover:underline">{t('checkout.editCart')}</Link>
          </div>
          <ul className="flex max-h-64 flex-col gap-3 overflow-y-auto px-1 pb-1 pt-2">
            {items.map((i) => (
              <li key={i.id} className={`flex gap-3 text-sm ${i.available === false ? 'opacity-45 line-through' : ''}`}>
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
          {/* Số liệu từ POST /orders/preview — chưa chọn địa chỉ thì chưa tính được ship */}
          <div className={`flex flex-col gap-3 transition-opacity ${preview.isFetching ? 'opacity-60' : ''}`}>
            <div className="flex justify-between text-sm"><span>{t('checkout.subtotal')}</span><span>{formatVnd(p?.subtotal ?? cart.subtotal)}</span></div>
            <div className="flex justify-between text-sm">
              <span>{t('checkout.shippingFee')}</span>
              <span>{p ? (Number(p.shippingFee) === 0 ? t('checkout.freeShipping') : formatVnd(p.shippingFee)) : <span className="text-base-content/60">{t('checkout.pickAddressForShipping')}</span>}</span>
            </div>
            {Number(p?.discount) > 0 && (
              <div className="flex justify-between text-sm text-success"><span>{t('checkout.discount')}</span><span>−{formatVnd(p.discount)}</span></div>
            )}
            {(p?.groups ?? []).filter((g) => g.amountToFreeShip > 0).map((g) => (
              <p key={g.supplierId} className="rounded-lg bg-info/10 px-3 py-1.5 text-xs text-info">
                {t('checkout.amountToFreeShip', { amount: formatVnd(g.amountToFreeShip), supplier: g.supplierName })}
              </p>
            ))}
            {p?.groups?.length > 1 && <p className="text-xs text-base-content/50">{t('checkout.splitPreview', { count: p.groups.length })}</p>}
            {preview.isError && <p className="text-xs text-error">{apiErrorMessage(preview.error, t('checkout.previewFailed'))}</p>}
          </div>
          <div className="divider my-0" />
          <div className="flex items-baseline justify-between">
            <span className="font-medium">{t('checkout.grandTotal')}</span>
            <span className="text-2xl font-semibold text-primary">{formatVnd(p?.grandTotal ?? cart.subtotal)}</span>
          </div>
          {!p && <p className="text-xs text-base-content/50">{t('checkout.summaryHint')}</p>}

          <button onClick={handleSubmit} disabled={!canSubmit} className="btn btn-primary btn-lg w-full">
            {checkout.isPending ? <span className="loading loading-spinner loading-sm" /> : t('checkout.placeOrder')}
          </button>
          {unavailableCount > 0 && (
            <div role="alert" className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs">
              {t('checkout.unavailableBlock', { count: unavailableCount })}{' '}
              <Link to="/cart" className="link link-primary font-medium">{t('checkout.backToCart')}</Link>
            </div>
          )}
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
