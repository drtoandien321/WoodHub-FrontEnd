import { useLocationStore } from '../stores/locationStore.js';

/*
 * requestLocationOnce — xin quyền vị trí trình duyệt 1 lần, gọi ngay sau khi CUSTOMER đăng nhập
 * thành công (Login.jsx/VerifyOtp.jsx/GoogleAuthButton.jsx — chỉ 3 chỗ đó, không gọi cho
 * supplier/admin vì tính năng gợi ý gần chỉ phục vụ khách mua hàng).
 *
 * ⚠️ KHÔNG bao giờ tự gọi lại nếu trạng thái đã lưu là 'denied' — trình duyệt cũng chặn hỏi lại
 * bằng code (`getCurrentPosition` sẽ lập tức trả lỗi PERMISSION_DENIED không hiện popup), nhưng
 * tự mình cũng nên tôn trọng thay vì cứ gọi lại vô ích.
 *
 * Không throw, không return Promise cho nơi gọi phải await — cố ý "bắn rồi quên" (fire-and-forget)
 * để KHÔNG chặn navigate() sau login (native permission popup của trình duyệt không chặn JS chạy
 * tiếp, chỉ chặn tương tác chuột vào trang — app vẫn điều hướng bình thường trong lúc chờ).
 */
export function requestLocationOnce() {
  const { permission, setCoords, setPermission } = useLocationStore.getState();

  if (!navigator.geolocation) {
    setPermission('unsupported');
    return;
  }
  if (permission === 'denied') return; // tôn trọng lựa chọn trước đó, không tự hỏi lại

  // Đồng bộ trạng thái quyền THẬT từ trình duyệt trước nếu có Permissions API (Chrome/Firefox —
  // Safari không hỗ trợ query cho 'geolocation' nên bọc try/catch, thất bại thì cứ gọi thẳng
  // getCurrentPosition, trình duyệt tự lo phần hỏi/không hỏi).
  const tryGetPosition = () => {
    navigator.geolocation.getCurrentPosition(
      (pos) => setCoords(pos.coords.latitude, pos.coords.longitude),
      (error) => setPermission(error.code === error.PERMISSION_DENIED ? 'denied' : 'error'),
      { timeout: 10_000 }
    );
  };

  if (navigator.permissions?.query) {
    navigator.permissions
      .query({ name: 'geolocation' })
      .then((status) => {
        if (status.state === 'denied') setPermission('denied');
        else tryGetPosition();
      })
      .catch(tryGetPosition);
  } else {
    tryGetPosition();
  }
}
