import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCart, useUpdateCartItem, useRemoveCartItem, cartErrorKey } from '../hooks/useCart.js';
import { formatVnd } from '../utils/format.js';
import EmptyState from '../components/ui/EmptyState.jsx';
import { Plus, Minus, Trash, Truck, Shield } from '../components/suppliers/icons.jsx';

const MAX_QTY = 999; // khớp ràng buộc quantity 1..999 của BE

/*
 * Giỏ hàng — bố cục 2 cột: danh sách sản phẩm (card, nút +/- số lượng) và khung tóm tắt dính (sticky).
 * Dữ liệu từ GET /api/cart (server-side, cần đăng nhập — route bọc ProtectedRoute trong App.jsx).
 * Mọi thao tác sửa/xoá trả về giỏ mới → cache tự cập nhật (xem hooks/useCart.js).
 *
 * Bỏ thanh "mua thêm X để miễn phí ship" của bản cũ: phí ship giờ BE tính theo TỪNG đơn của từng
 * nhà cung cấp + khoảng cách, ngưỡng miễn phí do admin cấu hình → FE không đoán đúng được ở bước giỏ.
 *
 * Món ngừng bán (NCC ẩn SP / NCC bị đình chỉ — docs BE cart-unavailable-items-fe.md): BE vẫn giữ trong giỏ với
 * `available: false` và KHÔNG cộng vào subtotal/totalQuantity; đổi số lượng → 409. Nên dòng đó chỉ còn nút Xoá,
 * và khoá nút Thanh toán tới khi khách xoá hết (checkout sẽ trả 409 PRODUCT_UNAVAILABLE).
 */
