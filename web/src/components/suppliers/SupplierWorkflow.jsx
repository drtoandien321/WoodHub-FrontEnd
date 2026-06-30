import { useTranslation } from 'react-i18next';
import SectionCard from './SectionCard.jsx';
import { Layers, MessageCircle, Info, Image, Briefcase, Handshake } from './icons.jsx';

// Icon minh hoạ cho 5 bước quy trình (theo thứ tự).
const STEP_ICONS = [MessageCircle, Info, Image, Briefcase, Handshake];

/*
 * Section "Quy trình làm việc" — 5 step card. Desktop nằm ngang, mobile xếp dọc.
 * Nội dung bước lấy từ i18n (suppliers.workflow) vì giống nhau giữa các xưởng.
 */
export default function SupplierWorkflow() {
  const { t } = useTranslation();
  const steps = t('suppliers.workflow', { returnObjects: true });

  return (
    <SectionCard icon={Layers} title={t('suppliers.sectionWorkflow')}>
      <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {steps.map((step, i) => {
          const Icon = STEP_ICONS[i] ?? Info;
          return (
            <li key={i} className="relative flex flex-col gap-2 rounded-2xl border border-base-300 bg-base-200/40 p-4">
              <div className="flex items-center gap-2">
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-content">
                  {i + 1}
                </span>
                <span className="text-primary"><Icon width={18} height={18} /></span>
              </div>
              <p className="text-sm font-semibold">{step.title}</p>
              <p className="text-xs leading-relaxed text-base-content/65">{step.desc}</p>
            </li>
          );
        })}
      </ol>
    </SectionCard>
  );
}
