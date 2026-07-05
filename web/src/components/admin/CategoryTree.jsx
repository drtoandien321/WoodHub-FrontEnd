import { useState } from 'react';
import { ChevronRight, Pencil, Trash } from '../suppliers/icons.jsx';

/*
 * CategoryTree — hiển thị cây danh mục (từ GET /categories/tree, BE đã dựng sẵn children[]).
 * Mỗi node tự quản state expand/collapse riêng (không cần state tập trung ở page cha).
 */
function TreeNode({ node, depth, onEdit, onDelete }) {
  const [open, setOpen] = useState(true);
  const hasChildren = node.children?.length > 0;

  return (
    <div>
      <div className="flex items-center gap-1.5 rounded-lg px-2 py-2 hover:bg-base-200/60" style={{ paddingLeft: `${depth * 20 + 8}px` }}>
        {hasChildren ? (
          <button onClick={() => setOpen((v) => !v)} className="btn btn-ghost btn-xs btn-square" aria-label={open ? 'Thu gọn' : 'Mở rộng'}>
            <ChevronRight width={14} height={14} className={`transition-transform ${open ? 'rotate-90' : ''}`} />
          </button>
        ) : <span className="w-6 shrink-0" />}
        <span className="flex-1 truncate text-sm font-medium">{node.name}</span>
        <span className="hidden text-xs text-base-content/40 sm:inline">{node.slug}</span>
        <button onClick={() => onEdit(node)} className="btn btn-ghost btn-xs btn-square" aria-label="Sửa"><Pencil width={14} height={14} /></button>
        <button onClick={() => onDelete(node)} className="btn btn-ghost btn-xs btn-square text-error" aria-label="Xóa"><Trash width={14} height={14} /></button>
      </div>
      {hasChildren && open && (
        <div>
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} depth={depth + 1} onEdit={onEdit} onDelete={onDelete} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CategoryTree({ nodes, onEdit, onDelete }) {
  if (!nodes.length) {
    return (
      <div className="rounded-2xl border border-dashed border-base-300 bg-base-100 py-16 text-center text-base-content/50">
        Chưa có danh mục nào. Bấm "Thêm danh mục" để bắt đầu.
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-base-300 bg-base-100 p-2 shadow-sm">
      {nodes.map((node) => (
        <TreeNode key={node.id} node={node} depth={0} onEdit={onEdit} onDelete={onDelete} />
      ))}
    </div>
  );
}
