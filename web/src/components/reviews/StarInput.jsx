import { useState } from 'react';
import { Star } from '../suppliers/icons.jsx';

/*
 * StarInput — chọn số sao 1..5. Dựng bằng radio ẩn (role="radiogroup") thay vì 5 nút rời để:
 *  - bàn phím dùng được (Tab vào nhóm, mũi tên trái/phải đổi sao — hành vi sẵn có của radio),
 *  - screen reader đọc đúng "3 trên 5 sao, đã chọn".
 * Hover để xem trước, rời chuột thì về giá trị đã chọn.
 */
export default function StarInput({ value, onChange, label, size = 28, labels = [] }) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <div role="radiogroup" aria-label={label} className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => (
        <label key={n} className="cursor-pointer text-accent" onMouseEnter={() => setHover(n)} title={labels[n - 1]}>
          <input type="radio" name={label} value={n} checked={value === n} onChange={() => onChange(n)} className="sr-only peer" aria-label={labels[n - 1] ?? `${n}/5`} />
          <span className="block rounded peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-primary">
            <Star width={size} height={size} filled={n <= shown} />
          </span>
        </label>
      ))}
      {shown > 0 && labels[shown - 1] && <span className="ml-2 text-sm text-base-content/60">{labels[shown - 1]}</span>}
    </div>
  );
}
