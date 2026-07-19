import { useTranslation } from 'react-i18next';
import { ai3dErrorKey } from '../../utils/ai3dErrors.js';

/*
 * Bước 3 — Generate: hiển thị queued/processing + progress bar, cho retry khi failed, cancel khi
 * đang chạy. KHÔNG tự trigger generate3D ở đây (component thuần hiển thị) — việc tạo task chỉ xảy
 * ra ĐÚNG 1 LẦN ở nút "Tiếp tục" của bước 2 (xem pages/CustomStudio.jsx handleStartGenerate),
 * tránh tạo nhiều task nếu double-click hoặc effect chạy 2 lần (React StrictMode).
 * "Rời trang vẫn tiếp tục kiểm tra": taskId lưu ở customStudioStore (persist) — quay lại trang,
 * CustomStudio tự poll lại đúng task này, không mất tiến trình.
 */
export default function Step3Generate({ task, taskError, onRetry, onCancel, onChangeImage, retryPending, cancelPending, imagePreviewUrl }) {
  const { t } = useTranslation();

  if (taskError) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-base-300 bg-base-100 p-10 text-center">
        <p className="font-display text-xl text-error">{t('custom.ai.failedTitle')}</p>
        <p className="text-sm text-base-content/60">{t(ai3dErrorKey(taskError))}</p>
      </div>
    );
  }

  const status = task?.status ?? 'queued';
  const progress = task?.progress ?? 0;
  const stageMessage =
    status === 'queued' ? t('custom.studio.step3.stageQueued')
    : status === 'processing' ? t('custom.studio.step3.stageProcessing')
    : status === 'failed' ? t('custom.studio.step3.stageFailed')
    : status === 'cancelled' ? t('custom.studio.step3.stageCancelled')
    : t('custom.studio.step3.stageDone');

  return (
    <div className="flex flex-col items-center gap-5 rounded-2xl border border-base-300 bg-base-100 p-10 text-center">
      {imagePreviewUrl && <img src={imagePreviewUrl} alt="" className="h-28 w-28 rounded-2xl object-cover" />}

      {status === 'failed' ? (
        <>
          <p className="font-display text-xl text-error">{t('custom.ai.failedTitle')}</p>
          <p className="max-w-sm text-sm text-base-content/60">{task?.errorMessage || t('custom.ai.errors.generic')}</p>
          <div className="flex gap-2">
            <button onClick={onChangeImage} className="btn btn-ghost btn-sm">{t('custom.studio.step3.changeImage')}</button>
            <button onClick={onRetry} disabled={retryPending} className="btn btn-primary btn-sm">
              {retryPending ? <span className="loading loading-spinner loading-xs" /> : t('custom.ai.retry')}
            </button>
          </div>
        </>
      ) : status === 'cancelled' ? (
        <>
          <p className="font-display text-xl">{t('custom.ai.cancelledTitle')}</p>
          <button onClick={onChangeImage} className="btn btn-primary btn-sm">{t('custom.studio.step3.changeImage')}</button>
        </>
      ) : (
        <>
          <span className="loading loading-spinner loading-lg text-primary" aria-hidden="true" />
          <div className="w-full max-w-xs">
            <progress className="progress progress-primary w-full" value={progress} max="100" />
            <p className="mt-1 text-sm text-base-content/55">{progress}%</p>
          </div>
          <p className="font-display text-lg">{stageMessage}</p>
          <p className="max-w-sm text-xs text-base-content/50">{t('custom.studio.step3.leaveHint')}</p>
          <button onClick={onCancel} disabled={cancelPending} className="btn btn-ghost btn-sm">{t('custom.ai.cancel')}</button>
        </>
      )}
    </div>
  );
}
