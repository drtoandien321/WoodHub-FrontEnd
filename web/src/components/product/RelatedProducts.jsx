import { useTranslation } from 'react-i18next';
import ProductCard from '../ui/ProductCard.jsx';

/*
 * RelatedProducts — "Sản phẩm cùng loại". Reuse ProductCard sẵn có để đồng bộ với Shop/Supplier.
 * Desktop 4 cột · tablet 2 cột · mobile 2 cột (gọn, không cần carousel riêng).
 */
export default function RelatedProducts({ products = [] }) {
  const { t } = useTranslation();
  if (!products.length) return null;

  return (
    <section>
      <h2 className="mb-4 font-display text-2xl">{t('product.related')}</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}
