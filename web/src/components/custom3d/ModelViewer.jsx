import { useEffect, useRef, useState } from 'react';

/*
 * Bọc web component <model-viewer> của Google.
 * - import('@google/model-viewer') động trong useEffect → three.js + model-viewer chỉ tải khi
 *   component này mount (trang viewer), không dính vào bundle các trang khác.
 * - color (hex) → tint baseColorFactor mọi material để giả lập đổi vật liệu/màu (mesh Meshy
 *   không parametric nên đây là cách runtime hợp lý nhất).
 * - scale → transform CSS, CHỈ để xem trước (AR dùng kích thước thật của model).
 */
const hexToLinear = (hex) => {
  const v = hex.replace('#', '');
  const n = parseInt(v.length === 3 ? v.split('').map((c) => c + c).join('') : v, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1];
};

export default function ModelViewer({ src, poster, alt = '', color, scale = 1, iosSrc, className = '', showControls = false, onError }) {
  const ref = useRef(null);
  const wrapRef = useRef(null);
  const [ready, setReady] = useState(() => !!window.customElements?.get('model-viewer'));
  const [fullscreen, setFullscreen] = useState(false);

  // Nạp định nghĩa web component 1 lần
  useEffect(() => {
    if (ready) return;
    let alive = true;
    import('@google/model-viewer').then(() => alive && setReady(true));
    return () => { alive = false; };
  }, [ready]);

  // Tint vật liệu theo color đang chọn (chờ model 'load' xong mới áp được)
  useEffect(() => {
    const el = ref.current;
    if (!el || !ready) return;
    const apply = () => {
      const factor = color ? hexToLinear(color) : [1, 1, 1, 1];
      try {
        el.model?.materials?.forEach((m) => m.pbrMetallicRoughness?.setBaseColorFactor(factor));
      } catch { /* model chưa sẵn sàng — sẽ áp lại ở lần load sau */ }
    };
    if (el.model) apply();
    el.addEventListener('load', apply);
    return () => el.removeEventListener('load', apply);
  }, [color, ready, src]);

  // Báo lỗi khi model KHÔNG tải được (src sai/GLB hỏng) — model-viewer bắn sự kiện 'error'
  useEffect(() => {
    const el = ref.current;
    if (!el || !ready || !onError) return;
    const handle = (e) => onError(e);
    el.addEventListener('error', handle);
    return () => el.removeEventListener('error', handle);
  }, [ready, src, onError]);

  // Theo dõi trạng thái fullscreen thật (user có thể thoát bằng phím Esc, không chỉ bằng nút)
  useEffect(() => {
    const handle = () => setFullscreen(document.fullscreenElement === wrapRef.current);
    document.addEventListener('fullscreenchange', handle);
    return () => document.removeEventListener('fullscreenchange', handle);
  }, []);

  const resetCamera = () => {
    const el = ref.current;
    if (!el) return;
    el.cameraOrbit = 'auto auto auto';
    el.fieldOfView = 'auto';
    el.jumpCameraToGoal?.();
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else wrapRef.current?.requestFullscreen?.();
  };

  if (!ready) {
    return (
      <div className={`grid h-full w-full place-items-center ${className}`}>
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  return (
    <div ref={wrapRef} className={`relative h-full w-full ${fullscreen ? 'bg-base-100' : ''}`}>
      <model-viewer
        ref={ref}
        src={src}
        poster={poster}
        alt={alt}
        camera-controls=""
        auto-rotate=""
        ar=""
        ar-modes="webxr scene-viewer quick-look"
        ios-src={iosSrc || undefined}
        shadow-intensity="1"
        exposure="1.05"
        environment-image="neutral"
        className={className}
        style={{ width: '100%', height: '100%', transform: `scale(${scale})`, transformOrigin: 'center', backgroundColor: 'transparent' }}
      />

      {showControls && (
        <div className="absolute bottom-3 right-3 flex gap-2">
          <button
            type="button"
            onClick={resetCamera}
            aria-label="Đặt lại góc nhìn"
            title="Đặt lại góc nhìn"
            className="grid h-9 w-9 place-items-center rounded-full bg-base-100/90 text-base-content/70 shadow-sm backdrop-blur-sm transition hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 12a9 9 0 1 1 2.64 6.36M3 12v6h6" />
            </svg>
          </button>
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={fullscreen ? 'Thoát toàn màn hình' : 'Xem toàn màn hình'}
            title={fullscreen ? 'Thoát toàn màn hình' : 'Xem toàn màn hình'}
            className="grid h-9 w-9 place-items-center rounded-full bg-base-100/90 text-base-content/70 shadow-sm backdrop-blur-sm transition hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
          >
            {fullscreen ? (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 3v4a1 1 0 0 1-1 1H4M15 3v4a1 1 0 0 0 1 1h4M9 21v-4a1 1 0 0 0-1-1H4M15 21v-4a1 1 0 0 1 1-1h4" />
              </svg>
            ) : (
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3H4v4M16 3h4v4M8 21H4v-4M16 21h4v-4" />
              </svg>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
