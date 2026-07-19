import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AI_PRODUCT_TYPES } from '../../api/mock/customData.js';
import { useCustomStudioStore } from '../../stores/customStudioStore.js';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB — khớp giới hạn thật POST /custom/ai/generate

/*
 * Bước 2 — Chuẩn bị ảnh: drag&drop/preview/thay/xoá, chọn loại sản phẩm, tuỳ chọn xoá nền,
 * hiển thị yêu cầu ảnh. KHÔNG có crop (chưa có thư viện crop trong dự án — không tự ý thêm
 * dependency mới, xem CLAUDE.md mục "Đừng tự ý thêm thư viện nặng/không cần thiết mà không hỏi").
 */
export default function Step2Prepare({ onNext, onBack, pending }) {
  const { t } = useTranslation();
  const fileRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileError, setFileError] = useState('');

  const imageFile = useCustomStudioStore((s) => s.imageFile);
  const imagePreviewUrl = useCustomStudioStore((s) => s.imagePreviewUrl);
  const productType = useCustomStudioStore((s) => s.productType);
  const removeBackground = useCustomStudioStore((s) => s.removeBackground);
  const setImageFile = useCustomStudioStore((s) => s.setImageFile);
  const clearImage = useCustomStudioStore((s) => s.clearImage);
  const setProductType = useCustomStudioStore((s) => s.setProductType);
  const setRemoveBackground = useCustomStudioStore((s) => s.setRemoveBackground);

  const acceptFile = (file) => {
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setFileError(t('custom.studio.step2.errorType'));
      return;
    }
    if (file.size > MAX_SIZE_BYTES) {
      setFileError(t('custom.studio.step2.errorSize'));
      return;
    }
    setFileError('');
    setImageFile(file, URL.createObjectURL(file));
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    acceptFile(e.dataTransfer.files?.[0]);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-display text-2xl">{t('custom.studio.step2.title')}</h2>
        <p className="mt-1 text-sm text-base-content/60">{t('custom.studio.step2.subtitle')}</p>
      </div>

      {/* Dropzone / preview */}
      {imagePreviewUrl ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-base-300 bg-base-100 p-5">
          <img src={imagePreviewUrl} alt="" className="max-h-72 rounded-xl object-contain" />
          <div className="flex gap-2">
            <button onClick={() => fileRef.current?.click()} className="btn btn-outline btn-sm border-base-300">{t('custom.studio.step2.replace')}</button>
            <button onClick={clearImage} className="btn btn-ghost btn-sm text-error">{t('custom.studio.step2.remove')}</button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileRef.current?.click(); }}
          className={`flex min-h-52 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-8 text-center transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${dragOver ? 'border-primary bg-primary/5' : 'border-base-300 bg-base-200/40 hover:border-primary/60'}`}
        >
          <p className="font-medium">{t('custom.studio.step2.dropTitle')}</p>
          <p className="text-xs text-base-content/55">{t('custom.studio.step2.dropHint')}</p>
        </div>
      )}
      <input
        ref={fileRef} type="file" accept={ACCEPTED_TYPES.join(',')} className="hidden"
        onChange={(e) => { acceptFile(e.target.files?.[0]); e.target.value = ''; }}
      />
      {fileError && <p className="text-sm text-error" role="alert">{fileError}</p>}

      {/* Yêu cầu ảnh */}
      <div className="rounded-xl bg-base-200/50 p-4 text-xs text-base-content/60">
        <p className="font-medium text-base-content/70">{t('custom.studio.step2.requirementsTitle')}</p>
        <ul className="mt-1.5 list-disc space-y-0.5 pl-4">
          <li>{t('custom.studio.step2.reqFormat')}</li>
          <li>{t('custom.studio.step2.reqSize')}</li>
          <li>{t('custom.studio.step2.reqAngle')}</li>
        </ul>
      </div>

      {/* Loại sản phẩm */}
      <div>
        <h3 className="mb-2 font-medium">{t('custom.studio.step2.productTypeTitle')}</h3>
        <div className="flex flex-wrap gap-2">
          {AI_PRODUCT_TYPES.map((pt) => (
            <button
              key={pt.id}
              onClick={() => setProductType(pt.id)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-colors ${productType === pt.id ? 'border-primary bg-primary/10 text-primary' : 'border-base-300 hover:border-primary/50'}`}
            >
              <span>{pt.emoji}</span>{t(`custom.studio.productTypes.${pt.id}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Xoá nền */}
      <label className="flex cursor-pointer items-center justify-between rounded-xl border border-base-300 p-3">
        <span className="text-sm">
          {t('custom.studio.step2.removeBg')}
          <span className="block text-xs text-base-content/50">{t('custom.studio.step2.removeBgHint')}</span>
        </span>
        <input type="checkbox" className="toggle toggle-primary" checked={removeBackground} onChange={(e) => setRemoveBackground(e.target.checked)} />
      </label>

      {/* Điều hướng */}
      <div className="mt-2 flex justify-between">
        <button onClick={onBack} className="btn btn-ghost">{t('custom.studio.back')}</button>
        <button onClick={onNext} disabled={!imageFile || pending} className="btn btn-primary">
          {pending ? <span className="loading loading-spinner loading-sm" /> : t('custom.studio.step2.cta')}
        </button>
      </div>
    </div>
  );
}
