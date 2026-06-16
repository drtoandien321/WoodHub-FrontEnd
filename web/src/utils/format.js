// Format tiền VND 1 chỗ duy nhất — tránh mỗi component tự .toLocaleString một kiểu
export const formatVnd = (n) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(n);

export const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date(dateString));
};
