/*
 * ai3dErrorKey — map mã lỗi HTTP của luồng sinh 3D AI (POST /custom/ai/generate,
 * GET/POST /custom/ai/tasks/*) sang key i18n (custom.ai.errors.*). Dùng chung cho mọi nơi gọi
 * generate3D/retryGenTask/cancelGenTask để không lặp lại bảng mã lỗi 400/401/403/409/413/429/502.
 */
export const ai3dErrorKey = (error) => {
  const status = error?.response?.status;
  switch (status) {
    case 400: return 'custom.ai.errors.invalidImage';
    case 401: return 'custom.ai.errors.unauthorized';
    case 403: return 'custom.ai.errors.forbidden';
    case 409: return 'custom.ai.errors.conflict';
    case 413: return 'custom.ai.errors.tooLarge';
    case 429: return 'custom.ai.errors.quotaExceeded';
    case 502: return 'custom.ai.errors.providerError';
    default: return status >= 500 ? 'custom.ai.errors.serverError' : 'custom.ai.errors.generic';
  }
};
