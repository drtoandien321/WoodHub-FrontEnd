/*
 * Logo/avatar placeholder cho xưởng khi chưa có ảnh logo thật.
 * Lấy chữ cái đầu của 2 từ cuối tên xưởng đặt trên nền gradient gỗ — luôn hợp lệ kể cả ảnh lỗi.
 */
export default function LogoBadge({ name = '', className = '' }) {
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
