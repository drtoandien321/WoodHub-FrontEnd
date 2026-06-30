import { useTranslation } from 'react-i18next';
import { Minus, Plus } from '../suppliers/icons.jsx';

/*
 * QuantitySelector — chọn số lượng. Không nhỏ hơn 1, không vượt quá max (tồn kho).
 * value/onChange do component cha quản lý (controlled).
 */
export default function QuantitySelector({ value, onChange, max = 99 }) {
  const { t } = useTranslation();
  const clamp = (n) => Math.max(1, Math.min(max, n));

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
        type="number"
        min={1}
        max={max}
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value) || 1))}
        aria-label={t('product.quantity')}
        className="w-12 border-0 bg-transparent text-center text-sm font-medium [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none"
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
