import { useState } from 'react';
import ModalShell from '../../components/admin/ModalShell.jsx';
import { useAdminCreditPacks, useCreateCreditPack, useUpdateCreditPack, useDeleteCreditPack } from '../../hooks/useAdminCreditPacks.js';
import { formatVnd } from '../../utils/format.js';
import { Plus, Pencil, Trash } from '../../components/suppliers/icons.jsx';
import { apiErrorMessage } from '../../utils/apiError.js';

/*
 * CreditPackFormModal — Thêm/Sửa gói lượt (POST/PUT /admin/credit-packs).
 * Body: { name, displayName, feature, credits, price, isActive, sortOrder }. Hiện BE chỉ bán lượt
 * `design` nên không cho chọn feature (gửi cố định 'design', đúng mặc định của BE).
 */
function CreditPackFormModal({ initial, onClose }) {
  const isEdit = !!initial;
  const create = useCreateCreditPack();
  const update = useUpdateCreditPack();
  const [form, setForm] = useState(() => ({
    name: initial?.name ?? '', displayName: initial?.displayName ?? '',
    credits: String(initial?.credits ?? ''), price: String(initial?.price ?? ''),
    sortOrder: String(initial?.sortOrder ?? 0), isActive: initial?.isActive ?? true,
  }));
  const [err, setErr] = useState('');
  const set = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = async () => {
    const credits = Number(form.credits);
    const price = Number(form.price);
    if (!form.name.trim() || !form.displayName.trim()) { setErr('Nhập mã gói và tên hiển thị'); return; }
    if (!Number.isInteger(credits) || credits < 1) { setErr('Số lượt phải là số nguyên ≥ 1'); return; }
    // Gói 0đ: BE từ chối thanh toán (400) → khách không mua được, chặn luôn ở đây cho rõ
    if (!(price > 0)) { setErr('Giá phải lớn hơn 0'); return; }
    setErr('');
    const body = {
      name: form.name.trim(), displayName: form.displayName.trim(), feature: 'design',
      credits, price, isActive: form.isActive, sortOrder: Number(form.sortOrder) || 0,
    };
    try {
      if (isEdit) await update.mutateAsync({ id: initial.id, ...body });
      else await create.mutateAsync(body);
      onClose();
    } catch (e) {
      setErr(apiErrorMessage(e, 'Không lưu được gói, vui lòng thử lại'));
    }
  };
  const saving = create.isPending || update.isPending;
  const perCredit = Number(form.price) > 0 && Number(form.credits) > 0 ? Math.round(Number(form.price) / Number(form.credits)) : null;

  return (
    <ModalShell
      open
      onClose={onClose}
      title={isEdit ? 'Sửa gói lượt' : 'Thêm gói lượt'}
      footer={
        <>
          <button onClick={onClose} className="btn btn-ghost" disabled={saving}>Hủy</button>
          <button onClick={submit} className="btn btn-primary" disabled={saving}>{saving ? <span className="loading loading-spinner loading-sm" /> : 'Lưu gói'}</button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-base-content/70">Mã gói *</span>
            <input value={form.name} onChange={set('name')} className="input input-bordered w-full font-mono" placeholder="design_5" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-base-content/70">Tên hiển thị *</span>
            <input value={form.displayName} onChange={set('displayName')} className="input input-bordered w-full" placeholder="Gói 5 lượt thiết kế" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-base-content/70">Số lượt thiết kế *</span>
            <input type="number" min="1" value={form.credits} onChange={set('credits')} className="input input-bordered w-full" />
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-base-content/70">Giá (đ) *</span>
            <input type="number" min="0" value={form.price} onChange={set('price')} className="input input-bordered w-full" />
            {perCredit && <span className="text-xs text-base-content/50">≈ {formatVnd(perCredit)} / lượt</span>}
          </label>
          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-base-content/70">Thứ tự hiển thị</span>
            <input type="number" value={form.sortOrder} onChange={set('sortOrder')} className="input input-bordered w-full" />
          </label>
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" className="toggle toggle-primary toggle-sm" checked={form.isActive} onChange={set('isActive')} />
          Đang bán (khách thấy ở "Gói của tôi")
        </label>
        {err && <div role="alert" className="alert alert-error py-2 text-sm">{err}</div>}
      </div>
    </ModalShell>
  );
}

/*
 * AdminCreditPacks (/admin/credit-packs) — CRUD gói lượt thiết kế bán thêm (lượt dùng đến hết, không reset).
 * GET /admin/credit-packs trả cả gói đã tắt, không phân trang (số gói rất ít) — giống trang Gói đăng ký.
 */
export default function AdminCreditPacks() {
  const { data: packs = [], isLoading, isError, refetch } = useAdminCreditPacks();
  const deletePack = useDeleteCreditPack();
  const [modal, setModal] = useState(null); // null | 'create' | pack

  const handleDelete = (p) => {
    if (!window.confirm(`Xoá gói "${p.displayName}"? Lượt khách đã mua vẫn giữ nguyên.`)) return;
    deletePack.mutate(p.id, { onError: (err) => window.alert(apiErrorMessage(err, 'Xoá gói thất bại, vui lòng thử lại')) });
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Gói lượt thiết kế</h1>
          <p className="mt-1 text-base-content/60">Lượt thiết kế 3D bán thêm khi khách hết hạn mức tháng. Lượt mua không hết hạn.</p>
        </div>
        <button onClick={() => setModal('create')} className="btn btn-primary gap-2"><Plus width={16} height={16} /> Thêm gói</button>
      </header>

      <section className="rounded-2xl border border-base-300 bg-base-100 p-2 shadow-sm md:p-4">
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr className="text-base-content/55"><th>Gói</th><th>Số lượt</th><th>Giá</th><th>Giá / lượt</th><th>Trạng thái</th><th>Thứ tự</th><th className="text-right">Thao tác</th></tr>
            </thead>
            <tbody>
              {isLoading && <tr><td colSpan={7} className="py-10 text-center text-base-content/50">Đang tải…</td></tr>}
              {isError && <tr><td colSpan={7} className="py-10 text-center"><span className="text-error">Không tải được danh sách. </span><button onClick={() => refetch()} className="link link-primary">Thử lại</button></td></tr>}
              {!isLoading && !isError && !packs.length && <tr><td colSpan={7} className="py-10 text-center text-base-content/50">Chưa có gói lượt nào.</td></tr>}
              {packs.map((p) => (
                <tr key={p.id} className="hover:bg-base-200/50">
                  <td><p className="font-medium">{p.displayName}</p><p className="font-mono text-xs text-base-content/50">{p.name}</p></td>
                  <td className="text-sm tabular-nums">{p.credits}</td>
                  <td className="text-sm">{formatVnd(p.price)}</td>
                  <td className="text-sm text-base-content/60">{formatVnd(Math.round(p.price / p.credits))}</td>
                  <td><span className={`badge badge-sm ${p.isActive ? 'badge-success' : 'badge-ghost'}`}>{p.isActive ? 'Đang bán' : 'Đã tắt'}</span></td>
                  <td className="text-sm text-base-content/60">{p.sortOrder}</td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setModal(p)} className="btn btn-ghost btn-sm btn-square" aria-label={`Sửa ${p.displayName}`}><Pencil width={15} height={15} /></button>
                      <button onClick={() => handleDelete(p)} disabled={deletePack.isPending} className="btn btn-ghost btn-sm btn-square text-error" aria-label={`Xoá ${p.displayName}`}><Trash width={15} height={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {modal && <CreditPackFormModal key={modal === 'create' ? 'new' : modal.id} initial={modal === 'create' ? null : modal} onClose={() => setModal(null)} />}
    </div>
  );
}
