import { useTranslation } from 'react-i18next';
import { useCustomStudioStore } from '../../stores/customStudioStore.js';

const MAX_PROMPT = 600; // khớp giới hạn BE POST /custom/ai/generate/text (prompt/negativePrompt ≤600 ký tự)
const ART_STYLES = ['realistic', 'sculpture'];

/*
 * Bước 2 (nguồn 'text') — Mô tả món đồ bằng chữ để AI dựng 3D (text-to-3D).
 * Tách file riêng thay vì nhồi vào Step2Prepare: 2 form khác hẳn nhau (ảnh vs chữ), chung mỗi khung điều hướng.
 * Kết quả là bản PREVIEW (chỉ hình khối) — texture nâng cấp sau ở bước 4 (refine, không tốn thêm lượt).
 */
export default function Step2TextPrompt({ onNext, onBack, pending }) {
  const { t } = useTranslation();
  const textInput = useCustomStudioStore((s) => s.textInput);
  const setTextInput = useCustomStudioStore((s) => s.setTextInput);
  const { prompt, artStyle, negativePrompt } = textInput;
  const canSubmit = prompt.trim().length > 0 && !pending;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-2xl">{t('custom.studio.text.title')}</h2>
        <p className="mt-1 text-sm text-base-content/60">{t('custom.studio.text.subtitle')}</p>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">{t('custom.studio.text.promptLabel')}</span>
        <textarea
          value={prompt}
          maxLength={MAX_PROMPT}
          rows={4}
          onChange={(e) => setTextInput({ prompt: e.target.value })}
          placeholder={t('custom.studio.text.promptPlaceholder')}
          className="textarea textarea-bordered w-full text-sm"
        />
        <span className="self-end text-xs text-base-content/45">{prompt.length}/{MAX_PROMPT}</span>
      </label>

      <div>
        <h3 className="mb-2 text-sm font-medium">{t('custom.studio.text.styleLabel')}</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {ART_STYLES.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setTextInput({ artStyle: st })}
              className={`rounded-xl border p-3 text-left transition-colors ${artStyle === st ? 'border-primary bg-primary/10' : 'border-base-300 hover:border-primary/50'}`}
            >
              <span className={`block text-sm font-medium ${artStyle === st ? 'text-primary' : ''}`}>{t(`custom.studio.text.styles.${st}`)}</span>
              <span className="block text-xs text-base-content/55">{t(`custom.studio.text.styles.${st}Hint`)}</span>
            </button>
          ))}
        </div>
      </div>

      <label className="flex flex-col gap-1.5">
        <span className="text-sm font-medium">
          {t('custom.studio.text.negativeLabel')} <span className="font-normal text-base-content/45">({t('custom.studio.text.optional')})</span>
        </span>
        <input
          value={negativePrompt}
          maxLength={MAX_PROMPT}
          onChange={(e) => setTextInput({ negativePrompt: e.target.value })}
          placeholder={t('custom.studio.text.negativePlaceholder')}
          className="input input-bordered w-full text-sm"
        />
      </label>

      <div className="rounded-xl bg-base-200/50 p-4 text-xs text-base-content/60">
        <p className="font-medium text-base-content/70">{t('custom.studio.text.tipsTitle')}</p>
        <ul className="mt-1.5 list-disc space-y-0.5 pl-4">
          <li>{t('custom.studio.text.tip1')}</li>
          <li>{t('custom.studio.text.tip2')}</li>
          <li>{t('custom.studio.text.tip3')}</li>
        </ul>
      </div>

      <div className="mt-2 flex justify-between">
        <button onClick={onBack} className="btn btn-ghost">{t('custom.studio.back')}</button>
        <button onClick={onNext} disabled={!canSubmit} className="btn btn-primary">
          {pending ? <span className="loading loading-spinner loading-sm" /> : t('custom.studio.step2.cta')}
        </button>
      </div>
    </div>
  );
}
