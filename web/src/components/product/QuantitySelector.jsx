import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Minus, Plus } from '../suppliers/icons.jsx';

// Khớp ràng buộc BE khi thêm/sửa giỏ: AddCartItemRequest / UpdateCartItemRequest @Min(1) @Max(999)
export const MAX_CART_QTY = 999;

/*
 * QuantitySelector — chọn số lượng (controlled: value/onChange do component cha quản lý).
 *
 * Ô nhập giữ một bản NHÁP dạng chuỗi (`draft`) tách khỏi `value`:
 *  - Đang gõ: cho phép xoá trắng / gõ dở ("", "1", "12"...) — không ép về số ngay. Bản cũ gọi
 *    clamp(Number(e.target.value) || 1) ở MỖI phím → xoá hết là bật lại 1 tức thì, không nhập lại được.
 *  - Rời ô (blur) hoặc Enter: mới chốt — kẹp vào [1, max], rỗng/không hợp lệ thì quay về giá trị cũ.
 * Nút +/- vẫn đổi số ngay như trước.
 */
export default function QuantitySelector({ value, onChange, max = MAX_CART_QTY }) {
  const { t } = useTranslation();
  const clamp = (n) => Math.max(1, Math.min(max, n));
  const [draft, setDraft] = useState(String(value));

  // value đổi từ ngoài (bấm +/-, cha reset) → đồng bộ lại ô nhập
  useEffect(() => { setDraft(String(value)); }, [value]);

  const commit = () => {
    const n = Number.parseInt(draft, 10);
    const next = Number.isFinite(n) ? clamp(n) : value;
    setDraft(String(next));
    if (next !== value) onChange(next);
  };

  return (
    <div className="inline-flex items-center rounded-full border border-base-300 bg-base-100">
      <button
        type="button"
        onClick={() => onChange(clamp(value - 1))}
        disabled={value <= 1}
        aria-label={t('product.decrease')}
        className="grid h-10 w-10 place-items-center rounded-full text-base-content/70 transition hover:bg-base-200 disabled:opacity-30"
      >
        <Minus width={16} height={16} />
      </button>
      <input
        // type="text" + inputMode="numeric": vẫn hiện bàn phím số trên điện thoại, nhưng tránh các
        // quirk của type="number" (chấp nhận "e", "-", cuộn chuột làm đổi số, giữ số 0 ở đầu...)
        type="text"
        inputMode="numeric"
        pattern="[0-9]*"
        value={draft}
        // Chỉ nhận chữ số, tối đa đúng số chữ số của max (999 → 3 chữ số)
        onChange={(e) => setDraft(e.target.value.replace(/\D/g, '').slice(0, String(max).length))}
        onBlur={commit}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(); } }}
        aria-label={t('product.quantity')}
        className="w-12 border-0 bg-transparent text-center text-sm font-medium focus:outline-none"
      />
      <button
        type="button"
        onClick={() => onChange(clamp(value + 1))}
        disabled={value >= max}
        aria-label={t('product.increase')}
        className="grid h-10 w-10 place-items-center rounded-full text-base-content/70 transition hover:bg-base-200 disabled:opacity-30"
      >
        <Plus width={16} height={16} />
      </button>
    </div>
  );
}
