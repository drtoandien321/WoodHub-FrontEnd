import { useState } from 'react';
import { useCategoryTree } from '../../hooks/useCatalog.js';
import { useDeleteCategory } from '../../hooks/useAdminCategories.js';
import CategoryTree from '../../components/admin/CategoryTree.jsx';
import CategoryFormModal from '../../components/admin/CategoryFormModal.jsx';
import { Plus } from '../../components/suppliers/icons.jsx';

export default function AdminCategories() {
  const { data: tree, isLoading } = useCategoryTree();
  const deleteCategory = useDeleteCategory();
  const [modalMode, setModalMode] = useState(null); // null | 'create' | node đang sửa

  const items = tree ?? [];

  const handleDelete = (node) => {
    if (!window.confirm(`Xoá danh mục "${node.name}"? Hành động này không thể hoàn tác.`)) return;
    deleteCategory.mutate(node.id, {
      onError: (e) => {
        const status = e?.response?.status;
        window.alert(
          status === 409 || status === 500
            ? 'Không thể xóa danh mục này (có thể đang được sử dụng)'
            : 'Xoá danh mục thất bại, vui lòng thử lại'
        );
      },
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl">Danh mục</h1>
          <p className="mt-1 text-base-content/60">Quản lý danh mục sản phẩm theo cấu trúc cây (cha - con).</p>
        </div>
        <button onClick={() => setModalMode('create')} className="btn btn-primary gap-2"><Plus width={16} height={16} /> Thêm danh mục</button>
      </header>

      {isLoading ? (
        <div className="skeleton h-64 rounded-2xl" />
      ) : (
        <CategoryTree nodes={items} onEdit={(node) => setModalMode(node)} onDelete={handleDelete} />
      )}

      <CategoryFormModal
        key={modalMode === 'create' ? 'create' : modalMode?.id}
        open={!!modalMode}
        onClose={() => setModalMode(null)}
        initial={modalMode === 'create' ? null : modalMode}
        tree={items}
      />
    </div>
  );
}
