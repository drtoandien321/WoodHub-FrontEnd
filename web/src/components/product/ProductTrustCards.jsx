import { useTranslation } from 'react-i18next';
import { Shield, Tool, Truck } from '../suppliers/icons.jsx';

/*
 * ProductTrustCards — 3 thẻ cam kết (bảo hành / lắp đặt / giao hàng).
 * Nội dung chung cho mọi SP nên để i18n tĩnh; icon line-style, nền cream, border nhẹ.
 */
const ITEMS = [
  { key: 'warranty', Icon: Shield },
  { key: 'install', Icon: Tool },
  { key: 'shipping', Icon: Truck },
];

export default function ProductTrustCards() {
  const { t } = useTranslation();
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {ITEMS.map(({ key, Icon }) => (
        <div key={key} className="flex items-start gap-3 rounded-2xl border border-base-300 bg-base-100 p-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-base-200 text-primary">
            <Icon width={18} height={18} />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium leading-tight">{t(`product.trust.${key}.title`)}</p>
            <p className="mt-0.5 text-xs text-base-content/55">{t(`product.trust.${key}.desc`)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
