// Định dạng dùng chung. Tự viết (không dùng Intl) để chắc chắn đúng trên mọi bản Hermes/Android.
export const formatVnd = (n) => {
  const v = Math.round(Number(n) || 0);
  return `${v.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.')} ₫`;
};

const p2 = (n) => String(n).padStart(2, '0');

// ISO datetime → "dd/MM/yyyy"
export const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()}`;
};

// ISO datetime → "HH:mm dd/MM/yyyy"
export const formatDateTime = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${p2(d.getHours())}:${p2(d.getMinutes())} ${formatDate(iso)}`;
};

export const formatKm = (km) => (km == null ? '' : `${String(Math.round(km * 10) / 10).replace('.', ',')} km`);
