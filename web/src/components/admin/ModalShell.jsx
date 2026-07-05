import { X } from '../suppliers/icons.jsx';

/*
 * ModalShell — khung modal DÙNG CHUNG cho các trang Admin mới (Category/Material/Supplier/User).
 * Cố tình KHÔNG dùng lại cho ProductFormModal/StoreFormModal hiện có (giữ nguyên code cũ theo
 * yêu cầu) — 2 modal đó vẫn tự viết cấu trúc riêng, việc gộp chung để dùng ModalShell ghi vào
 * backlog làm sau, không refactor trong đợt này.
 *
 * Props: open, onClose, title, children (nội dung body, tự cuộn), footer (khu vực nút hành động).
 */
export default function ModalShell({ open, onClose, title, children, footer, maxWidth = 'max-w-lg' }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-4" onClick={onClose}>
      <div
        className={`flex max-h-[92vh] w-full ${maxWidth} flex-col overflow-hidden rounded-t-3xl bg-base-100 shadow-2xl sm:rounded-3xl`}
        onClick={(e) => e.stopPropagation()}
        role="dialog" aria-modal="true" aria-label={title}
      >
        <header className="flex items-center justify-between border-b border-base-300 px-5 py-4">
          <h2 className="font-display text-xl">{title}</h2>
          <button onClick={onClose} className="btn btn-ghost btn-sm btn-circle" aria-label="Đóng"><X width={18} height={18} /></button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

        <footer className="flex justify-end gap-3 border-t border-base-300 px-5 py-4">{footer}</footer>
      </div>
    </div>
  );
}
