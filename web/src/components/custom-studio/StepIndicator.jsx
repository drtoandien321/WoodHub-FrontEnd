import { useTranslation } from 'react-i18next';

// Luồng "chọn mẫu" bỏ qua bước 2/3 (không cần chuẩn bị ảnh/generate — model có sẵn)
const ALL_STEPS = [1, 2, 3, 4, 5, 6];

export default function StepIndicator({ step, source }) {
  const { t } = useTranslation();
  const skip = source === 'template' ? new Set([2, 3]) : new Set();

  return (
    <ol className="flex flex-wrap items-center gap-x-1 gap-y-2" aria-label={t('custom.studio.stepIndicatorLabel')}>
      {ALL_STEPS.filter((n) => !skip.has(n)).map((n, idx, arr) => {
        const active = n === step;
        const done = n < step;
        return (
          <li key={n} className="flex items-center gap-1">
            <span
              aria-current={active ? 'step' : undefined}
              className={`flex h-7 min-w-7 items-center justify-center rounded-full px-2 text-xs font-medium transition-colors ${
                active ? 'bg-primary text-primary-content' : done ? 'bg-primary/15 text-primary' : 'bg-base-200 text-base-content/50'
              }`}
            >
              {n}
            </span>
            <span className={`hidden text-xs sm:inline ${active ? 'text-base-content' : 'text-base-content/45'}`}>
              {t(`custom.studio.stepLabels.${n}`)}
            </span>
            {idx < arr.length - 1 && <span className="mx-1.5 h-px w-4 bg-base-300" aria-hidden="true" />}
          </li>
        );
      })}
    </ol>
  );
}
