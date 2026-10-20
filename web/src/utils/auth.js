/*
 * Trang đích sau khi đăng nhập, theo role — dùng chung cho Login, VerifyOtp, GoogleAuthButton
 * (trước đây bị lặp ở mỗi file). supplier/admin có khu vực riêng; customer quay lại trang
 * đã định vào trước khi bị ProtectedRoute chặn (fromPath), mặc định về trang chủ.
 */
export const redirectPathForRole = (role, fromPath, supplierType) => {
  // Supplier tách 2 portal theo subtype: workshop (xưởng mộc) vs manufacturer (nhà cung cấp).
  if (role === 'supplier') return supplierType === 'workshop' ? '/portal/workshop/dashboard' : '/portal/supplier/dashboard';
  if (role === 'admin') return '/admin';
  return isSafeCustomerPath(fromPath) ? fromPath : '/';
};

/*
 * Chỉ quay lại `fromPath` khi customer THỰC SỰ được vào trang đó. Khu vực portal/admin và các trang
 * xác thực bị loại — vd NCC vừa đăng xuất ở /portal/... thì `from` còn lưu đường dẫn portal, customer
 * đăng nhập kế tiếp không được bị đẩy vào đó (→ 403). Chỉ nhận đường dẫn nội bộ bắt đầu bằng '/'.
 */
const RESTRICTED_PREFIXES = ['/portal', '/admin', '/login', '/register', '/verify-otp', '/forgot-password', '/reset-password', '/change-password', '/403'];
const isSafeCustomerPath = (path) =>
  typeof path === 'string' && path.startsWith('/') && !path.startsWith('//') &&
  !RESTRICTED_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`));
