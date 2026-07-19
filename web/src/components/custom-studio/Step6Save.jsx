import { useTranslation } from 'react-i18next';
import { ai3dErrorKey } from '../../utils/ai3dErrors.js';
import MyDesignsList from './MyDesignsList.jsx';

/*
 * Bước 6 — Lưu thiết kế: đặt tên, lưu (model + configuration hiện tại), rồi hiện "Thiết kế của tôi".
 * Logic tạo/cập nhật (create-then-complete, optimistic lock 409) nằm ở pages/CustomStudio.jsx —
 * component này chỉ trình bày, không tự gọi API (nhất quán với các step khác).
 */
export default function Step6Save({ designName, onNameChange, onSave, saving, saveError, saved, onBack, onStartNew }) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-2xl">{t('custom.studio.step6.title')}</h2>
        <p className="mt-1 text-sm text-base-content/60">{t('custom.studio.step6.subtitle')}</p>
      </div>

      {saved ? (
        <div className="rounded-2xl border border-success/30 bg-success/10 p-5 text-center">
          <p className="font-display text-lg text-success">{t('custom.studio.step6.savedTitle')}</p>
          <button onClick={onStartNew} className="btn btn-primary btn-sm mt-3">{t('custom.studio.step6.newDesign')}</button>
        </div>
      ) : (
        <div className="rounded-2xl border border-base-300 bg-base-100 p-5">
          <label className="text-sm font-medium" htmlFor="design-name">{t('custom.studio.step6.nameLabel')}</label>
          <input
            id="design-name"
            value={designName}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder={t('custom.studio.step6.namePlaceholder')}
            maxLength={100}
            className="input input-bordered mt-2 w-full rounded-xl"
          />
          {saveError && <p className="mt-2 text-sm text-error" role="alert">{t(ai3dErrorKey(saveError))}</p>}
          <button onClick={onSave} disabled={saving || !designName.trim()} className="btn btn-primary mt-4 w-full sm:w-auto">
            {saving ? <span className="loading loading-spinner loading-sm" /> : t('custom.studio.step6.cta')}
          </button>
        </div>
      )}

      <div>
        <h3 className="mb-3 font-medium">{t('custom.studio.designs.title')}</h3>
        <MyDesignsList />
      </div>

      {!saved && (
        <div className="flex justify-start">
          <button onClick={onBack} className="btn btn-ghost">{t('custom.studio.back')}</button>
        </div>
      )}
    </div>
  );
}
