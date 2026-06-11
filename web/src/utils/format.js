// Format tiền VND 1 chỗ duy nhất — tránh mỗi component tự .toLocaleString một kiểu
export const formatVnd = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);
