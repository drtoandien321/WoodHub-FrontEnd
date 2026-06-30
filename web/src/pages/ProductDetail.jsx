import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProduct } from '../hooks/useProducts.js';
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

  const outOfStock = product.status === 'out_of_stock' || product.stock === 0;
  // Badge ảnh: hết hàng (đỏ) hoặc rating cao → "Bán chạy" (gold). Heuristic mock, dễ thay bằng cờ BE.
  const badge = outOfStock
    ? { label: t('product.outOfStock'), tone: 'error' }
    : product.rating >= 4.8
      ? { label: t('product.bestseller'), tone: 'accent' }
      : null;

  const buyNow = (qty) => { addItem(product, qty); navigate('/cart'); };

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
        <ProductGallery images={product.gallery} alt={product.name} badge={badge} />
        <ProductInfo
          product={product}
          onAddToCart={(qty) => addItem(product, qty)}
          onBuyNow={buyNow}
          onChat={() => openChat(product)}
        />
      </div>

      <RelatedProducts products={product.related} />
    </div>
  );
}
