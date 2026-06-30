import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatVnd } from '../../utils/format.js';
import { Pin, ExternalLink } from '../suppliers/icons.jsx';

/*
 * ChatProductCard — card sản phẩm ghim đầu khung chat (kiểu Shopee) khi mở chat từ trang sản phẩm.
 * onHide: ẩn card (nút pin). onNavigate: đóng drawer khi bấm "Xem sản phẩm".
 */
export default function ChatProductCard({ product, onHide, onNavigate }) {
  const { t } = useTranslation();
  if (!product) return null;

  return (
    <div className="m-3 rounded-2xl border border-base-300 bg-base-100 p-2.5 shadow-sm">
      <div className="flex gap-3">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          className="h-20 w-20 shrink-0 rounded-xl object-cover bg-base-200"
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-start gap-1">
            <p className="line-clamp-2 flex-1 text-sm font-medium leading-snug">{product.name}</p>
            <button
              type="button"
              onClick={onHide}
              aria-label={t('chat.hideProduct')}
              className="btn btn-ghost btn-xs btn-circle -mt-1 -mr-1 text-base-content/45"
            >
              <Pin width={14} height={14} />
            </button>
          </div>
          <p className="mt-0.5 font-semibold text-primary">{formatVnd(product.price)}</p>
          {product.supplierName && (
            <p className="truncate text-xs text-base-content/55">{product.supplierName}</p>
          )}
          <Link
            to={`/product/${product.id}`}
            onClick={onNavigate}
            className="mt-1 inline-flex w-fit items-center gap-1 text-xs font-medium text-primary hover:underline"
          >
            {t('chat.viewProduct')} <ExternalLink width={12} height={12} />
          </Link>
        </div>
      </div>
    </div>
  );
}
