import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { formatVnd } from '../../utils/format.js';
import { ShoppingCart, MessageCircle } from '../suppliers/icons.jsx';
import ProductOptions from './ProductOptions.jsx';
import QuantitySelector from './QuantitySelector.jsx';
import ProductTrustCards from './ProductTrustCards.jsx';
import { cartErrorKey } from '../../hooks/useCart.js';

// Nhãn hiển thị 1 variant trong bộ chọn — ghép color + dimensions, rơi vào "Mặc định" nếu cả 2 đều trống
const variantLabel = (v, fallback) => [v.color, v.dimensions].filter(Boolean).join(' · ') || fallback;

/*
 * ProductInfo — cột phải trang sản phẩm. Khớp ProductResponse thật (FE-4): giá theo TỪNG
 * variant (không có 1 giá chung ở product), KHÔNG có stock/rating (BE chưa gộp tồn kho vào
 * response này — tồn kho là module Store Inventory riêng theo chi nhánh). Tự quản state UI
 * (qty, variant đang chọn, hiệu ứng "đã thêm"); hành động ghi (giỏ hàng/mua ngay/chat) uỷ quyền
 * ra ngoài qua props để KHÔNG đụng logic cart/chat.
 */
export default function ProductInfo({ product, onAddToCart, onBuyNow, onChat, cartPending = false, extraActions = null }) {
  const { t } = useTranslation();
  // Không có variant thật thì không thêm được vào giỏ (giỏ thêm theo variantId) → khoá nút mua
  const hasVariants = product.variants?.length > 0;
  const variants = hasVariants ? product.variants : [{ id: 'default', price: 0 }];
  const [variantId, setVariantId] = useState(variants[0].id);
  const variant = variants.find((v) => v.id === variantId) ?? variants[0];
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [cartError, setCartError] = useState('');

  const labels = variants.map((v) => variantLabel(v, t('product.defaultVariant')));
  const currentLabel = variantLabel(variant, t('product.defaultVariant'));

  /*
   * onAddToCart/onBuyNow giờ là hàm async gọi API thật: phải CHỜ kết quả rồi mới báo "Đã thêm"
   * (trước đây giỏ local nên luôn thành công ngay). Lỗi (409 ngừng bán, 404...) hiện ngay dưới nút.
   */
  const runCartAction = async (action) => {
    setCartError('');
    try {
      return await action(qty, variant);
    } catch (err) {
      setCartError(t(cartErrorKey(err)));
      return false;
    }
  };

  const handleAdd = async () => {
    if (await runCartAction(onAddToCart)) {
      setAdded(true);
      setTimeout(() => setAdded(false), 1500);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h1 className="font-display text-3xl leading-tight md:text-4xl">{product.name}</h1>
        <p className="text-sm text-base-content/70">
          {t('product.suppliedBy')} <span className="font-medium text-base-content">{product.supplierName}</span>
        </p>
      </div>

      <p className="text-3xl font-semibold text-primary">{formatVnd(variant.price)}</p>

      {product.description && <p className="leading-relaxed text-base-content/75">{product.description}</p>}

      {/* Thuộc tính nhanh */}
      {product.materialName && (
        <div className="flex gap-3 text-sm">
          <span className="w-24 shrink-0 text-base-content/70">{t('product.material')}</span>
          <span className="font-medium">{product.materialName}</span>
        </div>
      )}

      {/* Chọn biến thể — chỉ hiện khi có >1 (khớp nghiệp vụ thật: nhiều SP chỉ có đúng 1 variant) */}
      {variants.length > 1 && (
        <ProductOptions
          label={t('product.variant')}
          options={labels}
          value={currentLabel}
          onChange={(label) => {
            const idx = labels.indexOf(label);
            if (idx !== -1) setVariantId(variants[idx].id);
          }}
        />
      )}

      <div className="flex items-center gap-3">
        <span className="text-sm text-base-content/70">{t('product.quantity')}</span>
        {/* Tối đa theo BE (999/lần thêm giỏ) — trước đây FE tự đặt cứng 20 */}
        <QuantitySelector value={qty} onChange={setQty} />
      </div>

      {/* CTA */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            onClick={handleAdd}
            disabled={cartPending || !hasVariants}
            className={`btn flex-1 gap-2 ${added ? 'btn-success' : 'btn-primary'}`}
          >
            {cartPending ? <span className="loading loading-spinner loading-sm" /> : <ShoppingCart width={18} height={18} />}
            {added ? t('product.added') : t('product.addToCart')}
          </button>
          <button onClick={() => runCartAction(onBuyNow)} disabled={cartPending || !hasVariants} className="btn btn-outline flex-1">
            {t('product.buyNow')}
          </button>
        </div>
        {cartError && <p role="alert" className="text-sm text-error">{cartError}</p>}
        <button onClick={onChat} className="btn btn-outline btn-primary gap-2">
          <MessageCircle width={18} height={18} /> {t('product.chatSupplier')}
        </button>
        {/* Hành động thêm do trang cha truyền vào (vd Yêu cầu báo giá số lượng lớn cho khách doanh nghiệp) */}
        {extraActions}
      </div>

      <ProductTrustCards />
    </div>
  );
}
