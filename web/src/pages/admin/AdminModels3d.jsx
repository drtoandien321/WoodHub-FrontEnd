import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useAdminModels3d, useCreateAdminModel3d, useUpdateAdminModel3d, useSetAdminModel3dStatus, useDeleteAdminModel3d,
  useLinkProductModel3d, useUnlinkProductModel3d,
} from '../../hooks/useModels3d.js';
import { useProducts } from '../../hooks/useProducts.js';
import { apiErrorMessage } from '../../utils/apiError.js';
import ModalShell from '../../components/admin/ModalShell.jsx';
import { PRODUCT_TYPES, productTypeLabel } from '../../utils/productTypes.js';
import Pagination from '../../components/ui/Pagination.jsx';

const PAGE_SIZE = 24;
// productType hợp lệ của BE — dùng chung utils/productTypes.js (cùng bộ với bộ lọc thư viện + Custom Studio)
const typeLabel = productTypeLabel;
const MB = 1024 * 1024;

/*
 * editableOptions ↔ textarea: mỗi dòng "key: giá trị 1, giá trị 2" (vd "color: oak, walnut"). Khách chỉ được chọn giá trị
 * trong các danh sách này khi tuỳ chỉnh thiết kế. BE tự bỏ khoảng trắng thừa + trùng; mỗi key tối đa 50 giá trị.
 */
const optionsToText = (o) => Object.entries(o ?? {}).map(([k, v]) => `${k}: ${(v ?? []).join(', ')}`).join('\n');
const textToOptions = (text) => Object.fromEntries(
  text.split('\n').map((line) => line.split(':')).filter(([k, v]) => k?.trim() && v?.trim())
    .map(([k, v]) => [k.trim(), v.split(',').map((x) => x.trim()).filter(Boolean)])
);

/*
 * AdminModels3d — thư viện mẫu 3D (BE-04): lọc trạng thái / loại / tên, tạo mẫu (upload GLB + poster + USDZ tuỳ chọn,
 * có thanh tiến độ), sửa thông tin, Ẩn / Hiện, Xoá (409 khi đã có thiết kế / biến thể dùng → gợi ý Ẩn).
 * Gắn mẫu cho SẢN PHẨM (admin-product-model3d-fe.md): mỗi SP 1 mẫu, mỗi mẫu 1 SP — khách thấy nút "Xem 3D / AR"
 * và badge 3D; bộ lọc has3d ở cửa hàng chạy theo dữ liệu này.
 */
export default function AdminModels3d() {
  const [status, setStatus] = useState('');
  const [productType, setProductType] = useState('');
  const [keyword, setKeyword] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [modal, setModal] = useState(null); // { kind: 'create' } | { kind: 'edit', model } | { kind: 'link', model }
  const { data, isLoading, isError, refetch } = useAdminModels3d({ status: status || undefined, productType: productType || undefined, keyword: query || undefined, page, size: PAGE_SIZE });
  const items = data?.content ?? [];
  const pageInfo = data?.page ?? { number: 0, totalPages: 1, totalElements: 0 };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Mẫu 3D</h1>
          <p className="mt-1 text-base-content/70">Thư viện mẫu cho Custom Studio và nút Xem 3D / AR ở trang sản phẩm.</p>
        </div>
        <button onClick={() => setModal({ kind: 'create' })} className="btn btn-primary">+ Thêm mẫu 3D</button>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(0); }} className="select select-bordered select-sm" aria-label="Trạng thái">
          <option value="">Mọi trạng thái</option><option value="active">Đang hiện</option><option value="hidden">Đã ẩn</option>
        </select>
        <select value={productType} onChange={(e) => { setProductType(e.target.value); setPage(0); }} className="select select-bordered select-sm" aria-label="Loại">
          <option value="">Mọi loại</option>
          {PRODUCT_TYPES.map((p) => <option key={p.id} value={p.id}>{productTypeLabel(p.id)}</option>)}
        </select>
        <form onSubmit={(e) => { e.preventDefault(); setQuery(keyword.trim()); setPage(0); }} className="flex gap-2">
          <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Tìm theo tên…" className="input input-bordered input-sm" />
          <button className="btn btn-outline btn-sm">Tìm</button>
        </form>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <div key={i} className="skeleton aspect-square rounded-2xl" />)}</div>
      ) : isError ? (
        <p className="text-center text-error">Không tải được mẫu 3D. <button onClick={() => refetch()} className="link">Thử lại</button></p>
      ) : !items.length ? (
        <p className="rounded-2xl border border-dashed border-base-300 bg-base-100 py-12 text-center text-base-content/70">Chưa có mẫu nào.</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((m) => <ModelCard key={m.id} model={m} onEdit={() => setModal({ kind: 'edit', model: m })} onLink={() => setModal({ kind: 'link', model: m })} />)}
        </div>
      )}

      <Pagination pageInfo={pageInfo} onChange={setPage} unit="mẫu" />

      {modal?.kind === 'create' && <ModelFormModal onClose={() => setModal(null)} />}
      {modal?.kind === 'edit' && <ModelFormModal model={modal.model} onClose={() => setModal(null)} />}
      {modal?.kind === 'link' && <LinkProductModal model={modal.model} onClose={() => setModal(null)} />}
    </div>
  );
}

