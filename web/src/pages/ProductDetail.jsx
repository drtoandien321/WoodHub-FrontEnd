import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useProduct } from '../hooks/useProducts.js';
import { useCartStore } from '../stores/cartStore.js';
import { formatVnd } from '../utils/format.js';
import ProductCard from '../components/ui/ProductCard.jsx';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data: product, isLoading, isError } = useProduct(id);
  const addItem = useCartStore((s) => s.addItem);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (isLoading) return <div className="skeleton h-96 rounded-2xl" />;
  if (isError || !product)
    return (
      <p className="text-error">
        {t('product.notFound')} <Link to="/shop" className="link">{t('product.backToShop')}</Link>
      </p>
    );

  const outOfStock = product.status === 'out_of_stock' || product.stock === 0;

  const handleAdd = () => {
    addItem(product, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="flex flex-col gap-12">
      <div className="grid md:grid-cols-2 gap-8">
        <figure className="rounded-2xl overflow-hidden bg-base-200 aspect-[4/3]">
          <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
        </figure>

        <div className="flex flex-col gap-4">
          <h1 className="font-display text-3xl">{product.name}</h1>
          <p className="text-sm text-base-content/60">
            {t('product.suppliedBy')} <span className="font-medium">{product.supplierName}</span>
            {product.rating > 0 && <> · ★ {product.rating}</>}
          </p>
          <p className="text-2xl font-semibold text-primary">{formatVnd(product.price)}</p>
          <p className="text-base-content/80">{product.description}</p>

          <table className="table table-sm max-w-xs">
            <tbody>
              <tr><td className="text-base-content/60">{t('product.material')}</td><td>{product.materialName}</td></tr>
              <tr>
                <td className="text-base-content/60">{t('product.stock')}</td>
                <td>{outOfStock ? <span className="text-error">{t('product.outOfStock')}</span> : `${product.stock} ${t('product.unit')}`}</td>
              </tr>
            </tbody>
          </table>

          {outOfStock ? (
            <button className="btn btn-disabled self-start mt-2">{t('product.outOfStock')}</button>
          ) : (
            <div className="flex items-center gap-3 mt-2">
              <input type="number" min={1} max={product.stock} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(product.stock, Number(e.target.value))))} className="input input-bordered w-20" />
              <button onClick={handleAdd} className={`btn ${added ? 'btn-success' : 'btn-primary'}`}>
                {added ? t('product.added') : t('product.addToCart')}
              </button>
              <button onClick={() => { addItem(product, qty); navigate('/cart'); }} className="btn btn-outline">{t('product.buyNow')}</button>
            </div>
          )}

          {product.hasModel3d && (
            <Link to="/custom" className="btn btn-accent btn-outline btn-sm self-start mt-2">
              {t('product.customize')}
            </Link>
          )}
        </div>
      </div>

      {product.related?.length > 0 && (
        <section>
          <h2 className="font-display text-2xl mb-4">{t('product.related')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {product.related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
