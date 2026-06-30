import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { formatVnd } from '../../utils/format.js';
import { findMProduct } from '../../api/mock/manufacturerData.js';
import { productMeta } from '../../utils/supplierStatus.js';
import ProductGallery from '../../components/product/ProductGallery.jsx';
import ProductFormModal from '../../components/supplier/ProductFormModal.jsx';
import StatusBadge from '../../components/supplier/StatusBadge.jsx';
import {
  ChevronLeft, Pencil, EyeOff, Trash, Store, Tree, Ruler, Package, Info, Eye,
  ShoppingBag, Wallet,
} from '../../components/suppliers/icons.jsx';

export default function SupplierProductDetail() {
  const { productId } = useParams();
  const p = findMProduct(productId);
  const [modal, setModal] = useState(false);

  if (!p) {
    return (
      <div className="rounded-2xl border border-dashed border-base-300 bg-base-100 py-20 text-center">
        <p className="font-display text-xl">Không tìm thấy sản phẩm</p>
        <Link to="/portal/supplier/products" className="btn btn-primary mt-4">Về danh sách sản phẩm</Link>
      </div>
    );
  }

  const gallery = [p.image, ...Array.from({ length: 4 }, (_, i) => `https://picsum.photos/seed/${p.id}-${i + 1}/800/600`)];
  const info = [
    { icon: Store, label: 'Chi nhánh bán', value: p.branch },
    { icon: Tree, label: 'Chất liệu', value: p.material },
    { icon: Ruler, label: 'Kích thước', value: p.size },
    { icon: Package, label: 'Tồn kho', value: `${p.stock} sản phẩm` },
    { icon: Info, label: 'Trạng thái', value: <StatusBadge meta={productMeta(p.status)} /> },
    { icon: Eye, label: 'Lượt xem', value: `${p.views.toLocaleString('vi-VN')} lượt` },
  ];
  const perf = [
    { icon: Eye, label: 'Lượt xem', value: p.views.toLocaleString('vi-VN'), delta: 12.5 },
    { icon: ShoppingBag, label: 'Lượt thêm vào giỏ', value: p.addToCart, delta: 8.1 },
    { icon: Package, label: 'Đơn hàng', value: p.orders, delta: 16.7 },
    { icon: Wallet, label: 'Doanh thu', value: formatVnd(p.revenue), delta: 18.3 },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <nav className="flex items-center gap-1.5 text-sm text-base-content/55">
          <Link to="/portal/supplier/products" className="hover:text-primary">Sản phẩm</Link>
          <span>/</span><span className="font-medium text-base-content/80">Chi tiết sản phẩm</span>
        </nav>
        <Link to="/portal/supplier/products" className="btn btn-ghost btn-sm gap-1"><ChevronLeft width={16} height={16} /> Quay lại danh sách</Link>
      </div>
      <header>
        <h1 className="font-display text-3xl">Chi tiết sản phẩm</h1>
        <p className="mt-1 text-base-content/60">Xem thông tin chi tiết và hiệu suất của sản phẩm.</p>
      </header>

      {/* Gallery + info */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-base-300 bg-base-100 p-4 shadow-sm">
          <ProductGallery images={gallery} alt={p.nameVi} />
        </section>

        <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <div className="mb-2 flex items-center justify-between">
            <StatusBadge meta={productMeta(p.status)} />
            <span className="text-xs text-base-content/50">Sản phẩm tiêu chuẩn</span>
          </div>
          <h2 className="font-display text-2xl">{p.nameVi}</h2>
          <p className="mt-1 text-2xl font-semibold text-primary">{formatVnd(p.price)}</p>
          <p className="mt-1 text-sm text-base-content/55">Mã sản phẩm: #{p.id} · SKU: {p.sku}</p>

          <div className="mt-3 flex flex-wrap gap-2">
            {p.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-base-300 bg-base-200/60 px-3 py-1 text-xs text-base-content/75">{tag}</span>
            ))}
          </div>

          <dl className="mt-4 flex flex-col divide-y divide-base-200">
            {info.map((r) => (
              <div key={r.label} className="flex items-center justify-between gap-3 py-2.5">
                <dt className="flex items-center gap-2 text-sm text-base-content/55"><r.icon width={15} height={15} className="text-base-content/40" />{r.label}</dt>
                <dd className="text-right text-sm font-medium">{r.value}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-4 text-sm leading-relaxed text-base-content/75">{p.description}</p>

          <div className="mt-5 flex flex-wrap gap-2">
            <button onClick={() => setModal(true)} className="btn btn-outline gap-2"><Pencil width={16} height={16} /> Chỉnh sửa</button>
            <button className="btn btn-outline gap-2"><EyeOff width={16} height={16} /> Ẩn sản phẩm</button>
            <button className="btn btn-outline btn-error gap-2"><Trash width={16} height={16} /> Xóa sản phẩm</button>
          </div>
        </section>
      </div>

      {/* Thông số + Hiệu suất */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_1.6fr]">
        <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <h2 className="mb-3 font-display text-lg">Thông số sản phẩm</h2>
          <dl className="flex flex-col gap-2.5 text-sm">
            <Spec label="Danh mục" value={p.category} />
            <Spec label="Chất liệu" value={p.material} />
            <Spec label="Màu sắc" value={p.color} />
            <Spec label="Kích thước" value={p.size} />
          </dl>
        </section>

        <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg">Hiệu suất sản phẩm <span className="text-sm font-normal text-base-content/50">(7 ngày qua)</span></h2>
            <select className="select select-bordered select-sm w-32" defaultValue="7d" aria-label="Khoảng thời gian">
              <option value="7d">7 ngày qua</option><option value="30d">30 ngày</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {perf.map((m) => (
              <div key={m.label} className="rounded-2xl border border-base-300 bg-base-200/40 p-3">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary"><m.icon width={16} height={16} /></span>
                <p className="mt-2 text-base font-semibold leading-none">{m.value}</p>
                <p className="mt-1 text-xs text-base-content/55">{m.label}</p>
                <p className="mt-1 text-xs font-medium text-success">↑ {m.delta}%</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <ProductFormModal open={modal} onClose={() => setModal(false)} initial={p} />
    </div>
  );
}

function Spec({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-base-content/55">{label}</dt><dd className="font-medium">{value}</dd>
    </div>
  );
}
