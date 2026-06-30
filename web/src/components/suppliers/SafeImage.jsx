import { useState } from 'react';

/*
 * Ảnh có fallback: nếu src lỗi/thiếu → hiển thị nền gradient gỗ thay vì icon ảnh vỡ.
 * Dùng cho cover, portfolio, banner... để layout không bao giờ bị vỡ vì thiếu asset.
 */
export default function SafeImage({ src, alt = '', className = '' }) {
  const [failed, setFailed] = useState(false);
  if (failed || !src) {
    return <div className={`bg-gradient-to-br from-[#e7dcc6] to-[#bfa988] ${className}`} role="img" aria-label={alt} />;
  }
  return (
    <img src={src} alt={alt} loading="lazy" onError={() => setFailed(true)} className={`object-cover ${className}`} />
  );
}