export default function Cart() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: cart, isLoading, isError, refetch } = useCart();
  const updateItem = useUpdateCartItem();
  const removeItem = useRemoveCartItem();
  const [actionError, setActionError] = useState('');
  const [clearingUnavailable, setClearingUnavailable] = useState(false);

  if (isLoading) {
    return (
      <div className="mx-auto flex max-w-6xl flex-col gap-3">
        <div className="skeleton h-9 w-48 rounded-lg" />
        {[0, 1].map((i) => <div key={i} className="skeleton h-32 w-full rounded-2xl" />)}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
        <p className="text-error">{t('cart.loadError')}</p>
        <button onClick={() => refetch()} className="btn btn-outline btn-sm">{t('cart.retry')}</button>
      </div>
    );
  }

  const items = cart?.items ?? [];
  if (!items.length)
    return <EmptyState title={t('cart.empty')} hint={t('cart.emptyHint')} ctaLabel={t('cart.browseShop')} ctaTo="/shop" />;

  // Dòng nào đang chờ BE trả về → khoá nút của dòng đó (tránh bấm +/- dồn dập gửi nhiều request lệch nhau)
  const busyItemId =
    (updateItem.isPending && updateItem.variables?.itemId) || (removeItem.isPending && removeItem.variables) || null;

  const handleError = (err) => setActionError(t(cartErrorKey(err)));
  const changeQty = (item, quantity) => {
    setActionError('');
    // Về 0 thì xoá dòng (BE không nhận quantity=0 ở PUT)
    if (quantity <= 0) removeItem.mutate(item.id, { onError: handleError });
    else updateItem.mutate({ itemId: item.id, quantity: Math.min(MAX_QTY, quantity) }, { onError: handleError });
  };
  const remove = (item) => {
    setActionError('');
    removeItem.mutate(item.id, { onError: handleError });
  };

  // `available` thiếu (BE cũ / mock) = coi như còn bán
  const unavailableItems = items.filter((i) => i.available === false);
  const unavailableCount = cart.unavailableCount ?? unavailableItems.length;
  const unavailableLabel = (item) =>
    t(`cart.unavailableReason.${item.unavailableReason}`, { defaultValue: t('cart.unavailableFallback') });
  // BE không có API xoá hàng loạt → xoá TUẦN TỰ từng dòng (song song dễ trả về giỏ lệch nhau)
  const removeAllUnavailable = async () => {
    setActionError('');
    setClearingUnavailable(true);
    try {
      for (const item of unavailableItems) {
        // eslint-disable-next-line no-await-in-loop -- cố ý tuần tự
        await removeItem.mutateAsync(item.id);
      }
    } catch (err) {
      handleError(err);
    } finally {
      setClearingUnavailable(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-2">
        <h1 className="font-display text-3xl">{t('cart.title')}</h1>
        <p className="text-sm text-base-content/70">{t('cart.itemsCount', { count: cart.totalQuantity })}</p>
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 rounded-2xl border border-base-300 bg-base-100 p-4 text-sm">
            <Truck width={18} height={18} className="shrink-0 text-primary" />
            <span>{t('cart.shippingNote')}</span>
          </div>

          {actionError && <div role="alert" className="alert alert-error py-2 text-sm">{actionError}</div>}

          {unavailableCount > 0 && (
            <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-warning/40 bg-warning/10 p-4 text-sm">
              <span>{t('cart.unavailableBanner', { count: unavailableCount })}</span>
              <button type="button" onClick={removeAllUnavailable} disabled={clearingUnavailable} className="btn btn-warning btn-sm">
                {clearingUnavailable ? <span className="loading loading-spinner loading-xs" /> : t('cart.removeUnavailable')}
              </button>
            </div>
          )}

          <ul className="flex flex-col gap-3">
            {items.map((item) => {
              const busy = busyItemId === item.id;
              const unavailable = item.available === false;
              const variantText = [item.color, item.dimensions].filter(Boolean).join(' · ');
              // BE: unitPrice là giá HIỆN TẠI, priceAtAddition là giá lúc thêm → khác nhau thì báo khách
              const priceChanged = item.priceAtAddition != null && Number(item.priceAtAddition) !== Number(item.unitPrice);
              return (
                <li
                  key={item.id}
                  className={`flex gap-4 rounded-2xl border bg-base-100 p-3 transition-opacity sm:p-4 ${
                    unavailable ? 'border-dashed border-warning/50 bg-base-200/40' : 'border-base-300'} ${busy ? 'opacity-60' : ''}`}
                >
                  <Link to={`/product/${item.productId}`} className={`shrink-0 ${unavailable ? 'opacity-40 grayscale' : ''}`}>
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.productName} className="h-24 w-24 rounded-xl object-cover sm:h-28 sm:w-28" loading="lazy" />
                    ) : (
                      <div className="h-24 w-24 rounded-xl bg-base-200 sm:h-28 sm:w-28" aria-hidden="true" />
                    )}
                  </Link>

                  <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link to={`/product/${item.productId}`} className="line-clamp-2 font-medium leading-snug hover:text-primary">{item.productName}</Link>
                        {variantText && <p className="mt-0.5 truncate text-xs text-base-content/70">{variantText}</p>}
                        {unavailable && <span className="badge badge-warning badge-sm mt-1.5">{unavailableLabel(item)}</span>}
                        {!unavailable && priceChanged && (
                          <p className="mt-1 text-xs text-warning">
                            {t('cart.priceChanged', { old: formatVnd(item.priceAtAddition), now: formatVnd(item.unitPrice) })}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => remove(item)}
                        disabled={busy}
                        aria-label={`${t('cart.remove')} ${item.productName}`}
                        className="btn btn-ghost btn-sm btn-circle shrink-0 text-base-content/70 hover:text-error"
                      >
                        <Trash width={16} height={16} />
                      </button>
                    </div>

                    {unavailable ? (
                      // Ngừng bán: BE chặn đổi số lượng (409) → ẩn bộ +/-, gạch giá (không tính vào tạm tính)
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="text-base-content/70">× {item.quantity}</span>
                        <span className="text-base-content/70 line-through">{formatVnd(item.lineTotal)}</span>
                      </div>
                    ) : (
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      {/* Bộ chỉnh số lượng: giảm về 0 thì xoá dòng (xem changeQty) */}
                      <div className="inline-flex items-center rounded-full border border-base-300">
                        <button
                          type="button"
                          onClick={() => changeQty(item, item.quantity - 1)}
                          disabled={busy}
                          aria-label={t('cart.decrease')}
                          className="grid h-8 w-8 place-items-center rounded-full hover:bg-base-200 disabled:opacity-40"
                        >
                          <Minus width={14} height={14} />
                        </button>
                        <span className="w-8 text-center text-sm font-medium tabular-nums">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => changeQty(item, item.quantity + 1)}
                          disabled={busy || item.quantity >= MAX_QTY}
                          aria-label={t('cart.increase')}
                          className="grid h-8 w-8 place-items-center rounded-full hover:bg-base-200 disabled:opacity-40"
                        >
                          <Plus width={14} height={14} />
                        </button>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">{formatVnd(item.lineTotal)}</p>
                        {item.quantity > 1 && <p className="text-xs text-base-content/70">{formatVnd(item.unitPrice)} / {t('cart.each')}</p>}
                      </div>
                    </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>

          <Link to="/shop" className="text-sm text-primary hover:underline">← {t('cart.continueShopping')}</Link>
        </div>

        <aside className="sticky top-24 flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <h2 className="font-display text-xl">{t('cart.summary')}</h2>
          <div className="flex justify-between text-sm"><span>{t('cart.productsLabel')} ({cart.totalQuantity})</span><span>{formatVnd(cart.subtotal)}</span></div>
          <div className="flex justify-between text-sm text-base-content/70"><span>{t('checkout.shippingFee')}</span><span>{t('cart.shippingTbd')}</span></div>
          <div className="divider my-0" />
          <div className="flex items-baseline justify-between">
            <span className="font-medium">{t('cart.total')}</span>
            <span className="text-2xl font-semibold text-primary">{formatVnd(cart.subtotal)}</span>
          </div>
          <button onClick={() => navigate('/checkout')} disabled={!!busyItemId || unavailableCount > 0 || !cart.totalQuantity} className="btn btn-primary btn-lg mt-1 w-full">{t('cart.checkout')}</button>
          {unavailableCount > 0 && <p className="text-xs text-warning">{t('cart.unavailableBanner', { count: unavailableCount })}</p>}
          <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-base-content/70">
            <Shield width={14} height={14} /> {t('cart.secure')}
          </p>
        </aside>
      </div>
    </div>
  );
}
