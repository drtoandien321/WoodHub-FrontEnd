import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  useSupplierProducts,
  useCreateSupplierProduct,
  useUpdateSupplierProduct,
  useDeleteSupplierProduct,
} from '../../hooks/useSupplier.js';
import { formatVnd } from '../../utils/format.js';

const MATERIALS = ['oak', 'walnut', 'ash', 'pine', 'rubber'];

const EMPTY_FORM = {
  name: '', nameEn: '', price: '', material: 'oak', stock: '', image: '', description: '', descriptionEn: '',
};

export default function PortalProducts() {
  const { t } = useTranslation();
  const { data, isLoading } = useSupplierProducts();
  const createProduct = useCreateSupplierProduct();
  const updateProduct = useUpdateSupplierProduct();
  const deleteProduct = useDeleteSupplierProduct();

  const dialogRef = useRef(null);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    dialogRef.current?.showModal();
  };

  const openEdit = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      nameEn: product.nameEn ?? '',
      price: product.price,
      material: product.material,
      stock: product.stock,
      image: product.image ?? '',
      description: product.description ?? '',
      descriptionEn: product.descriptionEn ?? '',
    });
    dialogRef.current?.showModal();
  };

  const handleChange = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = { ...form, price: Number(form.price), stock: Number(form.stock) };
    const onSuccess = () => dialogRef.current?.close();
    if (editingId) {
      updateProduct.mutate({ id: editingId, ...payload }, { onSuccess });
    } else {
      createProduct.mutate(payload, { onSuccess });
    }
  };

  const handleDelete = (product) => {
    if (window.confirm(t('portal.products.confirmDelete', { name: product.name }))) {
      deleteProduct.mutate(product.id);
    }
  };

  if (isLoading) return <div className="skeleton h-64 rounded-2xl" />;

  const products = data?.items ?? [];
  const saving = createProduct.isPending || updateProduct.isPending;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="font-display text-2xl md:text-3xl">{t('portal.products.title')}</h1>
        <button onClick={openCreate} className="btn btn-primary btn-sm">{t('portal.products.add')}</button>
      </div>

      {products.length === 0 ? (
        <p className="text-sm text-base-content/60">{t('portal.products.empty')}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                <th>{t('portal.products.table.image')}</th>
                <th>{t('portal.products.table.name')}</th>
                <th>{t('portal.products.table.price')}</th>
                <th>{t('portal.products.table.material')}</th>
                <th>{t('portal.products.table.stock')}</th>
                <th>{t('portal.products.table.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td><img src={p.image} alt={p.name} className="w-12 h-12 object-cover rounded-md" /></td>
                  <td className="max-w-[180px]">
                    <p className="line-clamp-1">{p.name}</p>
                    <p className="text-xs text-base-content/60 line-clamp-1">{p.nameEn}</p>
                  </td>
                  <td className="whitespace-nowrap">{formatVnd(p.price)}</td>
                  <td>{t(`suppliers.materials.${p.material}`)}</td>
                  <td>{p.stock}</td>
                  <td>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(p)} className="btn btn-ghost btn-xs">{t('portal.products.edit')}</button>
                      <button onClick={() => handleDelete(p)} className="btn btn-ghost btn-xs text-error">{t('portal.products.delete')}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal thêm/sửa sản phẩm */}
      <dialog ref={dialogRef} className="modal">
        <div className="modal-box max-w-lg">
          <h3 className="font-display text-xl mb-4">{editingId ? t('portal.products.edit') : t('portal.products.newProduct')}</h3>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm text-base-content/70">{t('portal.products.form.nameVi')}</span>
              <input required className="input input-bordered w-full" value={form.name} onChange={handleChange('name')} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-base-content/70">{t('portal.products.form.nameEn')}</span>
              <input className="input input-bordered w-full" value={form.nameEn} onChange={handleChange('nameEn')} />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-sm text-base-content/70">{t('portal.products.form.price')}</span>
                <input required type="number" min="0" className="input input-bordered w-full" value={form.price} onChange={handleChange('price')} />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm text-base-content/70">{t('portal.products.form.stock')}</span>
                <input required type="number" min="0" className="input input-bordered w-full" value={form.stock} onChange={handleChange('stock')} />
              </label>
            </div>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-base-content/70">{t('portal.products.form.material')}</span>
              <select className="select select-bordered w-full" value={form.material} onChange={handleChange('material')}>
                {MATERIALS.map((m) => (
                  <option key={m} value={m}>{t(`suppliers.materials.${m}`)}</option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-base-content/70">{t('portal.products.form.image')}</span>
              <input className="input input-bordered w-full" value={form.image} onChange={handleChange('image')} />
              <span className="text-xs mt-1 text-base-content/50">{t('portal.products.form.imageNote')}</span>
            </label>
            {form.image && (
              <div>
                <p className="text-xs text-base-content/60 mb-1">{t('portal.products.form.imagePreview')}</p>
                <img src={form.image} alt="" className="w-16 h-16 object-cover rounded-md border border-base-300" />
              </div>
            )}
            <label className="flex flex-col gap-1">
              <span className="text-sm text-base-content/70">{t('portal.products.form.descriptionVi')}</span>
              <textarea className="textarea textarea-bordered w-full" rows={2} value={form.description} onChange={handleChange('description')} />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm text-base-content/70">{t('portal.products.form.descriptionEn')}</span>
              <textarea className="textarea textarea-bordered w-full" rows={2} value={form.descriptionEn} onChange={handleChange('descriptionEn')} />
            </label>

            <div className="modal-action">
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => dialogRef.current?.close()}>
                {t('portal.products.form.cancel')}
              </button>
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                {saving ? <span className="loading loading-spinner loading-sm" /> : t('portal.products.form.save')}
              </button>
            </div>
          </form>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </div>
  );
}
