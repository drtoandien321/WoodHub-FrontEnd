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

export default function ModelViewer({ src, poster, alt = '', color, scale = 1, iosSrc, className = '' }) {
  const ref = useRef(null);
  const [ready, setReady] = useState(() => !!window.customElements?.get('model-viewer'));

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

  if (!ready) {
    return (
      <div className={`grid h-full w-full place-items-center ${className}`}>
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    );
  }

  return (
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
  );
}
