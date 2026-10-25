# WoodHub Mobile (Android)

App Expo (SDK 54 / React Native 0.81) cho khách hàng WoodHub: xem mô hình 3D, đặt thử vào phòng bằng **AR**, tự thiết kế
(chọn mẫu hoặc dựng 3D từ ảnh bằng AI), gửi yêu cầu báo giá cho xưởng, chat trợ lý AI, thanh toán gói bằng VietQR.
Gọi **cùng BE thật** với web (`docs/API_CONTRACT.md`), giao diện theo bản Claude Design "WoodHub App".

## Chạy thử nhanh (không cần Android Studio)

```bash
cd woodhub/mobile
npm install
npx expo start
```

Cài **Expo Go** trên điện thoại Android, quét mã QR. (AR + camera chạy được trong Expo Go vì AR dùng Scene Viewer của Google.)

Xem giao diện nhanh trên trình duyệt (không có AR/camera): `npm run web`.

## Build file APK để gửi nhóm (không lên Google Play)

Cách đơn giản nhất — dùng EAS (build trên cloud, miễn phí, cần tài khoản expo.dev):

```bash
npm i -g eas-cli
eas login
eas build -p android --profile preview
```

Khi xong EAS cho link tải file `.apk`; gửi link/file đó cho thành viên, bật "Cài từ nguồn không xác định" rồi cài.

## Cấu hình

| Mục | Giá trị |
|---|---|
| API | mặc định `https://woodhub-be.onrender.com/api`; đổi bằng biến `EXPO_PUBLIC_API_URL` (xem `src/config.js`) |
| Bản đồ Goong (sổ địa chỉ) | `EXPO_PUBLIC_GOONG_API_KEY` (geocode) + `EXPO_PUBLIC_GOONG_MAPTILES_KEY` (bản đồ) — **key riêng của app**, không dùng key web (key web giới hạn tên miền woodhub.io.vn → app bị 403). Đặt trong file `.env` cạnh `app.json` (không commit) hoặc biến môi trường EAS. Thiếu key: form địa chỉ báo rõ và cho lấy toạ độ bằng GPS tạm |
| Package | `vn.woodhub.app` (đổi trong `app.json`) |
| Quyền | camera (chụp ảnh dựng 3D), thư viện ảnh, vị trí (xưởng gần bạn), lưu ảnh (mã QR) |

Không có secret nào trong app; JWT lưu bằng `expo-secure-store`.

## Cấu trúc

```
App.js                      Theme → React Query → Toast → Navigation
src/theme/theme.js          token màu sáng/tối, font
src/components/             ui.js (Button, Card, BottomSheet…), Icon, Model3D (model-viewer trong WebView), Slider…
src/navigation/             tab bar tuỳ biến (nút Thiết kế ở giữa) + stack
src/screens/                Onboarding, Auth, Home, Shop, Product, Viewer, Ar, Design, Templates, Photo, Building,
                            Save, Quotes, QuoteDetail, Workshops, Chat, Profile, Plans
src/api/client.js           axios + JWT + refresh; toàn bộ endpoint
src/store/                  auth (zustand), studio (trạng thái thiết kế)
src/utils/                  giá ước tính, định dạng, logic hiển thị báo giá (copy từ web)
```

## Cách hoạt động của lõi AR/3D

- **Xem 3D**: `<model-viewer>` (Google) chạy trong WebView, tải file `.glb` từ BE. Đổi màu / kích thước áp trực tiếp lên mô hình.
- **AR**: mở **Scene Viewer** của Google (ARCore) bằng intent với file GLB. Google lo camera, quét sàn, đặt/xoay/phóng, chụp ảnh.
- **AI dựng 3D từ ảnh**: `POST /custom/ai/generate` → theo dõi `GET /custom/ai/tasks/{id}` mỗi 3 giây → mở Viewer khi xong.

## Hạn chế đã biết (cần nhóm biết)

1. **AR chỉ hiển thị mô hình gốc** — màu/kích thước chỉnh trong app chưa mang sang AR (giới hạn của Scene Viewer). Cần máy hỗ trợ ARCore + ứng dụng Google; máy không hỗ trợ sẽ thấy màn "Thiết bị chưa hỗ trợ AR".
2. **Sản phẩm ↔ mô hình 3D chưa được BE liên kết**: ở trang sản phẩm, app chọn mẫu 3D tham khảo theo loại (Sofa/Ghế/Bàn…) và ghi rõ "Mẫu 3D tham khảo". Khi BE thêm liên kết, chỉ cần sửa `guessModel` ở `ProductScreen.js`.
3. **Giá trong trình xem 3D là ước tính** (công thức theo chất liệu + thể tích, `utils/woods.js`); giá chính thức do xưởng báo.
4. **Đăng nhập Google tạm ẩn** (cờ `GOOGLE_ENABLED` trong `src/screens/AuthScreens.js`) — dùng email + OTP. Để bật: (1) tạo OAuth client **Android** (package + SHA-1 của keystore EAS) và **iOS** trên Google Cloud; (2) BE `GoogleTokenVerifier` nhận thêm các client ID đó làm audience (hiện chỉ nhận web client ID); (3) app lấy idToken bằng `expo-auth-session` hoặc `@react-native-google-signin/google-signin` (cần dev build, không chạy trong Expo Go) rồi gọi `POST /auth/google` như web.
5. Chưa có giỏ hàng/đặt mua (ngoài phạm vi bản này); luồng chính là thiết kế → báo giá.
6. Chưa test trên thiết bị thật trong môi trường dev này (đã kiểm tra bundle Android + chạy bản web). Cần test AR, camera, vị trí, thanh toán trên máy thật trước khi phát hành.
7. BE trên Render free có thể "ngủ": lần gọi đầu có thể chậm 30–60 giây (app đã đặt timeout 60 giây).
