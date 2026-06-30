import { useTranslation } from 'react-i18next';
import { Tree, Handshake, Layers, Shield } from './icons.jsx';

/*
 * SupplierStrengths — dải pill "điểm mạnh" hiển thị dưới đoạn giới thiệu.
 * Mặc định 4 điểm bán hàng chung (i18n). Nếu BE trả supplier.strengths (mảng string) thì
 * ưu tiên dùng — icon dùng theo thứ tự, dư thì lặp lại icon cuối (an toàn khi thiếu/thừa).
 */
const ICONS = [Tree, Handshake, Layers, Shield];
const DEFAULT_KEYS = ['naturalWood', 'customDesign', 'inhouse', 'warranty'];

export default function SupplierStrengths({ strengths }) {
  const { t } = useTranslation();
  const items = Array.isArray(strengths) && strengths.length
    ? strengths
    : DEFAULT_KEYS.map((k) => t(`suppliers.strengths.${k}`));

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {items.map((label, i) => {
        const Icon = ICONS[Math.min(i, ICONS.length - 1)];
        return (
          <span
            key={`${label}-${i}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-base-300 bg-base-200/60 px-3 py-1.5 text-xs font-medium text-base-content/80"
          >
            <Icon width={14} height={14} className="text-primary" /> {label}
          </span>
        );
      })}
    </div>
  );
}
