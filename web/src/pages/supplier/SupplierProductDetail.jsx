import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { formatVnd } from '../../utils/format.js';
import { useMyProductDetail, useDeleteProduct } from '../../hooks/useMyProducts.js';
import ProductGallery from '../../components/product/ProductGallery.jsx';
import ProductFormModal from '../../components/supplier/ProductFormModal.jsx';
import ProductStatusSelect from '../../components/supplier/ProductStatusSelect.jsx';
import { ChevronLeft, Pencil, Trash, Tree, Info } from '../../components/suppliers/icons.jsx';

export default function SupplierProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { data: p, isLoading, isError } = useMyProductDetail(productId);
  const deleteProduct = useDeleteProduct();
  const [modal, setModal] = useState(false);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="skeleton h-96 rounded-2xl" />
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    );
  }

  if (isError || !p) {
    return (
      <div className="rounded-2xl border border-dashed border-base-300 bg-base-100 py-20 text-center">
        <p className="font-display text-xl">Không tìm thấy sản phẩm</p>
        <Link to="/portal/supplier/products" className="btn btn-primary mt-4">Về danh sách sản phẩm</Link>
      </div>
    );
  }

  const priceFrom = p.variants?.length ? Math.min(...p.variants.map((v) => v.price)) : null;
  const priceTo = p.variants?.length ? Math.max(...p.variants.map((v) => v.price)) : null;
  const gallery = p.images?.map((i) => i.url) ?? [];

  const handleDelete = () => {
    if (window.confirm(`Xoá "${p.name}"? Hành động này không thể hoàn tác.`)) {
      deleteProduct.mutate(p.id, { onSuccess: () => navigate('/portal/supplier/products') });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <nav className="flex items-center gap-1.5 text-sm text-base-content/70">
          <Link to="/portal/supplier/products" className="hover:text-primary">Sản phẩm</Link>
          <span>/</span><span className="font-medium text-base-content/80">Chi tiết sản phẩm</span>
        </nav>
        <Link to="/portal/supplier/products" className="btn btn-ghost btn-sm gap-1"><ChevronLeft width={16} height={16} /> Quay lại danh sách</Link>
      </div>
      <header>
        <h1 className="font-display text-3xl">Chi tiết sản phẩm</h1>
        <p className="mt-1 text-base-content/70">Xem, sửa thông tin và đổi trạng thái bán của sản phẩm.</p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
          {gallery.length
            ? <ProductGallery images={gallery} alt={p.name} />
            : <div className="grid aspect-[4/3] place-items-center rounded-2xl bg-base-200 text-sm text-base-content/70">Chưa có ảnh sản phẩm</div>}
        </section>

        <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <h2 className="font-display text-2xl">{p.name}</h2>
          <p className="mt-1 text-2xl font-semibold text-primary">
            {priceFrom == null ? '—' : priceFrom === priceTo ? formatVnd(priceFrom) : `${formatVnd(priceFrom)} – ${formatVnd(priceTo)}`}
          </p>
          <p className="mt-1 text-sm text-base-content/70">Mã sản phẩm: #{p.id}</p>

          <dl className="mt-4 flex flex-col divide-y divide-base-200">
            <div className="flex items-center justify-between gap-3 py-2.5">
              <dt className="flex items-center gap-2 text-sm text-base-content/70"><Info width={15} height={15} className="text-base-content/70" />Danh mục</dt>
              <dd className="text-right text-sm font-medium">{p.categoryName}</dd>
            </div>
            <div className="flex items-center justify-between gap-3 py-2.5">
              <dt className="flex items-center gap-2 text-sm text-base-content/70"><Tree width={15} height={15} className="text-base-content/70" />Chất liệu</dt>
              <dd className="text-right text-sm font-medium">{p.materialName ?? '—'}</dd>
            </div>
          </dl>

          {p.description && <p className="mt-4 text-sm leading-relaxed text-base-content/75">{p.description}</p>}

          <div className="mt-5 flex flex-col gap-1.5">
            <span className="text-sm font-medium text-base-content/70">Trạng thái bán</span>
            <ProductStatusSelect product={p} size="md" />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            <button onClick={() => setModal(true)} className="btn btn-outline gap-2"><Pencil width={16} height={16} /> Chỉnh sửa</button>
            <button onClick={handleDelete} disabled={deleteProduct.isPending} className="btn btn-outline btn-error gap-2"><Trash width={16} height={16} /> Xóa sản phẩm</button>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
        <h2 className="mb-3 font-display text-lg">Biến thể ({p.variants?.length ?? 0})</h2>
        <div className="overflow-x-auto">
          <table className="table table-sm">
            <thead><tr className="text-base-content/70"><th>SKU</th><th>Màu</th><th>Kích thước</th><th className="text-right">Giá</th></tr></thead>
            <tbody>
              {(p.variants ?? []).map((v) => (
                <tr key={v.id}>
                  <td>{v.sku || '—'}</td><td>{v.color || '—'}</td><td>{v.dimensions || '—'}</td>
                  <td className="text-right font-medium">{formatVnd(v.price)}</td>
                </tr>
              ))}
              {!p.variants?.length && <tr><td colSpan={4} className="py-6 text-center text-base-content/70">Chưa có biến thể nào.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>

      <ProductFormModal open={modal} onClose={() => setModal(false)} initial={p} />
    </div>
  );
}
