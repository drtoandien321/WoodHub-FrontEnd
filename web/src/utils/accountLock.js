/*
 * accountLock — chuyển thông báo "tài khoản bị khoá" từ interceptor (api/client.js) sang trang Đăng nhập.
 *
 * Interceptor không render được UI (không có toast toàn cục), lại phải TẢI LẠI trang để xoá sạch state của tài
 * khoản (giống useLogout). Nên lưu lý do vào sessionStorage trước khi chuyển trang, trang /login đọc 1 lần rồi xoá.
 * sessionStorage (không phải localStorage): chỉ sống trong tab đó, đóng tab là mất — không hiện lại vô cớ hôm sau.
 */
const KEY = 'woodhub:account-locked';

export const isUserLocked = (err) => err?.response?.status === 403 && err.response.data?.errorCode === 'USER_LOCKED';

export function markAccountLocked(reason) {
  try { sessionStorage.setItem(KEY, JSON.stringify({ reason: reason ?? null })); } catch { /* chặn storage → bỏ qua */ }
}

/*
 * Đọc KHÔNG xoá (gọi trong useState initializer — StrictMode gọi initializer 2 lần, xoá ngay thì lần 2 mất),
 * trang Login tự gọi clearAccountLockedNotice() trong useEffect.
 */
export function readAccountLockedNotice() {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearAccountLockedNotice() {
  try { sessionStorage.removeItem(KEY); } catch { /* bỏ qua */ }
}
