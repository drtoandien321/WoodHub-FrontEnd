import React, { forwardRef, useImperativeHandle, useMemo, useRef } from 'react';
import { View, Platform } from 'react-native';
import { WebView } from 'react-native-webview';

/*
 * Model3D — xem mô hình GLB bằng <model-viewer> (Google) chạy trong WebView: xoay 1 ngón, chụm để phóng, đổ bóng.
 * Cùng thư viện với web nên kết quả giống nhau. Cần mạng để tải thư viện + file GLB.
 *
 * Giao tiếp:
 *  - Vào  : ref.setColor(hex) · ref.setScale(sx, sy, sz) · ref.resetView()
 *  - Ra   : onProgress(0..1) · onLoaded() · onError(msg)  (qua postMessage)
 * Trên web (chỉ để xem trước giao diện bằng trình duyệt) render <iframe> thay cho WebView.
 */
const MV = 'https://unpkg.com/@google/model-viewer@4.0.0/dist/model-viewer.min.js';

const buildHtml = ({ src, poster, autoRotate, bg }) => `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<script type="module" src="${MV}"></script>
<style>html,body{margin:0;height:100%;background:${bg};overflow:hidden}
model-viewer{width:100%;height:100%;background:transparent;--poster-color:transparent;outline:none}
#err{position:absolute;inset:0;display:none;align-items:center;justify-content:center;font:14px sans-serif;color:#6B5D4F;text-align:center;padding:24px}</style>
</head><body>
<model-viewer id="mv" src="${src}" ${poster ? `poster="${poster}"` : ''} camera-controls touch-action="pan-y"
 ${autoRotate ? 'auto-rotate' : ''} shadow-intensity="1.1" shadow-softness="1" exposure="1.05" interaction-prompt="none"
 camera-orbit="-32deg 75deg auto" min-field-of-view="10deg"></model-viewer>
<div id="err">Không tải được mô hình 3D.<br>Kiểm tra kết nối mạng.</div>
<script>
(function(){
  var mv=document.getElementById('mv'), tint=null;
  function post(o){ try{ (window.ReactNativeWebView||window.parent).postMessage(JSON.stringify(o),'*'); }catch(e){} }
  function hexToRgba(h){var n=parseInt(h.replace("#",""),16);return [((n>>16)&255)/255,((n>>8)&255)/255,(n&255)/255,1];}
  function applyTint(){ if(!tint||!mv.model) return;
    mv.model.materials.forEach(function(m){ m.pbrMetallicRoughness.setBaseColorFactor(typeof tint==="string"?hexToRgba(tint):tint); }); }
  mv.addEventListener('progress',function(e){ post({t:'progress',v:e.detail.totalProgress}); });
  mv.addEventListener('load',function(){ applyTint(); post({t:'loaded'}); });
  mv.addEventListener('error',function(){ document.getElementById('err').style.display='flex'; post({t:'error'}); });
  window.setColor=function(hex){ tint=hex||[1,1,1,1]; applyTint(); };
  window.setScale=function(x,y,z){ mv.scale=x+' '+y+' '+z; };
  window.resetView=function(){ mv.cameraOrbit='-32deg 75deg auto'; mv.fieldOfView='auto'; mv.jumpCameraToGoal&&mv.jumpCameraToGoal(); };
  window.addEventListener('message',function(ev){ try{ var d=JSON.parse(ev.data); if(d.fn&&window[d.fn]) window[d.fn].apply(null,d.args||[]); }catch(e){} });
})();
</script></body></html>`;

const Model3D = forwardRef(function Model3D({ src, poster, autoRotate = true, bg = 'transparent', onProgress, onLoaded, onError, style }, ref) {
  const web = useRef(null);
  const html = useMemo(() => buildHtml({ src, poster, autoRotate, bg }), [src, poster, autoRotate, bg]);

  const call = (fn, ...args) => {
    const js = `window.${fn} && window.${fn}.apply(null, ${JSON.stringify(args)}); true;`;
    if (Platform.OS === 'web') web.current?.contentWindow?.postMessage(JSON.stringify({ fn, args }), '*');
    else web.current?.injectJavaScript(js);
  };
  useImperativeHandle(ref, () => ({
    setColor: (hex) => call('setColor', hex),
    setScale: (x, y, z) => call('setScale', x, y, z),
    resetView: () => call('resetView'),
  }));

  const handle = (raw) => {
    try {
      const m = JSON.parse(typeof raw === 'string' ? raw : raw?.nativeEvent?.data);
      if (m.t === 'progress') onProgress?.(m.v);
      else if (m.t === 'loaded') onLoaded?.();
      else if (m.t === 'error') onError?.();
    } catch { /* tin nhắn không phải của mình */ }
  };

  if (Platform.OS === 'web') {
    // Xem trước trên trình duyệt (dev): iframe + lắng nghe message
    React.useEffect(() => {
      const fn = (e) => handle(e.data);
      window.addEventListener('message', fn);
      return () => window.removeEventListener('message', fn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    return <View style={style}>{React.createElement('iframe', { ref: web, srcDoc: html, style: { border: 0, width: '100%', height: '100%', background: 'transparent' } })}</View>;
  }

  return (
    <View style={style}>
      <WebView
        ref={web}
        originWhitelist={['*']}
        source={{ html, baseUrl: 'https://woodhub.local/' }}
        onMessage={handle}
        javaScriptEnabled
        allowsInlineMediaPlayback
        setSupportMultipleWindows={false}
        overScrollMode="never"
        style={{ backgroundColor: 'transparent' }}
        containerStyle={{ backgroundColor: 'transparent' }}
        onError={() => onError?.()}
      />
    </View>
  );
});

export default Model3D;
