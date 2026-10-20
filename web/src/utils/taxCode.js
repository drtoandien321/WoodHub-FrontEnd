/*
 * Mã số thuế Việt Nam: 10 chữ số (doanh nghiệp) hoặc 10 chữ số + "-" + 3 chữ số (chi nhánh / đơn vị phụ thuộc).
 * Dùng chung cho form Đăng ký doanh nghiệp và Hồ sơ doanh nghiệp — trước đây trang đăng ký không kiểm tra nên
 * production có hồ sơ MST "1234" (lỗi QA 21/10). BE chỉ giới hạn ≤20 ký tự, chưa kiểm định dạng.
 */
export const TAX_CODE_RE = /^\d{10}(-\d{3})?$/;

export const isValidTaxCode = (value) => TAX_CODE_RE.test(String(value ?? '').trim());
