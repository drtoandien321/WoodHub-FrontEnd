import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProduct, useProducts } from '../hooks/useProducts.js';
import { useCartStore } from '../stores/cartStore.js';
import { useSupplierChatStore } from '../stores/supplierChatStore.js';
import ProductGallery from '../components/product/ProductGallery.jsx';
import ProductInfo from '../components/product/ProductInfo.jsx';
import RelatedProducts from '../components/product/RelatedProducts.jsx';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: product, isLoading, isError } = useProduct(id);
  // "Sản phẩm cùng loại": BE không trả sẵn `related` trong ProductResponse — tự lấy 1 trang cùng
  // categoryId rồi loại sản phẩm hiện tại (KHÔNG gọi thêm API riêng cho "related").
  const { data: relatedPage } = useProducts({ categoryId: product?.categoryId, size: 5 }, { enabled: !!product });
  const related = (relatedPage?.content ?? []).filter((p) => p.id !== id).slice(0, 4);

  const addItem = useCartStore((s) => s.addItem);
  const openChat = useSupplierChatStore((s) => s.openFromProduct);

  if (isLoading) {
    return (
      <div className="grid gap-8 md:grid-cols-2">
        <div className="skeleton aspect-[4/3] rounded-3xl" />
        <div className="flex flex-col gap-4">
          <div className="skeleton h-9 w-3/4 rounded-lg" />
          <div className="skeleton h-5 w-1/2 rounded-lg" />
          <div className="skeleton h-8 w-40 rounded-lg" />
          <div className="skeleton h-24 w-full rounded-lg" />
          <div className="skeleton h-12 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (isError || !product)
    return (
      <p className="text-error">
        {t('product.notFound')} <Link to="/shop" className="link">{t('product.backToShop')}</Link>
      </p>
    );

  // cartStore lưu 1 giá/sản phẩm theo productId (chưa tách theo variant) — dùng giá của variant
  // ĐANG CHỌN tại thời điểm thêm vào giỏ. Đủ đúng cho sản phẩm có đúng 1 variant (đa số trường
  // hợp thật hiện tại); sản phẩm nhiều variant giá khác nhau sẽ cần tách cart theo variantId ở
  // 1 sprint riêng (ngoài phạm vi FE-4 — không đụng cart/checkout để tránh vỡ luồng hiện có).
  const addToCart = (qty, variant) => addItem({ ...product, price: variant.price, image: product.images?.[0]?.url }, qty);
  const buyNow = (qty, variant) => { addToCart(qty, variant); navigate('/cart'); };

  return (
    <div className="flex flex-col gap-12">
      {/* Breadcrumb */}
      <nav className="flex flex-wrap items-center gap-1.5 text-sm text-base-content/55">
        <Link to="/" className="hover:text-primary">{t('suppliers.breadcrumbHome')}</Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-primary">{t('nav.shop')}</Link>
        <span>/</span>
        <span className="text-base-content/70">{product.supplierName}</span>
        <span>/</span>
        <span className="line-clamp-1 font-medium text-base-content/80">{product.name}</span>
      </nav>

      <div className="grid items-start gap-8 md:grid-cols-2 lg:gap-12">
        <ProductGallery images={(product.images ?? []).map((img) => img.url)} alt={product.name} />
        <ProductInfo
          product={product}
          onAddToCart={addToCart}
          onBuyNow={buyNow}
          // openFromProduct (chat) kỳ vọng shape cũ {image, price} — chiếu từ product.images[0]/variants[0]
          onChat={() => openChat({ ...product, image: product.images?.[0]?.url, price: product.variants?.[0]?.price })}
        />
      </div>

      <RelatedProducts products={related} />
    </div>
  );
}
