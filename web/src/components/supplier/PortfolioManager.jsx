import { useState } from 'react';
import ModalShell from '../admin/ModalShell.jsx';
import { Pencil } from '../suppliers/icons.jsx';
import { useMyPortfolio, useAddPortfolioItem, useUpdatePortfolioItem, useDeletePortfolioItem } from '../../hooks/usePortfolio.js';
import { useMyProducts } from '../../hooks/useMyProducts.js';
import ImageUploadField from './ImageUploadField.jsx';

/*
 * Quản lý portfolio (ảnh công trình/sản phẩm tiêu biểu) — GET/POST/PUT/DELETE /suppliers/me/portfolio.
 * Hiện ra ở hồ sơ công khai /suppliers/:slug (GET /suppliers/{id}/portfolio).
 *
 * Nguồn ảnh (BE nhận `imageUrl` dạng chuỗi), 3 cách:
 *   - Tải ảnh từ máy: POST /uploads/image?purpose=portfolio (BE-10) → điền url trả về vào imageUrl.
 *   - NCC có catalog (allowProducts): gắn 1 sản phẩm của mình → bỏ trống URL thì BE tự lấy ảnh SP.
 *   - Dán link ảnh có sẵn.
 */
export default function PortfolioManager({ allowProducts = false }) {
  const { data: items = [], isLoading, isError } = useMyPortfolio();
  const [editing, setEditing] = useState(null); // null = đóng modal · {} = thêm mới · item = sửa

  return (
    <section className="rounded-2xl border border-base-300 bg-base-100 p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-lg">Portfolio</h2>
          <p className="text-xs text-base-content/70">Ảnh hiển thị ở hồ sơ công khai để khách tham khảo.</p>
        </div>
        <button onClick={() => setEditing({})} className="btn btn-primary btn-sm">+ Thêm ảnh</button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skeleton aspect-[4/3] rounded-2xl" />)}
        </div>
      ) : isError ? (
        <p className="rounded-xl bg-error/10 p-4 text-sm text-error">Không tải được portfolio.</p>
      ) : !items.length ? (
        <p className="rounded-xl border border-dashed border-base-300 p-8 text-center text-sm text-base-content/70">
          Chưa có ảnh nào. Thêm vài công trình tiêu biểu để khách tin tưởng hơn.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {items.map((it) => (
            <figure key={it.id} className="group relative overflow-hidden rounded-2xl border border-base-300">
              <img src={it.imageUrl} alt={it.title || ''} loading="lazy" className="aspect-[4/3] w-full object-cover" />
              <figcaption className="p-2.5">
                <p className="truncate text-sm font-medium">{it.title || it.productName || 'Không có tiêu đề'}</p>
                {it.productName && <p className="truncate text-xs text-base-content/70">SP: {it.productName}</p>}
              </figcaption>
              <button
                onClick={() => setEditing(it)}
                className="btn btn-circle btn-sm absolute right-2 top-2 bg-base-100/90 opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                aria-label="Sửa ảnh"
              >
                <Pencil width={14} height={14} />
              </button>
            </figure>
          ))}
        </div>
      )}

      {editing && <PortfolioItemModal item={editing} allowProducts={allowProducts} nextOrder={items.length} onClose={() => setEditing(null)} />}
    </section>
  );
}

function PortfolioItemModal({ item, allowProducts, nextOrder, onClose }) {
  const isNew = !item.id;
  const [form, setForm] = useState({
    title: item.title ?? '', description: item.description ?? '', imageUrl: item.imageUrl ?? '',
    productId: item.productId ?? '', sortOrder: item.sortOrder ?? nextOrder,
  });
  const [error, setError] = useState('');
  const add = useAddPortfolioItem();
  const update = useUpdatePortfolioItem();
  const remove = useDeletePortfolioItem();
  const products = useMyProducts({ size: 100 }, { enabled: allowProducts });
  const busy = add.isPending || update.isPending || remove.isPending;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const fail = (err) => setError(err?.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.');

  const handleSave = () => {
    setError('');
    const imageUrl = form.imageUrl.trim();
    if (!imageUrl && !form.productId) return setError(allowProducts ? 'Nhập link ảnh hoặc chọn 1 sản phẩm.' : 'Nhập link ảnh.');
    if (imageUrl && !/^https?:\/\//i.test(imageUrl)) return setError('Link ảnh phải bắt đầu bằng http:// hoặc https://');
    const body = {
      title: form.title.trim() || null, description: form.description.trim() || null,
      imageUrl: imageUrl || null, productId: form.productId || null, sortOrder: Number(form.sortOrder) || 0,
    };
    const opts = { onSuccess: onClose, onError: fail };
    if (isNew) add.mutate(body, opts);
    else update.mutate({ id: item.id, ...body }, opts);
  };

  const handleDelete = () => {
    if (!window.confirm('Xoá ảnh này khỏi portfolio?')) return;
    remove.mutate(item.id, { onSuccess: onClose, onError: fail });
  };

  const previewUrl = form.imageUrl.trim();

  return (
    <ModalShell
      open
      onClose={busy ? undefined : onClose}
      title={isNew ? 'Thêm ảnh portfolio' : 'Sửa ảnh portfolio'}
      footer={
        <>
          {!isNew && <button onClick={handleDelete} disabled={busy} className="btn btn-ghost mr-auto text-error">Xoá</button>}
          <button onClick={onClose} disabled={busy} className="btn btn-ghost">Hủy</button>
          <button onClick={handleSave} disabled={busy} className="btn btn-primary">
            {add.isPending || update.isPending ? <span className="loading loading-spinner loading-sm" /> : 'Lưu'}
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <ImageUploadField
          label="Ảnh"
          purpose="portfolio"
          shape="wide"
          value={/^https?:\/\//i.test(previewUrl) ? previewUrl : ''}
          onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
        />
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-base-content/70">Hoặc dán link ảnh</span>
          <input value={form.imageUrl} onChange={set('imageUrl')} placeholder="https://…" className="input input-bordered w-full" />
        </label>

        {allowProducts && (
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-base-content/70">Gắn sản phẩm (tuỳ chọn)</span>
            <select value={form.productId} onChange={set('productId')} className="select select-bordered w-full">
              <option value="">— Không gắn —</option>
              {(products.data?.content ?? []).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <span className="text-xs text-base-content/70">Bỏ trống link ảnh thì hệ thống tự lấy ảnh của sản phẩm.</span>
          </label>
        )}

        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-base-content/70">Tiêu đề</span>
          <input value={form.title} onChange={set('title')} maxLength={255} placeholder="VD: Tủ bếp gỗ sồi — căn hộ Quận 7" className="input input-bordered w-full" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-base-content/70">Mô tả</span>
          <textarea value={form.description} onChange={set('description')} rows={3} className="textarea textarea-bordered w-full" />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-base-content/70">Thứ tự hiển thị</span>
          <input type="number" min={0} value={form.sortOrder} onChange={set('sortOrder')} className="input input-bordered w-32" />
        </label>
        {error && <p className="text-sm text-error" role="alert">{error}</p>}
      </div>
    </ModalShell>
  );
}
