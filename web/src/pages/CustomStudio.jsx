import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCustomStudioStore } from '../stores/customStudioStore.js';
import { useGenerate3D, useGenTask, useRetryGenTask, useCancelGenTask, useModel3d } from '../hooks/useModels3d.js';
import { useCreateDesign, useUpdateDesign } from '../hooks/useCustomDesigns.js';
import { api } from '../api/client.js';
import StepIndicator from '../components/custom-studio/StepIndicator.jsx';
import Step1Source from '../components/custom-studio/Step1Source.jsx';
import Step2Prepare from '../components/custom-studio/Step2Prepare.jsx';
import Step3Generate from '../components/custom-studio/Step3Generate.jsx';
import Step4Result from '../components/custom-studio/Step4Result.jsx';
import Step5Edit from '../components/custom-studio/Step5Edit.jsx';
import Step6Save from '../components/custom-studio/Step6Save.jsx';

/*
 * Custom Studio — wizard 6 bước hợp nhất luồng "chọn mẫu 3D" và "upload ảnh → AI dựng 3D"
 * (FE-2). Trang này CHỈ điều phối: đọc/ghi customStudioStore (client state) + gọi các hook
 * React Query tương ứng (server state) — logic hiển thị nằm ở từng Step* component.
 */
export default function CustomStudio() {
  const { t } = useTranslation();
  const s = useCustomStudioStore();
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const generate = useGenerate3D();
  const { data: task, error: taskError } = useGenTask(s.taskId);
  const retry = useRetryGenTask();
  const cancel = useCancelGenTask();
  const createDesign = useCreateDesign();
  const updateDesign = useUpdateDesign();

  // Slug cần fetch model đầy đủ (có editableOptions cho bước 5): vừa generate xong HOẶC đang resume
  // sau khi rời trang/reload (task đã succeeded từ trước, hoặc đã chọn mẫu nhưng chưa kịp lưu model).
  const resumeSlug = s.model ? null : (task?.status === 'succeeded' ? task.modelSlug : s.source === 'template' ? s.selectedTemplateSlug : null);
  const { data: resumedModel } = useModel3d(resumeSlug);

  useEffect(() => {
    if (resumedModel && s.model?.slug !== resumedModel.slug) s.setGeneratedModel(resumedModel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumedModel]);

  // Tạo task generate — CHỈ gọi từ đây (1 chỗ duy nhất), chặn double-click/double-submit bằng
  // isPending + đã có taskId thì không tạo thêm (tránh sinh nhiều task cho cùng 1 lần bấm).
  const handleStartGenerate = () => {
    if (generate.isPending || s.taskId) return;
    generate.mutate(
      { image: s.imageFile, removeBackground: s.removeBackground },
      { onSuccess: (res) => s.startTask(res.taskId) }
    );
  };

  const handleRetry = () => retry.mutate(s.taskId);
  const handleCancel = () => cancel.mutate(s.taskId);
  const handleChangeImage = () => { s.clearTask(); s.goToStep(2); };

  const handleSave = async () => {
    setSaveError(null);
    let id = s.designId;
    let version = s.designVersion;
    try {
      if (!id) {
        const created = await createDesign.mutateAsync({
          name: s.designName, modelId: s.model.id, configuration: s.configuration, thumbnailUrl: s.model.posterUrl,
        });
        id = created.id;
        version = created.version;
        s.setDesignMeta({ id, version });
      }
      const updated = await updateDesign.mutateAsync({
        id, name: s.designName, configuration: s.configuration, thumbnailUrl: s.model.posterUrl, status: 'completed', version,
      });
      s.setDesignMeta({ id: updated.id, version: updated.version });
      setSaved(true);
    } catch (err) {
      // 409 (version lệch, vd đã lưu ở tab khác) — tải lại version mới nhất để user bấm Lưu lại
      if (err?.response?.status === 409 && id) {
        try {
          const fresh = await api.getDesignDetail(id);
          s.setDesignMeta({ id: fresh.id, version: fresh.version });
        } catch { /* giữ nguyên lỗi gốc nếu tải lại cũng fail */ }
      }
      setSaveError(err);
    }
  };

  const handleStartNew = () => {
    setSaved(false);
    setSaveError(null);
    s.reset();
  };

  /*
   * Sau F5/quay lại trang ở bước ≥4, `model` (object đầy đủ) KHÔNG persist — chỉ vài con trỏ nhỏ
   * (taskId/selectedTemplateSlug) persist để tự refetch (xem customStudioStore.js). Phân biệt 2
   * trường hợp: CÒN con trỏ để khôi phục → coi là đang tải (spinner); KHÔNG còn gì để khôi phục
   * (localStorage bị xoá/hỏng) → mới báo lỗi thật + cho bắt đầu lại.
   */
  const hasModelForStep = s.step < 4 || !!s.model;
  const canResume = !!s.taskId || !!s.selectedTemplateSlug;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link to="/custom" className="text-sm text-base-content/55 hover:text-primary">← {t('nav.custom')}</Link>
          <h1 className="mt-1 font-display text-3xl">{t('custom.studio.title')}</h1>
        </div>
        <StepIndicator step={s.step} source={s.source} />
      </div>

      {!hasModelForStep && canResume ? (
        <div className="flex items-center justify-center p-10">
          <span className="loading loading-spinner loading-lg text-primary" />
        </div>
      ) : !hasModelForStep ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-base-300 p-10 text-center">
          <p className="text-base-content/60">{t('custom.studio.resumeError')}</p>
          <button onClick={handleStartNew} className="btn btn-primary btn-sm">{t('custom.studio.step6.newDesign')}</button>
        </div>
      ) : (
        <>
          {s.step === 1 && <Step1Source />}

          {s.step === 2 && <Step2Prepare onNext={handleStartGenerate} onBack={() => s.goToStep(1)} pending={generate.isPending} />}

          {s.step === 3 && (
            <Step3Generate
              task={task}
              taskError={generate.isError ? generate.error : taskError}
              onRetry={handleRetry}
              onCancel={handleCancel}
              onChangeImage={handleChangeImage}
              retryPending={retry.isPending}
              cancelPending={cancel.isPending}
              imagePreviewUrl={s.imagePreviewUrl}
            />
          )}

          {s.step === 4 && <Step4Result model={s.model} onNext={() => s.goToStep(5)} onBack={() => s.goToStep(1)} />}

          {s.step === 5 && (
            <Step5Edit
              model={s.model}
              configuration={s.configuration}
              onChange={s.setConfiguration}
              onNext={() => s.goToStep(6)}
              onBack={() => s.goToStep(4)}
            />
          )}

          {s.step === 6 && (
            <Step6Save
              designName={s.designName}
              onNameChange={s.setDesignName}
              onSave={handleSave}
              saving={createDesign.isPending || updateDesign.isPending}
              saveError={saveError}
              saved={saved}
              onBack={() => s.goToStep(5)}
              onStartNew={handleStartNew}
            />
          )}
        </>
      )}
    </div>
  );
}
