import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatVnd } from '../../utils/format.js';
import { Star, ShoppingCart, MessageCircle } from '../suppliers/icons.jsx';
import ProductOptions from './ProductOptions.jsx';
import QuantitySelector from './QuantitySelector.jsx';
import ProductTrustCards from './ProductTrustCards.jsx';

/*
 * ProductInfo — cột phải trang sản phẩm. Tự quản state UI (qty, size đang chọn, hiệu ứng "đã thêm");
 * mọi hành động ghi (giỏ hàng / mua ngay / chat) uỷ quyền ra ngoài qua props để KHÔNG đụng logic.
 */
export default function ProductInfo({ product, onAddToCart, onBuyNow, onChat }) {
  const { t } = useTranslation();
  const outOfStock = product.status === 'out_of_stock' || product.stock === 0;
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState(product.sizes?.[0] ?? '');
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    onAddToCart(qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl leading-tight md:text-4xl">{product.name}</h1>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-base-content/60">
          {/* Tên supplier để text: SP thuộc manufacturer (chưa có trang profile riêng;
              /suppliers/:slug chỉ dành cho workshop). Khi BE có supplierSlug → đổi thành Link. */}
          <span>
            {t('product.suppliedBy')}{' '}
            <span className="font-medium text-base-content">{product.supplierName}</span>
          </span>
          {product.rating > 0 && (
            <span className="inline-flex items-center gap-1 text-base-content/70">
              <Star width={14} height={14} className="text-accent" /> {product.rating}
            </span>
          )}
        </p>
      </div>

      <p className="text-3xl font-semibold text-primary">{formatVnd(product.price)}</p>

      <p className="leading-relaxed text-base-content/75">{product.description}</p>

      {/* Thuộc tính nhanh */}
      <div className="flex flex-col gap-2 text-sm">
        <div className="flex gap-3">
          <span className="w-24 shrink-0 text-base-content/55">{t('product.material')}</span>
          <span className="font-medium">{product.materialName}</span>
        </div>
        <div className="flex gap-3">
          <span className="w-24 shrink-0 text-base-content/55">{t('product.stock')}</span>
          <span className={outOfStock ? 'font-medium text-error' : 'font-medium'}>
            {outOfStock ? t('product.outOfStock') : `${product.stock} ${t('product.unit')}`}
          </span>
        </div>
      </div>

      <ProductOptions label={t('product.size')} options={product.sizes} value={size} onChange={setSize} />

      {!outOfStock && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-base-content/55">{t('product.quantity')}</span>
          <QuantitySelector value={qty} onChange={setQty} max={product.stock} />
        </div>
      )}

      {/* CTA */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={handleAdd}
            disabled={outOfStock}
            className={`btn flex-1 gap-2 ${added ? 'btn-success' : 'btn-primary'}`}
          >
            <ShoppingCart width={18} height={18} />
            {outOfStock ? t('product.outOfStock') : added ? t('product.added') : t('product.addToCart')}
          </button>
          <button onClick={() => onBuyNow(qty)} disabled={outOfStock} className="btn btn-outline flex-1">
            {t('product.buyNow')}
          </button>
        </div>
        <button onClick={onChat} className="btn btn-outline btn-primary gap-2">
          <MessageCircle width={18} height={18} /> {t('product.chatSupplier')}
        </button>
      </div>

      {product.hasModel3d && (
        <Link to="/custom" className="btn btn-accent btn-outline btn-sm self-start">
          {t('product.customize')}
        </Link>
      )}

      <ProductTrustCards />
    </div>
  );
}
