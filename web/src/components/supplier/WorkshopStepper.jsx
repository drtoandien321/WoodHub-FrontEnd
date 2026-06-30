import { WORKSHOP_STEPS } from '../../utils/supplierStatus.js';
import { Check } from '../suppliers/icons.jsx';

/*
 * WorkshopStepper — quy trình sản xuất CUSTOM 5 bước (chỉ xưởng mộc).
 * step: key bước hiện tại (received|designing|producing|finishing|delivering).
 */
const FLOW = WORKSHOP_STEPS.map((s) => s.key);

export default function WorkshopStepper({ step }) {
  const activeIdx = FLOW.indexOf(step);
  return (
    <ol className="flex items-start">
      {WORKSHOP_STEPS.map((s, i) => {
        const done = i <= activeIdx;
        const isLast = i === WORKSHOP_STEPS.length - 1;
        return (
          <li key={s.key} className="flex flex-1 flex-col items-center text-center">
            <div className="flex w-full items-center">
              <span className={`hidden flex-1 sm:block ${i === 0 ? 'invisible' : ''} h-0.5 ${done ? 'bg-primary' : 'bg-base-300'}`} />
              <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-medium ${done ? 'bg-primary text-primary-content' : 'border border-base-300 bg-base-100 text-base-content/50'}`}>
                {i < activeIdx ? <Check width={14} height={14} /> : i + 1}
              </span>
              <span className={`hidden flex-1 sm:block ${isLast ? 'invisible' : ''} h-0.5 ${i < activeIdx ? 'bg-primary' : 'bg-base-300'}`} />
            </div>
            <span className={`mt-1.5 text-[11px] leading-tight ${done ? 'font-medium text-base-content' : 'text-base-content/50'}`}>{s.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
