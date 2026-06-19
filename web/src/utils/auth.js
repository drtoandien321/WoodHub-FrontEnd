/*
 * Trang đích sau khi đăng nhập, theo role — dùng chung cho Login, VerifyOtp, GoogleAuthButton
 * (trước đây bị lặp ở mỗi file). supplier/admin có khu vực riêng; customer quay lại trang
 * đã định vào trước khi bị ProtectedRoute chặn (fromPath), mặc định về trang chủ.
 */
export const redirectPathForRole = (role, fromPath) => {
  if (role === 'supplier') return '/portal';
  if (role === 'admin') return '/admin';
  return fromPath ?? '/';
};
