import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { api } from '../../api/client.js';
import { useAuthStore } from '../../stores/authStore.js';
import { redirectPathForRole } from '../../utils/auth.js';

const USE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

const GoogleGlyph = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
    <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
  </svg>
);

// Tải script Google Identity Services 1 lần
function loadGisScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const existing = document.getElementById('gis-script');
    if (existing) { existing.addEventListener('load', resolve); existing.addEventListener('error', reject); return; }
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.id = 'gis-script';
    s.async = true;
    s.defer = true;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

/*
 * Nút "Đăng nhập/Đăng ký bằng Google" dùng cho cả trang Login lẫn Register.
 * - Mock (hoặc chưa cấu hình VITE_GOOGLE_CLIENT_ID): nút tự vẽ, bấm chạy luồng demo qua mock adapter.
 * - Thật: dùng Google Identity Services lấy ID token → gọi POST /api/auth/google.
 *   (Cần khai báo http://localhost:5173 ở Authorized JavaScript origins trong Google Cloud Console.)
 */
export default function GoogleAuthButton({ mode = 'login' }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const btnRef = useRef(null);

  const useReal = !USE_MOCK && Boolean(CLIENT_ID);

  const handleToken = async (idToken) => {
    setError('');
    setLoading(true);
    try {
      const { token, user } = await api.loginWithGoogle({ idToken });
      setAuth({ token, user });
      navigate(redirectPathForRole(user.role, location.state?.from?.pathname), { replace: true });
    } catch {
      setError(t('auth.google.error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!useReal) return;
    let cancelled = false;
    loadGisScript()
      .then(() => {
        if (cancelled || !window.google?.accounts?.id) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (resp) => handleToken(resp.credential),
        });
        if (btnRef.current) {
          window.google.accounts.id.renderButton(btnRef.current, {
            theme: 'outline',
            size: 'large',
            width: 300,
            text: mode === 'register' ? 'signup_with' : 'signin_with',
          });
        }
      })
      .catch(() => setError(t('auth.google.error')));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useReal]);

  if (useReal) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div ref={btnRef} />
        {error && <p className="text-error text-sm">{error}</p>}
      </div>
    );
  }

  // Mock / chưa cấu hình: nút tự vẽ
  const label = mode === 'register' ? t('auth.google.register') : t('auth.google.login');
  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => handleToken('mock-google-token')}
        disabled={loading}
        className="w-full h-14 rounded-2xl bg-white border border-base-content/15 flex items-center justify-center gap-3 text-[#3c4043] font-medium shadow-sm hover:bg-white/90 hover:shadow transition-all disabled:opacity-60 cursor-pointer"
      >
        {loading ? <span className="loading loading-spinner loading-sm" /> : <GoogleGlyph />}
        {label}
      </button>
      {error && <p className="text-error text-sm">{error}</p>}
    </div>
  );
}
