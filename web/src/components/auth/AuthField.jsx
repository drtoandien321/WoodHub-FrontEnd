import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EyeIcon, EyeOffIcon } from '../ui/icons.jsx';

/*
 * AuthField — ô input dùng chung cho form Login/Register: icon dẫn đầu + (tùy chọn) nút ẩn/hiện
 * mật khẩu. Gom 1 chỗ để 2 trang đồng nhất font/kiểu dáng.
 * Props: icon (component), type, password (bật toggle), ...các props input khác (value, onChange...).
 * Không có <label> nhìn thấy → aria-label mặc định = placeholder để trình đọc màn hình biết ô đang nhập gì
 * (placeholder biến mất khi gõ, không thay được label — QA BUG-010). Truyền aria-label riêng để ghi đè.
 */
export default function AuthField({ icon: Icon, type = 'text', password = false, className = '', ...props }) {
  const { t } = useTranslation();
  const [show, setShow] = useState(false);
  const inputType = password ? (show ? 'text' : 'password') : type;

  return (
    <div className="relative">
      {Icon && (
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-base-content/70 pointer-events-none">
          <Icon className="w-5 h-5" />
        </span>
      )}
      <input
        type={inputType}
        aria-label={props['aria-label'] ?? props.placeholder}
        className={`w-full h-14 rounded-2xl bg-base-100/70 border border-base-content/15 pl-12 ${password ? 'pr-12' : 'pr-4'} text-base-content placeholder:text-base-content/40 outline-none transition-colors focus:border-primary focus:bg-base-100 ${className}`}
        {...props}
      />
      {password && (
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? t('common.hidePassword') : t('common.showPassword')}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-base-content/70 hover:text-base-content/80 transition-colors cursor-pointer"
        >
          {show ? <EyeOffIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
        </button>
      )}
    </div>
  );
}
