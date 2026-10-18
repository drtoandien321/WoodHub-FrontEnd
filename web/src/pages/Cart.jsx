import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCartStore } from '../stores/cartStore.js';
import { formatVnd } from '../utils/format.js';
import EmptyState from '../components/ui/EmptyState.jsx';
import { Plus, Minus, Trash, Truck, Shield } from '../components/suppliers/icons.jsx';

// Cùng ngưỡng với Checkout.jsx (miễn phí ship từ 5tr) — đổi 1 nơi thì đổi cả 2
const FREE_SHIP_FROM = 5_000_000;

/*
 * Giỏ hàng — bố cục 2 cột: danh sách sản phẩm (card, nút +/- số lượng) và khung tóm tắt dính (sticky).
 * Thanh tiến độ "miễn phí vận chuyển" khuyến khích mua thêm, đồng thời giải thích phí ship ở bước sau.
 */
export default function Cart() {
  const { t } = useTranslation();
  const { items, updateQty, removeItem } = useCartStore();
  const subtotal = useCartStore((s) => s.subtotal());
  const navigate = useNavigate();

  if (!items.length)
    return <EmptyState title={t('cart.empty')} hint={t('cart.emptyHint')} ctaLabel={t('cart.browseShop')} ctaTo="/shop" />;

  const count = items.reduce((n, i) => n + i.qty, 0);
  const remain = Math.max(0, FREE_SHIP_FROM - subtotal);
  const progress = Math.min(100, Math.round((subtotal / FREE_SHIP_FROM) * 100));

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-2">
        <h1 className="font-display text-3xl">{t('cart.title')}</h1>
        <p className="text-sm text-base-content/60">{t('cart.itemsCount', { count })}</p>
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-4">
          {/* Tiến độ miễn phí vận chuyển */}
          <div className="rounded-2xl border border-base-300 bg-base-100 p-4">
            <div className="flex items-center gap-2 text-sm">
              <Truck width={18} height={18} className="shrink-0 text-primary" />
              <span>
                {remain > 0 ? t('cart.freeShipLeft', { amount: formatVnd(remain) }) : t('cart.freeShipDone')}
              </span>
            </div>
            <progress className="progress progress-primary mt-3 h-1.5 w-full" value={progress} max="100" />
          </div>

          <ul className="flex flex-col gap-3">
            {items.map((item) => (
              <li key={item.productId} className="flex gap-4 rounded-2xl border border-base-300 bg-base-100 p-3 sm:p-4">
                <Link to={`/product/${item.productId}`} className="shrink-0">
                  <img src={item.image} alt={item.name} className="h-24 w-24 rounded-xl object-cover sm:h-28 sm:w-28" loading="lazy" />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link to={`/product/${item.productId}`} className="line-clamp-2 font-medium leading-snug hover:text-primary">{item.name}</Link>
                      {item.supplierName && <p className="mt-0.5 truncate text-xs text-base-content/55">{item.supplierName}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      aria-label={`${t('cart.remove')} ${item.name}`}
                      className="btn btn-ghost btn-sm btn-circle shrink-0 text-base-content/50 hover:text-error"
                    >
                      <Trash width={16} height={16} />
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3">
                    {/* Bộ chỉnh số lượng: giảm về 0 thì sản phẩm bị xóa (xem updateQty trong cartStore) */}
                    <div className="inline-flex items-center rounded-full border border-base-300">
                      <button
                        type="button"
                        onClick={() => updateQty(item.productId, item.qty - 1)}
                        aria-label={t('cart.decrease')}
                        className="grid h-8 w-8 place-items-center rounded-full hover:bg-base-200"
                      >
                        <Minus width={14} height={14} />
                      </button>
                      <span className="w-8 text-center text-sm font-medium tabular-nums">{item.qty}</span>
                      <button
                        type="button"
                        onClick={() => updateQty(item.productId, item.qty + 1)}
                        aria-label={t('cart.increase')}
                        className="grid h-8 w-8 place-items-center rounded-full hover:bg-base-200"
                      >
                        <Plus width={14} height={14} />
                      </button>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-primary">{formatVnd(item.price * item.qty)}</p>
                      {item.qty > 1 && <p className="text-xs text-base-content/50">{formatVnd(item.price)} / {t('cart.each')}</p>}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <Link to="/shop" className="text-sm text-primary hover:underline">← {t('cart.continueShopping')}</Link>
        </div>

        <aside className="sticky top-24 flex flex-col gap-3 rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <h2 className="font-display text-xl">{t('cart.summary')}</h2>
          <div className="flex justify-between text-sm"><span>{t('cart.productsLabel')} ({count})</span><span>{formatVnd(subtotal)}</span></div>
          <div className="flex justify-between text-sm text-base-content/60"><span>{t('checkout.shippingFee')}</span><span>{t('cart.shippingTbd')}</span></div>
          <div className="divider my-0" />
          <div className="flex items-baseline justify-between">
            <span className="font-medium">{t('cart.total')}</span>
            <span className="text-2xl font-semibold text-primary">{formatVnd(subtotal)}</span>
          </div>
          <button onClick={() => navigate('/checkout')} className="btn btn-primary btn-lg mt-1 w-full">{t('cart.checkout')}</button>
          <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-base-content/55">
            <Shield width={14} height={14} /> {t('cart.secure')}
          </p>
        </aside>
      </div>
    </div>
  );
}
