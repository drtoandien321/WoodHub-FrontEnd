/*
 * Pagination — thanh « Trang x / y » dùng chung cho mọi danh sách phân trang theo Spring Page
 * (`page: { number, totalPages, totalElements }`, number bắt đầu từ 0). Trước đây 10 trang tự viết lại khối này,
 * mỗi chỗ một kiểu (« » / ‹ ›, có/không tổng số, có/không chặn trang cuối).
 *  - unit: chữ sau tổng số (vd "đơn", "giao dịch") → hiện "— 25 đơn"; bỏ trống thì không hiện tổng.
 *  - Ẩn hẳn khi chỉ có 1 trang.
 */
export default function Pagination({ pageInfo, onChange, unit, className = '' }) {
  const { number = 0, totalPages = 1, totalElements } = pageInfo ?? {};
  if (totalPages <= 1) return null;
  const go = (n) => onChange(Math.min(Math.max(0, n), totalPages - 1));

  return (
    <div className={`flex items-center justify-between gap-3 text-sm text-base-content/70 ${className}`}>
      <span>
        Trang {number + 1} / {totalPages}
        {unit && totalElements != null && <> — {totalElements} {unit}</>}
      </span>
      <div className="join">
        <button onClick={() => go(number - 1)} disabled={number === 0} className="btn btn-sm join-item" aria-label="Trang trước">«</button>
        <button onClick={() => go(number + 1)} disabled={number >= totalPages - 1} className="btn btn-sm join-item" aria-label="Trang sau">»</button>
      </div>
    </div>
  );
}
