import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useCustomStudioStore } from '../stores/customStudioStore.js';
import { normalizeOptions } from '../utils/modelOptions.js';
import { useGenerate3D, useGenerate3DFromText, useRefineGenTask, useGenTask, useRetryGenTask, useCancelGenTask, useModel3d } from '../hooks/useModels3d.js';
import { useCreateDesign, useUpdateDesign } from '../hooks/useCustomDesigns.js';
import { api } from '../api/client.js';
import StepIndicator from '../components/custom-studio/StepIndicator.jsx';
import Step1Source from '../components/custom-studio/Step1Source.jsx';
import Step2Prepare from '../components/custom-studio/Step2Prepare.jsx';
import Step2TextPrompt from '../components/custom-studio/Step2TextPrompt.jsx';
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
  const location = useLocation();
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState(null);

  /*
   * Wizard persist vào localStorage (step/taskId/selectedTemplateSlug...) để resume sau F5. Nhưng nếu
   * mở /custom/studio từ nút "Thiết kế" thông thường mà còn tiến trình cũ, các hook resume bên dưới
   * (useGenTask/useModel3d → setGeneratedModel ép step = 4) sẽ nhảy thẳng sang bước 4 dù user chưa làm
   * bước 1. Vì vậy quyết định "tiếp tục hay bắt đầu mới" TRƯỚC khi cho các hook đó chạy:
   *   - state.fresh  (nút "Thiết kế mới")        → reset ngay, bắt đầu từ bước 1
   *   - state.keep   (chọn mẫu từ thư viện)      → giữ nguyên, đúng ý user vừa chọn
   *   - không có cờ + có tiến trình dở           → hỏi user (hiện thẻ "Tiếp tục / Bắt đầu mới")
   *   - không có tiến trình                      → vào bước 1 như bình thường
   * Quyết định khởi tạo 1 lần khi mount (useState lazy) — không đổi khi store thay đổi sau đó.
   */
  const hasProgress = s.step > 1 || !!s.taskId || !!s.selectedTemplateSlug;
  const [decision, setDecision] = useState(() => {
    if (location.state?.fresh) return 'new';
    if (location.state?.keep || !hasProgress) return 'continue';
    return 'ask';
  });
  useEffect(() => {
    if (decision === 'new') s.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const resumeAllowed = decision === 'continue';

  const generateImage = useGenerate3D();
  const generateText = useGenerate3DFromText();
  // Nguồn 'text' gọi endpoint khác nhưng cùng kết quả { taskId } → các bước sau dùng chung 1 biến generate
  const isText = s.source === 'text';
  const generate = isText ? generateText : generateImage;
  const refine = useRefineGenTask();

  /*
   * Tên gợi ý cho model AI (BE luôn đặt "Model AI (Meshy)"): text→3D lấy đầu mô tả; ảnh→3D lấy loại sản phẩm + ngày.
   * Chỉ dùng khi model đang mang tên mặc định — khách đã đổi tên thì giữ nguyên tên của khách.
   */
  const isDefaultName = !s.model?.name || /^Model AI/i.test(s.model.name);
  const suggestedModelName = !isDefaultName ? s.model?.name
    : isText ? s.textInput.prompt.trim().slice(0, 60)
    : `${s.productType ? t(`custom.studio.productTypes.${s.productType}`) : t('custom.studio.step4.defaultModelName')} ${new Date().toLocaleDateString('vi-VN')}`;
  const { data: task, error: taskError } = useGenTask(resumeAllowed ? s.taskId : null);
  const retry = useRetryGenTask();
  const cancel = useCancelGenTask();
  const createDesign = useCreateDesign();
  const updateDesign = useUpdateDesign();

  // Slug cần fetch model đầy đủ (có editableOptions cho bước 5): vừa generate xong HOẶC đang resume
  // sau khi rời trang/reload (task đã succeeded từ trước, hoặc đã chọn mẫu nhưng chưa kịp lưu model).
  const resumeSlug = !resumeAllowed || s.model ? null : (task?.status === 'succeeded' ? task.modelSlug : s.source === 'template' ? s.selectedTemplateSlug : null);
  const { data: resumedModel } = useModel3d(resumeSlug);

  useEffect(() => {
    if (resumedModel && s.model?.slug !== resumedModel.slug) s.setGeneratedModel(resumedModel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resumedModel]);

  // Tạo task generate — CHỈ gọi từ đây (1 chỗ duy nhất), chặn double-click/double-submit bằng
  // isPending + đã có taskId thì không tạo thêm (tránh sinh nhiều task cho cùng 1 lần bấm).
  const handleStartGenerate = () => {
    if (generate.isPending || s.taskId) return;
    const body = isText
      ? {
          prompt: s.textInput.prompt.trim(),
          artStyle: s.textInput.artStyle,
          // negativePrompt tuỳ chọn — gửi undefined thay vì chuỗi rỗng để BE không lưu ''
          negativePrompt: s.textInput.negativePrompt.trim() || undefined,
        }
      : { image: s.imageFile, removeBackground: s.removeBackground };
    // onError → sang bước 3 để hiện màn lỗi (vd 429 hết lượt có nút mua thêm); ở lại bước 2 thì lỗi bị nuốt im lặng
    generate.mutate(body, { onSuccess: (res) => s.startTask(res.taskId), onError: () => s.goToStep(3) });
  };

  const handleRetry = () => retry.mutate(s.taskId);
  const handleCancel = () => cancel.mutate(s.taskId);
  const handleChangeImage = () => { s.clearTask(); generate.reset(); s.goToStep(2); };

  // Refine: hook đã ghi task 'processing' vào cache + xoá cache model cũ → startRefine về bước 3 poll tiếp;
  // succeeded lần 2 thì resumeSlug (cùng slug) tải lại model ĐÃ có texture và tự sang bước 4.
  const handleRefine = () => {
    if (refine.isPending || !s.taskId) return;
    refine.mutate({ taskId: s.taskId, modelSlug: s.model?.slug }, { onSuccess: () => s.startRefine() });
  };

  /*
   * Cấu hình gửi BE: bỏ key rỗng (null / undefined). BE kiểm tra MỌI key có trong configuration phải nằm trong
   * editableOptions của model → gửi material: null / color: null là 400 DESIGN_INVALID_OPTION; không gửi key thì BE bỏ qua.
   */
  // + bỏ dimensions khi mẫu KHÔNG khai báo kích thước (tiến trình lưu từ bản cũ còn số đo FE tự bịa → không gửi cho xưởng)
  const cleanConfiguration = (c) => Object.fromEntries(Object.entries(c ?? {}).filter(([k, v]) =>
    v != null && v !== '' && (k !== 'dimensions' || !!normalizeOptions(s.model).dimensions)));

  const handleSave = async () => {
    setSaveError(null);
    let id = s.designId;
    let version = s.designVersion;
    try {
      if (!id) {
        const created = await createDesign.mutateAsync({
          name: s.designName, modelId: s.model.id, configuration: cleanConfiguration(s.configuration), thumbnailUrl: s.model.posterUrl,
        });
        id = created.id;
        version = created.version;
        s.setDesignMeta({ id, version });
      }
      const updated = await updateDesign.mutateAsync({
        id, name: s.designName, configuration: cleanConfiguration(s.configuration), thumbnailUrl: s.model.posterUrl, status: 'completed', version,
      });
      s.setDesignMeta({ id: updated.id, version: updated.version });
      // Model AI (từ ảnh) đã TỰ LƯU khi gen xong với tên mặc định "Model AI" — đặt tên theo thiết kế để dễ tìm trong
      // "Model 3D của tôi". Không chặn luồng nếu lỗi (thiết kế đã lưu xong).
      if ((s.source === 'upload' || isText) && s.model?.id && s.designName.trim()) {
        api.renameModel({ id: s.model.id, name: s.designName.trim().slice(0, 255) }).catch(() => {});
      }
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

  // 'new' vừa reset xong (effect trên) → chuyển sang 'continue' để wizard chạy bình thường từ bước 1
  useEffect(() => {
    if (decision === 'new') setDecision('continue');
  }, [decision]);

  if (decision === 'ask') {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-2xl border border-base-300 bg-base-100 p-8 text-center shadow-sm">
        <h1 className="font-display text-2xl">{t('custom.studio.resume.title')}</h1>
        <p className="text-sm text-base-content/70">
          {t('custom.studio.resume.desc', { step: s.step, label: t(`custom.studio.stepLabels.${s.step}`) })}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button onClick={() => setDecision('continue')} className="btn btn-primary btn-sm">{t('custom.studio.resume.continue')}</button>
          <button onClick={() => { s.reset(); setDecision('continue'); }} className="btn btn-outline btn-sm">{t('custom.studio.resume.startNew')}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link to="/custom" className="text-sm text-base-content/70 hover:text-primary">← {t('nav.custom')}</Link>
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
          <p className="text-base-content/70">{t('custom.studio.resumeError')}</p>
          <button onClick={handleStartNew} className="btn btn-primary btn-sm">{t('custom.studio.step6.newDesign')}</button>
        </div>
      ) : (
        <>
          {s.step === 1 && <Step1Source />}

          {s.step === 2 && (isText
            ? <Step2TextPrompt onNext={handleStartGenerate} onBack={() => s.goToStep(1)} pending={generate.isPending} />
            : <Step2Prepare onNext={handleStartGenerate} onBack={() => s.goToStep(1)} pending={generate.isPending} />)}

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
              prompt={isText ? (task?.prompt || s.textInput.prompt) : null}
            />
          )}

          {s.step === 4 && (
            <Step4Result
              model={s.model}
              onNext={() => s.goToStep(5)}
              onBack={() => s.goToStep(1)}
              canRefine={isText && !!task?.canRefine}
              refined={isText && !!task?.refined}
              onRefine={handleRefine}
              refinePending={refine.isPending}
              refineError={refine.error}
              suggestedName={suggestedModelName}
              // Giữ tên mới trong store để bước 6 / lần render sau không hiện lại tên mặc định
              onRenamed={(name) => useCustomStudioStore.setState({ model: { ...s.model, name } })}
            />
          )}

          {s.step === 5 && (
            <Step5Edit
              model={s.model}
              configuration={s.configuration}
              onChange={s.setConfiguration}
              onNext={() => s.goToStep(6)}
              onBack={() => s.goToStep(4)}
              // Áp dụng chất liệu AI (BE-05) → thay model bằng biến thể; lưu thiết kế sẽ dùng biến thể này
              onModelChange={(m) => useCustomStudioStore.setState({ model: m })}
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