function ModelCard({ model: m, onEdit, onLink }) {
  const setStatus = useSetAdminModel3dStatus();
  const del = useDeleteAdminModel3d();
  const unlink = useUnlinkProductModel3d();
  const [err, setErr] = useState('');
  const hidden = m.status === 'hidden';

  const remove = () => {
    if (!window.confirm(`Xoá vĩnh viễn mẫu "${m.name}" (cả file GLB / poster)? Nếu đã có thiết kế dùng mẫu này, hãy Ẩn thay vì xoá.`)) return;
    setErr('');
    del.mutate(m.id, { onError: (e) => setErr(e?.response?.status === 409 ? 'Mẫu đang được dùng trong thiết kế của khách hoặc đã có biến thể chất liệu — hãy Ẩn mẫu thay vì xoá.' : apiErrorMessage(e, 'Xoá chưa được.')) });
  };

  return (
    <article className={`flex flex-col overflow-hidden rounded-2xl border bg-base-100 shadow-sm ${hidden ? 'border-dashed border-base-300 opacity-75' : 'border-base-300'}`}>
      <div className="aspect-[4/3] bg-base-200">{m.posterUrl && <img src={m.posterUrl} alt="" loading="lazy" className="h-full w-full object-cover" />}</div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="font-medium leading-snug">{m.name}</p>
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${hidden ? 'bg-base-300/60 text-base-content/70' : 'bg-success/15 text-success'}`}>{hidden ? 'Đã ẩn' : 'Đang hiện'}</span>
        </div>
        <p className="text-xs text-base-content/70">{typeLabel(m.productType)}{m.modelUsdzUrl ? ' · có USDZ (AR iOS)' : ''}</p>
        {Object.keys(m.editableOptions ?? {}).length > 0 && <p className="text-xs text-base-content/70">Tuỳ chọn: {Object.keys(m.editableOptions).join(', ')}</p>}
        <p className="text-xs">
          {m.productId
            ? <>Đang gắn cho <Link to={`/product/${m.productId}`} className="link link-primary">sản phẩm</Link> · <button type="button" onClick={() => unlink.mutate(m.productId, { onError: (e) => setErr(apiErrorMessage(e, 'Gỡ chưa được.')) })} disabled={unlink.isPending} className="link text-error">Gỡ</button></>
            : <span className="text-base-content/70">Chưa gắn sản phẩm</span>}
        </p>
        {err && <p className="text-xs text-error">{err}</p>}
        <div className="mt-auto flex flex-wrap gap-1 pt-2">
          <button onClick={onEdit} className="btn btn-outline btn-xs">Sửa</button>
          {!m.productId && !hidden && <button onClick={onLink} className="btn btn-outline btn-xs">Gắn sản phẩm</button>}
          <button onClick={() => setStatus.mutate({ id: m.id, status: hidden ? 'active' : 'hidden' }, { onError: (e) => setErr(apiErrorMessage(e, 'Đổi trạng thái chưa được.')) })} disabled={setStatus.isPending} className="btn btn-ghost btn-xs">{hidden ? 'Hiện lại' : 'Ẩn'}</button>
          {m.modelGlbUrl && <a href={m.modelGlbUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-xs">GLB</a>}
          <button onClick={remove} disabled={del.isPending} className="btn btn-ghost btn-xs ml-auto text-error">Xoá</button>
        </div>
      </div>
    </article>
  );
}

// Tạo (có file) hoặc sửa thông tin (không đổi file — muốn đổi file: tạo mẫu mới rồi ẩn mẫu cũ)
function ModelFormModal({ model, onClose }) {
  const isEdit = !!model;
  const create = useCreateAdminModel3d();
  const update = useUpdateAdminModel3d();
  const [name, setName] = useState(model?.name ?? '');
  const [productType, setProductType] = useState(model?.productType ?? 'chair');
  const [description, setDescription] = useState(model?.description ?? '');
  const [options, setOptions] = useState(optionsToText(model?.editableOptions));
  const [files, setFiles] = useState({ glb: null, poster: null, usdz: null });
  const [progress, setProgress] = useState(0);
  const [err, setErr] = useState('');
  const pending = create.isPending || update.isPending;

  const pick = (k) => (e) => setFiles((f) => ({ ...f, [k]: e.target.files?.[0] ?? null }));

  const submit = () => {
    setErr('');
    if (!name.trim()) { setErr('Nhập tên mẫu.'); return; }
    const data = { name: name.trim(), productType, description: description.trim() || undefined, editableOptions: textToOptions(options) };
    if (isEdit) {
      update.mutate({ id: model.id, ...data }, { onSuccess: onClose, onError: (e) => setErr(apiErrorMessage(e, 'Lưu chưa được.')) });
      return;
    }
    if (!files.glb || !files.poster) { setErr('Cần file GLB và ảnh poster.'); return; }
    if (!files.glb.name.toLowerCase().endsWith('.glb')) { setErr('File mô hình phải là .glb'); return; }
    if (files.glb.size > 50 * MB || (files.usdz && files.usdz.size > 50 * MB)) { setErr('File GLB / USDZ tối đa 50MB.'); return; }
    if (files.poster.size > 10 * MB) { setErr('Ảnh poster tối đa 10MB.'); return; }
    setProgress(0);
    create.mutate({ data, ...files, onProgress: setProgress }, { onSuccess: onClose, onError: (e) => setErr(apiErrorMessage(e, e?.response?.status === 413 ? 'File quá dung lượng cho phép.' : 'Tải mẫu lên chưa được, vui lòng thử lại.')) });
  };

  return (
    <ModalShell
      open
      onClose={() => !pending && onClose()}
      title={isEdit ? 'Sửa mẫu 3D' : 'Thêm mẫu 3D'}
      maxWidth="max-w-xl"
      footer={(
        <>
          <button onClick={onClose} disabled={pending} className="btn btn-ghost">Huỷ</button>
          <button onClick={submit} disabled={pending} className="btn btn-primary">{pending ? <span className="loading loading-spinner loading-sm" /> : isEdit ? 'Lưu' : 'Tải lên'}</button>
        </>
      )}
    >
      <div className="flex flex-col gap-3 text-sm">
        <label className="flex flex-col gap-1.5"><span className="text-base-content/70">Tên mẫu *</span><input value={name} onChange={(e) => setName(e.target.value.slice(0, 255))} className="input input-bordered w-full" /></label>
        <label className="flex flex-col gap-1.5"><span className="text-base-content/70">Loại *</span>
          <select value={productType} onChange={(e) => setProductType(e.target.value)} className="select select-bordered w-full">{PRODUCT_TYPES.map((p) => <option key={p.id} value={p.id}>{productTypeLabel(p.id)}</option>)}</select>
        </label>
        <label className="flex flex-col gap-1.5"><span className="text-base-content/70">Mô tả</span><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="textarea textarea-bordered w-full" /></label>
        <label className="flex flex-col gap-1.5">
          <span className="text-base-content/70">Tuỳ chọn khách được chỉnh (mỗi dòng "tên: giá trị, giá trị")</span>
          <textarea value={options} onChange={(e) => setOptions(e.target.value)} rows={3} placeholder={'color: oak, walnut, cherry\nmaterial: wood'} className="textarea textarea-bordered w-full font-mono text-xs" />
        </label>
        {isEdit ? (
          <p className="text-xs text-base-content/70">Không đổi được file của mẫu đã tạo. Muốn thay mô hình: tạo mẫu mới rồi ẩn mẫu này.</p>
        ) : (
          <>
            <label className="flex flex-col gap-1"><span className="text-base-content/70">File mô hình .glb * (≤ 50MB)</span><input type="file" accept=".glb,model/gltf-binary" onChange={pick('glb')} className="file-input file-input-bordered file-input-sm w-full" /></label>
            <label className="flex flex-col gap-1"><span className="text-base-content/70">Ảnh poster * (JPEG/PNG/WEBP ≤ 10MB — ảnh thẻ trong thư viện)</span><input type="file" accept="image/jpeg,image/png,image/webp" onChange={pick('poster')} className="file-input file-input-bordered file-input-sm w-full" /></label>
            <label className="flex flex-col gap-1"><span className="text-base-content/70">File .usdz cho AR trên iPhone (tuỳ chọn, ≤ 50MB)</span><input type="file" accept=".usdz" onChange={pick('usdz')} className="file-input file-input-bordered file-input-sm w-full" /></label>
            {create.isPending && <progress className="progress progress-primary w-full" value={progress} max="100" aria-label="Tiến độ tải lên" />}
          </>
        )}
        {err && <p className="text-error">{err}</p>}
      </div>
    </ModalShell>
  );
}

// Chọn sản phẩm để gắn mẫu (mỗi SP 1 mẫu — gắn mẫu mới thì mẫu cũ của SP đó tự được gỡ)
function LinkProductModal({ model, onClose }) {
  const [keyword, setKeyword] = useState('');
  const products = useProducts({ keyword: keyword.trim() || undefined, size: 50 });
  const link = useLinkProductModel3d();
  const [err, setErr] = useState('');
  const list = products.data?.content ?? [];

  const choose = (p) => {
    setErr('');
    link.mutate({ productId: p.id, model3dId: model.id }, {
      onSuccess: onClose,
      onError: (e) => setErr(e?.response?.data?.errorCode === 'MODEL_ALREADY_LINKED' ? 'Mẫu này đã gắn cho sản phẩm khác — gỡ ở sản phẩm đó trước.' : apiErrorMessage(e, 'Gắn chưa được.')),
    });
  };

  return (
    <ModalShell open onClose={onClose} title={`Gắn "${model.name}" cho sản phẩm`} maxWidth="max-w-lg" footer={<button onClick={onClose} className="btn btn-ghost">Đóng</button>}>
      <div className="flex flex-col gap-3 text-sm">
        <input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Tìm sản phẩm theo tên…" className="input input-bordered input-sm w-full" />
        <p className="text-xs text-base-content/70">Sản phẩm đã có mẫu khác sẽ được thay bằng mẫu này.</p>
        <ul className="max-h-72 overflow-y-auto rounded-xl border border-base-300">
          {products.isLoading ? <li className="p-3 text-center text-xs text-base-content/70">Đang tải…</li> : !list.length ? <li className="p-3 text-center text-xs text-base-content/70">Không có sản phẩm phù hợp.</li> : list.map((p) => (
            <li key={p.id}>
              <button type="button" onClick={() => choose(p)} disabled={link.isPending} className="flex w-full items-center gap-3 border-b border-base-200 px-3 py-2 text-left last:border-b-0 hover:bg-base-200/50">
                {p.primaryImageUrl ? <img src={p.primaryImageUrl} alt="" className="h-10 w-10 rounded-lg object-cover" /> : <span className="h-10 w-10 rounded-lg bg-base-200" />}
                <span className="min-w-0 flex-1"><span className="block truncate">{p.name}</span><span className="block text-xs text-base-content/70">{p.supplierName}{p.has3d ? ' · đã có 3D' : ''}</span></span>
              </button>
            </li>
          ))}
        </ul>
        {err && <p className="text-error">{err}</p>}
      </div>
    </ModalShell>
  );
}
