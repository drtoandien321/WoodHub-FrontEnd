import { useTranslation } from 'react-i18next';

/*
 * PlanFeatureList — danh sách quyền lợi của gói, dùng chung cho card Bảng giá và modal thanh toán.
 * Dữ liệu dựng ở utils/planFeatures.js; component chỉ vẽ + dịch nhãn theo key (i18n `pricing.feature.<key>`).
 * items: [{ type: 'row', key, kind: 'unlimited'|'limit'|'none', count? } | { type: 'text', text }]
 * `collapsedCount` + `expanded`: các mục từ vị trí collapsedCount trở đi bị ẩn khi chưa mở rộng (chỉ trên mobile nếu
 * `collapseOnlyOnMobile`) — nút bật/tắt do component cha đặt, vì vị trí nút khác nhau giữa card và modal.
 */
const Check = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-success" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
);
const Cross = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-base-content/30" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
);

export default function PlanFeatureList({ items, collapsedCount = Infinity, expanded = true, collapseOnlyOnMobile = false, className = '' }) {
  const { t } = useTranslation();

  const valueText = (it) => {
    if (it.kind === 'unlimited') return t('pricing.unlimited');
    if (it.kind === 'limit') return t('pricing.countPerMonth', { count: it.count });
    return t('pricing.notIncluded');
  };

  return (
    <ul className={`flex flex-col gap-2 ${className}`}>
      {items.map((it, i) => {
        const hidden = !expanded && i >= collapsedCount;
        const hideClass = hidden ? (collapseOnlyOnMobile ? 'hidden md:flex' : 'hidden') : 'flex';
        const none = it.type === 'row' && it.kind === 'none';
        return (
          <li key={it.type === 'row' ? it.key : `t-${it.text}`} className={`${hideClass} items-start gap-2 text-sm ${none ? 'text-base-content/45' : ''}`}>
            {none ? <Cross /> : <Check />}
            {it.type === 'row' ? (
              <span>
                <span className={none ? '' : 'font-medium'}>{t(`pricing.feature.${it.key}`)}</span>
                {': '}{valueText(it)}
              </span>
            ) : (
              <span>{it.text}</span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
