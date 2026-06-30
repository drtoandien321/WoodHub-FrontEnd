import { ORDER_STEPS } from '../../utils/supplierStatus.js';
import { Check } from '../suppliers/icons.jsx';

/*
 * OrderStepper — tiến độ đơn 4 bước (KHÔNG dùng quy trình custom của xưởng).
 * status: trạng thái hiện tại → tô các bước ≤ hiện tại. cancelled → hiển thị xám + nhãn riêng.
 */
const FLOW = ['processing', 'packing', 'shipping', 'completed'];

export default function OrderStepper({ status }) {
  const cancelled = status === 'cancelled';
  const activeIdx = cancelled ? -1 : FLOW.indexOf(status === 'completed' ? 'completed' : status);

  return (
    <ol className="flex items-start">
      {ORDER_STEPS.map((step, i) => {
        const done = !cancelled && i <= activeIdx;
        const isLast = i === ORDER_STEPS.length - 1;
        return (
          <li key={step.key} className="flex flex-1 flex-col items-center text-center">
            <div className="flex w-full items-center">
              <span className={`hidden flex-1 sm:block ${i === 0 ? 'invisible' : ''} h-0.5 ${done ? 'bg-success' : 'bg-base-300'}`} />
              <span
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-medium ${
                  done ? 'bg-success text-success-content' : 'border border-base-300 bg-base-100 text-base-content/50'
                }`}
              >
                {done ? <Check width={14} height={14} /> : i + 1}
              </span>
              <span className={`hidden flex-1 sm:block ${isLast ? 'invisible' : ''} h-0.5 ${i < activeIdx ? 'bg-success' : 'bg-base-300'}`} />
            </div>
            <span className={`mt-1.5 text-[11px] leading-tight ${done ? 'font-medium text-base-content' : 'text-base-content/50'}`}>
              {step.label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
