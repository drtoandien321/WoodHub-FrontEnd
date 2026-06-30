/*
 * ProductOptions — tuỳ chọn dạng pill (vd kích thước). Selected có viền nâu + nền beige.
 * options: string[] ; value: string ; onChange(option).
 * Trả null nếu không có option → trang sản phẩm tự ẩn cả khối (an toàn khi data thiếu).
 */
export default function ProductOptions({ label, options = [], value, onChange }) {
  if (!options.length) return null;

  return (
    <div>
      <p className="mb-2 text-sm text-base-content/60">{label}</p>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const active = opt === value;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              aria-pressed={active}
              className={`rounded-xl border px-3.5 py-2 text-sm transition ${
                active
                  ? 'border-primary bg-primary/10 font-medium text-primary'
                  : 'border-base-300 bg-base-100 text-base-content/80 hover:border-primary/50'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}
