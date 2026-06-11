import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProduct } from '../hooks/useProducts.js';
import { useCartStore } from '../stores/cartStore.js';
import { formatVnd } from '../utils/format.js';
import ProductCard from '../components/ui/ProductCard.jsx';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: product, isLoading, isError } = useProduct(id);
  const addItem = useCartStore((s) => s.addItem);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (isLoading) return <div className="skeleton h-96 rounded-2xl" />;
  if (isError || !product) return <p className="text-error">Không tìm thấy sản phẩm. <Link to="/shop" className="link">Quay lại cửa hàng</Link></p>;

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
          <p className="text-sm text-base-content/60">Cung cấp bởi <span className="font-medium">{product.supplierName}</span> · ★ {product.rating}</p>
          <p className="text-2xl font-semibold text-primary">{formatVnd(product.price)}</p>
          <p className="text-base-content/80">{product.description}</p>

          <table className="table table-sm max-w-xs">
            <tbody>
              <tr><td className="text-base-content/60">Chất liệu</td><td>{product.material}</td></tr>
              <tr><td className="text-base-content/60">Tồn kho</td><td>{product.stock} sản phẩm</td></tr>
            </tbody>
          </table>

          <div className="flex items-center gap-3 mt-2">
            <input type="number" min={1} max={product.stock} value={qty} onChange={(e) => setQty(Math.max(1, Number(e.target.value)))} className="input input-bordered w-20" />
            <button onClick={handleAdd} className={`btn ${added ? 'btn-success' : 'btn-primary'}`}>
              {added ? 'Đã thêm ✓' : 'Thêm vào giỏ'}
            </button>
            <button onClick={() => { addItem(product, qty); navigate('/cart'); }} className="btn btn-outline">Mua ngay</button>
          </div>

          {product.hasModel3d && (
            <Link to="/custom" className="btn btn-accent btn-outline btn-sm self-start mt-2">
              🪄 Tùy biến mẫu này trong Configurator 3D
            </Link>
          )}
        </div>
      </div>

      {product.related?.length > 0 && (
        <section>
          <h2 className="font-display text-2xl mb-4">Sản phẩm cùng loại</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {product.related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}
