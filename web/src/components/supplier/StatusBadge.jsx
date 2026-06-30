// StatusBadge — chip trạng thái dùng chung. Nhận sẵn {label, cls} từ utils/supplierStatus.
export default function StatusBadge({ meta, className = '' }) {
  if (!meta) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${meta.cls} ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {meta.label}
    </span>
  );
}
