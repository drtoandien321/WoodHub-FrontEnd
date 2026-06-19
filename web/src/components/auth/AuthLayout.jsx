import { Link } from 'react-router-dom';

// Ảnh nền nội thất gỗ cho trang auth (tái dùng ảnh interior có sẵn).
// Muốn đổi ảnh riêng: bỏ file vào public/ rồi sửa đường dẫn dưới đây.
const AUTH_BG = '/about/about-2.png';

/*
 * AuthLayout — layout RIÊNG cho /login, /register, /verify-otp:
 *  - Full màn hình, KHÔNG có Header/Navbar/Footer.
 *  - Desktop: trái là ảnh nội thất (~58%), phải là panel kính full-height (~42%).
 *  - Mobile: ảnh phủ toàn màn hình, panel kính nằm đè lên (1 cột).
 *  - Logo WOODHUB cố định góc trái trên, nằm trên ảnh.
 * Panel để khá ĐẶC (ít mờ) cho dễ đọc — chỉ blur nhẹ để vẫn cảm nhận ảnh phía sau.
 */
export default function AuthLayout({ children }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-base-200">
      {/* Ảnh nền: full màn hình ở mobile; ở desktop chữ nằm bên trái, panel che bên phải */}
      <img src={AUTH_BG} alt="" className="absolute inset-0 w-full h-full object-cover" />
      {/* Lớp tối nhẹ cho ảnh (để logo trắng + nền tổng thể sang hơn) */}
      <div className="absolute inset-0 bg-black/15" />

      {/* Logo thương hiệu — góc trái trên, trên nền ảnh */}
      <Link
        to="/"
        className="absolute top-8 left-8 md:top-10 md:left-14 z-20 font-display text-2xl md:text-3xl tracking-[0.18em] text-white drop-shadow-md"
      >
        WOODHUB
      </Link>

      {/* Panel kính bên phải (mobile: full width) */}
      <div className="absolute inset-y-0 right-0 w-full md:w-[42%] lg:w-[40%] z-10 flex items-center justify-center px-6 py-16 md:py-10
                      bg-base-100/85 backdrop-blur-md border-l border-white/30 shadow-[-8px_0_40px_rgba(0,0,0,0.12)]">
        <div className="w-full max-w-[460px]">{children}</div>
      </div>
    </div>
  );
}
