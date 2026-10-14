import { Platform, Linking } from 'react-native';
import * as IntentLauncher from 'expo-intent-launcher';

/*
 * Mở AR bằng Scene Viewer của Google (ARCore). Scene Viewer tự lo toàn bộ trải nghiệm AR: xin quyền camera, quét sàn,
 * đặt vật thể, xoay/phóng, chụp ảnh. App chỉ truyền đường dẫn file GLB — không cần tự lập trình AR (và ổn định hơn).
 *
 * Trả về: 'launched' | 'unsupported' (thiết bị/ứng dụng Google không hỗ trợ AR) | 'no-model'.
 * Lưu ý: Scene Viewer hiển thị file GLB gốc; màu/kích thước đã tuỳ chỉnh ở trình xem 3D KHÔNG mang sang AR.
 */
export async function openAR({ glbUrl, title }) {
  if (!glbUrl) return 'no-model';
  const url =
    `https://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(glbUrl)}` +
    `&mode=ar_preferred&resizable=true&title=${encodeURIComponent(title || 'WoodHub')}`;
  try {
    if (Platform.OS === 'android') {
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        data: url,
        packageName: 'com.google.android.googlequicksearchbox',
        flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
      });
      return 'launched';
    }
    await Linking.openURL(url);
    return 'launched';
  } catch {
    return 'unsupported';
  }
}
