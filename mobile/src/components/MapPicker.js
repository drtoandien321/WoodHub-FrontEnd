import React, { useEffect, useMemo, useRef } from 'react';
import { View, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { T } from './ui.js';
import { useTheme } from '../theme/theme.js';
import { GOONG_MAPTILES_KEY } from '../services/goong.js';

/*
 * MapPicker — bản đồ Goong để ĐẶT GHIM toạ độ giao hàng (port web StoreMapPicker). Chạy goong-js trong WebView (giống Model3D)
 * để không phải cài thư viện bản đồ native. Khách bấm lên bản đồ hoặc kéo ghim → onChange(latitude, longitude).
 * Toạ độ đổi từ ngoài (geocode xong) → app gửi setPin để bản đồ bay tới + đặt ghim (không gọi lại onChange, tránh vòng lặp).
 * ⚠️ goong-js dùng [lng, lat]; ra ngoài luôn là latitude/longitude như body BE.
 */
const GJS = 'https://unpkg.com/@goongmaps/goong-js@1.0.9/dist/goong-js.js';
const GCSS = 'https://unpkg.com/@goongmaps/goong-js@1.0.9/dist/goong-js.css';
const CENTER = [106.7009, 10.7769]; // TP.HCM

const buildHtml = (key, lat, lng) => `<!doctype html><html><head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no">
<link rel="stylesheet" href="${GCSS}"><script src="${GJS}"></script>
<style>html,body,#m{margin:0;height:100%;width:100%}</style></head><body><div id="m"></div>
<script>
(function(){
  function post(o){ try{ (window.ReactNativeWebView||window.parent).postMessage(JSON.stringify(o),'*'); }catch(e){} }
  goongjs.accessToken='${key}';
  var has=${lat != null && lng != null};
  var map=new goongjs.Map({container:'m',style:'https://tiles.goong.io/assets/goong_map_web.json?api_key=${key}',
    center:has?[${lng ?? 0},${lat ?? 0}]:${JSON.stringify(CENTER)},zoom:has?16:11});
  var marker=null;
  function place(la,ln){ if(marker){marker.setLngLat([ln,la]);return;}
    marker=new goongjs.Marker({draggable:true}).setLngLat([ln,la]).addTo(map);
    marker.on('dragend',function(){var p=marker.getLngLat();post({t:'pick',lat:p.lat,lng:p.lng});}); }
  if(has) place(${lat ?? 0},${lng ?? 0});
  map.on('click',function(e){ place(e.lngLat.lat,e.lngLat.lng); post({t:'pick',lat:e.lngLat.lat,lng:e.lngLat.lng}); });
  map.on('error',function(e){ post({t:'error',msg:String(e&&e.error&&e.error.status||'')}); });
  window.setPin=function(la,ln){ place(la,ln); map.flyTo({center:[ln,la],zoom:16}); };
  window.addEventListener('message',function(ev){ try{ var d=JSON.parse(ev.data); if(d.fn&&window[d.fn]) window[d.fn].apply(null,d.args||[]); }catch(e){} });
})();
</script></body></html>`;

export default function MapPicker({ latitude, longitude, onChange, onError, style }) {
  const { c } = useTheme();
  const web = useRef(null);
  const cb = useRef({});
  cb.current = { onChange, onError };
  // HTML chỉ dựng 1 lần (theo toạ độ ban đầu) — đổi sau đó đi qua setPin, không tải lại bản đồ
  const html = useMemo(() => (GOONG_MAPTILES_KEY ? buildHtml(GOONG_MAPTILES_KEY, latitude, longitude) : ''), []); // eslint-disable-line react-hooks/exhaustive-deps

  const call = (fn, ...args) => {
    if (Platform.OS === 'web') web.current?.contentWindow?.postMessage(JSON.stringify({ fn, args }), '*');
    else web.current?.injectJavaScript(`window.${fn} && window.${fn}.apply(null, ${JSON.stringify(args)}); true;`);
  };
  useEffect(() => { if (latitude != null && longitude != null) call('setPin', latitude, longitude); }, [latitude, longitude]); // eslint-disable-line react-hooks/exhaustive-deps

  const handle = (raw) => {
    try {
      const m = JSON.parse(typeof raw === 'string' ? raw : raw?.nativeEvent?.data);
      if (m.t === 'pick') cb.current.onChange?.(m.lat, m.lng);
      else if (m.t === 'error') cb.current.onError?.(m.msg);
    } catch { /* không phải tin của bản đồ */ }
  };
  useEffect(() => {
    if (Platform.OS !== 'web') return undefined;
    const fn = (e) => { if (e.source === web.current?.contentWindow) handle(e.data); };
    window.addEventListener('message', fn);
    return () => window.removeEventListener('message', fn);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const box = [{ height: 260, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: c.line, backgroundColor: c.surf2 }, style];
  if (!GOONG_MAPTILES_KEY) {
    return (
      <View style={[box, { alignItems: 'center', justifyContent: 'center', padding: 20 }]}>
        <T v="small" mute style={{ textAlign: 'center' }}>Chưa cấu hình key bản đồ Goong cho app (EXPO_PUBLIC_GOONG_MAPTILES_KEY).</T>
      </View>
    );
  }
  if (Platform.OS === 'web') {
    return <View style={box}>{React.createElement('iframe', { ref: web, srcDoc: html, style: { border: 0, width: '100%', height: '100%' } })}</View>;
  }
  return (
    <View style={box}>
      <WebView ref={web} originWhitelist={['*']} source={{ html }} onMessage={handle} javaScriptEnabled setSupportMultipleWindows={false} />
    </View>
  );
}
