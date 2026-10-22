import { useState } from 'react';

/*
 * Logo NCC / xưởng: có `src` (logoUrl — BE-10) thì hiện ảnh; chưa có ảnh hoặc ảnh lỗi → placeholder chữ cái đầu
 * của 2 từ cuối tên trên nền gradient gỗ — luôn hợp lệ.
 */
export default function LogoBadge({ name = '', src, className = '' }) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return <img src={src} alt={name} loading="lazy" onError={() => setFailed(true)} className={`bg-base-100 object-cover ${className}`} />;
  }

  const initials = name
    .trim()
    .split(/\s+/)
    .slice(-2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();

  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-[#cdb98f] to-[#7a5a3c] text-primary-content font-display select-none ${className}`}
    >
      {initials}
    </div>
  );
}
