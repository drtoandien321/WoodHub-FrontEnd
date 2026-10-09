import { useTranslation } from 'react-i18next';
import { formatVnd } from '../../utils/format.js';
import { quoteCardModel, formatDay } from '../../utils/quoteSummary.js';

/*
 * QuotePricing — khối giá + thời gian dự kiến trong card "Yêu cầu báo giá của tôi".
 * Mọi quyết định hiển thị nằm ở utils/quoteSummary.js (quoteCardModel); component chỉ vẽ.
 * `viewer`: 'customer' (trang của khách) | 'workshop' — để nhãn "Bạn đề xuất" / "Xưởng đề xuất" đúng góc nhìn.
 * Màu: gold = token `accent` của theme (có bản dark riêng trong index.css) — không hard-code mã màu.
 */
export default function QuotePricing({ quote, viewer = 'customer' }) {
  const { t, i18n } = useTranslation();
  const m = quoteCardModel(quote);

  if (m.kind === 'empty') {
    return <p className="mt-2 text-sm text-base-content/40">{t('quote.card.noQuote')}</p>;
  }

  const unit = <span className="text-xs font-normal text-base-content/55"> {t('quote.card.perUnit')}</span>;
  const totalLine = m.total !== null && (
    <p className="text-xs text-base-content/60">
      {t('quote.card.total')}: <span className="font-medium">{formatVnd(m.total)}</span> (×{m.quantity})
    </p>
  );

  if (m.kind === 'dim') {
    return (
      <div className="mt-2 opacity-60" aria-label={t('quote.card.lastPrice')}>
        <p className="text-sm text-base-content/70">
          <span className="line-through">{formatVnd(m.price)}</span>{unit}
        </p>
        <p className="text-xs text-base-content/50">{t('quote.card.lastPrice')}</p>
      </div>
    );
  }

  if (m.kind === 'final') {
    return (
      <div className="mt-2">
        <p className="text-lg font-semibold leading-tight text-accent">
          {formatVnd(m.price)}{unit}
        </p>
        {totalLine}
        <p className="mt-0.5 text-xs text-base-content/60">
          {t('quote.card.agreedPrice')}
          {m.days !== null && ` · ${t('quote.card.aboutDays', { days: m.days })}`}
          {m.date && ` · ${t('quote.card.expectedBy', { date: formatDay(m.date, i18n.language) })}`}
        </p>
      </div>
    );
  }

  // kind === 'offer'
  const byLabel = m.by === 'customer'
    ? t(viewer === 'customer' ? 'quote.card.byYou' : 'quote.card.byCustomer')
    : t(viewer === 'customer' ? 'quote.card.byWorkshop' : 'quote.card.byYouWorkshop');
  return (
    <div className="mt-2">
      <p className="text-base font-semibold leading-tight text-primary">
        {formatVnd(m.price)}{unit}
      </p>
      {totalLine}
      <p className="mt-0.5 text-xs text-base-content/60">
        {byLabel}
        {m.rounds > 0 && ` · ${t('quote.card.rounds', { count: m.rounds })}`}
        {m.days !== null && ` · ${t('quote.card.aboutDays', { days: m.days })}`}
      </p>
    </div>
  );
}
